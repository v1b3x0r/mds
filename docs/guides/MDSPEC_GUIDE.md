# MDSPEC Guide — The Schema Reference

**This guide will get you writing `.mdm` files (Material Definitions) in 5 minutes.**

⸻

## 🌊 What even is MDSpec?

MDSpec = **Material Definition Specification**

It's how we tell the universe "here's a living thing" using JSON.

But it's not config —
it's **ontology** (a description of what something *is*).

**File extension:** `.mdm` (Material Definition)

⸻

## 📖 Complete Schema (v5.0)

```json
{
  "$schema": "5.0",
  "material": "paper.curious",
  "intent": "observe",
  "essence": "A paper that leans toward you when hovered.",

  "behavior": {
    "onHover": {
      "type": "transform",
      "value": "scale(1.1) rotate(2deg)"
    },
    "onProximity": {
      "trigger": "distance < 80px",
      "effect": "spawn_field",
      "field": "field.curiosity"
    }
  },

  "physics": {
    "mass": 1,
    "friction": 0.05,
    "bounce": 0.3
  },

  "manifestation": {
    "emoji": "🐥",
    "visual": "soft-glow",
    "aging": {
      "start_opacity": 1,
      "decay_rate": 0.008
    }
  },

  "ai_binding": {
    "model_hint": "gpt-4o-mini",
    "simulate": true
  },

  "notes": [
    "This material gets shy after 3 hovers.",
    "Created on a rainy Tuesday."
  ]
}
```

**What's new in v5.0:**

Entities now support optional advanced features (enabled via World feature flags):

```json
{
  "material": "person.curious",
  "essence": "A curious explorer who remembers and learns",

  // v5: Ontology features (optional - enable with features.ontology)
  "memory": {
    "maxSize": 100,
    "forgetRate": 0.1
  },
  "emotion": {
    "valence": 0.5,
    "arousal": 0.3,
    "dominance": 0.6
  },

  // v5: Physics features (optional - enable with features.physics)
  "temperature": 25,
  "conductivity": 0.5,

  // v5: Communication features (optional - enable with features.communication)
  "canSpeak": true,

  // v5: Cognitive features (optional - enable with features.cognitive)
  "canLearn": true
}
```

⸻

## 🔑 Key-by-Key Explanation

### `material` (required)
**Type:** `string`
**Its identity** — unique ID

```json
"material": "paper.shy"
```

- Name pattern: `{type}.{personality}.{variant}`
- Must be unique within the same world
- Use kebab-case (`paper-shy`) or dot notation (`paper.shy`)

⸻

### `intent` (optional)
**Type:** `string`
**A short verb** — what it does

```json
"intent": "observe"
```

**Examples:**
- `"drift"` → floats aimlessly
- `"connect"` → seeks pairs
- `"guard"` → stays put
- `"flee"` → runs away

⸻

### `essence` (optional but powerful)
**Type:** `string` or `{ en: string, th: string }`
**Its heart** — describe its being in one sentence

```json
"essence": "The breath of two hearts in sync"
```

Or bilingual:
```json
"essence": {
  "en": "The breath of two hearts in sync",
  "th": "การหายใจพร้อมกันของสองใจ"
}
```

**Why it matters:**
- An `essence`-only material still spawns
- Engine uses this for semantic similarity (if LLM bridge exists)
- Without LLM, falls back to random entropy

⸻

### `behavior` (optional)
**Type:** `object`
**Response rules** — what it does when events happen

```json
"behavior": {
  "onHover": {
    "type": "transform",
    "value": "translateX(-10px)"
  },
  "onRepeatHover": {
    "threshold": 3,
    "effect": "fade_out"
  },
  "onProximity": {
    "trigger": "distance < 60px",
    "effect": "spawn_field",
    "field": "field.trust"
  }
}
```

**Available events:**
- `onHover` → when mouse hovers
- `onRepeatHover` → repeated hover (set threshold)
- `onProximity` → near another entity
- `onIdle` → untouched
- `onBind` → connects with another (e.g., spawn field together)
- `onDesync` → disconnects

**Effect types:**
- `transform` → change CSS transform
- `fade_out` → gradually disappear
- `spawn_field` → create field around it
- `velocity` → add speed

⸻

### `physics` (optional)
**Type:** `object`
**Physics rules** — movement basics

```json
"physics": {
  "mass": 1.5,
  "friction": 0.04,
  "bounce": 0.5
}
```

- **mass** (0.1 - 5): heavier = resists forces more
- **friction** (0 - 1): higher = stops faster
- **bounce** (0 - 1): higher = elastic rebound

⸻

### `manifestation` (optional)
**Type:** `object`
**Physical form** — how it looks

```json
"manifestation": {
  "emoji": "💌",
  "visual": "glass-blur",
  "aging": {
    "start_opacity": 1,
    "decay_rate": 0.006
  }
}
```

**Fields:**
- `emoji` → appearance (emoji or HTML)
- `visual` → style hint (`"soft-glow"`, `"glass-blur"`, `"neon"`)
- `aging` → decay over time
  - `start_opacity` → initial opacity (0-1)
  - `decay_rate` → fade rate per second (0.001 - 0.01)

⸻

### `ai_binding` (optional, experimental)
**Type:** `object`
**AI connection** — if you want it to "think"

```json
"ai_binding": {
  "model_hint": "gpt-4o-mini",
  "simulate": false
}
```

- `model_hint` → suggest which LLM to use
- `simulate` → if `true`, uses dummy responses (no real API call)

**Note:** You must implement LlmBridge yourself or use provided adapters (OpenRouter, Anthropic, OpenAI)

⸻

### `notes` (optional)
**Type:** `string[]`
**Personal notes** — anything goes

```json
"notes": [
  "Inspired by rainy Chiang Mai mornings",
  "Best viewed at night",
  "Pairs well with field.nostalgia"
]
```

⸻

## 🆕 v5.0 Optional Features

### Memory System (Ontology)

Entities can remember past events using Ebbinghaus forgetting curve:

```json
{
  "material": "npc.villager",
  "essence": "A villager who remembers your kindness",
  "memory": {
    "maxSize": 50,
    "forgetRate": 0.1
  }
}
```

**Enable in code:**
```typescript
const world = new World({ features: { ontology: true } })
const entity = world.spawn(material, 100, 100)

entity.remember({
  timestamp: Date.now(),
  type: 'interaction',
  subject: 'player',
  content: 'helped with quest',
  salience: 0.9
})
```

⸻

### Emotion System (Ontology)

Entities have emotional states using the PAD model (Pleasure-Arousal-Dominance):

```json
{
  "material": "character.nervous",
  "essence": "A nervous character",
  "emotion": {
    "valence": -0.3,
    "arousal": 0.8,
    "dominance": 0.3
  }
}
```

**Enable in code:**
```typescript
entity.setEmotion({ valence: 0.8, arousal: 0.6, dominance: 0.7 })
```

⸻

### Temperature & Physics (Environmental)

Entities interact with environmental physics:

```json
{
  "material": "object.hot",
  "essence": "A warm object",
  "temperature": 35,
  "conductivity": 0.8
}
```

**Enable in code:**
```typescript
const world = new World({ features: { physics: true } })
```

⸻

### Communication (Messages & Dialogue)

Entities can send messages and follow dialogue trees:

```json
{
  "material": "npc.merchant",
  "essence": "A talkative merchant",
  "canSpeak": true
}
```

**Enable in code:**
```typescript
const world = new World({ features: { communication: true } })
entity.sendMessage('greeting', 'Hello traveler!', otherEntity)
```

⸻

### Learning & Skills (Cognitive)

Entities can learn from experience and develop skills:

```json
{
  "material": "apprentice.blacksmith",
  "essence": "An apprentice learning the craft",
  "canLearn": true
}
```

**Enable in code:**
```typescript
const world = new World({ features: { cognitive: true } })
entity.enableLearning()
entity.learning.addExperience({
  action: 'forge_sword',
  reward: 0.8,
  timestamp: Date.now()
})
```

⸻

## 🎨 Design Patterns

### If you're a **Developer**

**Start simple:**
```json
{
  "material": "test.basic",
  "essence": "A test entity",
  "manifestation": { "emoji": "🔴" }
}
```

**Then add physics:**
```json
{
  "material": "ball.bouncy",
  "essence": "A bouncy ball",
  "manifestation": { "emoji": "⚽" },
  "physics": {
    "mass": 0.5,
    "friction": 0.02,
    "bounce": 0.9
  }
}
```

**Finally add behavior:**
```json
{
  "material": "ghost.shy",
  "essence": "A shy ghost that hides",
  "manifestation": { "emoji": "👻" },
  "behavior": {
    "onHover": {
      "type": "velocity",
      "value": { "vx": 2, "vy": -2 }
    }
  }
}
```

⸻

### If you're an **Artist/Designer**

Think in **emotions** and **metaphors**:

**Loneliness:**
```json
{
  "material": "emotion.lonely",
  "essence": "A heart that drifts away from others",
  "manifestation": {
    "emoji": "💙",
    "aging": { "start_opacity": 0.8, "decay_rate": 0.01 }
  }
}
```

**Trust field:**
```json
{
  "material": "field.trust",
  "type": "field",
  "origin": "$bind",
  "radius": 150,
  "duration": 8000,
  "visual": { "aura": "warm-glow" }
}
```

⸻

### If you're a **Physicist/Researcher**

You care about **measurable properties**:

```json
{
  "material": "particle.alpha",
  "essence": "High-entropy particle",
  "physics": {
    "mass": 2.0,
    "friction": 0.01,
    "bounce": 0.1
  },
  "manifestation": {
    "emoji": "🔵",
    "aging": { "decay_rate": 0.005 }
  }
}
```

Use **deterministic mode** in world:
```typescript
const world = new World({ seed: 12345 })
```

⸻

## 🚀 Create Your Own Material (5-Minute Tutorial)

### Step 1: Pick a concept
What do you want? (e.g., "a paper that's curious")

### Step 2: Write the essence
```json
{
  "material": "paper.curious",
  "essence": "A paper that leans closer when you look"
}
```

### Step 3: Add visual
```json
{
  "material": "paper.curious",
  "essence": "A paper that leans closer when you look",
  "manifestation": { "emoji": "🐥" }
}
```

### Step 4: Add behavior
```json
{
  "material": "paper.curious",
  "essence": "A paper that leans closer when you look",
  "manifestation": { "emoji": "🐥" },
  "behavior": {
    "onHover": {
      "type": "transform",
      "value": "scale(1.15) translateY(-5px)"
    }
  }
}
```

### Step 5: Save as `.mdm` file
Save your file as `paper.curious.mdm`

### Step 6: Test it
```typescript
import { Engine, loadMaterial } from '@v1b3x0r/mds-core'

const engine = new Engine()
const curious = await loadMaterial('./paper.curious.mdm')
engine.spawn(curious, 200, 200)
engine.start()
```

### Step 7: Iterate
- Too slow? Lower `friction`
- Disappears too fast? Lower `decay_rate`
- Want it to bounce? Increase `physics.bounce`

⸻

## 💡 Pro Tips

1. **Start with essence alone** → see how it behaves raw
2. **Add one property at a time** → easier to debug
3. **Copy existing materials** → `paper.shy.mdm` is a great template
4. **Test in pairs** → spawn 2 entities to see fields emerge
5. **Use notes liberally** → future you will thank you
6. **Use v5 features optionally** → enable only what you need via feature flags

⸻

## 🐛 Common Mistakes

❌ **Forgetting quotes around material name**
```json
"material": paper.shy  // ❌ wrong
"material": "paper.shy"  // ✅ correct
```

❌ **Using reserved keywords as material name**
```json
"material": "field"  // ❌ conflicts with type:"field"
"material": "entity.field"  // ✅ okay
```

❌ **Decay rate too high**
```json
"decay_rate": 0.5  // ❌ disappears in 2 seconds
"decay_rate": 0.005  // ✅ reasonable
```

❌ **Friction = 1**
```json
"friction": 1  // ❌ stops instantly
"friction": 0.05  // ✅ smooth drift
```

⸻

## 🔮 Advanced: Field Specs

Fields are **different** from entities — they're spawned **by relationships**.

```json
{
  "material": "field.trust.core",
  "type": "field",
  "origin": "$bind",
  "radius": 120,
  "duration": 45000,
  "visual": {
    "aura": "radial-gradient(circle, rgba(167,139,250,0.3), transparent)"
  },
  "effect_on_others": {
    "opacity": 0.85
  }
}
```

- `type: "field"` → tells engine this is a field, not entity
- `origin` → where it spawns (`"self"`, `"$bind"`, `"$cursor"`)
- `radius` → effect radius in pixels
- `duration` → lifetime in milliseconds
- `effect_on_others` → how it affects nearby entities

⸻

## 📚 Full Examples

Check `materials/` folder:
- `paper.shy.mdm` → basic interactive paper
- `paper.curious.mdm` → hover-responsive
- `field.trust.core.mdm` → relationship field
- `emotion.trust.mdm` → essence-only minimal

Check `examples/` folder for live demos.

⸻

**That's it!**

You now know everything to create living materials. 🌊

Go make weird stuff. Report bugs on GitHub if you find any.

⸻

_Written in Chiang Mai. Powered by coffee and curiosity._ ☕✨
