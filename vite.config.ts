import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MaterialSystem',
      formats: ['es', 'umd'],
      fileName: (format) => `mds.${format === 'es' ? 'esm' : 'umd'}.js`
    },
    rollupOptions: {
      output: {
        exports: 'named'
      }
    },
    minify: false, // Disabled for UMD compatibility
    sourcemap: true
  },
  server: {
    open: '/demo/index.html'
  }
})
