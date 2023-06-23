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
      name: 'ReactTextAnnotator',
      formats: ['es', 'umd'],
      fileName: (format) => `react-text-annotator.${format}.js`
    },
    rollupOptions: {
      external: [...Object.keys(packageJson.peerDependencies)],
      output: {
        assetFileNames: 'react-text-annotator.[ext]',
        globals: {
          '@annotorious/react': 'AnnotoriousReact',
          'openseadragon': 'OpenSeadragon',
          'react': 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
}));