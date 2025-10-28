import { strict as assert } from 'node:assert'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')

const material = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, 'materials/examples/entity.weather_bard.mdm'),
    'utf-8'
  )
)

const variants = material.dialogue?.intents?.ask_about_weather ?? []

const happyLine = variants.find(v => (v.when ?? '').includes("emotion.state == 'happy'"))
const sadLine = variants.find(v => (v.when ?? '').includes("emotion.state == 'sad'"))

assert.ok(happyLine, 'happy weather line should exist')
assert.ok(sadLine, 'sad weather line should exist')
assert.ok(happyLine.lang?.en?.includes("beautiful"), 'happy line should be cheerful')
assert.ok(sadLine.lang?.en?.includes("hadn\'t noticed"), 'sad line should be melancholic')

console.log('✅ Weather bard dialogue branches by emotion state')
