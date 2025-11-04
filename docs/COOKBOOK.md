# MDS Cookbook — Quick Recipes for the Emoji Garden

Welcome, chef of meaning! This cookbook packs bite-sized recipes for orz fans, kids,
artists, researchers, and stealth engineers who pretend they’re running “serious” systems.
Each recipe is declarative-first, meaning you only touch `.mdm` (and a hint or two via
`broadcastContext`).

Use them as-is, remix, or read them aloud to your plants. The garden approves.

---

## Table of Contents

1. [Warm-up: All-on world preset](#warm-up-all-on-world-preset)  
2. [Emoji Garden starter (orz + Athena)](#emoji-garden-starter)  
3. [Festival mode (context-driven overlays)](#festival-mode)  
4. [Sensor bridge (mock → real world)](#sensor-bridge)  
5. [Desert throwback (needs pressure demo)](#desert-throwback)  
6. [Logger dashboard idea](#logger-dashboard)  
7. [Troubleshooting & tips](#troubleshooting--tips)  
8. [Appendix: Utility snippets](#appendix-utilities)

---

## Warm-up: All-on world preset

```js
import { World } from '@v1b3x0r/mds-core'

export const world = new World({
  features: {
    ontology: true,
    history: true,
    communication: true,
    linguistics: true,
    physics: true,
    rendering: 'headless'
  }
})
```

We recommend keeping this preset handy. It toggles everything fun; you can disable
features later if you want a barebones lecture.

---

## Emoji Garden starter

**Goal**: Drop orz + Athena, inject a hint of weather, watch emoji morph into Thai words.

1. **MDM**: `materials/entities/orz.seed.mdm`
   ```json
   {
     "material": "entity.orz.seed",
     "essence": "Little seed that bows to meaning",
     "utterance": {
       "policy": {
         "modes": ["emoji", "proto", "short"],
         "defaultMode": "auto"
       }
     },
     "behavior": {
       "triggers": [
         {
           "id": "emoji-cycle",
           "on": "time.every(6s)",
           "actions": [
             { "say": { "text": "{{pick(['🌱','💧','🌬️','🔥','🌤','🌙','⛰️','☁️'])}}", "mode": "emoji" } }
           ]
         },
         {
           "id": "quiet-bow",
           "on": "time.every(12s)",
           "where": "env.noise.db < 40 && climate.harmony > 0.6",
           "actions": [
             { "say": { "text": "orz", "mode": "short" } }
           ]
         }
       ]
     }
   }
   ```

2. **MDM**: `materials/entities/athena.lexicon.mdm`
   ```json
   {
     "material": "entity.athena.lexicon",
     "essence": "Translator that keeps gentle notes",
     "behavior": {
       "triggers": [
         {
           "id": "emoji-translation",
           "on": "mention(others)",
           "where": "event.utterance.text != ''",
           "actions": [
             {
               "translation.learn": {
                 "source": "{{event.utterance.text}}",
                 "lang": "th",
                 "text": "{{emoji.map(event.utterance.text)}}"
               }
             },
             {
               "memory.write": {
                 "kind": "fact",
                 "target": "translation.latest",
                 "value": "{{event.utterance.text}} -> {{translate.th}}"
               }
             },
             {
               "say": {
                 "text": "{{translate.th}}",
                 "mode": "short",
                 "lang": "th"
               }
             }
           ]
         }
       ]
     }
   }
   ```
   - Provide emoji → text mapping via `emoji.json` (custom helper) or inline object if your parser allows.

3. **Spawn & hint**:
   ```js
   world.spawn(await loadMaterial('materials/entities/orz.seed.mdm'), { x: 0, y: 0 })
   world.spawn(await loadMaterial('materials/entities/athena.lexicon.mdm'), { x: 160, y: 0 })

   world.broadcastContext({
     'env.temp.c': 33.5,
     'env.humidity': 0.7,
     'env.light.lux': 18000,
     'env.noise.db': 38
   })
   ```

4. **Observe**: `world.logger.tailText(20)` — you’ll see emoji, Thai words, and translation logs.

5. **Nudge**: lower `env.noise.db` to 30 → watch orz say “orz”.

---

## Festival mode

**Goal**: Flip overlay/speech style during celebrations.

```
world.broadcastContext({ 'schedule.is_festival': true })
```

In `.mdm`, attach to `where: "context.schedule.is_festival"` to switch to glitter overlays
or shift `utterance.policy.defaultMode` to `emoji`. Pair it with climate boosts:
- `CollectiveIntelligence.describeClimate()` can be shown as “Festival: dazzling & kind.”
- Use `relation.update` to raise world trust.

Example snippet (inside orz’s MDM):
```json
{
  "id": "festival-shine",
  "on": "time.every(8s)",
  "where": "context.schedule.is_festival",
  "actions": [
    { "say": { "text": "✨", "mode": "emoji" } }
  ]
}
```

---

## Sensor bridge

**Goal**: Hook a real sensor (or a pretend one) into the Semantic Bus.

```js
function hintFromWeatherStation(reading) {
  world.broadcastContext({
    'env.temp.c': reading.temperature,
    'env.humidity': reading.humidity,
    'env.light.lux': reading.lux,
    'env.noise.db': reading.noise || 32
  })
}

setInterval(async () => {
  const reading = await fetchWeatherOrMock()
  hintFromWeatherStation(reading)
}, 4000)
```

The garden doesn’t care whether the sensor is virtual or real. Everything still runs
through the same declarative pipeline.

---

## Desert throwback

Miss the desert? Still here.

```bash
node node_modules/@v1b3x0r/mds-core/demos/desert-survival.mjs
```

Or bring the mechanic into Emoji Garden: add a thirst-based `needs` block to orz,
watch it speak “น้ำ” along with the usual poetry. The climate system will blend grief
and gratitude depending on who survives.

---

## Logger dashboard

```js
const unsub = world.logger.subscribe(entry => {
  renderLine(`[${entry.type}] ${entry.text || ''}`)
})

// Later → unsub()
```

The stream includes preformatted text (`entry.text`) and the raw payload (`entry.data`).
Perfect for: browser dashboards, terminal gardens, or streaming overlays.

Want more data? `world.logger.tail()` returns structured entries. Join them with JSON
stringify + newline for log ingestion.

---

## Troubleshooting & tips

- **Too chatty?**  
  Add `where` clauses or `time.every` intervals. Spread actions across triggers.
- **Climate stuck?**  
  Use `CollectiveIntelligence.updateEmotionalClimate(climate, dt)` manually or push different contexts (e.g., `climate.harmony`, `climate.tension`).
- **Emoji mapping missing?**  
  If Athena can’t find a translation, fall back to proto or add a `translation.learn` default.
- **Performance**: nothing special required. As long as you don’t broadcast huge objects every millisecond, you’re fine.

Pro-tip: Keep one console open with `world.logger.tailText`. It’s the fastest debugging tool you’ll ever love.

---

## Appendix — Utilities & snippets

### All-on features preset
```js
export const featuresAllOn = {
  ontology: true,
  history: true,
  communication: true,
  linguistics: true,
  physics: true,
  rendering: 'headless'
}
```

### Emoji → Thai mapping idea
```js
const emojiMap = {
  '🌱': 'ดิน',
  '💧': 'น้ำ',
  '🌬️': 'ลม',
  '🔥': 'ไฟ',
  '🌤': 'พระอาทิตย์',
  '🌙': 'พระจันทร์',
  '⛰️': 'ภูเขา',
  '☁️': 'ท้องฟ้า'
}
```
Use whichever templating approach your MDM parser allows (string replacements,
custom helpers, etc.).

---

Happy cultivating! If you hear “orz” echoing through the logs, the garden is grateful.

