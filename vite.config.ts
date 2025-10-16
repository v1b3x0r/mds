import { defineConfig } from 'vite'
import { resolve } from 'path'

const isGhPages = !!process.env.GITHUB_PAGES
const base = isGhPages ? '/mds/' : '/'

export default defineConfig({
  base,
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MDS',
      formats: ['es'],
      fileName: () => 'mds-core.esm.js'
    },
    rollupOptions: {
      output: {
        exports: 'named'
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
        pure_funcs: ['console.debug']
      },
      mangle: {
        properties: false
      }
    },
    sourcemap: true,
    target: 'es2020'
  },
  server: {
    open: '/examples/cluster.html',
    port: 3000
  },
  preview: {
    port: 3000,
    open: '/examples/cluster.html'
  }
})
