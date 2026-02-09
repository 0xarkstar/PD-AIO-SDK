# Stream C: Error Standardization Report

## Task C1: BaseAdapter `Error()` → Typed Errors

**File**: `src/adapters/base/BaseAdapter.ts`

### Replacements Made: 27 total

| Category | Count | Old Error | New Error | Code |
|----------|-------|-----------|-----------|------|
| "must be implemented by subclass" | 23 | `new Error(...)` | `new NotSupportedError(...)` | `NOT_IMPLEMENTED` |
| `ensureInitialized()` | 1 | `new Error(...)` | `new PerpDEXError(...)` | `NOT_INITIALIZED` |
| Batch all-failed (createBatchOrders) | 1 | `new Error(...)` | `new PerpDEXError(...)` | `BATCH_FAILED` |
| Batch all-failed (cancelBatchOrders) | 1 | `new Error(...)` | `new PerpDEXError(...)` | `BATCH_FAILED` |
| Batch not-implemented (createBatchOrders) | 1 | `new Error(...)` | `new NotSupportedError(...)` | `NOT_IMPLEMENTED` |

**Methods converted (NOT_IMPLEMENTED):**
fetchOHLCV, fetchTickers, fetchCurrencies, fetchStatus, fetchTime, fetchDeposits, fetchWithdrawals, fetchLedger, fetchFundingHistory, createBatchOrders, cancelBatchOrders, editOrder, fetchOrder, fetchOpenOrders, fetchClosedOrders, setMarginMode, watchOrderBook, watchTrades, watchTicker, watchTickers, watchPositions, watchOrders, watchBalance, watchFundingRate, watchOHLCV, watchMyTrades, fetchUserFees, fetchPortfolio, fetchRateLimitStatus

**Result**: Zero `throw new Error(` remaining in BaseAdapter.ts.

---

## Task C2: Production `as any` Cleanup

### DriftClientWrapper.ts
- `private driftClient: any` — **Kept as `any`** with eslint-disable comment explaining why: SDK is dynamically imported via `import('@drift-labs/sdk')` at runtime; types are not available at compile time.
- Other `as any` casts (Wallet, BulkAccountLoader, connection) — **Left unchanged**: these exist to handle version mismatches between `@solana/web3.js` versions (SDK may use a different version than the project).

### metrics-server.ts
- `undefined as any` on line 104 — **Fixed**: Changed config type to make `metrics` optional (`metrics?: PrometheusMetrics`), replaced `undefined as any` with `undefined`. Added `!` non-null assertion after the guard check that throws if metrics is falsy.

### NadoAdapter.ts
- `ticker.info as any` on line 491 — **Fixed**: Changed to `ticker.info!` (non-null assertion after the guard check on line 483). Property access via `String()` instead of `as string` casts for type-safe conversion.

---

## Task C3: Test Coverage

**New file**: `tests/unit/base-adapter.test.ts` — 58 tests

| Test Group | Count | Description |
|------------|-------|-------------|
| NOT_SUPPORTED (feature disabled) | 14 | Methods throw NotSupportedError with `NOT_SUPPORTED` code |
| NOT_IMPLEMENTED (feature enabled) | 19 | Methods throw NotSupportedError with `NOT_IMPLEMENTED` code |
| ensureInitialized | 2 | PerpDEXError with `NOT_INITIALIZED` code |
| Batch BATCH_FAILED | 2 | PerpDEXError with `BATCH_FAILED` code |
| WS NOT_SUPPORTED | 10 | WebSocket generators throw NotSupportedError |
| WS NOT_IMPLEMENTED | 10 | WebSocket generators throw NotSupportedError with NOT_IMPLEMENTED |
| setMarginMode emulated | 1 | Emulated mode throws NotSupportedError |

---

## Verification

- `npx tsc --noEmit`: PASS (0 errors)
- `npx jest tests/unit/base-adapter.test.ts`: 58/58 PASS
- `npx jest tests/unit/batchFallback.test.ts`: 16/16 PASS (existing tests unaffected)
