import { defineConfig } from 'vite';
import { externalizeDeps } from 'vite-plugin-externalize-deps';

export default defineConfig({
  plugins: [
    externalizeDeps(),
  ],
  server: {
    open: '/test/index.html'
  },
  build: {
    "emptyOutDir": false,
    sourcemap: true,
    lib: {
      entry: './src/index.ts',
      name: 'RecogitoJS',
      formats: ['es', 'umd'],
      fileName: (format) => `text-annotator.${format}.js`
    },
    rollupOptions: {
      output: {
        assetFileNames: 'text-annotator.[ext]',
        globals: {
          'colord': 'Colord',
          'uuid': 'UUID',
          'dequal/lite': 'DequalLite',
          '@annotorious/core': 'AnnotoriousCore',
          'rbush': "RBush",
          'hotkeys-js': 'HotkeysJs',
        }
      }
    }
  }
});
