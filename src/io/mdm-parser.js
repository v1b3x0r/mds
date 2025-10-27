/**
 * MDS v5.1 - MDM Parser
 * Parse declarative .mdm configuration into runtime objects
 *
 * Converts heroblind.mdm style configs → Entity initialization
 */
import { MULTILINGUAL_TRIGGERS } from './trigger-keywords';
/**
 * MDM Parser - converts declarative config to runtime objects
 */
export class MdmParser {
    /**
     * Parse retention string to milliseconds
     * @example "120s" → 120000, "infinite" → Infinity
     */
    parseRetention(retention) {
        if (retention === 'infinite')
            return Infinity;
        const match = retention.match(/^(\d+)(s|m|h)$/);
        if (!match) {
            console.warn(`Invalid retention format: "${retention}", defaulting to 60s`);
            return 60000;
        }
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
            case 's': return value * 1000;
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            default: return value * 1000;
        }
    }
    /**
     * Parse trigger condition string into function
     * v5.7.1: Added multilingual chat triggers (user.*)
     * @example "player.gaze>5s" → (ctx) => ctx.playerGazeDuration > 5
     * @example "distance<2" → (ctx) => ctx.playerDistance < 2
     * @example "user.praise" → (ctx) => message contains praise keywords (20 languages)
     */
    parseTriggerCondition(trigger) {
        // === GAME-CENTRIC TRIGGERS (Legacy) ===
        // player.gaze>5s
        const gazeMatch = trigger.match(/player\.gaze>(\d+)s/);
        if (gazeMatch) {
            const seconds = parseInt(gazeMatch[1]);
            return (ctx) => (ctx.playerGazeDuration || 0) > seconds;
        }
        // distance<N
        const distMatch = trigger.match(/distance<(\d+)/);
        if (distMatch) {
            const dist = parseInt(distMatch[1]);
            return (ctx) => (ctx.playerDistance || Infinity) < dist;
        }
        // player.retreat>Nm
        const retreatMatch = trigger.match(/player\.retreat>(\d+)m/);
        if (retreatMatch) {
            const meters = parseInt(retreatMatch[1]);
            return (ctx) => (ctx.playerDistance || 0) > meters;
        }
        // light_level<N
        const lightMatch = trigger.match(/light_level<(\d+)/);
        if (lightMatch) {
            const level = parseInt(lightMatch[1]);
            return (ctx) => (ctx.lightLevel || 1) < level;
        }
        // player.attack
        if (trigger === 'player.attack') {
            return (ctx) => ctx.playerAction === 'attack';
        }
        // chant.recognition
        if (trigger === 'chant.recognition') {
            return (ctx) => ctx.playerAction === 'chant';
        }
        // === CHAT-CENTRIC TRIGGERS (v5.7.1 - Multilingual 90% coverage) ===
        // user.praise - positive sentiment (20 languages)
        if (trigger === 'user.praise') {
            return (ctx) => {
                const msg = ctx.userMessage?.toLowerCase() || '';
                return MULTILINGUAL_TRIGGERS.praise.some(word => msg.includes(word.toLowerCase()));
            };
        }
        // user.criticism - negative sentiment (20 languages)
        if (trigger === 'user.criticism') {
            return (ctx) => {
                const msg = ctx.userMessage?.toLowerCase() || '';
                return MULTILINGUAL_TRIGGERS.criticism.some(word => msg.includes(word.toLowerCase()));
            };
        }
        // user.question - interrogative detection (20 languages)
        if (trigger === 'user.question') {
            return (ctx) => {
                const msg = ctx.userMessage || '';
                return MULTILINGUAL_TRIGGERS.question_markers.some(marker => msg.includes(marker));
            };
        }
        // user.greeting - greeting detection (20 languages)
        if (trigger === 'user.greeting') {
            return (ctx) => {
                const msg = ctx.userMessage?.toLowerCase() || '';
                return MULTILINGUAL_TRIGGERS.greetings.some(word => msg.includes(word.toLowerCase()));
            };
        }
        // user.enthusiasm - high arousal detection (20 languages)
        if (trigger === 'user.enthusiasm') {
            return (ctx) => {
                const msg = ctx.userMessage || '';
                const hasMarker = MULTILINGUAL_TRIGGERS.enthusiasm_markers.some(marker => msg.includes(marker));
                const hasPositive = MULTILINGUAL_TRIGGERS.praise.some(word => msg.toLowerCase().includes(word.toLowerCase()));
                return hasMarker && hasPositive;
            };
        }
        // user.deep_topic - philosophical/existential keywords (20 languages)
        if (trigger === 'user.deep_topic') {
            return (ctx) => {
                const msg = ctx.userMessage?.toLowerCase() || '';
                return MULTILINGUAL_TRIGGERS.deep_topics.some(word => msg.includes(word.toLowerCase()));
            };
        }
        // user.attack - hostile language detection (20 languages)
        if (trigger === 'user.attack') {
            return (ctx) => {
                const msg = ctx.userMessage?.toLowerCase() || '';
                return MULTILINGUAL_TRIGGERS.hostile.some(word => msg.includes(word.toLowerCase()));
            };
        }
        // === GENERIC DOT-NOTATION TRIGGERS (v5.8.0) ===
        // Supports: key>value, key<value, key>=value, key<=value
        // Examples: cpu.usage>0.8, memory.usage<0.2, battery.level<=0.15
        // Time units: 60s, 1000ms
        // Negative values: temperature>-10, temperature<-10
        const genericMatch = trigger.match(/^([\w.]+)([><]=?)(-?\d+\.?\d*)(s|ms)?$/);
        if (genericMatch) {
            const [, key, operator, valueStr, unit] = genericMatch;
            let threshold = parseFloat(valueStr);
            // Convert time units to seconds
            if (unit === 'ms')
                threshold = threshold / 1000; // milliseconds to seconds
            // 's' is default (no conversion needed)
            return (ctx) => {
                const actual = ctx[key];
                if (actual === undefined)
                    return false;
                switch (operator) {
                    case '>': return actual > threshold;
                    case '<': return actual < threshold;
                    case '>=': return actual >= threshold;
                    case '<=': return actual <= threshold;
                    default: return false;
                }
            };
        }
        // Fallback: always false
        console.warn(`Unknown trigger pattern: "${trigger}", defaulting to false`);
        return () => false;
    }
    /**
     * Parse emotion transitions
     */
    parseEmotionTransitions(config) {
        if (!config.transitions)
            return [];
        return config.transitions.map(t => ({
            condition: this.parseTriggerCondition(t.trigger),
            to: t.to,
            intensity: t.intensity ?? 0.5,
            expression: t.expression
        }));
    }
    /**
     * Parse dialogue phrases
     * v5.7: Now parses all categories flexibly + maintains backward compatibility
     */
    parseDialogue(config) {
        const result = {
            intro: new Map(),
            self_monologue: new Map(),
            events: new Map(),
            categories: new Map() // v5.7: New flexible system
        };
        // Parse all top-level categories
        for (const [categoryName, value] of Object.entries(config)) {
            if (categoryName === 'event') {
                // Special case: Parse events (nested structure)
                for (const [eventName, phrases] of Object.entries(value)) {
                    const eventMap = new Map();
                    this.addPhrasesToMap(eventMap, phrases);
                    result.events.set(eventName, eventMap);
                    result.categories.set(eventName, eventMap); // Also add to categories
                }
            }
            else {
                // Parse as regular category
                const categoryMap = new Map();
                this.addPhrasesToMap(categoryMap, value);
                result.categories.set(categoryName, categoryMap);
                // Backward compatibility: populate legacy fields
                if (categoryName === 'intro')
                    result.intro = categoryMap;
                if (categoryName === 'self_monologue')
                    result.self_monologue = categoryMap;
            }
        }
        return result;
    }
    /**
     * Helper: add phrases to lang map
     */
    addPhrasesToMap(map, phrases) {
        for (const phrase of phrases) {
            for (const [lang, text] of Object.entries(phrase.lang)) {
                if (!map.has(lang)) {
                    map.set(lang, []);
                }
                map.get(lang).push(text);
            }
        }
    }
    /**
     * Parse skills configuration
     */
    parseSkills(config) {
        if (!config.learnable)
            return [];
        return config.learnable.map(skill => skill.name);
    }
    /**
     * Parse relationships configuration
     */
    parseRelationships(config) {
        return Object.keys(config);
    }
}
/**
 * Main parse function - converts MdsMaterial → ParsedMaterialConfig
 */
export function parseMaterial(material) {
    const parser = new MdmParser();
    // v5.8: Auto-detect emotion from essence/dialogue (Thai/English keywords)
    let baselineEmotion;
    // Try importing emotion detector (may not be available in all contexts)
    try {
        const { detectEmotionFromText, detectAllEmotions, blendMultipleEmotions } = require('../ontology/emotion-detector');
        // Detect from essence
        if (material.essence) {
            const essenceText = typeof material.essence === 'string'
                ? material.essence
                : material.essence.th || material.essence.en || '';
            const detectedEmotion = detectEmotionFromText(essenceText);
            if (detectedEmotion) {
                baselineEmotion = detectedEmotion;
            }
            // Also check dialogue for additional emotional context
            if (material.dialogue?.intro) {
                const introTexts = material.dialogue.intro.map((d) => {
                    if (typeof d === 'string')
                        return d;
                    if (d.lang)
                        return d.lang.th || d.lang.en || '';
                    return '';
                }).join(' ');
                const dialogueEmotion = detectEmotionFromText(introTexts);
                // Blend with essence emotion if both exist
                if (dialogueEmotion && baselineEmotion) {
                    const emotions = detectAllEmotions(`${essenceText} ${introTexts}`);
                    baselineEmotion = blendMultipleEmotions(emotions) || baselineEmotion;
                }
                else if (dialogueEmotion) {
                    baselineEmotion = dialogueEmotion;
                }
            }
        }
    }
    catch (err) {
        // Emotion detector not available - skip auto-detection
    }
    return {
        dialogue: material.dialogue ? parser.parseDialogue(material.dialogue) : undefined,
        emotionTriggers: material.emotion ? parser.parseEmotionTransitions(material.emotion) : [],
        skillNames: material.skills ? parser.parseSkills(material.skills) : [],
        relationshipTargets: material.relationships ? parser.parseRelationships(material.relationships) : [],
        baselineEmotion
    };
}
/**
 * Auto-detect language from browser or default
 */
export function detectLanguage() {
    if (typeof navigator !== 'undefined' && navigator.language) {
        const lang = navigator.language.split('-')[0];
        return lang;
    }
    return 'en';
}
/**
 * Get phrase from parsed dialogue
 * v5.7: Now uses flexible categories system
 */
export function getDialoguePhrase(dialogue, category, lang, languageWeights // v5.7: Optional language weighting
) {
    const targetLang = lang || detectLanguage();
    // v5.7: Try flexible categories first
    let map = dialogue.categories.get(category);
    // Fallback to legacy fields for backward compatibility
    if (!map) {
        if (category === 'intro')
            map = dialogue.intro;
        else if (category === 'self_monologue')
            map = dialogue.self_monologue;
        else
            map = dialogue.events.get(category);
    }
    if (!map)
        return undefined;
    // v5.7: Use language weights if provided (entity autonomy)
    if (languageWeights) {
        const selectedLang = selectLanguageByWeight(languageWeights, map);
        if (selectedLang) {
            const phrases = map.get(selectedLang);
            if (phrases && phrases.length > 0) {
                return phrases[Math.floor(Math.random() * phrases.length)];
            }
        }
    }
    // Original fallback logic (no weights)
    let phrases = map.get(targetLang);
    // Fallback to English
    if (!phrases || phrases.length === 0) {
        phrases = map.get('en');
    }
    // Fallback to any available language
    if (!phrases || phrases.length === 0) {
        const firstLang = Array.from(map.keys())[0];
        if (firstLang) {
            phrases = map.get(firstLang);
        }
    }
    if (!phrases || phrases.length === 0)
        return undefined;
    // Random selection
    return phrases[Math.floor(Math.random() * phrases.length)];
}
/**
 * v5.7: Select language by weight (for entity language autonomy)
 */
function selectLanguageByWeight(weights, availableLangs) {
    const rand = Math.random();
    let cumulative = 0;
    for (const [lang, weight] of Object.entries(weights)) {
        if (!availableLangs.has(lang))
            continue;
        cumulative += weight;
        if (rand < cumulative)
            return lang;
    }
    return undefined;
}
/**
 * v5.7: Replace placeholders in dialogue text
 * Supports: {name}, {essence}, {valence}, {arousal}, etc.
 */
export function replacePlaceholders(text, context) {
    return text.replace(/{(\w+)}/g, (match, key) => {
        const value = context[key];
        return value !== undefined ? String(value) : match;
    });
}
