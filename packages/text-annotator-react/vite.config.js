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
    minify: false,
    lib: {
      entry: './src/index.ts',
      name: 'ReactTextAnnotator',
      formats: ['es'],
      fileName: (format) => `react-text-annotator.${format}.js`
    },
    rollupOptions: {
      external: [
        ...Object.keys(packageJson.peerDependencies),
        "@annotorious/core",
        "@annotorious/react",
        "@recogito/text-annotator",
        "@recogito/text-annotator-tei"
      ],
      output: {
        preserveModules: true,
        assetFileNames: 'react-text-annotator.[ext]'
      }
    },
    sourcemap: true
  }
}));
