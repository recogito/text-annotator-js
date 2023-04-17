import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    svelte({ preprocess: sveltePreprocess() }),
    dts({ insertTypesEntry: true })
  ],
  server: {
    open: '/test/index.html'
  },
  build: {
    sourcemap: true,
    lib: {
      entry: './src/index.ts',
      name: 'RecogitoJS',
      formats: ['es', 'umd'],
      fileName: 'recogito-js'
    },
    rollupOptions: {
      output: {
        assetFileNames: 'recogito-js.[ext]'
      }
    }
  }
});