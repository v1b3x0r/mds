#!/usr/bin/env node
/**
 * Bundle size guard for CI/local use.
 * Checks compiled bundles against soft limits.
 */

const fs = require('fs')
const path = require('path')

const bundles = [
  { file: 'dist/mds-core.esm.js', maxKB: 360 },
  { file: 'dist/mds-core-lite.esm.js', maxKB: 280 }
]

function formatKB(bytes) {
  return Math.round(bytes / 1024)
}

function checkBundle({ file, maxKB }) {
  const fullPath = path.resolve(process.cwd(), file)
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  Bundle not found: ${file} (skipped)`)
    return { status: 'skipped' }
  }

  const { size } = fs.statSync(fullPath)
  const sizeKB = size / 1024
  const limitBytes = maxKB * 1024

  console.log(`• ${file}: ${formatKB(size)} KB (limit ${maxKB} KB)`)

  if (size > limitBytes) {
    throw new Error(`Bundle ${file} exceeds limit: ${formatKB(size)} KB > ${maxKB} KB`)
  }

  return { status: 'ok', sizeKB }
}

function main() {
  let failures = 0
  for (const bundle of bundles) {
    try {
      checkBundle(bundle)
    } catch (err) {
      failures++
      console.error(`❌ ${err.message}`)
    }
  }

  if (failures > 0) {
    process.exitCode = 1
  } else {
    console.log('✅ Bundle size within limits')
  }
}

main()
