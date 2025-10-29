# Human-like Memory Analysis Report

**Date:** 2025-10-27
**Test:** Scenario 2 - Name Memory & Human-like Recall
**Result:** FAILED (52.4% pass rate, target: 60%)

---

## 🎯 Executive Summary

**Finding:** hi-introvert's memory system **functions correctly** but lacks **emergent response generation**. The companion remembers names but cannot express that knowledge in dialogue.

**Root Cause:**
- Memory storage: ✅ Working (recalls "Wutty", "Alex", "Bob", "Charlie")
- Memory recall: ✅ Working (relevantMemories found correctly)
- **Response generation: ❌ NOT emergent** (hardcoded dialogue only, no interpolation)

---

## 📊 Test Results Breakdown

### Pass Rate: 52.4% (11/21 tests)

**✅ Passed (11 tests):**
- Memory count increases correctly
- Memory recall triggers (`relevantMemories >= 1`)
- System stores user messages with correct structure

**❌ Failed (10 tests):**
- **Salience incorrect:** Expected 1.0, got 0.40 (system-wide bug)
- **Names not stored as subjects:** "Wutty", "Alex", "Bob" not found in `memory.subject`
- **3 Critical failures:** Response doesn't contain "Wutty" when asked

---

## 🧠 Memory Inspection (Final State)

```
Memory Count: 100 (maxed out ring buffer)
Consolidated: 0 (no consolidation occurred)
Relationship Strength: 0.00 (no relationship formed - bug?)

Top 5 Memories by Salience:
  [1.00] traveler: {"message":"คุณยังจำได้ไหมว่าผมชื่ออะไร?","intent":"question"}
  [0.94] 9f0f0b1e...: {"distance":4.30...}  ← Entity proximity memory
  [0.94] traveler: {"message":"พูดเรื่อง Wutty หน่อยครับ","intent":"statement"}
  [0.93] 9f0f0b1e...: {"distance":5.00...}
  [0.93] 9f0f0b1e...: {"distance":5.82...}
```

### Key Observations:

1. **Names stored in `content`, not `subject`:**
   - Memory structure: `{ subject: "traveler", content: { message: "ผมชื่อ Wutty นะครับ" }}`
   - **Problem:** Name "Wutty" is buried in message string, not extracted as a semantic unit

2. **ContextAnalyzer finds relevant memories:**
   - `relevantMemories >= 1` ✅ (test passed)
   - System DOES recall memories when user asks "คุณจำได้ไหม"
   - **But**: Response doesn't use this information

3. **No name extraction pipeline:**
   - User says: "ผมชื่อ Wutty"
   - System stores: whole message as blob
   - Should store: `{ subject: "Wutty", type: "name", content: { owner: "traveler" }}`

---

## 🔍 Root Cause Analysis

### Issue 1: Salience Bug (System-wide)

**Expected:** User messages salience = 1.0 (line 873 in [WorldSession.ts](../src/session/WorldSession.ts:873))
**Actual:** Salience = 0.40

**Investigation needed:**
- Check if `World.tick()` is running during test (decay happening?)
- Check if memory consolidation is interfering
- Verify handleUserMessage() flow

**Impact:** Medium (memory decays faster than expected)

---

### Issue 2: No Name Extraction (NER Missing)

**Current flow:**
```
User: "ผมชื่อ Wutty"
  ↓
handleUserMessage()
  ↓
remember({ subject: "traveler", content: { message: "ผมชื่อ Wutty นะครับ" }})
  ↓
[Name "Wutty" is in content string, not semantic]
```

**Needed flow:**
```
User: "ผมชื่อ Wutty"
  ↓
NameExtractor.extract(message)  ← NEW
  ↓
remember({ subject: "Wutty", type: "name", owner: "traveler", salience: 1.0 })
  ↓
[Name "Wutty" is now a first-class memory subject]
```

**Impact:** Critical (can't recall names properly)

---

### Issue 3: No Memory Interpolation in Dialogue

**Current response generation:**
```typescript
// WorldSession.getEntityResponse() - line 981-1080
const category = categoryMapper.map(...)  // "nostalgic", "confused", etc.
response = entity.speak(category)  // ← Hardcoded dialogue from MDM
```

**Problem:** `speak()` returns fixed phrases:
- `"อืม..."` (thinking)
- `"*งง*"` (confused)
- `"ไม่แน่ใจว่าเข้าใจ"` (unsure)

**No mechanism to inject memory content into response.**

---

### Issue 4: No Emergent Response Generation

**Test expectation:**
```
User: คุณจำได้ไหมว่าผมชื่ออะไร?
Expected: "จำได้! คุณชื่อ Wutty"
Actual: "*งง*"
```

**Why it fails:**
1. CategoryMapper selects `"confused"` category (memory relevance detected)
2. `entity.speak("confused")` returns `"*งง*"` from MDM file
3. **No fallback to use `context.relevantMemories`**

**Missing logic:**
```typescript
// After line 1014 in WorldSession.getEntityResponse()
if (context.relevantMemories.length > 0 && category === 'confused') {
  // Extract name from memory
  const nameMemory = context.relevantMemories.find(m =>
    m.content.message?.includes('ชื่อ')
  )

  if (nameMemory) {
    // Extract name (simple regex)
    const match = nameMemory.content.message.match(/ชื่อ\s+(\w+)/)
    if (match) {
      response = `จำได้! คุณชื่อ ${match[1]}`  ← EMERGENT!
    }
  }
}
```

**Impact:** Critical (main test objective failed)

---

## 🆚 Current vs Human-like Memory Comparison

| Behavior | Current State | Human-like Target | Gap |
|----------|--------------|-------------------|-----|
| **Store names** | ❌ Stores as message blob | ✅ Extract as semantic unit | Critical |
| **Recall names** | ⚠️ Found in relevantMemories but not used | ✅ Inject into response | Critical |
| **Multiple names** | ❌ No capacity limit (stores all) | ✅ 7±2 item limit | Medium |
| **Fuzzy recall** | ❌ All-or-nothing | ✅ "W อะไรสักอย่าง?" when salience < 0.5 | Medium |
| **False memory** | ❌ Perfect recall | ✅ Mix up similar names | Low |
| **Associative recall** | ❌ No association | ✅ "Wutty... Metallica ที่คุณบอก?" | Medium |
| **Episodic reconstruction** | ❌ No timeline | ✅ "ก่อนหน้านี้เราคุยเรื่อง..." | Low |
| **Memory consolidation** | ❌ Not triggering (0 consolidated) | ✅ Merge similar memories | Low |
| **Relationship growth** | ❌ Strength = 0.00 (bug?) | ✅ Increases with interaction | Medium |

---

## 🚨 Critical Issues Ranked by Priority

### 1. **No Name Extraction (P0 - Blocker)**
**Impact:** Can't demonstrate human-like name memory
**Fix:** Create `NameExtractor` utility:
```typescript
class NameExtractor {
  extract(message: string): string[] {
    // Patterns: "ผมชื่อ X", "my name is X", "เพื่อนผมชื่อ X"
    const patterns = [
      /ชื่อ\s+(\w+)/g,
      /name\s+is\s+(\w+)/gi,
      /call\s+me\s+(\w+)/gi
    ]
    // Return: ["Wutty", "Alex"]
  }
}
```

### 2. **No Memory Interpolation (P0 - Blocker)**
**Impact:** Response can't use recalled information
**Fix:** Add interpolation layer:
```typescript
// After getEntityResponse() line 1014
if (response && context.relevantMemories.length > 0) {
  response = interpolateMemories(response, context.relevantMemories)
}

function interpolateMemories(response: string, memories: Memory[]): string {
  // Replace {{subject}} with memory.subject
  // Replace {{content.X}} with memory.content.X
  // Support: "จำได้! {{subject}}" → "จำได้! Wutty"
}
```

### 3. **Salience Bug (P1 - High)**
**Impact:** Memory decays too fast (0.40 instead of 1.0)
**Investigation:** Check World.tick() interference

### 4. **Relationship Strength = 0.00 (P1 - High)**
**Impact:** Emotional maturity calculation broken
**Investigation:** Check relationship formation logic

### 5. **No Memory Consolidation (P2 - Medium)**
**Impact:** Ring buffer overflows, old memories lost
**Fix:** Ensure consolidation triggers (currently 0 consolidated)

---

## 💡 Recommendations

### Phase A: Immediate Fixes (Enable Emergent Name Recall)

**Goal:** Make test pass (> 60%)

1. **Create `NameExtractor` utility** (30 min)
   - Extract names from user messages
   - Store as semantic memory: `{ subject: "Wutty", type: "name" }`

2. **Add memory interpolation** (20 min)
   - Create `interpolateMemories()` function
   - Support `{{subject}}`, `{{content.X}}` placeholders
   - Add dialogue category: `"remembered": "จำได้! {{subject}}"`

3. **Fix salience bug** (20 min)
   - Investigate why user message salience = 0.40
   - Ensure decay doesn't happen during single test message

4. **Add emergent name recall logic** (30 min)
   ```typescript
   if (intent === 'question' && keywords.includes('ชื่อ')) {
     const nameMemories = memories.filter(m => m.type === 'name')
     if (nameMemories.length > 0) {
       response = `จำได้! คุณชื่อ ${nameMemories[0].subject}`
     }
   }
   ```

**Expected result:** Test pass rate 70-80%

---

### Phase B: Human-like Enhancements (Optional)

**Goal:** Realistic memory behavior

1. **Fuzzy recall** (salience-based confidence)
   ```typescript
   if (salience > 0.8) return `จำได้! ${name}`
   if (salience > 0.4) return `เอ่อ... ${name[0]} อะไรสักอย่าง?`
   return `จำไม่ค่อยได้แล้ว...`
   ```

2. **Capacity limits** (7±2 rule)
   ```typescript
   const recallableNames = nameMemories
     .filter(m => m.salience > 0.5)
     .slice(0, 7)  // Human short-term limit
   ```

3. **Associative recall** (temporal clustering)
   ```typescript
   const associatedMemories = memories.filter(m =>
     Math.abs(m.timestamp - primaryMemory.timestamp) < 60000
   )
   ```

4. **False memory** (confusion simulation)
   ```typescript
   if (nameMemories.length > 5 && Math.random() < 0.2) {
     // Mix up similar names
     return `Alex... หรือ Alice นะ? 🤔`
   }
   ```

**Expected result:** Test pass rate 85-90%, realistic behavior

---

## 📈 Next Steps

**Approved plan:**
1. ✅ Create test (completed)
2. ✅ Run test (completed)
3. ✅ Write analysis report (completed)
4. ⏸️ **Design Phase 3** (detailed implementation plan)
5. ⏸️ **Implement Phase A** (if user approves)

**User decision needed:**
- Proceed with Phase A (immediate fixes)?
- Focus on specific areas?
- Prioritize different issues?

---

**Report generated:** 2025-10-27
**Test file:** [test-integration-scenario2-name-memory.mjs](./test-integration-scenario2-name-memory.mjs)
**Full test output:** See test results above
