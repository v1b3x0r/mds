# MDS Documentation

**Welcome to the Material Definition System docs.**

Not sure where to start? Here's the roadmap:

⸻

## 🚀 Quick Navigation

### I want to...

**...get started in 5 minutes**
→ Start with [Getting Started Guide](guides/GETTING_STARTED.md) *(coming soon)*
→ Or jump straight to [MDSpec Guide](guides/MDSPEC_GUIDE.md)

**...understand what this even is**
→ Read the main [README](../README.md)
→ Then check [Architecture](technical/ARCHITECTURE.md)

**...see examples**
→ Open [/examples](../examples/) in browser
→ Read [Lovefield Demo walkthrough](demos/LOVEFIELD.md)

**...learn by doing**
→ Try recipes from [Cookbook](guides/COOKBOOK.md)
→ Copy/paste, tweak, experiment

**...understand how it works under the hood**
→ [Architecture](technical/ARCHITECTURE.md) explains the engine
→ [Tech Spec](technical/TECH_SPEC.md) has detailed specs

**...migrate from v3**
→ [V4 Upgrade Guide](technical/V4-UPGRADE.md)

**...contribute**
→ [Contributing Guide](meta/CONTRIBUTING.md)
→ Check [Changelog](meta/CHANGELOG.md) to see what's new

**...know what's legal**
→ [MIT License](meta/LICENSE.md) (human-readable version)
→ Or see [LICENSE](../LICENSE) (legal version)

⸻

## 📂 Documentation Structure

```
docs/
├── README.md                    (you are here)
│
├── guides/                      # User-facing guides
│   ├── MDSPEC_GUIDE.md          # Schema reference (essential)
│   └── COOKBOOK.md              # 12 quick recipes
│
├── technical/                   # Technical deep-dive
│   ├── ARCHITECTURE.md          # How the engine works
│   ├── V4-UPGRADE.md            # Migration from v3
│   └── TECH_SPEC.md             # Detailed specifications
│
├── demos/                       # Demo explanations
│   └── LOVEFIELD.md             # Flagship demo walkthrough
│
└── meta/                        # Project meta
    ├── CHANGELOG.md             # Version history
    ├── CONTRIBUTING.md          # How to contribute
    └── LICENSE.md               # Human-readable license
```

⸻

## 📚 Recommended Reading Order

### For New Users (Day 1)
1. Main [README](../README.md) → understand the concept (5 min)
2. [MDSpec Guide](guides/MDSPEC_GUIDE.md) → learn the schema (10 min)
3. Open [/examples/01-basics/emoji-field.html](../examples/01-basics/emoji-field.html) → see it live (2 min)
4. Try 2-3 recipes from [Cookbook](guides/COOKBOOK.md) → hands-on (30 min)

**Total: ~45 minutes to productive**

### For Developers (Day 2)
1. [Architecture](technical/ARCHITECTURE.md) → understand info-physics loop (20 min)
2. Read `src/core/engine.ts` in the codebase (15 min)
3. [Cookbook](guides/COOKBOOK.md) advanced recipes → extend behavior (30 min)
4. Clone repo + run `npm run dev` → start hacking

### For Contributors (When Ready)
1. [Contributing Guide](meta/CONTRIBUTING.md) → dev setup + PR workflow
2. [Changelog](meta/CHANGELOG.md) → see what changed recently
3. Open an issue or PR

⸻

## 🔗 External Resources

- **GitHub:** [v1b3x0r/material-js-concept](https://github.com/v1b3x0r/material-js-concept)
- **NPM:** `@v1b3x0r/mds-core`
- **Live Demos:** [/examples](../examples/)
- **Issues/Discussions:** GitHub Issues + Discussions

⸻

## ❓ FAQ

**Q: Where's the API reference?**
A: Check [MDSpec Guide](guides/MDSPEC_GUIDE.md) for schema, [Architecture](technical/ARCHITECTURE.md) for engine API.

**Q: Can I use this in production?**
A: v4.2 is stable. See [Changelog](meta/CHANGELOG.md) for features + limitations.

**Q: How do I deploy this?**
A: It's just HTML + ESM. Deploy anywhere (Vercel, Netlify, GitHub Pages).

**Q: Is there a video tutorial?**
A: Not yet. Want to make one? Open a PR!

**Q: Where's the LLM bridge docs?**
A: It's experimental. See [Architecture → LLM Bridge](technical/ARCHITECTURE.md#-how-to-extend) for stub implementation.

**Q: Can I use this with React/Vue/Svelte?**
A: Yes! Import `Engine` from `@v1b3x0r/mds-core`, spawn entities in your framework's lifecycle hooks.

**Q: I found a bug, what do?**
A: Open a GitHub issue with: (1) what you expected, (2) what happened, (3) minimal repro.

⸻

## 🌊 Philosophy

MDS docs are written to be:
- **Friendly** → like a dev friend explaining over coffee
- **Honest** → we admit limitations
- **Practical** → copy/paste-able examples
- **Concise** → respect your time

If something's confusing, it's our fault. Open an issue.

⸻

**Happy building!** 🚀

_Documented in Chiang Mai. Maintained with coffee and curiosity._ ☕✨
