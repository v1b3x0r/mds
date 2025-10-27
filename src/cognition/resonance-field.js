/**
 * MDS v5.5 - Resonance Field System
 * Cognitive signal propagation through entity networks
 *
 * Design principles:
 * - Field-based evolution (not message passing)
 * - Understanding propagates like energy
 * - Strength decays with network distance
 * - Three signal types: memory, emotion, pattern
 */
import { resonate } from '../ontology/emotion';
/**
 * Resonance Field - Propagates cognitive signals through network
 *
 * @example
 * const field = new ResonanceField({ decayRate: 0.2 })
 *
 * // Entity A remembers something
 * const signal: CognitiveSignal = {
 *   type: 'memory',
 *   source: entityA.id,
 *   timestamp: world.time,
 *   payload: memory,
 *   strength: 0.9
 * }
 *
 * // Propagate to connected entities
 * field.propagate(signal, entityA, world.entities)
 */
export class ResonanceField {
    decayRate; // Strength loss per hop (0..1)
    minStrength; // Don't propagate below this threshold
    constructor(options = {}) {
        this.decayRate = options.decayRate ?? 0.2;
        this.minStrength = options.minStrength ?? 0.1;
    }
    /**
     * Propagate signal through cognitive network
     *
     * @param signal - Signal to propagate
     * @param source - Origin entity
     * @param entities - All entities in world
     * @returns Propagation statistics
     */
    propagate(signal, source, entities) {
        const visited = new Set([source.id]);
        const queue = [];
        // Start with directly connected entities
        if (source.cognitiveLinks) {
            for (const [targetId, link] of source.cognitiveLinks) {
                const target = entities.find(e => e.id === targetId);
                if (target) {
                    const strength = signal.strength * link.strength * (1 - this.decayRate);
                    if (strength >= this.minStrength) {
                        queue.push({ entity: target, strength, depth: 1 });
                    }
                }
            }
        }
        let maxDepth = 0;
        let minStrength = signal.strength;
        // Breadth-first propagation
        while (queue.length > 0) {
            const { entity, strength, depth } = queue.shift();
            if (visited.has(entity.id))
                continue;
            visited.add(entity.id);
            maxDepth = Math.max(maxDepth, depth);
            minStrength = Math.min(minStrength, strength);
            // Deliver signal to entity
            this.deliverSignal(signal, entity, strength);
            // Continue propagation to neighbors
            if (entity.cognitiveLinks) {
                for (const [targetId, link] of entity.cognitiveLinks) {
                    if (visited.has(targetId))
                        continue;
                    const target = entities.find(e => e.id === targetId);
                    if (target) {
                        const newStrength = strength * link.strength * (1 - this.decayRate);
                        if (newStrength >= this.minStrength) {
                            queue.push({ entity: target, strength: newStrength, depth: depth + 1 });
                        }
                    }
                }
            }
        }
        return {
            reached: Array.from(visited).filter(id => id !== source.id),
            hops: maxDepth,
            finalStrength: minStrength
        };
    }
    /**
     * Deliver signal to entity (modifies entity state)
     */
    deliverSignal(signal, entity, strength) {
        switch (signal.type) {
            case 'memory':
                this.deliverMemorySignal(signal, entity, strength);
                break;
            case 'emotion':
                this.deliverEmotionSignal(signal, entity, strength);
                break;
            case 'pattern':
                this.deliverPatternSignal(signal, entity, strength);
                break;
        }
    }
    /**
     * Deliver memory signal (adds faded memory to target)
     */
    deliverMemorySignal(signal, entity, strength) {
        if (!entity.memory)
            return;
        const sourceMemory = signal.payload;
        // Create indirect memory (remembered from another entity)
        entity.memory.add({
            timestamp: entity.age,
            type: 'observation',
            subject: signal.source,
            content: {
                indirect: true,
                originalMemory: sourceMemory,
                receivedStrength: strength
            },
            salience: sourceMemory.salience * strength
        });
    }
    /**
     * Deliver emotion signal (triggers resonance)
     */
    deliverEmotionSignal(signal, entity, strength) {
        if (!entity.emotion)
            return;
        const sourceEmotion = signal.payload;
        // Apply emotional resonance (v5.5: uses resonate() from emotion.ts)
        resonate(entity.emotion, sourceEmotion, strength);
    }
    /**
     * Deliver pattern signal (updates learning system)
     */
    deliverPatternSignal(signal, entity, strength) {
        if (!entity.learning)
            return;
        // Pattern payload contains action -> outcome data
        const pattern = signal.payload;
        // Apply federated learning: external pattern influences local Q-values
        // Note: This requires extending LearningSystem with pattern injection
        // For now, we just store it as a memory
        if (entity.memory) {
            entity.memory.add({
                timestamp: entity.age,
                type: 'observation',
                subject: signal.source,
                content: {
                    type: 'pattern',
                    action: pattern.action,
                    outcome: pattern.outcome,
                    strength
                },
                salience: strength
            });
        }
    }
}
