# MDS Documentation

**Welcome to the Material Definition System docs.**

Not sure where to start? Here's the roadmap:

⸻

## 🚀 Quick Navigation

### I want to...

**...get started in 5 minutes**
→ [MDSPEC Guide](guides/MDSPEC_GUIDE.md) — Learn the `.mdm` schema
→ [Cookbook](guides/COOKBOOK.md) — Copy-paste recipes

**...understand what this even is**
→ Read the main [README](../README.md)
→ Check [USE_CASES](guides/USE_CASES.md) — Find your use case

**...see examples**
→ Open [/examples](../examples/) in browser
→ Read [Lovefield Demo walkthrough](demos/LOVEFIELD.md)

**...learn by doing**
→ Try recipes from [Cookbook](guides/COOKBOOK.md)
→ Copy/paste, tweak, experiment

**...understand how it works under the hood**
→ [Architecture](technical/ARCHITECTURE.md) explains the engine
→ [Tech Spec](technical/TECH_SPEC.md) has detailed specs

**...migrate from v4**
→ [v5 Migration Guide](technical/V5-MIGRATION.md)

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
│   ├── COOKBOOK.md              # 18 quick recipes
│   └── USE_CASES.md             # Use cases by audience
│
├── technical/                   # Technical deep-dive
│   ├── ARCHITECTURE.md          # How the engine works
│   ├── V5-MIGRATION.md          # Migration from v4
│   └── TECH_SPEC.md             # Detailed specifications
│
├── demos/                       # Demo explanations
│   └── LOVEFIELD.md             # Flagship demo walkthrough
│
└── meta/                        # Project meta
    ├── CHANGELOG.md             # Version history
    └── LICENSE.md               # Human-readable license
```

⸻

## 📚 Recommended Reading Order

### For New Users (Day 1)
1. Main [README](../README.md) → understand the concept (5 min)
2. [MDSPEC Guide](guides/MDSPEC_GUIDE.md) → learn the schema (10 min)
3. Open [/examples/01-basics/emoji-field.html](../examples/01-basics/emoji-field.html) → see it live (2 min)
4. Try 2-3 recipes from [Cookbook](guides/COOKBOOK.md) → hands-on (30 min)

**Total: ~45 minutes to productive**

### For Developers (Day 2)
1. [Architecture](technical/ARCHITECTURE.md) → understand info-physics loop (20 min)
2. Read `src/core/engine.ts` in the codebase (15 min)
3. [Cookbook](guides/COOKBOOK.md) advanced recipes → extend behavior (30 min)
4. Clone repo + run `npm run dev` → start hacking

⸻

## 🔗 External Resources

- **GitHub:** [v1b3x0r/mds](https://github.com/v1b3x0r/mds)
- **NPM:** `@v1b3x0r/mds-core`
- **Live Demos:** [/examples](../examples/)
- **Issues:** GitHub Issues

⸻

## ❓ FAQ

**Q: Where's the API reference?**
A: Check [MDSPEC Guide](guides/MDSPEC_GUIDE.md) for schema, [Architecture](technical/ARCHITECTURE.md) for engine API.

**Q: Can I use this in production?**
A: v5.0 is stable. See [CHANGELOG](meta/CHANGELOG.md) for features.

**Q: How do I deploy this?**
A: It's just HTML + ESM. Deploy anywhere (Vercel, Netlify, GitHub Pages).

**Q: Can I use this with React/Vue/Svelte?**
A: Yes! Import `Engine` or `World` from `@v1b3x0r/mds-core`, spawn entities in your framework's lifecycle hooks.

**Q: I found a bug, what do?**
A: Open a GitHub issue with: (1) what you expected, (2) what happened, (3) minimal repro.

⸻

## 🌊 Philosophy

MDS docs are written to be:
- **Friendly** → like a dev friend explaining over coffee
- **Honest** → we admit limitations
- **Practical** → copy/paste-able examples
- **Concise** → respect your time

If something's confusing, it's our fault. Open an issue on GitHub.

⸻

**Happy building!** 🚀

_Documented in Chiang Mai. Maintained with coffee and curiosity._ ☕✨
