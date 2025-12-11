// Script para actualizar las imágenes de productos en Firestore desde imagenes_catalogo.csv
// Uso: node import_images_to_firestore.js

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

const csvFilePath = path.join(__dirname, 'imagenes_catalogo.csv');

function updateImages() {
  const products = [];
  fs.createReadStream(csvFilePath)
    .pipe(csv.parse({ columns: true, trim: true }))
      .on('data', (row) => {
        console.log('Claves de la fila:', Object.keys(row));
        console.log('Fila CSV:', row);
        // Buscar la clave que contiene 'CODIGO'
        const codigoKey = Object.keys(row).find(k => k.toUpperCase().includes('CODIGO'));
        const codigoStr = codigoKey ? row[codigoKey].toString().trim() : '';
        const codigoNum = codigoStr ? parseInt(codigoStr, 10) : NaN;
        console.log('CODIGO para búsqueda:', codigoStr, 'como número:', codigoNum);
        const pick = (codigo, idx) => {
          if (!codigo) return '';
          const candidates = idx === 1
            ? [`${codigo}_1.jpeg`, `${codigo}_1.jpg`]
            : idx === 2
              ? [`${codigo}_2.jpg`, `${codigo}_2.jpeg`]
              : [`${codigo}_3.jpg`, `${codigo}_3.jpeg`];
          for (const file of candidates) {
            const abs = path.join(__dirname, 'assets', 'images', file);
            try { if (fs.existsSync(abs)) return `/assets/images/${file}`; } catch {}
          }
          return '';
        };
        products.push({
          ...row,
          CODIGO: codigoStr,
          CODIGO_NUM: codigoNum,
          IMG1: pick(codigoStr, 1),
          IMG2: pick(codigoStr, 2),
          IMG3: pick(codigoStr, 3)
        });
    })
    .on('end', async () => {
      console.log(`Actualizando imágenes de ${products.length} productos...`);
        for (const product of products) {
          try {
            const docId = product.CODIGO || (product.CODIGO_NUM ? String(product.CODIGO_NUM) : '');
            if (!docId) {
              console.warn(`Fila sin ID reconocible, se omite:`, product);
              continue;
            }
            // Upsert directo por ID estable
            await db.collection('catalog').doc(docId).set({
              IMG1: product.IMG1 || '',
              IMG2: product.IMG2 || '',
              IMG3: product.IMG3 || ''
            }, { merge: true });
            console.log(`✔️ Upsert imágenes para ID=${docId}`);
          } catch (err) {
            console.error('Error actualizando producto:', product, err);
          }
        }
      console.log('Actualización finalizada.');
      process.exit(0);
    })
    .on('error', (err) => {
      console.error('Error leyendo el CSV:', err);
      process.exit(1);
    });
}

updateImages();
