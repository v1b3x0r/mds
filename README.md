# Material Definition System (MDS) v2.0

> **Think in materials, not CSS properties**

**Status**: ⚠️ Architectural Demo (ไม่พร้อมใช้งานจริง)
**Reality**: Materials barely visible, requires specific lighting to see effects
**Purpose**: Proof of concept for manifest-driven material system

---

## What is MDS?

Material Definition System เป็น JavaScript library ที่ให้คุณประกาศ **วัสดุ** (materials) ผ่าน JSON manifests แทนการเขียน CSS properties ซ้ำๆ

**Traditional CSS approach:**
```html
<div class="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
  Content
</div>
```

**MDS approach:**
```html
<div data-material="glass">
  Content
</div>
```

---

## Quick Start

### Installation

```html
<!-- CDN (recommended) -->
<script src="https://your-domain.vercel.app/dist/material-system.js"></script>

<!-- Manual -->
<script src="path/to/material-system.js"></script>
```

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
  <script src="material-system.js"></script>
</head>
<body>
  <!-- Use built-in materials -->
  <div data-material="@mds/glass">Glass element</div>
  <div data-material="@mds/paper">Paper element</div>

  <script>
    // Load materials from CDN
    MaterialSystem.install(['@mds/glass', '@mds/paper'])
  </script>
</body>
</html>
```

---

## Core Features

### ✅ What MDS Does

- **Manifest-driven**: Define materials in JSON, not CSS
- **Theme support**: Automatic light/dark mode
- **State management**: hover, active, focus, disabled
- **Material inheritance**: Extend existing materials
- **Zero dependencies**: Standalone, no external CSS required
- **CDN support**: Load materials from remote sources

### ⚠️ What MDS Doesn't Do

- **Not production-ready**: Materials barely visible in most lighting
- **Not a CSS replacement**: Layout/typography still need CSS/Tailwind
- **Not photorealistic**: Cannot achieve true liquid glass or PBR materials
- **No dynamic effects**: No mouse tracking, parallax, or real-time lighting (without WebGL)

### Current Limitations

| Feature | Support |
|---------|---------|
| Static visual properties | ✅ ~40-50% |
| With `customCSS` field | ✅ ~90% |
| Dynamic lighting | ❌ CSS limitation |
| Mouse-tracking effects | ❌ Requires custom JS |
| PBR materials | ❌ Requires WebGL |
| Unreal Engine-level detail | ❌ Not possible with CSS |

---

## Built-in Materials

### `@mds/glass`
Simplified glass effect - demonstrates the concept but lacks true liquid glass depth and refraction (technical limitation)

**Visual**: Very subtle, barely visible in light theme, slightly more visible in dark

### `@mds/paper`
Matte paper with realistic noise texture

**Visual**: Subtle texture, works better than glass but still minimal contrast

---

## Creating Custom Materials

See **[MATERIAL_GUIDE.md](./MATERIAL_GUIDE.md)** for comprehensive documentation on:
- All 28+ available properties
- Complete examples (beginner to advanced)
- Validation rules and common mistakes
- `customCSS` field for CSS experts
- Theme and state variations

**Quick example:**

```json
{
  "name": "my-material",
  "optics": {
    "opacity": 0.95,
    "tint": "#ffffff"
  },
  "surface": {
    "radius": "12px",
    "border": "1px solid rgba(255, 255, 255, 0.2)",
    "shadow": "0 8px 32px rgba(0, 0, 0, 0.1)"
  },
  "states": {
    "hover": {
      "optics": { "opacity": 1 }
    }
  }
}
```

---

## API Reference

### `MaterialSystem.install(names, options?)`

Load materials from CDN.

```javascript
// Single material
await MaterialSystem.install('@mds/glass')

// Multiple materials
await MaterialSystem.install(['@mds/glass', '@mds/paper'])

// Custom CDN
await MaterialSystem.install('@mds/glass', {
  cdn: 'https://custom-cdn.com'
})
```

### `MaterialSystem.register(name, material)`

Register material from JavaScript object.

```javascript
MaterialSystem.register('custom', {
  optics: { tint: '#ff0000' },
  surface: { radius: '8px' }
})
```

### `MaterialSystem.registerFromManifest(manifest)`

Register from JSON manifest.

```javascript
const manifest = await fetch('./my-material.mdm.json').then(r => r.json())
await MaterialSystem.registerFromManifest(manifest)
```

### `MaterialSystem.extend(name, baseName, overrides)`

Extend existing material.

```javascript
MaterialSystem.extend('glass-blue', '@mds/glass', {
  optics: { tint: '#0066ff' }
})
```

### `MaterialSystem.setTheme(theme)`

Set theme mode.

```javascript
MaterialSystem.setTheme('dark')   // Force dark
MaterialSystem.setTheme('light')  // Force light
MaterialSystem.setTheme('auto')   // Follow system preference
```

### `MaterialSystem.getTheme()`

Get current resolved theme ('light' or 'dark').

```javascript
const theme = MaterialSystem.getTheme()  // 'light' | 'dark'
```

### `MaterialSystem.getThemeMode()`

Get theme mode including 'auto'.

```javascript
const mode = MaterialSystem.getThemeMode()  // 'light' | 'dark' | 'auto'
```

---

## Architecture

```
┌─────────────────┐
│  JSON Manifest  │  ← Material definition
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MaterialSystem │  ← Runtime engine
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   DOM Element   │  ← data-material="name"
└─────────────────┘
```

### File Structure

```
material-js-concept/
├── src/                     # Source code (TypeScript)
│   ├── core/               # Core system
│   │   ├── types.ts        # Type definitions
│   │   ├── registry.ts     # Material registry
│   │   └── utils.ts        # Utilities
│   ├── mappers/            # Property mappers
│   │   ├── optics.ts       # Visual tinting
│   │   ├── surface.ts      # Texture/geometry
│   │   └── behavior.ts     # Interactions
│   ├── theme/              # Theme management
│   ├── states/             # State machine
│   ├── physics/            # Physics (drag, spring)
│   └── index.ts            # Main entry
├── manifests/              # Material manifests
│   └── @mds/
│       ├── glass.mdm.json
│       └── paper.mdm.json
├── dist/                   # Built files
│   └── material-system.js  # Standalone bundle
├── index.html              # Demo page
└── MATERIAL_GUIDE.md       # Creation guide
```

---

## Philosophy

### Think in Materials, Not Properties

**Traditional CSS thinking:**
- "I need backdrop-filter: blur(20px)"
- "Add opacity: 0.8"
- "Box-shadow: 0 8px 32px..."

**MDS thinking:**
- "This is glass"
- "This is paper"
- "This should feel like metal"

### Separation of Concerns

| Layer | Responsibility | Example |
|-------|---------------|---------|
| **HTML** | Structure | `<div>`, `<button>` |
| **CSS/Tailwind** | Layout/Typography | `px-4`, `flex`, `text-lg` |
| **MDS** | Material Properties | `data-material="glass"` |

**Do NOT mix:**
```html
<!-- ❌ Bad - visual properties in CSS -->
<div class="bg-white/10 backdrop-blur-xl" data-material="glass">

<!-- ✅ Good - clean separation -->
<div class="px-4 py-2 rounded-xl" data-material="glass">
```

---

## Advanced Usage

### Custom CSS for Experts

For CSS properties not covered by optics/surface/behavior, use `customCSS`:

```json
{
  "name": "advanced-material",
  "optics": { "tint": "#fff" },
  "customCSS": {
    "clip-path": "polygon(0 0, 100% 0, 100% 95%, 50% 100%, 0 95%)",
    "mix-blend-mode": "multiply",
    "filter": "drop-shadow(0 0 10px rgba(0,0,0,0.5))"
  }
}
```

**Coverage**: ~90% of CSS properties (vs ~40-50% without customCSS)

**Limitations**: No pseudo-elements, @keyframes, or dynamic values

See [MATERIAL_GUIDE.md](./MATERIAL_GUIDE.md) for full documentation.

---

## Honest Assessment

### What Works

✅ Manifest-driven architecture (clean, scalable)
✅ Theme system (light/dark auto-switching)
✅ State management (hover, active, focus, disabled)
✅ Material inheritance (extend, override)
✅ Zero dependencies (standalone package)
✅ TypeScript support (full type safety)

### What Doesn't Work Well

⚠️ **Visual fidelity**: Materials barely visible, especially in light theme
⚠️ **Production readiness**: Not recommended for real projects yet
⚠️ **Photorealism**: Cannot achieve true liquid glass or PBR without WebGL
⚠️ **Dynamic effects**: Mouse tracking, parallax require custom JavaScript

### Future Improvements Needed

- **Better visual contrast**: Current materials too subtle
- **More built-in materials**: Only 2 shipped (glass, paper)
- **Advanced effects**: Parallax, mouse tracking, dynamic lighting
- **Performance optimization**: Current implementation minimal but untested at scale
- **Documentation**: More examples, tutorials, video guides

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

**Required CSS features**:
- `backdrop-filter` (glass materials)
- CSS variables
- `MutationObserver` (dynamic content)

---

## Contributing

This is an architectural demo. Contributions welcome but understand:
- **Not production-ready**: Visual effects need significant improvement
- **Experimental**: API may change
- **Learning project**: Focus on architecture, not polish

---

## Documentation

- **[MATERIAL_GUIDE.md](./MATERIAL_GUIDE.md)** - How to create materials (complete reference)
- **[CLAUDE.md](./CLAUDE.md)** - AI assistant context (project state, decisions, future work)

---

## License

MIT

---

## Acknowledgments

Built with honesty about limitations. Materials are subtle/barely visible because CSS cannot achieve true photorealistic glass without WebGL/shaders.

**Reality check**: If you need production-ready materials, consider:
- Three.js (WebGL-based)
- Babylon.js (PBR materials)
- Traditional CSS with more contrast

MDS is for learning and experimentation, not production deployment (yet).
