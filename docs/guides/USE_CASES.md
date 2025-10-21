# MDS v5 Use Cases — By Audience

This guide shows you **exactly** how to use MDS for your specific use case.
No theory. Just working code you can copy-paste.

**Quick Navigation:**
- [Game Development](#game-development) (Roblox, Unity, Godot)
- [UI/UX Design](#uiux-design) (Web/App interfaces)
- [IoT & Smart Home](#iot-smart-home) (Connected devices)
- [Research & Simulation](#research-simulation) (Scientists, academics)
- [Art & Creative Coding](#art-creative-coding) (Generative art, installations)
- [Web Development](#web-development) (Dynamic websites)
- [Mobile App Development](#mobile-app-development) (iOS/Android)

---

## Game Development

**Target audience:** Roblox scripters, Unity/Godot devs, game designers

### What You Get

NPCs that:
- **Remember** what happened to them
- **Learn** from experience
- **Form relationships** with players and other NPCs
- **Have emotions** that affect their behavior
- **Evolve skills** through practice
- **Communicate** naturally via dialogue trees

### Example 1: Quest NPC That Remembers You

```typescript
import { World } from '@v1b3x0r/mds-core'

// Setup world with memory & learning
const world = new World({
  features: {
    ontology: true,      // Memory & emotion
    communication: true, // Dialogue
    cognitive: true      // Learning
  }
})

// Create quest giver NPC
const questGiver = world.spawn(
  {
    material: 'npc.quest_giver',
    essence: 'Wise village elder who remembers every visitor'
  },
  400, 300
)

// Enable relationship tracking
questGiver.enableRelationships()

// Setup dialogue tree
import { DialogueBuilder } from '@v1b3x0r/mds-core'

const dialogue = new DialogueBuilder('quest_start')
  .addNode({
    id: 'greeting',
    text: 'Ah, {playerName}! Good to see you again.',
    choices: [
      { text: 'I need a quest', next: 'offer_quest' },
      { text: 'Just passing by', next: 'farewell' }
    ]
  })
  .addNode({
    id: 'offer_quest',
    text: 'The forest spirits are restless. Will you help?',
    choices: [
      { text: 'Yes', next: 'quest_accepted', condition: (ctx) => ctx.level >= 5 },
      { text: 'Not ready yet', next: 'farewell' }
    ]
  })
  .build()

// When player interacts
function onPlayerInteract(player) {
  // Check relationship
  const relationship = questGiver.getRelationship(player.id)

  if (!relationship) {
    // First meeting
    questGiver.addRelationship(player.id, 'neutral', 0.5)
    questGiver.remember({
      timestamp: Date.now(),
      type: 'interaction',
      subject: player.id,
      content: { action: 'first_meeting' },
      salience: 0.8
    })
  } else {
    // They've met before
    const memories = questGiver.memory.recall({ subject: player.id })
    const meetingCount = memories.length

    console.log(`NPC remembers ${meetingCount} interactions with player`)

    // Relationship evolves
    if (relationship.bond > 0.7) {
      console.log('NPC considers player a friend')
      // Offer special quests
    }
  }

  // Start dialogue
  // ... use dialogue tree system
}

// NPCs react to quest completion
function onQuestComplete(player, questId) {
  // NPC remembers success
  questGiver.remember({
    timestamp: Date.now(),
    type: 'achievement',
    subject: player.id,
    content: { quest: questId, result: 'success' },
    salience: 0.95
  })

  // Relationship improves
  questGiver.updateRelationship(player.id, {
    bond: '+0.2',
    lastInteraction: Date.now()
  })

  // NPC learns what quests this player prefers
  questGiver.enableLearning()
  questGiver.learning.addExperience({
    action: 'give_quest',
    context: questId,
    reward: 1.0,
    success: true,
    timestamp: Date.now()
  })
}
```

### Example 2: Combat NPC That Learns Your Strategy

```typescript
// Enemy that adapts to player tactics
const enemy = world.spawn(
  {
    essence: 'Adaptive warrior - learns from defeats'
  },
  500, 400
)

enemy.enableLearning()
enemy.enableSkills()

// Enemy has combat skills that improve
enemy.skills.learnSkill('dodging')
enemy.skills.learnSkill('countering')

// During combat
function onPlayerAttack(attackType) {
  // Enemy learns player's attack patterns
  enemy.learning.addExperience({
    action: `counter_${attackType}`,
    context: 'combat',
    reward: Math.random(), // Based on success
    success: Math.random() > 0.5,
    timestamp: Date.now()
  })

  // Get enemy's learned counter-strategy
  const stats = enemy.learning.getStats()
  const actionValue = enemy.learning.getActionValue(`counter_${attackType}`)

  if (actionValue > 0.7) {
    console.log('Enemy has learned to counter this attack!')
    // Use appropriate defense
    enemy.skills.practice('dodging', 0.9)
  }
}

// Skills improve through practice
function onEnemyDodgeSuccess() {
  enemy.skills.practice('dodging', 1.0)  // Perfect success

  const dodgeSkill = enemy.skills.getSkill('dodging')
  console.log(`Enemy dodge proficiency: ${dodgeSkill.proficiency}`)

  // Proficiency affects gameplay
  const dodgeChance = dodgeSkill.proficiency * 0.5  // 0..50% chance
}
```

### Example 3: Village Simulation (NPCs with Social Lives)

```typescript
// Spawn village with multiple NPCs
const npcs = []
for (let i = 0; i < 5; i++) {
  const npc = world.spawn(
    { essence: ['farmer', 'blacksmith', 'merchant', 'guard', 'child'][i] },
    Math.random() * 800,
    Math.random() * 600
  )
  npc.enableRelationships()
  npc.enableLearning()
  npcs.push(npc)
}

world.start()

// NPCs naturally form social groups
setInterval(() => {
  // Check for emergent patterns
  const patterns = world.getPatterns()

  patterns.forEach(p => {
    if (p.pattern === 'clustering') {
      console.log('NPCs formed a social gathering!')
      // Entities in p.entities are clustered together
    }

    if (p.pattern === 'synchronization') {
      console.log('NPCs are moving together - maybe a parade?')
    }
  })

  // Check collective mood
  const mood = world.getCollectiveEmotion()
  if (mood && mood.valence < -0.5) {
    console.log('Village is unhappy - maybe a raid happened?')
  }
}, 5000)

// NPC daily routine
function dailyRoutine() {
  npcs.forEach(npc => {
    const hour = new Date().getHours()

    if (hour >= 6 && hour < 12) {
      // Morning: NPCs go to work
      npc.setEmotion({ valence: 0.6, arousal: 0.7, dominance: 0.6 })
    } else if (hour >= 18) {
      // Evening: NPCs socialize
      const nearbyNPC = findNearestNPC(npc, npcs)
      if (nearbyNPC) {
        npc.sendMessage('greeting', 'Good evening!', nearbyNPC)

        // Form friendship if they meet often
        const rel = npc.getRelationship(nearbyNPC.id)
        if (rel && rel.bond > 0.5) {
          console.log(`${npc.m.essence} and ${nearbyNPC.m.essence} are friends`)
        }
      }
    }
  })
}
```

### Roblox-Specific Example

```lua
-- Roblox Lua bridge (conceptual - you'd use HttpService to call Node.js server running MDS)

local HttpService = game:GetService("HttpService")
local MDS_API = "http://localhost:3000/mds"

-- Create NPC in Roblox
local npc = Instance.new("Part")
npc.Name = "SmartNPC"
npc.Position = Vector3.new(0, 5, 0)
npc.Parent = workspace

-- Initialize NPC in MDS backend
local function initializeNPC()
    local response = HttpService:PostAsync(MDS_API .. "/spawn", HttpService:JSONEncode({
        essence = "Friendly guide NPC",
        features = {"ontology", "communication"}
    }))

    local data = HttpService:JSONDecode(response)
    return data.entityId
end

local npcId = initializeNPC()

-- Player interaction
local function onPlayerClick(player)
    -- Send interaction to MDS
    HttpService:PostAsync(MDS_API .. "/interact", HttpService:JSONEncode({
        entityId = npcId,
        playerId = player.UserId,
        action = "talk"
    }))

    -- Get NPC response
    local response = HttpService:GetAsync(MDS_API .. "/dialogue/" .. npcId)
    local data = HttpService:JSONDecode(response)

    -- Show dialogue in Roblox
    showDialogue(player, data.text)
end
```

### Pro Tips for Game Devs

1. **Use deterministic mode for replays**
   ```typescript
   const world = new World({ seed: 12345 })
   // Same seed = exact same NPC behavior
   ```

2. **Save/load NPC state**
   ```typescript
   // Save on checkpoint
   const snapshot = world.snapshot()
   saveToFile('checkpoint.json', snapshot)

   // Load on death
   const data = loadFromFile('checkpoint.json')
   world.restore(data, materialMap, fieldMap)
   ```

3. **Performance: Use feature flags**
   ```typescript
   // Simple enemies: no cognitive features
   const simpleEnemy = world.spawn(material, x, y)

   // Boss enemies: full AI
   const boss = world.spawn(material, x, y)
   boss.enableLearning()
   boss.enableSkills()
   boss.enableRelationships()
   ```

---

## UI/UX Design

**Target audience:** Web designers, app designers, UX researchers

### What You Get

Interfaces that:
- **React emotionally** to user behavior
- **Remember** user patterns
- **Adapt** over time
- **Feel alive** instead of static
- **Learn** user preferences

### Example 1: Emotionally-Aware Button

```typescript
import { World } from '@v1b3x0r/mds-core'

const world = new World({
  features: { ontology: true, cognitive: true },
  rendering: 'dom'
})

// Create button entity
const submitButton = world.spawn(
  {
    material: 'ui.button.submit',
    essence: 'Submit button - stressed when clicked too much'
  },
  400, 300
)

// Initial state: neutral
submitButton.setEmotion({
  valence: 0,    // Neutral
  arousal: 0.2,  // Calm
  dominance: 0.7
})

// Track clicks
let clickCount = 0
let lastClickTime = 0

document.querySelector('#submit').addEventListener('click', () => {
  const now = Date.now()
  const timeSinceLastClick = now - lastClickTime

  clickCount++
  lastClickTime = now

  // Button gets stressed if spam-clicked
  if (timeSinceLastClick < 500) {
    submitButton.setEmotion({
      valence: -0.4,  // Negative
      arousal: 0.9,   // High arousal (stressed!)
      dominance: 0.3  // Low control
    })

    // Remember this abuse
    submitButton.remember({
      timestamp: now,
      type: 'interaction',
      subject: 'user',
      content: { action: 'spam_click' },
      salience: 0.8
    })

    // Visual feedback: button shakes or changes color
    updateButtonVisuals(submitButton.emotion)

  } else {
    // Normal click: button feels good
    submitButton.setEmotion({
      valence: 0.6,
      arousal: 0.4,
      dominance: 0.8
    })
  }
})

// Button emotion affects visuals
function updateButtonVisuals(emotion) {
  const button = document.querySelector('#submit')

  if (emotion.arousal > 0.7) {
    button.classList.add('stressed')  // Shake animation
  } else {
    button.classList.remove('stressed')
  }

  // Color based on valence
  const hue = (emotion.valence + 1) * 180  // -1..1 → 0..360
  button.style.backgroundColor = `hsl(${hue}, 70%, 60%)`
}
```

### Example 2: Form That Learns Your Habits

```typescript
// Form that predicts what you'll type
const formWorld = new World({
  features: { ontology: true, cognitive: true }
})

const nameField = formWorld.spawn(
  { essence: 'Name input field' }, 100, 100
)

nameField.enableLearning()

// Track user typing patterns
document.querySelector('#name').addEventListener('input', (e) => {
  const value = e.target.value

  // Learn character sequences
  if (value.length >= 2) {
    const lastTwo = value.slice(-2)

    nameField.learning.addExperience({
      action: `type_${lastTwo}`,
      context: 'name_field',
      reward: 0.5,
      timestamp: Date.now()
    })
  }
})

// Auto-suggest based on learned patterns
document.querySelector('#name').addEventListener('keyup', (e) => {
  const value = e.target.value
  const patterns = nameField.learning.getPatterns()

  // Find common typing sequences
  const suggestions = patterns
    .filter(p => p.sequence[0].action.startsWith(`type_${value.slice(-1)}`))
    .slice(0, 3)

  if (suggestions.length > 0) {
    showAutocompleteSuggestions(suggestions)
  }
})
```

### Example 3: Adaptive Navigation Menu

```typescript
// Menu that reorders based on usage
const menu = world.spawn(
  { essence: 'Navigation menu' }, 0, 0
)

menu.enableLearning()

const menuItems = ['Home', 'Products', 'About', 'Contact']

menuItems.forEach(item => {
  document.querySelector(`[data-menu="${item}"]`).addEventListener('click', () => {
    // Learn which items user clicks most
    menu.learning.addExperience({
      action: `click_${item}`,
      context: 'navigation',
      reward: 1.0,
      success: true,
      timestamp: Date.now()
    })
  })
})

// Periodically reorder menu based on learned preferences
setInterval(() => {
  const itemScores = menuItems.map(item => ({
    item,
    score: menu.learning.getActionValue(`click_${item}`)
  }))

  // Sort by score (most clicked first)
  itemScores.sort((a, b) => b.score - a.score)

  // Reorder DOM
  reorderMenuItems(itemScores.map(i => i.item))
}, 10000)
```

### Example 4: Emotionally-Responsive Chat Interface

```typescript
// Chat UI that reflects conversation mood
const chatInterface = world.spawn(
  { essence: 'Chat interface' }, 0, 0
)

chatInterface.setEmotion({
  valence: 0.5,  // Slightly positive
  arousal: 0.3,  // Calm
  dominance: 0.6
})

// Analyze message sentiment and update chat emotion
function onMessageReceived(message) {
  // Simple sentiment analysis
  const positiveWords = ['happy', 'great', 'love', 'awesome']
  const negativeWords = ['sad', 'hate', 'angry', 'terrible']

  let sentiment = 0
  positiveWords.forEach(word => {
    if (message.toLowerCase().includes(word)) sentiment += 0.2
  })
  negativeWords.forEach(word => {
    if (message.toLowerCase().includes(word)) sentiment -= 0.2
  })

  // Update chat emotion
  const currentEmotion = chatInterface.emotion
  chatInterface.setEmotion({
    valence: Math.max(-1, Math.min(1, currentEmotion.valence + sentiment)),
    arousal: Math.abs(sentiment) > 0.3 ? 0.7 : 0.3,
    dominance: currentEmotion.dominance
  })

  // Update chat background color based on mood
  const chatBg = document.querySelector('.chat-container')
  const hue = (chatInterface.emotion.valence + 1) * 60  // -1..1 → 0..120 (red to green)
  chatBg.style.backgroundColor = `hsla(${hue}, 50%, 95%, 1)`
}
```

### Pro Tips for UI/UX

1. **Use emotion to create micro-interactions**
   ```typescript
   // Button hover = curiosity
   button.on('hover', () => {
     button.setEmotion({ valence: 0.3, arousal: 0.5, dominance: 0.6 })
   })
   ```

2. **Memory = personalization**
   ```typescript
   // Remember dark mode preference
   ui.remember({
     timestamp: Date.now(),
     type: 'preference',
     subject: 'theme',
     content: { theme: 'dark' },
     salience: 1.0
   })
   ```

3. **Learning = adaptive UI**
   ```typescript
   // UI learns which features user ignores
   const unusedFeatures = ui.learning.getStats()
   // Hide low-value features
   ```

---

## IoT & Smart Home

**Target audience:** IoT developers, home automation enthusiasts

### What You Get

Devices that:
- **Form collective intelligence**
- **Learn patterns** without central control
- **Communicate** and coordinate
- **Detect anomalies** through emergent behavior

### Example 1: Smart Thermostat Network

```typescript
import { World } from '@v1b3x0r/mds-core'

const homeWorld = new World({
  features: {
    physics: true,        // Temperature simulation
    communication: true,  // Device communication
    cognitive: true       // Pattern learning
  }
})

// Create temperature sensors for each room
const sensors = {
  living: homeWorld.spawn({ essence: 'Living room sensor' }, 0, 0),
  bedroom: homeWorld.spawn({ essence: 'Bedroom sensor' }, 1, 0),
  kitchen: homeWorld.spawn({ essence: 'Kitchen sensor' }, 2, 0)
}

Object.values(sensors).forEach(sensor => {
  sensor.enableLearning()
  sensor.temperature = 20  // Initial temp
})

// Sensors share temperature data
function updateTemperatures() {
  Object.entries(sensors).forEach(([room, sensor]) => {
    // Read real sensor
    const realTemp = readRealSensor(room)
    sensor.temperature = realTemp

    // Broadcast to other sensors
    Object.values(sensors).forEach(otherSensor => {
      if (otherSensor !== sensor) {
        sensor.sendMessage('data', {
          room,
          temp: realTemp,
          time: Date.now()
        }, otherSensor)
      }
    })

    // Learn temperature patterns
    sensor.learning.addExperience({
      action: 'temp_reading',
      context: `${new Date().getHours()}h`,
      reward: realTemp > 22 ? 0.8 : 0.3,  // Prefer warmer
      timestamp: Date.now()
    })
  })
}

// World detects collective patterns
setInterval(() => {
  const patterns = homeWorld.getPatterns()

  patterns.forEach(p => {
    if (p.pattern === 'synchronization') {
      console.log('All rooms reaching similar temperature - good!')
    }

    if (p.pattern === 'clustering') {
      console.log('Some rooms warmer than others - adjust HVAC')
    }
  })

  // Check if any sensor is an outlier
  const stats = homeWorld.getWorldStats()
  const avgTemp = stats.avgTemperature

  Object.entries(sensors).forEach(([room, sensor]) => {
    if (Math.abs(sensor.temperature - avgTemp) > 3) {
      console.log(`${room} temperature anomaly detected!`)
      // Trigger HVAC adjustment
    }
  })
}, 60000)  // Check every minute
```

### Example 2: Security Camera Network

```typescript
// Cameras that learn normal vs. abnormal activity
const cameras = []

for (let i = 0; i < 4; i++) {
  const camera = homeWorld.spawn(
    { essence: `Security camera ${i + 1}` },
    i, 0
  )
  camera.enableLearning()
  camera.enableMemory = true
  cameras.push(camera)
}

// Each camera learns daily patterns
function onMotionDetected(cameraIndex, motionLevel) {
  const camera = cameras[cameraIndex]
  const hour = new Date().getHours()

  // Learn normal activity patterns
  camera.learning.addExperience({
    action: 'motion_detected',
    context: `hour_${hour}`,
    reward: motionLevel > 0.5 ? 0.8 : 0.2,
    timestamp: Date.now()
  })

  // Check if this is abnormal
  const expectedMotion = camera.learning.getActionValue(`motion_detected`)

  if (motionLevel > expectedMotion * 2) {
    console.log(`Camera ${cameraIndex}: Unusual activity!`)

    // Alert other cameras
    cameras.forEach(otherCamera => {
      if (otherCamera !== camera) {
        camera.sendMessage('alert', {
          type: 'unusual_motion',
          level: motionLevel,
          location: cameraIndex
        }, otherCamera)
      }
    })

    // Remember this event
    camera.remember({
      timestamp: Date.now(),
      type: 'observation',
      subject: 'unusual_activity',
      content: { motion: motionLevel, hour },
      salience: 0.95
    })
  }
}

// Cameras coordinate to track movement
function coordinateTracking() {
  // Check for synchronization (person walking past multiple cameras)
  const patterns = homeWorld.getPatterns()

  const sync = patterns.find(p => p.pattern === 'synchronization')
  if (sync) {
    console.log('Detected coordinated movement across cameras')
    // Track person's path
  }
}
```

### Example 3: Smart Lighting System

```typescript
// Lights that learn your schedule
const lights = {
  living: homeWorld.spawn({ essence: 'Living room light' }, 0, 0),
  bedroom: homeWorld.spawn({ essence: 'Bedroom light' }, 1, 0),
  bathroom: homeWorld.spawn({ essence: 'Bathroom light' }, 2, 0)
}

Object.values(lights).forEach(light => {
  light.enableLearning()
  light.brightness = 0
})

// Track when user turns lights on/off
function onLightToggle(room, state) {
  const light = lights[room]
  const hour = new Date().getHours()

  light.learning.addExperience({
    action: state ? 'turn_on' : 'turn_off',
    context: `hour_${hour}_${new Date().getDay()}`,  // Day of week
    reward: 1.0,
    success: true,
    timestamp: Date.now()
  })

  light.brightness = state ? 1.0 : 0.0
}

// Auto-adjust based on learned patterns
setInterval(() => {
  const hour = new Date().getHours()
  const day = new Date().getDay()
  const context = `hour_${hour}_${day}`

  Object.entries(lights).forEach(([room, light]) => {
    const turnOnValue = light.learning.getActionValue('turn_on')
    const turnOffValue = light.learning.getActionValue('turn_off')

    // Predict if light should be on
    if (turnOnValue > 0.7 && light.brightness === 0) {
      console.log(`Auto-turning on ${room} light (learned pattern)`)
      light.brightness = 1.0
      // Actually turn on light...
    }

    if (turnOffValue > 0.7 && light.brightness === 1.0) {
      console.log(`Auto-turning off ${room} light (learned pattern)`)
      light.brightness = 0
      // Actually turn off light...
    }
  })
}, 300000)  // Check every 5 minutes
```

### Pro Tips for IoT

1. **Use world patterns for anomaly detection**
   ```typescript
   const patterns = world.getPatterns()
   if (!patterns.find(p => p.pattern === 'stillness') && hour > 22) {
     console.log('Unusual activity at night!')
   }
   ```

2. **Device communication without central server**
   ```typescript
   // Sensors discover each other via proximity messages
   sensor.sendMessage('broadcast', { type: 'discover', id: sensor.id })
   ```

3. **Collective intelligence emerges naturally**
   ```typescript
   // No need to program coordination
   // World mind detects patterns automatically
   const stats = world.getWorldStats()
   console.log('System stability:', stats.avgEntropy)
   ```

---

## Research & Simulation

**Target audience:** Scientists, academics, researchers

### What You Get

- **Deterministic experiments** (reproducible)
- **Full control** over simulation parameters
- **Data export** for analysis
- **Emergent behavior** observation
- **Multi-agent systems** research

### Example 1: Social Dynamics Simulation

```typescript
import { World } from '@v1b3x0r/mds-core'
import fs from 'fs'

// Reproducible experiment
const world = new World({
  seed: 42,  // Same seed = identical results
  features: {
    ontology: true,
    communication: true,
    cognitive: true
  }
})

// Spawn population
const agents = []
for (let i = 0; i < 50; i++) {
  const agent = world.spawn(
    { essence: `agent_${i}` },
    Math.random() * 800,
    Math.random() * 600
  )
  agent.enableRelationships()
  agent.enableLearning()
  agent.setEmotion({
    valence: Math.random() * 2 - 1,
    arousal: Math.random(),
    dominance: Math.random()
  })
  agents.push(agent)
}

// Run simulation for N ticks
const dataPoints = []

for (let tick = 0; tick < 1000; tick++) {
  world.tick(0.016)

  // Collect data every 10 ticks
  if (tick % 10 === 0) {
    const stats = world.getWorldStats()
    const patterns = world.getPatterns()
    const mood = world.getCollectiveEmotion()

    dataPoints.push({
      tick,
      entityCount: stats.entityCount,
      avgAge: stats.avgAge,
      avgEmotion: {
        valence: stats.avgEmotionalValence,
        arousal: stats.avgEmotionalArousal
      },
      patterns: patterns.map(p => ({
        type: p.pattern,
        strength: p.strength
      })),
      collectiveMood: mood,
      totalMemories: stats.totalMemories,
      totalExperiences: stats.totalExperiences
    })
  }
}

// Export data for analysis
fs.writeFileSync(
  'experiment_001_results.json',
  JSON.stringify(dataPoints, null, 2)
)

console.log('Simulation complete. Data exported.')
```

### Example 2: Epidemic Spread Simulation

```typescript
// Simulate information/disease spread
const world = new World({
  seed: 123,
  features: { ontology: true, communication: true }
})

// Spawn population
const population = []
for (let i = 0; i < 100; i++) {
  const person = world.spawn(
    { essence: 'person' },
    Math.random() * 1000,
    Math.random() * 1000
  )
  person.infected = false
  person.immuneLevel = 0
  population.push(person)
}

// Patient zero
population[0].infected = true
population[0].infectionTime = Date.now()

// Run simulation
const spreadData = []

for (let day = 0; day < 30; day++) {
  // Simulate one day (100 ticks)
  for (let i = 0; i < 100; i++) {
    world.tick(0.016)

    // Infection spreads via proximity
    population.forEach(person => {
      if (person.infected) {
        // Find nearby entities
        const nearby = population.filter(other => {
          if (other === person || other.infected) return false
          const dx = person.x - other.x
          const dy = person.y - other.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          return dist < 50  // Infection radius
        })

        // Infect nearby with probability
        nearby.forEach(other => {
          if (Math.random() < 0.05) {  // 5% transmission rate
            other.infected = true
            other.infectionTime = Date.now()

            // Record transmission
            person.sendMessage('transmission', {
              from: person.id,
              to: other.id,
              day
            }, other)
          }
        })
      }
    })
  }

  // Collect daily statistics
  const infected = population.filter(p => p.infected).length
  const patterns = world.getPatterns()

  spreadData.push({
    day,
    infected,
    susceptible: 100 - infected,
    patterns: patterns.map(p => p.pattern)
  })

  console.log(`Day ${day}: ${infected} infected`)
}

// Export results
fs.writeFileSync('epidemic_simulation.json', JSON.stringify(spreadData, null, 2))
```

### Example 3: Collective Decision-Making

```typescript
// Study how groups reach consensus
const world = new World({
  seed: 456,
  features: { ontology: true, communication: true, cognitive: true }
})

// Two groups with different initial opinions
const groupA = []
const groupB = []

for (let i = 0; i < 25; i++) {
  const agentA = world.spawn({ essence: 'opinion_A' }, 200, 300 + Math.random() * 200)
  agentA.opinion = 1.0  // Strong opinion A
  agentA.enableLearning()
  groupA.push(agentA)

  const agentB = world.spawn({ essence: 'opinion_B' }, 600, 300 + Math.random() * 200)
  agentB.opinion = -1.0  // Strong opinion B
  agentB.enableLearning()
  groupB.push(agentB)
}

const allAgents = [...groupA, ...groupB]

// Agents communicate and influence each other
const consensusData = []

for (let round = 0; round < 100; round++) {
  allAgents.forEach(agent => {
    // Find nearby agents
    const nearby = allAgents.filter(other => {
      if (other === agent) return false
      const dx = agent.x - other.x
      const dy = agent.y - other.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      return dist < 100
    })

    // Influenced by nearby opinions
    nearby.forEach(other => {
      agent.sendMessage('opinion', { value: other.opinion }, other)

      // Agent shifts opinion slightly
      agent.opinion += (other.opinion - agent.opinion) * 0.1

      // Learn from interaction
      agent.learning.addExperience({
        action: 'opinion_shift',
        context: `towards_${other.opinion > 0 ? 'A' : 'B'}`,
        reward: Math.abs(other.opinion),
        timestamp: Date.now()
      })
    })
  })

  world.tick(0.016)

  // Measure consensus
  const avgOpinion = allAgents.reduce((sum, a) => sum + a.opinion, 0) / allAgents.length
  const variance = allAgents.reduce((sum, a) => sum + Math.pow(a.opinion - avgOpinion, 2), 0) / allAgents.length

  consensusData.push({
    round,
    avgOpinion,
    variance,
    consensus: variance < 0.1  // Low variance = consensus reached
  })

  if (variance < 0.1) {
    console.log(`Consensus reached at round ${round}!`)
    break
  }
}

fs.writeFileSync('consensus_study.json', JSON.stringify(consensusData, null, 2))
```

### Pro Tips for Researchers

1. **Always use deterministic mode**
   ```typescript
   const world = new World({ seed: YOUR_SEED })
   // Reproducible experiments
   ```

2. **Export snapshots for later analysis**
   ```typescript
   const snapshot = world.snapshot()
   fs.writeFileSync(`snapshot_tick_${tick}.json`, JSON.stringify(snapshot))
   ```

3. **Run parameter sweeps**
   ```typescript
   for (let seed = 0; seed < 100; seed++) {
     const world = new World({ seed })
     // Run experiment
     // Collect results
   }
   ```

4. **Use world stats for metrics**
   ```typescript
   const stats = world.getWorldStats()
   // stats contains 20+ aggregate metrics
   ```

---

## Art & Creative Coding

**Target audience:** Generative artists, creative coders, installation artists

### What You Get

- **Living canvases** that evolve
- **Emotion-driven visuals**
- **Emergent aesthetics**
- **Interactive installations**

### Example 1: Emotional Paint Strokes

```typescript
import { World } from '@v1b3x0r/mds-core'

const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

const world = new World({
  features: { ontology: true },
  rendering: 'canvas'
})

// Spawn entities that paint
const painters = []
for (let i = 0; i < 20; i++) {
  const painter = world.spawn(
    { essence: 'emotional painter' },
    Math.random() * canvas.width,
    Math.random() * canvas.height
  )
  painter.setEmotion({
    valence: Math.random() * 2 - 1,
    arousal: Math.random(),
    dominance: Math.random()
  })
  painters.push(painter)
}

// Each entity leaves a trail based on emotion
function drawFrame() {
  // Fade previous frame
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  painters.forEach(painter => {
    const emotion = painter.emotion

    // Color from emotion
    const hue = (emotion.valence + 1) * 180  // -1..1 → 0..360
    const saturation = emotion.arousal * 100
    const lightness = 50 + emotion.dominance * 20

    // Size from arousal
    const size = 2 + emotion.arousal * 10

    ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`
    ctx.beginPath()
    ctx.arc(painter.x, painter.y, size, 0, Math.PI * 2)
    ctx.fill()

    // Emotion decays and shifts over time
    painter.setEmotion({
      valence: emotion.valence + (Math.random() - 0.5) * 0.1,
      arousal: emotion.arousal * 0.99,  // Gradually calms
      dominance: emotion.dominance
    })
  })

  world.tick(0.016)
  requestAnimationFrame(drawFrame)
}

drawFrame()
```

### Example 2: Memory-Based Generative Art

```typescript
// Entities that remember their paths and create patterns
const drawers = []
for (let i = 0; i < 10; i++) {
  const drawer = world.spawn(
    { essence: 'remembering drawer' },
    canvas.width / 2,
    canvas.height / 2
  )
  drawer.enableMemory = true
  drawer.path = []
  drawers.push(drawer)
}

function drawMemories() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.02)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  drawers.forEach(drawer => {
    // Record position in memory
    drawer.remember({
      timestamp: Date.now(),
      type: 'observation',
      subject: 'position',
      content: { x: drawer.x, y: drawer.y },
      salience: 0.5
    })

    // Recall recent positions
    const recentMemories = drawer.memory.recall({ subject: 'position' })
    const path = recentMemories.map(m => m.content)

    // Draw path
    if (path.length > 1) {
      ctx.strokeStyle = `hsla(${drawer.age * 10 % 360}, 70%, 60%, 0.5)`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(path[0].x, path[0].y)
      path.forEach(pos => ctx.lineTo(pos.x, pos.y))
      ctx.stroke()
    }
  })

  world.tick(0.016)
  requestAnimationFrame(drawMemories)
}

drawMemories()
```

### Example 3: Interactive Installation (Touch-Reactive)

```typescript
// Installation that remembers interactions
const world = new World({
  features: { ontology: true, cognitive: true }
})

const entities = []
for (let i = 0; i < 50; i++) {
  const entity = world.spawn(
    { essence: 'particle' },
    Math.random() * canvas.width,
    Math.random() * canvas.height
  )
  entity.enableLearning()
  entity.enableMemory = true
  entities.push(entity)
}

// Touch creates attraction
canvas.addEventListener('touchstart', (e) => {
  const touch = e.touches[0]
  const x = touch.clientX
  const y = touch.clientY

  entities.forEach(entity => {
    const dx = x - entity.x
    const dy = y - entity.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < 200) {
      // Remember this touch
      entity.remember({
        timestamp: Date.now(),
        type: 'interaction',
        subject: 'touch',
        content: { x, y, strength: 1 - dist / 200 },
        salience: 0.9
      })

      // Learn that touches attract
      entity.learning.addExperience({
        action: 'move_to_touch',
        context: 'interaction',
        reward: 1.0,
        timestamp: Date.now()
      })

      // Move towards touch
      entity.vx += (dx / dist) * 2
      entity.vy += (dy / dist) * 2
    }
  })
})

// Entities remember frequently-touched areas
function drawInstallation() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  entities.forEach(entity => {
    // Check memories of touches
    const touchMemories = entity.memory.recall({ subject: 'touch' })

    // Visual intensity based on touch memory
    const alpha = Math.min(1, touchMemories.length / 10)

    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
    ctx.beginPath()
    ctx.arc(entity.x, entity.y, 3, 0, Math.PI * 2)
    ctx.fill()
  })

  world.tick(0.016)
  requestAnimationFrame(drawInstallation)
}

drawInstallation()
```

### Pro Tips for Artists

1. **Emotion → Color mappings**
   ```typescript
   const hue = (emotion.valence + 1) * 180
   const saturation = emotion.arousal * 100
   const lightness = 50 + emotion.dominance * 50
   ```

2. **Aging creates time-based art**
   ```typescript
   entity.age  // Seconds since spawn
   // Use age to fade, change color, grow, etc.
   ```

3. **Memory creates trails and echoes**
   ```typescript
   const path = entity.memory.recall({ type: 'observation' })
   // Draw the entity's remembered path
   ```

---

## Web Development

**Target audience:** Frontend/backend web developers

### Example: Dynamic News Feed

```typescript
// News articles that prioritize based on user interaction
const articles = []
newsData.forEach((article, i) => {
  const entity = world.spawn(
    { essence: article.title },
    i * 100, 100
  )
  entity.enableLearning()
  entity.data = article
  articles.push(entity)
})

// Track interactions
document.querySelectorAll('.article').forEach((el, i) => {
  el.addEventListener('click', () => {
    articles[i].learning.addExperience({
      action: 'read',
      context: articles[i].data.category,
      reward: 1.0,
      timestamp: Date.now()
    })
  })

  el.addEventListener('scroll', () => {
    articles[i].learning.addExperience({
      action: 'scroll_past',
      context: articles[i].data.category,
      reward: 0.3,
      timestamp: Date.now()
    })
  })
})

// Reorder feed based on learned preferences
setInterval(() => {
  const scores = articles.map(a => ({
    article: a,
    score: a.learning.getActionValue('read')
  }))
  scores.sort((a, b) => b.score - a.score)

  // Reorder DOM
  renderFeed(scores.map(s => s.article.data))
}, 30000)
```

### Pro Tip: Use as state management
```typescript
// Replace Redux/Context with MDS World
const appWorld = new World({ features: { ontology: true } })

// App state as entities
const userState = appWorld.spawn({ essence: 'user' }, 0, 0)
const cartState = appWorld.spawn({ essence: 'shopping_cart' }, 0, 0)

// State changes = memories
userState.remember({
  timestamp: Date.now(),
  type: 'action',
  subject: 'login',
  content: { userId: 123 },
  salience: 1.0
})
```

---

## Mobile App Development

**Target audience:** iOS/Android developers

### Example: Habit Tracking App

```typescript
// Habits as entities that learn user patterns
const habits = []

userHabits.forEach(habit => {
  const entity = world.spawn({ essence: habit.name }, 0, 0)
  entity.enableLearning()
  entity.enableSkills()
  entity.data = habit
  habits.push(entity)
})

// Track completion
function onHabitCompleted(habitId) {
  const habit = habits[habitId]
  const hour = new Date().getHours()

  // Learn when user usually completes this habit
  habit.learning.addExperience({
    action: 'complete',
    context: `hour_${hour}`,
    reward: 1.0,
    success: true,
    timestamp: Date.now()
  })

  // Skill improves with consistency
  habit.skills.practice('consistency', 1.0)
}

// Send smart reminders
function checkReminders() {
  const hour = new Date().getHours()

  habits.forEach(habit => {
    const expectedCompletion = habit.learning.getActionValue('complete')
    const actualCompletion = habit.data.completedToday

    if (expectedCompletion > 0.7 && !actualCompletion) {
      sendNotification(`Time for ${habit.data.name}!`)
    }
  })
}
```

---

## Summary

**Choose your path:**

- **Games**: NPCs with memory, emotion, learning
- **UI/UX**: Interfaces that adapt and respond emotionally
- **IoT**: Devices with collective intelligence
- **Research**: Reproducible multi-agent simulations
- **Art**: Living, evolving generative art
- **Web**: Dynamic content prioritization
- **Mobile**: Smart habit tracking and predictions

**All from the same core system.**

---

**Need help?**
- [Discord](https://discord.gg/mds) — Ask questions
- [Examples](../../examples/) — Working demos
- [API Docs](../technical/API.md) — Full reference

