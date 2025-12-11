// Script para importar productos desde catalogo_ejemplo.csv a Firestore
// Uso: node import_catalog.js

const fs = require('fs');
const path = require('path');
const csv = require('csv-parse');
const admin = require('firebase-admin');

// Inicializar Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const csvFilePath = path.join(__dirname, 'catalogo_exportado.csv');


async function clearCatalogCollection() {
  const snapshot = await db.collection('catalog').get();
  const batchSize = 500;
  let deleted = 0;
  if (snapshot.empty) return;
  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    docs.slice(i, i + batchSize).forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    deleted += Math.min(batchSize, docs.length - i);
  }
  console.log(`Eliminados ${deleted} documentos previos de 'catalog'.`);
}

async function importCatalog() {
  await clearCatalogCollection();
  const products = [];
  fs.createReadStream(csvFilePath)
    .pipe(csv.parse({ columns: true, trim: true }))
    .on('data', (row) => {
      products.push(row);
    })
    .on('end', async () => {
      console.log(`Importando ${products.length} productos...`);
      for (const product of products) {
        try {
          const precioRaw = (
            product['PRECIO'] ??
            product['PRECIO (USD)'] ??
            product['PRECIO_USD'] ??
            product['precio'] ??
            product['price'] ??
            0
          );
          const precio = parseFloat(String(precioRaw).replace(/,/g, '.')) || 0;
          const normalized = { ...product, PRECIO: precio };
          const docId = product['id'] || product['ID'] || product['Id'] || undefined;
          if (!docId) {
            console.warn('Fila sin id, se omite:', product);
            continue;
          }
          await db.collection('catalog').doc(docId).set(normalized);
          console.log(`✔️  Insert catálogo (ID CSV): ${docId}`);
        } catch (err) {
          console.error('Error importando producto:', product, err);
        }
      }
      console.log('Importación finalizada.');
      process.exit(0);
    })
    .on('error', (err) => {
      console.error('Error leyendo el CSV:', err);
      process.exit(1);
    });
}

importCatalog();
