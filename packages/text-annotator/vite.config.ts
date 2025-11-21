import path from 'path';
import { defineConfig } from 'vite';
import { externalizeDeps } from 'vite-plugin-externalize-deps';

export default defineConfig({
  plugins: [
    externalizeDeps()
  ],
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
