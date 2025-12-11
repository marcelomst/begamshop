// Script para actualizar los links de imágenes en catalogo_exportado.csv
const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');
const stringify = require('csv-stringify/sync');

const csvFile = path.join(__dirname, 'catalogo_exportado.csv');
const outputFile = path.join(__dirname, 'catalogo_exportado_fixed.csv');

const content = fs.readFileSync(csvFile, 'utf8');
const records = csv.parse(content, { columns: true });

for (const row of records) {
  const codigo = row['CODIGO'] || '';
  if (codigo) {
    row['IMG1'] = `C:/Users/marce/Documents/BegamShop/tienda/public/assets/images/${codigo}_1.jpeg`;
    row['IMG2'] = `C:/Users/marce/Documents/BegamShop/tienda/public/assets/images/${codigo}_2.jpeg`;
    row['IMG3'] = `C:/Users/marce/Documents/BegamShop/tienda/public/assets/images/${codigo}_3.jpeg`;
  }
}

const output = stringify.stringify(records, { header: true });
fs.writeFileSync(outputFile, output, 'utf8');
console.log('Archivo catalogo_exportado_fixed.csv generado con rutas locales de imágenes.');
