# Changelog

**A human-readable history of what changed and why it matters.**

⸻

## [4.2.1] - 2025-10-17 — "World-Class Organization"

### Added
- **Comprehensive documentation** (7 files in `/docs/`)
  - `guides/` → MDSPEC_GUIDE.md (learn schema in 3 min), COOKBOOK.md (12 recipes)
  - `technical/` → ARCHITECTURE.md (engine deep-dive), TECH_SPEC.md, V4-UPGRADE.md
  - `meta/` → CHANGELOG.md, CONTRIBUTING.md, LICENSE.md
  - `demos/` → LOVEFIELD.md (flagship demo walkthrough)
  - `README.md` → Documentation hub with role-based navigation
- **GitHub Pages workflow** (`pages.yml`) → auto-deploy demos on push

### Changed
- **Folder structure reorganization** (world-class level):
  - `/materials/entities/` → Entity definitions (paper.shy, paper.curious, emotion.trust)
  - `/materials/fields/` → Field definitions (field.trust.core)
  - `/examples/01-basics/` → Basic demos (emoji-field.html)
  - `/examples/02-advanced/` → Advanced demos (cluster.html)
  - `/examples/03-showcase/` → Flagship demos (lovefield.html, ghost-town.html)
- **package.json** → Added `materials/` and `docs/` to published files
- **CLAUDE.md** → Updated all paths, bundle sizes, and version references for coherence

### Removed
- `MATERIAL_GUIDE.md` (v3 legacy, incompatible)
- `deploy.yml` workflow (duplicate of pages.yml)

### Why It Matters
v4.2.1 is **documentation complete** and **production-ready**. Clear organization makes it easy to:
- Find what you need (role-based docs structure)
- Learn by example (12 cookbook recipes)
- Understand the engine (architecture deep-dive)
- Contribute confidently (contribution guidelines)

⸻

## [4.2.0] - 2025-10-17 — "Finally Walks Straight"

### Added
- **Lifecycle hooks** (`onSpawn`, `onUpdate`, `onDestroy`) → inject custom logic at key moments
- **Serialization** (`snapshot()`/`restore()`) → save/load full simulation state
- **Deterministic mode** (seeded random) → reproducible simulations for science and art
- **World bounds** (`clamp`/`bounce` behaviors) → keep entities on-screen
- **Timeline tracking** in Lovefield demo → all relationship events logged
- **Save/Load Story** in demos → localStorage persistence

### Changed
- Bumped schema to v4.1 (added lifecycle/serialization support)
- Updated all 4 demos to showcase v4.2 features
- Bundle size: 18.42 KB (from 9.15 KB in v4.0)

### Fixed
- Lovefield demo syntax error (single → double quotes in dialogues)
- Entities not moving (added initial velocity)

### Why It Matters
v4.2 is **production-ready**. You can now:
- Build games with save/load
- Run scientific experiments with deterministic replay
- Track lifecycle events for analytics
- Keep entities inside boundaries

⸻

## [4.1.0] - 2025-10-16 — "The Missing Pieces"

### Added
- LLM bridge interface (`llmAdapter.ts`) → plug GPT/Claude for semantic similarity
- Creator context injection → pass personality/tone to LLM
- OpenRouter adapter (optional) → use any LLM via unified API
- Dummy bridge fallback → simulate LLM responses without API calls

### Why It Matters
Laid groundwork for **semantic info-physics** (replace entropy with embeddings).

⸻

## [4.0.0] - 2025-10-16 — "Info-Physics Engine" (Complete Rewrite)

### Added
- **Info-physics loop** (requestAnimationFrame tick)
- **Pairwise force calculation** (O(n²) proximity × similarity)
- **Field system** (emergent relationship markers)
- **Aging/decay** (autonomous lifecycle)
- **Entity class** (living materials with entropy)
- **Field class** (stationary relationship fields)
- **Material schema v4.0** (`essence`, `manifestation`, `physics`)
- **Loader** (`loadMaterial`, `loadMaterials`)
- **4 demos** (emoji-field, cluster, ghost-town, lovefield-tailwind)

### Removed (Breaking Changes)
- ❌ v3 CSS-based material system
- ❌ Theme manager (light/dark)
- ❌ State machine (hover/press/focus/disabled)
- ❌ Optics/surface/behavior mappers

### Changed
- JSON role: config → ontology (describes *what something is*, not *how it looks*)
- Paradigm: event-driven → force-driven
- Bundle: 25 KB → 9.15 KB (pure physics engine)

### Why It Matters
v4.0 is a **philosophical pivot**. MDS is no longer a UI library — it's a simulation engine for living materials.

**Incompatible with v3.** Choose based on goal:
- Want CSS materials? → v3
- Want living entities? → v4

⸻

## [3.0.0] - 2024-12-15 — "CSS Material System" (Legacy)

### Added
- Manifest-driven design (`.mdm.json` files)
- Optics system (glass, paper, metal)
- Surface system (textures, patterns)
- Behavior rules (onHover, onPress, onFocus)
- Theme switching (light/dark)
- Tactile physics (deform-only, no positional movement)

### Why It Matters
v3 was the first attempt at "materials as design primitives." Worked well for UI, but couldn't simulate emergence.

**Status:** Archived. See git history for v3 docs.

⸻

## [2.x] - 2024-01 — "Early Explorations"

Experimental prototypes. Not public. Mostly chaos.

⸻

## Format Notes

- **[Major.Minor.Patch]** → Semantic versioning
- **Date** → Release date (YYYY-MM-DD)
- **Subtitle** → One-liner personality

### Change Types
- **Added** → new features
- **Changed** → modifications to existing
- **Deprecated** → still works but will be removed
- **Removed** → deleted features
- **Fixed** → bug fixes
- **Security** → vulnerability patches

### Why It Matters
Explains *impact* of changes, not just *what* changed.

⸻

## Upcoming (Roadmap)

### v4.3 (Target: 2025-11)
- Spatial partitioning (quadtree) → O(n log n) forces
- Mobile/touch support
- Performance profiler

### v5.0 (Target: 2026-Q1) — "Living Ontology"
- Replace entropy with semantic embeddings
- LLM bridge implementation (OpenAI/Anthropic)
- True info-physics (meaning-based forces)
- WebSocket multiplayer sync
- 3D mode (Three.js integration)

### v6.0 (Speculative) — "Consciousness Simulation"
- Memory system (entities remember past)
- Learning (behavior evolves over time)
- Reproduction (spawn children with mixed traits)
- Ecosystem mode (multiple species, predator/prey)

⸻

**That's the journey so far.**

From CSS materials (v3) → info-physics (v4) → living ontology (v5).

Each version is a different answer to the same question:

"What if JSON could be alive?"

⸻

_Changelog maintained in Chiang Mai. Updated with every release._ ✨
