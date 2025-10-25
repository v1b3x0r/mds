# hi, introvert.

> A quiet corner of the internet where silence is understood.

Chat with introverts from around the world. Or just... exist together.

## Install

```bash
npx hi-introvert
```

No installation needed. Just run and join.

## Who's Here?

- **yuki** (Japan) — overthinks everything, speaks EN + JP
- **som** (Thailand) — sarcastic but chill, speaks EN + TH
- **mei** (China) — quietly profound, speaks EN + ZH

## Philosophy

Introverts don't always need to talk. Sometimes, silence is enough.

This chat is built on **P2P cognition** — entities share emotions, memories, and understanding without words. When they do speak, it's because they have something to say.

## Features

- **Emotional resonance** — Moods spread naturally (happiness, anxiety, calm)
- **Self-monologue** — Entities think out loud (shown in dim gray)
- **Glitches** — Social battery runs out (realistic exhaustion)
- **AutoSave** — Sessions saved automatically (or toggle off)
- **Multilingual** — Code-switching feels natural, not forced

## Commands

```
/help         show commands
/status       see emotions + memories
/network      view connections (ASCII)
/autosave     toggle autosave
/save [file]  manual save
/clear        clear chat history
/exit         leave chat
```

## Tech

Built with:
- **[@v1b3x0r/mds-core](https://npmjs.com/package/@v1b3x0r/mds-core)** — P2P cognition engine
- **[Ink](https://github.com/vadimdemedes/ink)** — React for CLIs
- **Bun** — Fast runtime

## Development

```bash
# Clone and install
git clone <repo>
cd hi-introvert
bun install

# Run locally
bun run dev

# Build
bun run build

# Test published version
npm link
npx hi-introvert
```

## 🤖 Enable LLM (Optional)

By default, entities respond using pre-written dialogue trees (no API needed).

To enable **AI-generated responses** when dialogue trees don't match:

### 1. Get API Key

Sign up at [OpenRouter](https://openrouter.ai/) and get your API key.

### 2. Create `.env` file

```bash
echo "OPENROUTER_KEY=your_api_key_here" > .env
```

### 3. Uncomment LLM Code

Open `src/session/WorldSession.ts` and find sections marked with `🤖`:

**Section 1: Imports** (line ~2)
```typescript
// Uncomment this line:
import { LanguageGenerator } from '@v1b3x0r/mds-core'
```

**Section 2: Constructor** (line ~20)
```typescript
// Uncomment the llm property:
llm?: LanguageGenerator
```

**Section 3: World Config** (line ~30)
```typescript
// Add languageGeneration feature:
features: {
  ontology: true,
  communication: true,
  cognition: true,
  rendering: 'headless',
  languageGeneration: true  // ← Add this
},

// Uncomment LLM config block:
llm: {
  provider: 'openrouter',
  apiKey: process.env.OPENROUTER_KEY,
  languageModel: 'anthropic/claude-3.5-sonnet'
}
```

**Section 4: LLM Initialization** (line ~50)
```typescript
// Uncomment this block:
if (this.world.llm?.apiKey) {
  this.llm = new LanguageGenerator({
    provider: this.world.llm.provider || 'openrouter',
    apiKey: this.world.llm.apiKey,
    model: this.world.llm.languageModel || 'anthropic/claude-3.5-sonnet'
  })
}
```

**Section 5: Response Logic** (line ~170)
```typescript
// In getEntityResponse(), uncomment the LLM fallback block
```

**Section 6: Helper Function** (line ~200)
```typescript
// Uncomment getLLMTone() function
```

### 4. Rebuild & Run

```bash
bun run build
npx hi-introvert
```

Now entities will use LLM when dialogue trees don't have a match!

### Cost Estimate

- **Claude 3.5 Sonnet:** ~$0.003 per message
- **Typical session (30 min):** ~50 messages = $0.15
- **Free tier:** Most providers offer $5-10 credit

### How It Works

```
User message → Dialogue tree → LLM (fallback) → Response

Example:
User: "What's your favorite food?"
  ↓
Dialogue tree: [no match for "favorite food"]
  ↓
LLM: Generate response as "overthinking introvert from japan"
  ↓
Yuki: "うーん... I like onigiri? It's simple but... comforting."
```

The LLM uses:
- Entity's `essence` (personality)
- Current `emotion` (PAD values)
- User's message (context)
- Entity's native language (for code-switching)

### Disable LLM

Just comment out the blocks again, or remove the `.env` file.

## License

MIT © v1b3x0r

Built in Chiang Mai 🇹🇭

---

**Questions?** Open an issue
**More examples?** Check the [MDS docs](https://github.com/v1b3x0r/mds)
