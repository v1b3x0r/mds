Goal: Implement a tiny, framework-free, ESM/TypeScript engine (“MDS-4”) that treats JSON not as config but as material descriptions (ontology + field behavior). Ship a runnable demo (two “paper” cards with emoji) that shows:
	•	materials are alive (age, fade, move),
	•	fields spawn on interaction (trust field),
	•	clustering emerges without any LLM,
	•	optional LLM bridge stub (not used in the demo).

Keep bundle small: ≤ 20 KB minified (≤ ~10 KB gzipped) for core (without LLM bridge).

⸻

Requirements (Non-negotiable)
	1.	No framework (no React/Vue/etc). Pure TS + DOM. ESM build.
	2.	Engine loop (tick) applies forces based on essence/entropy/similarity/proximity; materials can spawn fields (radius + duration) that affect others.
	3.	Essence-first: a material with only "essence" still works (engine derives minimal behavior).
	4.	Two demos:
	•	Demo A (emoji-field.html): two “paper” materials (curious/shy) that age/fade, respond to hover, and can spawn a field.trust.core.
	•	Demo B (cluster.html): spawn 5 entities with random essence/energy/entropy; watch self-grouping emerge without LLM.
	5.	LLM bridge stub (separate module): typed interface + no network calls; just a placeholder function.
	6.	Types for MdsMaterial, MdsField, etc.
	7.	No CORS headaches: everything runs as static ESM (Vite dev + build).
	8.	Readable README with the line:
“This is not a config file. It’s a description of a living material.”

⸻

Project Layout

mds-core/
├─ src/
│  ├─ core/
│  │  ├─ engine.ts        # Engine: tick(), apply(), event loop
│  │  ├─ essence.ts       # Info-physics: similarity, forces, entropy drift
│  │  ├─ entity.ts        # Entity class (material instance)
│  │  ├─ field.ts         # Field class (radius/duration/effects)
│  │  └─ render.ts        # DOM renderer (divs / emoji / styles)
│  ├─ io/
│  │  ├─ loader.ts        # Load & validate mdspec JSON
│  │  └─ bridge-llm.ts    # Optional LLM bridge (typed stub)
│  ├─ schema/
│  │  ├─ mdspec.d.ts      # Types for materials
│  │  └─ fieldspec.d.ts   # Types for field specs
│  ├─ utils/
│  │  ├─ math.ts          # vec2, distance, clamp, lerp, rand
│  │  ├─ random.ts        # seeded RNG, noise
│  │  └─ events.ts        # tiny pub/sub (onSpawn, onField, onAge)
│  ├─ index.ts            # Public API exports
│  └─ playground.ts       # Local quick sandbox
├─ examples/
│  ├─ emoji-field.html    # Demo A
│  ├─ cluster.html        # Demo B
│  ├─ paper.curious.mdspec.json
│  ├─ paper.shy.mdspec.json
│  └─ field.trust.core.mdspec.json
├─ package.json
├─ README.md
├─ tsconfig.json
└─ vite.config.ts


⸻

Type Definitions (exact enough to guide implementation)

// schema/mdspec.d.ts
export type LangText = string | { th?: string; en?: string; [k: string]: string | undefined };

export interface MdsBehaviorRule {
  condition?: string;          // e.g., "proximity<80 && repeats>=3"
  threshold?: number;          // e.g., for repeat-hover
  effect?: string;             // e.g., "glow.soft", "slide.away", "follow.cursor"
  spawn?: string;              // field material id to spawn
  emoji?: string;              // optional emoji change
  after?: string;              // e.g., "12s"
}

export interface MdsMaterial {
  $schema?: string;
  material: string;            // e.g., "paper.shy", "emotion.trust"
  intent?: string;             // short verb/noun, e.g., "observe", "resonate"
  essence?: LangText;          // essence-first
  behavior?: {
    onHover?: MdsBehaviorRule;
    onIdle?: MdsBehaviorRule;
    onRepeatHover?: MdsBehaviorRule;
    onProximity?: MdsBehaviorRule;
    onBind?: MdsBehaviorRule;
    onDesync?: MdsBehaviorRule;
  };
  physics?: { mass?: number; friction?: number; bounce?: number };
  manifestation?: {
    emoji?: string;
    visual?: string;
    aging?: { start_opacity?: number; decay_rate?: number }; // per second
  };
  ai_binding?: { model_hint?: string; simulate?: boolean };
  notes?: string[];
}

// schema/fieldspec.d.ts
export interface MdsField {
  material: string;        // "field.trust.core"
  type: "field";
  origin: "self" | "$bind" | "$cursor" | string;
  radius: number;          // px
  duration: number;        // ms
  visual?: { aura?: string; motion?: string };
  effect_on_others?: Record<string, number | string | boolean>;
}


⸻

Core APIs (minimal but complete)

// src/index.ts
export { Engine } from "./core/engine";
export { loadMaterial } from "./io/loader";
export type { MdsMaterial } from "./schema/mdspec";
export type { MdsField } from "./schema/fieldspec";

// src/core/engine.ts
import { similarity, clamp } from "../utils/math";
import { Entity } from "./entity";
import { Field } from "./field";

export class Engine {
  private entities: Entity[] = [];
  private fields: Field[] = [];
  private running = false;
  private last = 0;

  spawn(material: import("../schema/mdspec").MdsMaterial, x?: number, y?: number) {
    const e = new Entity(material, x, y);
    this.entities.push(e);
    return e;
  }

  spawnField(fs: import("../schema/fieldspec").MdsField, x: number, y: number) {
    const f = new Field(fs, x, y);
    this.fields.push(f);
    return f;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (t: number) => {
      if (!this.running) return;
      const dt = (t - this.last) / 1000;
      this.last = t;
      this.tick(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  stop() { this.running = false; }

  private tick(dt: number) {
    // decay/aging & behavior timing
    for (const e of this.entities) e.update(dt);

    // pairwise simple info-physics (proximity + similarity)
    for (let i = 0; i < this.entities.length; i++) {
      for (let j = i + 1; j < this.entities.length; j++) {
        const a = this.entities[i], b = this.entities[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1;
        const sim = 1 - Math.abs(a.entropy - b.entropy);
        const k = 0.05 * sim;
        if (dist < 160) {
          const fx = (dx / dist) * k, fy = (dy / dist) * k;
          a.vx += fx * dt; a.vy += fy * dt;
          b.vx -= fx * dt; b.vy -= fy * dt;
        }
        // onProximity trigger
        if (dist < 80) a.onProximity?.(this, b, dist);
        if (dist < 80) b.onProximity?.(this, a, dist);
      }
    }

    // fields: apply effects & expire
    for (const f of this.fields) f.update(dt, this.entities);
    this.fields = this.fields.filter(f => !f.expired);

    // integrate motion and render
    for (const e of this.entities) e.integrateAndRender(dt);
  }
}

// src/core/entity.ts
import type { MdsMaterial } from "../schema/mdspec";
import { clamp } from "../utils/math";
import { applyRule, parseSeconds } from "../utils/events";

export class Entity {
  m: MdsMaterial;
  x: number; y: number; vx = 0; vy = 0;
  age = 0; repeats = 0; opacity = 1;
  entropy = Math.random(); energy = Math.random();
  el: HTMLDivElement;
  hoverCount = 0; lastHoverTime = 0;

  constructor(m: MdsMaterial, x = Math.random() * 480, y = Math.random() * 320) {
    this.m = m;
    this.x = x; this.y = y;
    this.el = document.createElement("div");
    this.el.className = "mds-entity";
    this.el.style.position = "absolute";
    this.el.style.willChange = "transform, opacity, filter";
    this.el.dataset.material = m.material;

    const emoji = m.manifestation?.emoji ?? "📄";
    this.el.textContent = emoji;

    this.attachDOMHandlers();
    document.body.appendChild(this.el);
    this.render();
  }

  private attachDOMHandlers() {
    this.el.addEventListener("mouseover", () => {
      const now = performance.now();
      if (now - this.lastHoverTime < 700) this.hoverCount++;
      else this.hoverCount = 1;
      this.lastHoverTime = now;

      // onHover behavior
      const rule = this.m.behavior?.onHover;
      if (rule) applyRule(rule, this);
      // onRepeatHover
      const r2 = this.m.behavior?.onRepeatHover;
      if (r2 && this.hoverCount >= (r2.threshold ?? 3)) applyRule(r2, this);
    });
  }

  update(dt: number) {
    this.age += dt;
    const decay = this.m.manifestation?.aging?.decay_rate ?? 0;
    if (decay > 0) this.opacity = clamp(this.opacity - decay * dt, 0, 1);

    // inertia/friction
    const fr = this.m.physics?.friction ?? 0.02;
    this.vx *= (1 - fr); this.vy *= (1 - fr);
  }

  onProximity?(engine: import("./engine").Engine, other: Entity, dist: number): void;

  integrateAndRender(dt: number) {
    this.x += this.vx; this.y += this.vy;
    this.render();
  }

  render() {
    this.el.style.opacity = String(this.opacity);
    this.el.style.transform = `translate(${this.x}px, ${this.y}px)`;
  }
}

// src/core/field.ts
import type { MdsField } from "../schema/fieldspec";
import { distance } from "../utils/math";
import { Entity } from "./entity";

export class Field {
  f: MdsField;
  x: number; y: number;
  t = 0; expired = false;

  constructor(f: MdsField, x: number, y: number) {
    this.f = f; this.x = x; this.y = y;
  }

  update(dt: number, entities: Entity[]) {
    this.t += dt * 1000;
    if (this.t > this.f.duration) { this.expired = true; return; }

    // Gentle effect: slightly soften opacity or slow movement
    for (const e of entities) {
      const d = distance(this.x, this.y, e.x, e.y);
      if (d <= this.f.radius) {
        if (typeof this.f.effect_on_others?.opacity === "number") {
          const target = Number(this.f.effect_on_others.opacity);
          e.opacity = Math.max(e.opacity, Math.min(1, target));
        }
        if (this.f.effect_on_others?.["behavior.depthMultiplier"]) {
          // Placeholder for deeper behavior amplification
        }
      }
    }
  }
}

// src/io/loader.ts
import type { MdsMaterial } from "../schema/mdspec";

export async function loadMaterial(path: string): Promise<MdsMaterial> {
  const res = await fetch(path);
  const json = await res.json();
  return json as MdsMaterial;
}

// src/io/bridge-llm.ts
export interface LlmBridge {
  speak(materialId: string, context: Record<string, unknown>): Promise<string>;
}
// Stub: no network; caller may inject later.
export const DummyBridge: LlmBridge = {
  async speak() { return ""; }
};

// src/utils/math.ts
export const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export const distance = (x1: number, y1: number, x2: number, y2: number) =>
  Math.hypot(x2 - x1, y2 - y1);
export const similarity = (a: number, b: number) => 1 - Math.abs(a - b);

// src/utils/events.ts
import type { MdsBehaviorRule } from "../schema/mdspec";

export const parseSeconds = (s?: string) => {
  if (!s) return 0;
  if (s.endsWith("ms")) return parseFloat(s);
  if (s.endsWith("s")) return parseFloat(s) * 1000;
  return parseFloat(s);
};

export function applyRule(rule: MdsBehaviorRule, entity: any) {
  // minimal effects
  if (rule.effect?.includes("glow")) {
    entity.el.style.filter = "drop-shadow(0 0 6px rgba(255,220,120,.8))";
    setTimeout(() => (entity.el.style.filter = ""), 200);
  }
  if (rule.effect?.includes("slide")) {
    entity.vx += (Math.random() - 0.5) * 2;
    entity.vy += (Math.random() - 0.5) * 2;
  }
  if (rule.effect?.includes("follow.cursor")) {
    // caller can set a global cursor target; keep minimal here
  }
  if (rule.emoji) entity.el.textContent = rule.emoji;
}


⸻

Example Materials (put in /examples)

paper.shy.mdspec.json

{
  "$schema": "https://mds.v1b3.dev/schema/v1",
  "material": "paper.shy",
  "intent": "observe",
  "essence": {
    "th": "เหมือนกระดาษโน้ตที่อยากให้เห็นแต่ไม่กล้าส่ง",
    "en": "A quiet note that hopes to be found."
  },
  "behavior": {
    "onHover": { "effect": "glow.soft" },
    "onRepeatHover": { "threshold": 3, "effect": "slide.away", "emoji": "🫣" },
    "onProximity": { "condition": "distance<80", "spawn": "field.trust.core" }
  },
  "physics": { "mass": 0.1, "friction": 0.02 },
  "manifestation": { "emoji": "💌", "aging": { "start_opacity": 1, "decay_rate": 0.01 } },
  "notes": ["Passive, avoids contact, fades when ignored."]
}

paper.curious.mdspec.json

{
  "material": "paper.curious",
  "intent": "wander",
  "essence": {
    "th": "แอบสนใจทุกอย่าง เลยขยับเข้าไปใกล้",
    "en": "Keeps leaning in to see more."
  },
  "behavior": {
    "onHover": { "effect": "glow.soft", "emoji": "🐥" },
    "onProximity": { "condition": "distance<80", "spawn": "field.trust.core" }
  },
  "physics": { "mass": 0.12, "friction": 0.03, "bounce": 0 },
  "manifestation": { "emoji": "🐥", "aging": { "start_opacity": 1, "decay_rate": 0.005 } }
}

field.trust.core.mdspec.json

{
  "material": "field.trust.core",
  "type": "field",
  "origin": "$bind",
  "radius": 120,
  "duration": 45000,
  "visual": { "aura": "gentle amber", "motion": "slow ripple" },
  "effect_on_others": { "opacity": 0.9, "behavior.depthMultiplier": 1.2 }
}

(Essence-only minimal)

{ "material": "emotion.trust", "essence": "การหายใจพร้อมกันของสองใจ" }


⸻

Demo Pages

examples/emoji-field.html

A single static HTML that:
	•	imports ESM build,
	•	loads both papers + trust field,
	•	spawns two entities at different coords,
	•	starts engine,
	•	basic CSS (absolute positioned, large emoji, gentle transitions).

CSS minimal:

<style>
  body { margin:0; height:100vh; background:#0e0f12; color:#eee; overflow:hidden; }
  .mds-entity { font-size:40px; user-select:none; transition:filter .2s ease; }
</style>

Script outline:

<script type="module">
  import { Engine, loadMaterial } from '../dist/mds-core.esm.js';
  const engine = new Engine();
  const shy = await loadMaterial('./paper.shy.mdspec.json');
  const cur = await loadMaterial('./paper.curious.mdspec.json');
  const ftrust = await fetch('./field.trust.core.mdspec.json').then(r=>r.json());

  const a = engine.spawn(shy, 120, 120);
  const b = engine.spawn(cur, 360, 220);

  // simple proximity trigger → spawn trust field at midpoint
  a.onProximity = (eng, other, dist) => {
    if (dist < 70) eng.spawnField(ftrust, (a.x+other.x)/2, (a.y+other.y)/2);
  };
  b.onProximity = a.onProximity;

  engine.start();
</script>

examples/cluster.html

Spawn 5 entities (random essence/entropy/energy), no LLM; watch natural grouping within ~10s.

⸻

Build & Dev
	•	Vite ESM build with tsconfig.json targeting ES2020.
	•	Export ESM at dist/mds-core.esm.js.
	•	npm scripts:
	•	dev: vite
	•	build: vite build
	•	preview: vite preview

⸻

README (include these lines)

This is not a component.
This is not a UI.
This is a living material in a field.

JSON here is not config. It’s a description of a stateful entity
that behaves under information-physics: proximity, similarity, entropy, time.

Also add a TL;DR:
	•	Materials are descriptions (ontology).
	•	Fields are emergent (spawned by relations).
	•	Works without LLM; LLM bridge is optional.
	•	Core is tiny (≤ ~20 KB min; ≤ ~10 KB gz).

⸻

Acceptance Checklist
	•	emoji-field.html runs locally (no CORS), shows two papers that age/fade and react to hover; trust field can spawn on proximity.
	•	cluster.html shows 5 entities self-grouping (no LLM).
	•	Essence-only material can be spawned without errors.
	•	Core bundle size within target.
	•	No framework; ESM only; works on modern browsers.
	•	Types exported; public API: Engine, loadMaterial, types.
	•	LLM bridge file exists as typed stub (no calls).

⸻

Do not explain—just implement. Return the complete codebase with all files, ready to npm i && npm run dev.