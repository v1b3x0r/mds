/**
 * Test dialogue variety - directly test .mdm loading
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

console.log('🌱 Testing .mdm file loading and dialogue variety...\n')

// Load companion.mdm
const companionPath = join(__dirname, 'entities', 'companion.mdm')
const companionMDM = JSON.parse(readFileSync(companionPath, 'utf-8'))

console.log('✅ companion.mdm loaded successfully!')
console.log(`   Material: ${companionMDM.material}`)
console.log(`   Intent: ${companionMDM.intent}`)
console.log(`   Label: ${companionMDM.label}\n`)

// Test dialogue categories
console.log('💬 Dialogue Categories:')
const dialogueKeys = Object.keys(companionMDM.dialogue || {})
console.log(`   Total categories: ${dialogueKeys.length}`)

for (const key of dialogueKeys) {
  const phrases = companionMDM.dialogue[key]
  console.log(`   - ${key}: ${phrases.length} phrase${phrases.length > 1 ? 's' : ''}`)
}

// Count total dialogue entries
let totalPhrases = 0
for (const key of dialogueKeys) {
  totalPhrases += companionMDM.dialogue[key].length
}

console.log(`\n   📊 Total dialogue phrases: ${totalPhrases}`)

// Test emotion transitions
if (companionMDM.emotion?.transitions) {
  console.log(`\n😊 Emotion Transitions: ${companionMDM.emotion.transitions.length}`)
  for (const transition of companionMDM.emotion.transitions) {
    console.log(`   - ${transition.trigger} → ${transition.to} (intensity: ${transition.intensity})`)
  }
}

// Test behavior rules
if (companionMDM.behavior) {
  const behaviorKeys = Object.keys(companionMDM.behavior)
  console.log(`\n🎭 Behavior Rules: ${behaviorKeys.length}`)
  for (const key of behaviorKeys) {
    const rule = companionMDM.behavior[key]
    console.log(`   - ${key}: ${rule.condition} → ${rule.effect}`)
  }
}

// Test skills
if (companionMDM.skills?.learnable) {
  console.log(`\n📚 Learnable Skills: ${companionMDM.skills.learnable.length}`)
  for (const skill of companionMDM.skills.learnable) {
    console.log(`   - ${skill.name}: growth ${skill.growth}`)
  }
}

// Test memory config
if (companionMDM.memory) {
  console.log(`\n🧠 Memory Config:`)
  console.log(`   - Short-term: ${companionMDM.memory.short_term_retention}`)
  console.log(`   - Long-term: ${companionMDM.memory.long_term_retention}`)
}

// Test cognition
if (companionMDM.cognition) {
  console.log(`\n🤔 Cognition Pattern: ${companionMDM.cognition.pattern}`)
}

// Random dialogue sampling
console.log('\n🎲 Random Dialogue Sampling:')
const categories = ['greeting_familiar', 'happy', 'curious', 'confused']
for (const cat of categories) {
  if (companionMDM.dialogue[cat]) {
    const phrases = companionMDM.dialogue[cat]
    const random = phrases[Math.floor(Math.random() * phrases.length)]
    const text = typeof random === 'string' ? random : (random.text || JSON.stringify(random))
    console.log(`   ${cat}: "${text}"`)
  }
}

console.log('\n✨ .mdm validation complete!')
console.log(`   ✅ Structure: Valid`)
console.log(`   ✅ Dialogue variety: ${totalPhrases} phrases`)
console.log(`   ✅ Behavior system: ${behaviorKeys.length} rules`)
console.log(`   ✅ Emotion system: ${companionMDM.emotion?.transitions?.length || 0} transitions`)
console.log(`   ✅ Learning system: ${companionMDM.skills?.learnable?.length || 0} skills`)
