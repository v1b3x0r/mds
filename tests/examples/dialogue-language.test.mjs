import { strict as assert } from 'node:assert'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')

const material = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, 'materials/examples/entity.shopkeeper_dual_lang.mdm'),
    'utf-8'
  )
)

const greet = material.dialogue?.intents?.greet?.[0]?.lang ?? {}

assert.equal(greet.en, 'Hello, how can I help you?')
assert.equal(greet.de, 'Hallo, wie kann ich Ihnen helfen?')
assert.ok(material.languageProfile?.adaptToContext, 'language profile should adapt to context')

console.log('✅ Shopkeeper multilingual greeting available')
