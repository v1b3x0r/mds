import { World } from '@v1b3x0r/mds-core'

const world = new World({
  features: { rendering: 'headless' }
})
const entity = world.spawn({ essence: 'Test' }, 100, 100)

console.log('Before enable:')
console.log(`  entity.memory: ${!!entity.memory}`)

entity.enable('memory')

console.log('\nAfter enable:')
console.log(`  entity.memory: ${!!entity.memory}`)
console.log(`  entity.memory count: ${entity.memory?.count()}`)

console.log('\nTrying to add memory:')
entity.remember({
  type: 'observation',
  subject: 'test',
  content: { test: true },
  timestamp: Date.now(),
  salience: 0.5
})

console.log(`  memory count after add: ${entity.memory?.count()}`)

const all = entity.memory?.getAll()
console.log(`  getAll(): ${all?.length} entries`)
if (all && all.length > 0) {
  console.log(`  ✅ Memory working!`)
  console.log(`  First memory:`, all[0])
} else {
  console.log(`  ❌ No memories stored`)
}
