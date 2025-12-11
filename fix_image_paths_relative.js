// Script para corregir rutas absolutas de imágenes a rutas relativas para Firebase Hosting
// Lee catalogo_exportado_fixed.csv y genera catalogo_exportado_fixed2.csv con rutas tipo /assets/images/xxx.jpg

const fs = require('fs');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');

const inputFile = 'catalogo_exportado_fixed.csv';
const outputFile = 'catalogo_exportado_fixed2.csv';

fs.readFile(inputFile, (err, data) => {
  if (err) throw err;
  parse(data, { columns: true }, (err, records) => {
    if (err) throw err;
    // Detecta los campos de imagen (IMG1, IMG2, IMG3, etc.)
    const imageFields = Object.keys(records[0]).filter(k => k.toUpperCase().startsWith('IMG'));
    records.forEach(row => {
      imageFields.forEach(field => {
        if (row[field]) {
          // Busca la subruta a partir de /assets/images/ o \assets\images\
          const regex = /assets[\\/]+images[\\/]+([^\\/]+\.(jpg|jpeg|png|gif))/i;
          const match = row[field].replace(/\\/g, '/').match(regex);
          if (match) {
            row[field] = `/assets/images/${match[1]}`;
          }
        }
      });
    });
    stringify(records, { header: true }, (err, output) => {
      if (err) throw err;
      fs.writeFile(outputFile, output, err => {
        if (err) throw err;
        console.log('Rutas de imágenes corregidas en', outputFile);
      });
    });
  });
});
