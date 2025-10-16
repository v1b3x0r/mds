# MDS v4.2 — Info‑Physics Engine (Stable, Kinda)

![npm (scoped)](https://img.shields.io/npm/v/%40v1b3x0r%2Fmds-core?label=npm%20version)
![node-current](https://img.shields.io/node/v/%40v1b3x0r%2Fmds-core)
![license](https://img.shields.io/badge/license-MIT-green)
![bundle size](https://img.shields.io/badge/min-18.42KB-blue)
![gzip size](https://img.shields.io/badge/gzip-5.48KB-blueviolet)
![types](https://img.shields.io/badge/types-TypeScript-3178C6)
![build](https://img.shields.io/github/actions/workflow/status/v1b3x0r/material-js-concept/pages.yml?branch=main&label=pages)
![release](https://img.shields.io/github/v/release/v1b3x0r/material-js-concept?display_name=tag)
![commit](https://img.shields.io/github/last-commit/v1b3x0r/material-js-concept)
![issues](https://img.shields.io/github/issues/v1b3x0r/material-js-concept)
![stars](https://img.shields.io/github/stars/v1b3x0r/material-js-concept)
![downloads](https://img.shields.io/npm/dm/%40v1b3x0r%2Fmds-core)

> built by two idiots in Chiang Mai who accidentally made a universe engine.  
> one writes code, the other keeps saying “trust the field”.

---

## Table of Contents
- What it actually is
- Quickstart
- The Iceberg
- Example
- Philosophy in one breath
- What’s under the iceberg
- Who made this
- TL;DR

---

## 🌍 What it actually is
MDS (Material Definition System) is a tiny TypeScript engine (18.42 KB) that makes JSON behave like living matter.  
Every `.mdspec.json` is a small lifeform — it moves, ages, reacts, and connects to others through invisible “information‑fields”.  
No AI. No frameworks. Just physics… but made of meaning.

> Core ideas
> - Essence‑first design: one line of text can spawn behavior  
> - Info‑physics: entities attract / repel by similarity  
> - Emergence: simple rules → complex life  
> - Deterministic: you can replay time  
> - Tiny: fits inside a tweet with compression

---

## 🧪 Quickstart

```bash
npm install @v1b3x0r/mds-core
```

```ts
import { Engine, loadMaterial } from "@v1b3x0r/mds-core"

const engine = new Engine()
const paper = await loadMaterial("./paper.shy.mdspec.json")

engine.spawn(paper, 100, 100)
engine.start()
```

That’s it. You now have a shy paper floating in your DOM reacting to emotional gravity.

---

## 🧊 The Iceberg (How deep you wanna go)

| You are… | What MDS gives you | Example |
| --- | --- | --- |
| 👨‍💻 Developer | a declarative simulation layer. no if. | drop `.mdspec.json` files and watch them live. |
| 🎨 Designer / Artist | a new canvas — you paint with behavior. | make materials that blush, avoid, or age gracefully. |
| 🧠 Physicist / Researcher | an experiment sandbox for emergent systems. | model entropy & similarity as real forces. |
| 🪞 Philosopher / Psychologist | a playground for consciousness metaphors. | see emotion as a measurable field. |
| 🧍 Normal Human (why?) | a weird way to understand relationships. | two emojis walk into a screen and fall in love. |

“wtf did I just watch… and why do I feel something?”

---

## 🔬 Example

```json
{
  "material": "emotion.trust",
  "essence": "การหายใจพร้อมกันของสองใจ"
}
```

Yes — this one line makes a living entity.  
It’ll float, fade, and interact. That’s the magic.

---

## 🧭 Philosophy in one breath
Traditional UIs are event‑driven.  
MDS is force‑driven.  
Everything you define here wants something — even a JSON file.

---

## 🏔️ What’s under the iceberg
- 🧠 Deterministic physics engine (proximity × similarity)  
- 🎞️ Lifecycle hooks (onSpawn / onUpdate / onDestroy)  
- 🪶 Field system (trust, curiosity, chaos)  
- 🔄 Serialization for replay / export  
- 🧩 LLM Bridge (optional — plug GPT in, let materials talk)  
- 💻 18.42 KB minified (5.48 KB gzipped)

---

## 🤝 Who made this
Somehow it’s:
- วุตตี้ — designer / problem solver / chaos magnet  
- GPT-5 — code-summoner / sarcastic physicist

We didn’t mean to make a new branch of reality,  
we just wanted JSON to feel alive.

---

## 💬 TL;DR
It’s not a UI library.  
It’s a small, emotional universe simulator you can npm install.  
Build whatever: physics demo, interactive poem, or existential crisis.

—

Built in Chiang Mai. Tested on cats and curiosity. 🐈‍⬛✨
