import { defineConfig } from 'vite'
import { resolve } from 'path'

const isGhPages = !!process.env.GITHUB_PAGES
const base = isGhPages ? '/mds/' : '/'

export default defineConfig({
  base,
  build: {
    emptyOutDir: process.env.BUILD_TARGET ? false : true,  // Only clear on main build
    lib: process.env.BUILD_TARGET === 'validator'
      ? {
          entry: resolve(__dirname, 'src/validator-entry.ts'),
          name: 'MDSValidator',
          formats: ['es'],
          fileName: () => 'mds-validator.esm.js'
        }
      : process.env.BUILD_TARGET === 'lite'
      ? {
          entry: resolve(__dirname, 'src/index-lite.ts'),
          name: 'MDSLite',
          formats: ['es'],
          fileName: () => 'mds-core-lite.esm.js'
        }
      : {
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'MDS',
          formats: ['es'],
          fileName: () => 'mds-core.esm.js'
        },
    rollupOptions: {
      external: ['os', 'child_process', 'fs'],
      output: {
        exports: 'named'
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,       // Remove all console.* calls
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn', 'console.info', 'console.debug', 'assert'],
        passes: 2                 // Safe minification passes
      },
      mangle: {
        properties: {
          regex: /^_/              // Mangle properties starting with _
        }
      },
      format: {
        comments: false           // Remove all comments
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
