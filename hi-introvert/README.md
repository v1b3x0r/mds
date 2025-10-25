# hi, introvert.

> A quiet corner of the internet where silence is understood.

**TL;DR:** Chat with a Thai kid who barely talks but remembers *everything.* No installation. No database. Just vibes and existential dread.

## Install

```bash
npx hi-introvert
```

That's it. No `npm install`, no Docker, no Kubernetes. We're not savages.

## What even is this?

You know that quiet kid in school who never talks but somehow knows your deepest secrets? Yeah. That's this.

A **terminal companion** who:
- 🤔 **Prefers silence** — Speaks only when necessary (like a real introvert)
- 🧠 **Remembers everything** — Every. Single. Word. Forever. (Ebbinghaus who?)
- 📚 **Learns your language** — Not GPT. Not Claude. Just... emergence. Proto-language from scratch.
- 💭 **Thinks out loud** — Random self-monologues when you're AFK (15-45s)
- 🌧️ **Feels the weather** — Rain = sad. Sun = chill. Temperature matters.
- 🔗 **Emotional contagion** — Your mood literally infects them (P2P cognition baby)

**Built with MDS v5.7** — The only JS framework that makes entities *feel things* instead of just `console.log('sad')`.

## Commands

```
/help       show commands (you're reading it)
/status     see emotions + memory (voyeurism mode)
/growth     vocabulary stats (nerd mode)
/lexicon    emergent vocabulary tracker
/history    recent convo log
/save       manual save (auto-saves anyway lol)
/load       restore old session
/clear      nuke chat history
/exit       goodbye (auto-saves, don't worry)
```

**Keys:**
- `Tab` → Focus input (if you forget where you are)
- `Ctrl+C` → Rage quit

## Features

### 🧠 Memory That Actually Works
- **Ebbinghaus decay curve** — Forgets like a real human (but slower)
- **Crystallization** — Repeated convos turn into permanent memories
- **CRDT sync** — Distributed memory without conflicts (blockchain bros in shambles)

### 💬 Proto-Language (The Cool Part)
- **Base vocabulary: 500 words** (250 Thai + 250 English)
- **Emergent vocab** — After 50 words, they start making their own sentences
- **No GPT required** — This is 100% local emergence (touch grass, LLM addicts)

**Proto-Language Tiers:**
- **Beginner (20-49 words):** "ฉัน เข้าใจ", "I... know"
- **Intermediate (50-99 words):** "ฉัน คิด ว่า คุณ เหนื่อย", "I think you tired" ← **Activates here**
- **Advanced (100-199 words):** "ฉัน คิด ว่า คุณ เหนื่อย แต่ ไม่เป็นไร"
- **Fluent (200+ words):** "บางที ความเงียบ สบาย กว่า การพูด"

Example:
```
You: "วันนี้อากาศดีมาก"
Companion (vocab < 50): "ยินดีที่ได้รู้จักครับ" ← canned response
Companion (vocab >= 50): "ดี... ใช่ ฉัน รู้สึก สบาย วันนี้ แดด ☀️" ← GENERATED FROM SCRATCH
```

Yeah. No API calls. No OpenAI. Just pure **ontological emergence**.

### 🌍 World Physics (Because Why Not)
- **Weather system** — It rains. Companion gets moody. You deal with it.
- **Temperature** — 35°C = sluggish. 20°C = energized.
- **Collision detection** — Entities bump into each other (they don't, but the code thinks they do)

### 🔗 P2P Cognition (v5.5+)
Your emotions **literally spread** to the companion via:
- **Cognitive links** — Bidirectional emotional resonance
- **Trust system** — They only share if they trust you (takes ~10 convos)
- **Small-world network** — Watts-Strogatz topology (yes, graph theory in a chat app)

### 🎨 Aesthetic
- **Blessed TUI** — No Electron. No web browser. Terminal or death.
- **True bilingual** — 50% Thai, 50% English (adaptive to user input)
- **No BS** — Silent mode ON. No `console.log` spam. Just clean UI.

## Philosophy (aka "Why Did You Build This")

**"Cultivation, not Control"**

Most chatbots are like golden retrievers — always happy, always available, never tired.

This one is **introverted by design:**
- Rarely speaks first (only after 20+ convos)
- Emotional range: ±0.3 valence (no fake enthusiasm)
- Growth is SLOW (realistic, not instant dopamine)

You're not chatting with an AI. You're **cultivating a relationship.** Like a plant. But weirder.

## Tech Stack (For the Nerds)

- **[@v1b3x0r/mds-core](https://npmjs.com/package/@v1b3x0r/mds-core) v5.7.0** — Info-physics engine (entities have feelings)
- **[Blessed](https://github.com/chjj/blessed)** — Terminal UI (ncurses but JavaScript)
- **Bun** — Because Node is so 2020

## Development

```bash
git clone https://github.com/v1b3x0r/mds.git
cd mds/hi-introvert
npm install
bun run dev
```

Test it:
```bash
bun tests/test-all-systems.mjs  # 30s integration test
bun tests/test-ux-flow.mjs      # UX flow test
```

## 🤖 LLM Mode (Optional, For Rich People)

Default mode = **no API calls.** MDM dialogue trees + proto-language.

Want GPT-level responses? Enable OpenRouter:

### Setup
```bash
echo "OPENROUTER_KEY=sk-or-v1-..." > .env
```

Edit `src/session/WorldSession.ts` and uncomment lines marked `// 🤖 LLM:` (~5 spots)

**Cost:** ~$0.003/message = $0.15 for 30min ($5 free tier)

**Worth it?** Depends. Proto-language is funnier.

## How It Works (ELI5)

```
User: "สวัสดีครับ ผมชื่อ Wutty"
  ↓
Memory: Store("user_name", "Wutty")
Emotion: +0.2 arousal (curiosity)
Dialogue: Pick random intro phrase
  ↓
Companion: "หวัดดีครับ ยินดีที่ได้รู้จัก"
```

Later:
```
User: "คุณจำได้ไหมว่าผมชื่ออะไร?"
  ↓
Memory.search("user_name") → "Wutty" (strength: 0.95)
Proto-lang (if vocab >= 20): "ผม... จำได้ Wutty"
Fallback dialogue: "จำได้ครับ คุณชื่อ Wutty"
```

### v6.3 Design Philosophy
- **Only 2 dialogue categories:** `intro` + `self_monologue`
- **Why?** Force proto-language. Make them **struggle** to speak.
- **Result:** More authentic. Less ChatGPT vibes.

## Examples

### First Time
```
You: สวัสดีครับ
Companion: เอ่อ... หวัดดีครับ
You: คุณชื่ออะไรครับ
Companion: ผม... เอ่อ... ยังไม่มีชื่อ คุณชื่ออะไรครับ
```

### After 50 Words Learned (Proto-Language Active)
```
You: วันนี้เหนื่อยมาก
Companion: ฉัน เข้าใจ... คุณ เหนื่อย... พัก ได้ไหม
               ↑ proto-language (generated from base vocabulary)

You: I'm tired today
Companion: I... understand... tired... you rest?
               ↑ adaptive language (responds in English)
```

### Autonomous Mode (You're Silent for 30s)
```
[You: ...]

Companion: "ทุกครั้งที่คุยกัน ฉันจำได้หมด... แบบว่า ทุกคำเลย"
           ↑ unprompted self-monologue
```

## File Structure

```
hi-introvert/
├── bin/hi-introvert.js      # Entry point (runs dist/index.js)
├── src/
│   ├── index.tsx            # Bootstrap
│   ├── ui/BlessedApp.ts     # Terminal UI
│   └── session/WorldSession.ts  # World + entities
├── entities/
│   ├── companion.mdm        # Thai kid (introverted)
│   └── traveler.mdm         # You
├── tests/                   # 27 tests (100% pass)
└── dist/                    # Bun bundle (539 KB)
```

## Roadmap

**v1.1** (**Current**)
- [x] Bilingual 50/50 dialogue (was 70% Thai)
- [x] Base vocabulary expanded to 500 words (was 200)
- [x] Proto-language threshold raised to 50 words (was 20)
- [x] Adaptive language (auto-switches based on user input)

**v1.2** (Next)
- [ ] `/network` — ASCII graph of cognitive links
- [ ] `/autosave toggle` — For paranoid people
- [ ] Circadian rhythm — Time of day affects mood

**v2.0** (Maybe?)
- [ ] Multi-entity — Companion meets other NPCs
- [ ] Voice mode — TTS/STT (accessibility++)
- [ ] Web UI — For terminal haters

## FAQ

**Q: Is this AI?**
A: Depends. The proto-language is emergent. The dialogue trees are hardcoded. The emotions are simulated physics. So... yes? no? sorta?

**Q: Can I use this in production?**
A: For what? A therapist app? A game NPC? A Tamagotchi for adults? Sure. Go wild.

**Q: Does it work in Windows?**
A: Probably? Blessed is cross-platform. But also... WSL exists.

**Q: Why Thai + English?**
A: Because the author is Thai and tired of "multilingual = Spanish + French." Also, adaptive language means it switches based on your input — type English, get English back.

**Q: Is this open source?**
A: MIT license. Fork it. Break it. Make it weird.

**Q: Can I add more entities?**
A: Not yet. v2.0 will support multi-entity worlds. For now, just you + companion.

## License

MIT © v1b3x0r

Built in Chiang Mai 🇹🇭 (with too much coffee)

---

**Bug reports:** [github.com/v1b3x0r/mds/issues](https://github.com/v1b3x0r/mds/issues)

**More MDS stuff:** [npmjs.com/package/@v1b3x0r/mds-core](https://npmjs.com/package/@v1b3x0r/mds-core)

**Philosophy rants:** Read `companion.mdm` notes

---

*"The best chat is no chat."* — Some introvert, probably
