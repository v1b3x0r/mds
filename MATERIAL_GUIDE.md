# Material Creation Guide v3.0

Complete reference for creating custom materials. Reading time: 10 minutes.

---

## Quick Start

**Minimal valid material:**

```json
{
  "name": "@my/material",
  "optics": { "tint": "#fff" }
}
```

**Requirements:**
- Valid JSON (no trailing commas, quoted keys)
- `name` field (required)
- At least one domain: `optics`, `surface`, `behavior`, or `customCSS`

**File format:** `.mdm.json` (UTF-8 encoding)

**Recommended tools:**
- [jsonlint.com](https://jsonlint.com) - JSON validation
- VSCode with JSON schema support

---

## Schema Reference

```typescript
interface Material {
  // Meta
  name: string              // Required
  version?: string
  description?: string
  author?: string
  license?: string
  tags?: string[]

  // Visual domains
  optics?: {
    opacity?: number        // 0-1
    tint?: string          // Color
    blur?: string          // CSS length
    saturation?: string    // Percentage
    brightness?: string
    contrast?: string
  }

  surface?: {
    radius?: string
    border?: string
    shadow?: string | string[]
    texture?: {
      src: string
      repeat?: string
      size?: string
    }
  }

  behavior?: {
    cursor?: string
    transition?: string

    // v3: Physics system
    physics?: string                    // External .physics.js URL
    physicsInline?: string              // Inline code
    physicsParams?: Record<string, any> // Custom params
  }

  // Advanced
  customCSS?: Record<string, string>  // Any CSS property

  // Variants
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

---

## Properties

### Optics (Visual)

| Property | Type | Example | Maps to CSS |
|----------|------|---------|-------------|
| `opacity` | number (0-1) | `0.9` | `opacity` |
| `tint` | string | `"rgba(255,255,255,0.2)"` | `background` |
| `blur` | string | `"22px"` | `backdrop-filter: blur()` |
| `saturation` | string | `"180%"` | `filter: saturate()` |
| `brightness` | string | `"110%"` | `filter: brightness()` |
| `contrast` | string | `"105%"` | `filter: contrast()` |

**Note:** `blur` requires `backdrop-filter` support (Safari 9+, Chrome 76+, Firefox 103+)

**How filters combine:**
```css
filter: saturate(180%) brightness(110%) contrast(105%);
```

---

### Surface (Geometry)

| Property | Type | Example | Maps to CSS |
|----------|------|---------|-------------|
| `radius` | string | `"24px"` | `border-radius` |
| `border` | string | `"1px solid rgba(255,255,255,0.2)"` | `border` |
| `shadow` | string \| array | `["shadow1", "shadow2"]` | `box-shadow` |
| `texture.src` | string | `"data:image/svg+xml,..."` | `background-image` |
| `texture.repeat` | string | `"repeat"` | `background-repeat` |
| `texture.size` | string | `"200px 200px"` | `background-size` |

**Shadow types:**
- Single: `"0 4px 12px rgba(0,0,0,0.1)"`
- Multiple: `["0 1px 2px rgba(0,0,0,0.1)", "0 4px 8px rgba(0,0,0,0.08)"]`
- Inset: `"inset 0 0 0 1px rgba(255,255,255,0.2)"`

---

### Behavior (Interaction + Physics)

| Property | Type | Example | Description |
|----------|------|---------|-------------|
| `cursor` | string | `"pointer"` | Mouse cursor type |
| `transition` | string | `"all 0.3s ease"` | CSS transition |
| `physics` | string | `"./material.physics.js"` | External physics file URL |
| `physicsInline` | string | `"(el, params) => {...}"` | Inline physics code |
| `physicsParams` | object | `{ tension: 55, damping: 3 }` | Custom physics parameters |

**Physics system (v3):**
- **External:** Load from `.physics.js` file (recommended for complex physics)
- **Inline:** Small physics code directly in manifest
- **Parameters:** Pass custom values via `physicsParams`
- **Purpose:** Tactile deformation only (skew/scale, no translate)

**Example - Elastic Physics:**
```json
{
  "behavior": {
    "physics": "https://unpkg.com/@v1b3x0r/mds-core@3/manifests/@mds/liquid-silicone.physics.js",
    "physicsParams": {
      "tension": 55,      // Spring stiffness
      "damping": 3,       // Energy loss
      "maxStretchX": 0.16,
      "maxStretchY": 0.16
    }
  }
}
```

**Architecture note:** MDS handles tactile response (HOW it feels). External libraries handle functional behavior (WHAT it does, WHERE it moves). This prevents transform conflicts.

---

### customCSS (Advanced)

**Purpose:** Escape hatch for any CSS property not covered by core domains

**Coverage:** ~90% of CSS properties

**Limitations:**
- No pseudo-elements (`::before`, `::after`)
- No `@keyframes` animations
- Static properties only

**Example:**
```json
{
  "customCSS": {
    "clip-path": "polygon(0 0, 100% 0, 100% 95%, 50% 100%, 0 95%)",
    "mix-blend-mode": "multiply",
    "filter": "drop-shadow(0 4px 8px rgba(0,0,0,0.2))",
    "background-blend-mode": "overlay"
  }
}
```

**When to use:**
- Advanced CSS techniques (clipping, masking, blending)
- Properties not in optics/surface/behavior
- High-detail textures

**Kebab-case or camelCase:** Both work (`clip-path` or `clipPath`)

---

## States & Themes

### States (6 available)

| State | When Applied |
|-------|--------------|
| `base` | Default state |
| `hover` | Mouse hover |
| `press` | Element pressed (pointer down) |
| `pressed-and-moving` | Pressed + pointer moving |
| `focus` | Keyboard focus |
| `disabled` | Disabled state |

**Structure:**
```json
{
  "states": {
    "hover": {
      "optics": { "opacity": 1 }
    },
    "press": {
      "surface": { "shadow": "inset 0 2px 4px rgba(0,0,0,0.1)" }
    }
  }
}
```

### Themes (2 available)

| Theme | When Applied |
|-------|--------------|
| `light` | Light mode |
| `dark` | Dark mode |

**Structure:**
```json
{
  "theme": {
    "dark": {
      "optics": { "tint": "rgba(255,255,255,0.1)" },
      "surface": { "border": "1px solid rgba(255,255,255,0.2)" }
    },
    "light": {
      "optics": { "tint": "rgba(0,0,0,0.05)" }
    }
  }
}
```

**Merge order:** `base → theme → state`

**Example:** Element in dark mode with hover:
1. Apply base material
2. Merge `theme.dark` properties
3. Merge `states.hover` properties

---

## Examples

### 1. Simple Glass

```json
{
  "name": "simple-glass",
  "optics": {
    "tint": "rgba(255, 255, 255, 0.1)",
    "blur": "8px",
    "opacity": 0.9
  },
  "surface": {
    "radius": "12px",
    "border": "1px solid rgba(255, 255, 255, 0.2)",
    "shadow": "0 4px 12px rgba(0, 0, 0, 0.15)"
  }
}
```

**Result:** Transparent white background with blur, rounded corners, and shadow

**Use case:** Cards, modals, overlays

---

### 2. Interactive Button

```json
{
  "name": "button",
  "optics": {
    "tint": "rgba(59, 130, 246, 0.9)",
    "opacity": 1
  },
  "surface": {
    "radius": "8px",
    "shadow": "0 2px 4px rgba(0, 0, 0, 0.1)"
  },
  "behavior": {
    "cursor": "pointer",
    "transition": "all 0.2s ease"
  },
  "states": {
    "hover": {
      "optics": { "tint": "rgba(59, 130, 246, 1)" },
      "surface": { "shadow": "0 4px 8px rgba(0, 0, 0, 0.15)" }
    },
    "press": {
      "surface": { "shadow": "inset 0 2px 4px rgba(0, 0, 0, 0.1)" }
    },
    "disabled": {
      "optics": { "opacity": 0.5 },
      "behavior": { "cursor": "not-allowed" }
    }
  }
}
```

**Result:** Blue button with hover/press/disabled states

**Use case:** Primary action buttons

---

### 3. Physics Material (Liquid Silicone)

```json
{
  "name": "liquid-silicone",
  "optics": {
    "opacity": 1,
    "blur": "22px",
    "saturation": "180%",
    "tint": "rgba(255, 255, 255, 0.2)"
  },
  "surface": {
    "radius": "24px",
    "border": "1px solid rgba(148, 163, 184, 0.32)",
    "shadow": [
      "inset 0 1px 0 rgba(255, 255, 255, 0.55)",
      "0 32px 88px rgba(2, 6, 23, 0.55)"
    ]
  },
  "behavior": {
    "physics": "./liquid-silicone.physics.js",
    "physicsParams": {
      "tension": 55,
      "damping": 3,
      "maxStretchX": 0.16,
      "maxStretchY": 0.16,
      "parallax": 16
    },
    "cursor": "pointer"
  },
  "customCSS": {
    "background": "radial-gradient(at 35% 30%, rgba(255,255,255,0.28), rgba(255,255,255,0.06))",
    "background-blend-mode": "overlay"
  }
}
```

**Result:** Squishy, elastic material with tactile deformation and parallax

**Use case:** Interactive hero elements, feature cards, "wow" factor buttons

**Performance:** 60fps on modern devices (M1/M2 Macs, iPhone 12+, recent Androids)

---

### 4. Advanced (customCSS)

```json
{
  "name": "advanced",
  "optics": {
    "tint": "rgba(255, 255, 255, 0.1)"
  },
  "surface": {
    "radius": "16px"
  },
  "customCSS": {
    "clip-path": "polygon(0 0, 100% 0, 100% 95%, 50% 100%, 0 95%)",
    "background": "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px), radial-gradient(circle at 30% 40%, rgba(255,255,255,0.3), transparent)",
    "mix-blend-mode": "multiply",
    "filter": "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
  }
}
```

**Result:** Complex material with custom clipping, gradients, blending, and filters

**Use case:** Ultra-detailed materials requiring advanced CSS

---

## Validation Rules

### JSON Syntax

**Quoted keys:**
```json
// Good
{ "name": "x" }

// Bad
{ name: "x" }
```

**No trailing commas:**
```json
// Good
{ "name": "x", "optics": { "tint": "#fff" } }

// Bad
{ "name": "x", "optics": { "tint": "#fff", } }
```

---

### Type Rules

| Property | Type | Valid | Invalid |
|----------|------|-------|---------|
| `opacity` | number (0-1) | `0.5`, `1`, `0` | `"0.5"` (string), `1.5` (>1) |
| `blur` | string (length) | `"4px"`, `"0.5rem"` | `4` (no quotes), `"4"` (no unit) |
| `tint` | string (color) | `"#fff"`, `"rgba(...)"` | `123` (not string) |
| `shadow` | string \| array | `"0 4px ..."`, `[...]` | `123` (wrong type) |

---

### Required Fields

**Must have:**
- `name` field
- At least one domain: `optics`, `surface`, `behavior`, or `customCSS`

**Valid:**
```json
{ "name": "test", "optics": {} }
{ "name": "test", "surface": {} }
```

**Invalid:**
```json
{ "optics": {} }  // No name
{ "name": "test" }  // No domain
```

---

### Forbidden Properties

**These belong in CSS/Tailwind, not materials:**
- **Layout:** `width`, `height`, `margin`, `padding`, `position`, `top`, `left`, `right`, `bottom`
- **Display:** `display`, `flex-direction`, `justify-content`, `align-items`
- **Typography:** `font-size`, `font-family`, `line-height`, `letter-spacing`

**Reason:** Separation of concerns. MDS = material properties, CSS = layout/spacing.

**Use JSON validator:** [jsonlint.com](https://jsonlint.com)

---

## Common Mistakes

### 1. Trailing Comma

```json
// Bad
{
  "name": "test",
  "optics": {
    "tint": "#fff",  // ← Trailing comma
  }
}

// Good
{
  "name": "test",
  "optics": {
    "tint": "#fff"
  }
}
```

---

### 2. Wrong Type

```json
// Bad (opacity is string)
{
  "optics": { "opacity": "0.5" }
}

// Good (opacity is number)
{
  "optics": { "opacity": 0.5 }
}
```

---

### 3. Missing Units

```json
// Bad (no unit)
{
  "surface": { "radius": "12" }
}

// Good (has unit)
{
  "surface": { "radius": "12px" }
}
```

---

### 4. No Name Field

```json
// Bad (no name)
{
  "optics": { "tint": "#fff" }
}

// Good (has name)
{
  "name": "my-material",
  "optics": { "tint": "#fff" }
}
```

---

### 5. Using Layout Properties

```json
// Bad (use Tailwind/CSS instead)
{
  "customCSS": {
    "width": "100px",
    "display": "flex",
    "margin": "20px"
  }
}

// Good (material properties only)
{
  "optics": { "tint": "#fff" },
  "surface": { "radius": "8px" }
}
```

**HTML example (correct separation):**
```html
<!-- Layout: Tailwind -->
<div class="w-full px-4 py-2 flex items-center"

     <!-- Material: MDS -->
     data-material="@mds/glass">
  Content
</div>
```

---

## Debug Tips

**Check browser console** for MDS runtime warnings:
```javascript
// Console output example:
[MDS] Material "@mds/invalid" not found
[MDS] behavior.elasticity is deprecated. Use physicsParams.elasticity instead.
```

**Validate JSON syntax:**
- [jsonlint.com](https://jsonlint.com)
- VSCode JSON validation (built-in)
- Browser console (if syntax error, parsing fails)

**Test incrementally:**
1. Start with minimal material (name + one property)
2. Add properties one by one
3. Test in browser after each addition
4. Check console for errors

---

## Reference

- [Live Demo](material-js-concept.vercel.app) - Interactive examples
- [README](../README.md) - System documentation
- [GitHub](https://github.com/v1b3x0r/material-js-concept) - Source code
- [npm package](https://www.npmjs.com/package/@v1b3x0r/mds-core) - Installation

---

**Version:** v3.0.2 | **License:** MIT | **Reading time:** ~10 minutes
