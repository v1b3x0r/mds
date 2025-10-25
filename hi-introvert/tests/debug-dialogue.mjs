/**
 * Debug script - Check how companion.mdm dialogue is parsed
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load companion.mdm
const companionPath = join(__dirname, 'entities', 'companion.mdm')
const companionMDM = JSON.parse(readFileSync(companionPath, 'utf-8'))

console.log('🔍 Debug: Dialogue Parsing\n')

// Check dialogue structure
const dialogue = companionMDM.dialogue
console.log('Dialogue categories:', Object.keys(dialogue))

// Check intro format
console.log('\n📝 Sample "intro" phrases:')
const introSamples = dialogue.intro.slice(0, 3)
for (const phrase of introSamples) {
  console.log(JSON.stringify(phrase, null, 2))
}

// Check if they're in correct format for mdm-parser
console.log('\n✅ Expected format for mdm-parser:')
console.log('{ "lang": { "en": "text", "th": "text" } }')
console.log('OR')
console.log('{ "lang": { "en": "text", "th": "text" }, "emotion": "happy" }')

// Check actual format
const firstIntro = dialogue.intro[0]
console.log('\n🔍 Actual format detected:')
console.log('Has .lang?', !!firstIntro.lang)
console.log('Has .emotion?', !!firstIntro.emotion)

if (firstIntro.lang) {
  console.log('Languages in .lang:', Object.keys(firstIntro.lang))
  console.log('Sample text:', firstIntro.lang.en || firstIntro.lang.th)
}

// Test if mdm-parser would work
console.log('\n🧪 Simulating mdm-parser.addPhrasesToMap():')
const map = new Map()

for (const phrase of dialogue.intro) {
  if (phrase.lang) {
    for (const [lang, text] of Object.entries(phrase.lang)) {
      if (!map.has(lang)) {
        map.set(lang, [])
      }
      map.get(lang).push(text)
    }
  }
}

console.log('Parsed map size:', map.size)
console.log('Languages:', Array.from(map.keys()))
console.log('EN phrases count:', map.get('en')?.length || 0)
console.log('TH phrases count:', map.get('th')?.length || 0)

// Random selection test
const enPhrases = map.get('en')
if (enPhrases && enPhrases.length > 0) {
  console.log('\n🎲 Random selection test (3 times):')
  for (let i = 0; i < 3; i++) {
    const random = enPhrases[Math.floor(Math.random() * enPhrases.length)]
    console.log(`  ${i + 1}. "${random}"`)
  }
}

console.log('\n✨ Debug complete!')
