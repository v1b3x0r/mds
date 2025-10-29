#!/usr/bin/env bun
import { World } from '@v1b3x0r/mds-core'

console.log('🔬 Entity Emotion Detection Test\n')

const world = new World({ renderer: 'headless' })

// Test 1: Entity with Thai essence
console.log('Test 1: Spawn with Thai essence')
const entity1 = world.spawn({ essence: 'ผีขี้อาย' }, 100, 100)
console.log(`  Essence: "${entity1.m.essence}"`)
console.log(`  Emotion: ${JSON.stringify(entity1.emotion)}`)
console.log(`  Has emotion: ${entity1.emotion !== undefined}`)

// Test 2: Entity with English essence
console.log('\nTest 2: Spawn with English essence')
const entity2 = world.spawn({ essence: 'A lonely ghost' }, 200, 200)
console.log(`  Essence: "${entity2.m.essence}"`)
console.log(`  Emotion: ${JSON.stringify(entity2.emotion)}`)
console.log(`  Has emotion: ${entity2.emotion !== undefined}`)

// Test 3: Entity without essence
console.log('\nTest 3: Spawn without essence')
const entity3 = world.spawn({}, 300, 300)
console.log(`  Has essence: ${!!entity3.m.essence}`)
console.log(`  Emotion: ${JSON.stringify(entity3.emotion)}`)
console.log(`  Has emotion: ${entity3.emotion !== undefined}`)

console.log('\n✅ All entities created')
