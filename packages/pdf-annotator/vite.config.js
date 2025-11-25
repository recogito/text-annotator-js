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
    target: 'esnext',
    lib: {
      entry: {
        'index': './src/index.ts',
        'w3c/index': './src/w3c/index.ts'
      },
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        assetFileNames: 'pdf-annotator.[ext]'
      }
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    }
  }
});