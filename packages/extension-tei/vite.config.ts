import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: '/test/index.html'
  },
  build: {
    emptyOutDir: false,
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
