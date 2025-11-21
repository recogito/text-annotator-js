import path from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { externalizeDeps } from 'vite-plugin-externalize-deps';

export default defineConfig({
  plugins: [
    externalizeDeps(),
    dts({
      insertTypesEntry: true,
      // Note: resolves path aliases to relative paths in .d.ts files!
      rollupTypes: true,
      tsconfigPath: './tsconfig.app.json'
    }),
  ],
  server: {
    open: '/test/index.html'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, './src/index.ts'),
      formats: ['es'],
      fileName: (format) => `text-annotator.${format}.js`
    }
  }
});
