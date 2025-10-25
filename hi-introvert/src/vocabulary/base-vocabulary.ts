/**
 * Hi-Introvert: Base Vocabulary for 12-year-old (Thai + English)
 *
 * Design principles:
 * - ~200 words covering real-world basics
 * - Age-appropriate (elementary → early middle school)
 * - Both languages equally represented
 * - Categories: daily life, emotions, school, family, hobbies
 */

/**
 * Base vocabulary (Thai + English, ~200 words)
 * Pattern analysis:
 * - Thai: informal, พื้นฐาน, คำที่เด็กใช้บ่อย
 * - English: simple, common, everyday words
 */
export const BASE_VOCABULARY: string[] = [
  // Greetings & basics (10)
  'สวัสดี', 'หวัดดี', 'ครับ', 'ค่ะ', 'ขอบคุณ',
  'hi', 'hello', 'bye', 'thanks', 'please',

  // Pronouns & people (15)
  'ผม', 'ฉัน', 'คุณ', 'เขา', 'เธอ', 'เรา', 'พวกเรา',
  'I', 'me', 'you', 'he', 'she', 'we', 'they', 'someone',

  // Family (10)
  'แม่', 'พ่อ', 'พี่', 'น้อง', 'ครอบครัว',
  'mom', 'dad', 'brother', 'sister', 'family',

  // Common verbs (20)
  'เป็น', 'มี', 'ไป', 'มา', 'ทำ', 'เล่น', 'กิน', 'ดู', 'อ่าน', 'เขียน',
  'is', 'have', 'go', 'come', 'do', 'play', 'eat', 'see', 'read', 'write',

  // Thinking verbs (10)
  'คิด', 'รู้', 'เข้าใจ', 'จำ', 'ลืม',
  'think', 'know', 'understand', 'remember', 'forget',

  // Emotions (15)
  'ดี', 'สบาย', 'สนุก', 'เบื่อ', 'เศร้า', 'โกรธ', 'กลัว', 'ตื่นเต้น',
  'happy', 'sad', 'angry', 'scared', 'excited', 'bored', 'tired',

  // School (15)
  'โรงเรียน', 'เรียน', 'ครู', 'เพื่อน', 'หนังสือ', 'การบ้าน', 'สอบ',
  'school', 'study', 'teacher', 'friend', 'book', 'homework', 'test', 'class',

  // Numbers (10)
  'หนึ่ง', 'สอง', 'สาม', 'มาก', 'น้อย',
  'one', 'two', 'three', 'many', 'few',

  // Time (10)
  'วัน', 'เวลา', 'ตอน', 'เมื่อไหร่', 'ตอนนี้',
  'day', 'time', 'when', 'now', 'today',

  // Places (10)
  'บ้าน', 'ที่', 'ไหน', 'นี่', 'โน่น',
  'home', 'place', 'where', 'here', 'there',

  // Food (12)
  'อาหาร', 'ข้าว', 'น้ำ', 'ผลไม้', 'ขนม', 'อร่อย',
  'food', 'rice', 'water', 'fruit', 'snack', 'delicious',

  // Animals (10)
  'สัตว์', 'หมา', 'แมว', 'นก', 'ปลา',
  'animal', 'dog', 'cat', 'bird', 'fish',

  // Colors (8)
  'สี', 'แดง', 'น้ำเงิน', 'เขียว',
  'color', 'red', 'blue', 'green',

  // Size & quantity (8)
  'ใหญ่', 'เล็ก', 'ยาว', 'สั้น',
  'big', 'small', 'long', 'short',

  // Questions (10)
  'อะไร', 'ทำไม', 'ยังไง', 'เท่าไหร่', 'ใคร',
  'what', 'why', 'how', 'who', 'which',

  // Connectors (10)
  'แต่', 'เพราะ', 'ถ้า', 'แล้ว', 'ก็',
  'but', 'because', 'if', 'then', 'so',

  // Common adjectives (10)
  'ดี', 'เก่ง', 'สวย', 'เท่', 'เจ็บ',
  'good', 'cool', 'nice', 'bad', 'hurt',

  // Hobbies & activities (12)
  'เกม', 'หนัง', 'เพลง', 'วาด', 'ฟัง', 'ดู',
  'game', 'movie', 'music', 'draw', 'listen', 'watch',

  // Technology (8)
  'คอม', 'โทรศัพท์', 'อินเทอร์เน็ต', 'เกม',
  'computer', 'phone', 'internet', 'app',

  // Filler words & particles (15)
  'เอ่อ', 'อืม', 'งง', 'อ๋อ', 'เออ', 'นะ', 'ไหม', 'ละ', 'ครับ', 'มาก',
  'um', 'uh', 'hmm', 'oh', 'well',

  // Common expressions (10)
  'ไม่เป็นไร', 'จริงเหรอ', 'เท่ห์', 'เจ๋ง', 'ได้เลย',
  'okay', 'really', 'sure', 'maybe', 'fine',

  // ========================================
  // EXPANDED VOCABULARY (v1.1.0) +300 words
  // ========================================

  // Daily routines (20)
  'ตื่น', 'นอน', 'อาบน้ำ', 'แปรงฟัน', 'ทำงาน', 'พัก', 'ออกกำลัง', 'เดิน', 'วิ่ง', 'นั่ง',
  'wake', 'sleep', 'shower', 'brush', 'work', 'rest', 'exercise', 'walk', 'run', 'sit',

  // Feelings (expanded) (30)
  'เหงา', 'สับสน', 'กังวล', 'สงบ', 'ภูมิใจ', 'อาย', 'โกรธ', 'หงุดหงิด', 'เครียด', 'ผ่อนคลาย', 'ตื่นเต้น', 'ประหลาดใจ', 'เบื่อหน่าย', 'สนใจ', 'รู้สึก',
  'lonely', 'confused', 'anxious', 'calm', 'proud', 'shy', 'frustrated', 'stressed', 'relaxed', 'surprised', 'bored', 'interested', 'nervous', 'confident', 'feel',

  // Weather (15)
  'ฝน', 'แดด', 'เมฆ', 'ร้อน', 'หนาว', 'อบอุ่น', 'เย็น', 'ชื้น',
  'rain', 'sun', 'cloud', 'hot', 'cold', 'warm', 'cool',

  // Social (20)
  'พูด', 'คุย', 'ฟัง', 'ถาม', 'ตอบ', 'เล่า', 'บอก', 'พูดคุย', 'ส่งข้อความ', 'โทร',
  'talk', 'chat', 'listen', 'ask', 'answer', 'tell', 'speak', 'message', 'call', 'reply',

  // Abstract concepts (25)
  'ฝัน', 'หวัง', 'กลัว', 'ความจริง', 'โกหก', 'ปัญหา', 'แก้ปัญหา', 'คำถาม', 'คำตอบ', 'ความคิด', 'ไอเดีย', 'ความรู้สึก', 'อารมณ์',
  'dream', 'hope', 'fear', 'truth', 'lie', 'problem', 'solution', 'question', 'answer', 'idea', 'feeling', 'emotion',

  // Body parts (15)
  'หัว', 'มือ', 'ตา', 'หู', 'ปาก', 'จมูก', 'ขา', 'เท้า',
  'head', 'hand', 'eye', 'ear', 'mouth', 'nose', 'foot',

  // Nature (15)
  'ต้นไม้', 'ดอกไม้', 'ฟ้า', 'ทะเล', 'ภูเขา', 'แม่น้ำ', 'ธรรมชาติ',
  'tree', 'flower', 'sky', 'sea', 'mountain', 'river', 'nature', 'star',

  // Tech (expanded) (20)
  'แชท', 'พิมพ์', 'คลิก', 'ดาวน์โหลด', 'อัปโหลด', 'วายฟาย', 'อีเมล', 'โพสต์', 'แชร์', 'เซฟ',
  'chat', 'type', 'click', 'download', 'upload', 'wifi', 'email', 'post', 'share', 'save',

  // Connectors (expanded) (15)
  'ด้วย', 'หรือ', 'และ', 'อย่างไรก็ตาม', 'แม้ว่า', 'ดังนั้น', 'เพราะฉะนั้น',
  'also', 'or', 'and', 'however', 'although', 'therefore', 'thus', 'besides',

  // Intensifiers (15)
  'มาก', 'จริงๆ', 'ค่อนข้าง', 'เกือบ', 'เต็มที่', 'จัง', 'สุดๆ',
  'very', 'really', 'quite', 'totally', 'actually', 'almost', 'fully', 'extremely',

  // More verbs (30)
  'อยาก', 'ต้องการ', 'ชอบ', 'รัก', 'เกลียด', 'หวัง', 'ปรารถนา', 'เชื่อ', 'รู้สึก', 'ดู', 'มอง', 'ได้ยิน', 'สัมผัส', 'พบ', 'เจอ',
  'want', 'need', 'like', 'love', 'hate', 'hope', 'wish', 'believe', 'see', 'look', 'hear', 'touch', 'meet', 'find', 'lose',

  // More adjectives (30)
  'แปลก', 'เพื่อน', 'ปกติ', 'พิเศษ', 'ต่าง', 'เหมือนกัน', 'ง่าย', 'ยาก', 'สำคัญ', 'ธรรมดา', 'น่าสนใจ', 'น่าเบื่อ', 'สนุกสนาน', 'น่ากลัว', 'ปลอดภัย',
  'strange', 'weird', 'normal', 'special', 'different', 'same', 'easy', 'hard', 'important', 'simple', 'interesting', 'boring', 'fun', 'scary', 'safe',

  // More nouns (30)
  'สิ่งของ', 'ของ', 'ปัญหา', 'วิธี', 'คำถาม', 'ความรู้', 'ประสบการณ์', 'เวลา', 'โอกาส', 'ความเป็นจริง', 'เหตุผล', 'สาเหตุ', 'ผลลัพธ์', 'ส่วน', 'ทาง',
  'thing', 'stuff', 'problem', 'way', 'question', 'knowledge', 'experience', 'chance', 'reality', 'reason', 'cause', 'result', 'part', 'path', 'moment',

  // Slang/informal (20)
  'เท่', 'แจ่ม', 'แย่', 'โอเค', 'ช่างเถอะ', 'ไม่รู้', 'ก็ได้', 'เออ', 'อ้าว', 'เฮ้ย',
  'cool', 'awesome', 'lame', 'whatever', 'dude', 'nah', 'yep', 'dunno', 'kinda', 'sorta'
]

/**
 * Vocabulary categories (for tracking growth)
 */
export const VOCABULARY_CATEGORIES = {
  greetings: ['สวัสดี', 'หวัดดี', 'hi', 'hello', 'bye'],
  emotions: ['ดี', 'สบาย', 'สนุก', 'เบื่อ', 'เศร้า', 'โกรธ', 'happy', 'sad', 'angry'],
  family: ['แม่', 'พ่อ', 'พี่', 'น้อง', 'mom', 'dad', 'brother', 'sister'],
  school: ['โรงเรียน', 'เรียน', 'ครู', 'เพื่อน', 'school', 'study', 'teacher', 'friend'],
  hobbies: ['เกม', 'หนัง', 'เพลง', 'game', 'movie', 'music'],
  food: ['อาหาร', 'ข้าว', 'น้ำ', 'food', 'rice', 'water'],
  animals: ['สัตว์', 'หมา', 'แมว', 'animal', 'dog', 'cat']
} as const

/**
 * Language-specific patterns
 */
export const LANGUAGE_PATTERNS = {
  thai: {
    // คำเชื่อม
    connectors: ['แต่', 'เพราะ', 'ถ้า', 'แล้ว', 'ก็', 'เลย', 'ว่า', 'กับ'],
    // คำช่วย
    particles: ['นะ', 'ไหม', 'ละ', 'ครับ', 'ค่ะ', 'จ้า', 'อะ'],
    // คำอุทาน
    fillers: ['เอ่อ', 'อืม', 'งง', 'อ๋อ', 'เออ', 'เหรอ', 'จริง'],
    // การผสมคำ (lengthening for emphasis)
    emphasis: ['มากกก', 'งงงง', 'เบื่อออ', 'สนุกกก']
  },
  english: {
    // Connectors
    connectors: ['but', 'because', 'if', 'then', 'so', 'and', 'or'],
    // Particles
    particles: ['yeah', 'nah', 'like', 'just', 'really'],
    // Fillers
    fillers: ['um', 'uh', 'hmm', 'oh', 'well', 'okay'],
    // Emphasis (repetition)
    emphasis: ['sooo', 'veryyy', 'reallyy']
  }
} as const

/**
 * Get vocabulary size (for display)
 */
export function getBaseVocabularySize(): number {
  return BASE_VOCABULARY.length
}

/**
 * Check if word exists in base vocabulary
 */
export function isInBaseVocabulary(word: string): boolean {
  const normalized = word.toLowerCase().trim()
  return BASE_VOCABULARY.some(w => w.toLowerCase() === normalized)
}

/**
 * Get vocabulary by category
 */
export function getVocabularyByCategory(category: keyof typeof VOCABULARY_CATEGORIES): string[] {
  return VOCABULARY_CATEGORIES[category] || []
}
