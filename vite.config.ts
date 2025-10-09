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
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn']
      },
      mangle: {
        toplevel: true
      },
      format: {
        comments: false
      }
    },
    sourcemap: true
  },
  server: {
    open: '/examples/index.html'
  }
})
