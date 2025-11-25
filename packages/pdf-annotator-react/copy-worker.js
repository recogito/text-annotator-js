import fs from 'fs';

const path = '../../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs';

fs.copyFileSync(path, './pdf.worker.min.mjs');

if (fs.existsSync('./dist'))
  fs.copyFileSync(path, './dist/pdf.worker.min.mjs');
