# Material System - AI Context Document

**สำหรับ: AI Assistant เท่านั้น (ไม่ใช่คู่มือสำหรับคน)**

---

## 1. PROJECT PURPOSE

นี่คือ **Material System** - **JS library/package** (ไม่ใช่ product/app)

**สิ่งที่เรา ship**:
- `material-system.js` - แค่ไฟล์เดียว, zero dependencies, ทำงานได้เอง 100%

**สิ่งที่ไม่ ship** (demo/example เท่านั้น):
- `index.html` - ตัวอย่างการใช้งาน
- `styles.css` - สำหรับ demo page, ไม่ใช่ part ของ package

**เป้าหมายหลัก**:
- Package ต้องทำงานได้โดยไม่ต้องพึ่ง CSS ไฟล์ใดๆ
- Users ใช้แค่ `<script src="material-system.js"></script>` พอ
- ให้ developers คิดว่า "นี่คือกระจก" แทนที่จะคิดว่า "ต้องใส่ backdrop-filter, opacity, border..."

**ตัวอย่างเป้าหมาย**:
```html
<!-- ✅ ถูก - HTML clean, ไม่มีโค้ดสีสัน -->
<div class="px-4 py-2 rounded-lg" data-material="glass">
  Content
</div>

<!-- ❌ ผิด - มีโค้ดสีสันใน HTML -->
<div class="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-lg">
  Content
</div>
```

---

## 2. ARCHITECTURE RULES (กฎเหล็ก)

### Rule 1: Package vs Demo - แยกชัดเจน

**Package (core product)**:
```
material-system.js  → Standalone package, ทำงานได้เอง, ไม่พึ่ง CSS
```

**Demo/Example (ไม่ ship)**:
```
index.html         → ตัวอย่างการใช้งาน
styles.css         → Styling สำหรับ demo page เท่านั้น
```

### Rule 2: material-system.js ต้องอิสระ 100%

- ✅ Hardcode ค่า material ทั้งหมดใน JS (dark/light themes)
- ❌ **ห้าม** ใช้ CSS variables จาก external files
- ❌ **ห้าม** ต้องพึ่ง styles.css หรือ CSS ไฟล์ใดๆ
- ✅ Users ใช้แค่ `<script src="material-system.js"></script>` ได้เลย

### Rule 3: Material System = Single Source of Truth

- ทุกอย่างที่เกี่ยวกับ materials **อยู่ใน material-system.js เท่านั้น**
- `styles.css` เป็นแค่ demo styling (typography, body background, etc.)
- `styles.css` ไม่เกี่ยวกับ Material System package เลย

### Rule 4: Separation of Concerns (ในการใช้งาน)

| System | Responsibility | Examples |
|--------|---------------|----------|
| **Tailwind / CSS** | Structure, Layout, Typography | `px-4`, `flex`, `rounded-lg`, `h1 { font-size }` |
| **Material System** | Visual Appearance, Material Properties | `data-material="glass"` → backdrop-filter, shadows, colors (hardcoded in JS) |

### Rule 5: ห้าม CSS Variables สำหรับ Materials

```css
/* ❌ ห้าม - define material tokens ใน styles.css */
:root {
  --glass-blur: 20px;
  --c-glass: #fff;
}

/* ❌ ห้าม - material-system.js ใช้ external CSS variables */
backdropFilter: 'blur(var(--glass-blur))'

/* ✅ ถูก - hardcode ใน material-system.js */
backdropFilter: 'blur(20px) saturate(180%)'
```

**เหตุผล**: Package ต้องทำงานได้เอง ไม่พึ่ง external CSS files

### Rule 5: HTML ต้อง Clean

```html
<!-- ❌ ห้าม - มี opacity/color control ใน HTML/JS -->
<button id="btn" style="opacity: 0.5; background: rgba(255,255,255,0.1)">

<script>
  btn.style.opacity = '1'; // ❌ ห้าม
  btn.style.background = 'rgba(255,255,255,0.2)'; // ❌ ห้าม
</script>

<!-- ✅ ถูก - ใช้ data-material + Tailwind เท่านั้น -->
<button class="px-4 py-2 rounded-full" data-material="glass">

<script>
  btn.setAttribute('data-material', 'glass'); // ✅ ถูก
  btn.removeAttribute('data-material'); // ✅ ถูก
</script>
```

---

## 3. FILE RESPONSIBILITIES

### `material-system.js` (Core Library)

**ทำ**:
- ✅ Material definitions (glass, paper)
- ✅ Visual properties: `backgroundColor`, `backdropFilter`, `boxShadow`, `border`, `opacity`, `color`
- ✅ State management: hover, active, focus, disabled
- ✅ Theme reactivity: dark/light mode
- ✅ Material inheritance: `extend()` method

**ไม่ทำ**:
- ❌ Layout (spacing, sizing, positioning)
- ❌ Typography
- ❌ Component structure

**Current Materials**:
- `glass` - Liquid glass with blur, transparency, reactive borders, 10-layer shadow system
- `paper` - Matte surface with noise texture, solid background

### `styles.css` (Design Tokens + Base Styles)

**ทำ**:
- ✅ Design tokens: `--radius-*`, `--space-*`, `--glass-blur`, `--c-glass`, etc.
- ✅ Typography: `h1`, `h2`, `h3`, `p`, `code`
- ✅ Body theme: gradient backgrounds, color transitions
- ✅ Base element styles: `button`, `select` (structure only, no visual materials)
- ✅ Safe area handling (iOS)

**ไม่ทำ**:
- ❌ Material visual properties (blur, shadows, material colors)
- ❌ Component-specific styling
- ❌ CSS classes ที่ duplicate Material System features

**Token Usage**:
```css
/* ✅ ถูก - Define tokens */
:root {
  --glass-blur: 20px;
  --c-glass: #fff;
}

/* ✅ ถูก - Use in Material System */
/* (in material-system.js) */
backdropFilter: 'blur(var(--glass-blur))'

/* ❌ ผิด - Apply directly to elements in CSS */
.my-element {
  backdrop-filter: blur(var(--glass-blur));
}
```

### `index.html` (Demo Page)

**ทำ**:
- ✅ Tailwind classes: layout, spacing, sizing (`flex`, `px-4`, `w-20`, `rounded-full`)
- ✅ `data-material` attributes: assign materials
- ✅ Clean JavaScript: `setAttribute('data-material', ...)`, `removeAttribute('data-material')`
- ✅ Semantic HTML structure

**ไม่ทำ**:
- ❌ Inline styles สำหรับ visual properties (opacity, colors, blur)
- ❌ Duplicate visual logic (ใช้ Material System แทน)
- ❌ Custom CSS classes ที่จัดการ materials

**Tab Bar Pattern** (✅ Correct Implementation):
```html
<!-- Active button = has data-material -->
<button id="light-btn" class="px-3 py-1.5 rounded-full">
  <svg>...</svg>
</button>

<!-- Inactive button (dark theme default) = has data-material -->
<button id="dark-btn" class="px-3 py-1.5 rounded-full" data-material="glass">
  <svg>...</svg>
</button>

<script>
  // Toggle material attribute (ไม่ใช้ opacity control)
  function setTheme(theme) {
    if (theme === 'light') {
      lightBtn.setAttribute('data-material', 'glass');
      darkBtn.removeAttribute('data-material');
    } else {
      darkBtn.setAttribute('data-material', 'glass');
      lightBtn.removeAttribute('data-material');
    }
  }

  // Initial state
  setTheme(MaterialSystem.getTheme());
</script>
```

---

## 4. CURRENT STATE

### Package Structure
- **Core**: `material-system.js` (~15KB source, ~4KB minified)
- **Demo**: `index.html` (Medium-style blog + bottom tab bar)
- **Styles**: `styles.css` (design tokens + typography + base styles)
- **Docs**: `README.md` (สำหรับ users)

### Materials
- ✅ **Glass** - Liquid glass with 10-layer shadow system, reactive borders
- ✅ **Paper** - Matte with noise texture
- ❌ Metal, Wood, Fabric - มีตัวอย่างใน README แต่ไม่ ship ใน core (users สร้างเองได้)

### Demo Features
- Global material switcher (Paper/Glass dropdown)
- Theme toggle (Dark/Light)
- Bottom tab bar (iOS-style)
- Medium-style article layout
- Responsive design

### Dependencies
- Tailwind CDN (demo only)
- Zero runtime dependencies

---

## 5. KNOWN ISSUES

ไม่มีปัญหาที่ทราบในขณะนี้ ✅

**แก้ไขแล้ว**:
- ~~Issue #1: Tab Bar Opacity Control~~ - แก้แล้ว (index.html:324-330) ใช้ `setAttribute/removeAttribute` แทน `style.opacity`

---

## 6. FORBIDDEN PATTERNS

### ❌ Pattern 1: Manual Opacity/Color Control

```javascript
// ❌ ห้าม
element.style.opacity = '0.5';
element.style.backgroundColor = 'rgba(255,255,255,0.1)';

// ✅ ใช้แทน
element.setAttribute('data-material', 'glass'); // Material System จัดการ opacity/colors
element.removeAttribute('data-material'); // ลบ material = กลับเป็น unstyled
```

### ❌ Pattern 2: CSS Classes for Materials

```css
/* ❌ ห้าม - เขียน material properties ใน CSS */
.glass {
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.1);
}

.paper {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
```

```javascript
// ✅ ใช้แทน - ใน material-system.js
MaterialSystem.register('glass', {
  base: {
    backdropFilter: 'blur(20px)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  }
});
```

### ❌ Pattern 3: Mixing Visual Utilities with Material System

```html
<!-- ❌ ห้าม - Tailwind visual utilities + Material System ซ้อนกัน -->
<div class="bg-white/10 backdrop-blur-lg shadow-xl" data-material="glass">
  <!-- bg-white/10, backdrop-blur-lg ซ้ำซ้อนกับ glass material -->
</div>

<!-- ✅ ถูก - Tailwind layout only, Material System handles visual -->
<div class="px-6 py-4 rounded-xl" data-material="glass">
  <!-- Tailwind = layout, Material = visual -->
</div>
```

### ❌ Pattern 4: Design Tokens in HTML

```html
<!-- ❌ ห้าม - ใช้ CSS variables จาก styles.css ใน HTML -->
<div style="backdrop-filter: blur(var(--glass-blur))">

<!-- ✅ ถูก - ใช้ Material System -->
<div data-material="glass">
```

### ✅ Allowed Pattern: Tailwind Layout + Material Visual

```html
<!-- ✅ ถูก - แยก concerns ชัดเจน -->
<button class="px-4 py-2 rounded-full flex items-center gap-2" data-material="glass">
  <!-- Tailwind: px-4, py-2, rounded-full, flex, items-center, gap-2 → layout -->
  <!-- Material System: data-material="glass" → visual -->
  Click me
</button>
```

---

## 7. DECISION LOG

### Q: ทำไมมีแค่ 2 materials (Glass, Paper)?
**A**: เป็น proof of concept ที่พิสูจน์แล้วว่าใช้งานได้จริง, production-ready, เพียงพอสำหรับ demo, users สามารถสร้าง materials เพิ่มเองได้ง่าย

### Q: ทำไม ship แค่ JS ไม่มี CSS file?
**A**: เพื่อให้ใช้งานง่าย, ไม่ต้อง import CSS, zero dependencies, plug-and-play

### Q: ทำไมใช้ Tailwind ร่วมกับ Material System?
**A**: แยก concerns - Tailwind = layout/structure, Material System = visual appearance, ทำให้โค้ดอ่านง่าย maintain ง่าย

### Q: ทำไมไม่มี active indicator animation สำหรับ tab bar?
**A**: ยังไม่จำเป็น, ปัจจุบันใช้ pattern ง่ายๆ (active = มี glass material, inactive = ไม่มี material) ซึ่ง visual feedback ชัดเจนอยู่แล้ว, สามารถเพิ่ม sliding indicator ได้ในอนาคตถ้าต้องการ

### Q: Tab bar ควรเปลี่ยน material ตาม global switcher ไหม?
**A**: ใช่, tab bar ต้องเปลี่ยนตาม global material switcher, ไม่มีข้อยกเว้น (index.html:313-315)

### Q: ถ้าต้องการ component-level states (active/inactive) ทำยังไง?
**A**: ใช้ pattern: active = มี `data-material`, inactive = ไม่มี attribute, toggle ด้วย `setAttribute/removeAttribute`

### Q: Typography/spacing ควรเป็น CSS หรือ JS?
**A**: CSS (`styles.css`), เพราะไม่เกี่ยวกับ materials, เป็น base styles ของ HTML elements

### Q: Design tokens ควรอยู่ไหน?
**A**: Define ใน `styles.css` (`:root { --token: value }`), ใช้ใน `material-system.js` (`var(--token)`), **ห้ามใช้ตรงๆ ใน HTML**

---

## 8. WHEN MODIFYING THIS PROJECT

### ก่อนแก้ไข/เพิ่มโค้ด ถามตัวเองก่อน:

1. **Visual property?** → ต้อง**อยู่ใน material-system.js** เท่านั้น
2. **Layout/spacing?** → ใช้ **Tailwind classes** ได้
3. **Typography/base styles?** → ใช้ **styles.css** ได้
4. **Component state?** → Toggle **data-material attribute**, ไม่ใช่ inline styles
5. **Design token?** → Define ใน **styles.css**, ใช้ใน **material-system.js**, ห้ามใช้ใน HTML

### หลังแก้ไข ตรวจสอบ:

- [ ] HTML ไม่มี inline styles สำหรับ opacity, colors, blur
- [ ] styles.css ไม่มี material-specific classes
- [ ] ไม่มี Tailwind visual utilities ซ้ำซ้อนกับ Material System
- [ ] Tab bar logic ใช้ `setAttribute/removeAttribute` ไม่ใช่ `style.opacity`
- [ ] Design tokens defined ใน `:root`, ไม่ใช้ตรงๆ ใน HTML

---

## 9. CORE PHILOSOPHY

> **"Think in materials, not CSS properties"**

Material System ไม่ได้แทนที่ Tailwind หรือ CSS - มันเป็น **different mental model**:

- **Tailwind**: Compose utilities → design
- **Material System**: Declare material → inherit properties

ทำงานร่วมกันได้ เพราะ:
- Tailwind = structure/layout
- Material System = appearance/material properties

**ตัวอย่างที่ดี**:
```html
<div class="max-w-3xl mx-auto px-6 py-12" data-material="glass">
  <!-- Tailwind: max-w-3xl, mx-auto, px-6, py-12 → layout -->
  <!-- Material: data-material="glass" → visual -->
</div>
```

---

## 10. QUICK REFERENCE

### Valid HTML Pattern
```html
<element
  class="[tailwind-layout-classes]"
  data-material="[material-name]">
</element>
```

### Valid JS Pattern
```javascript
// Toggle material
element.setAttribute('data-material', 'glass');
element.removeAttribute('data-material');

// Change theme
MaterialSystem.setTheme('dark');

// Create custom material
MaterialSystem.register('custom', { /* ... */ });
```

### Valid CSS Pattern (styles.css)
```css
/* Design tokens */
:root {
  --token-name: value;
}

/* Typography/base styles */
h1 { font-size: 2rem; }
button { cursor: pointer; }

/* ❌ NO material properties */
```

---

**สรุป**: Material System = Visual properties อยู่ใน JS, HTML/CSS มีแค่ structure/layout/typography, ห้ามปนกัน, ห้ามซ้ำซ้อน
