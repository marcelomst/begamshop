// Reescribe IMG1/2/3 de todos los docs en 'catalog' a rutas locales /assets/images/<archivo>
// Uso: node tools/rewrite_images_local.js

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8085';
process.env.GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || 'begamshop-4b22b';

admin.initializeApp({ projectId: process.env.GOOGLE_CLOUD_PROJECT });
const db = admin.firestore();

function toLocalFromUrl(u) {
  if (!u) return '';
  try {
    const last = String(u).split('/').pop();
    return last ? `/assets/images/${last}` : '';
  } catch { return u; }
}

function pickLocal(codigo, idx) {
  if (!codigo) return '';
  const candidates = idx === 1
    ? [`${codigo}_1.jpeg`, `${codigo}_1.jpg`]
    : idx === 2
      ? [`${codigo}_2.jpg`, `${codigo}_2.jpeg`]
      : [`${codigo}_3.jpg`, `${codigo}_3.jpeg`];
  for (const file of candidates) {
    const abs = path.join(process.cwd(), 'assets', 'images', file);
    if (fs.existsSync(abs)) return `/assets/images/${file}`;
  }
  return '';
}

async function run() {
  const snap = await db.collection('catalog').get();
  console.log(`[RewriteImages] Docs: ${snap.size}`);
  let updated = 0;
  for (const doc of snap.docs) {
    const data = doc.data() || {};
    const codigo = (data.CODIGO || data.codigo || '').toString().trim();
    // Siempre preferir archivos locales existentes según CODIGO y sufijos conocidos
    const IMG1 = pickLocal(codigo, 1) || toLocalFromUrl(data.IMG1 || data.img1);
    const IMG2 = pickLocal(codigo, 2) || toLocalFromUrl(data.IMG2 || data.img2);
    const IMG3 = pickLocal(codigo, 3) || toLocalFromUrl(data.IMG3 || data.img3);

    await doc.ref.set({ IMG1, IMG2, IMG3 }, { merge: true });
    updated++;
    if (updated % 50 === 0) console.log(`... ${updated} actualizados`);
  }
  console.log(`[RewriteImages] Actualizados: ${updated}`);
}

run().catch(err => { console.error(err); process.exit(1); });
