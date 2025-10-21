# Gaming — NPCs That Actually Remember You're a War Criminal

**tl;dr:** Minecraft villagers but they hold grudges. Skyrim NPCs but they actually remember you stole that sweetroll.

---

## The Problem

**Normal game NPCs:**
- You: *quicksaves*
- You: *murders entire village*
- You: *reloads*
- NPC: "Hello, traveler! Nice day, isn't it?"

**They have amnesia. Every. Single. Time.**

---

## MDS NPCs

**Same scenario:**
- You: *quicksaves*
- You: *murders entire village*
- You: *reloads*
- NPC: "I... I remember. You killed my family. In another timeline. How do I remember this?"

**They remember. And it's lowkey unsettling.**

---

## What This Actually Means

### 1. NPCs With Memory

```json
{
  "essence": "Village blacksmith who remembers every trade"
}
```

**What happens:**
- First trade: "Welcome, stranger!"
- Fifth trade: "Ah, my best customer. Here, discount."
- After you steal: "I remember what you did. Get out."
- Week later: "... I suppose everyone deserves a second chance."

**They remember:**
- What you bought
- What you stole
- What you said
- How long it's been

**No scripting. Just memory + time.**

---

### 2. Enemies That Learn

```json
{
  "essence": "Boss that learns your cheese strats"
}
```

**Normal boss fight:**
- You spam fireball
- Boss dies
- Every playthrough: same strat works

**MDS boss fight:**
- Day 1: You spam fireball → Boss dies
- Day 2: You spam fireball → Boss dodges → You die
- Day 3: You try ice spell → Boss learns again
- Day 4: "Why does this boss counter everything I do??"

**It learns. Mid-fight. No updates needed.**

---

### 3. Companions With Feelings

```json
{
  "essence": "Loyal dog that gets sad when ignored"
}
```

**What you expect:**
- Dog follows you
- Dog attacks enemies
- Dog is happy

**What you get:**
- Ignore dog for 3 days → emotion: sad
- Dog starts walking slower
- Dog stops fetching items
- You finally pet dog → emotion: happy again
- Dog remembers you came back

**Tamagotchi energy but it's your Skyrim follower.**

---

## Real Examples (No Cap)

### Minecraft Villager
**Normal:** Hit villager → mad for 5 min → forgets
**MDS:** Hit villager → remembers forever → tells other villagers → entire village hates you

### Roblox Pet
**Normal:** Adopt pet → leave game → next time: no memory
**MDS:** Ignore pet for 3 days → pet depressed → doesn't trust you when you return

### Boss Fight
**Normal:** Same strategy works every time
**MDS:** Spam fireball Day 1 → works. Day 2 → boss learned to dodge → you die

---

## How To Use This

### Level 0: JSON-Only NPC (v5.1 - Zero Code!)

```json
{
  "material": "npc.shopkeeper",
  "essence": "Grumpy shopkeeper who hates thieves",
  "manifestation": { "emoji": "👨‍🔧" },

  "dialogue": {
    "intro": [{
      "lang": {
        "en": "What do you want?",
        "th": "ต้องการอะไร?"
      }
    }],
    "onPlayerClose": [{
      "lang": { "en": "...You again." }
    }]
  },

  "emotion": {
    "base_state": "neutral",
    "transitions": [{
      "trigger": "player.attack",
      "to": "anger",
      "intensity": 0.9
    }, {
      "trigger": "player.gaze>5s",
      "to": "uneasy",
      "intensity": 0.4
    }]
  }
}
```

**Then:**
```javascript
const npc = world.spawn(material, 100, 100)
console.log(npc.speak('intro'))  // "What do you want?"

// Player attacks
npc.updateTriggerContext({ playerAction: 'attack' })
npc.checkEmotionTriggers()  // NPC automatically gets angry

// Player stares
npc.updateTriggerContext({ playerGazeDuration: 6 })
npc.checkEmotionTriggers()  // NPC gets uneasy
```

**No code needed. Just JSON. NPC talks and reacts.**

---

### Level 1: Add Memory
```javascript
npc.enableMemory = true
npc.remember({
  type: 'theft',
  subject: 'player',
  content: 'Stole healing potion',
  salience: 0.9
})
```

### Level 2: Add Learning
```javascript
npc.enableLearning()
npc.learning.addExperience({
  action: 'player_attacked',
  reward: -1.0  // Bad experience
})
// NPC learns to avoid player
```

### Level 3: Add Relationships
```javascript
npc.enableRelationships()
npc.addRelationship(player.id, 'enemy', -0.9)
// When player helps:
npc.updateRelationship(player.id, 0.5)  // Grudgingly neutral
```

### Level 4: Go Wild
- NPCs form social networks
- Reputation spreads between NPCs
- Collective memory (village remembers)
- Emergent faction dynamics

**You don't script this. It emerges.**

---

## Why This Is Cursed But Cool

**Cursed:** NPCs guilt-trip you. Boss fights require actual strategy. Your Tamagotchi has depression.

**Cool:** Every playthrough different. Consequences feel real. Stories emerge, not scripted.

---

## FAQ

**Q: Do I need AI APIs?**
No. Runs locally. 18KB.

**Q: Will it lag?**
Nah. Unless you spawn 1000+ NPCs.

**Q: Can NPCs forget?**
Yes. Memories decay. Important stuff sticks.

**Q: Is this ethical?**
Making virtual beings suffer? [Read this](../wtf-is-this-really.md)

---

**Your NPCs will remember everything you did. You've been warned.**

---

**Next:** [Smart Home](./smarthome.md) | [Back to Overview](../OVERVIEW.md)
