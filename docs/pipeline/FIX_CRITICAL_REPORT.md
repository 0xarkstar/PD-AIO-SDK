# Fix Critical Report (Task #1)

## Summary

Fixed two CRITICAL issues: Jupiter init failure and Extended ticker/orderbook crash.

## Jupiter Fixes

### 1. `src/adapters/jupiter/utils.ts` — ESM import + 0x prefix stripping
- **Replaced** `require('./constants.js')` in `buildPriceApiUrl()` with top-level ESM `import` of `JUPITER_PYTH_FEED_IDS` from `./constants.js`
- **Added** `0x` prefix stripping: `rawFeedId.replace(/^0x/, '')` before building the Pyth Hermes API URL
- **Fixed** TypeScript error (TS2532) by refactoring the null check to use an intermediate variable

### 2. `src/adapters/jupiter/JupiterAdapter.ts` — Empty parsed guard + cleanup
- **Added** early return guard in `fetchPrices()`: if `response.parsed` is empty or undefined, returns empty result instead of crashing
- **Removed** unnecessary `as string` type assertion on line 837 (feedId is already `string` from `Object.entries()`)
- **Ran** prettier to fix import formatting (types import was multi-line but needed single-line)

### 3. `src/adapters/jupiter/constants.ts` — Pyth error patterns
- **Added** two new error message mappings: `'price not available': 'ORACLE_ERROR'` and `'no price data': 'ORACLE_ERROR'`

### 4. `src/adapters/jupiter/error-codes.ts` — Pyth error handler
- **Added** dedicated Pyth-specific error handler block that catches "price not available" and "no price data" messages, mapping them to `ExchangeUnavailableError` with `ORACLE_ERROR` code

## Extended Fixes

### 1. `src/adapters/extended/ExtendedAdapter.ts` — Data wrapper unwrap
- **Fixed** `fetchTicker()`: unwraps `response.data || response` before passing to normalizer (same pattern as `fetchMarkets`)
- **Fixed** `fetchOrderBook()`: unwraps `response.data || response` before passing to normalizer
- Used explicit type annotation `const ticker: ExtendedTicker = ...` instead of `as` assertion to satisfy ESLint

### 2. `src/adapters/extended/ExtendedNormalizer.ts` — Null guard
- **Added** null/undefined guard at top of `symbolToCCXT()`: returns empty string if `extendedSymbol` is falsy, preventing `Cannot read properties of undefined (reading 'includes')` crash
- **Ran** prettier to fix formatting (line 116 long line split)

## Tests Added/Updated

### Jupiter tests
- `buildPriceApiUrl` — test that feed IDs do NOT contain `0x` prefix in URL
- `buildPriceApiUrl` — test empty token list and unknown token graceful handling
- `initialize` — test empty `parsed` array doesn't crash (returns empty, init succeeds)
- `initialize` — test undefined `parsed` field doesn't crash
- `mapJupiterError` — test "price not available" maps to `ORACLE_ERROR`
- `mapJupiterError` — test "no price data" maps to `ORACLE_ERROR`

### Extended tests
- `symbolToCCXT` — test `undefined` input returns `''`
- `symbolToCCXT` — test `null` input returns `''`
- `symbolToCCXT` — test empty string returns `''`

## Verification

- `npx tsc --noEmit` — 0 errors
- `npx eslint src/adapters/jupiter/ src/adapters/extended/` — 0 errors (warnings only, pre-existing)
- `npx jest tests/unit/jupiter- tests/unit/extended-` — 670 tests passed, 16 suites

## Handoff
- **Attempted**: Fix Jupiter require→import migration, Pyth feed ID 0x prefix, empty parsed guard, Extended data wrapper unwrap, Extended null symbol guard
- **Worked**: All fixes applied cleanly, all tests pass, tsc clean, eslint clean
- **Failed**: Nothing
- **Remaining**: None — both CRITICAL issues are resolved
