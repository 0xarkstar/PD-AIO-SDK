# Fixer B Report: GMX, Drift, dYdX, Lighter Adapter Fixes

## Summary

Fixed 4 adapters with live API compatibility issues discovered during API contract validation. All fixes verified with `npx tsc --noEmit` (clean) and `npx jest --forceExit` (6014 pass, 0 fail).

---

## GMX v2 — Inverted Price + NaN Funding Rate

### Root Cause: Price Precision
GMX v2 stores oracle prices as `price * 10^(30 - tokenDecimals)`, NOT `price * 10^30`. Token decimals vary: ETH=18, BTC=8, USDC=6. Previously all prices were divided by `1e30`, producing inverted/wrong values (e.g., `0.0006` instead of `69000` for BTC).

### Root Cause: NaN Funding Rate
`parseFloat(marketInfo.fundingFactor)` can return `NaN` when the field is missing or non-numeric. No guard existed.

### Fix
- **`src/adapters/gmx/constants.ts`**: Added `getTokenDecimals()` and `getOraclePriceDivisor()` helper functions
- **`src/adapters/gmx/GmxAdapter.ts`**: Replaced all 7 occurrences of `GMX_PRECISION.PRICE` division with `getOraclePriceDivisor(baseAsset)`:
  - `fetchTicker` — ticker price parsing
  - `fetchFundingRate` — mark price + NaN guards for fundingFactor and hourlyRate
  - `fetchPositions` — position entry/mark/liquidation prices
  - `fetchBalance` — native token (ETH/AVAX) price
  - `fetchOpenOrders` / `fetchOrderHistory` — order price parsing
  - `createOrder` — price encoding for order submission

### Files Modified
- `src/adapters/gmx/constants.ts`
- `src/adapters/gmx/GmxAdapter.ts`

---

## Drift — fetchTrades 404 + fetchFundingRate 404

### Root Cause
The Drift DLOB API (`dlob.drift.trade`) removed the `/trades` and `/fundingRate` REST endpoints. They return 404.

### Fix
- **fetchTrades**: Marked `has.fetchTrades = false`. The method now throws `PerpDEXError('fetchTrades is not available...')`. There is no public REST endpoint for recent trades on Drift.
- **fetchFundingRate**: Switched to Drift Data API (`data.api.drift.trade/fundingRates?marketIndex=N&limit=1`). Response format: `{ fundingRates: [{ ts, recordId, marketIndex, fundingRate, ... }] }`.
- **fetchFundingRateHistory**: Similarly switched to Data API with configurable limit.
- Added `dataBaseUrl` property to DriftAdapter initialized from `DRIFT_API_URLS.*.data`.
- Added `DriftFundingRateRecord` type interface.

### Files Modified
- `src/adapters/drift/DriftAdapter.ts`
- `src/adapters/drift/constants.ts` (removed duplicate export)
- `tests/unit/drift-adapter.test.ts` (updated 2 tests)

---

## dYdX v4 — fetchTrades 404 + fetchOHLCV 404

### Root Cause
dYdX v4 Indexer uses path-based routing, not query parameters:
- Wrong: `/trades?market=BTC-USD` (404)
- Correct: `/trades/perpetualMarket/BTC-USD`

Same pattern for candles and historical funding.

### Fix
- **fetchTrades**: Changed from `/trades` + `{ market: exchangeSymbol }` to `/trades/perpetualMarket/${exchangeSymbol}`
- **fetchOHLCV**: Changed from `/candles` + `{ market: exchangeSymbol }` to `/candles/perpetualMarket/${exchangeSymbol}`
- **fetchFundingRateHistory**: Changed from `/historicalFunding` + `{ market: exchangeSymbol }` to `/historicalFunding/${exchangeSymbol}`

### Files Modified
- `src/adapters/dydx/DydxAdapter.ts`
- `tests/unit/dydx-adapter.test.ts` (updated 2 URL assertions)

---

## Lighter — fetchTrades 400 + fetchFundingRate Non-Number

### Root Cause: Trades
The API endpoint is `/api/v1/recentTrades?market_id={id}`, not `/api/v1/trades?symbol=...`. Requires `market_id` parameter (integer), which must come from the `orderBookDetails` cache.

### Root Cause: Funding Rate
The API returns `{ code: 200, funding_rates: [{ market_id, exchange, symbol, rate }] }` (array format), not a single `LighterFundingRate` object. The normalizer was receiving the raw response object, producing non-number values.

### Fix
- **`src/adapters/lighter/LighterMarketData.ts`**:
  - `fetchTradesData`: Changed to `/api/v1/recentTrades?market_id=${marketId}&limit=${limit}`. Added `fetchMarkets` callback parameter (matching `fetchOrderBookData` pattern) to properly populate `marketIdCache`. Updated trade field mapping: `trade_id`, `is_maker_ask` (false=buy, true=sell), `size`.
  - `fetchFundingRateData`: Complete rewrite. Parses `funding_rates` array, finds matching rate by `market_id`, constructs `LighterFundingRate` with NaN guard. Added `fetchMarkets` callback parameter. `markPrice` set to 0 (not provided by this endpoint).
- **`src/adapters/lighter/LighterAdapter.ts`**: Updated `fetchTrades` and `fetchFundingRate` calls to pass `() => this.fetchMarkets()` callback.

### Files Modified
- `src/adapters/lighter/LighterMarketData.ts`
- `src/adapters/lighter/LighterAdapter.ts`
- `tests/integration/lighter-adapter.test.ts` (updated 3 tests: trades x2, funding rate x1)

---

## Verification

```
npx tsc --noEmit          → Clean (0 errors)
npx jest --forceExit      → 169 suites pass, 6014 tests pass, 0 failures
```

---

## Handoff

- **Attempted**: Live API curl testing for all 4 exchanges; code fixes for price parsing, endpoint URLs, response format handling; test updates
- **Worked**: All 4 adapter fixes compile and pass tests. GMX price precision fix covers all 7 price-parsing locations. Drift Data API provides funding rates. dYdX path-based routing works. Lighter recentTrades + funding_rates array parsing works.
- **Failed**: Nothing — all fixes verified
- **Remaining**: Live re-validation against actual APIs should be done in QA phase (Task #6) to confirm fixes work end-to-end with real responses
