import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { externalizeDeps } from 'vite-plugin-externalize-deps';

const config = defineConfig({
  plugins: [
    dts({ insertTypesEntry: true, entryRoot: '.' }),
    externalizeDeps(),
  ],
  server: {
    open: '/test/index.html'
  },
  build: {
    sourcemap: true,
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: (format) => `text-annotator.${format}.js`
    }
  }
});

export default config;
