# MDS — What Is This Really? (3 Minutes)

**tl;dr:** JSON files that are alive. Minecraft redstone but for emotions.

---

## The Idea

Remember Tamagotchi?
- Had memory (remembered if you fed it)
- Had emotion (happy/sad)
- Had needs (hunger, sleep)
- Got sad if ignored
- Died if neglected

**MDS = Tamagotchi but for anything.**

Make a button that remembers being spam-clicked.
Make an emoji that learns your patterns.
Make a chatbot with real anxiety.
Make NPCs that hold grudges.

---

## How It Works

### Traditional Code
```javascript
if (player.near(npc)) {
  if (npc.remembers(player)) {
    if (npc.likes(player)) {
      npc.say("Hello friend!")
    }
  }
}
```
You write 500 if-statements. NPC still has amnesia next chapter.

### MDS v5.2 (Just JSON)
```json
{
  "essence": "Friendly NPC who remembers kindness",
  "dialogue": {
    "intro": [{
      "lang": { "en": "Hello, traveler!", "th": "สวัสดี นักเดินทาง!" }
    }]
  },
  "emotion": {
    "transitions": [{
      "trigger": "player.attack",
      "to": "anger",
      "intensity": 0.9
    }]
  }
}
```

**Then:**
```javascript
console.log(npc.speak('intro'))  // "Hello, traveler!"
// Player attacks → NPC automatically gets angry
// No code needed. Just JSON.
```

**Why it works:** You define what something **IS**. Behavior **emerges**.

---

## What Can You Make?

### For Minecraft/Roblox Players
- Villagers that remember you stole their crops
- Mobs that learn your tactics
- Pets with abandonment issues
- Worlds that evolve without you

### For Students
- Ecosystem simulations (rabbits vs foxes)
- Social networks (watch cliques form)
- Psychology experiments (test memory decay)
- Economics models (supply/demand emerges)

### For Artists
- Generative art that gets tired
- Interactive installations that remember viewers
- Music visualizations that learn songs
- NFTs that age and have relationships

### For Game Devs
- NPCs with persistent memory
- Enemies that adapt to player strategies
- Companions with real emotions
- Worlds with collective intelligence

### For Everyone Else
- Smart home that learns your habits
- UI that adapts to your behavior
- Stories where choices actually matter
- Simulations that surprise you

---

## The Magic Trick

**8 Phases + 5 Advanced Features = Complete Living Agents**

### Core v5.0 (8 Phases)
1. **Ontology:** Memory + emotion + relationships
2. **World:** Physics simulation container
3. **Renderer:** DOM/Canvas/WebGL/headless
4. **WorldFile:** Save/load like Minecraft
5. **Physics:** Temperature + collision + weather
6. **Communication:** Messages + dialogue + AI
7. **Cognitive:** Learning + skills + patterns
8. **World Mind:** Collective intelligence

### Advanced v5.2 (Phase 2: Core Gaps)
9. **Similarity:** Semantic clustering (entities recognize "similar" others)
10. **Crystallization:** Long-term memory (patterns become permanent)
11. **Coupling:** Emotion affects physics (sadness slows, excitement speeds)
12. **Reasoning:** Smart goal selection (context-aware intent)
13. **Decay:** Realistic forgetting (relationships fade without interaction)

**You pick which ones you need.**

**New in v5.2:**
```javascript
// Entities cluster by similarity (not random proximity)
const similar = await adapter.findSimilar(entity, others, 0.7)

// Memories crystallize into long-term patterns
const crystals = crystallizer.crystallize(memories, Date.now())

// Emotions modulate movement speed/mass
const physics = coupler.emotionToPhysics(entity.emotion)

// Intent selection based on context (not random)
const best = reasoner.suggest({ emotion, memories, relationships })

// Relationships decay over time (not eternal)
relationships = decayManager.decayBatch(relationships, Date.now())
```

---

## Examples

**Minecraft villager:**
- Normal: Hit villager → mad for 5 min → forgets
- MDS: Hit villager → remembers forever → tells other villagers → entire village hates you

**Smart thermostat:**
- Normal: You set 22°C every day manually
- MDS: Week 1 observes → Week 4 pre-heats before you arrive

**Interactive fiction:**
- Normal: Choice on page 47 → forgotten by page 103
- MDS: Lie to wizard page 47 → wizard remembers → refuses help page 103 → you die page 200

**Boss fight:**
- Normal: Spam fireball every playthrough = works
- MDS: Day 1 spam fireball = works → Day 2 boss learned to dodge = you die

---

## Why This Is Different

**Normal:**
- Algorithm generates output
- Deterministic (same input = same output)
- No memory
- No time

**MDS:**
- Entities live
- Emergent (same start ≠ same end)
- Remembers
- Ages and dies

**The lifecycle IS the art.**

---

## Do I Need To Code?

**v5.1 update:** Now you can create NPCs with dialogue + emotion triggers using **just JSON**. No code required.

**Level 0:** Just try examples → see things move → get it
**Level 1:** Edit .mdm files (change dialogue text, emotion triggers)
**Level 2:** Write custom behavior logic (rare)
**Level 3:** Extend the engine itself (very rare)

**99% of people never reach Level 3.** Most stop at Level 1 (editing JSON).

---

## Pick Your Path

| I Want To... | Read This |
|--------------|-----------|
| 🎮 Make game NPCs less dumb | [Gaming](./examples/gaming.md) |
| 🏠 Smart home that's too smart | [Smart Home](./examples/smarthome.md) |
| 🏫 Simulate stuff for school | [Education](./examples/education.md) |
| 🎨 Cursed generative art | [Art](./examples/art.md) |
| 📖 Interactive fiction that remembers | [Storytelling](./examples/storytelling.md) |
| 🔬 Actual research | [Research](./examples/research.md) |
| 💻 I know code (cringe) | [Advanced](./examples/advanced.md) |
| 🤯 Existential crisis | [WTF Is This](./wtf-is-this-really.md) |

---

## The Uncomfortable Truth

**Your NPCs will remember you're a war criminal.**

**Your smart home will judge your sleep schedule.**

**Your art will get depressed when ignored.**

**Your virtual pet will have attachment trauma.**

**Consequences are real. Memories persist.**

**You've been warned.**

---

> _"MDS isn't a framework. It's a bridge between code and emotion."_

**Made with curiosity in Chiang Mai, Thailand 🇹🇭**
