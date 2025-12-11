# BegamShop Functions (Emulador)

Funciones callable para manejo de stock simple:

- `reserveStock({ items: [{ id, cantidad }] })`:
  - Valida stock de cada producto en `catalog/{id}` y descuenta `STOCK_DISPONIBLE` en una transacción.
  - Crea `reservations/{reservationId}` con `status: 'active'`.
  - Respuesta: `{ ok: true, reservationId }` o `{ ok: false, error }`.

- `releaseStock({ reservationId })`:
  - Lee la reserva `active` y revierte `STOCK_DISPONIBLE` por cada item en transacción.
  - Marca `reservations/{reservationId}.status = 'released'`.
  - Respuesta: `{ ok: true }` o `{ ok: false, error }`.

## Ejecutar en local (PowerShell)

Instalar dependencias:

```powershell
cd "c:\Users\marce\Documents\BegamShop\tienda\functions"; npm install
```

Arrancar emuladores de Firebase (si usas el proyecto raíz con `firebase.json`):

```powershell
firebase emulators:start --only functions,firestore
```

Si no tienes `firebase.json` aún, puedes iniciar sólo Functions en modo local:

```powershell
cd "c:\Users\marce\Documents\BegamShop\tienda\functions"; npx firebase-functions@latest run
```

Asegúrate que el front-end conecta a `connectFunctionsEmulator('localhost', 5003)` y `connectFirestoreEmulator('localhost', 8085)`.
