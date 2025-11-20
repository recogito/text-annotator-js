import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    // Prevent emptying the dist folder after the previous ES build
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      entry: './src/index.ts',
      name: 'RecogitoJS',
      formats: ['umd'],
      fileName: (format) => `text-annotator.${format}.js`
    }
  }
}));
