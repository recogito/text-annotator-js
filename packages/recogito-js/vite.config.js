import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
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
      fileName: 'text-annotator'
    },
    rollupOptions: {
      output: {
        assetFileNames: 'text-annotator.[ext]'
      }
    }
  }
});