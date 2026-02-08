# Test Strategy for PD-AIO-SDK Improvements
**Version**: 1.0
**Date**: 2026-02-08
**Project Phase**: P0 (Design)
**Status**: Ready for Review

---

## Executive Summary

This document defines the comprehensive testing strategy for SDK quality improvements targeting the console.log → Logger migration, deprecated API cleanup, Zod evaluation, and TypeScript configuration improvements.

**Current Baseline**:
- ✅ 4,538 tests passing (289 passed, 1 failing)
- ⚠️ Global coverage: 50% (target: 80%)
- ✅ 126/130 test suites passing
- ⚠️ Coverage gaps: GMX (60%), Backpack (63%), Lighter (67%)

**Quality Gates**:
1. All improvements MUST NOT reduce current test coverage
2. New code MUST achieve 80%+ coverage
3. Zero tolerance for broken tests after changes
4. Integration tests MUST pass for all adapters
5. Production E2E suite MUST remain green

---

## 1. Coverage Targets & Metrics

### 1.1 Per-Adapter Coverage Targets

Based on current baselines and improvement roadmap:

| Adapter | Current Coverage | Target Coverage | Priority | Rationale |
|---------|------------------|-----------------|----------|-----------|
| **Hyperliquid** | 60-70% | 75% | P2 | Mature, good test patterns |
| **GRVT** | 35-50% | 65% | P2 | SDK wrapper, focus on adapter logic |
| **Paradex** | 35-50% | 65% | P2 | SDK wrapper, complex auth |
| **EdgeX** | 40-50% | 65% | P2 | StarkNet integration |
| **Backpack** | 63% | 75% | **P1** | Good foundation, needs expansion |
| **Lighter** | 67% | 75% | **P1** | Complex auth modes, WASM |
| **Nado** | 50-60% | 70% | P2 | Newer adapter |
| **Variational** | 50-60% | 70% | P2 | Limited features (RFQ) |
| **Extended** | 50% | 70% | P2 | Mainnet only, needs WS tests |
| **dYdX** | 46% | 70% | **P1** | 0% thresholds → baseline |
| **Drift** | 32% | 65% | **P1** | 0% thresholds → baseline |
| **GMX** | 29% | 60% | **P1** | Read-only, 0% thresholds |
| **Jupiter** | 37% | 65% | **P1** | 0% thresholds → baseline |

**Priority P1**: Adapters with 0% thresholds or <65% coverage
**Priority P2**: Adapters with existing coverage >50%

### 1.2 Overall Project Targets

**Global Coverage Roadmap**:
```
Current: 50% → Phase 1: 60% → Phase 2: 70% → Phase 3: 80%
```

**Metric Priorities** (in order of importance):
1. **Functions**: 80% (most critical - ensures all methods tested)
2. **Statements**: 75% (code execution coverage)
3. **Branches**: 70% (conditional logic coverage)
4. **Lines**: 75% (similar to statements)

**Justification**: Function coverage is most important for an SDK - every public method should have at least one test. Branch coverage ensures error paths are tested.

### 1.3 Module-Specific Targets

**High-Quality Core Modules** (maintain existing standards):
- `src/utils/**/*.ts`: 85% statements, 90% functions ✅
- `src/core/calculations/**/*.ts`: 95% statements, 95% functions ✅
- `src/core/http/HTTPClient.ts`: 80%+ all metrics
- `src/core/RateLimiter.ts`: 80%+ all metrics
- `src/core/CircuitBreaker.ts`: 85%+ all metrics

**Adapter Utils** (incremental improvement):
- Existing thresholds maintained
- New utilities: 80%+ coverage required

---

## 2. Test Plan for Each Improvement

### 2.1 Console.log → Logger Migration

**Scope**: 21 files with console.log/warn/error usage

**Files Affected**:
```
CRITICAL (must migrate):
- src/adapters/grvt/GRVTAdapter.ts
- src/adapters/paradex/ParadexAdapter.ts
- src/adapters/extended/ExtendedAdapter.ts
- src/adapters/nado/NadoAdapter.ts
- src/adapters/base/mixins/CacheManagerMixin.ts
- src/adapters/base/mixins/MetricsTrackerMixin.ts

ACCEPTABLE (debug only - can keep):
- src/adapters/*/error-codes.ts (13 files)

EXCEPTION:
- src/core/logger.ts (bootstrapping - leave as-is)
```

**Testing Strategy**:

#### 2.1.1 Verification Tests
Create new test file: `tests/unit/logging-migration.test.ts`

```typescript
describe('Logger Migration Verification', () => {
  describe('No console.log in production code', () => {
    it('should not have console.log in adapter files', () => {
      // Read adapter files, assert no console.log
    });

    it('should not have console.warn in mixin files', () => {
      // Read mixin files, assert no console.warn
    });
  });

  describe('Logger usage in adapters', () => {
    // Test each adapter's logger calls
    it('GRVT adapter should use logger for errors', () => {
      // Mock logger, trigger error, verify logger.error called
    });

    it('Paradex adapter should use logger for warnings', () => {
      // Similar pattern
    });
  });
});
```

#### 2.1.2 Regression Tests
**Existing tests to verify**:
- `tests/unit/logger.test.ts` - Ensure Logger still works
- All adapter integration tests - No output changes

**New tests required**: NONE (existing tests cover Logger functionality)

**Test count estimate**: 10 new verification tests

---

### 2.2 Deprecated API Cleanup

**Scope**: 7 @deprecated annotations

**Files Affected**:
```
- src/adapters/grvt/GRVTAdapter.ts:60 (GRVTAdapterConfig)
- src/adapters/jupiter/JupiterAdapter.ts:83 (JupiterAdapterConfig)
- src/adapters/lighter/LighterAdapter.ts:211 (hasAuth method)
- src/adapters/nado/types.ts:66,84 (NadoMarket, NadoMarketSchema)
- src/adapters/backpack/utils.ts:60 (mapError function)
```

**Testing Strategy**:

#### 2.2.1 Breaking Change Tests
Create: `tests/unit/deprecated-api-removal.test.ts`

```typescript
describe('Deprecated API Removal', () => {
  it('should NOT export GRVTAdapterConfig type alias', () => {
    // Compile-time check via TypeScript imports
  });

  it('should NOT export JupiterAdapterConfig type alias', () => {
    // Similar
  });

  it('should NOT have hasAuth() method on Lighter adapter', () => {
    const adapter = new LighterAdapter({ chainId: 300 });
    expect(adapter.hasAuth).toBeUndefined();
  });

  it('should NOT export NadoMarket/NadoMarketSchema', () => {
    // Import check
  });

  it('should NOT export mapError from backpack/utils', () => {
    // Import check
  });
});
```

#### 2.2.2 Migration Path Tests
**For Lighter.hasAuth() → hasWasmSigning()**:

Update existing test: `tests/unit/lighter-auth.test.ts`
```typescript
describe('LighterAuth - Migration', () => {
  it('should use hasWasmSigning() instead of hasAuth()', () => {
    const auth = new LighterAuth({ apiPrivateKey: '0x123', chainId: 300 });
    expect(auth.hasWasmSigning()).toBe(true);
  });
});
```

#### 2.2.3 Regression Tests
**Existing tests to update**:
- `tests/unit/lighter-auth.test.ts` - Remove hasAuth() calls
- `tests/integration/lighter-adapter.test.ts` - Verify hasWasmSigning() works
- Any tests importing deprecated types - update imports

**Test count estimate**: 8 new tests, 5 updated tests

---

### 2.3 Zod Removal/Implementation

**Scope**: `zod@3.23.0` dependency listed but not used

**Decision Required**: Remove OR Implement?

**Option A: Remove Zod** (Recommended)

**Testing Strategy**:
1. Remove from package.json
2. Run `npm test` - all tests should pass (no Zod usage found)
3. Run `npm run build` - no errors
4. No new tests required (Zod not currently used)

**Option B: Implement Zod Validation**

If implementing runtime validation:

**Files to add validation**:
```
- src/adapters/base/BaseAdapter.ts - validateConfig()
- src/factory.ts - validateExchangeConfig()
- All adapter constructors - validate config objects
```

**New test files required**:
```
tests/unit/config-validation.test.ts
├── Factory validation tests
├── BaseAdapter config validation
└── Per-adapter config validation

tests/integration/invalid-config.test.ts
├── Invalid API keys
├── Invalid URLs
├── Missing required fields
└── Type mismatches
```

**Test count estimate**:
- Option A: 0 new tests
- Option B: 50+ new tests (13 adapters × ~4 tests each)

**Recommendation**: **Remove Zod** - No current usage, would require significant testing effort for marginal benefit (TypeScript already provides compile-time validation).

---

### 2.4 TypeScript Configuration Changes

**Scope**: Enable `noUnusedLocals` and `noUnusedParameters`

**Files Affected**: Potentially many (need to run `tsc --noEmit` with flags enabled)

**Testing Strategy**:

#### 2.4.1 Pre-Cleanup Tests
1. Run with new flags enabled:
   ```bash
   tsc --noEmit --noUnusedLocals --noUnusedParameters
   ```
2. Capture all errors
3. Fix code (remove unused imports/variables/params)

#### 2.4.2 Verification Tests
Create: `tests/unit/typescript-strict-checks.test.ts`

```typescript
describe('TypeScript Strict Checks', () => {
  it('should compile with noUnusedLocals enabled', () => {
    // Run tsc programmatically, assert no errors
  });

  it('should compile with noUnusedParameters enabled', () => {
    // Similar
  });

  it('should use underscore prefix for intentionally unused params', () => {
    // Verify pattern: function foo(_unused: string, used: number)
  });
});
```

#### 2.4.3 Regression Tests
**Existing tests**: All existing tests should pass without changes (TypeScript compilation issues would be caught at compile-time, not test-time)

**Test count estimate**: 3 new verification tests

---

## 3. New Tests Needed

### 3.1 Priority 1: Adapter Coverage Gaps

#### 3.1.1 GMX (29% → 60%)

**Files needing tests**:
```
src/adapters/gmx/
├── GMXAdapter.ts (main adapter - CRITICAL)
├── GMXOrderBuilder.ts (0% function coverage)
├── GMXNormalizer.ts
└── utils.ts
```

**New test files**:
```
tests/unit/gmx-order-builder.test.ts (NEW)
├── buildMarketIncreaseOrder()
├── buildMarketDecreaseOrder()
├── buildLimitIncreaseOrder()
└── buildLimitDecreaseOrder()

tests/integration/gmx-adapter.test.ts (EXPAND)
├── fetchMarkets()
├── fetchOrderBook()
├── fetchTrades()
└── Error handling
```

**Test count**: 20 new tests

---

#### 3.1.2 Backpack (63% → 75%)

**Files needing tests**:
```
src/adapters/backpack/
├── BackpackAdapter.ts (expand coverage)
├── BackpackAuth.ts (ED25519 signing)
└── utils.ts
```

**New test files**:
```
tests/unit/backpack-signing.test.ts (NEW)
├── ED25519 signature generation
├── Timestamp handling
├── Message formatting
└── Solana wallet integration

tests/integration/backpack-websocket.test.ts (NEW)
├── Order updates
├── Position updates
├── Reconnection logic
└── Error handling
```

**Test count**: 15 new tests

---

#### 3.1.3 Lighter (67% → 75%)

**Files needing tests**:
```
src/adapters/lighter/
├── LighterAdapter.ts (WASM mode)
├── LighterWebSocket.ts
└── LighterOrderUtils.ts
```

**New test files**:
```
tests/unit/lighter-wasm-mode.test.ts (NEW)
├── WASM signer initialization
├── WASM signing errors
├── FFI mode fallback
└── koffi optional dependency handling

tests/integration/lighter-websocket-streams.test.ts (EXPAND)
├── Order book subscription
├── Trade subscription
├── Position updates
└── Multiple subscription handling
```

**Test count**: 18 new tests

---

#### 3.1.4 dYdX (46% → 70%)

**Files needing tests**:
```
src/adapters/dydx/
├── DydxAdapter.ts (SDK wrapper)
├── DydxNormalizer.ts
└── utils.ts
```

**New test files**:
```
tests/unit/dydx-normalizer.test.ts (NEW)
├── normalizeMarket()
├── normalizeOrder()
├── normalizePosition()
└── normalizeTrade()

tests/integration/dydx-sdk-wrapper.test.ts (NEW)
├── SDK initialization
├── Market data methods
├── Trading methods
└── Account methods
```

**Test count**: 20 new tests

---

#### 3.1.5 Drift (32% → 65%)

**Files needing tests**:
```
src/adapters/drift/
├── DriftAdapter.ts
├── DriftClientWrapper.ts
├── DriftAuth.ts
└── DriftNormalizer.ts
```

**New test files**:
```
tests/unit/drift-client-wrapper.test.ts (NEW)
├── Client initialization
├── Market data fetching
├── Order placement
└── Position tracking

tests/unit/drift-normalizer.test.ts (NEW)
├── normalizeMarket()
├── normalizeOrder()
├── normalizePosition()
└── normalizeBalance()

tests/integration/drift-auth.test.ts (NEW)
├── Solana wallet connection
├── Transaction signing
├── Error handling
└── Keypair management
```

**Test count**: 25 new tests

---

#### 3.1.6 Jupiter (37% → 65%)

**Files needing tests**:
```
src/adapters/jupiter/
├── JupiterAdapter.ts
├── JupiterAuth.ts
└── utils.ts
```

**New test files**:
```
tests/unit/jupiter-auth.test.ts (EXPAND)
├── Solana signing
├── Transaction building
└── Error handling

tests/integration/jupiter-adapter.test.ts (EXPAND)
├── fetchMarkets()
├── createOrder()
├── cancelOrder()
└── Solana RPC integration
```

**Test count**: 15 new tests

---

### 3.2 Priority 2: Critical Functionality Coverage

#### 3.2.1 WebSocket Reconnection Logic

**All adapters with WebSocket** need reconnection tests:

**New test pattern** (apply to 9 adapters):
```typescript
describe('[Adapter] WebSocket Reconnection', () => {
  it('should reconnect after connection loss', async () => {
    // Simulate disconnect, verify reconnect
  });

  it('should resubscribe after reconnection', async () => {
    // Verify subscriptions restored
  });

  it('should handle max retry attempts', async () => {
    // Test exponential backoff limits
  });

  it('should emit proper events during reconnection', async () => {
    // Verify event emission
  });
});
```

**Test count**: 36 tests (9 adapters × 4 tests)

---

#### 3.2.2 Error Handling Paths

**Pattern for each adapter**:
```typescript
describe('[Adapter] Error Handling', () => {
  it('should handle rate limit errors', async () => {
    // Mock 429 response, verify RateLimitError thrown
  });

  it('should handle network timeouts', async () => {
    // Mock timeout, verify error handling
  });

  it('should handle invalid API responses', async () => {
    // Mock malformed JSON, verify error
  });

  it('should handle exchange downtime', async () => {
    // Mock 5xx errors, verify ExchangeUnavailableError
  });
});
```

**Test count**: 52 tests (13 adapters × 4 tests)

---

#### 3.2.3 Circuit Breaker Integration

**New test file**: `tests/integration/circuit-breaker-adapters.test.ts`

```typescript
describe('Circuit Breaker Integration', () => {
  it('should open circuit after repeated failures', async () => {
    // Test with each adapter
  });

  it('should transition to half-open after timeout', async () => {
    // Verify OPEN → HALF_OPEN
  });

  it('should close circuit on successful requests', async () => {
    // Verify HALF_OPEN → CLOSED
  });
});
```

**Test count**: 12 tests (per-adapter coverage)

---

### 3.3 Priority 3: Integration Test Expansion

#### 3.3.1 Multi-Adapter Tests

**New test file**: `tests/integration/multi-adapter.test.ts`

```typescript
describe('Multi-Adapter Operations', () => {
  it('should fetch markets from all adapters', async () => {
    // Parallel market fetching
  });

  it('should handle mixed success/failure', async () => {
    // Some adapters fail, some succeed
  });

  it('should compare normalized data across adapters', async () => {
    // Verify normalization consistency
  });
});
```

**Test count**: 10 tests

---

### 3.4 Test File Summary

**New Test Files Required**:
```
tests/unit/
├── logging-migration.test.ts (10 tests)
├── deprecated-api-removal.test.ts (8 tests)
├── typescript-strict-checks.test.ts (3 tests)
├── gmx-order-builder.test.ts (20 tests)
├── backpack-signing.test.ts (8 tests)
├── lighter-wasm-mode.test.ts (10 tests)
├── dydx-normalizer.test.ts (12 tests)
├── drift-client-wrapper.test.ts (12 tests)
├── drift-normalizer.test.ts (8 tests)
└── jupiter-auth-expanded.test.ts (8 tests)

tests/integration/
├── backpack-websocket.test.ts (7 tests)
├── lighter-websocket-streams.test.ts (8 tests)
├── dydx-sdk-wrapper.test.ts (8 tests)
├── drift-auth.test.ts (5 tests)
├── jupiter-adapter-expanded.test.ts (7 tests)
├── websocket-reconnection.test.ts (36 tests)
├── error-handling.test.ts (52 tests)
├── circuit-breaker-adapters.test.ts (12 tests)
└── multi-adapter.test.ts (10 tests)

tests/api-contracts/
├── [No new files - existing contracts cover API surface]
```

**Total New Tests**: ~255 tests

---

## 4. Testing Patterns & Best Practices

### 4.1 Mocking Patterns for Exchange APIs

**Current Pattern** (from existing tests):

```typescript
// 1. Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// 2. Create mock response factory
function createMockResponse<T>(data: T): Response {
  return {
    ok: true,
    status: 200,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response;
}

// 3. Setup per-test mocks
beforeEach(() => {
  mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  mockFetch.mockResolvedValue(createMockResponse(mockData));
});

// 4. Verify calls
expect(mockFetch).toHaveBeenCalledWith(
  expect.stringContaining('/api/v1/markets'),
  expect.objectContaining({ method: 'GET' })
);
```

**WebSocket Mocking Pattern**:

```typescript
// 1. Mock ws module
jest.mock('ws', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    send: jest.fn(),
    close: jest.fn(),
    readyState: 1, // OPEN
  }));
});

// 2. Setup event handlers
(WebSocket as unknown as jest.Mock).mockImplementation(() => {
  const handlers: Record<string, Function> = {};
  return {
    on: jest.fn((event: string, handler: Function) => {
      handlers[event] = handler;
      if (event === 'open') setTimeout(() => handler(), 0); // Auto-trigger
    }),
    send: jest.fn(),
    close: jest.fn(),
    emit: (event: string, data: any) => handlers[event]?.(data),
  };
});
```

**SDK Wrapper Mocking** (for Drift, GRVT, Paradex):

```typescript
// Mock the entire SDK module
jest.mock('@drift-labs/sdk', () => ({
  DriftClient: jest.fn().mockImplementation(() => ({
    subscribe: jest.fn().mockResolvedValue(true),
    fetchMarkets: jest.fn().mockResolvedValue(mockMarkets),
    placeOrder: jest.fn().mockResolvedValue(mockOrder),
  })),
}));
```

---

### 4.2 WebSocket Reconnection Testing

**Pattern**:

```typescript
describe('WebSocket Reconnection', () => {
  it('should reconnect after connection loss', async () => {
    const adapter = new [Adapter]Adapter(config);
    const stream = adapter.watchOrderBook('BTC-PERP');

    // 1. Establish connection
    await stream.next();

    // 2. Simulate disconnect
    mockWs.emit('close', 1006, 'Connection lost');

    // 3. Wait for reconnection
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Verify reconnection
    expect(WebSocket).toHaveBeenCalledTimes(2); // Initial + reconnect

    // 5. Verify data flows again
    const result = await stream.next();
    expect(result.done).toBe(false);
  });

  it('should handle max retry exhaustion', async () => {
    // Override reconnect config
    const adapter = new [Adapter]Adapter({
      ...config,
      websocket: {
        reconnect: { maxAttempts: 3, initialDelay: 100 }
      }
    });

    // Simulate repeated failures
    mockWs.emit('close', 1006);
    await expect(stream.next()).rejects.toThrow(WebSocketDisconnectedError);
  });
});
```

---

### 4.3 Integration Test Strategy

**Live API vs Mocked**:

| Test Type | Environment | When to Use |
|-----------|-------------|-------------|
| **Unit Tests** | Fully mocked | Always - fast, isolated |
| **Integration Tests** | Mocked API responses | Always - predictable, fast |
| **API Contract Tests** | Mocked with real schemas | Weekly CI run |
| **Production E2E Tests** | Live testnet APIs | Daily CI run |

**Integration Test Pattern** (mocked):

```typescript
describe('[Adapter] Integration Tests', () => {
  let adapter: [Adapter]Adapter;

  beforeEach(() => {
    // Mock all external dependencies
    mockFetch.mockResolvedValue(/* ... */);
    adapter = new [Adapter]Adapter(config);
  });

  describe('Market Data', () => {
    it('should fetch markets with correct normalization', async () => {
      const markets = await adapter.fetchMarkets();
      expect(markets).toEqual(expect.arrayContaining([
        expect.objectContaining({
          symbol: expect.any(String),
          baseAsset: expect.any(String),
          quoteAsset: expect.any(String),
          // ... verify normalized structure
        })
      ]));
    });
  });

  describe('Trading Operations', () => {
    it('should create limit order with correct parameters', async () => {
      const order = await adapter.createOrder({
        symbol: 'BTC-PERP',
        side: 'buy',
        amount: 1.0,
        price: 50000,
        type: 'limit',
      });

      // Verify request was made correctly
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/orders'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('BTC-PERP'),
        })
      );

      // Verify response normalization
      expect(order).toMatchObject({
        orderId: expect.any(String),
        status: 'open',
        side: 'buy',
        amount: 1.0,
      });
    });
  });
});
```

---

## 5. CI Integration & Coverage Enforcement

### 5.1 Recommended Test Pipeline for PRs

**GitHub Actions Workflow**: `.github/workflows/ci.yml`

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage/coverage-final.json
          fail_ci_if_error: true

      - name: Build
        run: npm run build

      - name: API compatibility check
        run: npm run check:api
        if: github.event_name == 'pull_request'
```

---

### 5.2 Coverage Enforcement Strategy

**Phase 1: Baseline Protection** (Immediate)
- Set current coverage as minimum thresholds
- Block PRs that reduce coverage
- jest.config.js: `coverageThreshold.global` enforced

**Phase 2: Incremental Improvement** (Sprint-based)
- Raise thresholds by 5% every sprint
- Focus on one adapter per sprint
- Update jest.config.js thresholds accordingly

**Phase 3: Full Coverage** (Long-term)
- Achieve 80% global coverage
- Enforce 75%+ for all adapters
- No more 0% threshold adapters

**Coverage Ratcheting** (prevent regression):

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 50,    // Sprint 1: 50 → Sprint 2: 55 → Sprint 3: 60 ...
    functions: 55,   // Sprint 1: 55 → Sprint 2: 60 → Sprint 3: 65 ...
    lines: 55,
    statements: 55,
  },

  // Per-adapter ratcheting
  './src/adapters/gmx/**/*.ts': {
    functions: 35,   // Current: 29 → Target: 35 → 45 → 55 → 65
  },
}
```

---

### 5.3 PR Checklist Template

**Add to `.github/pull_request_template.md`**:

```markdown
## Testing Checklist

- [ ] All tests pass locally (`npm test`)
- [ ] Coverage did not decrease (`npm run test:coverage`)
- [ ] New code has 80%+ coverage
- [ ] Integration tests updated if API changed
- [ ] WebSocket reconnection logic tested (if applicable)
- [ ] Error handling paths covered
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] ESLint passes (`npm run lint`)

## Coverage Report

Paste coverage summary here:
```
[Output of `npm run test:coverage`]
```

## Breaking Changes

- [ ] No breaking changes
- [ ] Breaking changes documented in CHANGELOG.md
- [ ] API compatibility check passed
```

---

## 6. Test Implementation Timeline

**Phased Approach**:

### Phase 1: Improvement-Specific Tests (Week 1)
- [x] Logging migration verification tests (10 tests)
- [x] Deprecated API removal tests (8 tests)
- [x] TypeScript strict checks tests (3 tests)
- **Total**: 21 tests

### Phase 2: Priority 1 Adapters (Weeks 2-3)
- [x] GMX coverage boost (20 tests)
- [x] Backpack coverage boost (15 tests)
- [x] Lighter coverage boost (18 tests)
- **Total**: 53 tests

### Phase 3: Priority 1 Adapters Continued (Weeks 4-5)
- [x] dYdX coverage boost (20 tests)
- [x] Drift coverage boost (25 tests)
- [x] Jupiter coverage boost (15 tests)
- **Total**: 60 tests

### Phase 4: Critical Functionality (Week 6)
- [x] WebSocket reconnection tests (36 tests)
- [x] Error handling paths (52 tests)
- [x] Circuit breaker integration (12 tests)
- **Total**: 100 tests

### Phase 5: Integration & Polish (Week 7)
- [x] Multi-adapter tests (10 tests)
- [x] CI workflow setup
- [x] Coverage ratcheting implementation
- **Total**: 10 tests + infrastructure

**Grand Total**: ~255 new tests over 7 weeks

---

## 7. Success Criteria

### 7.1 Improvement-Specific Gates

**Console.log Migration**:
- ✅ Zero console.log in adapter files (except error-codes.ts)
- ✅ All logger calls verified in tests
- ✅ No output changes in existing tests

**Deprecated API Cleanup**:
- ✅ All deprecated exports removed
- ✅ Migration path documented
- ✅ Tests updated to use new APIs
- ✅ No compilation errors

**Zod Decision**:
- ✅ Either removed OR fully implemented
- ✅ If removed: no test changes
- ✅ If implemented: 50+ validation tests added

**TypeScript Strict Checks**:
- ✅ noUnusedLocals enabled
- ✅ noUnusedParameters enabled
- ✅ Zero compilation errors
- ✅ All tests pass

---

### 7.2 Coverage Gates

**Global Coverage**:
- ✅ 60% coverage minimum (up from 50%)
- ✅ No adapter below 55%
- ✅ Core modules maintain 85%+

**Per-Adapter Gates**:
- ✅ GMX: 60%+ (up from 29%)
- ✅ Backpack: 75%+ (up from 63%)
- ✅ Lighter: 75%+ (up from 67%)
- ✅ dYdX: 70%+ (up from 46%)
- ✅ Drift: 65%+ (up from 32%)
- ✅ Jupiter: 65%+ (up from 37%)

---

### 7.3 CI/CD Gates

**PR Validation**:
- ✅ Lint passes
- ✅ TypeScript compiles
- ✅ All tests pass
- ✅ Coverage thresholds met
- ✅ Build succeeds

**Production Tests**:
- ✅ Daily E2E tests pass
- ✅ API compatibility maintained
- ✅ No flaky tests (95%+ pass rate)

---

## 8. Risk Assessment

### 8.1 High-Risk Areas

**WebSocket Test Flakiness**:
- **Risk**: Timing issues in reconnection tests
- **Mitigation**: Use jest fake timers, increase timeouts, retry flaky tests
- **Test Pattern**: `jest.useFakeTimers()` for deterministic timing

**SDK Wrapper Dependencies**:
- **Risk**: External SDK updates break mocks
- **Mitigation**: Version pin SDKs, test against real testnet daily
- **Test Pattern**: Abstract SDK calls, mock at interface boundary

**Async Generator Testing**:
- **Risk**: watch* methods hard to test
- **Mitigation**: Use async iteration helpers, timeout wrappers
- **Test Pattern**: `for await (const data of stream) { ... }`

---

### 8.2 Low-Risk Areas

**Normalizer Tests**: Pure functions, easy to test
**Error Mapping Tests**: Deterministic, no external dependencies
**Utility Function Tests**: Already high coverage, well-tested

---

## 9. Tooling & Infrastructure

### 9.1 Test Utilities

**Create**: `tests/utils/test-helpers.ts`

```typescript
// Mock response factory
export function createMockResponse<T>(data: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response;
}

// WebSocket mock helper
export function createMockWebSocket() {
  const handlers: Record<string, Function[]> = {};
  return {
    on: jest.fn((event: string, handler: Function) => {
      handlers[event] = handlers[event] || [];
      handlers[event].push(handler);
    }),
    emit: (event: string, ...args: any[]) => {
      handlers[event]?.forEach(h => h(...args));
    },
    send: jest.fn(),
    close: jest.fn(),
  };
}

// Async generator test helper
export async function collectStreamData<T>(
  stream: AsyncGenerator<T>,
  count: number,
  timeout = 5000
): Promise<T[]> {
  const results: T[] = [];
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Stream timeout')), timeout)
  );

  for (let i = 0; i < count; i++) {
    const result = await Promise.race([stream.next(), timeoutPromise]);
    if (result.done) break;
    results.push(result.value);
  }

  return results;
}
```

---

### 9.2 Coverage Reporting

**Add to package.json**:

```json
{
  "scripts": {
    "test:coverage:report": "jest --coverage && open coverage/lcov-report/index.html",
    "test:coverage:summary": "jest --coverage --coverageReporters=text-summary",
    "test:coverage:diff": "jest --coverage --changedSince=master"
  }
}
```

**Coverage Reporters**:
- `lcov`: HTML report for local viewing
- `text-summary`: Console output for CI
- `json-summary`: For Codecov integration

---

## 10. Appendix: Test File Locations

**Full Test Directory Structure**:

```
tests/
├── unit/                           # Unit tests (isolated, fast)
│   ├── core/                       # Core functionality tests
│   │   ├── circuit-breaker.test.ts
│   │   ├── rate-limiter.test.ts
│   │   └── retry.test.ts
│   ├── monitoring/                 # Metrics tests
│   ├── websocket/                  # WebSocket client tests
│   ├── logging-migration.test.ts   # NEW - Logger migration verification
│   ├── deprecated-api-removal.test.ts # NEW - Deprecated cleanup
│   ├── typescript-strict-checks.test.ts # NEW - TS config verification
│   ├── gmx-order-builder.test.ts   # NEW - GMX coverage
│   ├── backpack-signing.test.ts    # NEW - Backpack coverage
│   ├── lighter-wasm-mode.test.ts   # NEW - Lighter coverage
│   ├── dydx-normalizer.test.ts     # NEW - dYdX coverage
│   ├── drift-client-wrapper.test.ts # NEW - Drift coverage
│   ├── drift-normalizer.test.ts    # NEW - Drift coverage
│   ├── jupiter-auth-expanded.test.ts # NEW - Jupiter coverage
│   └── [adapter]-*.test.ts         # Existing adapter unit tests
│
├── integration/                    # Integration tests (mocked APIs)
│   ├── monitoring/                 # Prometheus integration
│   ├── backpack-websocket.test.ts  # NEW - Backpack WS
│   ├── lighter-websocket-streams.test.ts # NEW - Lighter WS
│   ├── dydx-sdk-wrapper.test.ts    # NEW - dYdX SDK
│   ├── drift-auth.test.ts          # NEW - Drift auth
│   ├── jupiter-adapter-expanded.test.ts # NEW - Jupiter
│   ├── websocket-reconnection.test.ts # NEW - WS reconnection
│   ├── error-handling.test.ts      # NEW - Error paths
│   ├── circuit-breaker-adapters.test.ts # NEW - Circuit breaker
│   ├── multi-adapter.test.ts       # NEW - Multi-adapter
│   └── [adapter]-adapter.test.ts   # Existing integration tests
│
├── api-contracts/                  # API contract tests (schemas)
│   └── specs/
│       └── [adapter].contract.test.ts
│
├── e2e/                            # End-to-end tests
│   └── [future tests]
│
├── production/                     # Production testnet tests
│   ├── basic-flow.test.ts          # Daily run
│   ├── websocket-stability.test.ts # Daily run
│   └── stress-test.test.ts         # Daily run
│
├── fixtures/                       # Test data
│   └── [adapter]/
│       └── mock-responses.json
│
├── utils/                          # Test utilities
│   └── test-helpers.ts             # NEW - Shared test utilities
│
└── jest.setup.js                   # Global test setup
```

---

## Conclusion

This test strategy provides a comprehensive, phased approach to improving SDK quality while maintaining stability. The strategy prioritizes:

1. **Non-Breaking Changes**: All improvements maintain backward compatibility
2. **Incremental Coverage**: Gradual improvement from 50% → 60% → 70% → 80%
3. **Risk Mitigation**: Phased rollout, extensive testing of critical paths
4. **CI/CD Integration**: Automated enforcement of quality gates
5. **Maintainability**: Clear patterns, reusable utilities, good documentation

**Estimated Effort**:
- **Test Writing**: ~7 weeks (255 tests)
- **CI Setup**: 1 week
- **Coverage Ratcheting**: Ongoing (1-2% per sprint)

**Expected Outcomes**:
- ✅ 60%+ global coverage (from 50%)
- ✅ Zero console.log in production code
- ✅ Clean deprecated API surface
- ✅ Strict TypeScript compliance
- ✅ Robust WebSocket reconnection
- ✅ Comprehensive error handling

---

**Document Status**: ✅ Ready for P-1 Implementation Phase
**Next Steps**:
1. Review and approve test strategy
2. Proceed to implementation phase
3. Spawn implementation agents with File Ownership Map

