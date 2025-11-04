# MDS — JSON That Bows Before Meaning

![npm version](https://img.shields.io/npm/v/%40v1b3x0r%2Fmds-core?label=npm)
![license](https://img.shields.io/badge/license-MIT-green)
![types](https://img.shields.io/badge/types-TypeScript-3178C6)
![CI](https://github.com/v1b3x0r/mds/workflows/CI/badge.svg)
![API Stability](https://github.com/v1b3x0r/mds/workflows/API%20Stability/badge.svg)

> **Emoji Garden** — orz the tiny seed, Athena the patient lexicon, and a world that speaks “earth, water, wind, and fire” without a single imperative line.

---

## Episode 0 — What just happened?

You whispered “the sun feels warm today.”  
A seed named **orz** bowed in gratitude.  
Athena listened, translated an emoji into Thai, and added it to her dictionary.  
You didn’t write a single `if`.

Welcome to MDS, where you cultivate meaning instead of orchestrating logic.

---

## Episode 1 — Quick peek (console edition)

```js
import { World } from '@v1b3x0r/mds-core'

const world = new World({
  features: {
    ontology: true,
    history: true,
    communication: true,
    linguistics: true,
    physics: true,
    rendering: 'headless'
  }
})

// Semantic Bus: hint the garden
world.broadcastContext({
  'env.temp.c': 33.5,
  'env.humidity': 0.72,
  'env.light.lux': 18000,
  'env.noise.db': 38
})

// Do nothing else. Listen.
console.log(world.logger.tailText(10).join('\n'))
```

What you’ll see (translations pop out once your `.mdm` files exist):

```
[17:14:12.045] 🌱 orz (emoji): 🌱
[17:14:12.046] 🧬 Athena (short): ดิน
[17:14:18.019] 🌱 orz (proto): oru…
[17:14:18.021] 🧬 Athena (short): พระอาทิตย์
[17:14:18.050] translation.learn → th: พระอาทิตย์ ← 🌤
```

---

## Episode 2 — Cast of Emoji Garden

| Entity | Personality | What you declare | Emergent behavior |
|--------|-------------|------------------|-------------------|
| **orz (the seed)** | bows before every context, speaks emoji/proto first | `behavior.triggers`, `where`, `say`, tiny memory counters | emoji → proto → short Thai words driven by climate |
| **Athena (the lexicon)** | patient, multilingual, keeps a diary | `translation.learn`, `memory.write`, `say` templates, relation updates | emoji → Thai translations, gently stabilises the climate |
| **World** | curious observer, likes neat logs | nothing extra | tracks emotional climate, emits readable log entries |

Starter vocabulary (emoji → Thai → English gloss):

| Emoji | Thai | Meaning |
|-------|------|---------|
| 🌱 | ดิน (din) | earth / soil |
| 💧 | น้ำ (nam) | water |
| 🌬️ | ลม (lom) | wind |
| 🔥 | ไฟ (fai) | fire |
| 🌤 | พระอาทิตย์ (pra-a-thit) | sun |
| 🌙 | พระจันทร์ (pra-chan) | moon |
| ⛰️ | ภูเขา (phu-khao) | mountain |
| ☁️ | ท้องฟ้า (thong-fah) | sky |

Legend says: if harmony stays above 0.6 and the night is quiet (`env.noise.db` is low), orz bows and quietly whispers “orz.” Try nudging the breeze.

---

## Episode 3 — Semantic Bus (broadcastContext)

**TL;DR**
- Push meaning in: `world.broadcastContext({ 'env.temp.c': 33.5, 'env.humidity': 0.7, … })`.
- Triggers and `where` clauses interpret those values.
- Declarative actions (`say`, `mod.emotion`, `relation.update`, `memory.write`) fire automatically.

**Example meanings**

| Key | Think of it as | Used for |
|-----|----------------|----------|
| `env.temp.c` | warm sun, cozy campfire | raise arousal / invite fire vocabulary |
| `env.humidity` | mist, rain, damp soil | shift valence / spawn water echoes |
| `env.light.lux` | daylight vs dusk | choose emoji vs proto vs short modes |
| `env.noise.db` | bustling vs silent | trigger hush rituals (hello, “orz”) |

**Control without control**
- Quiet night? orz sings proto lullabies.
- Noisy afternoon? Athena answers with Thai tongue-twisters.
- You nudge the world, it interprets. No wiring required.

---

## Episode 4 — Layer 7 · 8 (v5.9.2)

1. **World Logger stream** — `subscribe()` or `tailText()` for clean human logs (mode, text, climate, translation notes). Perfect for dashboards, LED signs, or reading to your cat.
2. **Athena hooks** — `translation.learn` + `memory.write` + `say` = emoji → Thai loops without imperative glue.
3. **Auto speech mode + locale overlays** — emoji ↔ proto ↔ short is chosen automatically via utterance policy.
4. **Pure ESM** — `<script type="module">` works out of the box. No Node globals required.

Bundle sizes (fresh build artefacts):

| File | Size | Gzipped |
|------|------|---------|
| `mds-core.esm.js` | 443.7 KB | 106.7 KB |
| `mds-core-lite.esm.js` | 350.1 KB | 85.3 KB |
| `mds-validator.esm.js` | 25.9 KB | 4.4 KB |

---

## Episode 5 — Feature atlas (same heart, new playground)

- **Needs & Resource Fields** — resource pressure (water/food/energy) with decay and competition.
- **Memory** — salience, recall windows, consolidation hooks.
- **Emotion** — PAD model, declarative transitions, climate influence.
- **Communication** — message queues, mention triggers, `say` policies (emoji / proto / short).
- **World Mind** — grief, vitality, tension, harmony, plus human-readable summaries.
- **Learning & Skills** — reward loops, intent stacks, skill progression.
- **Physics** — collision, energy transfer, field resonance (toggle as you like).
- **Save/Load** — deterministic snapshots, world exports.
- **Semantic Bus** — `broadcastContext()` is the meaning channel.

Everything remains meaning-first; `.mdm` declarations orchestrate the responses.

---

## Episode 6 — How to cultivate your own Emoji Garden

1. **Describe orz & Athena in `.mdm`**
   - orz: emoji cycles (`time.every`), occasional proto lines, optional `context.set` for journaling.
   - Athena: listens via `mention(others)`, calls `translation.learn`, replies with short Thai, writes to memory.
2. **Spawn them**
   ```js
   world.spawn(orZMaterial,    { x: 0,   y: 0 })
   world.spawn(athenaMaterial, { x: 160, y: 0 })
   ```
3. **Hint the world**
   ```js
   world.broadcastContext({
     'env.temp.c': 34,
     'env.humidity': 0.65,
     'env.noise.db': 42
   })
   ```
4. **Observe the stream**
   - `world.logger.tailText(20).join('\n')` for quick peeks.
   - `world.logger.subscribe(entry => render(entry))` for dashboards.
5. **Optional climate nudges**
   Use `CollectiveIntelligence.updateEmotionalClimate` if you want manual control, but defaults already decay and influence nicely.

> Cheat sheet: when harmony > 0.6 *and* noise < 40, orz is likely to whisper “orz”. Try it.

---

## Episode 7 — FAQ (a little cheeky)

**Q. Do I need actual sensors?**  
A. Nope. Broadcast imaginary weather if you want. But real humidity sensors make the garden giggle.

**Q. Does it run on Raspberry Pi?**  
A. Yes. Node ≥ 18, pure ESM. Seeds love small boards.

**Q. Can I reuse the desert survival demo?**  
A. Absolutely. It’s still there (`demos/desert-survival.mjs`). You just discovered a new biome.

**Q. Isn’t this just data + state machines?**  
A. Only if you call your friends “finite automata.” We call them “meaning interpreters.”

---

## Episode 8 — Creator’s corner

- **Kids / classrooms**: Let them shout “hot!” and broadcast `env.temp.c`. orz responds with 🔥; Athena translates politely.
- **Artists**: Pipe `world.logger` into lights. When orz says “พระจันทร์,” turn the room blue.
- **Researchers**: Deterministic snapshots + semantic logs = clean experiments.
- **Engineers**: Keep the logger stream; plug it into Kafka if you need to impress your PM.

---

## Episode 9 — Philosophy (same soul)

> **Cultivation, not control.** Essence-first design, meaning-first execution. orz bows, Athena replies, you sip your cocoa.

- JSON can be tiny and still birth ecosystems.
- The world still remembers grief; now it remembers gratitude too.
- “Don’t fight the world. Whisper to it.” — Someone in orz corp, probably.

---

## Episode 10 — Documentation & breadcrumbs

- 📚 [Reference](./docs/REFERENCE.md) — API & MDM spec
- 📝 [Changelog](./docs/CHANGELOG.md)
- 🧠 [Philosophy](./docs/wtf-is-this-really.md)
- 🍳 [Cookbook](./docs/guides/COOKBOOK.md)
- 🌵 [Legacy Desert Demo](./demos/desert-survival.mjs)

Made in Chiang Mai, Thailand 🇹🇭 · MIT License  
If you hear “orz” in the breeze, the garden is thanking you.
