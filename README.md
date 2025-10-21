# MDS — JSON That Talks Back

![npm version](https://img.shields.io/npm/v/%40v1b3x0r%2Fmds-core?label=npm)
![license](https://img.shields.io/badge/license-MIT-green)
![types](https://img.shields.io/badge/types-TypeScript-3178C6)

> **NPCs that hold grudges. Ghosts that get lonely. JSON files with anxiety.**

---

## What Just Happened?

You write this:

```json
{
  "essence": "Lonely ghost",
  "dialogue": {
    "intro": [{ "lang": { "en": "Why am I alone?" } }]
  }
}
```

**Result:**
- Ghost spawns ✅
- Ghost **speaks** its dialogue ✅
- Ghost gets **lonelier** over time ✅
- Ghost eventually **fades away** ✅

**You wrote zero code.**

---

## Wait, It Speaks?

Yeah. In **any language you want.**

```json
{
  "dialogue": {
    "intro": [{
      "lang": {
        "en": "You see me, but do you remember me?",
        "th": "เธอเห็นฉัน... แต่เธอจำฉันได้ไหม?",
        "ja": "見えているのか…それとも、思い出しているのか？"
      }
    }]
  }
}
```

It auto-detects browser language. Falls back to English. **No translation library needed.**

---

## Wait, It Remembers?

```json
{
  "emotion": {
    "transitions": [
      {
        "trigger": "player.attack",
        "to": "anger",
        "intensity": 0.9
      }
    ]
  },
  "dialogue": {
    "onPlayerAttack": [{
      "lang": { "en": "So you strike your own shadow?" }
    }]
  }
}
```

**What happens:**
1. Player attacks
2. Entity gets **angry** (emotion.valence = -0.54)
3. Entity **says** the dialogue
4. Entity **remembers** being attacked

**Forever.**

---

## Pick Your Adventure

| I Want To... | Go Here |
|--------------|---------|
| 🎮 **Game NPCs** that remember I'm evil | [Gaming](./docs/examples/gaming.md) |
| 🏠 **Smart home** that learns my habits | [Smart Home](./docs/examples/smarthome.md) |
| 🏫 **Simulate** ecosystems for school | [Education](./docs/examples/education.md) |
| 🎨 **Art** that has emotions | [Art](./docs/examples/art.md) |
| 📖 **Stories** where choices matter | [Storytelling](./docs/examples/storytelling.md) |
| 🔬 **Research** with reproducible data | [Research](./docs/examples/research.md) |
| 💻 **Code examples** (for devs) | [Advanced](./docs/examples/advanced.md) |

**Start here:** [3-Minute Overview](./docs/OVERVIEW.md)

---

## Install

```bash
npm install @v1b3x0r/mds-core
```

Or CDN (no install):
```html
<script type="module">
  import { World } from 'https://esm.sh/@v1b3x0r/mds-core'
</script>
```

---

## Before/After

### Normal Code (500 lines)

```javascript
if (player.near(npc)) {
  if (npc.remembers(player)) {
    if (player.attackedBefore) {
      npc.mood = "angry"
      npc.say(getAngryDialogue(npc.language))
    }
  }
}
```

Next chapter? **NPC forgot everything.**

### MDS (12 lines of JSON)

```json
{
  "essence": "NPC who remembers violence",
  "emotion": {
    "transitions": [
      { "trigger": "player.attack", "to": "anger" }
    ]
  },
  "dialogue": {
    "onPlayerClose": [{
      "lang": { "en": "I remember what you did." }
    }]
  }
}
```

Next chapter? **NPC still remembers.** Forever.

---

## Real Example

See [heroblind.mdm](./materials/entities/heroblind.mdm) — a fully functional entity with:
- ✅ Multilingual dialogue (EN, TH, JA, ES, ZH)
- ✅ Emotion triggers (anger, curiosity, fear)
- ✅ Self-monologue (internal thoughts)
- ✅ Event-driven responses
- ✅ Memory of interactions

**277 lines of JSON. Zero code.**

---

## Who This Is For

Ages 12+ | Minecraft players | Students | Artists | Game devs | Researchers

**You don't need to code.** Just describe what something **IS**, and behavior emerges.

---

## Features You Get for Free

When you describe an entity, you automatically get:

🧠 **Memory**
- Entities remember interactions
- Memories decay over time (Ebbinghaus curve)
- Important events stick longer

💚 **Emotion**
- PAD model (Pleasure, Arousal, Dominance)
- Emotional contagion (entities affect each other)
- Trigger-based transitions

💬 **Dialogue**
- Multilingual support (any language)
- Event-driven phrases
- Auto-detects user language

🎓 **Learning**
- Entities learn from rewards
- Skills improve with practice
- Q-learning built-in

🌍 **Physics**
- Entities move based on similarity
- Info-physics (meaning creates gravity)
- Environmental effects

💾 **Save/Load**
- Full world state serialization
- Memories survive page refresh
- Deterministic replay

---

## Links

- 📖 [3-Minute Overview](./docs/OVERVIEW.md)
- 📚 [Full Documentation](./docs/)
- 💻 [API Reference](./docs/REFERENCE.md)
- 🤯 [Philosophy](./docs/wtf-is-this-really.md)
- 💬 [Discussions](https://github.com/v1b3x0r/mds/discussions)
- 🐛 [Issues](https://github.com/v1b3x0r/mds/issues)

---

> _"I wanted NPCs that remember I quicksaved before killing them. Now they do."_

**Made in Chiang Mai, Thailand 🇹🇭 | MIT License**
