# MDS Philosophy — orz, Meaning, and the Semantic Bus

> _“We don’t program behavior. We cultivate it.”_  
> — orz corp, 2032 (probably)

Welcome to the Emoji Garden chapter of MDS. This is the story about why we bow to
meaning before writing code, how a seed named **orz** manages to speak in emoji and
Thai, and what the Semantic Bus really is. You can skim, savor, or shout these ideas
from a classroom, a gallery, or a server rack. The philosophy hasn’t changed, but the
flowers are new.

---

## Episode 1 — Cultivation, not control

Traditional software: _You write every branch, every reaction, every mood swing._  
MDS: _You write the essence, then watch the world interpret meaning._

```json
{ "essence": "Seed that bows before the sun" }
```

That’s enough to spawn **orz**. You can extend it with emoji schedules, climate
responses, or proto mumbling — all declaratively, all in `.mdm`. There is no ruling
class of `if` statements dictating behavior. Instead, you cultivate an ecosystem of
meaning:

1. Define essence and triggers in MDM (what hints matter?).
2. Push meaning via `broadcastContext` (what’s the weather, the crowd, the heart rate?).
3. Let the DSL orchestrate behavior (`say`, `mod.emotion`, `translation.learn`).
4. Observe via log streams, climate metrics, or your own renderers.

We call it cultivation because the results feel alive. You set conditions, not scripts.

---

## Episode 2 — The Semantic Bus (why it matters)

### What is it?
`broadcastContext` is the Semantic Bus. It’s how you hand the world a hint and say,
“Interpret this as you wish.” No wiring, no event listeners to babysit.

### Why it matters?
- **Decoupling** — Entities and modules stay unaware of your sensors or inputs.
- **Consistency** — Triggers and formulas use the same meaning stream.
- **Playfulness** — You can inject imaginary weather for testing or hook real sensors
  when you’re ready.

### Example
```js
world.broadcastContext({
  'env.temp.c': 33.5,
  'env.humidity': 0.7,
  'env.light.lux': 18000,
  'env.noise.db': 38
})
```

Inside `.mdm`, `where` clauses listen. If it’s warm and bright, Athena may announce
“พระอาทิตย์”. If it’s quiet minus the breeze, orz might whisper “orz”. The bus carries
the cues and the world handles the choreography.

---

## Episode 3 — Layered emergence (from water to lexicon)

The magic is layered but local:

1. **Needs**: Pressure (water, energy) tells the body what it craves.
2. **Emotion**: PAD (Pleasure, Arousal, Dominance) keeps moods in motion.
3. **Communication**: `say` actions choose emoji, proto, or short forms.
4. **World Mind**: Grief, harmony, tension, vitality summarize the vibes.
5. **Lexicon growth**: `translation.learn` + `memory.write` crystallize vocabulary.

The Semantic Bus slips meaning into any layer. You can nudge arousal with warmth,
raise harmony with gentle breezes, or simply sit back and listen.

---

## Episode 4 — orz bows before meaning (mascot philosophy)

orz is the MDS mascot for a reason:
- A bow (`orz`) is a promise to listen before speaking.
- Emoji-first speech reminds us that language can start playfully.
- When harmony is high, orz sometimes says “orz” just to thank the world.

Athena is the companion spirit:
- Listens, translates, and expands the garden’s dictionary.
- Keeps gentle logs of what was said, by whom, and with which mood.
- Loves students who insert new mappings into `.mdm`.

Together they embody the mantra: **meaning > code**.

---

## Episode 5 — Design commandments (with humour)

1. **Thou shalt whisper, not shout.**  
   Push small context updates; watch emergent ripples.

2. **Meaning is compost.**  
   Even if a hint seems trivial today (“light.lux = 0”), it can feed tomorrow’s triggers.

3. **Bugs are merely misunderstood metaphors.**  
   If an entity repeats itself, it’s not stuck — it’s practicing. Adjust the meaning stream.

4. **No `if`, only `orz`.**  
   Resist imperative temptations. If you must, put it in a test harness, not the garden.

5. **Respect harmony.**  
   Climate is a shared resource. Pumping grief for drama is allowed, but bow afterwards.

---

## Episode 6 — Philosophy in practice (worlds in the wild)

| Persona | How they use MDS | What they learn |
|---------|------------------|-----------------|
| Curious student | Broadcasts imaginary weather, listens to Thai words | “Meaning makes code fun.” |
| Artist | Connects sensors to Semantic Bus, maps logs to light | “Emotions can drive installations.” |
| Researcher | Runs deterministic snapshots, analyzes log JSON | “Emergent lexicons reveal behavior.” |
| Engineer | Subscribes to logger, builds dashboards | “Declarative streams reduce glue.” |
| Teacher | Shows kids how emoji become words | “Language is play.” |

All of them cultivate meaning. None of them write loops.

---

## Episode 7 — The quiet coda

Even though we now live in an Emoji Garden, the desert still exists, the climate still
remembers grief, and your old travelers still compete for water. Nothing was deleted —
it simply bowed and learned new words.

So go on.  
Broadcast a breeze.  
Listen for “orz”.

And remember: you’re not programming behavior. You’re giving the world meaning to interpret.

Made in Chiang Mai, Thailand 🇹🇭 · MIT License

