/**
 * Migración suave de catálogo: agrega campos price (number) y currency (string)
 * a documentos existentes, derivando desde "PRECIO (USD)" o "precio" legacy.
 * Usa firebase-admin contra el emulador de Firestore en 127.0.0.1:8085.
 */
const admin = require('firebase-admin');

async function main() {
  // Configurar admin para emulador
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8085';
  admin.initializeApp({ projectId: 'begamshop-4b22b' });
  const db = admin.firestore();

  const snap = await db.collection('catalog').get();
  let updated = 0;
  for (const docSnap of snap.docs) {
    const data = docSnap.data() || {};
    const rawUSD = parseFloat(data['PRECIO (USD)'] || 0);
    const legacy = parseFloat(data.precio || 0);
    const existingPrice = typeof data.price === 'number' ? data.price : undefined;
    const existingCurrency = typeof data.currency === 'string' ? data.currency : undefined;

    const price = (existingPrice !== undefined) ? existingPrice : (isNaN(legacy) ? rawUSD : legacy);
    const currency = existingCurrency || (data['PRECIO (USD)'] ? 'USD' : 'UYU');

    if (existingPrice === undefined || existingCurrency === undefined || isNaN(price)) {
      await db.collection('catalog').doc(docSnap.id).update({
        price: isNaN(price) ? 0 : price,
        currency,
      });
      updated++;
      console.log(`Updated ${docSnap.id}: price=${price} currency=${currency}`);
    }
  }
  console.log(`Done. Updated ${updated} documents.`);
}

main().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
