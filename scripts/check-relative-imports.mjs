import fs from 'fs'
import path from 'path'

const root = process.cwd()
const srcRoot = path.resolve(root, 'src')
const exts = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs', '.cjs'])
const offenders = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue
      walk(path.join(dir, entry.name))
    } else if (exts.has(path.extname(entry.name))) {
      const full = path.join(dir, entry.name)
      const content = fs.readFileSync(full, 'utf-8')
      if (content.includes("'../") || content.includes('"../')) {
        offenders.push(path.relative(root, full))
      }
    }
  }
}

walk(srcRoot)

if (offenders.length) {
  console.log('Files still with relative imports:')
  offenders.forEach(f => console.log(' - ' + f))
  process.exitCode = 1
} else {
  console.log('No relative imports remain.')
}
