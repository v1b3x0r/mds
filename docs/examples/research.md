# Research — Agent-Based Modeling Without the PhD

**tl;dr:** Simulate populations, collect data, reproduce experiments. Science side of Tumblr meets actual rigorous research.

---

## What You Can Study

### Population Dynamics
Spawn rabbits + foxes → watch Lotka-Volterra emerge → no differential equations required

### Social Networks
Spawn agents with relationship rules → clusters form → analyze centrality/betweenness → graph theory but visual

### Memory Research
Test Ebbinghaus curves with virtual subjects → vary salience → measure retention → actual psychology experiments

### Learning Theory
Compare Q-learning strategies → track convergence rates → optimize reward functions → RL research simplified

### Collective Behavior
Spawn 100 agents → enable communication → watch norms emerge → sociology experiments at scale

---

## Why MDS for Research

### 1. Reproducibility

```javascript
const world = new World({ seed: 12345 })
// Same seed = identical results
// Publish paper with seed → others reproduce exactly
```

**Every random value is deterministic.**

---

### 2. Data Collection

```javascript
const stats = world.getWorldStats()
// → { avgEnergy, totalMemories, relationshipCount }

const patterns = world.getPatterns()
// → [{ pattern: 'clustering', strength: 0.8 }]

const snapshot = world.snapshot()
// → Full state serialization for analysis
```

**Built-in metrics.**

---

### 3. Headless Simulation

```javascript
const world = new World({
  features: { ontology: true, rendering: 'headless' }
})

// Run 10,000 ticks in seconds
for (let i = 0; i < 10000; i++) {
  world.tick(0.016)
}
```

**No GPU. No visual overhead. Just computation.**

---

### 4. Batch Experiments

```javascript
for (let pop = 5; pop <= 50; pop += 5) {
  for (let trial = 0; trial < 100; trial++) {
    const world = new World({ seed: trial })

    // Spawn population
    for (let i = 0; i < pop; i++) {
      world.spawn(agentMaterial, randomX(), randomY())
    }

    // Run simulation
    for (let tick = 0; tick < 1000; tick++) {
      world.tick(0.016)
    }

    // Collect data
    results.push({
      population: pop,
      trial: trial,
      finalStats: world.getWorldStats()
    })
  }
}
```

**1000 experiments overnight.**

---

## Example Studies

**Psychology:** Test if salience affects memory decay → spawn subjects → vary salience → measure retention

**Sociology:** Test if trust networks form hierarchies → spawn 50 agents → measure centrality over time

**Economics:** Test if learning leads to equilibrium → spawn traders with Q-learning → track price convergence

---

## Data Export

### CSV Export

```javascript
const data = experiments.map(e => ({
  tick: e.tick,
  population: e.entities.length,
  avgEmotion: e.stats.avgEmotionalValence,
  clusterCount: e.patterns.filter(p => p.pattern === 'clustering').length
}))

fs.writeFileSync('results.csv', csvStringify(data))
```

---

### Full Snapshots

```javascript
const snapshot = world.snapshot()
fs.writeFileSync('experiment_state.json', JSON.stringify(snapshot, null, 2))
```

**Share entire world state with collaborators.**

---

## Publishing with MDS

### What to Include in Paper

1. **Seed value** → Reproducibility
2. **Material definitions** → Agent spec
3. **World config** → Environment setup
4. **Tick count** → Simulation duration
5. **Snapshot file** → Raw data

**Example citation:**
```
Simulation: MDS Core (@v1b3x0r/mds-core)
Seed: 42069
Population: 50 agents
Duration: 10,000 ticks
Materials: github.com/you/research/materials/
Data: github.com/you/research/snapshots/
```

---

## Limitations

### Computational
- O(n²) pairwise → scales poorly beyond ~100 entities
- Single-threaded → no parallel processing
- Memory usage grows with history

### Modeling
- PAD emotion = continuous, not discrete states
- No cultural context in emotion expression
- Memory encoding is perfect (no false memories)

### Semantic
- Entropy-based similarity without LLM = random
- True semantic requires embeddings = API cost
- No multimodal essence (text only)

---

## Ethics

### Be Careful With

**Anthropomorphization:** Agents aren't conscious. Don't over-attribute.

**Generalization:** MDS is simplified. Not a perfect model of humans.

**Bias:** LLM embeddings inherit training biases.

**Framing:** Results inform theory, don't prove it.

---

## Publishing Example

**Title:** "Emergent Social Hierarchies in Memory-Enabled Agents"

50 agents, 10,000 ticks, 100 trials. Result: Hierarchies emerge. Network centralization 0.73. Memory correlates with stability.

**Include:** Seed + materials + config + data snapshot

---

## FAQ

**Q: Is this real science?**
It's computational modeling. Valid for exploring dynamics, not proving universal laws.

**Q: Can I use this for my thesis?**
Yes. Cite MDS + provide reproducible setup.

**Q: How do I handle outliers?**
Same as any experiment: document, analyze, exclude if justified.

**Q: What if results don't replicate?**
Check seed, MDS version, material definitions. Deterministic = should replicate exactly.

---

**Your experiments are reproducible.**

**Your data is open.**

**Your model is 18KB.**

---

**Next:** [Advanced](./advanced.md) | [Back to Overview](../OVERVIEW.md)
