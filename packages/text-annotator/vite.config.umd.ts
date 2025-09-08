import { defineConfig } from 'vite';

const config = defineConfig(({
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

export default config;
