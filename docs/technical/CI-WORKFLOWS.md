# MDS v5.2 — CI Workflows

**Last Updated:** October 23, 2025

---

## Overview

MDS uses GitHub Actions for continuous integration and API stability verification. This document describes all CI workflows and how to use them.

---

## Workflows

### 1. **CI** (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` branch
- Pull requests

**Jobs:**
- Type checking (`npm run type-check`)
- Build (`npm run build`)
- Circular dependency check (`madge`)
- Core tests (World, Renderer, WorldFile, Heroblind)
- API stability tests
- MDM validator tests
- Bundle size check (≤160 KB)

**Matrix:**
- Node.js 18, 20

**Purpose:** General build and test verification for all changes.

---

### 2. **API Stability** (`.github/workflows/api-stability.yml`)

**Triggers:**
- Pull requests (when `src/`, `tests/`, or `package.json` changes)
- Push to `main` branch

**Jobs:**
- Circular dependency check
- API stability tests (v5.0 compatibility)
- MDM validator tests
- Bundle size report
- PR comment with results

**Purpose:** Ensures backward compatibility and API stability across versions.

**PR Comment Example:**

```markdown
## ✅ API Stability Check

**Bundle Size:** 152 KB / 160 KB (8 KB headroom)

**Tests:**
- ✅ Circular dependency check passed
- ✅ API stability tests passed
- ✅ MDM validator tests passed
- ✅ Bundle size within limits

<details>
<summary>API Compatibility Matrix</summary>

| Version | Compatible With |
|---------|----------------|
| v5.0 | v5.0, v5.1, v5.2 |
| v5.1 | v5.0, v5.1, v5.2 |
| v5.2 | v5.0, v5.1, v5.2 |

All v5.0 APIs remain stable in v5.2.
</details>
```

---

### 3. **GitHub Pages** (`.github/workflows/pages.yml`)

**Triggers:**
- Manual workflow dispatch

**Purpose:** Deploy documentation and examples to GitHub Pages.

---

### 4. **Publish** (`.github/workflows/publish.yml`)

**Triggers:**
- Version tags (e.g., `v5.2.0`)

**Purpose:** Publish package to npm registry.

---

## Local Verification

Before pushing code, run the API stability check script locally:

```bash
npm run check:stability
```

This runs the same checks as CI:
1. Build
2. Circular dependency check
3. API stability tests (5 tests)
4. MDM validator tests (25 tests)
5. Bundle size check
6. All test suites (72 tests)

**Quick Commands:**

```bash
# Check circular dependencies only
npm run check:circular

# Run all tests
npm run test:all

# Run specific test suites
npm run test              # Core tests (42 tests)
npm run test:api          # API stability (5 tests)
npm run test:validator    # MDM validator (25 tests)
```

---

## Bundle Size Policy

**Target:** ≤160 KB (minified ESM)

**Current:** ~152 KB (as of v5.2 Phase 1)

**Headroom:** ~8 KB

**What happens if exceeded:**
- CI fails with clear error message
- PR blocked until size is reduced or limit is adjusted
- Bundle size report shows exact overage

**How to check locally:**

```bash
npm run build
ls -lh dist/mds-core.esm.js
```

**How to optimize:**
- Remove unused code
- Use dynamic imports for optional features
- Simplify large validation functions
- Consider splitting into separate packages

---

## Circular Dependency Policy

**Target:** Zero circular dependencies

**Current:** ✅ Zero (as of v5.2 Phase 1.1)

**What happens if detected:**
- CI fails immediately
- `madge` output shows dependency cycle
- PR blocked until resolved

**How to fix:**
1. Identify circular import chain (use `madge --circular` output)
2. Apply Interface Segregation Principle
3. Create minimal type interfaces in shared location
4. Replace full imports with minimal interfaces
5. Verify with `npm run check:circular`

**Example Fix:**

```typescript
// Before (circular)
// file-a.ts
import { FullClass } from './file-b'

// file-b.ts
import { AnotherClass } from './file-a'

// After (no cycle)
// types.ts
export interface MinimalInterface {
  id: string
  requiredField: unknown
}

// file-a.ts
import type { MinimalInterface } from './types'

// file-b.ts
import type { MinimalInterface } from './types'
```

---

## API Stability Policy

**Compatibility:** v5.0 code must work in v5.2 without changes

**What is tested:**
1. **API Surface Snapshot** — All public exports exist
2. **v5.0 API Compatibility** — All v5.0 APIs work correctly
3. **No Deprecations** — No APIs are marked deprecated
4. **Type Compatibility** — All types are present
5. **Compatibility Matrix** — Cross-version loading works

**Breaking Changes:**
- **Not allowed** in v5.x releases
- Must bump to v6.0 if API changes break compatibility

**Adding New APIs:**
- ✅ Allowed — backward compatible
- Update API stability test baseline
- Document in changelog

---

## Troubleshooting

### CI fails on "Check circular dependencies"

**Cause:** New circular dependency introduced

**Fix:**
1. Run `npm run check:circular` locally
2. Follow madge output to find cycle
3. Refactor using interface segregation
4. Verify with `npm run check:circular`

---

### CI fails on "Run API stability tests"

**Cause:** Breaking change detected (missing or incompatible API)

**Fix:**
1. Run `npm run test:api` locally
2. Check which API is missing/broken
3. Restore API or update baseline if intentional
4. Update `tests/api/stability.test.mjs` if adding new APIs

---

### CI fails on "Check bundle size"

**Cause:** Bundle exceeds 160 KB limit

**Fix Options:**
1. **Optimize code** — Remove unused imports, simplify functions
2. **Split package** — Move large features to separate package
3. **Update limit** — If justified (e.g., major new feature)
   - Update `MAX_SIZE` in workflows
   - Document reason in CHANGELOG

---

### CI fails on "Run MDM validator tests"

**Cause:** Validator logic broken or test expectations wrong

**Fix:**
1. Run `npm run test:validator` locally
2. Check which validation rule failed
3. Fix validator logic or test expectations
4. Ensure all 25 tests pass

---

## Adding New Tests

### Add Core Test

1. Create `tests/test-feature.mjs`
2. Add to `package.json` → `test` script
3. CI will run automatically

### Add API Stability Test

1. Edit `tests/api/stability.test.mjs`
2. Add new test case
3. Update baseline if needed
4. CI will run automatically

### Add Validator Test

1. Edit `tests/mdm-validator.test.mjs`
2. Add new validation test
3. CI will run automatically

---

## Maintenance

### Weekly Tasks
- [ ] Check CI status on recent PRs
- [ ] Monitor bundle size trend
- [ ] Review failed workflow runs

### Per Release
- [ ] Run `npm run check:stability` locally
- [ ] Verify all workflows pass
- [ ] Update CHANGELOG with CI status
- [ ] Tag release (triggers publish workflow)

---

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Madge Documentation](https://github.com/pahen/madge)
- [MDS COHERENCE-REPORT.md](./COHERENCE-REPORT.md)
- [MDS CHANGELOG.md](../meta/CHANGELOG.md)

---

**Maintained by:** MDS Development Team
**Contact:** GitHub Issues
