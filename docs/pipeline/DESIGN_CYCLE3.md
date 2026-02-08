# Cycle 3 Design: Test Coverage Expansion (Phases 3-5)

**Version**: 1.0
**Date**: 2026-02-08
**Phase**: P0 (Design)
**Lead**: p-architect
**Status**: Ready for Implementation

---

## Executive Summary

This document defines the implementation plan for Cycle 3 test coverage expansion targeting **~142 tests** across **7 categories** from the TEST_STRATEGY.md remaining items (Phases 3-5). The work is divided among **3 test writers** with clear file ownership boundaries to prevent conflicts.

**Current Baseline** (Post-Cycle 2):
- ✅ 4625 tests passing, 1 pre-existing failure (Lighter integration)
- ✅ 68.5% coverage (statements), 73.5% (functions)
- ✅ 0 TypeScript errors, strict mode enabled
- ✅ Build: PASS (ESM + CJS)

**Cycle 3 Targets**:
- **+142 tests** covering 7 critical areas
- **Coverage increase**: 68.5% → 70%+ (statements)
- **Zero regressions**: All existing tests must remain passing
- **Quality gates**: All new tests pass, build remains green

---

## 1. Scope Definition

### 1.1 Test Categories (7 areas, ~142 tests)

| Category | Test Count | Priority | Rationale |
|----------|-----------|----------|-----------|
| **dYdX Coverage** | 20 tests | P1 | 0% thresholds → 70% target (normalizer + SDK wrapper) |
| **Drift Coverage** | 25 tests | P1 | 0% thresholds → 65% target (client wrapper + normalizer + auth) |
| **Jupiter Coverage** | 15 tests | P1 | 0% thresholds → 65% target (auth + adapter expansion) |
| **WebSocket Reconnection** | 36 tests | P1 | Critical reliability (9 adapters × 4 tests) |
| **Error Handling Paths** | 52 tests | P1 | Defensive programming (13 adapters × 4 tests) |
| **Circuit Breaker Integration** | 12 tests | P2 | Resilience patterns (3 adapters × 4 scenarios) |
| **Multi-Adapter Tests** | 10 tests | P2 | Cross-adapter operations |

**Total**: 170 estimated tests (~142 core + 28 additional edge cases)

### 1.2 Coverage Impact Projection

**Before Cycle 3**:
- dYdX: 46% → **Target**: 70%
- Drift: 32% → **Target**: 65%
- Jupiter: 37% → **Target**: 65%
- Global: 68.5% → **Target**: 70%+

**Jest Threshold Updates** (to be applied after implementation):
```javascript
'./src/adapters/dydx/**/*.ts': {
  branches: 50,    // 0 → 50
  functions: 60,   // 0 → 60
  lines: 65,       // 0 → 65
  statements: 65   // 0 → 65
},
'./src/adapters/drift/**/*.ts': {
  branches: 45,    // 0 → 45
  functions: 55,   // 0 → 55
  lines: 60,       // 0 → 60
  statements: 60   // 0 → 60
},
'./src/adapters/jupiter/**/*.ts': {
  branches: 45,    // 0 → 45
  functions: 55,   // 0 → 55
  lines: 60,       // 0 → 60
  statements: 60   // 0 → 60
}
```

---

## 2. File Ownership Map (CRITICAL)

**3 Test Writers** with **exclusive ownership** to prevent merge conflicts.

### 2.1 p-test-writer-A: dYdX + Drift Adapters

**OWN EXCLUSIVELY**:
```
tests/unit/dydx-normalizer-extended.test.ts (NEW)
tests/unit/drift-client-wrapper.test.ts (NEW)
tests/unit/drift-normalizer-extended.test.ts (NEW)
tests/integration/dydx-adapter-extended.test.ts (NEW)
tests/integration/drift-auth-integration.test.ts (NEW)
```

**READ FOR CONTEXT** (do NOT modify):
```
src/adapters/dydx/DydxNormalizer.ts
src/adapters/dydx/DydxAdapter.ts
src/adapters/dydx/utils.ts
src/adapters/dydx/types.ts
src/adapters/drift/DriftClientWrapper.ts
src/adapters/drift/DriftNormalizer.ts
src/adapters/drift/DriftAuth.ts
src/adapters/drift/DriftAdapter.ts
tests/unit/gmx-order-builder.test.ts (reference pattern)
tests/unit/backpack-adapter-extended.test.ts (reference pattern)
```

**Test Count**: 45 tests (20 dYdX + 25 Drift)

---

### 2.2 p-test-writer-B: Jupiter + WebSocket Reconnection

**OWN EXCLUSIVELY**:
```
tests/unit/jupiter-auth-extended.test.ts (NEW - expand existing)
tests/integration/jupiter-adapter-extended.test.ts (NEW)
tests/integration/websocket-reconnection.test.ts (NEW - all 9 adapters)
```

**READ FOR CONTEXT** (do NOT modify):
```
src/adapters/jupiter/JupiterAuth.ts
src/adapters/jupiter/JupiterAdapter.ts
src/adapters/jupiter/utils.ts
src/adapters/*/[Adapter]WebSocket.ts (9 adapters with WS)
src/websocket/WebSocketManager.ts
tests/unit/lighter-normalizer-extended.test.ts (reference pattern)
tests/integration/grvt-websocket.test.ts (reference pattern)
```

**Test Count**: 51 tests (15 Jupiter + 36 WebSocket)

---

### 2.3 p-test-writer-C: Error Handling + Circuit Breaker + Multi-Adapter

**OWN EXCLUSIVELY**:
```
tests/integration/error-handling-paths.test.ts (NEW)
tests/integration/circuit-breaker-adapters.test.ts (NEW)
tests/integration/multi-adapter-operations.test.ts (NEW)
```

**READ FOR CONTEXT** (do NOT modify):
```
src/core/CircuitBreaker.ts
src/core/errors.ts
src/types/errors.ts
src/adapters/*/error-codes.ts (all 13 adapters)
tests/unit/retry.test.ts (reference pattern)
tests/integration/hyperliquid-adapter.test.ts (reference pattern)
```

**Test Count**: 74 tests (52 error + 12 circuit breaker + 10 multi-adapter)

---

## 3. Per-Agent Implementation Instructions

### 3.1 p-test-writer-A: dYdX + Drift Tests

#### Task Summary
Create comprehensive unit + integration tests for dYdX and Drift adapters to raise coverage from <50% to 65-70%.

#### Files to Create

**1. tests/unit/dydx-normalizer-extended.test.ts** (12 tests)

```typescript
/**
 * dYdX Normalizer Extended Tests
 *
 * Comprehensive tests for DydxNormalizer data transformation
 */

describe('DydxNormalizer', () => {
  // Symbol conversion
  test('should convert dYdX ticker to unified symbol', () => {
    // BTC-USD → BTC/USD:USD
  });

  // Market normalization
  test('should normalize market with step/tick size precision', () => {
    // Parse stepSize, tickSize for precision
  });

  test('should handle missing optional market fields', () => {
    // Test with minimal market data
  });

  // Order normalization
  test('should normalize MARKET order', () => {
    // status, side, type conversion
  });

  test('should normalize LIMIT order with price', () => {
    // Include price, timeInForce
  });

  test('should normalize STOP_LIMIT order', () => {
    // triggerPrice handling
  });

  // Position normalization
  test('should normalize long position', () => {
    // Positive size → long
  });

  test('should normalize short position', () => {
    // Negative size → short
  });

  // Trade normalization
  test('should normalize trade (fill)', () => {
    // Parse DydxFill
  });

  // Balance normalization
  test('should normalize subaccount balance', () => {
    // Equity, freeCollateral
  });

  // OrderBook normalization
  test('should normalize order book with bids/asks', () => {
    // Parse DydxOrderBookResponse
  });

  // Edge cases
  test('should handle empty/malformed data gracefully', () => {});
});
```

**Expected Test Count**: 12 tests

---

**2. tests/integration/dydx-adapter-extended.test.ts** (8 tests)

```typescript
/**
 * dYdX Adapter Integration Tests
 *
 * Tests SDK wrapper integration (mocked @dydx/v4-client)
 */

// Mock @dydx/v4-client SDK
jest.mock('@dydx/v4-client', () => ({
  IndexerClient: jest.fn().mockImplementation(() => ({
    markets: {
      getPerpetualMarkets: jest.fn().mockResolvedValue(mockMarkets),
    },
    account: {
      getSubaccounts: jest.fn().mockResolvedValue(mockSubaccounts),
    },
  })),
}));

describe('DydxAdapter Integration', () => {
  // Market data
  test('should fetch markets via IndexerClient', async () => {
    // Verify SDK call + normalization
  });

  // Trading (mocked)
  test('should create MARKET order', async () => {
    // Mock composeTx, sign, broadcast
  });

  test('should create LIMIT order with price', async () => {});

  // Account data
  test('should fetch positions', async () => {});

  test('should fetch open orders', async () => {});

  test('should fetch balances', async () => {});

  // Error handling
  test('should handle SDK initialization errors', async () => {});

  test('should handle API errors from IndexerClient', async () => {});
});
```

**Expected Test Count**: 8 tests

---

**3. tests/unit/drift-client-wrapper.test.ts** (12 tests)

```typescript
/**
 * Drift Client Wrapper Unit Tests
 *
 * Tests DriftClientWrapper without real SDK
 */

// Mock @drift-labs/sdk
jest.mock('@drift-labs/sdk', () => ({
  DriftClient: jest.fn().mockImplementation(() => ({
    subscribe: jest.fn().mockResolvedValue(true),
    fetchMarketsSummary: jest.fn(),
    placeOrders: jest.fn(),
    cancelOrder: jest.fn(),
    getUser: jest.fn(),
    getUserAccount: jest.fn(),
  })),
  initialize: jest.fn(),
}));

describe('DriftClientWrapper', () => {
  // Initialization
  test('should initialize with connection and keypair', async () => {});

  test('should handle devnet vs mainnet', () => {});

  // Market data
  test('should fetch markets via DriftClient', async () => {});

  test('should handle market fetch errors', async () => {});

  // Order placement
  test('should place MARKET order', async () => {});

  test('should place LIMIT order', async () => {});

  test('should place STOP order', async () => {});

  // Order cancellation
  test('should cancel order by ID', async () => {});

  // Position tracking
  test('should fetch positions', async () => {});

  test('should calculate unrealized PnL', async () => {});

  // Error handling
  test('should handle uninitialized client', async () => {});

  test('should handle transaction failures', async () => {});
});
```

**Expected Test Count**: 12 tests

---

**4. tests/unit/drift-normalizer-extended.test.ts** (8 tests)

```typescript
/**
 * Drift Normalizer Extended Tests
 */

describe('DriftNormalizer', () => {
  test('should normalize market with oracle price', () => {});
  test('should normalize order with reduceOnly flag', () => {});
  test('should normalize position with leverage', () => {});
  test('should normalize balance with unsettled PnL', () => {});
  test('should handle perp vs spot markets', () => {});
  test('should normalize funding rate', () => {});
  test('should handle missing optional fields', () => {});
  test('should convert Drift symbols to unified', () => {});
});
```

**Expected Test Count**: 8 tests

---

**5. tests/integration/drift-auth-integration.test.ts** (5 tests)

```typescript
/**
 * Drift Auth Integration Tests
 */

describe('DriftAuth Integration', () => {
  test('should connect with Solana keypair', async () => {});
  test('should sign transaction', async () => {});
  test('should handle invalid keypair', async () => {});
  test('should manage sub-account IDs', async () => {});
  test('should handle connection errors', async () => {});
});
```

**Expected Test Count**: 5 tests

---

#### Completion Criteria for p-test-writer-A

- ✅ **45 tests created** (12 + 8 + 12 + 8 + 5)
- ✅ All tests pass individually and in full suite
- ✅ dYdX coverage: 46% → 65%+
- ✅ Drift coverage: 32% → 60%+
- ✅ No modifications to source files
- ✅ Mock patterns follow existing conventions (see gmx-order-builder.test.ts)

#### Summary for p-test-writer-A

Write the 5 test files above to `docs/pipeline/DESIGN_CYCLE3.md` and send summary to team-lead: "Completed 45 dYdX/Drift tests (12 dydx-normalizer + 8 dydx-adapter + 12 drift-wrapper + 8 drift-normalizer + 5 drift-auth). All tests passing, coverage improved."

---

### 3.2 p-test-writer-B: Jupiter + WebSocket Reconnection Tests

#### Task Summary
Expand Jupiter adapter tests and create comprehensive WebSocket reconnection tests for all 9 adapters with WS support.

#### Files to Create

**1. tests/unit/jupiter-auth-extended.test.ts** (8 tests)

```typescript
/**
 * Jupiter Auth Extended Tests
 *
 * Expand existing jupiter-auth.test.ts with edge cases
 */

describe('JupiterAuth Extended', () => {
  // Solana signing
  test('should sign transaction with Keypair', async () => {});
  test('should sign transaction with VersionedTransaction', async () => {});
  test('should handle signature failures', async () => {});

  // Transaction building
  test('should build swap transaction', async () => {});
  test('should add priority fee', async () => {});

  // Error handling
  test('should handle invalid Solana RPC', async () => {});
  test('should handle insufficient SOL for fees', async () => {});
  test('should validate keypair format', () => {});
});
```

**Expected Test Count**: 8 tests

---

**2. tests/integration/jupiter-adapter-extended.test.ts** (7 tests)

```typescript
/**
 * Jupiter Adapter Integration Tests
 */

// Mock @solana/web3.js and Jupiter SDK
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn(),
  PublicKey: jest.fn(),
  VersionedTransaction: jest.fn(),
}));

describe('JupiterAdapter Integration', () => {
  test('should fetch markets (token pairs)', async () => {});
  test('should create swap order', async () => {});
  test('should cancel order (not supported)', async () => {
    // Expect NotSupportedError
  });
  test('should fetch balances', async () => {});
  test('should handle Solana RPC errors', async () => {});
  test('should handle Jupiter API rate limits', async () => {});
  test('should normalize Jupiter quote response', async () => {});
});
```

**Expected Test Count**: 7 tests

---

**3. tests/integration/websocket-reconnection.test.ts** (36 tests)

```typescript
/**
 * WebSocket Reconnection Tests
 *
 * Tests reconnection logic for all 9 adapters with WS support:
 * Hyperliquid, GRVT, Paradex, Extended, Nado, Variational, Backpack, Lighter, Drift
 */

// Mock ws module
jest.mock('ws', () => ({
  WebSocket: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    send: jest.fn(),
    close: jest.fn(),
    readyState: 1, // OPEN
  })),
}));

describe('WebSocket Reconnection', () => {
  // Pattern repeated for each adapter (9 × 4 = 36 tests)

  describe('Hyperliquid WebSocket', () => {
    test('should reconnect after connection loss', async () => {
      // 1. Establish connection
      // 2. Simulate disconnect (emit 'close')
      // 3. Wait for reconnection (2s delay)
      // 4. Verify reconnection (WebSocket called 2x)
    });

    test('should resubscribe after reconnection', async () => {
      // Verify subscriptions restored after reconnect
    });

    test('should handle max retry attempts', async () => {
      // Override config: maxAttempts: 3
      // Simulate 3 failures → expect WebSocketDisconnectedError
    });

    test('should emit proper events during reconnection', async () => {
      // Listen for 'reconnecting', 'reconnected' events
    });
  });

  // Repeat for: GRVT, Paradex, Extended, Nado, Variational, Backpack, Lighter, Drift
  // Each adapter: 4 tests × 9 = 36 tests

  describe('GRVT WebSocket', () => { /* 4 tests */ });
  describe('Paradex WebSocket', () => { /* 4 tests */ });
  describe('Extended WebSocket', () => { /* 4 tests */ });
  describe('Nado WebSocket', () => { /* 4 tests */ });
  describe('Variational WebSocket', () => { /* 4 tests */ });
  describe('Backpack WebSocket', () => { /* 4 tests */ });
  describe('Lighter WebSocket', () => { /* 4 tests */ });
  describe('Drift WebSocket', () => { /* 4 tests */ });
});
```

**Expected Test Count**: 36 tests (9 adapters × 4 tests)

---

#### Completion Criteria for p-test-writer-B

- ✅ **51 tests created** (8 + 7 + 36)
- ✅ All tests pass individually and in full suite
- ✅ Jupiter coverage: 37% → 60%+
- ✅ WebSocket reconnection logic verified for 9 adapters
- ✅ Mock patterns follow existing conventions (see grvt-websocket.test.ts)

#### Summary for p-test-writer-B

Write the 3 test files above and send summary to team-lead: "Completed 51 Jupiter/WebSocket tests (8 jupiter-auth + 7 jupiter-adapter + 36 websocket-reconnection). All tests passing, reconnection logic verified for 9 adapters."

---

### 3.3 p-test-writer-C: Error Handling + Circuit Breaker + Multi-Adapter

#### Task Summary
Create comprehensive error handling, circuit breaker integration, and multi-adapter operation tests.

#### Files to Create

**1. tests/integration/error-handling-paths.test.ts** (52 tests)

```typescript
/**
 * Error Handling Paths Tests
 *
 * Tests error handling for all 13 adapters:
 * Hyperliquid, GRVT, Paradex, EdgeX, Extended, Nado, Variational, Backpack, Lighter, dYdX, Drift, Jupiter, GMX
 */

describe('Error Handling', () => {
  // Pattern repeated for each adapter (13 × 4 = 52 tests)

  describe('Hyperliquid Error Handling', () => {
    test('should handle rate limit errors (429)', async () => {
      // Mock 429 response → verify RateLimitError thrown
    });

    test('should handle network timeouts', async () => {
      // Mock timeout → verify NetworkError
    });

    test('should handle invalid API responses', async () => {
      // Mock malformed JSON → verify ParsingError
    });

    test('should handle exchange downtime (5xx)', async () => {
      // Mock 503 → verify ExchangeUnavailableError
    });
  });

  // Repeat for: GRVT, Paradex, EdgeX, Extended, Nado, Variational, Backpack, Lighter, dYdX, Drift, Jupiter, GMX
  // Each adapter: 4 tests × 13 = 52 tests

  describe('GRVT Error Handling', () => { /* 4 tests */ });
  describe('Paradex Error Handling', () => { /* 4 tests */ });
  // ... (11 more adapters)
});
```

**Expected Test Count**: 52 tests (13 adapters × 4 tests)

---

**2. tests/integration/circuit-breaker-adapters.test.ts** (12 tests)

```typescript
/**
 * Circuit Breaker Integration Tests
 *
 * Tests CircuitBreaker behavior with adapters
 */

import { CircuitBreaker } from '../../src/core/CircuitBreaker.js';

describe('Circuit Breaker Integration', () => {
  // Test with 3 representative adapters: Hyperliquid, Backpack, dYdX

  describe('Hyperliquid Circuit Breaker', () => {
    test('should open circuit after repeated failures', async () => {
      // Mock 5 consecutive failures → circuit OPEN
    });

    test('should transition to HALF_OPEN after timeout', async () => {
      // Fast-forward time → circuit HALF_OPEN
    });

    test('should close circuit on successful requests', async () => {
      // Successful request in HALF_OPEN → circuit CLOSED
    });

    test('should reopen on failure in HALF_OPEN', async () => {
      // Failure in HALF_OPEN → circuit OPEN again
    });
  });

  describe('Backpack Circuit Breaker', () => { /* 4 tests */ });
  describe('dYdX Circuit Breaker', () => { /* 4 tests */ });
});
```

**Expected Test Count**: 12 tests (3 adapters × 4 scenarios)

---

**3. tests/integration/multi-adapter-operations.test.ts** (10 tests)

```typescript
/**
 * Multi-Adapter Operations Tests
 *
 * Tests operations across multiple adapters simultaneously
 */

describe('Multi-Adapter Operations', () => {
  test('should fetch markets from all adapters in parallel', async () => {
    // Create 13 adapters, call fetchMarkets() on all
    // Use Promise.all, verify all succeed
  });

  test('should handle mixed success/failure scenarios', async () => {
    // Mock 3 adapters succeed, 2 fail
    // Verify Promise.allSettled behavior
  });

  test('should compare normalized data across adapters', async () => {
    // Fetch BTC-PERP from 3 adapters
    // Verify all return same symbol format (BTC/USD:USD)
  });

  test('should handle rate limits across multiple adapters', async () => {
    // Trigger rate limit on 1 adapter
    // Verify others continue working
  });

  test('should isolate errors per adapter', async () => {
    // Error in adapter A shouldn't affect adapter B
  });

  test('should create orders on multiple exchanges', async () => {
    // Place order on Hyperliquid + Backpack simultaneously
  });

  test('should cancel orders across adapters', async () => {});

  test('should aggregate balances from multiple adapters', async () => {});

  test('should watch order books from multiple adapters', async () => {
    // Test WS subscriptions to 3 adapters
  });

  test('should handle adapter initialization failures', async () => {
    // 1 adapter fails to initialize → others succeed
  });
});
```

**Expected Test Count**: 10 tests

---

#### Completion Criteria for p-test-writer-C

- ✅ **74 tests created** (52 + 12 + 10)
- ✅ All tests pass individually and in full suite
- ✅ Error handling verified for 13 adapters
- ✅ Circuit breaker logic confirmed
- ✅ Multi-adapter operations tested

#### Summary for p-test-writer-C

Write the 3 test files above and send summary to team-lead: "Completed 74 resilience tests (52 error-handling + 12 circuit-breaker + 10 multi-adapter). All tests passing, error paths and circuit breaker verified."

---

## 4. Priority Order & Dependencies

### 4.1 Execution Order (Parallel)

All 3 test writers can work **in parallel** since file ownership is exclusive.

**No dependencies** between agents — spawn all 3 simultaneously:

1. **p-test-writer-A**: dYdX + Drift (45 tests)
2. **p-test-writer-B**: Jupiter + WebSocket (51 tests)
3. **p-test-writer-C**: Error + Circuit Breaker + Multi-Adapter (74 tests)

**Total Time**: Single sprint (all agents working concurrently)

### 4.2 Merge Order (Sequential, but not critical)

Since files are exclusive, merge conflicts are impossible. Order doesn't matter, but suggested sequence:

1. Merge p-test-writer-A (dYdX/Drift) — establishes normalizer patterns
2. Merge p-test-writer-B (Jupiter/WS) — adds WS reconnection patterns
3. Merge p-test-writer-C (Error/CB/Multi) — integration patterns

---

## 5. Quality Gates

### 5.1 Per-Agent Quality Gates

**Before marking task as completed**, each test writer MUST verify:

#### Build Quality Gates
- ✅ `npm run typecheck` — 0 errors (TypeScript compiles)
- ✅ `npm run build` — Build succeeds (ESM + CJS)
- ✅ `npm run lint` — ESLint passes

#### Test Quality Gates
- ✅ `npm test -- [your-test-file]` — All YOUR tests pass individually
- ✅ `npm test` — Full suite passes (no existing tests broken)
- ✅ Test count matches expected (see per-agent instructions)

#### Coverage Quality Gates
- ✅ `npm run test:coverage` — Coverage did NOT decrease
- ✅ For p-test-writer-A: dYdX 65%+, Drift 60%+
- ✅ For p-test-writer-B: Jupiter 60%+
- ✅ For all: Global coverage ≥68.5% (no decrease)

#### Code Quality Gates
- ✅ No modifications to source files (src/**/*.ts) — TESTS ONLY
- ✅ Mock patterns follow existing conventions
- ✅ No console.log statements in test files
- ✅ Test descriptions are clear and descriptive

### 5.2 Global Quality Gates (P2 QA)

After all 3 agents complete, QA agent (p-qa) will verify:

- ✅ **Total test count**: 4625 + 170 = **4795 tests passing**
- ✅ **Coverage**: 68.5% → **70%+** statements
- ✅ **Zero regressions**: Pre-existing 1 failure unchanged, no new failures
- ✅ **Build**: Remains green (ESM + CJS)
- ✅ **TypeScript**: 0 errors (strict mode maintained)

---

## 6. Risk Assessment

### 6.1 High-Risk Areas

#### Risk: SDK Wrapper Mocking Complexity
**Affected**: dYdX (IndexerClient), Drift (DriftClient), Jupiter (Connection)

**Mitigation**:
- Reference existing patterns: `tests/unit/grvt-sdk-wrapper.test.ts`
- Mock at module level: `jest.mock('@dydx/v4-client')`
- Use minimal SDK surface area — mock only methods called by adapter
- Test adapter behavior, NOT SDK behavior

**Example**:
```typescript
jest.mock('@dydx/v4-client', () => ({
  IndexerClient: jest.fn().mockImplementation(() => ({
    markets: { getPerpetualMarkets: jest.fn().mockResolvedValue(mockData) },
  })),
}));
```

---

#### Risk: WebSocket Test Flakiness
**Affected**: p-test-writer-B (websocket-reconnection.test.ts)

**Mitigation**:
- Use `jest.useFakeTimers()` for deterministic timing
- Mock `ws` module completely — no real WebSocket connections
- Increase test timeout if needed: `jest.setTimeout(15000)`
- Use async/await + Promise wrappers for event handling

**Example**:
```typescript
test('should reconnect after disconnect', async () => {
  jest.useFakeTimers();

  // Simulate disconnect
  mockWs.emit('close', 1006);

  // Fast-forward to reconnection
  jest.advanceTimersByTime(2000);

  // Verify
  expect(WebSocket).toHaveBeenCalledTimes(2);

  jest.useRealTimers();
});
```

---

#### Risk: Async Generator Testing (watch* methods)
**Affected**: p-test-writer-B (WebSocket streams), p-test-writer-C (multi-adapter)

**Mitigation**:
- Use `for await` loops with timeout wrappers
- Reference pattern: `tests/integration/grvt-websocket.test.ts`
- Helper function for collecting stream data:

```typescript
async function collectStreamData<T>(
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

### 6.2 Medium-Risk Areas

#### Risk: Circuit Breaker State Management
**Affected**: p-test-writer-C (circuit-breaker-adapters.test.ts)

**Mitigation**:
- Use separate CircuitBreaker instances per test
- Reset state in `beforeEach` hooks
- Mock time for OPEN → HALF_OPEN transitions: `jest.useFakeTimers()`

---

#### Risk: Multi-Adapter Test Isolation
**Affected**: p-test-writer-C (multi-adapter-operations.test.ts)

**Mitigation**:
- Create fresh adapter instances per test
- Clear mocks in `beforeEach`: `jest.clearAllMocks()`
- Use `Promise.allSettled` for concurrent operations

---

### 6.3 Low-Risk Areas

✅ **Normalizer Tests**: Pure functions, easy to test (see existing lighter-normalizer-extended.test.ts)
✅ **Error Mapping Tests**: Deterministic, no external dependencies
✅ **Auth Tests**: Mock crypto libraries, no real signing required

---

## 7. Mock Patterns Reference

### 7.1 HTTP Client Mocking

**Pattern** (from existing tests):
```typescript
jest.mock('../../src/core/http/HTTPClient.js', () => ({
  HTTPClient: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue({ data: mockData }),
    post: jest.fn().mockResolvedValue({ data: mockData }),
  })),
}));
```

### 7.2 WebSocket Mocking

**Pattern**:
```typescript
jest.mock('ws', () => ({
  WebSocket: jest.fn().mockImplementation(() => {
    const handlers: Record<string, Function[]> = {};
    return {
      on: jest.fn((event, handler) => {
        handlers[event] = handlers[event] || [];
        handlers[event].push(handler);
      }),
      emit: (event, ...args) => handlers[event]?.forEach(h => h(...args)),
      send: jest.fn(),
      close: jest.fn(),
      readyState: 1, // OPEN
    };
  }),
}));
```

### 7.3 External SDK Mocking

**Pattern**:
```typescript
// Mock before imports
jest.mock('@dydx/v4-client', () => ({
  IndexerClient: jest.fn().mockImplementation(() => ({
    markets: {
      getPerpetualMarkets: jest.fn().mockResolvedValue(mockMarkets),
    },
  })),
}));

// Use in tests
const adapter = new DydxAdapter({ apiKey: 'test' });
const markets = await adapter.fetchMarkets();
expect(markets).toHaveLength(10);
```

### 7.4 Solana/Crypto Mocking

**Pattern**:
```typescript
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getLatestBlockhash: jest.fn().mockResolvedValue({ blockhash: 'abc123' }),
    sendTransaction: jest.fn().mockResolvedValue('signature'),
  })),
  Keypair: {
    fromSecretKey: jest.fn(() => mockKeypair),
  },
  PublicKey: jest.fn((str) => ({ toString: () => str })),
}));
```

---

## 8. Test File Structure Template

**Standard structure** for all new test files:

```typescript
/**
 * [Component] Tests
 *
 * Brief description of what's being tested
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { TargetClass } from '../../src/path/to/class.js';

// Mocks (if needed)
jest.mock('module-name', () => ({ /* ... */ }));

describe('TargetClass', () => {
  let instance: TargetClass;
  let mockDependency: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDependency = /* mock setup */;
    instance = new TargetClass(config);
  });

  describe('feature group 1', () => {
    test('should handle normal case', () => {
      // Arrange
      const input = /* ... */;

      // Act
      const result = instance.method(input);

      // Assert
      expect(result).toBe(expected);
    });

    test('should handle edge case', () => {
      // ...
    });
  });

  describe('feature group 2', () => {
    // ...
  });
});
```

---

## 9. Success Criteria Summary

### 9.1 Quantitative Metrics

| Metric | Before (Cycle 2) | Target (Cycle 3) | Status |
|--------|-----------------|------------------|--------|
| **Tests Passed** | 4625 | 4795 | ✅ +170 |
| **Tests Failed** | 1 (pre-existing) | 1 | ✅ No new failures |
| **Coverage (Stmts)** | 68.5% | 70%+ | ✅ +1.5% |
| **dYdX Coverage** | 46% | 65%+ | ✅ +19% |
| **Drift Coverage** | 32% | 60%+ | ✅ +28% |
| **Jupiter Coverage** | 37% | 60%+ | ✅ +23% |
| **TS Errors** | 0 | 0 | ✅ Maintained |
| **Build Status** | PASS | PASS | ✅ Maintained |

### 9.2 Qualitative Criteria

- ✅ All 170 tests are **meaningful** (not superficial)
- ✅ WebSocket reconnection logic **verified** for 9 adapters
- ✅ Error handling **comprehensive** for 13 adapters
- ✅ Circuit breaker **integration tested**
- ✅ Multi-adapter operations **validated**
- ✅ Mock patterns **consistent** with existing tests
- ✅ Test code is **readable** and **maintainable**

---

## 10. Deliverables

### 10.1 Test Files (8 new files)

**p-test-writer-A** (5 files):
1. `tests/unit/dydx-normalizer-extended.test.ts`
2. `tests/integration/dydx-adapter-extended.test.ts`
3. `tests/unit/drift-client-wrapper.test.ts`
4. `tests/unit/drift-normalizer-extended.test.ts`
5. `tests/integration/drift-auth-integration.test.ts`

**p-test-writer-B** (3 files):
1. `tests/unit/jupiter-auth-extended.test.ts`
2. `tests/integration/jupiter-adapter-extended.test.ts`
3. `tests/integration/websocket-reconnection.test.ts`

**p-test-writer-C** (3 files):
1. `tests/integration/error-handling-paths.test.ts`
2. `tests/integration/circuit-breaker-adapters.test.ts`
3. `tests/integration/multi-adapter-operations.test.ts`

**Total**: 11 new test files (8 listed above + potential edge case files)

### 10.2 Coverage Reports

After implementation:
- `coverage-summary-before.txt` (baseline)
- `coverage-summary-after.txt` (post-Cycle 3)
- `coverage-diff.txt` (comparison)

### 10.3 Updated Config

`jest.config.js` — Update thresholds for dYdX, Drift, Jupiter (see Section 1.2)

---

## 11. Post-Implementation Actions

After all 3 agents complete and QA passes:

1. **Update jest.config.js** with new coverage thresholds (Section 1.2)
2. **Run full test suite** to confirm 4795 tests pass
3. **Generate coverage report** and verify 70%+ global
4. **Update PROGRESS.md** with Cycle 3 metrics
5. **Create QA_REPORT_CYCLE3.md** with detailed results
6. **Commit changes** with message:
   ```
   test: add 170 tests for Cycle 3 (dYdX, Drift, Jupiter, WS, errors, CB)

   - dYdX: 20 tests (normalizer + adapter)
   - Drift: 25 tests (client wrapper + normalizer + auth)
   - Jupiter: 15 tests (auth + adapter)
   - WebSocket reconnection: 36 tests (9 adapters)
   - Error handling: 52 tests (13 adapters)
   - Circuit breaker: 12 tests (3 adapters)
   - Multi-adapter: 10 tests

   Coverage: 68.5% → 70%+
   ```

---

## 12. Tricky Areas & Tips

### 12.1 For p-test-writer-A (dYdX/Drift)

**Tricky**: dYdX SDK mocking
- **Tip**: Mock `IndexerClient` constructor, not the class itself
- **Tip**: Use `mockResolvedValue` for async methods
- **Tip**: Don't test SDK behavior — test adapter's use of SDK

**Tricky**: Drift BigInt handling
- **Tip**: Use `BigInt` literals: `1000000000n` not `BigInt(1000000000)`
- **Tip**: Mock SDK responses with BigInt values

**Tricky**: Symbol conversions
- **Tip**: Test both directions: `BTC-USD → BTC/USD:USD` and reverse

---

### 12.2 For p-test-writer-B (Jupiter/WS)

**Tricky**: WebSocket timing issues
- **Tip**: Always use `jest.useFakeTimers()` for reconnection tests
- **Tip**: Don't use real delays (`setTimeout`) — use `jest.advanceTimersByTime()`
- **Tip**: Clean up timers: `jest.useRealTimers()` in `afterEach`

**Tricky**: Async generators (watch* methods)
- **Tip**: Use `for await` loops with timeout wrappers
- **Tip**: Mock WebSocket message events to trigger generator yields
- **Tip**: Test termination: verify generator closes on `close` event

**Tricky**: 9 adapters in one file
- **Tip**: Create reusable test helper function:
  ```typescript
  function testAdapterReconnection(adapterName: string, AdapterClass: any) {
    describe(`${adapterName} WebSocket`, () => {
      // 4 tests here
    });
  }
  ```

---

### 12.3 For p-test-writer-C (Error/CB/Multi)

**Tricky**: Circuit breaker state transitions
- **Tip**: Use `jest.useFakeTimers()` to fast-forward time
- **Tip**: Verify state: `expect(circuit.state).toBe('OPEN')`
- **Tip**: Test idempotency: calling `executeRequest` multiple times in OPEN should not increment failure count

**Tricky**: Multi-adapter test isolation
- **Tip**: Create adapter instances inside each test, not in `beforeEach`
- **Tip**: Use `Promise.allSettled` to handle mixed success/failure
- **Tip**: Mock HTTP client per-adapter (not global)

**Tricky**: Error type assertions
- **Tip**: Use `expect(error).toBeInstanceOf(RateLimitError)`
- **Tip**: Verify error properties: `expect(error.statusCode).toBe(429)`

---

## 13. Communication Protocol

### 13.1 Progress Updates

Each agent should send **brief status updates** to team-lead:

**After completing each file**:
```
Completed [filename] — [X] tests passing
```

**After completing all files**:
```
All [count] tests complete. Running full suite...
```

**After full suite passes**:
```
Full suite passes: [total] tests passing. Coverage: [X]%. Ready for merge.
```

### 13.2 Blocker Reporting

If blocked, send message to team-lead immediately:

```
BLOCKED: [brief description]
- Context: [what you were doing]
- Issue: [specific problem]
- Attempted: [what you tried]
- Need: [what would unblock you]
```

### 13.3 Completion Message

Send final summary to team-lead:

```
COMPLETED: [Agent name] — [Task ID]

Summary:
- Files created: [count]
- Tests added: [count]
- Tests passing: [count]/[count]
- Coverage impact: [adapter name] [before]% → [after]%
- Build status: PASS
- Ready for QA: YES

Next: Awaiting merge approval
```

---

## Appendix A: Test Count Breakdown

| Agent | Category | File | Tests | Total |
|-------|----------|------|-------|-------|
| **A** | dYdX | dydx-normalizer-extended | 12 | 45 |
| **A** | dYdX | dydx-adapter-extended | 8 | |
| **A** | Drift | drift-client-wrapper | 12 | |
| **A** | Drift | drift-normalizer-extended | 8 | |
| **A** | Drift | drift-auth-integration | 5 | |
| **B** | Jupiter | jupiter-auth-extended | 8 | 51 |
| **B** | Jupiter | jupiter-adapter-extended | 7 | |
| **B** | WS | websocket-reconnection | 36 | |
| **C** | Error | error-handling-paths | 52 | 74 |
| **C** | CB | circuit-breaker-adapters | 12 | |
| **C** | Multi | multi-adapter-operations | 10 | |
| | | **TOTAL** | **170** | **170** |

---

## Appendix B: Coverage Target Details

### Before Cycle 3
```
src/adapters/dydx/**/*.ts
  statements: 46% → target: 65%
  functions: 48% → target: 60%

src/adapters/drift/**/*.ts
  statements: 32% → target: 60%
  functions: 35% → target: 55%

src/adapters/jupiter/**/*.ts
  statements: 37% → target: 60%
  functions: 40% → target: 55%
```

### After Cycle 3 (Expected)
```
Global:
  statements: 68.5% → 70%+
  functions: 73.5% → 75%+
  branches: 64.6% → 66%+

dYdX: 65%+ (all metrics)
Drift: 60%+ (all metrics)
Jupiter: 60%+ (all metrics)
```

---

## Appendix C: Reference Files

**For Mock Patterns**:
- `tests/unit/gmx-order-builder.test.ts` — SDK wrapper mocking
- `tests/unit/backpack-adapter-extended.test.ts` — HTTP client mocking
- `tests/unit/lighter-normalizer-extended.test.ts` — Normalizer testing
- `tests/integration/grvt-websocket.test.ts` — WebSocket testing
- `tests/unit/retry.test.ts` — Error handling patterns

**For Source Understanding**:
- `src/adapters/dydx/DydxNormalizer.ts` — dYdX normalizer
- `src/adapters/drift/DriftClientWrapper.ts` — Drift SDK wrapper
- `src/adapters/jupiter/JupiterAdapter.ts` — Jupiter adapter
- `src/core/CircuitBreaker.ts` — Circuit breaker implementation
- `src/websocket/WebSocketManager.ts` — WebSocket base class

---

## Document Status

**Status**: ✅ **READY FOR IMPLEMENTATION**

**Next Steps**:
1. Team lead spawns 3 test writers (p-test-writer-A, p-test-writer-B, p-test-writer-C)
2. Agents work in parallel (no dependencies)
3. Each agent completes their files and verifies quality gates
4. Team lead merges all changes
5. QA agent (p-qa) verifies Cycle 3 completion

**Estimated Timeline**: 1-2 days (parallel execution)

---

**Design Completed**: 2026-02-08
**Architect**: p-architect
**Approved**: Pending team-lead review
