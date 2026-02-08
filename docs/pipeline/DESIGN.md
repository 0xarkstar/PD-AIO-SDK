# PD-AIO-SDK Improvement Plan: DESIGN.md

**Pipeline Phase**: P0 Design
**Agent**: p-architect
**Date**: 2026-02-08
**SDK Version**: 0.2.0
**Current State**: Production-ready with minor improvements needed

---

## Executive Summary

This design document provides a comprehensive, risk-minimized improvement plan for PD-AIO-SDK based on research findings from three specialized agents. The plan focuses on **high-ROI improvements** that enhance quality, security, and maintainability without introducing breaking changes.

**Key Metrics**:
- 21 console.log statements → migrate to Logger
- 50% test coverage → 80% target (30% increase)
- 6/13 exchanges missing from API.md
- 5 high-severity security vulnerabilities in dependencies
- 7 deprecated annotations requiring cleanup

**Overall Assessment**: The SDK is architecturally sound (4.5/5 code quality, 4.2/5 SDK design). Improvements are **polish, not restructuring**.

---

## 1. Improvement Priority Matrix

### P0: Critical (Must Fix) — Scope: Medium (M)

| ID | Item | Impact | Effort | ROI | Owner |
|----|------|--------|--------|-----|-------|
| **C1** | Replace 21 console.log with Logger | High | Small | Very High | p-impl-core |
| **C2** | Update API.md exchange list (7→13) | High | Small | High | p-impl-core |
| **C3** | Fix API.md createExchange signature (wallet→privateKey) | High | Small | Very High | p-impl-core |
| **C4** | Remove or implement Python aliases (currently ghost feature) | Medium | Small | High | p-impl-core |
| **C5** | Sync README.ko.md missing sections (fetchOHLCV, watchMyTrades) | Medium | Small | Medium | p-impl-core |

**Rationale**: These are **zero-risk, high-value** fixes that improve developer experience without touching runtime logic.

### P1: High Priority (Should Fix) — Scope: Large (L)

| ID | Item | Impact | Effort | ROI | Owner |
|----|------|--------|--------|-----|-------|
| **H1** | Increase test coverage 50%→80% | Very High | Large | Very High | p-test-writer |
| **H2** | Fix dependency vulnerabilities (@drift-labs/sdk) | High | Medium | High | p-impl-core |
| **H3** | Enable noUnusedLocals/noUnusedParameters in tsconfig | Medium | Medium | Medium | p-impl-core |
| **H4** | Remove @ts-ignore in Nado adapter (use AbortSignal) | Medium | Small | High | p-impl-adapters |
| **H5** | Clean up 7 deprecated annotations | Low | Small | Medium | p-impl-adapters |
| **H6** | Add PR validation workflow (lint/typecheck/test) | High | Small | High | p-impl-core |

**Rationale**: H1 (test coverage) is the largest scope item but has highest long-term value. H2 (security) is critical for production use.

### P2: Medium Priority (Nice to Have) — Scope: Small to Medium (S-M)

| ID | Item | Impact | Effort | ROI | Owner |
|----|------|--------|--------|-----|-------|
| **M1** | Add WebSocket usage guide | Medium | Medium | Medium | p-impl-core |
| **M2** | Add error handling guide | Medium | Medium | Medium | p-impl-core |
| **M3** | Add authentication guide per exchange | Medium | Large | Medium | p-impl-adapters |
| **M4** | Fix broken links in examples/README.md | Low | Small | Low | p-impl-core |
| **M5** | Verify/remove zod dependency (unused) | Low | Small | Medium | p-impl-core |
| **M6** | Add examples for fetchOHLCV, setLeverage, fundingRateHistory | Medium | Medium | Medium | p-impl-core |

**Rationale**: Documentation improvements. Can be done incrementally without blocking other work.

### P3: Low Priority (Future) — Scope: Variable

| ID | Item | Impact | Effort | ROI | Owner |
|----|------|--------|--------|-----|-------|
| **L1** | Add Extended adapter WebSocket support | Low | Large | Low | p-impl-adapters |
| **L2** | Optimize CJS bundle size (1.0mb→split by adapter) | Low | Large | Low | p-impl-core |
| **L3** | Add timestamps to market counts in README | Very Low | Small | Low | p-impl-core |
| **L4** | Standardize example import patterns | Low | Small | Low | p-impl-core |
| **L5** | Add Dependabot/Renovate automation | Medium | Small | Medium | p-impl-core |

**Rationale**: Nice-to-haves with lower urgency. Extended's WebSocket can wait (mainnet only, limited users).

---

## 2. Implementation Phases

### **Phase 1: Quick Wins (1-2 days)** — Non-Breaking

**Goal**: Fix documentation, console.log, deprecations — all **zero runtime risk**.

**Tasks**:
1. C1: Replace console.log with Logger (21 files)
2. C2: Update API.md exchange list
3. C3: Fix API.md code examples
4. C4: Remove Python aliases section from API.md (not implemented)
5. C5: Sync README.ko.md
6. H5: Remove 7 deprecated annotations
7. M4: Fix broken links in examples/README.md
8. M5: Remove zod from package.json if unused

**Deliverables**:
- All source files use Logger (no console.log)
- API.md accurate for all 13 exchanges
- Korean docs in sync
- Deprecated code removed

**Breaking Changes**: ❌ None

---

### **Phase 2: Security & TypeScript (2-3 days)** — Low Risk

**Goal**: Fix security vulnerabilities, enable strict TypeScript checks, add CI validation.

**Tasks**:
1. H2: Update @drift-labs/sdk or add overrides for transitive dependencies
2. H3: Enable noUnusedLocals/noUnusedParameters, fix violations
3. H4: Remove @ts-ignore in NadoAPIClient.ts (use AbortSignal.timeout)
4. H6: Add .github/workflows/ci.yml for PR validation

**Deliverables**:
- npm audit shows 0 high/critical vulnerabilities
- tsconfig strict checks fully enabled
- All PRs run lint/typecheck/test before merge

**Breaking Changes**: ❌ None (internal only)

---

### **Phase 3: Test Coverage Increase (1-2 weeks)** — Medium Risk

**Goal**: Achieve 80% test coverage across all adapters.

**Priority Order** (based on research findings):
1. **GMX** (29%→80%): Focus on read-only data fetching
2. **Drift** (32%→80%): SDK wrapper edge cases
3. **Jupiter** (37%→80%): Solana-specific flows
4. **Backpack** (63%→80%): Trading operations
5. **Lighter** (67%→80%): WASM signing modes
6. **Hyperliquid, GRVT, Paradex** (increase to 90%+)

**Test Types**:
- **Unit**: Normalizers, error mappers, utility functions
- **Integration**: HTTP requests with mocked responses
- **E2E**: Live testnet calls (existing production tests)

**Deliverables**:
- Global coverage: 50%→80%
- Per-adapter minimums: 80%
- jest.config.js thresholds updated

**Breaking Changes**: ❌ None (tests only)

---

### **Phase 4: Documentation (1 week)** — Zero Risk

**Goal**: Fill documentation gaps identified in research.

**Tasks**:
1. M1: Write WebSocket usage guide (reconnection, backpressure, error handling)
2. M2: Write error handling guide (error hierarchy, retry strategies)
3. M3: Write authentication guide per exchange (key formats, testnet vs mainnet)
4. M6: Add examples for fetchOHLCV, setLeverage, fetchFundingRateHistory

**Deliverables**:
- `docs/guides/websocket.md`
- `docs/guides/error-handling.md`
- `docs/guides/authentication.md`
- 3 new example files in `examples/`

**Breaking Changes**: ❌ None (docs only)

---

### **Phase 5: Optional Enhancements (Future)** — Variable Risk

**Tasks**:
- L1: Extended WebSocket (only if mainnet demand increases)
- L2: Bundle splitting for tree-shaking (only if browser usage increases)
- L5: Dependabot setup (good for maintenance)

**Decision Point**: Evaluate after Phase 1-4 completion based on user feedback.

---

## 3. File Ownership Map (MANDATORY)

### **p-impl-core** (Core Infrastructure & Shared Code)

**Directories**:
```
src/core/**
src/types/**
src/utils/**
src/factory.ts
src/index.ts
src/websocket/**
src/monitoring/**
tsconfig.json
package.json
package-lock.json
.github/workflows/**
jest.config.js
```

**Specific Files**:
```
src/adapters/base/BaseAdapter.ts
src/adapters/base/BaseAdapterCore.ts
src/adapters/base/BaseNormalizer.ts
src/adapters/base/OrderHelpers.ts
src/adapters/base/index.ts
src/adapters/base/mixins/*.ts
```

**Documentation**:
```
README.md
README.ko.md
API.md
ARCHITECTURE.md
CONTRIBUTING.md
docs/guides/**
examples/README.md
```

**Responsibilities**:
- All P0 Critical tasks (C1-C5)
- H2: Dependency vulnerabilities
- H3: TypeScript config
- H6: CI workflow
- M1-M2, M4-M6: Documentation tasks
- Base adapter pattern maintenance
- Factory pattern
- Type definitions
- Build configuration

**DO NOT MODIFY**:
- Individual adapter implementations (p-impl-adapters owns these)
- Test files (p-test-writer owns these)

---

### **p-impl-adapters** (Exchange-Specific Implementations)

**Directories** (13 adapters):
```
src/adapters/backpack/**
src/adapters/drift/**
src/adapters/dydx/**
src/adapters/edgex/**
src/adapters/extended/**
src/adapters/gmx/**
src/adapters/grvt/**
src/adapters/hyperliquid/**
src/adapters/jupiter/**
src/adapters/lighter/**
src/adapters/nado/**
src/adapters/paradex/**
src/adapters/variational/**
```

**Responsibilities**:
- H4: Remove @ts-ignore in NadoAPIClient.ts
- H5: Clean up deprecated annotations in adapters
- M3: Authentication guide (exchange-specific sections)
- L1: Extended WebSocket (if prioritized)

**Exclusions**:
- `src/adapters/base/**` (owned by p-impl-core)

**DO NOT MODIFY**:
- Core infrastructure (src/core/, src/types/)
- Factory/index files
- Test files
- Documentation (except adapter-specific auth docs)

---

### **p-test-writer** (All Testing)

**Directories**:
```
tests/**
```

**Specific Patterns**:
```
tests/unit/**/*.test.ts
tests/integration/**/*.test.ts
tests/e2e/**/*.test.ts
tests/api-contracts/**/*.test.ts
tests/production/**/*.test.ts
```

**Test Configuration**:
```
jest.config.js (coverage thresholds only)
tests/jest.setup.js
```

**Responsibilities**:
- H1: Increase test coverage 50%→80%
- Write new tests for all adapters (priority: GMX, Drift, Jupiter, Backpack, Lighter)
- Update jest.config.js coverage thresholds
- Maintain test infrastructure
- Fix failing tests

**DO NOT MODIFY**:
- Source code in src/ (unless fixing bugs found during testing)
- Documentation
- CI workflows (except test-related scripts)

---

### Ownership Verification Checklist

✅ **No overlaps**: Core owns base/, adapters owns exchange-specific, tests owns tests/
✅ **Complete coverage**: All modified files have an owner
✅ **Clear boundaries**: BaseAdapter vs specific adapters well-defined
✅ **Conflict prevention**: Each agent has exclusive write access to their domain

---

## 4. Risk Assessment

### High Risk Areas ⚠️

#### **R1: Dependency Updates (@drift-labs/sdk)**

**Issue**: npm audit suggests downgrade from v2.155.0 → v2.38.0 (major version drop)

**Risks**:
- Breaking API changes in Drift adapter
- Incompatible method signatures
- Runtime errors in production

**Mitigation Strategy**:
1. Check Drift SDK changelog for breaking changes between v2.38 and v2.155
2. If downgrade not feasible, use package.json overrides for transitive dependencies
3. Run full test suite after any dependency change
4. Test Drift adapter manually on testnet
5. **Alternative**: Lock vulnerable transitive deps (nanoid, @solana/spl-token) via overrides

**Owner**: p-impl-core

---

#### **R2: Enabling noUnusedLocals/noUnusedParameters**

**Issue**: Currently disabled to avoid breaking build

**Risks**:
- 100+ compilation errors if enabled immediately
- Unused variables may be intentional (event handlers, interface compliance)

**Mitigation Strategy**:
1. Run `tsc --noEmit` with flags enabled to identify violations
2. Fix violations incrementally (use `_` prefix for intentionally unused params)
3. Commit in small batches (10-20 files at a time)
4. **Fallback**: If too many violations, enable warnings instead of errors first

**Owner**: p-impl-core

---

#### **R3: Test Coverage Increase (30% increase)**

**Issue**: Writing 30% more tests is time-intensive and may reveal bugs

**Risks**:
- Discovering critical bugs during test writing
- Adapter behavior assumptions may be wrong
- Flaky tests due to live API dependencies

**Mitigation Strategy**:
1. Start with **GMX, Drift, Jupiter** (lowest coverage, isolated)
2. Use mocks for API responses to avoid flakiness
3. If bugs found, create separate bug fix tasks (don't block test writing)
4. Set incremental targets: 50%→60%→70%→80% over 2 weeks

**Owner**: p-test-writer

---

### Medium Risk Areas 🟡

#### **R4: Removing Python Aliases from API.md**

**Risk**: Some users may expect this feature based on docs

**Mitigation**: Add deprecation notice first, wait 1 release cycle, then remove

---

#### **R5: Removing @ts-ignore in Nado**

**Risk**: Timeout handling may break if not tested properly

**Mitigation**: Add integration test for timeout behavior before removing @ts-ignore

---

### Low Risk Areas 🟢

- Console.log replacement: Logger already exists, direct substitution
- API.md updates: Documentation only, no code changes
- README.ko.md sync: Translation only
- Deprecated code removal: Already marked for removal
- CI workflow addition: Additive only, doesn't modify existing workflows

---

## 5. Success Criteria

### Phase 1 Success (Quick Wins)

✅ **Zero console.log in src/** (excluding src/core/logger.ts bootstrap)
✅ **API.md lists all 13 exchanges** with correct type definitions
✅ **API.md code examples use correct signatures** (privateKey, not wallet)
✅ **README.ko.md sections match README.md** (fetchOHLCV, watchMyTrades present)
✅ **Zero @deprecated annotations** in src/
✅ **Zero broken links** in documentation
✅ **Zod removed from package.json** if unused, or validation implemented if keeping

**Verification**:
```bash
# No console.log (except logger.ts)
grep -r "console\." src/ --exclude="src/core/logger.ts" --exclude="*/error-codes.ts"
# Should return empty

# All exchanges in API.md
grep "SupportedExchange" API.md
# Should list 13 exchanges

# No deprecated code
grep -r "@deprecated" src/
# Should return empty

# Zod usage check
grep -r "import.*zod" src/
# Should return results OR zod removed from package.json
```

---

### Phase 2 Success (Security & TypeScript)

✅ **npm audit shows 0 high/critical vulnerabilities**
✅ **tsconfig.json has noUnusedLocals: true, noUnusedParameters: true**
✅ **tsc --noEmit succeeds** with full strict mode
✅ **Zero @ts-ignore in src/**
✅ **.github/workflows/ci.yml exists** and runs on all PRs
✅ **CI workflow runs lint, typecheck, test, build**

**Verification**:
```bash
npm audit --audit-level=high
# 0 vulnerabilities

npm run typecheck
# No errors

grep -r "@ts-ignore" src/
# Should return empty

# CI passes
gh workflow run ci.yml
gh run list --workflow=ci.yml
```

---

### Phase 3 Success (Test Coverage)

✅ **Global coverage ≥80%** (statements, branches, functions, lines)
✅ **Per-adapter coverage ≥80%** (all 13 adapters)
✅ **jest.config.js thresholds updated** to enforce 80%
✅ **No flaky tests** (tests pass 10/10 runs)
✅ **Test execution time <5 minutes** (unit+integration)

**Verification**:
```bash
npm run test:coverage
# Check coverage report:
# Global: 80%+
# Per-adapter: 80%+

# Run tests 10 times
for i in {1..10}; do npm test || exit 1; done
# Should pass all 10 runs
```

---

### Phase 4 Success (Documentation)

✅ **docs/guides/websocket.md exists** (>1000 words, code examples)
✅ **docs/guides/error-handling.md exists** (error hierarchy, retry patterns)
✅ **docs/guides/authentication.md exists** (all 13 exchanges documented)
✅ **examples/fetchOHLCV.ts exists**
✅ **examples/setLeverage.ts exists**
✅ **examples/fundingRateHistory.ts exists**
✅ **All example code runs without errors**

**Verification**:
```bash
# Check file existence
ls docs/guides/websocket.md docs/guides/error-handling.md docs/guides/authentication.md
ls examples/fetchOHLCV.ts examples/setLeverage.ts examples/fundingRateHistory.ts

# Run examples
tsx examples/fetchOHLCV.ts
tsx examples/setLeverage.ts
tsx examples/fundingRateHistory.ts
```

---

## 6. Dependencies Between Tasks

### Critical Path (Blocking Dependencies)

```
Phase 1 (Quick Wins)
  ↓
Phase 2 (Security & TypeScript)
  ├─→ H2 (Dependency fixes) MUST complete before Phase 3
  └─→ H3 (TypeScript strict) MUST complete before Phase 3
  ↓
Phase 3 (Test Coverage)
  ↓
Phase 4 (Documentation) — Can run in parallel with Phase 3
```

### Parallel Opportunities

**Can run simultaneously**:
- C1 (console.log) + C2/C3/C4 (API.md updates)
- H5 (deprecated removal) + M4 (broken links)
- Phase 3 (tests) + Phase 4 (docs) — Different agents, different files

**Must be sequential**:
- H2 (deps) BEFORE H3 (TypeScript strict) — Dependency errors may hide TS errors
- H3 (TypeScript strict) BEFORE H1 (test coverage) — Tests need clean build

---

## 7. Rollback Plan

### If Phase 1 Fails

**Unlikely** — Documentation changes are low-risk. If issues arise:
- Revert specific commits (git revert)
- Each subtask is atomic (console.log, API.md, README.ko.md are independent)

### If Phase 2 Fails

**Scenario**: Dependency update breaks Drift adapter

**Rollback**:
1. Revert package.json to previous @drift-labs/sdk version
2. Use overrides to patch specific transitive dependencies
3. Document vulnerability acceptance in SECURITY.md with timeline for fix

**Scenario**: TypeScript strict flags cause too many errors

**Rollback**:
1. Keep flags disabled
2. Enable warnings instead: Use ESLint rules as soft enforcement
3. Fix violations incrementally over multiple sprints

### If Phase 3 Fails

**Scenario**: Test coverage increase reveals critical bugs

**Action** (not rollback):
1. Fix bugs first (higher priority than coverage)
2. Delay coverage increase until bugs resolved
3. Re-evaluate coverage targets (maybe 70% is more realistic)

---

## 8. Post-Implementation Verification

### Automated Checks (CI/CD)

After all phases complete, CI should enforce:
- ✅ Lint passes (ESLint)
- ✅ Typecheck passes (tsc --noEmit)
- ✅ Tests pass with 80%+ coverage
- ✅ Build succeeds (ESM + CJS)
- ✅ No high/critical npm vulnerabilities
- ✅ No console.log in source (except logger.ts)
- ✅ No @ts-ignore in source
- ✅ No broken links in docs

### Manual Validation

**Before marking complete**:
1. Run all production E2E tests on testnet
2. Test 3 most-used adapters manually (Hyperliquid, GRVT, Paradex)
3. Verify documentation accuracy by following examples
4. Check bundle size hasn't increased >10%
5. Confirm no new warnings in build output

---

## 9. Communication & Handoff

### To Team Lead

**After completing DESIGN.md**:
- Send summary: "Design complete, 4 phases, 3 agents, zero breaking changes"
- Highlight critical path: Phase 2 must complete before Phase 3
- Request approval to proceed with implementation

### To Implementation Agents

**p-impl-core will receive**:
- This DESIGN.md
- Ownership section (all their files listed)
- Tasks: C1-C5, H2-H3, H6, M1-M2, M4-M6

**p-impl-adapters will receive**:
- This DESIGN.md
- Ownership section (all adapter dirs)
- Tasks: H4, H5, M3

**p-test-writer will receive**:
- This DESIGN.md
- Ownership section (tests/ directory)
- Tasks: H1 (coverage increase)
- Priority order: GMX → Drift → Jupiter → Backpack → Lighter

### Progress Tracking

All agents will update `docs/pipeline/PROGRESS.md` after completing each task:
```markdown
## Phase 1 Progress
- [x] C1: console.log replaced (p-impl-core)
- [x] C2: API.md exchange list updated (p-impl-core)
- [ ] C3: API.md signatures fixed (p-impl-core)
...
```

---

## 10. Conclusion

This design provides a **practical, low-risk improvement roadmap** for PD-AIO-SDK. The SDK is already production-ready; these improvements enhance quality and maintainability.

**Key Principles**:
1. **No breaking changes** — All improvements are additive or internal
2. **Phased approach** — Quick wins first, then security, then coverage, then docs
3. **Clear ownership** — No file conflicts between agents
4. **Measurable success** — Each phase has concrete verification criteria
5. **Risk-aware** — Mitigation strategies for high-risk items

**Timeline Estimate**:
- Phase 1: 1-2 days
- Phase 2: 2-3 days
- Phase 3: 1-2 weeks
- Phase 4: 1 week (parallel with Phase 3)
- **Total**: 2.5-3.5 weeks

**Next Steps**:
1. Team lead approves this design
2. Spawn implementation agents with file ownership map
3. Begin Phase 1 (Quick Wins)
4. Progress tracked in PROGRESS.md

---

**Design Document Version**: 1.0
**Architect**: p-architect
**Review Status**: Awaiting team-lead approval
**Implementation Ready**: ✅ Yes
