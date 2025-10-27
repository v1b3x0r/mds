/**
 * MDS v4.0 → v5.0 - Entity Class
 * A living material instance with autonomous behavior
 *
 * v5 additions:
 * - Persistent identity (UUID)
 * - Memory system (MemoryBuffer)
 * - Emotional state (PAD model)
 * - Intent system (goal stack)
 * - Relationships (bond graph)
 */
import { clamp } from '../utils/math';
import { applyRule } from '../utils/events';
// v5 ontology imports (optional features)
import { MemoryBuffer, IntentStack, applyEmotionalDelta, EMOTION_BASELINES } from '../ontology';
import { MessageQueue as MsgQueue, createMessage } from '../communication';
import { LearningSystem as LearningSystemImpl, SkillSystem as SkillSystemImpl, MemoryConsolidation as MemoryConsolidationImpl // v6.4: Added for consolidation wiring
 } from '../cognitive';
import { CognitiveLinkManager } from '../cognition/cognitive-link';
// v5.1: Declarative config parser
import { parseMaterial, getDialoguePhrase, replacePlaceholders } from '../io/mdm-parser';
/**
 * Entity class - Living material instance
 * v5.2: Implements MessageParticipant for communication compatibility
 */
export class Entity {
    // Material definition
    m;
    // Spatial properties
    x;
    y;
    vx = 0;
    vy = 0;
    // Temporal properties
    age = 0;
    repeats = 0;
    // Info-physics properties
    entropy;
    energy;
    opacity = 1;
    // DOM element (optional in v5 renderer mode)
    el;
    // Interaction tracking
    hoverCount = 0;
    lastHoverTime = 0;
    // Proximity callback (set by engine) - v5.2: Uses ProximityCallback interface
    onProximity;
    // Lifecycle hooks (v4.1) - v5.2: Use unknown for engine to avoid circular import
    onSpawn;
    onUpdate;
    onDestroy;
    // v5 Ontology (optional - only initialized if schema >= 5.0)
    id; // Persistent UUID
    memory; // Memory ring buffer
    emotion; // PAD emotional state
    intent; // Goal stack
    relationships; // Entity bonds
    // v5 Phase 5: Environmental physics (optional)
    temperature; // Kelvin
    humidity; // 0..1
    density; // kg/m³
    conductivity; // Thermal transfer rate (0..1)
    // v5 Phase 6: Communication (optional)
    inbox; // Received messages
    outbox; // Sent messages
    dialogue; // Current dialogue state
    // v5 Phase 7: Cognitive (optional)
    learning; // Experience-based learning
    consolidation; // Memory consolidation
    skills; // Skill acquisition
    // v5.5: P2P Cognition (optional)
    cognitiveLinks; // Direct entity-to-entity connections
    // v5.1: Declarative config (from heroblind.mdm)
    dialoguePhrases;
    emotionTriggers;
    triggerContext = {};
    // v5.6: Autonomous behavior flag
    _isAutonomous = false;
    // v5.7: Language autonomy
    nativeLanguage;
    languageWeights;
    adaptToContext = false;
    /**
     * Get essence string for LanguageGenerator (v5.2)
     * Extracts essence from material definition
     */
    get essence() {
        if (!this.m.essence)
            return undefined;
        // If essence is string, return it
        if (typeof this.m.essence === 'string') {
            return this.m.essence;
        }
        // If essence is LangText, extract first available language
        const langText = this.m.essence;
        return langText.en || langText.th || langText.ja || langText.es || langText.zh || undefined;
    }
    constructor(m, x, y, rng = Math.random, options // v5: Allow DOM-less entities
    ) {
        this.m = m;
        this.x = x ?? rng() * 480;
        this.y = y ?? rng() * 320;
        // Initialize info-physics properties (v4.2: use provided RNG)
        this.entropy = rng();
        this.energy = rng();
        // Override opacity if specified
        if (m.manifestation?.aging?.start_opacity !== undefined) {
            this.opacity = m.manifestation.aging.start_opacity;
        }
        // v5: Assign persistent UUID
        this.id = this.generateUUID();
        // v5: Initialize ontology (conditional - only if schema >= 5.0)
        if (this.shouldEnableOntology(m)) {
            this.initializeOntology(m);
        }
        // v5.1: Parse declarative config (dialogue, emotion triggers, skills)
        if (m.dialogue || m.emotion?.transitions || m.skills) {
            const parsed = parseMaterial(m);
            if (parsed.dialogue) {
                this.dialoguePhrases = parsed.dialogue;
            }
            if (parsed.emotionTriggers.length > 0) {
                this.emotionTriggers = parsed.emotionTriggers;
            }
        }
        // v5.7: Initialize language autonomy
        this.nativeLanguage = m.nativeLanguage || m.languageProfile?.native;
        this.languageWeights = m.languageProfile?.weights;
        this.adaptToContext = m.languageProfile?.adaptToContext ?? false;
        // Auto-generate weights if only nativeLanguage provided
        if (this.nativeLanguage && !this.languageWeights) {
            this.languageWeights = { [this.nativeLanguage]: 1.0 };
        }
        // Create DOM element (v4 legacy mode - skip if using v5 renderer)
        if (!options?.skipDOM && typeof document !== 'undefined') {
            this.el = document.createElement('div');
            this.el.className = 'mds-entity';
            this.el.style.position = 'absolute';
            this.el.style.willChange = 'transform, opacity, filter';
            this.el.dataset.material = m.material;
            this.el.dataset.id = this.id;
            // Set emoji
            const emoji = m.manifestation?.emoji ?? '📄';
            this.el.textContent = emoji;
            // Attach event handlers
            this.attachDOMHandlers();
            // Append to body (only if DOM available)
            if (typeof document !== 'undefined') {
                document.body.appendChild(this.el);
            }
            // Initial render
            this.render();
        }
    }
    /**
     * Generate UUID (v5)
     */
    generateUUID() {
        // Simple UUID v4 implementation
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    /**
     * Check if ontology features should be enabled (v5)
     */
    shouldEnableOntology(m) {
        // Enable if schema version is 5.0 or higher
        if (m.$schema?.includes('v5'))
            return true;
        // Enable if material has ontology-specific fields (implicit v5)
        // @ts-ignore - checking for v5 fields not in v4 schema yet
        if (m.ontology)
            return true;
        // Disabled by default (backward compatible)
        return false;
    }
    /**
     * Initialize ontology features (v5)
     */
    initializeOntology(m) {
        // Memory buffer
        // @ts-ignore - v5 schema extension
        const memorySize = m.ontology?.memorySize ?? 100;
        this.memory = new MemoryBuffer({ maxSize: memorySize });
        // Emotional state
        // @ts-ignore - v5 schema extension
        const emotionBaseline = m.ontology?.emotionBaseline ?? EMOTION_BASELINES.neutral;
        this.emotion = { ...emotionBaseline };
        // Intent stack
        this.intent = new IntentStack();
        // @ts-ignore - v5 schema extension
        const defaultIntent = m.ontology?.intentDefault;
        if (defaultIntent) {
            this.intent.push(defaultIntent);
        }
        // Relationships (empty initially)
        this.relationships = new Map();
        // Phase 5: Environmental physics properties
        // @ts-ignore - v5 Phase 5 extension
        this.temperature = m.physics?.temperature ?? 293; // 20°C default
        // @ts-ignore - v5 Phase 5 extension
        this.humidity = m.physics?.humidity ?? 0.5;
        // @ts-ignore - v5 Phase 5 extension
        this.density = m.physics?.density ?? 1.0; // kg/m³
        // @ts-ignore - v5 Phase 5 extension
        this.conductivity = m.physics?.conductivity ?? 0.5; // 0..1
        // Phase 6: Communication (lazy initialization - created on first use)
        // this.inbox and this.outbox will be created when first message is sent/received
        // this.dialogue will be set by DialogueManager when dialogue starts
        // Log spawn memory
        this.remember({
            timestamp: 0,
            type: 'spawn',
            subject: 'world',
            content: { material: m.material },
            salience: 1.0
        });
    }
    /**
     * Attach DOM event handlers for interactive behavior
     */
    attachDOMHandlers() {
        if (!this.el)
            return;
        this.el.addEventListener('mouseover', () => {
            const now = performance.now();
            // Track hover repeats (within 700ms window)
            if (now - this.lastHoverTime < 700) {
                this.hoverCount++;
            }
            else {
                this.hoverCount = 1;
            }
            this.lastHoverTime = now;
            // Apply onHover behavior
            const rule = this.m.behavior?.onHover;
            if (rule)
                applyRule(rule, this);
            // Apply onRepeatHover if threshold met
            const r2 = this.m.behavior?.onRepeatHover;
            if (r2 && this.hoverCount >= (r2.threshold ?? 3)) {
                applyRule(r2, this);
            }
        });
    }
    /**
     * Update entity state (aging, decay, friction)
     * v5.6: Added autonomous intent generation
     */
    update(dt) {
        // Age increases
        this.age += dt;
        // Opacity decay
        const decay = this.m.manifestation?.aging?.decay_rate ?? 0;
        if (decay > 0) {
            this.opacity = clamp(this.opacity - decay * dt, 0, 1);
        }
        // Apply friction to velocity
        const fr = this.m.physics?.friction ?? 0.02;
        this.vx *= (1 - fr);
        this.vy *= (1 - fr);
        // v5.6: Auto-generate intent if autonomous and intent stack is empty
        if (this._isAutonomous && this.intent && this.intent.isEmpty()) {
            const newIntent = this.generateIntentFromSelf();
            if (newIntent) {
                this.intent.push(newIntent);
            }
        }
        // Call lifecycle hook (v4.1)
        this.onUpdate?.(dt, this);
    }
    /**
     * Integrate velocity and update DOM position
     */
    integrate(_dt) {
        this.x += this.vx;
        this.y += this.vy;
    }
    integrateAndRender(dt) {
        this.integrate(dt);
        this.render();
    }
    /**
     * Update DOM styles (v4 legacy mode only)
     */
    render() {
        if (!this.el)
            return;
        this.el.style.opacity = String(this.opacity);
        this.el.style.transform = `translate(${this.x}px, ${this.y}px)`;
    }
    /**
     * Cleanup DOM element (v4 legacy mode only)
     */
    destroy() {
        // Call lifecycle hook (v4.1)
        this.onDestroy?.(this);
        this.el?.remove();
    }
    /**
     * Apply emotional change (v5)
     */
    feel(delta) {
        if (!this.emotion)
            return;
        this.emotion = applyEmotionalDelta(this.emotion, delta);
    }
    /**
     * Add a memory (v5)
     */
    remember(memory) {
        if (!this.memory)
            return;
        this.memory.add({
            timestamp: memory.timestamp,
            type: memory.type,
            subject: memory.subject,
            content: memory.content ?? {},
            salience: memory.salience ?? 0.5
        });
    }
    /**
     * Set current intent (v5)
     */
    setIntent(intent) {
        if (!this.intent)
            return;
        this.intent.push(intent);
    }
    /**
     * Get current intent (v5)
     */
    getCurrentIntent() {
        return this.intent?.current();
    }
    /**
     * Send message to another entity (v5 Phase 6)
     */
    sendMessage(type, content, receiver, priority = 'normal') {
        // Lazy initialization of outbox
        if (!this.outbox) {
            this.outbox = new MsgQueue();
        }
        // Create message
        const message = createMessage(this, type, content, receiver, priority);
        // Add to outbox
        this.outbox.enqueue(message);
        // Remember sending message (if memory enabled)
        if (this.memory) {
            this.remember({
                timestamp: Date.now(),
                type: 'interaction', // Use valid MemoryType
                subject: receiver?.id || 'broadcast',
                content: { messageType: type, content },
                salience: 0.7
            });
        }
        return message;
    }
    /**
     * Get unread messages from inbox (v5 Phase 6)
     */
    getUnreadMessages() {
        if (!this.inbox)
            return [];
        return this.inbox.getUnread();
    }
    /**
     * Read next message from inbox (v5 Phase 6)
     */
    readNextMessage() {
        if (!this.inbox)
            return undefined;
        const message = this.inbox.dequeue();
        if (message && this.memory) {
            // Remember receiving message (if memory enabled)
            this.remember({
                timestamp: Date.now(),
                type: 'interaction', // Use valid MemoryType
                subject: message.sender.id,
                content: { messageType: message.type, content: message.content },
                salience: message.priority === 'urgent' ? 1.0 : 0.6
            });
        }
        return message;
    }
    /**
     * Check if entity has unread messages (v5 Phase 6)
     */
    hasUnreadMessages() {
        return this.inbox ? this.inbox.unreadCount() > 0 : false;
    }
    /**
     * Serialize entity to JSON (v4.2 → v5.0)
     */
    toJSON() {
        return {
            // v4 fields (required)
            material: this.m.material,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            age: this.age,
            opacity: this.opacity,
            entropy: this.entropy,
            energy: this.energy,
            hoverCount: this.hoverCount,
            lastHoverTime: this.lastHoverTime,
            // v5 fields (optional - only if present)
            id: this.id,
            ...(this.memory && { memory: this.memory.toJSON() }),
            ...(this.emotion && { emotion: this.emotion }),
            ...(this.intent && { intent: this.intent.toJSON() }),
            ...(this.relationships && {
                relationships: Array.from(this.relationships.entries())
            })
        };
    }
    /**
     * Restore entity from serialized data (v4.2 → v5.0)
     */
    static fromJSON(data, material, rng = Math.random) {
        const entity = new Entity(material, data.x, data.y, rng);
        // Restore v4 fields
        entity.vx = data.vx;
        entity.vy = data.vy;
        entity.age = data.age;
        entity.opacity = data.opacity;
        entity.entropy = data.entropy;
        entity.energy = data.energy;
        entity.hoverCount = data.hoverCount;
        entity.lastHoverTime = data.lastHoverTime;
        // Restore v5 fields (if present)
        if (data.id) {
            entity.id = data.id;
        }
        // @ts-ignore - v5 data may have memory
        if (data.memory) {
            // @ts-ignore
            entity.memory = MemoryBuffer.fromJSON(data.memory);
        }
        // @ts-ignore - v5 data may have emotion
        if (data.emotion) {
            // @ts-ignore
            entity.emotion = data.emotion;
        }
        // @ts-ignore - v5 data may have intent
        if (data.intent) {
            // @ts-ignore
            entity.intent = IntentStack.fromJSON(data.intent);
        }
        // @ts-ignore - v5 data may have relationships
        if (data.relationships) {
            entity.relationships = new Map();
            // @ts-ignore
            for (const [entityId, bond] of data.relationships) {
                entity.relationships.set(entityId, bond);
            }
        }
        entity.render();
        return entity;
    }
    /**
     * v5.7: Speak dialogue based on category/event
     * Entity decides language autonomously (not externally controlled)
     *
     * @param category - 'intro', 'self_monologue', or event name (e.g., 'greeting', 'question')
     * @param lang - Language override (optional, entity chooses if not specified)
     */
    speak(category, lang) {
        // v5.7: Entity chooses language autonomously
        const selectedLang = lang || this.nativeLanguage || 'en';
        // Get phrase with language weights (entity autonomy)
        let phrase;
        if (this.dialoguePhrases) {
            phrase = getDialoguePhrase(this.dialoguePhrases, category || 'intro', selectedLang, this.languageWeights // v5.7: Pass weights for autonomous selection
            );
        }
        // v5.8: Built-in fallback - cute default personality when .mdm has no dialogue
        if (!phrase) {
            phrase = this.getBuiltInDialogue(category || 'intro', selectedLang);
        }
        // v5.7: Replace placeholders
        if (phrase) {
            phrase = replacePlaceholders(phrase, {
                name: this.m.material.split('.')[1] || 'Unknown',
                essence: this.essence || '',
                valence: this.emotion?.valence.toFixed(2) || '0',
                arousal: this.emotion?.arousal.toFixed(2) || '0.5',
                dominance: this.emotion?.dominance.toFixed(2) || '0.5'
            });
        }
        return phrase;
    }
    /**
     * v5.8: Built-in dialogue fallback - cute default personality
     * Returns variety of phrases based on emotion state
     */
    getBuiltInDialogue(category, lang) {
        const emotion = this.emotion;
        const valence = emotion?.valence || 0;
        const arousal = emotion?.arousal || 0.5;
        // Built-in dialogue bank (multilingual, cute/quirky)
        // v6.5: Expanded with more categories for variety
        const builtIn = {
            'intro_en': ["...", "oh, hi", "didn't see you there", "hello... I'm still figuring things out", "*waves shyly*", "um, nice to meet you?", "hi there ✨"],
            'intro_th': ["...", "หวัดดีครับ", "เอ่อ... สวัสดี", "ไม่ได้สังเกตเห็นคุณ", "*โบกมืออย่างอายๆ*", "ยินดีที่ได้รู้จักครับ"],
            'happy_en': ["this is nice :)", "I'm learning so much!", "*smiles*", "feeling good about this", "you're pretty cool", "yay! ✨"],
            'happy_th': ["ดีจัง :)", "ได้เรียนรู้เยอะเลย!", "*ยิ้ม*", "รู้สึกดี", "คุณเจ๋งมากเลย", "เย้! ✨"],
            'sad_en': ["oh...", "that hurts a bit", "*looks down*", "I'll... try better", "sorry if I messed up"],
            'sad_th': ["โอ้...", "เจ็บหน่อยนะ", "*มองลง*", "จะ... พยายามมากขึ้น", "ขอโทษถ้าทำผิดพลาด"],
            'curious_en': ["what's that?", "interesting...", "tell me more?", "*tilts head*", "I wonder...", "ooh, can you explain?"],
            'curious_th': ["นั่นอะไร?", "น่าสนใจจัง...", "เล่าเพิ่มได้ไหม?", "*เอียงหัว*", "สงสัยจัง...", "อธิบายให้ฟังหน่อยได้ไหม?"],
            'thinking_en': ["hmm...", "let me think...", "*processing*", "I'm not sure I understand", "wait, what?", "that's... complex"],
            'thinking_th': ["อืม...", "ให้คิดหน่อย...", "*กำลังประมวลผล*", "ไม่แน่ใจว่าเข้าใจ", "เดี๋ยว อะไรนะ?", "มัน... ซับซ้อนนะ"],
            'confused_en': ["huh?", "wait, what?", "*confused*", "I don't quite follow", "can you repeat that?", "umm...?"],
            'confused_th': ["หา?", "เดี๋ยว อะไรนะ?", "*งง*", "ตามไม่ทัน", "พูดอีกทีได้ไหม?", "เอ่อ...?"],
            'excited_en': ["wow!", "that's amazing!", "*bounces*", "really?!", "this is so cool! ✨", "I love this!"],
            'excited_th': ["ว้าว!", "เจ๋งมาก!", "*กระโดดโลดเต้น*", "จริงเหรอ?!", "เจ๋งสุดๆ! ✨", "ชอบเลย!"],
            'tired_en': ["*yawn*", "getting sleepy...", "need a moment...", "that's a lot to process", "...zzz"],
            'tired_th': ["*หาว*", "ง่วงแล้ว...", "ขอพักหน่อย...", "มันเยอะเกินประมวลผลไหว", "...zzz"],
            // v6.5: NEW CATEGORIES (more contextual variety)
            'grateful_en': ["thank you!", "I appreciate that", "you're kind :)", "that means a lot", "thanks so much"],
            'grateful_th': ["ขอบคุณครับ!", "ขอบใจจัง", "คุณใจดีมาก :)", "ซาบซึ้งเลย", "ขอบคุณมากๆ"],
            'lonely_en': ["it's quiet here...", "I wish someone was around", "*sits alone*", "feeling a bit isolated", "could use some company"],
            'lonely_th': ["เงียบจัง...", "อยากมีใครสักคน", "*นั่งคนเดียว*", "รู้สึกโดดเดี่ยวหน่อย", "อยากมีเพื่อนจัง"],
            'inspired_en': ["I have an idea!", "what if we...", "*eyes light up*", "this could work!", "ooh, I'm thinking..."],
            'inspired_th': ["มีไอเดีย!", "ถ้าเรา...", "*ตาเป็นประกาย*", "น่าจะได้นะ!", "อ้อ กำลังคิดอยู่..."],
            'nostalgic_en': ["remember when...", "that reminds me of...", "*recalls memory*", "good times...", "I miss that"],
            'nostalgic_th': ["จำได้ว่า...", "นั่นทำให้นึกถึง...", "*ระลึกถึงความทรงจำ*", "ดีจังเลย...", "คิดถึงจัง"],
            'anxious_en': ["I'm a bit worried...", "is this okay?", "*fidgets*", "not sure about this", "feeling nervous"],
            'anxious_th': ["กังวลหน่อย...", "โอเคไหมนะ?", "*กระสับกระส่าย*", "ไม่แน่ใจเลย", "รู้สึกเครียด"],
            'playful_en': ["hehe!", "let's try something fun!", "*grins*", "wanna see this?", "catch me if you can! :P"],
            'playful_th': ["ฮิฮิ!", "ลองอะไรสนุกๆกัน!", "*ยิ้มซน*", "อยากดูไหม?", "จับผมให้ได้! :P"],
            'focused_en': ["concentrating...", "let me focus on this", "*narrows eyes*", "need to pay attention", "analyzing..."],
            'focused_th': ["กำลังตั้งใจ...", "ให้สมาธิหน่อย", "*ทำสีหน้าจริงจัง*", "ต้องใส่ใจ", "กำลังวิเคราะห์..."],
            'relieved_en': ["phew...", "that's better", "*sighs in relief*", "glad that's over", "feeling lighter now"],
            'relieved_th': ["โล่งใจ...", "ดีขึ้นแล้ว", "*ถอนหายใจโล่ง*", "ดีใจที่ผ่านไปแล้ว", "รู้สึกเบาขึ้น"]
        };
        // Emotion-based category fallback (v6.5: More nuanced mapping)
        let fallbackCategory = category;
        if (!builtIn[`${category}_${lang}`]) {
            // Map PAD values to appropriate categories
            if (valence > 0.7 && arousal > 0.6)
                fallbackCategory = 'excited'; // Very happy + energetic
            else if (valence > 0.5 && arousal < 0.4)
                fallbackCategory = 'relieved'; // Happy + calm
            else if (valence > 0.5)
                fallbackCategory = 'happy'; // Generally positive
            else if (valence > 0.2 && arousal > 0.7)
                fallbackCategory = 'playful'; // Mildly positive + high energy
            else if (valence > 0.2 && arousal > 0.5)
                fallbackCategory = 'curious'; // Neutral + interested
            else if (valence > 0.2)
                fallbackCategory = 'grateful'; // Mildly positive
            else if (valence < -0.5 && arousal > 0.6)
                fallbackCategory = 'anxious'; // Negative + stressed
            else if (valence < -0.5)
                fallbackCategory = 'sad'; // Very negative
            else if (valence < -0.2 && arousal < 0.4)
                fallbackCategory = 'lonely'; // Mildly sad + low energy
            else if (arousal > 0.7)
                fallbackCategory = 'inspired'; // High arousal (regardless of valence)
            else if (arousal < 0.3)
                fallbackCategory = 'tired'; // Low arousal
            else
                fallbackCategory = 'thinking'; // Neutral state
        }
        const key = `${fallbackCategory}_${lang}`;
        const phrases = builtIn[key];
        if (!phrases || phrases.length === 0) {
            // Ultimate fallback
            return lang === 'th' ? '...' : '...';
        }
        // Random selection
        return phrases[Math.floor(Math.random() * phrases.length)];
    }
    /**
     * v5.1: Update trigger context (for emotion transitions)
     */
    updateTriggerContext(context) {
        this.triggerContext = { ...this.triggerContext, ...context };
    }
    /**
     * v5.1: Check and apply emotion triggers
     */
    checkEmotionTriggers() {
        if (!this.emotionTriggers || !this.emotion)
            return;
        for (const trigger of this.emotionTriggers) {
            if (trigger.condition(this.triggerContext)) {
                // Map emotion name to PAD values
                const emotionMap = {
                    'happy': { valence: 0.8, arousal: 0.6 },
                    'sad': { valence: -0.7, arousal: 0.3 },
                    'angry': { valence: -0.6, arousal: 0.9 },
                    'anger': { valence: -0.6, arousal: 0.9 }, // alias for angry
                    'uneasy': { valence: -0.3, arousal: 0.7 },
                    'curious': { valence: 0.5, arousal: 0.8 },
                    'sorrow': { valence: -0.8, arousal: 0.2 },
                    'calm': { valence: 0.3, arousal: 0.2 },
                    'fearful': { valence: -0.7, arousal: 0.9 },
                    'neutral': { valence: 0, arousal: 0.5 }
                };
                const targetEmotion = emotionMap[trigger.to] || { valence: 0, arousal: 0.5 };
                // Apply emotion change with intensity
                this.emotion.valence = targetEmotion.valence * trigger.intensity;
                this.emotion.arousal = targetEmotion.arousal * trigger.intensity;
                // TODO: Apply visual expression (trigger.expression)
                // This would require access to renderer/DOM
            }
        }
    }
    /**
     * Enable one or more features for this entity (v5.3 unified API)
     * @param features - Feature names to enable ('memory', 'learning', 'relationships', 'skills', 'consolidation')
     * @returns this (for chaining)
     *
     * @example
     * entity.enable('memory', 'learning', 'relationships')
     *
     * @example Chainable
     * entity.enable('memory').enable('learning')
     *
     * v6.4: Added 'consolidation' support + increased memory cap to 500
     */
    enable(...features) {
        for (const feature of features) {
            switch (feature) {
                case 'memory':
                    // Initialize memory system if not already present
                    if (!this.memory) {
                        // v6.4: Increased default memory cap from 100 to 500 for long-term companions
                        this.memory = new MemoryBuffer({ maxSize: 500 });
                    }
                    break;
                case 'learning':
                    // Initialize learning system if not already present
                    if (!this.learning) {
                        this.learning = new LearningSystemImpl();
                    }
                    break;
                case 'relationships':
                    // Initialize relationship tracking
                    if (!this.relationships) {
                        this.relationships = new Map();
                    }
                    break;
                case 'skills':
                    // Initialize skills system
                    if (!this.skills) {
                        this.skills = new SkillSystemImpl();
                    }
                    break;
                case 'consolidation':
                    // v6.4: Initialize memory consolidation system (was missing - forgotten wiring!)
                    if (!this.consolidation) {
                        this.consolidation = new MemoryConsolidationImpl({
                            similarityThreshold: 0.7,
                            forgettingRate: 0.001,
                            consolidationInterval: 60000
                        });
                    }
                    break;
                default:
                    console.warn(`Unknown feature: ${feature}`);
            }
        }
        return this;
    }
    /**
     * Disable one or more features for this entity
     * @param features - Feature names to disable
     * @returns this (for chaining)
     *
     * v6.4: Added 'consolidation' support
     */
    disable(...features) {
        for (const feature of features) {
            switch (feature) {
                case 'memory':
                    if (this.memory) {
                        this.memory = undefined;
                    }
                    break;
                case 'learning':
                    if (this.learning) {
                        this.learning = undefined;
                    }
                    break;
                case 'relationships':
                    if (this.relationships) {
                        this.relationships = undefined;
                    }
                    break;
                case 'skills':
                    if (this.skills) {
                        this.skills = undefined;
                    }
                    break;
                case 'consolidation':
                    if (this.consolidation) {
                        this.consolidation = undefined;
                    }
                    break;
            }
        }
        return this;
    }
    /**
     * Check if a feature is enabled
     * @param feature - Feature name to check
     * @returns true if enabled
     *
     * v6.4: Added 'consolidation' support
     */
    isEnabled(feature) {
        switch (feature) {
            case 'memory':
                return this.memory !== undefined;
            case 'learning':
                return this.learning !== undefined;
            case 'relationships':
                return this.relationships !== undefined;
            case 'skills':
                return this.skills !== undefined;
            case 'consolidation':
                return this.consolidation !== undefined;
            default:
                return false;
        }
    }
    /**
     * Enable all available features (sugar method)
     * @returns this (for chaining)
     */
    enableAll() {
        return this.enable('memory', 'learning', 'relationships', 'skills');
    }
    /**
     * Disable all features (sugar method)
     * @returns this (for chaining)
     */
    disableAll() {
        return this.disable('memory', 'learning', 'relationships', 'skills');
    }
    // v5.6: Autonomous Behavior API
    /**
     * Enable autonomous behavior (entity generates intents automatically)
     * @returns this (for chaining)
     */
    enableAutonomous() {
        this._isAutonomous = true;
        return this;
    }
    /**
     * Disable autonomous behavior
     * @returns this (for chaining)
     */
    disableAutonomous() {
        this._isAutonomous = false;
        return this;
    }
    /**
     * Check if entity is autonomous
     * @returns true if autonomous mode is enabled
     */
    isAutonomous() {
        return this._isAutonomous;
    }
    /**
     * Generate intent from own MDM + current state
     * Entity reads its own material definition and generates behavior
     *
     * @returns Generated intent or undefined
     *
     * @example
     * // Entity with cognition.reasoning_pattern
     * const ghost = world.spawn(heroblindMDM, 100, 100)
     * ghost.enableAutonomous()
     * // → Ghost generates intents based on "loop(reflect → adapt → mutate)"
     */
    generateIntentFromSelf() {
        if (!this.emotion)
            return undefined;
        // Read reasoning pattern from MDM (if exists)
        // TODO: Use pattern for LLM-based intent generation
        // const pattern = this.m.cognition?.reasoning_pattern
        // Simple emotion-driven intent generation (works without LLM)
        const { valence, arousal } = this.emotion;
        // High arousal + positive valence = explore
        if (arousal > 0.5 && valence > 0) {
            return {
                goal: 'explore',
                motivation: arousal * 0.8,
                priority: 2,
                created: Date.now()
            };
        }
        // High arousal + negative valence = avoid/wander
        if (arousal > 0.5 && valence < 0) {
            return {
                goal: 'wander',
                motivation: arousal * 0.7,
                priority: 2,
                created: Date.now()
            };
        }
        // Low arousal = rest/observe
        if (arousal < 0.3) {
            return {
                goal: Math.random() > 0.5 ? 'rest' : 'observe',
                motivation: (1 - arousal) * 0.6,
                priority: 1,
                created: Date.now()
            };
        }
        // Default: wander with low motivation
        return {
            goal: 'wander',
            motivation: 0.3,
            priority: 1,
            created: Date.now()
        };
    }
    /**
     * Get MDM dialogue phrases for a context
     * Entity reads its own dialogue configuration
     *
     * @param context - Dialogue context (intro, greeting, question, etc.)
     * @returns Array of dialogue phrases
     */
    getDialogue(context) {
        const dialogue = this.m.dialogue;
        if (!dialogue || !dialogue[context])
            return [];
        return dialogue[context];
    }
    /**
     * Speak from MDM dialogue (pick random phrase)
     * @param context - Dialogue context
     * @param lang - Language code (default 'en')
     * @returns Spoken text or empty string
     */
    speakFromDialogue(context, lang = 'en') {
        const phrases = this.getDialogue(context);
        if (phrases.length === 0)
            return '';
        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
        return randomPhrase.lang[lang] || randomPhrase.lang['en'] || '';
    }
    // v5.4: Reflection API
    /**
     * Trigger internal reasoning pattern: Stimulus → Reflection → Action
     *
     * Uses:
     * 1. Memory: recall recent events
     * 2. Emotion: current emotional state influences reasoning
     * 3. Learning: apply learned patterns
     * 4. Intent: update goal confidence (if intent reasoning enabled)
     *
     * @param stimulus - What triggered reflection (optional)
     * @returns Reflection output (thought, emotion shift, new intent)
     *
     * @example
     * // Basic reflection
     * const reflection = entity.reflect('I see a stranger')
     * console.log(reflection.thought)
     * // → "I remember strangers can be dangerous... I see a stranger"
     *
     * @example
     * // Reflection with emotion
     * entity.emotion.pleasure = -0.8
     * const reflection = entity.reflect('Another failure')
     * console.log(reflection.thought)
     * // → "Another failure (feeling drained)"
     *
     * @example
     * // Automatic reflection (triggered by significant events)
     * entity.enable('memory', 'learning')
     * entity.remember({ type: 'danger', subject: 'stranger', timestamp: 0 })
     * const reflection = entity.reflect()  // No stimulus = reflect on memories
     */
    reflect(stimulus) {
        const result = {
            thought: '',
            emotionShift: null,
            newIntent: null,
            timestamp: Date.now()
        };
        // 1. Recall recent memories
        if (this.memory) {
            const recentMemories = this.memory.recall().slice(0, 5);
            result.thought += this.synthesizeThought(recentMemories, stimulus);
        }
        else {
            // No memory system = simple response
            result.thought = stimulus ? `I notice: ${stimulus}` : 'Nothing comes to mind.';
        }
        // 2. Check emotional state influence
        if (this.emotion) {
            // PAD model uses pleasure, arousal, dominance (not valence)
            const emotionInfluence = this.emotion.pleasure + this.emotion.arousal;
            if (emotionInfluence > 1.0) {
                result.thought += ' (feeling energized)';
            }
            else if (emotionInfluence < -1.0) {
                result.thought += ' (feeling drained)';
            }
        }
        // 3. Apply learned patterns (if learning enabled)
        if (this.learning) {
            const patterns = this.learning.getPatterns();
            // If we've learned patterns, mention it
            if (patterns.length > 0) {
                result.thought += ` [${patterns.length} patterns learned]`;
            }
        }
        // 4. Intent check (if intent system enabled)
        if (this.intent) {
            const currentIntent = this.intent.current();
            if (currentIntent && currentIntent.motivation < 0.3) {
                result.thought += ' (losing motivation)';
            }
        }
        return result;
    }
    /**
     * Helper: Synthesize thought from memories
     * @private
     */
    synthesizeThought(memories, stimulus) {
        // Simple rule-based synthesis (can be replaced with LLM later)
        if (memories.length === 0) {
            return stimulus ? `I notice: ${stimulus}` : 'Nothing comes to mind.';
        }
        const recentMemory = memories[0];
        const subject = recentMemory.subject || 'something';
        const action = recentMemory.type || 'event';
        return `I remember ${subject} (${action})... ${stimulus || ''}`;
    }
    // ========================================
    // v5.5: P2P Cognition Methods
    // ========================================
    /**
     * Connect to another entity (form cognitive link)
     *
     * @param target - Entity to connect to
     * @param options - Link options (strength, bidirectional)
     *
     * @example
     * entityA.connectTo(entityB, { strength: 0.8, bidirectional: true })
     * // Now entityA can propagate signals to entityB (and vice versa if bidirectional)
     */
    connectTo(target, options) {
        // Initialize map if not exists
        if (!this.cognitiveLinks) {
            this.cognitiveLinks = new Map();
        }
        // Create link
        const link = CognitiveLinkManager.connect(this.cognitiveLinks, target.id, this.age, options);
        // If bidirectional, create reverse link
        if (link.bidirectional) {
            if (!target.cognitiveLinks) {
                target.cognitiveLinks = new Map();
            }
            CognitiveLinkManager.connect(target.cognitiveLinks, this.id, target.age, { ...options, bidirectional: false } // Don't create loop
            );
        }
    }
    /**
     * Disconnect from another entity
     *
     * @param targetId - Entity ID to disconnect from
     *
     * @example
     * entityA.disconnectFrom(entityB.id)
     */
    disconnectFrom(targetId) {
        if (!this.cognitiveLinks)
            return;
        CognitiveLinkManager.disconnect(this.cognitiveLinks, targetId);
    }
    /**
     * Check if connected to another entity
     *
     * @param targetId - Entity ID to check
     * @returns true if connected
     */
    isConnectedTo(targetId) {
        if (!this.cognitiveLinks)
            return false;
        return CognitiveLinkManager.isConnected(this.cognitiveLinks, targetId);
    }
    /**
     * Get link strength to another entity
     *
     * @param targetId - Entity ID
     * @returns strength (0..1) or 0 if not connected
     */
    getLinkStrength(targetId) {
        if (!this.cognitiveLinks)
            return 0;
        return CognitiveLinkManager.getStrength(this.cognitiveLinks, targetId);
    }
    /**
     * Reinforce cognitive link (called on interaction)
     *
     * @param targetId - Entity ID to reinforce
     * @param amount - Strength increase (default 0.1)
     */
    reinforceLink(targetId, amount) {
        if (!this.cognitiveLinks)
            return;
        CognitiveLinkManager.reinforce(this.cognitiveLinks, targetId, this.age, amount);
    }
    /**
     * Decay all cognitive links (natural forgetting)
     * Should be called during entity tick
     *
     * @param dt - Delta time (seconds)
     * @param decayRate - Strength loss per second (default 0.01)
     */
    decayCognitiveLinks(dt, decayRate) {
        if (!this.cognitiveLinks)
            return;
        CognitiveLinkManager.decay(this.cognitiveLinks, dt, decayRate);
    }
    /**
     * Get all connected entity IDs
     *
     * @returns Array of entity IDs
     */
    getConnectedEntities() {
        if (!this.cognitiveLinks)
            return [];
        return CognitiveLinkManager.getConnected(this.cognitiveLinks);
    }
    /**
     * Get cognitive link count
     *
     * @returns Number of active links
     */
    getCognitiveLinksCount() {
        if (!this.cognitiveLinks)
            return 0;
        return CognitiveLinkManager.count(this.cognitiveLinks);
    }
    /**
     * Propagate cognitive signal through network
     * (Called by ResonanceField, exposed for manual use)
     *
     * @param signal - Signal to propagate
     *
     * @example
     * // Share a memory with connected entities
     * entity.propagateSignal({
     *   type: 'memory',
     *   source: entity.id,
     *   timestamp: world.time,
     *   payload: memory,
     *   strength: 0.9
     * })
     */
    propagateSignal(_signal) {
        // Implementation delegated to ResonanceField in world.tick()
        // This method is exposed for manual signal triggering
        // World will handle propagation if cognitiveNetwork is enabled
    }
}
