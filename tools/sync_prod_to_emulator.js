// Clona la colección 'catalog' desde Firestore PROD al Emulador
// Requisitos:
// - Archivo serviceAccountKey.json válido para el proyecto PROD en la raíz del workspace
// - Emulador de Firestore corriendo (host:port configurable)
// Uso:
//   node tools/sync_prod_to_emulator.js
//   EMU_HOST=localhost:8085 node tools/sync_prod_to_emulator.js

const admin = require('firebase-admin');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const EMU_HOST = process.env.EMU_HOST || 'emulators:8085';
  const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'begamshop-4b22b';

  // 1) Inicializar app PROD (sin variables de emulador)
  const serviceAccount = require('../serviceAccountKey.json');
  const prodApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: PROJECT_ID,
  }, 'prod');
  const prodDb = prodApp.firestore();

  // 2) Inicializar app EMULATOR (forzar host:port y ssl:false)
  const emuApp = admin.initializeApp({ projectId: PROJECT_ID }, 'emu');
  const emuDb = emuApp.firestore();
  emuDb.settings({ host: EMU_HOST, ssl: false });

  console.log(`[SYNC] Conectando a PROD (projectId=${PROJECT_ID}) y EMULATOR (${EMU_HOST})`);

  // 3) Obtener todos los docs de catalog en PROD
  console.log('[SYNC] Leyendo colección PROD: catalog ...');
  const prodSnap = await prodDb.collection('catalog').get();
  console.log(`[SYNC] Documentos encontrados en PROD: ${prodSnap.size}`);

  // 4) Borrar colección en EMU para tener una fuente única y limpia
  console.log('[SYNC] Borrando colección en EMULATOR: catalog ...');
  const emuSnap = await emuDb.collection('catalog').get();
  if (!emuSnap.empty) {
    const batchSize = 400;
    let docs = emuSnap.docs;
    while (docs.length) {
      const chunk = docs.splice(0, batchSize);
      const batch = emuDb.batch();
      for (const d of chunk) batch.delete(d.ref);
      await batch.commit();
      //ligera pausa para no saturar
      await sleep(50);
    }
  }
  console.log('[SYNC] Colección en EMULATOR limpiada.');

  // 5) Insertar en EMULATOR los docs tal cual están en PROD (sin merges ni transformaciones)
  console.log('[SYNC] Insertando documentos en EMULATOR ...');
  const insertBatchSize = 400;
  let pending = [];
  for (const doc of prodSnap.docs) {
    const ref = emuDb.collection('catalog').doc(doc.id);
    pending.push(ref.set(doc.data()));
    if (pending.length >= insertBatchSize) {
      await Promise.all(pending);
      pending = [];
    }
  }
  if (pending.length) await Promise.all(pending);
  console.log('[SYNC] Sincronización completada ✅');
}

main().catch((err) => {
  console.error('[SYNC] Error:', err);
  process.exit(1);
});
