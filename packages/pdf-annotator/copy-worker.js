import fs from 'fs';
import path from 'path';

const BASE = '../../node_modules/pdfjs-dist';

const FILES_RUNTIME = [
  `${BASE}/legacy/build/pdf.worker.min.mjs`,
  `${BASE}/wasm/jbig2.wasm`,
  `${BASE}/wasm/jbig2_nowasm_fallback.js`
];

const FILES_DIST = [
  ...FILES_RUNTIME,
  `${BASE}/wasm/LICENSE_JBIG2`,
  `${BASE}/wasm/LICENSE_OPENJPEG`,
  `${BASE}/wasm/LICENSE_PDFJS_JBIG2`,
  `${BASE}/wasm/LICENSE_PDFJS_OPENJPEG`,
  `${BASE}/wasm/LICENSE_PDFJS_QCMS`,
];

FILES_RUNTIME.forEach(filepath => {
  fs.copyFileSync(filepath, `./${path.basename(filepath)}`);
});

if (fs.existsSync('./dist')) {
  FILES_DIST.forEach(filepath => {
    fs.copyFileSync(filepath, `./dist/${path.basename(filepath)}`);
  });
}
