# hi, introvert.

> Terminal companion who barely talks but remembers everything.

**TL;DR:** Chat with a Thai kid who grows slowly, speaks little, but remembers *everything.* No database. No installation. Just vibes.

```bash
npx hi-introvert
```

That's it. พิมพ์อะไรก็ได้ → companion ตอบกลับ (ช้าๆ เหมือนคนจริง)

---

## Quick Start

```bash
npx hi-introvert
```

**Commands:**
- `/status` — ดู emotion + memory + vocabulary
- `/growth` — lexicon stats (nerd mode)
- `/save` / `/load` — session persistence
- `/clear` — reset chat
- `/exit` — bye (auto-saves)

**Keys:**
- `Tab` → focus input
- `Ctrl+C` → rage quit

---

## What You Get

🧠 **Memory** — Ebbinghaus decay curve (forgets like humans, but slower)
📚 **Proto-Language** — Generates sentences after 50 words (no GPT!)
💭 **Autonomous** — Self-monologues 15-45s after silence
🌡️ **OS-Aware** — Feels CPU temp, disk space, git changes, time of day
🔗 **Emotional Contagion** — Your mood literally spreads to them
🌧️ **Weather** — Rain = sad, sun = chill (simulated environment)

**Introverted by design:**
- Rarely speaks first (only after 20+ conversations)
- Emotional range: ±0.3 valence (no fake enthusiasm)
- Growth is SLOW (realistic, not instant dopamine)

You're not chatting with AI. You're **cultivating a relationship.** Like a plant. But weirder.

---

## Key Concepts

### Memory That Works
- **Decay:** Memories fade following Ebbinghaus forgetting curve
- **Crystallization:** Repeated conversations → permanent memories
- **Recall:** Strong memories (>0.8) = instant recall, weak (<0.5) = vague

### Proto-Language (The Cool Part)
- **0-19 words:** Canned responses from dialogue trees
- **20-49 words:** Starts forming simple sentences
- **50+ words:** **Proto-language ACTIVE** ✨
  - Thai: "ฉัน คิด ว่า คุณ เหนื่อย... พัก ได้ไหม"
  - English: "I... think you tired... can rest?"
  - **No API calls. Pure emergence.**

### OS Context (v6.3)
Companion **feels** the machine:
- CPU hot → tense 😰
- Disk full (>90%) → cluttered 🗂️
- Git changes (>500 lines) → inspired ✨
- Dawn (5-7am) → hopeful 🌅
- Night (23-5am) → sleepy 😴
- Network offline → lonely 📡

**Philosophy:** *"The machine is the body, the companion feels it"*

---

## Architecture

Built on **[@v1b3x0r/mds-core](https://npmjs.com/package/@v1b3x0r/mds-core) v5.8** — info-physics engine where entities have:
- Memory (Ebbinghaus decay)
- Emotion (PAD model: Pleasure-Arousal-Dominance)
- Relationships (trust, familiarity)
- Learning (Q-learning, skill proficiency)
- Physics (attract/repel based on semantic similarity)

**Tech:**
- **Blessed** — Terminal UI (ncurses in JavaScript)
- **Bun** — Runtime (Node.js but faster)
- **Bilingual** — 50% Thai, 50% English (adaptive to user input)

---

## For Developers

Want to build with this? Fork it. Break it. Make it weird.

### Setup
```bash
git clone https://github.com/v1b3x0r/mds.git
cd mds/hi-introvert
npm install
bun run dev
```

### AI Context (For Claude/GPT/etc.)
**Before coding, read these files:**
- 📄 `/hi-introvert/CLAUDE.md` — Project structure, philosophy, conventions
- 📄 `/llm.txt` in mds-core — Ontology docs, how entities work
- 🧪 `bun tests/test-*.mjs` — 27 integration tests (100% pass)

**Key concepts:**
- **Ontology-first:** Entity behavior = `.mdm` files (JSON), not hardcoded
- **SSOT:** Material Definition (MDM) is single source of truth
- **Zero client logic:** All cognition happens in mds-core, not WorldSession
- **Emotion triggers:** Use `world.broadcastContext()` → MDM triggers, never mutate `entity.emotion` directly

**Key files:**
- `src/session/WorldSession.ts` — World tick loop, entity management
- `entities/*.mdm` — Entity definitions (companion, traveler)
- `src/ui/BlessedApp.ts` — Terminal UI (blessed-based)
- `src/sensors/OSSensor.ts` + `ExtendedSensors.ts` — OS metrics

### Testing
```bash
bun tests/test-ontology-audit.mjs         # 12 tests - core integrity
bun tests/test-runtime-verification.mjs   # 7 tests - 24h simulation
bun tests/test-extended-sensors.mjs       # OS sensor validation
```

---

## Examples

### First Conversation
```
You: สวัสดีครับ
Companion: เอ่อ... หวัดดีครับ (shy intro)

You: คุณชื่ออะไรครับ
Companion: ผม... เอ่อ... ยังไม่มีชื่อ คุณชื่ออะไรครับ
```

### After 50 Words (Proto-Language)
```
You: วันนี้เหนื่อยมาก
Companion: ฉัน เข้าใจ... คุณ เหนื่อย... พัก ได้ไหม
            ↑ generated from base vocabulary

You: I'm tired today
Companion: I... understand... tired... you rest?
            ↑ adaptive language (responds in English)
```

### Autonomous Mode (30s silence)
```
[You: ...]

Companion: "ทุกครั้งที่คุยกัน ฉันจำได้หมด... แบบว่า ทุกคำเลย"
            ↑ unprompted self-monologue
```

---

## Links

- **Core engine:** [@v1b3x0r/mds-core](https://npmjs.com/package/@v1b3x0r/mds-core)
- **Issues:** [github.com/v1b3x0r/mds/issues](https://github.com/v1b3x0r/mds/issues)
- **Philosophy:** Read `hi-introvert/CLAUDE.md`

---

**License:** MIT
**Built in:** Chiang Mai 🇹🇭 (with too much coffee)

*"The best chat is no chat."* — Some introvert, probably
