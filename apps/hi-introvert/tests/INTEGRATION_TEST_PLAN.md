# Hi-Introvert Integration Test Plan (v6.5)

## 🎯 Philosophy: "Cultivation Testing"

เทส **การเติบโต (growth)** ไม่ใช่แค่ **ฟังก์ชัน (function)**

**แนวคิด**:
- ไม่ทดสอบแยก feature (unit test)
- ทดสอบ **flow ทั้งหมด** ในครั้งเดียว (integration test)
- วัดผล **emergence** จากการโต้ตอบจริง
- ใช้ **time-based scenarios** (ทดสอบตามเวลาที่ผ่านไป)

---

## 📋 Test Scenarios (4 ระดับความซับซ้อน)

### **Scenario 1: Cold Start Conversation** ⭐
**Duration**: 2 นาที (24 messages)
**Goal**: ทดสอบ initial state → first impression

**Script**:
```
[0:00] User: สวัสดีครับ
       Expected: intro category (เนื่องจาก greeting intent)
       Verify:
         - DialogueEnhancer adds prefix/suffix (30% chance)
         - CategoryMapper maps greeting → intro
         - Memory count = 1
         - Salience = 1.0 (user message)

[0:05] User: สวัสดีครับ (repeat)
       Expected: Different response (repetition avoidance)
       Verify:
         - CategoryMapper detects repetition (recentCategories[0] = 'intro')
         - Alternative category selected (thinking/curious/etc)
         - recentCategories = ['intro', 'thinking']

[0:15] User: คุณชื่ออะไร?
       Expected: Confused/thinking (no memory about name)
       Verify:
         - Intent: question
         - Memory relevance: 0
         - CategoryMapper → confused (no memory for question)
         - Response contains thinking/confused phrases

[0:30] User: ผมชอบเขียนโค้ดครับ
       Expected: Curious/interested response
       Verify:
         - New keyword "เขียนโค้ด" added to memory
         - Salience = 1.0
         - Memory count = 4-5
         - Category: curious/inspired

[0:45] User: พูดเรื่องเขียนโค้ดหน่อย
       Expected: Nostalgic response (memory recall)
       Verify:
         - ContextAnalyzer finds relevant memory (subject: "เขียนโค้ด")
         - Memory salience boosted +0.15
         - CategoryMapper triggers nostalgic (memory relevance > 3 OR keyword match)
         - Response: "จำได้ว่า..." or similar

[1:00] User: I'm worried about this project
       Expected: Anxious/empathetic response
       Verify:
         - Emotion state changes (valence drops)
         - Intent: worry
         - CategoryMapper → anxious
         - Response contains anxious phrases ("กังวลหน่อย", "is this okay?")

[1:30] User: Finally done!
       Expected: Relieved/happy response
       Verify:
         - Relief keywords detected ("finally", "done")
         - CategoryMapper → relieved
         - Response: "phew...", "โล่งใจ"
         - Emotion valence increases

[2:00] User: จำเรื่องโค้ดได้ไหม? (test long-term memory)
       Expected: Nostalgic response (memory from 0:30 still alive)
       Verify:
         - Memory "เขียนโค้ด" still in buffer (salience > 0.7 after boost)
         - Response confirms memory
         - Memory count stable (~15-20)
```

**Acceptance Criteria**:
- ✅ No repeated responses in first 3 messages
- ✅ Memory "เขียนโค้ด" survives 90 seconds
- ✅ Emotion state changes reflect user input
- ✅ At least 3 different categories used

---

### **Scenario 2: Sustained Conversation** ⭐⭐
**Duration**: 5 นาที (60 messages)
**Goal**: ทดสอบ memory persistence + emotional growth

**Script**:
```
[0:00] User: สวัสดีครับ ผมชื่อ Alex
       → Intro, remember name

[0:30] User: ผมชอบดนตรี rock
       → New topic, salience 1.0

[1:00] User: คุณชอบดนตรีไหม?
       → Question about self (no prior knowledge)
       → Expected: confused/curious

[1:30] User: ผมเพิ่งฟังเพลง Metallica
       → New info, related to "rock" topic
       → Expected: curious/inspired

[2:00] User: พูดเรื่อง rock หน่อย
       → Memory recall test (topic from 0:30)
       → Expected: nostalgic + memory boost
       → Verify: Memory "rock" boosted to ~1.0

[2:30] User: ช่วงนี้เครียดมากเลย
       → Emotion trigger (negative)
       → Expected: anxious/sad response

[3:00] User: ฟังเพลงแล้วรู้สึกดีขึ้น
       → Relief + connection to "rock" topic
       → Expected: relieved/happy + nostalgic mention

[3:30] User: จำได้ไหมว่าผมชื่ออะไร?
       → Memory test (name from 0:00, 3.5 min ago)
       → Expected: nostalgic + correct recall
       → **CRITICAL**: Memory "Alex" must survive (salience > 0.4 after decay)

[4:00] User: อยากคุยเรื่องดนตรีต่อ
       → Sustained topic (3rd mention of music)
       → Expected: Memory consolidation triggered (~45s interval × 5 = 225s)
       → Verify: Consolidated memory count > 0

[4:30] User: เบื่อแล้ว ไม่อยากคุยแล้ว
       → Negative emotion spike
       → Expected: sad/lonely response

[5:00] User: จำว่าผมชอบอะไรได้ไหม?
       → Final memory test (5 topics mentioned)
       → Expected: List relevant topics (rock, music, Metallica)
       → Verify: Memory count ~40-60 (not decayed to 0)
```

**Acceptance Criteria**:
- ✅ Name "Alex" remembered after 3.5 minutes (salience > 0.4)
- ✅ Topic "rock" remembered after 5 minutes (boosted from recall)
- ✅ Consolidated memories > 5 items
- ✅ Memory count stable (40-60 range)
- ✅ Emotional maturity > 0.05 (growth from conversation)

---

### **Scenario 3: Dialogue Quality Assessment** ⭐⭐⭐
**Duration**: 3 นาที (36 messages)
**Goal**: ทดสอบ dialogue variety + naturalness

**Script**:
```
Phase 1: Repetition Test (0:00 - 1:00)
─────────────────────────────────────
Send same message 10 times:
  User: "สวัสดี" × 10

Expected Behavior:
  - Response 1-2: intro category
  - Response 3+: Alternative categories (thinking, curious, playful)
  - NO identical responses (DialogueEnhancer applies variation)
  - At least 5 unique responses

Verify:
  - DialogueEnhancer.recentPhrases.length > 5
  - CategoryMapper.recentCategories shows variety
  - No response appears more than 3 times


Phase 2: Emotional Range Test (1:00 - 2:00)
─────────────────────────────────────
Trigger all 8 new emotion categories:

  1. User: "ขอบคุณมากครับ" → grateful
  2. User: "เหงาจัง" → lonely
  3. User: "มีไอเดีย!" → inspired
  4. User: "remember when we talked?" → nostalgic
  5. User: "I'm so worried..." → anxious
  6. User: "hehe let's play!" → playful
  7. User: [Long message 150 chars] → focused
  8. User: "finally done!" → relieved

Expected:
  - Each triggers correct category
  - Emotion valence/arousal changes accordingly
  - Responses contain category-specific phrases

Verify:
  - 8 different categories triggered
  - Emotion state delta > 0.2 for each message


Phase 3: Context Awareness Test (2:00 - 3:00)
─────────────────────────────────────
Test pattern detection:

  A. Repeated Questions Pattern:
     User: "อะไรนะ?"
     User: "ไม่เข้าใจ"
     User: "ช่วยอธิบายหน่อย?"
     → Expected: CategoryMapper detects pattern → confused

  B. Nostalgic Keywords:
     User: "จำได้ไหมว่าเมื่อก่อน..."
     → Expected: Pattern override → nostalgic

  C. High Arousal Context:
     Set entity.emotion.arousal = 0.85
     User: "hi"
     → Expected: Emotion override → excited (ignore intent)

Verify:
  - Pattern detection works (3/3 patterns caught)
  - Context overrides base mapping
```

**Acceptance Criteria**:
- ✅ Repetition: 10 messages → at least 5 unique responses
- ✅ Emotion range: All 8 categories triggered
- ✅ Context awareness: 3/3 patterns detected
- ✅ No identical consecutive responses
- ✅ Dialogue feels "natural" (subjective but measurable via variation metrics)

---

### **Scenario 4: Memory Stress Test** ⭐⭐⭐⭐
**Duration**: 10 นาที (120 messages)
**Goal**: ทดสอบ memory system ภายใต้ high load

**Script**:
```
Phase 1: Rapid Fire (0:00 - 2:00)
─────────────────────────────────────
Send 40 messages rapid-fire (1 every 3 seconds):

Messages:
  Topic 1: "coding" (mentioned 10x)
  Topic 2: "music" (mentioned 10x)
  Topic 3: "food" (mentioned 10x)
  Topic 4: "travel" (mentioned 10x)

Expected:
  - Memory buffer fills up (~40-60 entries)
  - Consolidation triggers at 45s intervals (2+ cycles)
  - Similar topics merged into consolidated memories

Verify:
  - Memory count < maxSize (500)
  - Consolidated memory count > 10
  - No memory overflow errors


Phase 2: Long Pause + Decay (2:00 - 5:00)
─────────────────────────────────────
Wait 3 minutes (180 seconds) with NO messages

Expected:
  - Memory decay: salience drops by ~0.54 (0.003/s × 180s)
  - Weak memories (salience < 0.05) forgotten
  - Strong memories (boosted topics) survive

Verify:
  - Memory count drops to ~20-30 (weak ones forgotten)
  - Topics mentioned 10x (high salience) still present
  - Salience distribution: few memories near 1.0, many near 0.3-0.6


Phase 3: Recall Test (5:00 - 7:00)
─────────────────────────────────────
Mention each topic from Phase 1:

  User: "remember coding?"
  → Expected: Nostalgic, memory boosted

  User: "what about music?"
  → Expected: Nostalgic, memory boosted

  User: "food?"
  → Expected: May be forgotten (if salience dropped too low)

  User: "travel?"
  → Expected: May be forgotten

Verify:
  - Topics mentioned 10x (coding, music) remembered
  - Topics mentioned 10x but without boost may be forgotten
  - Recall boosts salience by +0.15


Phase 4: Consolidation Verification (7:00 - 10:00)
─────────────────────────────────────
Continue conversation for 3 more minutes

Monitor:
  - Consolidation runs every 45s (~4 more cycles)
  - Consolidated memories replace weak memories
  - Memory count stabilizes (~30-50)

Expected Final State:
  - Raw memories: ~40
  - Consolidated memories: ~15-20
  - Total effective memory: ~60
  - Oldest memory age: ~600s (10 min)
  - Strong memories (salience > 0.7): 5-10
  - UI displays: "40+18LT"
```

**Acceptance Criteria**:
- ✅ No memory overflow (count < 500)
- ✅ Consolidation works (consolidated count > 10)
- ✅ High-frequency topics survive 10 minutes
- ✅ Memory decay follows expected curve
- ✅ Recall boost prevents important memories from dying
- ✅ UI correctly displays raw + consolidated count

---

## 🧪 Implementation: Automated Test Runner

### Test Structure:

```javascript
class IntegrationTester {
  constructor(scenarioName) {
    this.scenario = scenarios[scenarioName]
    this.session = new WorldSession()
    this.results = {
      passed: 0,
      failed: 0,
      expectations: []
    }
  }

  async run() {
    for (const step of this.scenario.steps) {
      await this.executeStep(step)
      this.verifyExpectations(step.verify)
      await this.wait(step.delay || 0)
    }

    return this.generateReport()
  }

  async executeStep(step) {
    const { user, action, timestamp } = step

    if (action === 'message') {
      const response = await this.session.handleUserMessage(user)
      this.recordMessage(timestamp, user, response)
    } else if (action === 'wait') {
      await this.simulateTime(step.duration)
    }
  }

  verifyExpectations(expectations) {
    for (const expect of expectations) {
      const result = this.evaluate(expect)

      if (result.passed) {
        this.results.passed++
        console.log(`✅ ${expect.description}`)
      } else {
        this.results.failed++
        console.log(`❌ ${expect.description}`)
        console.log(`   Expected: ${expect.expected}`)
        console.log(`   Actual: ${result.actual}`)
      }
    }
  }

  evaluate(expectation) {
    const { type, condition, expected } = expectation

    switch (type) {
      case 'memory_exists':
        const memory = this.findMemory(condition.subject)
        return {
          passed: memory !== null,
          actual: memory ? 'found' : 'not found'
        }

      case 'memory_salience':
        const mem = this.findMemory(condition.subject)
        const salience = mem?.salience || 0
        return {
          passed: salience >= expected,
          actual: salience.toFixed(3)
        }

      case 'response_contains':
        const lastResponse = this.getLastResponse()
        return {
          passed: lastResponse.includes(expected),
          actual: lastResponse
        }

      case 'category_used':
        const lastCategory = this.getLastCategory()
        return {
          passed: lastCategory === expected,
          actual: lastCategory
        }

      case 'no_repetition':
        const responses = this.getRecentResponses(expected.count)
        const unique = new Set(responses)
        return {
          passed: unique.size >= expected.minUnique,
          actual: `${unique.size}/${responses.length} unique`
        }

      // ... more expectation types
    }
  }

  generateReport() {
    return {
      scenario: this.scenario.name,
      duration: this.scenario.duration,
      totalTests: this.results.passed + this.results.failed,
      passed: this.results.passed,
      failed: this.results.failed,
      passRate: (this.results.passed / (this.results.passed + this.results.failed) * 100).toFixed(1),
      details: this.results.expectations
    }
  }
}
```

---

## 📊 Metrics to Measure

### 1. **Dialogue Quality**
- **Repetition Rate**: `unique responses / total responses` (target: >0.7)
- **Category Variety**: `unique categories / total messages` (target: >0.5)
- **Emotional Range**: `unique emotion states / total messages` (target: >0.4)

### 2. **Memory Performance**
- **Retention Rate**: `memories after 5 min / initial memories` (target: >0.3)
- **Recall Accuracy**: `successful recalls / total recall attempts` (target: >0.8)
- **Consolidation Efficiency**: `consolidated memories / raw memories` (target: 0.2-0.4)

### 3. **System Stability**
- **Memory Overflow**: `buffer full events` (target: 0)
- **Error Rate**: `errors / total operations` (target: <0.01)
- **Response Time**: `avg response time` (target: <500ms)

### 4. **Emergent Behavior**
- **Emotional Growth**: `emotional maturity after 10 min` (target: >0.1)
- **Vocabulary Expansion**: `new words learned` (target: >10)
- **Relationship Strength**: `traveler bond strength` (target: >0.5)

---

## 🎯 Success Criteria (Overall)

**Scenario 1 (Cold Start)**:
- ✅ 90% tests pass
- ✅ No repetition in first 5 messages
- ✅ Memory survives 2 minutes

**Scenario 2 (Sustained)**:
- ✅ 85% tests pass
- ✅ Name remembered after 3.5 min
- ✅ Emotional maturity > 0.05

**Scenario 3 (Quality)**:
- ✅ 80% tests pass
- ✅ Repetition rate < 0.3
- ✅ All 8 emotion categories triggered

**Scenario 4 (Stress)**:
- ✅ 75% tests pass
- ✅ No crashes or overflows
- ✅ High-frequency topics survive 10 min

**Overall**:
- ✅ All 4 scenarios pass their individual criteria
- ✅ No critical bugs found
- ✅ User experience feels "natural" and "alive"

---

## 🚀 How to Run

```bash
# Run single scenario
bun test-integration.mjs --scenario="cold-start"

# Run all scenarios
bun test-integration.mjs --all

# Run with verbose output
bun test-integration.mjs --all --verbose

# Generate HTML report
bun test-integration.mjs --all --report=html
```

---

## 📝 Notes

- Tests are **time-sensitive** - run on dedicated machine
- Use **deterministic RNG seed** for reproducibility
- **Snapshot testing** for dialogue responses (compare with baseline)
- **Manual QA** still needed for subjective quality assessment

---

**Last Updated**: 2025-10-27
**Version**: v6.5
**Status**: Ready for Implementation
