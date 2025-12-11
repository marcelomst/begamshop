import { describe, it, expect } from 'vitest';
import admin from 'firebase-admin';

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

describe('Catálogo Firestore', () => {
  it('no debe haber campos críticos vacíos', async () => {
    const snapshot = await db.collection('catalog').get();
    for (const doc of snapshot.docs) {
      const data = doc.data();
      expect(data.NOMBRE_PRODUCTO).not.toBe('');
      expect(data.PRECIO).not.toBe(0);
      expect(doc.id).not.toBe('');
    }
  });

  it('no debe haber productos duplicados por ID', async () => {
    const snapshot = await db.collection('catalog').get();
    const ids = snapshot.docs.map(doc => doc.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('Reserva y Stock', () => {
  it('cada reserva debe estar asociada a un pedido y producto válido', async () => {
    const snapshot = await db.collection('reservas').get();
    for (const doc of snapshot.docs) {
      const data = doc.data();
      expect(data.pedidoId).toBeDefined();
      expect(data.productoId).toBeDefined();
      // Opcional: verificar que el producto existe
      const prod = await db.collection('catalog').doc(data.productoId).get();
      expect(prod.exists).toBe(true);
    }
  });

  it('el stock reservado no debe exceder el stock disponible', async () => {
    const catalogSnap = await db.collection('catalog').get();
    for (const prodDoc of catalogSnap.docs) {
      const prodId = prodDoc.id;
      const prodData = prodDoc.data();
      const reservasSnap = await db.collection('reservas').where('productoId', '==', prodId).get();
      const totalReservado = reservasSnap.docs.reduce((sum, r) => sum + (r.data().cantidad || 0), 0);
      const stockDisponible = Number(prodData.STOCK_DISPONIBLE) || 0;
      expect(totalReservado).toBeLessThanOrEqual(stockDisponible);
    }
  });
});
