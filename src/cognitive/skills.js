/**
 * MDS v5 Phase 7 - Skill System
 * Skill acquisition, proficiency development, and decay
 *
 * Design principles:
 * - Skills improve with practice (learning curve)
 * - Skills decay without use (forgetting curve)
 * - Different skills have different learning rates
 * - Proficiency levels: Novice → Competent → Proficient → Expert → Master
 */
/**
 * Skill system
 * Manages skill acquisition and development
 */
export class SkillSystem {
    skills = new Map();
    config;
    constructor(config = {}) {
        this.config = {
            defaultLearningRate: config.defaultLearningRate ?? 0.1,
            defaultDecayRate: config.defaultDecayRate ?? 0.001,
            practiceBonus: config.practiceBonus ?? 0.05,
            relatedSkillBonus: config.relatedSkillBonus ?? 0.02
        };
    }
    /**
     * Add or update skill
     */
    addSkill(name, options = {}) {
        const existing = this.skills.get(name);
        if (existing) {
            // Update existing skill
            Object.assign(existing, options);
            return existing;
        }
        // Create new skill
        const skill = {
            name,
            proficiency: options.proficiency ?? 0,
            experience: options.experience ?? 0,
            lastPracticed: options.lastPracticed ?? Date.now(),
            learningRate: options.learningRate ?? this.config.defaultLearningRate,
            decayRate: options.decayRate ?? this.config.defaultDecayRate,
            relatedSkills: options.relatedSkills
        };
        this.skills.set(name, skill);
        return skill;
    }
    /**
     * Practice a skill (increase proficiency)
     */
    practice(name, intensity = 1) {
        const skill = this.skills.get(name);
        if (!skill)
            return false;
        const now = Date.now();
        // Learning curve (diminishing returns at higher proficiency)
        const learningFactor = (1 - skill.proficiency) * skill.learningRate;
        const gain = learningFactor * intensity * this.config.practiceBonus;
        // Bonus from related skills
        let relatedBonus = 0;
        if (skill.relatedSkills) {
            for (const relatedName of skill.relatedSkills) {
                const related = this.skills.get(relatedName);
                if (related) {
                    relatedBonus += related.proficiency * this.config.relatedSkillBonus;
                }
            }
        }
        // Update skill
        skill.proficiency = Math.min(1, skill.proficiency + gain + relatedBonus);
        skill.experience += intensity;
        skill.lastPracticed = now;
        return true;
    }
    /**
     * Apply skill decay (forgetting)
     */
    applyDecay(dt) {
        const now = Date.now();
        for (const skill of this.skills.values()) {
            const timeSinceLastPractice = (now - skill.lastPracticed) / 86400000; // days
            // Exponential decay (slower at higher proficiency - "it's like riding a bike")
            const decayFactor = skill.decayRate * (1 - skill.proficiency * 0.5);
            const decay = decayFactor * timeSinceLastPractice * dt;
            skill.proficiency = Math.max(0, skill.proficiency - decay);
        }
    }
    /**
     * Get skill level (novice → master)
     */
    getSkillLevel(name) {
        const skill = this.skills.get(name);
        if (!skill)
            return null;
        if (skill.proficiency >= 0.9)
            return 'master';
        if (skill.proficiency >= 0.7)
            return 'expert';
        if (skill.proficiency >= 0.5)
            return 'proficient';
        if (skill.proficiency >= 0.3)
            return 'competent';
        return 'novice';
    }
    /**
     * Get skill
     */
    getSkill(name) {
        return this.skills.get(name) || null;
    }
    /**
     * Get all skills
     */
    getAllSkills() {
        return Array.from(this.skills.values());
    }
    /**
     * Get top skills (sorted by proficiency)
     */
    getTopSkills(limit = 5) {
        return Array.from(this.skills.values())
            .sort((a, b) => b.proficiency - a.proficiency)
            .slice(0, limit);
    }
    /**
     * Check if has skill at minimum level
     */
    hasSkill(name, minProficiency = 0.3) {
        const skill = this.skills.get(name);
        return skill ? skill.proficiency >= minProficiency : false;
    }
    /**
     * Remove skill
     */
    removeSkill(name) {
        return this.skills.delete(name);
    }
    /**
     * Clear all skills
     */
    clear() {
        this.skills.clear();
    }
    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            skills: Array.from(this.skills.entries())
        };
    }
    /**
     * Restore from JSON
     */
    static fromJSON(data) {
        const system = new SkillSystem();
        system.skills = new Map(data.skills);
        return system;
    }
}
/**
 * Helper: Create skill
 */
export function createSkill(name, learningRate = 0.1, relatedSkills) {
    return {
        name,
        proficiency: 0,
        experience: 0,
        lastPracticed: Date.now(),
        learningRate,
        decayRate: 0.001,
        relatedSkills
    };
}
/**
 * Common skill presets
 */
export const SKILL_PRESETS = {
    // Social skills
    communication: createSkill('communication', 0.15, ['empathy', 'listening']),
    empathy: createSkill('empathy', 0.12),
    persuasion: createSkill('persuasion', 0.08, ['communication']),
    // Cognitive skills
    problem_solving: createSkill('problem_solving', 0.1, ['pattern_recognition']),
    pattern_recognition: createSkill('pattern_recognition', 0.12),
    memory: createSkill('memory', 0.1),
    // Physical skills (in abstract sense)
    navigation: createSkill('navigation', 0.13, ['spatial_awareness']),
    spatial_awareness: createSkill('spatial_awareness', 0.11),
    // Creative skills
    creativity: createSkill('creativity', 0.09),
    adaptation: createSkill('adaptation', 0.11, ['flexibility']),
    flexibility: createSkill('flexibility', 0.1)
};
