import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({ 
      insertTypesEntry: true,
      entryRoot: '.'
    })
  ],
  server: {
    open: '/test/index.html'
  },
  build: {
    sourcemap: true,
    lib: {
      entry: './src/index.ts',
      name: 'TEIPlugin',
      formats: ['es', 'umd'],
      fileName: (format) => `text-annotator-tei.${format}.js`
    },
    rollupOptions: {
      output: {
        assetFileNames: 'text-annotator-tei.[ext]'
      }
    }
  }
});