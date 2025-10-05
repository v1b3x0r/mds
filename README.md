# Material System

A production-ready library for material-driven styling - think in materials, not CSS properties.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/material-js-concept)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Size](https://img.shields.io/badge/size-4KB%20minified-orange.svg)](material-system.min.js)

## Quick Start

### CDN (Recommended)

```html
<!-- Include Material System -->
<script src="https://cdn.jsdelivr.net/gh/yourusername/material-js-concept/material-system.min.js"></script>

<!-- Use materials -->
<div data-material="glass">Glass Card</div>
<button data-material="metal">Metal Button</button>
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

- **5 Built-in Materials**: Glass, Metal, Paper, Wood, Fabric
- **State Management**: Automatic hover, active, focus, disabled states
- **Theme Support**: Dark/light theme with auto-adaptation
- **Material Inheritance**: Extend existing materials
- **Design Tokens**: Use semantic tokens (`@surface.primary`)
- **Zero Dependencies**: Pure vanilla JavaScript
- **Tiny**: ~4KB minified, ~1.5KB gzipped
- **Framework Agnostic**: Works with React, Vue, vanilla HTML

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

### Design Tokens

Use semantic tokens instead of direct material names:

```javascript
// Configure tokens
MaterialSystem.tokens.surface.primary = 'glass';

// Use in HTML
<div data-material="@surface.primary">Card</div>
```

---

## Examples

### Basic Usage

```html
<div data-material="glass">Glass Card</div>
<button data-material="metal">Metal Button</button>
```

[See full example](examples/basic.html)

### Custom Materials

```javascript
// Register completely new material
MaterialSystem.register('neon', {
  base: {
    background: 'rgba(0, 255, 255, 0.1)',
    border: '2px solid #00ffff',
    boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
  },
  hover: {
    boxShadow: '0 0 30px rgba(0, 255, 255, 0.8)'
  }
});
```

[See full example](examples/custom-material.html)

### Theme Switching

```javascript
// Switch themes
MaterialSystem.setTheme('light');

// Materials automatically adapt
```

[See full example](examples/theme-switcher.html)

### Design Tokens

```javascript
// Use tokens for easier theming
MaterialSystem.tokens = {
  surface: {
    primary: 'glass',
    secondary: 'paper'
  }
};
```

```html
<div data-material="@surface.primary">Primary Surface</div>
```

[See full example](examples/design-tokens.html)

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

## Built-in Materials

| Material | Description | Use Cases |
|----------|-------------|-----------|
| **glass** | Frosted glass with blur and transparency | Overlays, modern cards, modals |
| **metal** | Brushed metal with gradient | Buttons, premium UI elements |
| **paper** | Soft matte surface | Content containers, forms |
| **wood** | Warm wooden texture | Organic, natural designs |
| **fabric** | Textile-like soft material | Gentle backgrounds, comfortable UI |

All materials support:
- Hover states (automatic)
- Active states (automatic)
- Disabled states (automatic)
- Dark/light theme adaptation (where applicable)

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

- **Size**: ~15KB source, ~4KB minified, ~1.5KB gzipped
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

[View Live Demo](index.html) - Open `index.html` in your browser to see:
- Interactive material switcher
- Theme switching (dark/light)
- State transitions (hover, active)
- Material inheritance examples
- Design token usage
- Comparison with other approaches
