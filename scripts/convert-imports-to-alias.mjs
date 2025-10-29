#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const root = process.cwd()
const srcRoot = path.resolve(root, 'src')
const exts = ['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs', '.cjs']

const files = []
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue
      walk(full)
    } else {
      if (exts.includes(path.extname(entry.name))) {
        files.push(full)
      }
    }
  }
}
walk(srcRoot)

const importRegex = /(import\s+[^;'"`]*?from\s+|export\s+[^;'"`]*?from\s+|import\s*)(["'])([^"']+)(["'])/g

let changedCount = 0

for (const file of files) {
  const original = fs.readFileSync(file, 'utf-8')
  let updated = original
  let match
  importRegex.lastIndex = 0
  const dir = path.dirname(file)
  const replacements = new Map()

  while ((match = importRegex.exec(original)) !== null) {
    const fullMatch = match[0]
    const prefix = match[1]
    const quote = match[2]
    const importPath = match[3]
    const suffixQuote = match[4]

    if (!importPath.startsWith('.')) continue

    const absolute = path.resolve(dir, importPath)
    if (!absolute.startsWith(srcRoot)) continue

    const relative = path.relative(srcRoot, absolute).replace(/\\/g, '/')
    const aliasPath = relative ? `@mds/${relative}` : '@mds'

    // Preserve trailing extension if provided (.js/.mjs/etc)
    let finalPath = aliasPath
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(importPath)
    if (hasExtension) {
      const ext = importPath.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? ''
      if (!aliasPath.endsWith(ext)) {
        finalPath = aliasPath + ext
      }
    }

    const replacement = `${prefix}${quote}${finalPath}${suffixQuote}`
    replacements.set(fullMatch, replacement)
  }

  if (replacements.size > 0) {
    for (const [from, to] of replacements) {
      updated = updated.split(from).join(to)
    }
    if (updated !== original) {
      fs.writeFileSync(file, updated)
      changedCount += 1
    }
  }
}

console.log(`Updated ${changedCount} file(s) to use @mds alias`)
