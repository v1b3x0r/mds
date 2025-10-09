# Material Creation Guide - Complete Reference

**For users who want to create custom materials**

---

## Table of Contents

1. [Requirements (ข้อกำหนด)](#requirements)
2. [MDSpec v2 Schema (โครงสร้าง)](#schema)
3. [All Properties (properties ทั้งหมด)](#properties)
4. [Examples (ตัวอย่าง)](#examples)
5. [Validation Rules (กฎการตรวจสอบ)](#validation)
6. [Common Mistakes (ข้อผิดพลาดที่พบบ่อย)](#mistakes)

---

## Requirements (ข้อกำหนด) {#requirements}

### 1. File Format
- **Must be**: Valid JSON (`.mdm.json` extension)
- **Encoding**: UTF-8
- **No trailing commas**: `{ "a": 1, }` ❌ → `{ "a": 1 }` ✅
- **Quoted keys**: `{ name: "x" }` ❌ → `{ "name": "x" }` ✅

### 2. Required Fields
- `"name"` (string) - **REQUIRED**, format: `"@scope/material-name"` or `"material-name"`

### 3. Optional Fields
- `"version"` (string) - e.g., `"1.0.0"`
- `"description"` (string)
- `"author"` (string)
- `"license"` (string) - e.g., `"MIT"`
- `"tags"` (array of strings)
- `"inherits"` (string | null) - parent material name
- `"optics"` (object) - visual properties
- `"surface"` (object) - texture & relief
- `"behavior"` (object) - interaction
- `"customCSS"` (object) - **advanced** custom CSS properties (escape hatch)
- `"states"` (object) - state variants
- `"theme"` (object) - theme variants

### 4. At Least One Domain
Must have **at least one** of: `optics`, `surface`, `behavior`, or `customCSS`

---

## MDSpec v2 Schema (โครงสร้าง) {#schema}

```json
{
  "name": "string (REQUIRED)",
  "version": "string (optional)",
  "description": "string (optional)",
  "author": "string (optional)",
  "license": "string (optional)",
  "tags": ["string", "string"] (optional),
  "inherits": "string | null (optional)",

  "optics": {
    "opacity": "number (0-1)",
    "tint": "string (color)",
    "blur": "string (CSS length)",
    "saturation": "string (percentage)",
    "brightness": "string (percentage)",
    "contrast": "string (percentage)"
  },

  "surface": {
    "radius": "string (CSS length)",
    "border": "string (CSS border)",
    "shadow": "string | array (CSS box-shadow)",
    "texture": {
      "src": "string (URL or data URI)",
      "repeat": "string (CSS background-repeat)",
      "size": "string (CSS background-size)"
    }
  },

  "behavior": {
    "cursor": "string (CSS cursor)",
    "transition": "string (CSS transition)"
  },

  "customCSS": {
    "anyProperty": "string (any valid CSS value)",
    "clip-path": "...",
    "mix-blend-mode": "...",
    "filter": "..."
  },

  "states": {
    "base": { /* same structure as root */ },
    "active": { /* same structure as root */ },
    "hover": { /* same structure as root */ },
    "focus": { /* same structure as root */ },
    "disabled": { /* same structure as root */ }
  },

  "theme": {
    "light": { /* same structure as root */ },
    "dark": { /* same structure as root */ }
  }
}
```

---

## All Properties (properties ทั้งหมด) {#properties}

### Meta Properties (ไม่ใช่ visual)

| Property | Type | Required | Example | Description |
|----------|------|----------|---------|-------------|
| `name` | string | ✅ Yes | `"@mds/glass"` | Material identifier |
| `version` | string | ❌ No | `"1.0.0"` | Semantic version |
| `description` | string | ❌ No | `"Glass effect"` | Human description |
| `author` | string | ❌ No | `"Your Name"` | Creator name |
| `license` | string | ❌ No | `"MIT"` | License type |
| `tags` | string[] | ❌ No | `["glass", "transparent"]` | Searchable tags |
| `inherits` | string\|null | ❌ No | `"@mds/base"` | Parent material |

---

### Domain: `optics` (Visual Appearance)

**Purpose**: Controls transparency, color, blur, and filters

| Property | Type | Default | Example | Maps to CSS | Description |
|----------|------|---------|---------|-------------|-------------|
| `opacity` | number (0-1) | `1` | `0.8` | `opacity` | Element transparency |
| `tint` | string (color) | - | `"rgba(255,255,255,0.1)"` | `background` | Background color (layered as gradient) |
| `blur` | string (length) | - | `"4px"` | `backdrop-filter: blur()` | Backdrop blur amount |
| `saturation` | string (%) | `"100%"` | `"120%"` | `filter: saturate()` | Color saturation |
| `brightness` | string (%) | `"100%"` | `"90%"` | `filter: brightness()` | Brightness level |
| `contrast` | string (%) | `"100%"` | `"110%"` | `filter: contrast()` | Contrast level |

**Notes**:
- `tint` creates **background gradient**, NOT solid fill (unless opacity=1)
- `blur` requires browser support for `backdrop-filter` (Safari 9+, Chrome 76+)
- Filters (`saturation`, `brightness`, `contrast`) combine: `filter: saturate(120%) brightness(90%)`

**Extended Properties** (v1 compatibility):
- `color` (string) → `color` CSS property (text color)
- `backgroundColor` (string) → `background-color` CSS property (direct, no gradient)
- `backdropFilter` (string) → `backdrop-filter` CSS property (direct string)

---

### Domain: `surface` (Texture & Relief)

**Purpose**: Controls borders, shadows, textures, and 3D appearance

| Property | Type | Default | Example | Maps to CSS | Description |
|----------|------|---------|---------|-------------|-------------|
| `radius` | string (length) | - | `"12px"` | `border-radius` | Corner rounding |
| `border` | string | - | `"1px solid rgba(255,255,255,0.2)"` | `border` | Border style |
| `shadow` | string \| array | - | `"0 4px 12px rgba(0,0,0,0.1)"` | `box-shadow` | Drop shadow(s) |
| `texture` | object | - | See below | `background-image` | Background pattern |

#### `texture` Object:

| Property | Type | Required | Example | Maps to CSS | Description |
|----------|------|----------|---------|-------------|-------------|
| `src` | string (URL) | ✅ Yes | `"data:image/svg+xml,..."` | `background-image: url()` | Image source |
| `repeat` | string | ❌ No | `"repeat"` | `background-repeat` | Repeat pattern |
| `size` | string | ❌ No | `"200px 200px"` | `background-size` | Image size |

**Shadow Types**:
- **Single**: `"0 4px 12px rgba(0,0,0,0.1)"`
- **Multiple (array)**: `["0 1px 2px rgba(0,0,0,0.1)", "0 4px 8px rgba(0,0,0,0.08)"]`
- **Inset shadows**: `"inset 0 0 0 1px rgba(255,255,255,0.2)"`

**Extended Properties** (v1 compatibility):
- `borderTop` (string) → `border-top` CSS property
- `background` (string) → `background` CSS property (direct)
- `transform` (string) → `transform` CSS property
- `transition` (string) → `transition` CSS property

---

### Domain: `behavior` (Interaction)

**Purpose**: Controls cursor and transitions

| Property | Type | Default | Example | Maps to CSS | Description |
|----------|------|---------|---------|-------------|-------------|
| `cursor` | string | - | `"pointer"` | `cursor` | Mouse cursor type |
| `transition` | string | - | `"all 0.2s ease"` | `transition` | CSS transition |

**Cursor Values**: `auto`, `pointer`, `default`, `move`, `text`, `wait`, `not-allowed`, `grab`, `grabbing`, etc.

---

### Domain: `customCSS` (Advanced - Escape Hatch)

**Purpose**: Apply **any** CSS property not covered by optics/surface/behavior

**⚠️ Warning**: This is an advanced feature for CSS experts. Use with caution.

| Feature | Support |
|---------|---------|
| Any CSS property | ✅ Yes |
| Kebab-case or camelCase | ✅ Both work |
| Type safety | ❌ No (use carefully) |

**Supported Properties** (examples - not exhaustive):
- `clip-path`, `clipPath` - Clip element shape
- `mix-blend-mode`, `mixBlendMode` - Blend mode
- `mask`, `mask-image` - Image masking
- `filter` - CSS filters (multiple)
- `backdrop-filter` - Advanced blur/filters
- `background-blend-mode` - Background blending
- `transform-origin` - Transform pivot point
- **ANY other CSS property**

**Structure**:
```json
"customCSS": {
  "clip-path": "polygon(0 0, 100% 0, 100% 80%, 0 100%)",
  "mix-blend-mode": "multiply",
  "filter": "drop-shadow(0 4px 8px rgba(0,0,0,0.2))"
}
```

**Example**:
```json
{
  "name": "advanced-material",
  "optics": { "tint": "#fff" },
  "customCSS": {
    "clip-path": "circle(50%)",
    "background-blend-mode": "overlay",
    "mix-blend-mode": "screen"
  }
}
```

**Limitations**:
- ❌ No support for pseudo-elements (::before, ::after)
- ❌ No support for @keyframes animations
- ❌ No support for dynamic values (e.g., mouse tracking)
- ✅ Static CSS properties only

**When to use**:
- When optics/surface/behavior don't cover your needs
- For advanced CSS techniques (clipping, masking, blending)
- For high-detail textures requiring complex backgrounds

---

### Domain: `states` (State Variants)

**Purpose**: Override properties for different interaction states

**Available States**:
- `base` - Default state (applied first)
- `active` - When element is active (e.g., button pressed)
- `hover` - When mouse hovers over element
- `focus` - When element has keyboard focus
- `disabled` - When element is disabled

**Structure**:
```json
"states": {
  "active": {
    "optics": { "opacity": 1 },
    "surface": { "shadow": "..." }
  },
  "disabled": {
    "optics": { "opacity": 0.5 }
  }
}
```

**Merge Order**: `base` → current state → specific state

---

### Domain: `theme` (Theme Variants)

**Purpose**: Override properties for light/dark themes

**Available Themes**:
- `light` - Light mode
- `dark` - Dark mode

**Structure**:
```json
"theme": {
  "dark": {
    "optics": { "tint": "rgba(255,255,255,0.1)" },
    "surface": { "border": "1px solid rgba(255,255,255,0.2)" }
  },
  "light": {
    "optics": { "tint": "rgba(0,0,0,0.05)" }
  }
}
```

**Merge Order**: base → theme → state

---

## Examples (ตัวอย่าง) {#examples}

### Example 1: Minimal Material (ที่สุดแบบง่าย)

```json
{
  "name": "minimal",
  "optics": {
    "tint": "#ffffff"
  }
}
```

**Result**: White background, nothing else

---

### Example 2: Simple Glass

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

**Result**: Transparent white + blur + rounded corners + shadow

---

### Example 3: Paper with Texture

```json
{
  "name": "paper-textured",
  "optics": {
    "tint": "#ffffff",
    "opacity": 1
  },
  "surface": {
    "radius": "8px",
    "border": "1px solid rgba(0, 0, 0, 0.1)",
    "shadow": "0 2px 8px rgba(0, 0, 0, 0.08)",
    "texture": {
      "src": "data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0, 0 0 0 0 0, 0 0 0 0 0, 0 0 0 0.02 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)'/%3E%3C/svg%3E",
      "repeat": "repeat",
      "size": "200px 200px"
    }
  }
}
```

**Result**: Solid white + subtle noise texture + shadow

---

### Example 4: Interactive Button

```json
{
  "name": "button-interactive",
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
    "active": {
      "surface": { "shadow": "inset 0 2px 4px rgba(0, 0, 0, 0.1)" }
    },
    "disabled": {
      "optics": { "opacity": 0.5 },
      "behavior": { "cursor": "not-allowed" }
    }
  }
}
```

**Result**: Blue button with hover/active/disabled states

---

### Example 5: Theme-Aware Material

```json
{
  "name": "theme-aware",
  "optics": {
    "tint": "rgba(255, 255, 255, 0.1)",
    "blur": "4px"
  },
  "surface": {
    "radius": "12px",
    "border": "1px solid rgba(255, 255, 255, 0.2)",
    "shadow": "0 4px 12px rgba(0, 0, 0, 0.1)"
  },
  "theme": {
    "light": {
      "optics": { "tint": "rgba(0, 0, 0, 0.05)" },
      "surface": {
        "border": "1px solid rgba(0, 0, 0, 0.1)",
        "shadow": "0 4px 12px rgba(0, 0, 0, 0.08)"
      }
    },
    "dark": {
      "optics": { "tint": "rgba(255, 255, 255, 0.1)" },
      "surface": {
        "border": "1px solid rgba(255, 255, 255, 0.2)",
        "shadow": "0 4px 12px rgba(0, 0, 0, 0.3)"
      }
    }
  }
}
```

**Result**: Adapts colors to light/dark theme

---

### Example 6: Multi-Layer Shadow (10-layer system)

```json
{
  "name": "glass-realistic",
  "optics": {
    "tint": "rgba(255, 255, 255, 0.08)",
    "blur": "4px"
  },
  "surface": {
    "radius": "12px",
    "border": "1px solid rgba(255, 255, 255, 0.25)",
    "shadow": [
      "inset 0 0 0 1px rgba(255, 255, 255, 0.2)",
      "inset 1.8px 3px 0px -2px rgba(255, 255, 255, 0.9)",
      "inset -2px -2px 0px -2px rgba(255, 255, 255, 0.8)",
      "inset -3px -8px 1px -6px rgba(255, 255, 255, 0.6)",
      "inset -0.3px -1px 4px 0px rgba(0, 0, 0, 0.12)",
      "inset -1.5px 2.5px 0px -2px rgba(0, 0, 0, 0.2)",
      "inset 0px 3px 4px -2px rgba(0, 0, 0, 0.2)",
      "inset 2px -6.5px 1px -4px rgba(0, 0, 0, 0.1)",
      "0px 1px 5px 0px rgba(0, 0, 0, 0.2)",
      "0px 6px 16px 0px rgba(0, 0, 0, 0.16)"
    ]
  }
}
```

**Result**: Complex glass effect with depth

---

### Example 7: Advanced CSS (customCSS)

```json
{
  "name": "ultra-detailed",
  "optics": {
    "tint": "rgba(255, 255, 255, 0.1)"
  },
  "surface": {
    "radius": "16px"
  },
  "customCSS": {
    "clip-path": "polygon(0 0, 100% 0, 100% 95%, 50% 100%, 0 95%)",
    "background": "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px), repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.015) 2px, rgba(0,0,0,0.015) 4px), radial-gradient(circle at 30% 40%, rgba(255,255,255,0.3), transparent)",
    "mix-blend-mode": "multiply",
    "filter": "drop-shadow(0 2px 4px rgba(0,0,0,0.1)) drop-shadow(0 4px 12px rgba(0,0,0,0.08))"
  }
}
```

**Result**: Ultra-detailed material with clipping, complex gradients, blending, and custom filters

**Use case**: When you need ~90% of CSS capabilities for extreme detail

---

## Validation Rules (กฎการตรวจสอบ) {#validation}

### JSON Syntax
- ✅ Valid: `{ "name": "test", "optics": { "tint": "#fff" } }`
- ❌ Invalid: `{ name: "test" }` (keys not quoted)
- ❌ Invalid: `{ "name": "test", }` (trailing comma)

### Required Fields
- ✅ Valid: `{ "name": "test", "optics": {} }`
- ❌ Invalid: `{ "optics": {} }` (no name)

### At Least One Domain
- ✅ Valid: `{ "name": "test", "optics": {} }`
- ✅ Valid: `{ "name": "test", "surface": {} }`
- ❌ Invalid: `{ "name": "test" }` (no domain)

### Type Validation
- `opacity`: number 0-1
  - ✅ `0.5`, `1`, `0`
  - ❌ `"0.5"` (string), `1.5` (>1), `-0.1` (<0)
- `tint`: string (color)
  - ✅ `"#fff"`, `"rgba(255,255,255,0.1)"`, `"blue"`
  - ❌ `123` (not string)
- `blur`: string (CSS length)
  - ✅ `"4px"`, `"0.5rem"`, `"10px"`
  - ❌ `4` (not string), `"4"` (no unit)
- `shadow`: string OR array
  - ✅ `"0 4px 12px rgba(0,0,0,0.1)"`
  - ✅ `["shadow1", "shadow2"]`
  - ❌ `123` (not string/array)

### Forbidden Properties (ห้ามใช้)
These will be **ignored** or cause **errors**:
- Layout: `width`, `height`, `margin`, `padding`, `top`, `left`, `right`, `bottom`
- Display: `display`, `flex-direction`, `justify-content`, `align-items`
- Position: `position`, `z-index`
- Typography: `font-size`, `font-family`, `line-height` (use CSS for these)

---

## Common Mistakes (ข้อผิดพลาดที่พบบ่อย) {#mistakes}

### ❌ Mistake 1: Trailing Comma
```json
{
  "name": "test",
  "optics": {
    "tint": "#fff",  // ← trailing comma
  }
}
```
**Fix**: Remove trailing comma
```json
{
  "name": "test",
  "optics": {
    "tint": "#fff"
  }
}
```

---

### ❌ Mistake 2: Unquoted Keys
```json
{
  name: "test"  // ← key not quoted
}
```
**Fix**: Quote all keys
```json
{
  "name": "test"
}
```

---

### ❌ Mistake 3: Wrong Type
```json
{
  "name": "test",
  "optics": {
    "opacity": "0.5"  // ← string, should be number
  }
}
```
**Fix**: Use number
```json
{
  "name": "test",
  "optics": {
    "opacity": 0.5
  }
}
```

---

### ❌ Mistake 4: Missing Units
```json
{
  "name": "test",
  "surface": {
    "radius": "12"  // ← no unit
  }
}
```
**Fix**: Add unit
```json
{
  "name": "test",
  "surface": {
    "radius": "12px"
  }
}
```

---

### ❌ Mistake 5: Using Layout Properties
```json
{
  "name": "test",
  "surface": {
    "width": "100px"  // ← FORBIDDEN
  }
}
```
**Fix**: Remove layout properties (use CSS/Tailwind)
```json
{
  "name": "test",
  "surface": {
    "radius": "12px"
  }
}
```

---

### ❌ Mistake 6: No Name
```json
{
  "optics": {
    "tint": "#fff"
  }
}
```
**Fix**: Add name
```json
{
  "name": "my-material",
  "optics": {
    "tint": "#fff"
  }
}
```

---

## Quick Reference Card

```
✅ ALLOWED PROPERTIES (28+ core):

Meta (7):
- name, version, description, author, license, tags, inherits

Optics (6):
- opacity, tint, blur, saturation, brightness, contrast

Surface (4 + 3 sub):
- radius, border, shadow
- texture { src, repeat, size }

Behavior (2):
- cursor, transition

State (5):
- base, active, hover, focus, disabled

Theme (2):
- light, dark

Extended (v1 compatibility):
- optics: color, backgroundColor, backdropFilter
- surface: borderTop, background, transform, transition

Advanced (unlimited):
- customCSS: { anyProperty: "value" }
  ⚠️ Escape hatch for CSS experts - any valid CSS property

❌ FORBIDDEN (in core fields - use customCSS instead):
- Layout: width, height, margin, padding, position, top, left
- Display: display, flex*, justify*, align*
- Typography: font-*, line-height
```

---

## Summary (สรุป)

1. **Format**: Valid JSON, no trailing commas
2. **Required**: `"name"` field + at least 1 domain
3. **Domains**: `optics`, `surface`, `behavior`
4. **Total properties**: ~27 core + 6 extended
5. **States**: base, active, hover, focus, disabled
6. **Themes**: light, dark
7. **Forbidden**: Layout, display, position, typography
8. **Validation**: Check types (number vs string, units, etc.)

**Need help?** Check examples above or copy-paste and modify!
