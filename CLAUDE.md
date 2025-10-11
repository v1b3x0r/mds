# Material Definition System v3.0 - AI Context

**For AI assistants only - not human documentation**

---

## 1. PROJECT REALITY (ความจริง - ไม่โม้)

นี่คือ **MDS v3.0** - manifest-driven material system with tactile simulation (architectural proof-of-concept)

**What we ship**:
- `/dist/material-system.js` - standalone runtime that applies materials from JSON manifests
- `/manifests/@mds/*.mdm.json` - material definitions (glass, paper)
- `/index.html` - demo page with honest descriptions

**Visual reality**:
- Glass effect is **barely visible** without background pattern
- Paper texture is **almost invisible** on most displays
- Theme switching has **minimal visual impact** (glass is transparent)
- This is an **architectural demo**, NOT production-ready visual effects

**Core concept**:
- Materials defined in JSON (MDSpec v3 schema: optics, surface, tactile physics, customCSS)
- Runtime fetches manifests and applies CSS properties
- External physics files loaded dynamically for tactile simulation (deform-only, no positional movement)
- Demo proves the architecture works, but visual results are minimal due to CSS/DOM limitations

**v3 Key Change**: Removed built-in positional drag system. MDS now only handles tactile deformation physics. External behavior engines (like UICP) handle positional interactions.

---

## 2. ARCHITECTURE (MDSpec v3)

### File Structure
```
material-js-concept/
├── src/                     # TypeScript source
│   ├── core/
│   │   ├── types.ts        # Material interface with customCSS
│   │   ├── registry.ts
│   │   └── utils.ts
│   ├── mappers/
│   │   ├── optics.ts       # Maps optics → CSS
│   │   ├── surface.ts      # Maps surface → CSS
│   │   └── behavior.ts     # Maps behavior → events
│   ├── theme/
│   ├── states/
│   ├── physics/
│   └── index.ts            # Main entry with customCSS support
├── manifests/@mds/
│   ├── glass.mdm.json      # Simplified glass
│   └── paper.mdm.json      # Matte paper with texture
├── dist/
│   └── material-system.js  # Built bundle
├── index.html              # Demo page
├── README.md               # User documentation (central hub)
├── MATERIAL_GUIDE.md       # Material creation guide (28+ properties)
└── CLAUDE.md               # This file (AI context)
```

### MDSpec v2 Schema (Complete)

```typescript
interface Material {
  // Meta
  name?: string
  version?: string
  description?: string
  author?: string
  license?: string
  tags?: string[]
  inherits?: string

  // Optics (6 core + 3 v1 compat)
  optics?: {
    opacity?: number          // 0..1
    tint?: string            // rgba(...)
    blur?: string            // "12px"
    saturation?: string      // "120%"
    brightness?: string      // "110%"
    contrast?: string        // "105%"
    // v1 compat:
    color?: string
    backgroundColor?: string
    backdropFilter?: string
  }

  // Surface (4 core + 3 texture + 3 v1 compat)
  surface?: {
    radius?: string          // border-radius
    border?: string          // border
    shadow?: string | string[]  // box-shadow
    texture?: {
      src: string            // URL or data URI
      repeat?: string        // "repeat", "no-repeat"
      size?: string          // "200px 200px"
    }
    // v1 compat:
    borderTop?: string
    background?: string
    transform?: string
  }

  // Behavior (v3: Physics system + deprecated fields)
  behavior?: {
    // Physics system (v3) - preferred
    physics?: string                    // External physics file URL
    physicsInline?: string              // Inline physics code
    physicsParams?: Record<string, any> // Physics parameters (K, D, etc.)

    // Deprecated (v2) - auto-migrates with console warning
    /** @deprecated Use physicsParams.elasticity instead */
    elasticity?: number      // 0..1 (spring strength)
    /** @deprecated Use physicsParams.viscosity instead */
    viscosity?: number       // 0..1 (drag damping)
    /** @deprecated Use physicsParams.snapBack instead */
    snapBack?: boolean       // return to origin

    // v1 compat:
    cursor?: string
    transition?: string
  }

  // Advanced (NEW in v2.0.1 - unlimited coverage)
  customCSS?: Record<string, string>
  // Allows ANY CSS property not in optics/surface/behavior
  // Examples: "clip-path", "mix-blend-mode", "mask", "filter"
  // Coverage: ~90% of CSS (vs ~40-50% without)

  // States (v3: 6 states - renamed 'drag' to 'pressed-and-moving')
  states?: {
    base?: Partial<Material>
    hover?: Partial<Material>
    press?: Partial<Material>
    'pressed-and-moving'?: Partial<Material>  // v3: renamed from 'drag'
    focus?: Partial<Material>
    disabled?: Partial<Material>
  }

  // Theme (2)
  theme?: {
    light?: Partial<Material>
    dark?: Partial<Material>
  }
}
```

### Runtime Flow

1. HTML: `<div data-material="@mds/glass">Content</div>`
2. Runtime: `fetch('./manifests/@mds/glass.mdm.json')`
3. Merge: base → theme (light/dark) → state (base/hover/active)
4. Apply:
   - `applySurface()` - texture first
   - `applyOptics()` - tint layers over texture
   - `customCSS` - advanced properties (kebab-case → camelCase)
5. Events: Attach state listeners

### Mapper Order (Critical)

```typescript
// MUST be in this order:
applySurface(element, material.surface)  // 1. Texture first
applyOptics(element, material.optics)    // 2. Tint second
// Apply customCSS (escape hatch)
if (material.customCSS) {
  Object.entries(material.customCSS).forEach(([prop, value]) => {
    const camelProp = prop.replace(/-([a-z])/g, g => g[1].toUpperCase())
    element.style[camelProp] = value
  })
}
```

**Why**: Texture rendering requires background-image applied before backdrop-filter

### Architectural Philosophy (v3)

**Material vs Behavior: Clean Separation**

#### Material Layer (MDS Responsibility)
- **Visual**: Optics (opacity, tint, blur, etc.) + Surface (geometry, texture, shadows)
- **Tactile**: Deformation response to touch (elastic, viscous, friction)
  - Physics simulates HOW material FEELS when touched
  - Physics applies transform (skew, scale) for deformation
  - Physics NEVER applies translate (positional movement)
  - Example: Liquid silicone deforms when pressed, springs back when released

#### External Interaction Layer (UICP/Behavior Engines)
- **Functional**: WHAT element does, WHERE it moves
- **Examples**: Drawer mechanics, modal positioning, scroll behavior, drag-to-reorder
- **Integration**: Uses MDS interop API to query/drive material state

**Critical Rule**: MDS provides **tactile substrate** (deform response), NOT **functional behavior** (positional interactions). This avoids transform conflicts (translate vs skew/scale race conditions).

### Interop API (NEW in v3)

External behavior engines can integrate with MDS via:

```typescript
// Query material state
MDS.getMaterial(element)          // Get material definition
MDS.getState(element)             // Get current visual state
MDS.hasTactilePhysics(element)    // Check if has physics
MDS.getPhysicsParams(element)     // Get physics parameters (K, D, etc.)

// Drive material state
MDS.setState(element, 'hover')    // Programmatically set visual state
```

**Use case**: Behavior engine can query tactile parameters to match its movement feel to material's deformation feel.

---

## 3. CURRENT STATE (v3.0)

### Features Completed
✅ Core runtime (optics, surface, behavior mappers)
✅ Theme system (light/dark auto-switching)
✅ State management (base, hover, press, pressed-and-moving, focus, disabled)
✅ Material inheritance (extend, override)
✅ JSON manifests (fetch from CDN)
✅ TypeScript types (full coverage)
✅ customCSS support (~90% CSS coverage)
✅ Physics system (external .physics.js files with dynamic import)
✅ Auto-migration (deprecated fields → physicsParams)
✅ Interop API (for external behavior engines)
✅ Demo page with tactile simulation
✅ Vercel Analytics integration
✅ Complete documentation (README, MATERIAL_GUIDE, CLAUDE)

### Materials (3 materials - honest)
- `@mds/liquid-silicone` - Tactile elastic deformation (K=22, D=18)
- `@mds/glass` - Static visual material (no physics)
- `@mds/paper` - Static matte with barely-visible texture

### Dependencies
- **Runtime**: Zero (standalone)
- **Dev**: TypeScript, Vite
- **Demo**: None (pure HTML + fetch)
- **Analytics**: @vercel/analytics

### Build
- Command: `npm run build`
- Output: `dist/material-system.js`
- Source maps: Included

---

## 4. CRITICAL RULES

### ✅ DO
- Fetch manifests from `/manifests/@mds/*.mdm.json`
- Apply surface BEFORE optics (texture → tint layering)
- Use `customCSS` for advanced CSS properties
- Convert kebab-case to camelCase for style properties
- Be honest about visual limitations in docs

### ❌ DON'T
- Hardcode manifest objects in HTML (use fetch())
- Create multiple `.html` files (only `/index.html`)
- Create backup/temp files without deleting old ones
- Exaggerate visual effects
- Apply optics before surface (breaks texture rendering)
- Use customCSS for pseudo-elements or @keyframes (not supported)

---

## 5. DOCUMENTATION STRUCTURE

**Central hub**: `README.md`
- Quick start
- API reference
- Architecture overview
- Honest assessment
- Links to other docs

**Detailed guide**: `MATERIAL_GUIDE.md`
- All 28+ properties documented
- 7 complete examples (beginner → advanced)
- Validation rules
- Common mistakes
- `customCSS` domain (advanced users)

**AI context**: `CLAUDE.md` (this file)
- Project reality
- Architecture details
- Decision log
- Future work

---

## 6. DECISION LOG

### Why customCSS field?
User asked: "Can MDSpec support Unreal Engine texture level detail with pure JSON?"
Answer: CSS limitations = ~40-50% coverage without escape hatch
Solution: Add `customCSS` for CSS experts → ~90% coverage
Trade-off: Type safety lost, but flexibility gained

### Why manifest-driven?
Separates data (JSON) from logic (runtime), allows dynamic loading, cleaner architecture

### Why honest naming?
User feedback: "อย่ามาขี้โม้" - Don't lie about capabilities
Changed: "glass-liquid" → "glass" (simple, no false promises)

### Why academic demo style?
No visual distractions, focuses on architecture not aesthetics, honest presentation

### Why fetch() not inline?
User feedback: "แม่งดูไม่โปร" - Hardcoded manifests look unprofessional
Professional code, reusable manifests, cleaner HTML

### Why only 2 materials?
Proof of concept - demonstrates architecture works, users can create more

### Why README as central hub?
User request: "จัดระเบียบเอกสารให้มีเอกสารน้อยที่สุดจัดระเบียบทุกอย่างให้เรียบร้อย README เป็นศูนย์กลาง"
Keep docs minimal, organized, centralized

### Why delete TODO.md?
User request: "ไม่เอา TODO"
Avoid stale documentation, integrate future work into CLAUDE.md instead

### Why remove built-in drag system? (v3 refactor)
**Problem**: User reported "มัน drag ไปได้ทั่วจอเลย" - elements moving across screen instead of elastic deformation
**Root cause**: Transform conflict between built-in drag (translate) and external physics (skew/scale)
**Solution**:
- Removed built-in drag.ts/spring.ts completely
- Renamed "drag" state → "pressed-and-moving" (clearer intent)
- Physics now only handles tactile deformation (no translate)
- External behavior layer (UICP) handles positional movement
- Added interop API for behavior engines to integrate

**User's philosophy**:
- Material = Visual + Tactile (HOW it responds to touch)
- Behavior = External Interaction Layer (WHAT it does, WHERE it moves)
- Example: `<div data-material="@mds/liquid-silicone" data-behavior="drawer">`

**Migration**: Deprecated `viscosity`/`elasticity`/`snapBack` with auto-migration to `physicsParams` + console warnings

---

## 7. KNOWN ISSUES & FIXES

### Fixed Issues
- ✅ Button CSS in dark mode (was using `currentColor`, now hardcoded `#000/#fff`)
- ✅ Manifest fetch CORS (moved from `/examples/` to root)
- ✅ JSON parse error (changed to fetch())
- ✅ Apply order (surface → optics for correct texture layering)
- ✅ Limited CSS coverage (added `customCSS` field)
- ✅ Transform conflicts (v3: removed built-in drag, physics = tactile only)

### Current Limitations (by design)
- Glass effect invisible on solid backgrounds (CSS limitation)
- Paper texture barely visible (intentional 0.02 alpha)
- Theme switching has minimal visual impact (transparent materials)
- No dynamic lighting/PBR (requires WebGL)
- No mouse tracking effects (requires custom JS)
- No Unreal Engine-level detail (not possible with CSS)

---

## 8. FUTURE WORK (งานที่เหลือ)

### Phase 1: Visual Improvements (ปรับ visual ให้เห็นชัด)
- [ ] Increase material contrast (current: barely visible)
- [ ] Add more dramatic shadow systems
- [ ] Test on different displays/browsers
- [ ] Create variant materials with higher opacity

### Phase 2: More Materials (เพิ่มวัสดุ)
- [ ] Metal material (anisotropic gradients)
- [ ] Wood material (grain textures)
- [ ] Fabric material (woven patterns)
- [ ] Frosted glass (heavy blur)

### Phase 3: Advanced Features (ฟีเจอร์ขั้นสูง)
- [ ] Parallax effects (requires custom JS in `customCSS` context)
- [ ] Mouse tracking (custom event handlers)
- [ ] Dynamic lighting (WebGL fallback?)
- [ ] Animation timeline control

### Phase 4: Developer Experience (DX)
- [ ] React/Vue/Svelte wrappers
- [ ] Figma plugin (export to MDM)
- [ ] Material marketplace/registry
- [ ] CLI tool (create, validate, bundle materials)

### Phase 5: Performance & Polish
- [ ] Bundle size optimization (current: acceptable)
- [ ] Performance benchmarks (100+ elements)
- [ ] Memory leak testing
- [ ] Browser compatibility testing

### Phase 6: Community & Ecosystem
- [ ] npm package publication
- [ ] CDN hosting setup
- [ ] Community material gallery
- [ ] Tutorial videos

---

## 9. FOR AI: WHEN USER ASKS TO MODIFY

### Before changing code:

**Question checklist**:
1. Is this a visual property? → Must use MDSpec manifest, NOT inline styles
2. Is this layout/spacing? → Tailwind OK
3. Is this a new material? → Create `.mdm.json` in `/manifests/@mds/`
4. Is this an advanced CSS property? → Use `customCSS` field
5. Will this create temp files? → Delete old ones FIRST
6. Is this a breaking change? → Update CLAUDE.md

### After changing code:

**Verification checklist**:
1. Run `npm run build` to verify TypeScript compiles
2. Check no hardcoded manifests in HTML
3. Verify fetch() paths are correct (`./manifests/`, `./dist/`)
4. Update MATERIAL_GUIDE.md if schema changed
5. Update CLAUDE.md if architecture changed
6. Update README.md if API changed

---

## 10. HONEST ASSESSMENT

**What works**:
- ✅ Architecture is sound (manifest → runtime → DOM)
- ✅ TypeScript types correct
- ✅ Build pipeline works
- ✅ Theme switching functional
- ✅ State management works
- ✅ `customCSS` provides escape hatch (~90% coverage)

**What doesn't work well**:
- ⚠️ Visual effects are minimal (CSS limitations)
- ⚠️ Materials hard to distinguish (low contrast)
- ⚠️ Glass needs background pattern to be visible
- ⚠️ Paper texture almost invisible
- ⚠️ Not production-ready (architectural demo only)

**Conclusion**:
This is a successful architectural demonstration with honest limitations clearly stated. The manifest-driven approach works, TypeScript types are solid, `customCSS` provides flexibility for advanced users, and v3's clean separation of Material vs Behavior layers solves the transform conflict issue. Visual quality needs improvement, but the foundation is strong.

---

**สรุป**: MDS v3.0 = Manifest-driven architecture + Tactile simulation (deform-only) + Interop API for behavior engines + Clean Material/Behavior separation (~90% CSS coverage ด้วย customCSS) แต่ visual effects ยังจำกัดมาก (ตามความจริง)
