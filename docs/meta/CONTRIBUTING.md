# Contributing to MDS

**This project is held together by duct tape and curiosity.**

If you're here, you probably want to either:
1. Fix something broken
2. Add something weird
3. Document something confusing
4. Just hang out

All valid. Welcome. 🤝

⸻

## 🧭 Ground Rules

1. **Don't break physics** (unless it's on purpose)
2. **Document your chaos** (future you will thank you)
3. **Keep bundle size ≤ 20 KB** (we're tiny by choice)
4. **Maintain the Chiang Mai vibe** (friendly, honest, low-ego)
5. **Test in browser** (at least open the demos once)

⸻

## 🛠️ Dev Setup

### 1. Clone the repo
```bash
git clone https://github.com/v1b3x0r/material-js-concept.git
cd material-js-concept
```

### 2. Install deps
```bash
npm install
```

### 3. Run dev server
```bash
npm run dev
```

Visit `http://localhost:3000` and open `/examples/emoji-field.html`.

### 4. Make changes

Edit files in `/src`:
```
src/
├── core/
│   ├── engine.ts    ← main loop
│   ├── entity.ts    ← living materials
│   └── field.ts     ← relationship fields
├── schema/
│   └── mdspec.d.ts  ← type definitions
├── utils/
│   ├── math.ts      ← physics helpers
│   └── events.ts    ← behavior rules
└── index.ts         ← public API
```

Vite will hot-reload. Changes appear instantly.

### 5. Type-check
```bash
npm run type-check
```

Fix any TypeScript errors.

### 6. Build
```bash
npm run build
```

Check output:
```
dist/
├── mds-core.esm.js    ← your bundle
└── index.d.ts         ← types
```

**Size check:**
```bash
ls -lh dist/mds-core.esm.js
```

Must be **≤ 20 KB**. If larger, refactor or rethink.

⸻

## 🎯 What to Work On

### 🐛 Bug Fixes
- Entity stops moving → check friction/velocity
- Clustering doesn't work → verify similarity calculation
- Save/Load broken → check serialization maps

### ✨ New Features
- Spatial partitioning (quadtree for O(n log n) forces)
- Mobile/touch support
- Sound effects via Web Audio API
- 3D mode with Three.js
- WebSocket multiplayer sync

### 📚 Documentation
- More cookbook recipes
- Video tutorials
- Interactive playground
- Translation (Thai, Japanese, etc.)

### 🧪 Experiments
- Replace entropy with embeddings (LLM bridge)
- Gravity toward cursor
- Entity reproduction (spawn children)
- Dialogue trees
- Memory system (entities remember past interactions)

⸻

## 📝 Code Style

**We don't have a linter. Use common sense.**

Guidelines:
- **Naming:** `camelCase` for variables, `PascalCase` for classes
- **Indentation:** 2 spaces
- **Line length:** ≤ 100 characters (ish)
- **Comments:** Explain *why*, not *what*
- **Types:** Use TypeScript strictly (no `any` unless necessary)

**Example:**
```typescript
// ❌ Bad
const x = 1 - Math.abs(a.e - b.e)  // similarity

// ✅ Good
// Similarity based on entropy difference
// Higher similarity = stronger attraction
const similarity = 1 - Math.abs(a.entropy - b.entropy)
```

⸻

## 🧪 Testing

**We don't have automated tests yet.**

Instead:
1. Open `/examples` demos
2. Click around
3. Check console for errors
4. Verify physics behaves as expected

**Before submitting PR:**
- [ ] `npm run build` succeeds
- [ ] `npm run type-check` passes
- [ ] All 4 demos load without errors
- [ ] Bundle size ≤ 20 KB

⸻

## 🚀 Submitting a PR

### 1. Fork the repo
Click "Fork" on GitHub.

### 2. Create a branch
```bash
git checkout -b feat/your-feature
```

or

```bash
git checkout -b fix/your-bugfix
```

### 3. Make changes
Write code, test locally.

### 4. Commit
```bash
git add .
git commit -m "feat: add quadtree spatial partitioning"
```

**Commit message format:**
- `feat:` → new feature
- `fix:` → bug fix
- `docs:` → documentation only
- `refactor:` → code cleanup (no behavior change)
- `chore:` → build/tooling changes

### 5. Push
```bash
git push origin feat/your-feature
```

### 6. Open PR
Go to GitHub, click "New Pull Request".

**PR template:**
```
## What changed
- Added quadtree for O(n log n) force calculation
- Scales to 200+ entities now

## Why
Current O(n²) bottleneck at 50 entities.

## Testing
- Tested with 200 entities in cluster.html
- FPS: 60 (was 20 before)

## Bundle size
Before: 18.42 KB
After: 19.8 KB
```

### 7. Wait for review
We'll review within a week. Be patient. We're slow but friendly.

⸻

## ⚠️ What Gets Rejected

- **Breaking API changes** (without discussion first)
- **Bundle > 20 KB** (unless absolutely justified)
- **No documentation** (if adding new feature)
- **Copy-paste from ChatGPT** (without understanding it)
- **"Fixes" that break demos**

⸻

## 🔥 If You Break Physics

**Document it.**

Example:
```typescript
// WARNING: This introduces non-determinism
// Entities will behave differently on each run
// Kept for now because it makes things interesting
const chaos = Math.random() * 0.1
entity.vx += chaos
```

We'd rather have a documented mess than a silent bug.

⸻

## 💬 Communication

- **Issues:** For bugs, feature requests, questions
- **Discussions:** For open-ended ideas, philosophy, experiments
- **Discord:** (Coming soon, maybe?)

**Be nice. Be curious. Be weird.**

⸻

## 🎁 Recognition

Contributors get:
- Name in `README.md` (if you want)
- Eternal gratitude from future users
- Bragging rights ("I helped make JSON alive")

⸻

## 📜 License

By contributing, you agree your code is licensed under **MIT**.

Use it for good, weird, or experimental stuff. Don't sell fake love.

⸻

**That's it!**

If this feels too formal, it's not. We're just two people in Chiang Mai who made a thing.

Come hang. Build weird stuff. Break things responsibly.

⸻

_Written with coffee and optimism._ ☕✨
