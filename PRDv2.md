Material Definition System (MDS) — MVP PRD (v2)

Goal: Ship a tiny, production-ready runtime that applies materials (visual + behavior) to DOM nodes via data-material="…". Materials are defined by schema (MDSpec) and can be authored as JSON manifests (MDM) or via JS. No dependencies. CDN-ready.

0. Scope (MVP)
	•	Backend: DOM/CSS only (no WebGL/WebGPU).
	•	What MDS does: Parse material name → resolve manifest → map material properties → apply inline styles / CSS variables; manage states (base/hover/press/drag/focus/disabled); handle theme (light/dark).
	•	Out of scope (MVP): particles/gas; fluid shaders; 3D; layout/spacing/typography; component primitives.

1. Public API (global MaterialSystem)

// Register materials
register(name: string, material: Material): void
registerFromManifest(manifest: MaterialManifest): void
extend(name: string, base: string, overrides: Partial<Material>): void

// Lifecycle
apply(root?: Element): void                 // scan & apply (default: document)
setTheme(theme: 'light'|'dark'|'auto'): void
tokens: Record<string, any>                 // reserved (not required MVP)

Auto-init: On DOMContentLoaded, run apply(document); attach MutationObserver.

CDN / module: UMD global MaterialSystem + ESM default export.

2. Material Schema (MDSpec – MVP subset)

A material has three domains: optics, surface, behavior, plus theme overrides and states.

type Material = {
  optics?: {              // light/visual
    opacity?: number            // 0..1
    tint?: string               // CSS color
    blur?: string               // e.g. "12px" → backdrop-filter
    brightness?: string         // e.g. "110%"
    contrast?: string           // e.g. "105%"
    saturation?: string         // e.g. "120%"
  }
  surface?: {             // texture/edges/relief
    radius?: string             // border-radius (e.g. "12px")
    shadow?: string             // box-shadow string
    texture?: {                 // optional repeating texture
      src: string               // URL or data URI (SVG/PNG)
      repeat?: 'repeat'|'no-repeat'|'repeat-x'|'repeat-y'
      size?: string             // e.g. "24px 24px"
      rotation?: string         // e.g. "15deg" (map via transform)
    }
  }
  behavior?: {            // **intrinsic response**
    elasticity?: number         // 0..1 (press/drag spring)
    viscosity?: number          // 0..1 (drag damping)
    snapBack?: boolean          // return to rest on release
  }
  states?: Partial<Record<'base'|'hover'|'press'|'drag'|'focus'|'disabled', Material>>
  theme?: Partial<Record<'light'|'dark', Material>>
  inherits?: string        // optional base material name
}

JSON Manifest (MDM) example (wood w/ tiled SVG)

{
  "name": "@official/wood",
  "inherits": null,
  "optics": { "opacity": 1, "brightness": "100%" },
  "surface": {
    "radius": "12px",
    "shadow": "0 2px 12px rgba(0,0,0,.12)",
    "texture": {
      "src": "data:image/svg+xml;utf8,<svg ... compressed wood grain ...>",
      "repeat": "repeat",
      "size": "28px 28px",
      "rotation": "8deg"
    }
  },
  "states": {
    "hover": { "optics": { "brightness": "108%" } },
    "press": { "surface": { "shadow": "0 1px 6px rgba(0,0,0,.18)" } },
    "drag":  { "optics": { "contrast": "103%" } }
  },
  "theme": {
    "dark": { "optics": { "brightness": "92%", "contrast": "110%" } }
  }
}

3. State Machine (incl. contact state)

States: base → hover → press → drag → release (+ focus, disabled parallel)
	•	hover: pointer enters (no button down).
	•	press: pointerdown while on element (contact begin).
	•	drag: press + pointer moves over threshold (contact move).
	•	release: pointerup → return to hover if still inside, else base.
	•	focus: focusin/out events (keyboard/tab).
	•	disabled: attribute [disabled] on element → force disabled state.

Runtime events: use Pointer Events; compute velocity for drag (for elasticity/viscosity).

4. Mapping Rules (MVP → DOM/CSS)

Optics → CSS/filter/backdrop-filter
	•	blur → backdrop-filter: blur(N) (fallback: none)
	•	opacity → style.opacity
	•	tint → layered background via linear-gradient(tint, tint), …
	•	brightness/contrast/saturation → filter: brightness(..) contrast(..) saturate(..)

Surface → CSS
	•	radius → border-radius
	•	shadow → box-shadow
	•	texture.src → background-image: url(...) (+ background-repeat/size)
	•	texture.rotation → transform: rotate(θ) (apply on inner wrapper if rotation should not affect layout)

Behavior (intrinsic)
	•	elasticity, viscosity, snapBack drive small transforms during press/drag
	•	press: apply transform: scale(1 - k*elasticity) (e.g. k≈0.02)
	•	drag: translate by pointer delta damped by viscosity (no layout shift)
	•	release: snapBack spring to origin (requestAnimationFrame)

Theme
	•	If theme === 'auto', resolve via matchMedia('(prefers-color-scheme: dark)').
	•	Merge order per element: inherits → base → theme[active] → state[current].

5. Engine Loop (pseudo)
	1.	Scan elements with [data-material] → resolve material object (with inheritance).
	2.	Compute merged style for active theme+state.
	3.	Apply:
	•	set inline styles and CSS variables (no layout properties).
	•	attach pointer/focus listeners once per element.
	4.	Observe DOM mutations → lazily apply to new nodes.
	5.	State updates transition via small rAF loop (press/drag/release).
	6.	Theme changes (matchMedia) → recompute & reapply deltas.

6. Examples to include (tiny, self-contained)

6.1 Liquid Glass (progressive blur + press/drag)

MaterialSystem.register('@official/glass.liquid', {
  optics: {
    opacity: 0.85,
    tint: 'rgba(255,255,255,.10)',
    blur: '18px',
    saturation: '120%'
  },
  surface: {
    radius: '16px',
    shadow: '0 12px 40px rgba(0,0,0,.12)'
  },
  behavior: { elasticity: 0.35, viscosity: 0.2, snapBack: true },
  states: {
    hover: { optics: { brightness: '108%' } },
    press: { optics: { blur: '16px' } },
    drag:  { optics: { blur: '20px', contrast: '105%' } }
  },
  theme: {
    dark: { optics: { tint: 'rgba(0,0,0,.22)', brightness: '92%' } }
  }
})

6.2 Paper (polka-dot pattern)

MaterialSystem.register('@official/paper.polkadot', {
  optics: { opacity: 1, brightness: '100%' },
  surface: {
    radius: '12px',
    shadow: '0 2px 10px rgba(0,0,0,.08)',
    texture: {
      src: "data:image/svg+xml;utf8,<svg ... tiny polkadot .../>",
      repeat: "repeat",
      size: "14px 14px"
    }
  },
  states: {
    hover: { optics: { brightness: '104%' } },
    press: { surface: { shadow: '0 1px 6px rgba(0,0,0,.12)' } }
  }
})

HTML usage

<div data-material="@official/glass.liquid">Card</div>
<button data-material="@official/paper.polkadot">Action</button>

7. Non-Goals / Constraints
	•	Do not set layout/spacing/typography (width/height/margin/padding/font).
	•	No timers except rAF loops tied to active interactions.
	•	Do not allocate canvases or images per frame.
	•	Avoid reflow: only transform/opacity/filter/backdrop-filter/shadow.
	•	Fallback gracefully if backdrop-filter unsupported (skip blur).

8. Performance Targets
	•	Core runtime ≤ ~350 LOC (TypeScript or JS), ≤ ~5–7 KB min+gzip.
	•	First apply ≤ 2 animation frames for 100 elements.
	•	Pointer → visual response ≤ 8 ms median on laptop.
	•	Zero dependencies.

9. Files (MVP)

/dist/mds.min.js                 // UMD + ESM
/src/mds.ts|js                   // ~350 LOC core
/src/map.ts|js                   // ~80 LOC property mappers
/spec/mdspec.json                // ~120 LOC JSON Schema (MVP subset)
/manifests/*.mdm.json            // official: glass.liquid, paper.polkadot, wood
/examples/index.html             // single-page demo

10. Acceptance Checklist (1-shot runnable)
	•	✅ Auto-init + apply() for dynamic nodes.
	•	✅ State machine works (hover/press/drag/release/focus/disabled).
	•	✅ Theme: setTheme('dark'|'light'|'auto') + media query listener.
	•	✅ Wood (tiled SVG) + Polkadot paper render correctly (repeat/size).
	•	✅ Liquid glass shows progressive blur + elasticity under drag.
	•	✅ No layout properties touched; performance budget respected.
	•	✅ Build outputs UMD global and ESM module; works via CDN <script>.

11. Minimal Mapper (reference signature)

// Called per element when (theme|state) changes
function applyComputed(el: HTMLElement, m: Material) {
  // optics
  if (m.optics?.opacity != null) el.style.opacity = String(m.optics.opacity)
  const filters = [
    m.optics?.brightness && `brightness(${m.optics.brightness})`,
    m.optics?.contrast   && `contrast(${m.optics.contrast})`,
    m.optics?.saturation && `saturate(${m.optics.saturation})`
  ].filter(Boolean).join(' ')
  if (filters) el.style.filter = filters
  if (m.optics?.blur) el.style.backdropFilter = `blur(${m.optics.blur})`
  if (m.optics?.tint) {
    const prev = getComputedStyle(el).backgroundImage || 'none'
    el.style.backgroundImage = `linear-gradient(${m.optics.tint},${m.optics.tint}), ${prev}`
  }

  // surface
  if (m.surface?.radius) el.style.borderRadius = m.surface.radius
  if (m.surface?.shadow) el.style.boxShadow = m.surface.shadow
  if (m.surface?.texture?.src) {
    el.style.backgroundRepeat = m.surface.texture.repeat ?? 'repeat'
    if (m.surface.texture.size) el.style.backgroundSize = m.surface.texture.size
    el.style.backgroundImage = `url(${m.surface.texture.src})`
    // rotation may be applied on a wrapper; MVP: ignore or set transform
    if (m.surface.texture.rotation) el.style.transform = `rotate(${m.surface.texture.rotation})`
  }
}


⸻

Notes for the implementer model
	•	Keep the core loop small: resolve → merge → apply; don’t over-abstract.
	•	State machine can be ~60 LOC using pointer events + a tiny spring loop.
	•	Merging rule = deep merge: inherits → base → theme → state.
	•	Store per-element runtime in a WeakMap (state, origin, listeners).
	•	Ensure idempotent apply() calls (re-applying doesn’t duplicate listeners).
	•	Prefer inline styles for MVP; CSS variables are optional.

Estimated total LOC (MVP):
	•	Core engine: ~300–350 LOC
	•	Mappers: ~70–90 LOC
	•	Schema JSON: ~100–120 LOC
	•	Example page: ~100–150 LOC
Total: ~600–700 LOC (source), ≤ 7 KB min+gzip.

⸻

End of PRD