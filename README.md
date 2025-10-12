<h1 align="center">
  <br>
  
  <br><br>
  <b>Material Definition System (MDS)</b>
  <br>
</h1>


<p align="center">
  <i>Language for digital materials — born from Coke Light, built with GPT‑5.</i>
  <br><br>
  <a href="https://www.npmjs.com/package/@v1b3x0r/mds-core">
    <img src="https://img.shields.io/npm/v/@v1b3x0r/mds-core.svg?style=flat-square&color=black" alt="npm version">
  </a>
  <a href="https://github.com/v1b3x0r/material-js-concept/stargazers">
    <img src="https://img.shields.io/github/stars/v1b3x0r/material-js-concept?style=flat-square&color=silver" alt="stars">
  </a>
  <a href="https://github.com/v1b3x0r/material-js-concept/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square" alt="license">
  </a>
</p>

 
---
 

> “short, real, and written for humans — not for search engines.”

 
---
 

<div align="center">

```
            ┌────────────────────┐
            │  MaterialSystem    │
            │   (Core Runtime)   │
            └─────────┬──────────┘
                      │
          ┌───────────┼────────────┐
          │                        │
   ┌─────────────┐          ┌─────────────┐
   │  MDSpec     │          │  Manifest   │
   │  (Schema)   │          │  .mdm.json  │
   └──────┬──────┘          └──────┬──────┘
          │                         │
          ▼                         ▼
   ┌─────────────┐          ┌─────────────┐
   │  Optics     │          │  Behavior   │
   │  Surface    │          │  Physics.js │
   └─────────────┘          └─────────────┘
```

</div>

<p align="center">
  <img src="./assets/mds-demo.gif" width="640" alt="MDS interactive demo"/>
  <br>
  <i>Interactive sample — drag the silicone element to feel the tactile response.</i>
</p>

 
---
 

## 🧱 What is MDS
A **language for digital materials.**  
Instead of describing *what UI looks like*, MDS defines *what it’s made of.*

Use declarative materials right in the DOM:
```html
<div data-material="@mds/liquid-silicone">Drag me</div>
```

```js
import MDS from "@v1b3x0r/mds-core"
const silicone = await fetch("./liquid-silicone.mdm.json").then(r => r.json())
MDS.register("@mds/liquid-silicone", silicone)
MDS.apply()
```

---

## 🧠 Why It Exists
I was tired of bloated UI frameworks and endless CSS repetition.  
So I wondered: what if the DOM could *understand materials* — glass, paper, silicone —  
instead of properties?

MDS became an **HCI experiment** — a quiet study of how humans *feel* digital surfaces before they even touch them.

> it started from a Coke Light and an argument with GPT‑5.

---

## ⚙️ How It Works

- **Manifest‑driven:** materials defined in JSON (`.mdm.json`)  
- **Physics‑ready:** elastic & tactile behavior (K, D, mass)  
- **State‑aware:** hover, press, drag handled declaratively  
- **Zero dependency:** works anywhere — CDN, npm, vanilla DOM  

Example manifest:
```json
{
  "name": "@mds/liquid-silicone",
  "optics": { "tint": "rgba(200,200,255,0.3)" },
  "surface": { "radius": "16px" },
  "behavior": {
    "physics": "./liquid-silicone.physics.js",
    "physicsParams": { "K": 22, "D": 18, "mass": 1.5 }
  }
}
```

---

## 👥 For Different Roles

| 👩‍💻 Developers | 🎨 Designers | 🧠 HCI Researchers | 🧩 System Thinkers | 🤖 AI Builders |
|:--|:--|:--|:--|:--|
| Adds tactile response layer between DOM & behavior engines. | Describe materials in plain language (“soft paper”, “frosted glass”). | Sandbox for studying tactile perception & digital materiality. | Bridge between perception & implementation declaratively. | Generate & evolve manifests directly from structured JSON. |

---

## 🧩 Tech Summary

| Feature | Description |
|:--|:--|
| Runtime | ~4.5 KB (ESM gzipped) |
| Theme | Auto light / dark |
| Physics | External `.physics.js` modules |
| License | MIT |
| Support | Chrome 90+, Firefox 88+, Safari 14+ |
| Repo | [GitHub: v1b3x0r/material-js-concept](https://github.com/v1b3x0r/material-js-concept) |
| NPM | [@v1b3x0r/mds-core](https://www.npmjs.com/package/@v1b3x0r/mds-core) |

---

## 🪶 Origin

This project was **100% AI‑coded through conversation.**  
I never typed a line manually — just talked.

Core designed with GPT‑5 (Cognitive‑Focused Instruct + Narrative Prompting)  
Implementation & refined docs with Sonnet 4.5 on Claude Code
Bugs fixed by Codex  <br>

> “It's start from Northern Thailand ☕”

 
---
 

<p align="center">
  <sub>2025 © MIT License — Made for humans who still believe in feel.</sub>
</p>
