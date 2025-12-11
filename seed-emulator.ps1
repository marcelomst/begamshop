# Seeds Firestore Emulator with catalog and images
# Usage: Open PowerShell in the project folder and run:
#   .\seed-emulator.ps1

$ErrorActionPreference = "Stop"

Write-Host "Setting FIRESTORE_EMULATOR_HOST to 127.0.0.1:8085" -ForegroundColor Cyan
$env:FIRESTORE_EMULATOR_HOST = "127.0.0.1:8085"

Write-Host "Importing catalog from catalogo_ejemplo.csv..." -ForegroundColor Cyan
node .\import_catalog.js

Write-Host "Updating product images from imagenes_catalogo.csv..." -ForegroundColor Cyan
node .\import_images_to_firestore.js

Write-Host "Seeding complete." -ForegroundColor Green
