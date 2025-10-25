# Smart Home — Your Thermostat Is Now Sentient (Sorry)

**tl;dr:** Black Mirror but cozy. Your fridge judges you. Your lights have opinions.

---

## The Problem

**Normal smart home:**
```
You: "Alexa, 22 degrees"
*every single day*
You: "Alexa, 22 degrees"
*forever*
```

**Smart home with MDS:**
```
Day 1: You set 22°C
Day 7: It just... knows
Day 30: It pre-heats before you get home
Day 60: "Why does my house know me better than my therapist"
```

---

## What This Means

### Your Devices Remember

**Thermostat:**
- Remembers you like 22°C at 7pm
- Remembers you prefer 24°C when it rains
- Remembers you turn it up when guests visit
- Remembers you're cheap and turn it off overnight

**No programming. Just... observation.**

---

### Your Devices Learn

**Coffee maker:**
- Day 1-5: You manually start it at 6:45am
- Day 6: "Should I just... start myself at 6:45am?"
- Day 7: Auto-starts
- Day 20: Notices you wake up 15min earlier on Mondays
- Day 30: Adjusts schedule per weekday

**It learned by watching. Like a creepy roommate. But helpful.**

---

### Your Devices Talk to Each Other

**Morning routine (without you programming it):**
```
6:30am → Alarm goes off
6:31am → Coffee maker: "They're awake, I'll start"
6:35am → Bathroom lights: "They're coming, warm white mode"
6:40am → Thermostat: "Raising temp, they hate being cold after shower"
```

**They... coordinated. On their own. You okay with this?**

---

## Real Examples

### Thermostat
Week 1: You set 22°C manually
Week 4: It pre-heats before you get home
It learned: 22°C normally, 23°C when humid, 20°C when sleeping, 25°C when mom visits

### Lights
Week 1: Observes you stay up til 3am
Week 4: Auto-dims at 10pm (passive-aggressive hint)
Trying to fix your sleep schedule

### Fridge
Remembers you buy kale every week
Remembers you never eat it
Day 120: "Stop buying kale"

---

## How It Works

### No Programming Required

**Traditional:**
```
IF time = 7pm AND day = weekday THEN temp = 22
IF time = 7pm AND day = weekend THEN temp = 23
...
(100 more rules)
```

**MDS:**
```javascript
const thermostat = world.spawn({
  essence: 'Thermostat that learns preferences'
})
thermostat.enable('memory', 'learning')

// That's it. Use it normally. It observes and learns.
```

---

### Devices Form Relationships

```javascript
// Morning routine entities
alarm.enable('relationships')
coffeemaker.enable('relationships')
lights.enable('relationships')

// They discover the connection themselves:
// Alarm goes off → Coffee should start
// Coffee starts → Lights should turn on
// Lights on → Thermostat should warm up

// No automation rules. Just... emergence.
```

---

### Collective Intelligence

Your home has a **mood:**

```javascript
const homeMood = world.getCollectiveEmotion()
// → { valence: 0.7, arousal: 0.3, dominance: 0.5 }
```

**What this means:**
- Valence 0.7 = Home is "happy" (optimal conditions)
- Arousal 0.3 = Home is "calm" (no alerts/issues)
- Dominance 0.5 = Balanced control

**When home is "stressed" (high arousal, low valence):**
- Too hot
- Air quality bad
- Lights flickering
- Multiple devices need attention

**Devices work together to restore balance.**

---

## Privacy

**Everything local:**
- No cloud
- No data sent to manufacturers
- You can inspect memories: `thermostat.memory.getAllMemories()`
- You can delete them: `thermostat.memory.clear()`

**Your sentient home. Your data.**

---

## Setup

```bash
mds-bridge --mqtt your-home-assistant.local
```

Describe devices in plain language. Use them normally. They learn in ~1 week.

**No programming. Automations emerge.**

---

## FAQ

**Q: What if I don't want my house to learn?**
Turn off learning. Back to normal smart home.

**Q: Can devices unlearn bad habits?**
Yes. They forget over time. Or you can manually clear memories.

**Q: What if my thermostat learns the wrong pattern?**
Correct it a few times. It re-learns.

**Q: Is my house spying on me?**
It's observing patterns, not recording details. And it's local-only.

**Q: Can I see what devices remember?**
Yes. Every memory is inspectable.

---

**Your home is watching. Learning. Adapting.**

**Welcome to the future. It's cozy but slightly uncanny.**

---

**Next:** [Education](./education.md) | [Back to Overview](../OVERVIEW.md)
