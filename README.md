# BegamShop

¡Bienvenido a BegamShop! Este proyecto es una tienda online moderna, lista para desplegar en Firebase y Google Cloud.

## Características principales
- Catálogo de productos con importación/exportación CSV
- Gestión de stock y reservas
- Checkout con envío de emails reales (SendGrid)
- Pedidos con estados: pending, confirmed, paid, shipped, delivered, cancelled
- Integración con Firebase Emulators para pruebas locales
- Scripts automáticos para importar, exportar y validar datos
- Pruebas automáticas con Vitest

## Estructura del proyecto
```
├── index.html                # Frontend principal
├── js/
│   └── main.js               # Lógica del frontend
├── functions/                # Backend (Cloud Functions)
│   └── index.js              # Funciones principales
├── import_catalog.js         # Script de importación de productos
├── export_catalog_to_csv.js  # Script de exportación de catálogo
├── catalog.test.js           # Pruebas automáticas (Vitest)
├── .gitignore                # Protege claves y archivos sensibles
├── README_PEDIDOS_Y_RESERVAS.md # Propuesta de estados y reservas
```

## Despliegue
1. Instala dependencias:
   ```bash
   npm install
   cd functions && npm install
   ```
2. Configura claves y variables de entorno:
   - No subas `serviceAccountKey.json` ni `.env` a GitHub
   - Usa `firebase functions:config:set` para claves de producción
3. Prueba localmente con Firebase Emulators
4. Despliega a producción:
   ```bash
   firebase deploy --only hosting,functions
   ```

## Seguridad
- Claves y archivos sensibles están protegidos por `.gitignore`
- El historial de git está limpio de secretos
- Revisa y renueva claves periódicamente

## Pruebas automáticas
Ejecuta las pruebas con:
```bash
npx vitest run
```

## Contacto y soporte
Para dudas, mejoras o soporte, abre un issue en GitHub o contacta al autor.

---
¡Gracias por usar BegamShop! 🚀
