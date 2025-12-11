const admin = require('firebase-admin');
const fs = require('fs');
const { Parser } = require('json2csv');

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

async function exportCatalog() {
  const snapshot = await db.collection('catalog').get();
  const data = [];
  snapshot.forEach(doc => {
    const docData = doc.data();
    data.push({
      id: doc.id,
      NOMBRE_PRODUCTO: docData.NOMBRE_PRODUCTO || '',
      'PRECIO (USD)': docData['PRECIO (USD)'] || docData.PRECIO || '',
      DESCRIPCION: docData.DESCRIPCION || docData.descripcion || '',
      IMG1: docData.IMG1 || '',
      IMG2: docData.IMG2 || '',
      IMG3: docData.IMG3 || '',
      STOCK_DISPONIBLE: docData.STOCK_DISPONIBLE || '',
      CODIGO_SKU: docData.CODIGO_SKU || '',
      CATEGORIA: docData.CATEGORIA || '',
      MARCA: docData.MARCA || '',
      COLOR: docData.COLOR || '',
      'TAMAÑO': docData['TAMAÑO'] || '',
      CODIGO: docData.CODIGO || '',
      PRECIO: docData.PRECIO || docData['PRECIO (USD)'] || ''
    });
  });

  if (data.length === 0) {
    console.log('No hay productos en la colección catalog.');
    return;
  }

  const fields = [
    'id',
    'NOMBRE_PRODUCTO',
    'PRECIO (USD)',
    'DESCRIPCION',
    'IMG1',
    'IMG2',
    'IMG3',
    'STOCK_DISPONIBLE',
    'CODIGO_SKU',
    'CATEGORIA',
    'MARCA',
    'COLOR',
    'TAMAÑO',
    'CODIGO',
    'PRECIO'
  ];
  const parser = new Parser({ fields });
  const csv = parser.parse(data);

  fs.writeFileSync('catalogo_exportado.csv', csv, 'utf8');
  console.log('Exportación completada: catalogo_exportado.csv');
}

exportCatalog();