# MDS Field Guide — Anatomy of a Living World

> *"What if JSON could be alive?"*

This document is not an API reference. It reads the source code the way an
anthropologist reads an artifact: **if you studied everything this engine does,
what would you conclude its creator believes about how worlds work?**

You will not find method signatures here. You will find what each layer of the
world *is*, which human science it secretly borrows from, what would be lost if
it vanished, and how one ordinary rainstorm travels through all eight layers and
comes out the other side as language.

Code anchors appear only at the end of each chapter, so the ideas stay in front.

---

## What MDS is NOT

People keep trying to put MDS into a familiar box. It does not fit:

- **Not a chatbot framework.** Conversation exists, but it is one organ among eight.
- **Not a game engine.** There are no sprites, no scenes, no game loop API. There is a world that ticks.
- **Not a memory database.** Memories decay, distort, and crystallize. A database that forgets on purpose is a terrible database — and that's the point.
- **Not an agent runtime.** Entities are not task executors. They are beings with inner weather.

**What it IS:** a layered model of how worlds, entities, memories, emotions, and
relationships interact — written as runnable TypeScript instead of a philosophy
paper.

---

## The World Stack at a Glance

Eight layers, numbered from bedrock up. Each answers one question:

| # | src name | Field-guide name | The question it answers |
|---|----------|------------------|------------------------|
| 0 | `0-foundation` | **What Exists** | What counts as being real? |
| 1 | `1-ontology` | **The Inner Life** | What does it mean to remember, feel, want, bond? |
| 2 | `2-physics` | **The Material World** | What constrains bodies — and can feelings push them? |
| 3 | `3-cognition` | **The Learning Mind** | How do beings get better at being themselves? |
| 4 | `4-communication` | **Between Minds** | How do inner lives reach each other? |
| 5 | `5-network` | **Between Worlds** | What connects minds across distance — and what fades? |
| 6 | `6-world` | **The Container** | What holds it all together? What is time? |
| 7 | `7-interface` | **The Boundary** | How does the world meet humans? |

Note the order. **Existence comes before physics.** In this cosmology, a thing
first *is* (layer 0), then has an inner life (layer 1), and only *then* is
subject to weather and collision (layer 2). Most simulations are built the
other way around. This one decided that identity is more fundamental than
matter.

---

## The Spine: One Rainstorm

To keep eight chapters honest, we follow a single event through every layer:

> Night. Two entities — call them the **ghost** (essence: *"lonely ghost who
> remembers rain"*) and the **keeper** — exist in a small world with one well.
> It starts to rain.

Each chapter picks up the storm where the previous one left off.

---

## Layer 0 — What Exists

Before weather, before feeling, before language, the world makes a small set of
non-negotiable commitments: a being has **identity** (it stays itself), a
**place** (x, y), a **velocity**, an **age** that only increases, and two
strange numbers — **entropy** and **energy** — that act as its informational
fingerprint.

Then comes the first genuinely odd belief: **similar beings attract**. Not
metaphorically — as literal force. Every tick, the engine compares entropy
fingerprints between nearby entities, and the more alike two beings are, the
harder they pull toward each other. Newton's third law is applied to
*resemblance*. The codebase calls this **info-physics**: data has gravity.

Two quieter commitments hide here too. Every being is born with a random
**emotional resilience** — a temperament, rolled once at spawn, that scales
every emotional blow for the rest of its life. Two entities in identical
situations will have different emotional arcs, not because anyone scripted
personalities, but because one was simply born thicker-skinned. And repeated
emotional shocks saturate: the third sad thing in eight seconds hits much
softer than the first. Tolerance is built into the substrate.

Finally: **essence**. A being can be described in one line — `{ "essence":
"lonely ghost" }` — and the foundation treats that text as opaque, sacred
identity. It does not parse it. It carries it, negotiates which language to
express it in (Thai is checked first), and hands it upward for other layers to
interpret.

**In the rain:** nothing has "happened" yet — but the ghost and the rain cloud
have similar fingerprints, so the ghost has already been drifting toward the
storm for a while. Affinity precedes events.

> **Atlas card — Layer 0**
> - **Role:** defines existence: identity, position, age, info-physics attraction
> - **Inspired by:** Newtonian mechanics, information theory, PAD psychology, seeded-randomness determinism (Mulberry32)
> - **If removed:** no persistent identity, no motion, no time's arrow — the world is static JSON
> - **Feeds:** every layer; entity is the vessel all other systems plug into
> - **Code anchors:** `src/0-foundation/engine.ts` (tick, similarity force), `entity.ts` (identity, resilience, essence negotiation), `field.ts`

---

## Layer 1 — The Inner Life

Here the engine declares what an inner life is made of: **memory** (what I have
lived), **emotion** (how I am right now), **intent** (what I want), and
**relationships** (who matters to me). Each system works alone; together they
compose a soul-shaped thing.

The borrowings are explicit, almost academic. Emotion is the
**Pleasure-Arousal-Dominance** model — the Mehrabian & Russell citation sits in
a code comment. Memory decays along an **Ebbinghaus curve**: every memory has a
salience that fades unless rehearsed. Relationships carry **trust** and
**familiarity** separately, like attachment theory rendered as two floats.

But the engine's own beliefs leak through the defaults, and they are
opinionated:

- **Repetition earns permanence.** A memory that recurs three times
  *crystallizes* — and crystals are immune to decay. Forever. The forgetting
  curve has an escape hatch, and the escape hatch is ritual.
- **Trust outlives warmth.** When two beings stop meeting, familiarity decays
  at full speed but trust decays at *half* speed. Long after you've forgotten
  someone's laugh, you still remember whether you could lean on them.
- **Emotion is multilingual.** Forty-plus Thai emotional states are mapped into
  PAD space natively — เหงา, ขี้อาย, เกรงใจ — not translated through English
  first.

**In the rain:** the ghost gets cold (that's the next chapter's doing), its
valence dips, and the moment writes itself into memory with high salience:
*rain, night, discomfort, the keeper was there*. If rainy nights with the
keeper keep happening, this memory will crystallize — and the bond will outlive
every individual night that built it.

> **Atlas card — Layer 1**
> - **Role:** the inner life: memory, emotion, intent, relationships
> - **Inspired by:** PAD model (Mehrabian & Russell 1974), Ebbinghaus forgetting curve, attachment theory, salience/rehearsal memory research, Thai emotional vocabulary
> - **If removed:** a hollow physics sandbox — encounters with no history, feelings with no continuity
> - **Feeds:** emotion → physics coupling; crystallized memories → intent ("bond with what recurs"); relationships gate dialogue and sharing
> - **Code anchors:** `src/1-ontology/memory/` (buffer, consolidation, crystallization), `emotion/` (state, detector), `relationships/bond.ts`, `intent/reasoner.ts`

---

## Layer 2 — The Material World

Now matter pushes back. Heat flows from hot to cold (the second law, written
out in a comment). Rain follows intensity curves; evaporation slows while it
falls; wind picks up. Bodies collide and conserve momentum. This is the layer
that looks most like a conventional simulation — until you read the coupling.

**Symbolic-Physical Coupling** is the heart of the whole engine, and it runs in
both directions:

- *World → body:* rain raises an entity's humidity; cold air drains its warmth.
- *Feeling → body:* **arousal makes you faster. Sadness makes you heavier.
  Dominance makes you push harder. Negative valence raises your friction** —
  despair is implemented as drag.

Sadness having mass is not a metaphor in this codebase. It is a multiplier on
the mass term. A grieving entity literally takes more force to move. And
memory bends attraction: the more strongly you remember someone, the more
gravity they exert on you — up to twenty percent more.

**In the rain:** the storm starts here. Rain intensity ramps, cloud cover
darkens the sky to seventy percent of the intensity, wind multiplies by half
again. The ghost's humidity creeps up tick by tick; its temperature drifts
toward the cold air. The body is now wet and cold — and the inner life (layer
1) is about to interpret that as feeling.

> **Atlas card — Layer 2**
> - **Role:** environmental constraint + the emotion↔physics bridge
> - **Inspired by:** thermodynamics, meteorology, Newtonian mechanics — then deliberately violated by letting feelings have physical coefficients
> - **If removed:** emotions become epiphenomenal; a depressed entity moves exactly like a joyful one; the world stops touching its inhabitants
> - **Feeds:** temperature/humidity → emotion; emotion → speed/mass/force/friction; memory strength → attraction
> - **Code anchors:** `src/2-physics/weather.ts`, `energy.ts` (heat transfer), `coupling.ts` (PAD→physics), `environment.ts`, `collision.ts`

---

## Layer 3 — The Learning Mind

Above feeling sits improvement. Beings learn by **reinforcement** — the
Q-learning update rule, the same one from the textbooks, with rewards extracted
from outcomes. Skills grow with practice along a curve of diminishing returns,
and decay without use — but decay slows as mastery rises. The comment in the
code says it plainly: *"it's like riding a bike."* A novice skill evaporates in
days; a mastered one survives years of neglect.

Skills can now be **declared, not programmed**. A material file can say *"this
being's `resilience` grows by 0.15 every time it survives rain"* — and the
engine wires the event to the practice to the proficiency curve with no
imperative code. (This loop is the engine's newest organ; for most of its life,
declared skills were parsed and silently dropped. The wire was connected only
in 5.12.)

Then the layer does something unexpected: it scales the mind up to the
population. The **world-mind** watches all entities at once and detects
emergent patterns — clustering, synchronization, stillness. And it keeps an
**emotional climate**: a world-level mood with its own state and its own decay.
When an entity dies, grief is recorded *in the world itself*. The climate then
leaks back into every survivor's baseline. Entities born after a famine inherit
a sadness whose cause they never lived.

**In the rain:** ten rainy nights later, the ghost's declared `resilience`
skill has been practiced ten times. The curve has flattened — the storm that
once dropped its valence by half now barely registers. It got better at rain.

> **Atlas card — Layer 3**
> - **Role:** individual learning, skill proficiency, population-scale intelligence and mood
> - **Inspired by:** reinforcement learning (Q-learning), learning-curve and motor-memory research, collective behavior studies
> - **If removed:** beings respond but never improve; deaths leave no scar on the world
> - **Feeds:** consumes experience from the inner life; feeds behavior selection, dialogue confidence, and a climate that touches every entity
> - **Code anchors:** `src/3-cognition/learning/q-learning.ts`, `skills/system.ts` (practice, decay, `practiceDeclared`), `world-mind/collective.ts` (patterns, emotional climate)

---

## Layer 4 — Between Minds

Communication is built on a firm hierarchy of honesty. Dialogue is **authored**
— graphs of variants with conditions, written in any language (every line is a
map of language codes; the entity chooses its tongue by its own weights). An
LLM can generate dialogue, but it is optional garnish; the system works fully
without one. And since v5.11, the engine enforces what it calls **semantic
truth**: if a being has no authored line for a moment, `speak()` returns
`undefined`. It does not invent something plausible. **Silence is honest;
fabrication is not.**

What dialogue says is shaped by the layers below. Emotion modulates tone along
all three PAD axes — pleasure becomes warmth, arousal becomes energy, dominance
becomes assertiveness. Memory flags unlock variants: a line like *"remember
last night?"* literally cannot be selected until the memory it refers to
exists. Relationships gate what may be said at all.

Underneath the words runs a stranger channel: **semantic similarity**. Two
beings' essences are compared as embeddings — a "lonely ghost" and a "grieving
spirit" register as kin (cosine ≈ 0.7) without either being told. Recognition
precedes conversation.

**In the rain:** the morning after, the keeper greets the ghost. Because the
shared memory exists and the bond crossed its threshold, the intimate variant
unlocks: *"Remember last night? Beautiful."* — selected over the generic
"Hi there," weighted by frequency, toned by a warm-calm emotional state. The
storm has begun to talk.

> **Atlas card — Layer 4**
> - **Role:** conversation, meaning, and the discipline of only saying what was authored
> - **Inspired by:** speech-act theory (conditioned dialogue), dialogue-tree structure, embedding semantics, multilingual-first design
> - **If removed:** beings still feel and remember — in silence; bonds become mechanical timestamps with no spoken history
> - **Feeds:** consumes emotion (tone), memory (context gates), relationships (conditions); feeds utterances into the world's transcript, where language is born (layer 6)
> - **Code anchors:** `src/4-communication/dialogue/manager.ts`, `language/generator.ts` (tone modulation, LLM-optional), `semantics/similarity.ts`, `message/queue.ts`

---

## Layer 5 — Between Worlds

The fifth layer states its metaphysics in its own documentation:
**"consciousness is distributed, not isolated."** Minds connect through
cognitive links; emotion travels across links like energy through a field —
joy is contagious, grief leaks. Memories synchronize peer-to-peer through a
conflict-free replicated log with vector clocks: two beings can compare
recollections of the same night and merge them without any central arbiter of
truth.

Trust governs what flows. Each being holds reputations and share-policies —
memories might require trust ≥ 0.6, emotions might be public. The network
itself is a **small-world graph** (Watts-Strogatz; eight neighbors, a fifth of
the edges rewired) — the same topology human societies settle into, where
everyone is six hops from everyone.

And then the layer's quiet masterpiece: **links decay**. One percent per
second, pruned entirely below a threshold. Two beings who bonded and never
spoke again will, after enough silence, simply not be connected anymore. The
social graph is not a record — it is a garden. Stop tending a relationship and
the world removes it for you.

(One function here is a confessed placeholder: `deceive()` currently returns
the truth. The world does not know how to lie yet. There is something fitting
about an engine that implemented trust before deception.)

**In the rain:** sheltering together formed a link between ghost and keeper.
Across it, the keeper's calm seeps into the ghost's PAD state. Their memory
logs merge — the night now exists in two minds with provable shared causality.
Trust ticks up past the sharing threshold. The storm has become *theirs*.

> **Atlas card — Layer 5**
> - **Role:** minds connecting at distance: contagion, shared memory, trust, topology
> - **Inspired by:** distributed systems (CRDTs, vector clocks), Watts-Strogatz small-world networks, sociology of trust and reputation
> - **If removed:** N isolated simulators instead of a society; grief stays private; nothing is ever *ours*
> - **Feeds:** modulates emotion (resonance), memory (sync), communication reach; consumed by the container's relational phase
> - **Code anchors:** `src/5-network/p2p/cognitive-link.ts` (decay!), `p2p/memory-log.ts` (CRDT), `trust/system.ts`, `topology/small-world.ts`

---

## Layer 6 — The Container

The container answers the largest question by being unremovable: **a world is
not a collection of systems, it is the choreography between them.** Its tick is
the world's heartbeat, and the order of the phases is a theory of causality:

> physical → environmental → resources → mental → communication → relational →
> cognitive → linguistic → render

Bodies settle before minds interpret; minds settle before feelings spread
between them; relationships update before long-term consolidation; everything
happens before language. Run these out of order and the world doesn't crash —
it becomes *incoherent*, which is worse.

The container also holds the two most haunting mechanisms in the engine. The
first is the **emotional climate**: the world's own mood — grief, vitality,
tension, harmony — with its own decay rates, fed by births and deaths,
leaking back into every inhabitant. The second is the **crystallizer**: every
utterance any being speaks lands in a transcript, and phrases that recur
crystallize into a shared **lexicon**. Words are not installed; they are
*earned through repetition*. The crystallizer even coins compounds — if "cold"
and "water" keep co-occurring, the world may invent "cold water" on its own.
This is creole formation, running deterministically, tagged with the emotion
that was in the air when each word was born. **The world's language tastes
like its feelings.**

**In the rain:** the world-level view of our night: humidity rises across the
map; the well refills; the ghost speaks *"cold... rain..."*; three repetitions
later "cold rain" crystallizes into the lexicon, tagged with low valence and
high arousal. The event log — the world's diary — records all of it. If anyone
died that night, the climate will carry the grief long after the body is gone.

> **Atlas card — Layer 6**
> - **Role:** orchestration, time, ecology, collective mood, emergent language
> - **Inspired by:** systems theory (order-as-causality), ecology (resource fields, scarcity), historical linguistics (crystallization, coinage)
> - **If removed:** nothing meaningful remains — parts without choreography are debris; this impossibility is itself the design's thesis
> - **Feeds:** everything, in order; broadcasts events and context as the world's nervous system
> - **Code anchors:** `src/6-world/container.ts` (the tick), `linguistics/crystallizer.ts`, `resources/field.ts`, `event-sink.ts`

---

## Layer 7 — The Boundary

The outermost layer is where the world meets people, and it runs in two
directions.

**Inward** flows authorship. A human writes a `.mdm` file — possibly one line:
`{ "essence": "lonely ghost" }` — and the boundary translates description into
machinery: emotion transitions, memory bindings, learnable skills, behavior
triggers, state machines. The engine even reads the essence *text* and infers a
baseline emotion from it (in Thai or English). The design belief is stated by
the existence of the parser itself: **you don't program behavior; you describe
identity, and behavior is derived.** The trigger language understands twenty
human languages — a being authored by a Thai speaker reacts emotionally to
Thai praise and Thai criticism, no translation step, Thai checked first.

**Outward** flows rendering — and rendering is deliberately humble. The visual
mapper is a pure function from entity state to style: emotion becomes color,
arousal becomes brightness. The entity never knows it is being watched. DOM,
canvas, and headless renderers are interchangeable, because the world is not a
picture — the picture is just one honest reading of the world.

(Safety is quietly structural: authored behaviors compile to sandboxed
expression trees, never `eval`. A material file from a stranger cannot escape
its own declarativeness.)

**In the rain:** how did this whole storm get authored? Someone wrote a
forest-creature material with `trigger: "weather.rain" → anxious` — one
declarative line. And on screen, as the anxiety hits, the creature literally
brightens — arousal rendered as luminance. The storm exits the system the same
way it entered: as description.

> **Atlas card — Layer 7**
> - **Role:** the membrane: declarative authorship in, honest rendering out
> - **Inspired by:** DSL design, essence-first philosophy, adapter pattern, multilingual NLP keyword grounding
> - **If removed:** the ontology becomes unreachable theory — no way to author a being, no way to witness one
> - **Feeds:** the parser feeds every layer (it is how MDM intent becomes entity machinery); render consumes world state and adds nothing to it
> - **Code anchors:** `src/7-interface/io/mdm-parser.ts` (the translation act), `io/trigger-keywords.ts` (20 languages), `render/adapter.ts` (pure StateMapper), `context/`

---

## What the Code Believes

Read all eight layers at once and a worldview emerges — never stated in any
single file, but enforced by all of them:

1. **Existence precedes physics.** Identity is layer 0; weather is layer 2. A
   thing *is* before it is constrained.
2. **Feelings have mass.** Sadness is a multiplier on mass; despair is
   friction; memory is gravity. Inner life and matter are one system with two
   faces.
3. **Permanence is earned.** Everything decays by default — memories, skills,
   bonds, links, grief. What persists is what repeats: crystallized memory,
   practiced skill, tended relationship. Ritual is the only immortality.
4. **Trust outlives warmth.** Familiarity fades at full speed; trust at half.
   The engine believes the skeleton of a relationship survives its skin.
5. **Language is earned too.** Words crystallize from repeated use and carry
   the emotion of their birth. And where nothing was authored, the being stays
   silent rather than fabricate — silence is honest.
6. **The world itself feels.** Climate carries grief past the death of every
   griever. Newborns inherit moods they never earned. History is emotional
   before it is factual.
7. **To author is to describe, not command.** One line of essence births a
   complete being. Behavior is derived from identity — cultivation, not
   control.

---

## A History Nobody Planned

The strangest fact about this cosmology: **it began as a CSS library.**

- **2024 — v2/v3:** MDS meant *Material Definition System* — manifest-driven
  **UI materials**: optics, surfaces, themes. "Material" meant *how a surface
  looks.*
- **October 2025 — v4:** a complete rewrite, recorded in the changelog with the
  sentence that changed the project's species: **"JSON describes ontology, not
  styling."** Event-driven became force-driven. The UI library became an
  info-physics engine.
- **Five days later — v5.0:** "Living World Simulation Engine." Memory, PAD
  emotion, relationships, the three-phase tick — eight phases that became the
  eight layers in this guide.
- **Then the world deepened sideways:** P2P cognition (5.5), emergent
  linguistics (5.7), forty Thai emotions (5.8.1), needs and the emotional
  climate (5.9), semantic truth (5.11), and — at last — skills that actually
  grow (5.12).

The name never changed. **"Material" is a fossil**: a word that once meant
*surface appearance* and now means *a being's declared essence* — the same
four letters, an entire ontology apart. The project answered its own founding
question by refusing to stay what it was:

> *From CSS materials → info-physics → living ontology.
> Each version answers the same question: "What if JSON could be alive?"*
> — the changelog's own epilogue, maintained in Chiang Mai ✨

---

## Appendix — Drift Notes (llm.txt vs. code, surveyed 2026-06-10)

Each layer carries an `llm.txt` self-description. The survey found these gaps —
useful both as errata and as proof the prose above was checked against code:

| Layer | Claim in `llm.txt` | Code reality |
|---|---|---|
| 0 | "Immutable: return new values, don't mutate" | Runtime is deeply mutable (velocity, emotion mutate in place). Apparently intentional — mutation is how emergence happens — but the doc misleads. |
| 1 | (silent) | Misses the three most interesting facts: crystallized memories are decay-immune, intents carry confidence + 5s reevaluation, relationship decay has five presets (casual→immortal). |
| 2 | "valence = speed, arousal = force, dominance = mass" | **Inverted on all three axes.** Code: arousal→speed, valence→mass, dominance→force. Code is truth. |
| 3 | (silent) | Emotional climate and declarative skill triggers (5.12) not yet documented. |
| 5 | "deception detection" | `deceive()` is a placeholder that returns the truth — the world cannot lie yet. |
| 7 | lists `webgl-adapter.ts` | No WebGL adapter exists; DOM/canvas/headless only. |
| — | `docs/CORE-LAYERS.md` | Misnamed: contains a Semantic-First upgrade plan, not layer documentation. |

---

*Generated from a full-source survey (8 parallel layer extractions, file-level
evidence) on 2026-06-10. If the architecture grows a ninth layer, regenerate —
this guide describes the world as found, not as remembered.*
