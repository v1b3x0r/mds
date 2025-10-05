# Material System

A production-ready library for material-driven styling - think in materials, not CSS properties.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/material-js-concept)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Size](https://img.shields.io/badge/size-9KB%20minified-orange.svg)](material-system.min.js)

## Quick Start

### CDN (Recommended)

```html
<!-- Include Material System -->
<script src="https://cdn.jsdelivr.net/gh/yourusername/material-js-concept/material-system.min.js"></script>

<!-- Use materials -->
<div data-material="glass">Glass Card</div>
<button data-material="paper">Paper Button</button>
```

### Local Installation

```bash
# Download material-system.js
curl -O https://raw.githubusercontent.com/yourusername/material-js-concept/main/material-system.js
```

```html
<script src="./material-system.js"></script>
```

That's it! The system auto-initializes and applies materials on page load.

---

## The Concept

Instead of thinking in CSS properties and utility classes, think in real-world materials.

### Traditional Approach
```html
<div class="bg-white/90 backdrop-blur-md shadow-lg border border-gray-200/50 rounded-xl p-6">
  Card
</div>
```

### Material-Driven Approach
```html
<div data-material="glass">
  Card
</div>
```

## Why Material-Driven?

### 1. Better Mental Model
Developers and designers think in materials ("this should be glass") rather than CSS properties ("this needs backdrop-filter, opacity, border, shadow...").

### 2. Automatic Consistency
Every element using `data-material="glass"` looks identical. No more inconsistent "glass effects" across the app because different developers implemented them differently.

### 3. Design-to-Code Bridge
Designers can specify materials in their mockups. Developers use the exact same vocabulary. No translation layer needed.

### 4. Single Source of Truth
Change the glass material definition once, and every glass element updates automatically. No need to hunt down 47 different glass-styled components.

### 5. Semantic Clarity
`data-material="glass"` is more meaningful than a string of utility classes. It describes what the element IS, not just how it looks.

## Features

- **Standalone Package**: Zero external dependencies - just include `material-system.js` and it works
- **2 Core Materials**: Glass, Paper (proven, production-ready)
- **State Management**: Automatic hover, active, focus, disabled states (only for interactive elements)
- **Theme Support**: Dark/light theme with auto-adaptation
- **Material Inheritance**: Extend existing materials to create custom ones
- **Zero Dependencies**: Pure vanilla JavaScript, no CSS files required
- **Tiny**: ~9KB minified, ~2.4KB gzipped
- **Framework Agnostic**: Works with React, Vue, vanilla HTML

---

## Standalone Package - No CSS Required

Material System is a **true standalone package**. Unlike most UI libraries, you don't need to import any CSS files:

```html
<!-- ✅ This is all you need -->
<script src="material-system.js"></script>

<!-- ❌ NO CSS imports required -->
<!-- No styles.css, no theme.css, nothing -->
```

**Why?** All material properties (colors, blur, shadows, borders) are hardcoded in the JavaScript package. This means:

- **Zero configuration**: Drop in one `<script>` tag and you're done
- **No build step**: Works directly in the browser
- **No style conflicts**: Material properties are applied via inline styles, isolated from your CSS
- **Framework-friendly**: Works with any CSS framework (Tailwind, Bootstrap, etc.) without conflicts

The demo page includes `styles.css`, but that's **only for the demo** (typography, layout, body background). Users of Material System package don't need it.

### Separation of Concerns

When using Material System with Tailwind (or any CSS framework):

```html
<!-- Tailwind handles: layout, spacing, sizing -->
<!-- Material System handles: visual appearance -->
<button class="px-4 py-2 rounded-full flex items-center gap-2" data-material="glass">
  Click me
</button>
```

---

## API Reference

### MaterialSystem.register()

Register a new material with optional states:

```javascript
MaterialSystem.register('material-name', {
  base: {
    background: '#color',
    // ... base styles
  },
  hover: {
    // ... hover state styles
  },
  active: {
    // ... active state styles
  },
  disabled: {
    // ... disabled state styles
  },
  dark: {
    // ... dark theme overrides
  },
  light: {
    // ... light theme overrides
  }
});
```

### MaterialSystem.extend()

Extend an existing material:

```javascript
MaterialSystem.extend('frosted-glass', 'glass', {
  base: {
    backdropFilter: 'blur(20px)' // override property
  }
});
```

### MaterialSystem.setTheme()

Switch theme:

```javascript
MaterialSystem.setTheme('dark'); // or 'light'
```

### MaterialSystem.apply()

Manually re-apply all materials (usually not needed):

```javascript
MaterialSystem.apply();
```


---

## Examples

### Basic Usage

```html
<div data-material="glass">Glass Card</div>
<button data-material="paper">Paper Button</button>
```

### Custom Materials

Create your own materials from scratch or extend existing ones:

```javascript
// Create entirely new material
MaterialSystem.register('metal', {
  base: {
    background: 'linear-gradient(135deg, #434343 0%, #282828 100%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
    color: '#e0e0e0'
  },
  hover: {
    boxShadow: '0 6px 24px rgba(0, 0, 0, 0.4)',
    transform: 'translateY(-2px)'
  }
});

// Extend existing material
MaterialSystem.extend('frosted-glass', 'glass', {
  base: {
    backdropFilter: 'blur(20px)' // More blur than regular glass
  }
});

// Wood material example
MaterialSystem.register('wood', {
  base: {
    background: 'linear-gradient(90deg, #8B7355 0%, #6F5643 25%, #8B7355 50%)',
    boxShadow: 'inset 0 0 60px rgba(101, 67, 33, 0.3)',
    border: '1px solid rgba(70, 50, 30, 0.6)',
    color: '#f5e6d3'
  }
});

// Fabric material example
MaterialSystem.register('fabric', {
  base: {
    background: 'linear-gradient(45deg, transparent 48%, rgba(0,0,0,0.02) 48%)',
    backgroundSize: '10px 10px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    color: '#3d3d3d'
  }
});

// Holographic material example
MaterialSystem.register('holo', {
  base: {
    background: 'linear-gradient(125deg, rgba(255, 0, 200, 0.3), rgba(0, 200, 255, 0.3))',
    backgroundSize: '400% 100%',
    backdropFilter: 'blur(10px) saturate(200%)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    color: '#ffffff',
    transition: 'background-position 0.8s ease'
  },
  hover: {
    backgroundPosition: '100% 0%'
  }
});
```

---

## How is this Different?

| Approach | Mental Model | Best For | Example |
|----------|--------------|----------|---------|
| **Tailwind** (Utility-First) | "Apply these visual properties" | Rapid prototyping, pixel-perfect control | `bg-white/90 backdrop-blur-md shadow-lg...` |
| **Material System** | "This is made of glass" | Consistency, design system enforcement | `data-material="glass"` |
| **MUI/Bootstrap** | "Use this component" | Speed, comprehensive UI kit | `<Button variant="contained">` |
| **CSS-in-JS** | "Style this component" | Dynamic styling, encapsulation | `styled.div\`...\`` |

### When to Use Material System?

**Good fit:**
- Building design systems with strong visual consistency
- Designer-developer collaboration (shared vocabulary)
- Repeating UI patterns (cards, modals, panels)
- Need to switch themes/styles globally
- Want semantic, maintainable styling

**Not ideal for:**
- One-off unique designs
- Need pixel-perfect custom control per element
- Already using comprehensive component libraries
- Ultra-performance-critical applications

---

## Core Materials

| Material | Description | Use Cases |
|----------|-------------|-----------|
| **glass** | Frosted glass with blur and transparency | Overlays, modern cards, modals, navigation |
| **paper** | Soft matte surface with subtle texture | Content containers, forms, documents |

All materials support:
- Hover states (automatic)
- Active states (automatic)
- Disabled states (automatic)
- Dark/light theme adaptation

**Note**: The library ships with 2 proven, production-ready materials. You can easily create additional materials (Metal, Wood, Fabric, Holo, etc.) using the examples in the [Custom Materials](#custom-materials) section.

---

## Browser Support

Works in all modern browsers that support:
- `backdrop-filter` (Chrome 76+, Safari 9+, Firefox 103+)
- CSS custom properties
- ES6 JavaScript

For older browsers, materials gracefully degrade (blur effects won't work but basic styling remains).

---

## Philosophy

Material System isn't about replacing existing tools - it's a different way to think about styling:

- **Tailwind**: Compose atomic utilities → complete design
- **Styled Components**: Encapsulate styles with components
- **Material System**: Declare materials → inherit all properties

Each approach has its place. Material System excels when you need:
- Shared designer-developer vocabulary
- Strong visual consistency
- Easy global theme changes
- Semantic, maintainable code

---

## Technical Details

- **Size**: ~17KB source, ~9KB minified, ~2.4KB gzipped
- **Dependencies**: Zero
- **Browser**: Modern browsers (ES6+, backdrop-filter)
- **Framework**: Agnostic (works with React, Vue, vanilla)
- **License**: MIT

### How it Works Internally

1. **Auto-initialization**: Loads and applies materials on DOM ready
2. **MutationObserver**: Watches for dynamic content and applies materials automatically
3. **Event handlers**: Attaches state handlers (hover, active, focus) to interactive elements
4. **Theme system**: Merges theme-specific styles with base/state styles
5. **Token resolution**: Resolves `@token.path` syntax to actual material names

---

## Contributing

This is a proof of concept / production-ready library. Feel free to:
- Fork and extend
- Report issues
- Suggest new materials
- Share your use cases

---

## Inspiration

- **Material Design** (Google) - elevation and surface concepts
- **Fluent Design** (Microsoft) - acrylic materials
- **Glassmorphism** - transparent, blurred surfaces
- **Real-world materials** - how physical objects look and feel

---

## License

MIT License - use it however you want.

---

## Demo

**[View Live Demo](https://material-js-concept.vercel.app/)** - See Material System in action:
- Global material switcher (switch entire page between Paper/Glass)
- Theme switching (dark/light)
- State transitions (hover, active)
- Material inheritance examples
- Clean implementation with Tailwind + Material System
