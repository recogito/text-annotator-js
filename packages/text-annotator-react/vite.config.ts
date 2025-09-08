import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsConfigPaths from 'vite-tsconfig-paths';
import { externalizeDeps } from 'vite-plugin-externalize-deps';

export default defineConfig({
  plugins: [
    react(),
    tsConfigPaths(),
    externalizeDeps(),
  ],
  server: {
    open: '/test/index.html'
  },
  build: {
    emptyOutDir: false,
    lib: {
      entry: './src/index.ts',
      name: 'ReactTextAnnotator',
      formats: ['es'],
      fileName: (format) => `react-text-annotator.${format}.js`
    },
    rollupOptions: {
      output: {
        assetFileNames: 'react-text-annotator.[ext]'
      }
    },
    sourcemap: true
  }
});
