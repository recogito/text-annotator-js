import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  server: {
    open: '/test/index.html'
  },
  build: {
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: (format) => `text-annotator.${format}.js`
    }
  }
});
