# Material Definition System (MDS)
> A declarative paradigm for UI material properties

[![npm version](https://img.shields.io/npm/v/@v1b3x0r/mds-core.svg)](https://www.npmjs.com/package/@v1b3x0r/mds-core)
[![npm downloads](https://img.shields.io/npm/dm/@v1b3x0r/mds-core.svg)](https://www.npmjs.com/package/@v1b3x0r/mds-core)
[![license](https://img.shields.io/npm/l/@v1b3x0r/mds-core.svg)](https://github.com/v1b3x0r/material-js-concept/blob/main/LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@v1b3x0r/mds-core)](https://bundlephobia.com/package/@v1b3x0r/mds-core)
[![CI](https://github.com/v1b3x0r/material-js-concept/workflows/CI/badge.svg)](https://github.com/v1b3x0r/material-js-concept/actions)

**5-second pitch**: Separate material concerns from layout concerns. Think "this is glass" not "backdrop-filter: blur(20px)".

---

## 🎯 Quick Navigation

| Your Goal | Start Here | Time to Proficiency |
|-----------|-----------|---------------------|
| 👤 **Use in production** | [Quick Start](#-quick-start) | 3 min |
| 🎨 **Create materials** | [Material Authoring](#-material-authoring-guide) | 5 min |
| 🧠 **Understand paradigm** | [Conceptual Model](#-conceptual-model) | 3 min |
| 🔧 **Build integrations** | [System Integration](#-system-integration-api) | 5 min |
| 🎓 **Academic context** | [Research & Theory](#-research--theoretical-foundation) | 5 min |
| 🧑‍💻 **Contribute code** | [Contributing](#-contributing) | 10 min |

---

## 🧠 Conceptual Model

### The Problem

Current CSS workflow conflates three concerns:

```html
<!-- Layout + Material + Behavior all mixed -->
<div class="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-xl border-white/20 hover:scale-105 cursor-pointer">
  Content
</div>
```

### The MDS Paradigm

Declarative separation of concerns:

```html
<!-- Layout (Tailwind/CSS) -->
<div class="px-4 py-2"

     <!-- Material (MDS) -->
     data-material="@mds/glass"

     <!-- Behavior (External library) -->
     data-interaction="drawer">
  Content
</div>
```

### Mental Model

```
Material = Visual Appearance + Tactile Response
         ≠ Functional Behavior
         ≠ Layout/Spacing
```

**Analogy**: Like CSS Grid separates layout from content, MDS separates material properties from everything else.

### Relation to Design Systems

| Concept | Traditional | MDS Paradigm |
|---------|------------|--------------|
| Tokens | `--color-primary: #fff` | ✅ Compatible (use tokens in materials) |
| Components | `<Button variant="glass">` | ✅ Enhanced (components apply materials) |
| Themes | Global CSS variables | ✅ Built-in (light/dark auto-switching) |
| Material properties | CSS utility classes | 🆕 JSON manifests |

**MDS is not a replacement**, it's a **complementary abstraction layer** for material-specific properties.

---

## 📊 Comparison with Related Systems

| System | Focus | MDS Difference |
|--------|-------|----------------|
| **Material Design** | Design language + components | MDS: Material properties only (no components) |
| **Tailwind CSS** | Utility-first CSS | MDS: Declarative materials (no inline styles) |
| **CSS-in-JS** | Component-scoped styles | MDS: Reusable material definitions |
| **Design Tokens** | Design variables | MDS: Complete material specifications |
| **Three.js Materials** | 3D/WebGL materials | MDS: DOM-based 2D materials |

**Key distinction**: MDS treats materials as **first-class entities** with inheritance, composition, and state management.

---

## 👤 Quick Start

### Installation

#### npm (Recommended)

```bash
npm install @v1b3x0r/mds-core
```

```javascript
import '@v1b3x0r/mds-core'
// or
import MaterialSystem from '@v1b3x0r/mds-core'
```

#### CDN (unpkg)

```html
<!-- UMD (ready to use) -->
<script src="https://unpkg.com/@v1b3x0r/mds-core@latest/dist/mds.umd.js"></script>

<!-- ESM (for modules) -->
<script type="module">
  import MaterialSystem from 'https://unpkg.com/@v1b3x0r/mds-core@latest/dist/mds.esm.js'
</script>
```

#### CDN (jsDelivr)

```html
<!-- UMD -->
<script src="https://cdn.jsdelivr.net/npm/@v1b3x0r/mds-core@latest/dist/mds.umd.js"></script>

<!-- ESM -->
<script type="module">
  import MaterialSystem from 'https://cdn.jsdelivr.net/npm/@v1b3x0r/mds-core@latest/dist/mds.esm.js'
</script>
```

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/@v1b3x0r/mds-core@latest/dist/mds.umd.js"></script>
</head>
<body>
  <!-- Use built-in materials -->
  <div data-material="@mds/glass">Glass element</div>
  <div data-material="@mds/paper">Paper element</div>
  <div data-material="@mds/liquid-silicone">Liquid silicone (with physics)</div>

  <script>
    // Load materials from CDN manifests
    async function loadMaterials() {
      const baseURL = 'https://unpkg.com/@v1b3x0r/mds-core@latest/manifests/@mds'

      const [glass, paper, liquidSilicone] = await Promise.all([
        fetch(`${baseURL}/glass.mdm.json`).then(r => r.json()),
        fetch(`${baseURL}/paper.mdm.json`).then(r => r.json()),
        fetch(`${baseURL}/liquid-silicone.mdm.json`).then(r => r.json())
      ])

      MaterialSystem.register('@mds/glass', glass)
      MaterialSystem.register('@mds/paper', paper)
      MaterialSystem.register('@mds/liquid-silicone', liquidSilicone)
      MaterialSystem.apply()
    }

    loadMaterials()
  </script>
</body>
</html>
```

### Live Demo

**[View Interactive Demo →](https://v1b3x0r.github.io/material-js-concept/)**

Experience materials with tactile physics:
- **Liquid Silicone**: Elastic deformation (drag to feel spring physics)
- **Glass**: Glassmorphism effect with blur and transparency
- **Paper**: Matte surface with subtle texture

### Built-in Materials

- **`@mds/glass`**: Simplified glassmorphism (blur + transparency)
- **`@mds/paper`**: Matte paper with subtle texture
- **`@mds/liquid-silicone`**: Tactile elastic material with physics simulation

> **Note**: Built-in materials are intentionally minimal/subtle. The system supports much more dramatic effects - see [Material Authoring](#-material-authoring-guide) to create better ones!

### Core API (Basic Usage)

```javascript
// Register a material
MaterialSystem.register('@my/custom', {
  optics: { tint: '#ffffff', opacity: 0.9 },
  surface: { radius: '12px', shadow: '0 8px 32px rgba(0,0,0,0.1)' }
})

// Set theme
MaterialSystem.setTheme('dark')   // 'light' | 'dark' | 'auto'

// Get current theme
const theme = MaterialSystem.getTheme()  // 'light' | 'dark'

// Apply to elements (auto-called on DOM changes)
MaterialSystem.apply()
```

---

## 🎨 Material Authoring Guide

### Why Create Custom Materials?

The built-in materials are **intentionally minimal** to serve as starting points. The system supports **28+ properties + unlimited CSS** via `customCSS` field.

**What you can build**:
- Dramatic glass effects with heavy blur
- Neumorphic designs
- Animated gradients
- Textured surfaces
- Advanced visual effects

### Quick Examples

#### Dramatic Glass

```json
{
  "name": "dramatic-glass",
  "optics": {
    "blur": "40px",
    "saturation": "200%",
    "brightness": "130%",
    "tint": "rgba(255, 255, 255, 0.2)"
  },
  "surface": {
    "radius": "16px",
    "shadow": [
      "0 8px 32px rgba(0, 0, 0, 0.3)",
      "inset 0 1px 0 rgba(255, 255, 255, 0.5)"
    ]
  }
}
```

#### Neumorphic Material

```json
{
  "name": "neumorphic",
  "optics": { "opacity": 1 },
  "surface": { "radius": "20px" },
  "customCSS": {
    "background": "linear-gradient(145deg, #e6e6e6, #ffffff)",
    "box-shadow": "20px 20px 60px #d9d9d9, -20px -20px 60px #ffffff"
  }
}
```

#### Animated Gradient

```json
{
  "name": "gradient-animated",
  "surface": { "radius": "12px" },
  "customCSS": {
    "background": "linear-gradient(270deg, #ff0080, #7928ca, #0070f3)",
    "background-size": "600% 600%",
    "animation": "gradient 8s ease infinite"
  }
}
```

### Complete Material Structure

```json
{
  "name": "my-material",
  "version": "1.0.0",
  "description": "Custom material",

  "optics": {
    "opacity": 0.95,
    "tint": "#ffffff",
    "blur": "12px",
    "saturation": "120%",
    "brightness": "110%",
    "contrast": "105%"
  },

  "surface": {
    "radius": "12px",
    "border": "1px solid rgba(255, 255, 255, 0.2)",
    "shadow": "0 8px 32px rgba(0, 0, 0, 0.1)",
    "texture": {
      "src": "url(data:image/...)",
      "repeat": "repeat",
      "size": "200px 200px"
    }
  },

  "behavior": {
    "cursor": "pointer",
    "transition": "all 0.3s ease"
  },

  "customCSS": {
    "clip-path": "...",
    "mix-blend-mode": "...",
    "filter": "..."
  },

  "states": {
    "hover": {
      "optics": { "opacity": 1 }
    },
    "press": {
      "surface": { "shadow": "0 4px 16px rgba(0,0,0,0.2)" }
    }
  },

  "theme": {
    "light": { "optics": { "tint": "rgba(255,255,255,0.3)" } },
    "dark": { "optics": { "tint": "rgba(255,255,255,0.15)" } }
  }
}
```

### Full Documentation

See **[MATERIAL_GUIDE.md](./MATERIAL_GUIDE.md)** for:
- All 28+ available properties
- Complete examples (beginner to advanced)
- Validation rules and common mistakes
- `customCSS` field for CSS experts (~90% CSS coverage)
- Theme and state variations
- Inheritance and composition

---

## 🔧 System Integration API

**New in v3**: Interop API for external behavior libraries (e.g., UICP, custom interaction systems) to integrate with MDS.

### Architecture: Material vs Behavior

MDS v3 enforces clean separation:

#### Material Layer (MDS Responsibility)
**What it is**: Visual appearance + tactile response (HOW it feels to touch)

- **Optics**: Visual properties (opacity, tint, blur, etc.)
- **Surface**: Geometry (radius, border, shadows, texture)
- **Tactile Physics**: Deformation response to pointer (elastic, viscous)
  - Example: Liquid silicone deforms (skew/scale) when pressed
  - **Critical**: Physics NEVER moves element positionally (no translate)

#### External Interaction Layer (Your Library)
**What it is**: Functional behavior (WHAT element does, WHERE it moves)

- Positional dragging (translate across screen)
- Drawer/modal mechanics
- Scroll behaviors
- Click/gesture handlers

### Integration Example

```html
<div data-material="@mds/liquid-silicone" data-behavior="drawer">
  <!-- MDS: Handles visual + tactile deformation -->
  <!-- Your library: Handles drawer slide-out mechanics -->
</div>
```

### Interop Methods

#### Query Material State

```javascript
// Get material definition
const material = MaterialSystem.getMaterial(element)
if (material) {
  console.log('Material:', material.name)
}

// Get current visual state
const state = MaterialSystem.getState(element)  // 'base' | 'hover' | 'press' | etc.

// Check if has tactile physics
if (MaterialSystem.hasTactilePhysics(element)) {
  // Element deforms on touch
}

// Get physics parameters (to match movement feel to deformation)
const params = MaterialSystem.getPhysicsParams(element)
if (params) {
  console.log('Elasticity:', params.elasticity)
  console.log('Viscosity:', params.viscosity)
}
```

#### Drive Material State

```javascript
// Programmatically set visual state
MaterialSystem.setState(element, 'hover')
MaterialSystem.setState(element, 'press')
```

**Use case**: Behavior engine can query tactile parameters to match its movement feel to material's deformation feel.

### Why This Separation?

**Before (v2)**: Built-in drag caused conflicts
- MDS had positional drag (transform: translate)
- External physics had tactile deform (transform: skew/scale)
- Result: Race condition, elements "dragging across screen"

**After (v3)**: Clean architectural boundary
- MDS: Visual + tactile substrate (deformation only)
- External: Functional interactions (movement, gestures)
- Result: No conflicts, clear responsibility

---

## 🎓 Research & Theoretical Foundation

### Inspiration & Prior Art

**Design Theory**:
- Material Design (Google, 2014) - Material metaphor in UI
- Skeuomorphism → Flat → Neumorphism evolution
- Physical material properties in digital interfaces

**System Design**:
- Separation of Concerns (Dijkstra, 1974)
- Declarative Programming paradigms
- Component-based architecture

**HCI Research**:
- Tangible interfaces (Ishii & Ullmer, 1997)
- Affordances in UI (Norman, 1988)
- Tactile feedback in touch interfaces

### Academic Citations

If citing MDS in academic work:

```bibtex
@software{mds2025,
  title = {Material Definition System (MDS)},
  author = {v1b3x0r},
  year = {2025},
  version = {3.0},
  url = {https://github.com/v1b3x0r/material-js-concept},
  note = {Declarative material property system for web interfaces}
}
```

### Research Questions MDS Addresses

1. **Reusability**: How to define reusable material properties across components?
2. **Abstraction**: What's the right abstraction level between CSS and design language?
3. **State Management**: How to handle material state transitions (hover, focus, etc.)?
4. **Theming**: How to support contextual material variations (light/dark mode)?
5. **Composition**: Can material properties inherit and extend like objects?

### Open Research Questions

- **Perception**: Do users perceive material metaphors in CSS-based interfaces?
- **Performance**: At what scale do declarative materials outperform inline styles?
- **Learning**: Is the material paradigm easier to learn than utility CSS?
- **Accessibility**: How do material properties affect screen reader users?

> **Researchers**: Contributions welcome! Would love to see empirical studies on learnability, cognitive load, and user perception.

---

## ❓ FAQ

### Paradigm & Philosophy

**Q: Why not just use Tailwind/CSS-in-JS?**

A: MDS complements them. Use Tailwind for layout/spacing, MDS for material properties. Different concerns.

```html
<!-- Good: Each tool does what it's best at -->
<div class="px-4 py-2 flex items-center" data-material="@mds/glass">
```

**Q: Isn't this over-engineering?**

A: For small projects (< 5 components), maybe. For design systems with 50+ components using glass/paper effects, JSON manifests beat copy-paste CSS.

**Q: What if I need CSS properties MDS doesn't support?**

A: `customCSS` field covers ~90% of CSS properties. MDS focuses on common material patterns, not every CSS edge case.

```json
{
  "customCSS": {
    "clip-path": "polygon(...)",
    "mix-blend-mode": "multiply"
  }
}
```

---

### HCI & Accessibility

**Q: Does this support reduced motion preferences?**

A: Yes, check `prefers-reduced-motion` and conditionally disable physics:

```javascript
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  delete material.behavior.physics
}
```

**Q: What about ARIA/semantic HTML?**

A: MDS doesn't touch semantic HTML or ARIA. Apply materials to accessible markup:

```html
<button aria-label="Close" data-material="@mds/glass">×</button>
```

**Q: High contrast mode?**

A: Use theme system + `prefers-contrast`:

```json
{
  "theme": {
    "high-contrast": {
      "optics": { "opacity": 1 },
      "surface": { "border": "2px solid currentColor" }
    }
  }
}
```

**Q: Keyboard navigation?**

A: MDS preserves native focus behavior. Use `states.focus` to style focus states:

```json
{
  "states": {
    "focus": {
      "surface": { "border": "2px solid var(--focus-color)" }
    }
  }
}
```

---

### Academic & Research

**Q: Can I use this in my research project?**

A: Yes! MIT licensed. Please cite using the [BibTeX format above](#academic-citations).

**Q: Has this been peer-reviewed?**

A: No, MDS is an open-source project, not a research paper. It's based on established HCI/design principles but hasn't undergone formal peer review.

**Q: Where's the user study/empirical validation?**

A: Not conducted yet. Contributions welcome! Would love to see:
- Learnability studies (MDS vs Tailwind vs CSS-in-JS)
- Cognitive load measurements
- User perception of material metaphors
- Accessibility impact studies

**Q: Can I use this as a case study for my thesis?**

A: Absolutely! Feel free to reach out if you need additional context or documentation.

---

### Integration & Ecosystem

**Q: Can I use this with React/Vue/Svelte?**

A: Yes, framework-agnostic. Just apply `data-material` to DOM elements:

```jsx
// React
<div data-material="@mds/glass">Content</div>

// Vue
<div :data-material="'@mds/glass'">Content</div>

// Svelte
<div data-material="@mds/glass">Content</div>
```

Future: Official wrapper components planned.

**Q: Figma/Design tool integration?**

A: Not yet. **Future work**: Figma plugin to export visual effects → `.mdm.json`.

**Q: Design token compatibility?**

A: Yes! Reference tokens in material definitions:

```json
{
  "optics": {
    "tint": "var(--color-primary)",
    "opacity": "var(--opacity-glass)"
  }
}
```

**Q: TypeScript support?**

A: Full type definitions included:

```typescript
import type { Material } from '@v1b3x0r/mds-core'

const myMaterial: Material = {
  optics: { tint: '#fff' }
}
```

**Q: Can I use this with Storybook/component library?**

A: Yes! Apply materials to your components:

```jsx
// Button.stories.jsx
export const GlassButton = {
  render: () => <button data-material="@mds/glass">Click me</button>
}
```

---

### Performance & Scale

**Q: Performance at 1000+ elements?**

A: Tested up to 100 elements (smooth 60fps). Larger scales need benchmarking. For massive scale (10,000+ elements), consider pre-rendering to CSS classes.

**Q: Bundle size impact?**

A: **6.7KB gzipped (ESM)** - comparable to small utility libraries like `clsx` or `classnames`.

**Q: Server-side rendering (SSR)?**

A: MDS runs client-side currently. **Future feature**: Pre-render materials to inline styles during SSR.

**Q: Does this cause layout thrashing?**

A: No. MDS applies styles in batches during `requestAnimationFrame` callbacks. Minimal reflow/repaint.

---

### Comparison

**Q: MDS vs Material-UI/Chakra/Mantine?**

A: Those are **component libraries**. MDS is a **material property system**. You can use MDS *with* component libraries:

```jsx
// Chakra UI + MDS
<Button data-material="@mds/glass" colorScheme="blue">
  Click me
</Button>
```

**Q: MDS vs CSS variables/custom properties?**

A: CSS variables are **tokens** (single values). MDS uses **manifests** (structured material specs with inheritance, states, themes). Both solve different problems.

**Q: MDS vs Web Components?**

A: Web Components encapsulate **markup + style + behavior**. MDS only handles **material properties**, works with or without Web Components.

**Q: MDS vs Stitches/Vanilla Extract?**

A: Those are **CSS-in-JS solutions** (style authoring). MDS is **material definition system** (declarative materials). Can be used together.

---

## ⚠️ When NOT to Use MDS

Be honest about limitations:

### ❌ Don't use if:

- **Small projects** (< 5 components): Overkill, just use CSS
- **No repeated patterns**: If not reusing materials, manifests add complexity
- **Photorealistic 3D**: Need Three.js/Babylon.js for WebGL-based materials
- **Team unfamiliar with declarative paradigms**: Learning curve exists
- **Need every CSS property**: MDS covers ~90%, use plain CSS for edge cases

### ✅ Use if:

- **Design system** with consistent material language
- **Multiple components** share glass/paper/metal effects
- **Need theme variations** (light/dark/high-contrast)
- **Want separation** between material and layout concerns
- **Building component library** with reusable materials

---

## 📐 Specification & Standards

### MDSpec Format

Materials use `.mdm.json` (Material Definition Manifest):

```typescript
interface Material {
  // Meta
  name?: string
  version?: string
  description?: string
  author?: string
  license?: string
  tags?: string[]
  inherits?: string  // Extend another material

  // Core
  optics?: {
    opacity?: number          // 0..1
    tint?: string            // color
    blur?: string            // "12px"
    saturation?: string      // "120%"
    brightness?: string      // "110%"
    contrast?: string        // "105%"
  }

  surface?: {
    radius?: string          // border-radius
    border?: string          // border
    shadow?: string | string[]  // box-shadow(s)
    texture?: {
      src: string            // URL or data URI
      repeat?: string        // "repeat" | "no-repeat"
      size?: string          // "200px 200px"
    }
  }

  behavior?: {
    cursor?: string          // cursor style
    transition?: string      // CSS transition
    physics?: string         // External physics file URL
    physicsParams?: Record<string, any>  // Physics parameters
  }

  // Advanced
  customCSS?: Record<string, string>  // Any CSS property

  states?: {
    base?: Partial<Material>
    hover?: Partial<Material>
    press?: Partial<Material>
    'pressed-and-moving'?: Partial<Material>
    focus?: Partial<Material>
    disabled?: Partial<Material>
  }

  theme?: {
    light?: Partial<Material>
    dark?: Partial<Material>
  }
}
```

Full spec: **[MATERIAL_GUIDE.md](./MATERIAL_GUIDE.md)**

### Versioning

MDS follows **semantic versioning**. Material manifests include `version` field for compatibility tracking.

---

## 🗺️ Roadmap & Future Work

### Planned (v3.x)

- [ ] **Figma plugin**: Export Figma effects → `.mdm.json`
- [ ] **Material marketplace**: Community material registry
- [ ] **SSR support**: Pre-render to inline styles
- [ ] **Framework wrappers**: React/Vue/Svelte components
- [ ] **Build tool plugins**: Vite/Webpack for manifest bundling
- [ ] **CLI tool**: Create, validate, preview materials
- [ ] **VSCode extension**: Syntax highlighting + autocomplete for `.mdm.json`

### Research Directions

- [ ] **User studies**: Learnability, cognitive load vs alternatives
- [ ] **Performance benchmarks**: Large-scale rendering tests
- [ ] **Accessibility guidelines**: Best practices for material design
- [ ] **Perception studies**: Do users perceive material metaphors?

### Community Requests

Track feature requests and discussions at:
**[GitHub Issues](https://github.com/v1b3x0r/material-js-concept/issues)**

---

## 🧑‍💻 Contributing

### What We Need

**🎨 Visual Designers** (high priority!):
- Improve built-in materials (`@mds/glass` is too subtle)
- Create community material packs (neumorphic, glassmorphic, metal, fabric)
- Design system integration examples
- Figma design tokens → MDS manifest workflows

**🔬 HCI Researchers**:
- Conduct user studies (learnability, cognitive load)
- Accessibility testing and guidelines
- Performance benchmarks at scale
- User perception studies

**👨‍💻 Developers**:
- Framework wrappers (React, Vue, Svelte)
- Build tool plugins (Vite, Webpack, Rollup)
- Performance optimization
- SSR/pre-rendering support

**📚 Technical Writers**:
- Improve documentation clarity
- Create tutorials and guides
- Translate documentation
- Video tutorials

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Contribution Guidelines

- Follow existing code style (TypeScript + ESLint)
- Add tests for new features
- Update documentation (README, MATERIAL_GUIDE)
- For new materials: Add to `/manifests/@community/`
- For breaking changes: Discuss in issue first

See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for detailed guidelines.

---

## 🌐 Browser Support

- **Chrome/Edge**: 90+
- **Firefox**: 88+
- **Safari**: 14+

**Required CSS features**:
- `backdrop-filter` (for glass materials)
- CSS custom properties
- `MutationObserver` (for dynamic content)

---

## 📦 Package Info

```bash
# Install
npm install @v1b3x0r/mds-core

# Package size
- ESM: 25.77 KB │ gzip: 6.78 KB
- UMD: 27.94 KB │ gzip: 7.03 KB

# Dependencies: 0 ✅
# TypeScript: Included ✅
# CDN: Available (unpkg, jsDelivr) ✅
```

---

## 📚 Documentation

- **[MATERIAL_GUIDE.md](./MATERIAL_GUIDE.md)** - Complete material reference (28+ properties)
- **[CLAUDE.md](./CLAUDE.md)** - AI context, decisions, architecture philosophy
- **[npm package](https://www.npmjs.com/package/@v1b3x0r/mds-core)** - npm registry page
- **[GitHub repo](https://github.com/v1b3x0r/material-js-concept)** - Source code
- **[Interactive Demo](https://v1b3x0r.github.io/material-js-concept/)** - Live demo with physics

---

## 📖 References & Further Reading

### Design Systems

- [Material Design](https://material.io) - Google's design language
- [Fluent Design](https://fluent2.microsoft.design) - Microsoft's design system
- [Design Tokens](https://designtokens.org) - W3C community group

### Academic Papers

- Norman, D. (1988). *The Design of Everyday Things*
- Ishii, H. & Ullmer, B. (1997). *Tangible Bits: Towards Seamless Interfaces between People, Bits and Atoms*
- Card, S. K., Moran, T. P., & Newell, A. (1983). *The Psychology of Human-Computer Interaction*

### Related Projects

- [Three.js Materials](https://threejs.org/docs/#api/en/materials/Material) - 3D WebGL materials
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [Stitches](https://stitches.dev) - CSS-in-JS with near-zero runtime
- [Vanilla Extract](https://vanilla-extract.style) - Zero-runtime CSS-in-TypeScript

---

## 📄 License

MIT © [v1b3x0r](https://github.com/v1b3x0r)

---

## 🙏 Acknowledgments

Built with honesty about limitations. The system architecture is production-ready, but built-in materials are minimal due to my lack of visual design skills.

**Inspired by**:
- Material Design (Google)
- Neumorphism movement
- CSS-in-JS libraries
- Design token systems
- HCI research on tangible interfaces

**Special thanks**:
- HCI research community
- Open-source contributors
- Early adopters and feedback providers

---

**For designers**: You can build **beautiful materials** with 28+ properties + `customCSS` support. The system just needs creative people to show what's possible!

**For researchers**: This is an open playground for HCI research. Empirical studies, user studies, and accessibility research are all welcome contributions.

**For developers**: The architecture is solid. Let's build amazing tools and integrations together.
