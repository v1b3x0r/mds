# Hi-Introvert v2.0 Refactor Status

**Goal**: Extract generic MDSRuntime from WorldSession, make hi-introvert a clean application layer

**Progress**: ~15% complete (3/11 hours)

---

## ✅ Completed

### WorldMind Integration (v6.7)
- Added WorldMind analytics to conversation pipeline
- Pattern detection after each conversation
- Collective emotion calculation
- Test passed: synchronization (1.00), stillness (1.00), 7 memories

### MDSRuntime Foundation
- Created `src/runtime/MDSRuntime.ts` (~350 lines)
  - Generic orchestrator (zero domain logic)
  - Entity lifecycle (spawn, tick)
  - Built-in sensors (OS, network, weather) - disable-able
  - Analytics emission (WorldMind + growth)
  - Persistence (save/load .world.mdm)
- Moved `OSSensor.ts` → `src/runtime/sensors/`
- Added `mapToContext()` method to OSSensor

---

## 🚧 In Progress

### Phase 1: Complete MDSRuntime (~2h remaining)
**Next steps:**
1. Create `NetworkSensor.ts` (extract from ExtendedSensors)
   - File: `src/runtime/sensors/NetworkSensor.ts`
   - Pattern: Similar to OSSensor
   - Methods: `getMetrics()`, `mapToContext()`
   - Context keys: `network.latency`, `network.connected`, `network.bandwidth`

2. Create `WeatherSensor.ts` wrapper
   - File: `src/runtime/sensors/WeatherSensor.ts`
   - Wraps MDS Weather system
   - Methods: `getContext()`
   - Context keys: `weather.rain`, `weather.rainIntensity`, `weather.wind.*`

3. Test MDSRuntime
   - Spawn 2 entities
   - Verify tick loop
   - Verify analytics emission
   - Verify context broadcast

---

## 📋 TODO

### Phase 2: ChatRuntime (~2h)
- [ ] Create `src/apps/hi-introvert/ChatRuntime.ts`
  - Extends MDSRuntime
  - Load companions via CompanionLoader (existing)
  - `sendMessage(text: string)` method
- [ ] Extract conversation handler from WorldSession
  - MDM dialogue → LLM fallback logic
  - Memory recording (interaction memories)
  - Name extraction (v6.6 feature)
- [ ] Add field spawning logic
  - `spawnSyncMoment()` - emotional alignment (WorldSession:1875-1940)
  - `spawnLongingField()` - missing entity (WorldSession:1979-2015)
  - Include trust + memory sync (CRDT)

### Phase 3: BlessedCLI (~4h)
- [ ] Split into panels
  - `ChatPanel.ts` - conversation display
  - `AnalyticsPanel.ts` - WorldMind stats
  - `ContextPanel.ts` - live sensor values
- [ ] Fix Thai input encoding
- [ ] Add hotkeys (F1: toggle analytics, F2: toggle context)
- [ ] Reduce total lines (990→600)

### Phase 4-5: Cleanup (~2h)
- [ ] Delete `src/session/WorldSession.ts` (1800 lines)
- [ ] Update `src/index.ts` entry point
- [ ] Test end-to-end with hi_introvert companion
- [ ] Update README

---

## 🔑 Key Implementation Notes

### Context System (from MDS Core)
```typescript
// Already exists in mds-core!
world.broadcastContext({
  'cpu.usage': 0.85,
  'user.message': 'Hello'
})
// → Entities respond via MDM triggers
```

### Conversation System (Spatial)
```typescript
// NOT context broadcast - spatial interaction!
world.recordSpeech(ai, text)  // Transcript (linguistics)
entity.speak('greeting')      // MDM dialogue
entity.remember({ type: 'interaction', ... })  // Memory
```

### Sensors = Context Feeders
- OS sensors → `world.broadcastContext({ 'cpu.usage': ... })`
- Built-in, disable-able (`sensors: { os: false }`)
- **Not plugins** - just on/off

### Field Spawning (Important!)
- syncMoment field - when entities emotionally aligned
- longingField - when entity misses another
- Includes trust system updates
- Includes CRDT memory sync
- Extract from WorldSession:1875-2015

---

## 📂 File Structure (Target)

```
src/
├── runtime/
│   ├── MDSRuntime.ts              ✅ Done
│   └── sensors/
│       ├── OSSensor.ts            ✅ Done
│       ├── NetworkSensor.ts       ⏳ Next
│       └── WeatherSensor.ts       ⏳ Next
│
├── apps/
│   └── hi-introvert/
│       ├── ChatRuntime.ts         ⏳ Phase 2
│       ├── config/
│       │   └── EntityLoader.ts    (keep CompanionLoader)
│       └── cli/
│           ├── BlessedCLI.ts      ⏳ Phase 3
│           └── panels/
│               ├── ChatPanel.ts
│               ├── AnalyticsPanel.ts
│               └── ContextPanel.ts
```

---

## 💡 How to Continue

**To resume this refactor:**
1. Read this file first
2. Check completed tasks
3. Start with "Next steps" in "In Progress" section
4. Reference "Key Implementation Notes" for MDS patterns
5. Use WorldSession.ts as reference (but don't copy hardcoded logic!)

**Current blocker**: None - can continue immediately

**Estimated remaining**: 8 hours
