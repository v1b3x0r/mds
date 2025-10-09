# Material Definition System (MDS) v2.0

> **Think in materials, not CSS properties**

A production-ready, physics-based material system for modern web applications. Define UI as real-world materials with intrinsic behavior, not just visual styling.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/yourusername/material-js-concept)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Size](https://img.shields.io/badge/size-4KB%20gzipped-orange.svg)](dist/mds.umd.js)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](src/index.ts)

## Quick Start

### CDN (Recommended)

```html
<!-- Include MDS -->
<script src="https://cdn.jsdelivr.net/npm/@mds/core@2.0.0/dist/mds.umd.js"></script>

<!-- Use materials -->
<div data-material="@mds/glass-liquid">
  Hello, Material World!
</div>
```

### npm

```bash
npm install @mds/core
```

```javascript
import { materialSystem } from '@mds/core'

// Install official materials
await materialSystem.install(['@mds/glass-liquid', '@mds/paper-polkadot'])

// Create custom material
materialSystem.register('my-glass', {
  optics: { blur: '20px', tint: 'rgba(255,255,255,0.15)' },
  behavior: { elasticity: 0.4, snapBack: true }
})
```

---

## The Concept

Instead of thinking in CSS properties and utility classes, think in real-world materials.

### Traditional Approach
```html
<div class="bg-white/10 backdrop-blur-lg shadow-xl border border-white/20 rounded-xl">
  Card
</div>
```

### Material-Driven Approach
```html
<div data-material="@mds/glass-liquid">
  Card
</div>
```

**Same result, but:**
- ✅ **Semantic**: Describes *what it is*, not *how it looks*
- ✅ **Consistent**: All glass elements behave identically
- ✅ **Physics-aware**: Materials have intrinsic behavior (elasticity, drag)
- ✅ **Theme-reactive**: Automatically adapts to light/dark mode
- ✅ **State-driven**: Hover, press, drag states built-in

---

## What's New in v2.0

### 🎨 Domain-Based Architecture

Materials are defined by three domains:

```javascript
{
  optics: {    // Light interaction
    opacity, tint, blur, brightness, contrast, saturation
  },
  surface: {   // Texture & edges
    radius, shadow, texture: { src, repeat, size, rotation }
  },
  behavior: {  // Physics response
    elasticity, viscosity, snapBack
  }
}
```

### 🎯 Contact States

Advanced state machine beyond hover/active:

```
base → hover → press → drag → release
       ↓
     focus
```

### 🌊 Physics-Based Behavior

Materials respond naturally with real physics:
- **Elasticity**: Spring-based compression on press
- **Viscosity**: Drag damping during movement
- **SnapBack**: Return to origin with spring animation

### 📦 JSON Manifests

Author materials in JSON (`.mdm.json`):

```json
{
  "name": "@username/neon-glass",
  "inherits": "@mds/glass",
  "optics": {
    "tint": "rgba(0, 255, 255, 0.2)",
    "brightness": "120%"
  },
  "behavior": {
    "elasticity": 0.5,
    "snapBack": true
  }
}
```

### 🏷️ npm-Style Naming

```
@mds/glass-liquid         # Official materials
@username/custom-material # Community materials
my-material               # Local materials
```

---

## Features

- **Zero Dependencies**: Pure vanilla TypeScript/JavaScript
- **Tiny Bundle**: ~4KB gzipped (UMD), ~6KB (ESM)
- **Physics Engine**: Spring animations, drag damping, elastic response
- **Schema-Driven**: JSON manifests for easy authoring
- **TypeScript**: Full type definitions included
- **Framework Agnostic**: Works with React, Vue, Svelte, vanilla
- **Auto-Initialize**: Works out of the box, no setup required
- **Theme Support**: Automatic light/dark mode adaptation
- **State Management**: Hover, press, drag, focus states automatic
- **Texture Support**: SVG patterns with rotation
- **Material Inheritance**: Extend and customize existing materials

---

## Official Materials

| Material | Description | Use Cases |
|----------|-------------|-----------|
| **@mds/glass** | Clean transparency with blur | Cards, overlays, navigation |
| **@mds/glass-liquid** | Elastic glass with physics | Interactive buttons, draggable items |
| **@mds/glass-frosted** | Heavy blur for privacy | Modals, backgrounds |
| **@mds/paper** | Soft matte surface | Forms, documents, content containers |
| **@mds/paper-polkadot** | Textured paper with SVG pattern | Decorative cards, playful UI |
| **@mds/wood** | Natural grain texture | Warm, organic interfaces |

---

## API Reference

### MaterialSystem.register()

Register a new material:

```javascript
materialSystem.register('@username/neon', {
  optics: {
    opacity: 0.9,
    tint: 'rgba(0, 255, 255, 0.3)',
    blur: '16px',
    brightness: '120%'
  },
  surface: {
    radius: '12px',
    shadow: '0 0 20px cyan'
  },
  behavior: {
    elasticity: 0.4,
    viscosity: 0.2,
    snapBack: true
  },
  states: {
    hover: {
      optics: { brightness: '130%' }
    },
    press: {
      optics: { brightness: '110%' }
    }
  },
  theme: {
    light: {
      optics: { tint: 'rgba(0, 200, 200, 0.2)' }
    }
  }
})
```

### MaterialSystem.extend()

Extend existing material:

```javascript
materialSystem.extend('my-frosted', '@mds/glass', {
  optics: {
    blur: '40px'  // Override blur only
  }
})
```

### MaterialSystem.install()

Load materials from CDN:

```javascript
// Single material
await materialSystem.install('@mds/glass-liquid')

// Multiple materials
await materialSystem.install([
  '@mds/glass-liquid',
  '@mds/paper-polkadot',
  '@mds/wood'
])

// Custom CDN
await materialSystem.install('@custom/material', {
  cdn: 'https://my-cdn.com/manifests'
})
```

### MaterialSystem.setTheme()

Switch theme:

```javascript
materialSystem.setTheme('light')  // Light mode
materialSystem.setTheme('dark')   // Dark mode
materialSystem.setTheme('auto')   // Follow system preference
```

### MaterialSystem.apply()

Manually re-apply materials:

```javascript
// Re-apply all materials
materialSystem.apply()

// Apply to specific subtree
materialSystem.apply(document.getElementById('my-section'))
```

---

## Material Schema (MDSpec)

### Optics Domain

```typescript
optics?: {
  opacity?: number          // 0..1
  tint?: string            // CSS color
  blur?: string            // e.g. "12px"
  brightness?: string      // e.g. "110%"
  contrast?: string        // e.g. "105%"
  saturation?: string      // e.g. "120%"
}
```

Maps to: `opacity`, `backdrop-filter`, `filter`, `background-color`

### Surface Domain

```typescript
surface?: {
  radius?: string          // border-radius
  shadow?: string          // box-shadow
  texture?: {
    src: string            // URL or data URI
    repeat?: 'repeat' | 'no-repeat' | 'repeat-x' | 'repeat-y'
    size?: string          // e.g. "24px 24px"
    rotation?: string      // e.g. "15deg"
  }
}
```

Maps to: `border-radius`, `box-shadow`, `background-image`, pseudo-elements

### Behavior Domain

```typescript
behavior?: {
  elasticity?: number      // 0..1 (press spring strength)
  viscosity?: number       // 0..1 (drag damping)
  snapBack?: boolean       // return to origin on release
}
```

Maps to: Dynamic `transform` animations via requestAnimationFrame

### States

```typescript
states?: {
  base?: Material         // Default state
  hover?: Material        // Pointer over
  press?: Material        // Pointer down
  drag?: Material         // Pointer down + move
  focus?: Material        // Keyboard focus
  disabled?: Material     // Disabled attribute
}
```

### Theme

```typescript
theme?: {
  light?: Material        // Light mode overrides
  dark?: Material         // Dark mode overrides
}
```

---

## Examples

### Basic Usage

```html
<button data-material="@mds/glass-liquid">
  Click me
</button>
```

### Custom Material

```javascript
materialSystem.register('brand-primary', {
  inherits: '@mds/glass',
  optics: {
    tint: 'rgba(59, 130, 246, 0.2)',  // Brand blue
    brightness: '110%'
  },
  behavior: {
    elasticity: 0.3,
    snapBack: true
  }
})
```

```html
<div data-material="brand-primary">
  Brand colored glass
</div>
```

### Material Inheritance

```javascript
// Base material
materialSystem.register('base-glass', {
  optics: { blur: '16px', opacity: 0.9 },
  surface: { radius: '12px' }
})

// Variant 1
materialSystem.extend('glass-blue', 'base-glass', {
  optics: { tint: 'rgba(0, 100, 255, 0.2)' }
})

// Variant 2
materialSystem.extend('glass-strong', 'base-glass', {
  optics: { blur: '30px' },
  behavior: { elasticity: 0.5 }
})
```

---

## How It Works Internally

1. **Auto-initialization**: MDS initializes on page load
2. **MutationObserver**: Watches for dynamic `[data-material]` elements
3. **Material Resolution**: Resolves inheritance chain and merges properties
4. **Domain Mapping**: Maps optics/surface/behavior to CSS properties
5. **State Machine**: Attaches pointer event listeners to interactive elements
6. **Physics Loop**: Runs rAF animations for drag/spring behaviors
7. **Theme Reactivity**: Listens to `prefers-color-scheme` media query

### Performance

- ✅ First apply: <2 frames for 100 elements
- ✅ Pointer response: <8ms median
- ✅ Drag animation: 60fps
- ✅ GPU-accelerated: Only `transform`/`opacity`/`filter`
- ✅ No layout thrashing: Read/write batching
- ✅ Memory safe: WeakMap cleanup

---

## Browser Support

Works in all modern browsers supporting:
- Pointer Events (Chrome 55+, Safari 13+, Firefox 59+)
- `backdrop-filter` (Chrome 76+, Safari 9+, Firefox 103+)
- CSS Custom Properties (all modern browsers)
- ES2020 JavaScript

Graceful degradation: Blur effects won't work in older browsers, but basic styling remains.

---

## Philosophy

### Why Material-Driven?

**Traditional CSS**: "Apply these 15 properties to make it look like glass"
```css
.card {
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.25);
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  /* ... 10 more properties */
}
```

**Material System**: "This IS glass"
```html
<div data-material="@mds/glass">
```

**Benefits**:
1. **Designer-Developer Shared Language**: "Make it glass" → `data-material="glass"`
2. **Consistency**: All glass elements identical by default
3. **Maintainability**: Change glass once, update everywhere
4. **Physics-Aware**: Materials have intrinsic behavior
5. **Semantic**: Code describes intent, not implementation

---

## Contributing

### Creating Materials

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for material authoring guidelines.

### Reporting Issues

Report bugs at [GitHub Issues](https://github.com/yourusername/material-js-concept/issues)

---

## Inspiration

- **Material Design** (Google) - elevation and surface concepts
- **Fluent Design** (Microsoft) - acrylic materials
- **Glassmorphism** - transparent, blurred surfaces
- **Real-world physics** - how physical objects behave

---

## License

MIT License - use it however you want.

---

## Demo

**[View Live Demo](https://material-js-concept.vercel.app/)**

See MDS in action with:
- Interactive material gallery
- Physics playground
- Theme switching
- Live code examples

---

## Roadmap

### v2.1 (Q1 2025)
- [ ] React/Vue/Svelte component wrappers
- [ ] Figma plugin (export designs as MDM)
- [ ] Material marketplace
- [ ] Animation timeline control

### v2.2 (Q2 2025)
- [ ] Metal material (anisotropic reflections)
- [ ] Fabric material (woven textures)
- [ ] Particle effects (gas, smoke)
- [ ] 3D depth via CSS transforms

### v3.0 (Future)
- [ ] WebGL/WebGPU renderer for advanced effects
- [ ] Fluid simulations
- [ ] Material Design v4 compatibility
- [ ] W3C standard proposal?

---

**Made with 💎 by the MDS Team**

Think in materials, not CSS properties.
