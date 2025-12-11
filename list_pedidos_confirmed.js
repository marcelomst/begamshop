// Script para listar pedidos con status 'confirmed' en Firestore
// Uso: node list_pedidos_confirmed.js

const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

async function listPedidosConfirmed() {
  const snapshot = await db.collection('pedidos').where('status', '==', 'confirmed').get();
  if (snapshot.empty) {
    console.log('No hay pedidos con status: confirmed.');
    return;
  }
  const pedidos = [];
  snapshot.forEach(doc => {
    pedidos.push({ id: doc.id, ...doc.data() });
  });
  // Opcional: guardar en CSV
  const csv = pedidos.map(p => Object.values(p).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const header = Object.keys(pedidos[0]).map(k => `"${k}"`).join(',');
  fs.writeFileSync('pedidos_confirmed.csv', header + '\n' + csv, 'utf8');
  console.log('Listado exportado a pedidos_confirmed.csv');
  // También mostrar en consola
  console.table(pedidos);
}

listPedidosConfirmed();
