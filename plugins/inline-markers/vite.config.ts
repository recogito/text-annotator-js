import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  server: {
    open: '/test/index.html'
  },
  build: {
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      entry: {
        'plugin-inline-markers': './src/index.ts',
        'plugin-inline-markers-react': './src/react/index.ts'
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.${format}.js`,
      cssFileName: 'index'
    },
    rollupOptions: {
      external: [
        '@recogito/text-annotator',
        '@recogito/text-annotator-tei',
        '@recogito/react-text-annotator',
        'react',
        'react/jsx-runtime',
        'react-dom'
      ]
    }
  }
});