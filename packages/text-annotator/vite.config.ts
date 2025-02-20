import { defineConfig } from 'vite';

import dts from 'vite-plugin-dts';
import { externalizeDeps } from 'vite-plugin-externalize-deps';

export default defineConfig({
  plugins: [
    dts({ insertTypesEntry: true, entryRoot: '.' }),
    externalizeDeps(),
  ],
  server: {
    open: '/test/index.html'
  },
  build: {
    minify: false,
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
