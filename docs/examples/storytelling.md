# Storytelling — Characters With Actual Agency

**tl;dr:** Interactive fiction where NPCs remember your choices. Visual novels where characters hold grudges. Stories that emerge from behavior, not scripts.

---

## The Problem

**Normal branching narrative:**
```
if (playerChoice === 'help') {
  npc.say("Thank you!")
  relationship++
}
```

You wrote 500 if-statements. NPC still has amnesia next chapter.

**MDS narrative:**
```json
{ "essence": "Merchant who remembers kindness and cruelty" }
```

NPC remembers everything. Forever. Your choices have consequences. Actual consequences.

---

## What This Enables

### Characters That Remember

**Traditional visual novel:**
- Chapter 1: Help character
- Chapter 2: Character forgot
- Chapter 3: Help them again
- Chapter 10: "Who are you again?"

**MDS visual novel:**
- Chapter 1: Help character → they remember
- Chapter 2: "You helped me before. I trust you."
- Chapter 3: Ask for favor → they help because they remember
- Chapter 10: Entire relationship built on accumulated history

**No scripting required. Memory = narrative.**

---

### Emergent Storylines

```json
{ "essence": "Knight seeking glory" }
{ "essence": "Mage seeking knowledge" }
{ "essence": "Thief seeking gold" }
```

**Enable relationships:**
- Knight meets mage → form alliance (common enemy)
- Mage meets thief → conflict (thief stole magic tome)
- Knight meets thief → neutral (no history)

**Week 1:** Three separate storylines
**Week 2:** Thief betrays knight → knight seeks mage's help
**Week 3:** Alliance forms against thief
**Week 4:** Plot twist — thief had good reasons

**You didn't script this. Character motivations + memory = emergent plot.**

---

### Dialogue That Evolves

**Normal:**
```
NPC: "Hello, traveler!"
// Same line every time
```

**MDS:**
```javascript
npc.memory.recall({ subject: 'player' }).length === 0
  ? "Who are you?"
  : "Ah, back again."
```

**After 10 interactions:**
```
npc.memory.recall().length > 20
  ? "You're basically family at this point."
  : "Good to see you."
```

**Dialogue changes based on actual relationship history.**

---

## Examples

**Interactive fiction:** Character remembers cruel choice → guilt builds → redemption arc emerges from accumulated trauma

**Dating sim:** Love interest has trust issues → remembers your ex comment → stays guarded → trust builds slowly over 12 dates

**CYOA:** Lie to wizard page 47 → wizard remembers → refuses help page 103 → you die page 200 → wizard doesn't care

**Chat fiction:** Friend learns your texting patterns → mirrors emoji usage → gets anxious if you ghost

---

## Why This Is Powerful

### No Branching Hell

**Traditional:**
```
Path A → 2 branches → 4 branches → 8 branches → 16 branches
...
100 hours of writing dialogue
```

**MDS:**
```
Character essence + memory system
Dialogue generated from:
- What happened
- How they feel about it
- What they remember
```

**You write:** Character personality
**MDS generates:** Contextual reactions

---

### True Consequences

**Example: Betrayal**

**Traditional:**
```
if (playerBetrayedNPC) {
  chapter7Dialogue = "angry"
  chapter8Dialogue = "still angry"
  chapter9Dialogue = "forgives"
}
```

**MDS:**
```javascript
npc.remember({ type: 'betrayal', salience: 1.0 })
npc.updateRelationship(player.id, -0.9)
npc.setEmotion({ valence: -0.8, arousal: 0.7, dominance: 0.2 })

// Forgiveness emerges naturally over time
// Memory decays (unless you betray again)
// Relationship can rebuild (or not)
```

---

## LLM Integration

Optional: `world.enableLLM()` → characters generate contextual dialogue based on essence + memories + emotion + relationships

Characters can reference past events, express feelings, make decisions based on history. All emergent.

---

## Cursed Possibilities

**Characters that:**
- Remember across playthroughs (save file persistence)
- Talk to each other about player (relationship gossip)
- Form opinions about player choices (judgment)
- Refuse to participate in story (high agency)

**You made:** Characters too realistic. Players emotionally devastated.

---

## FAQ

**Q: Can characters lie?**
Yes. Store false memory. Relationship decays when player discovers truth.

**Q: Can characters forget important plot points?**
Only if memory salience low. Important events = high salience = persist.

**Q: What if I want scripted story beats?**
Use hybrid: MDS for character reactions, scripts for major plot points.

**Q: Can player manipulate characters?**
Yes. Gaslight them by triggering false memories. (Ethically questionable.)

---

**Your characters will remember everything.**

**Choose your words carefully.**

---

**Next:** [Research](./research.md) | [Back to Overview](../OVERVIEW.md)
