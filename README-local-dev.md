# Local Dev (Docker + Firebase Emulators)

Este README resume los comandos para levantar el entorno local y ejecutar seeding.

## Perfiles
- Perfil `dev`: servicios de desarrollo (`emulators`, `web`).
- Perfil `seed`: tareas de seeding (`seed`, `seed-images`). No se levantan con `up`.

## Levantar entorno de desarrollo
```powershell
# Arrancar emuladores y Nginx del front
docker compose --profile dev up -d

# Ver logs de emuladores
docker compose logs -f emulators

# Abrir el front
# http://localhost:8080
```

## Ejecutar seeding puntual
```powershell
# Sembrar catálogo
docker compose run --rm seed

# Sembrar imágenes
docker compose run --rm seed-images

# Clonar catálogo desde PROD al emulador (fuente de verdad)
docker compose run --rm clone-prod
```

## Limpieza de contenedores de seed (si quedaron)
```powershell
docker stop begamshop-seed; docker rm begamshop-seed
docker stop begamshop-seed-images; docker rm begamshop-seed-images
```

## Notas
- Los emuladores exponen puertos: Hosting 5010, Auth 9099, Firestore 8085/9150, Functions 5003, Emulator UI 4020.
- El front se sirve en `http://localhost:8080`.
- Las tareas de seeding esperan a que Firestore esté accesible antes de ejecutar.
- Los datos del emulador se guardan en `emulator-data` y se exportan al salir.
- `clone-prod` lee de Firestore PROD usando `serviceAccountKey.json` y escribe en el emulador (sin merges ni transformaciones).
# Local Dev Guide (Firebase Emulator Suite)

Este README te guía paso a paso para probar el proyecto en local usando Firebase Emulator Suite, con persistencia de datos y siembra rápida.

## Requisitos

- Node.js 20 (puedes usar nvm4w)
- Firebase CLI actualizado (`npm i -g firebase-tools`)
- Java JDK 21 (necesario para Firestore/Storage emuladores)
- Estar en la carpeta del proyecto: `C:\Users\marce\Documents\BegamShop\tienda`

## Emuladores y puertos

- Hosting: `127.0.0.1:5010`
- Auth: `127.0.0.1:9099` (UI: `http://127.0.0.1:4020/auth`)
- Firestore: `127.0.0.1:8085`
- Functions: `127.0.0.1:5003`
- Emulator UI: `http://127.0.0.1:4020`

## 1) Instalar dependencias

```powershell
# En la carpeta del proyecto
npm ci

# Functions
cd .\functions; npm ci; cd ..
```

Si no has seleccionado el proyecto por defecto:

```powershell
firebase use begamshop-4b22b
```

## 2) Arrancar emuladores (modo trabajo)

Mantén este proceso corriendo en una terminal:

```powershell
firebase emulators:start --only="hosting,auth,firestore,functions" --debug
```

## 3) Siembra rápida (Firestore)

En otra terminal, siembra catálogo e imágenes en el emulador:

```powershell

cd C:\Users\marce\Documents\BegamShop\tienda
.\seed-emulator.ps1
```

Luego abre `http://127.0.0.1:5010` y recarga con Ctrl+F5.

## 4) Persistencia entre sesiones (import/export)

Para no perder usuarios/catálogos al reiniciar, usa import/export:

- Exportar snapshot al salir (se guarda al hacer Ctrl+C):
  
```powershell
firebase emulators:start --only="hosting,auth,firestore,functions" --export-on-exit=".\emulator-data" --debug
```

- Importar datos en el próximo inicio:
  
```powershell
firebase emulators:start --only="hosting,auth,firestore,functions" --import=".\emulator-data" --debug
```

- Export inmediato (opcional):
  
```powershell
firebase emulators:export ".\emulator-data"
```

## 4.1) Migración de precios/moneda (catálogo)

Para normalizar productos a `price` (número) y `currency` (string), ejecuta la migración en el emulador de Firestore:

```powershell
cd C:\Users\marce\Documents\BegamShop\tienda
node .\tools\migrate-prices.js
```

Notas:
- Deriva desde `PRECIO (USD)` (legacy) y `precio` si existen.
- Asigna `currency` a `USD` cuando el campo legacy está presente; de lo contrario usa `UYU`.
- Puedes ajustar `defaultCurrency` en `config/empresa` para el front.


## 5 Front-end y login

- Front: `http://127.0.0.1:5010`
- Para ver “Perfil de la Empresa” editable, inicia sesión con el admin `begamshop.ventas@gmail.com`.
- Si el usuario no existe: créalo desde el front o la UI de Auth (`http://127.0.0.1:4020/auth`).

## 6 Functions (email con SendGrid en sandbox)

- Variables en `functions/.env.local`:
  - `SENDGRID_API_KEY=SG...`
  - `SENDGRID_FROM=ventas@begam.uy`
  - `SENDGRID_SANDBOX=true` (no envía correos reales)

Prueba el checkout: el front llama `sendOrderEmail` y verás el resultado en la UI del sitio y logs del emulador.

Si el callable falla, mira la terminal donde corriste los emuladores (flag `--debug`) y el console del navegador para el mensaje exacto.

## 7) Problemas comunes

- "ERR_CONNECTION_REFUSED": el emulador del servicio no está corriendo; vuelve a iniciar con los puertos indicados.
- "Firestore vacío": ejecuta `seed-emulator.ps1` o usa `--import ./emulator-data`.
- PowerShell parseo de `--only`: usa `--only="hosting,auth,firestore,functions"` (con `=` y comillas dobles).
- Puertos ocupados: libera 4410, 4510, 5010, 4020, 9099, 8085 si quedaron procesos colgados.

## 8) Estructura relevante

- `firebase.json`, `.firebaserc`, `firestore.rules`, `storage.rules`
- `index.html`, `js/main.js` (conecta a emuladores)
- `seed-emulator.ps1` (siembra Firestore)
- `import_catalog.js`, `import_images_to_firestore.js` (CSV → Firestore)
- `functions/index.js` (Functions v2 + SendGrid)

## 9) Comandos útiles

```powershell
# Liberar puertos si algo quedó colgado
Get-NetTCPConnection -LocalPort 4410,4510,5010,4020,9099,8085 -State Listen | Select-Object LocalPort,OwningProcess | Format-Table -AutoSize
# Matar proceso por PID
Stop-Process -Id <PID> -Force

# Ver procesos node que podrían bloquear puertos
Get-Process node | Select-Object Id, ProcessName
```

## 10) Producción (nota)

El front en local usa Emuladores. Para conectar a producción, comenta temporalmente las líneas `connectAuthEmulator(...)`, `connectFirestoreEmulator(...)`, `connectFunctionsEmulator(...)` en `js/main.js`. No recomendado para pruebas locales.
