import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsConfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';

import * as packageJson from './package.json';

export default defineConfig(({ command, mode }) => ({
  plugins: [
    react(),
    tsConfigPaths(),
    dts({ 
      include: ['./src/'],
      entryRoot: './src'
    })
  ],
  server: {
    open: '/test/index.html'
  },
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'ReactPDFAnnotator',
      formats: ['es'],
      fileName: (format) => `react-pdf-annotator.${format}.js`
    },
    rollupOptions: {
      external: [...Object.keys(packageJson.peerDependencies), 'react/jsx-runtime'],
      output: {
        assetFileNames: 'react-pdf-annotator.[ext]',
        globals: {
          'react/jsx-runtime': 'ReactJsxRuntime',
        }
      }
    },
    sourcemap: true,
    target: 'esnext'
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    }
  }
}));