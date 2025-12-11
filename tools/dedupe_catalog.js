// Deduplica la colección 'catalog' en Firestore Emulator conservando un documento por clave estable
// Clave: CODIGO (preferente) -> CODIGO_SKU -> doc.id
// Uso: node tools/dedupe_catalog.js

const admin = require('firebase-admin');

// Conexión al emulador
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8085';
process.env.GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || 'begamshop-4b22b';

// Inicializar admin sin credenciales cuando se usa emulador
admin.initializeApp({ projectId: process.env.GOOGLE_CLOUD_PROJECT });
const db = admin.firestore();

async function dedupe() {
  console.log(`[Dedupe] Conectando a Firestore emulador en ${process.env.FIRESTORE_EMULATOR_HOST}`);
  const snap = await db.collection('catalog').get();
  console.log(`[Dedupe] Documentos encontrados: ${snap.size}`);
  const groups = new Map();

  snap.forEach(doc => {
    const data = doc.data() || {};
    const codigo = (data.CODIGO || data.codigo || '').toString().trim();
    const sku = (data.CODIGO_SKU || data.sku || '').toString().trim();
    const key = codigo || sku || doc.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ id: doc.id, codigo, sku, nombre: data.NOMBRE_PRODUCTO || data.nombre || '', precio: data.PRECIO || data.precio || data.price || 0 });
  });

  let toDelete = [];
  for (const [key, docs] of groups.entries()) {
    if (docs.length <= 1) continue;
    // Preferir: (1) doc.id === key, (2) el que tenga IMG1 definido, (3) el primero
    let keepIndex = docs.findIndex(d => d.id === key);
    if (keepIndex < 0) keepIndex = docs.findIndex(d => d.codigo);
    if (keepIndex < 0) keepIndex = 0;
    let keep = docs[keepIndex];
    const remove = docs.filter((_, i) => i !== keepIndex);

    // Merge de campos útiles desde duplicados hacia el que se conserva
    const keepRef = db.collection('catalog').doc(keep.id);
    const keepSnap = await keepRef.get();
    const base = keepSnap.exists ? keepSnap.data() : {};
    const merged = { ...base };
    const prefer = (destKey, values) => {
      for (const v of values) {
        if (v !== undefined && v !== null && String(v).trim() !== '') { merged[destKey] = v; return; }
      }
    };

    for (const r of remove) {
      const rSnap = await db.collection('catalog').doc(r.id).get();
      const data = rSnap.exists ? rSnap.data() : {};
      // Imágenes: completa si faltan
      merged.IMG1 = merged.IMG1 || data.IMG1 || data.img1;
      merged.IMG2 = merged.IMG2 || data.IMG2 || data.img2;
      merged.IMG3 = merged.IMG3 || data.IMG3 || data.img3;
      // Precio: si es 0 o no numérico, tomar del duplicado
      const srcPrecio = parseFloat(String(data.PRECIO ?? data.precio ?? data.price ?? '').replace(/,/g, '.'));
      const curPrecio = parseFloat(String(merged.PRECIO ?? merged.precio ?? merged.price ?? '').replace(/,/g, '.'));
      if ((!isFinite(curPrecio) || curPrecio <= 0) && isFinite(srcPrecio) && srcPrecio > 0) {
        merged.PRECIO = srcPrecio;
      }
      // Nombre/Descripción si faltan
      prefer('NOMBRE_PRODUCTO', [merged.NOMBRE_PRODUCTO, data.NOMBRE_PRODUCTO, data.nombre]);
      prefer('DESCRIPCION', [merged.DESCRIPCION, data.DESCRIPCION, data.descripcionCompleta, data.descripcion]);
      // Claves
      prefer('CODIGO', [merged.CODIGO, data.CODIGO, data.codigo]);
      prefer('CODIGO_SKU', [merged.CODIGO_SKU, data.CODIGO_SKU, data.sku]);
    }

    // Escribir merge antes de eliminar duplicados
    await keepRef.set(merged, { merge: true });
    console.log(`[Dedupe] Clave=${key} mantener=${keep.id} eliminar=${remove.map(d => d.id).join(', ')}`);
    toDelete.push(...remove.map(d => d.id));
  }

  // Eliminar duplicados
  for (const id of toDelete) {
    await db.collection('catalog').doc(id).delete();
    console.log(`✂️  Eliminado duplicado: ${id}`);
  }

  console.log(`[Dedupe] Completado. Eliminados: ${toDelete.length}`);
}

dedupe().catch(err => {
  console.error('[Dedupe] Error:', err);
  process.exit(1);
});
