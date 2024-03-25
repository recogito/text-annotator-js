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
      name: 'RecogitoJS',
      formats: ['es', 'umd'],
      fileName: (format) => `text-annotator.${format}.js`
    },
    rollupOptions: {
      external: ['@annotorious/core'],
      output: {
        assetFileNames: 'text-annotator.[ext]',
        globals: {
          '@annotorious/core': 'AnnotoriousCore'
        }
      }
    }
  }
});
