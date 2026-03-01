# Drift Dynamic Market Fetching Implementation

## Objective
Make Drift adapter fetch markets dynamically from the DLOB API instead of only using hardcoded constants (11 → 30+).

## Implementation

### Changes Made

#### 1. DriftAdapter.ts
- Modified `fetchMarkets()` to try dynamic discovery first, fallback to constants
- Added `discoverMarketsFromDlob()` private method:
  - Probes market indices 0-50 using DLOB orderbook API
  - Extracts market names from API responses (e.g., "SOL-PERP")
  - Enhances discovered markets with hardcoded configs where available
  - Uses sensible defaults for new markets not in constants
  - Handles errors gracefully (non-existent indices return null)
  - Processes in batches of 10 concurrent requests to avoid API overload

#### 2. types.ts
- Added `marketName?: string` field to `DriftL2OrderBook` interface
- Updated `DriftL2OrderBookSchema` Zod validator to accept `marketName` field

#### 3. drift-integration.test.ts
- Added missing `await adapter.initialize()` call in `beforeAll()`

## Results

### Before
- **11 hardcoded markets** from `DRIFT_PERP_MARKETS` constant
- No ability to discover new markets without code changes

### After
- **41 markets discovered dynamically** from DLOB API
- Automatic discovery of new markets as they're added to Drift
- Hardcoded constants used as enhancement/fallback only
- Graceful degradation if API fails

### Test Results
```
✓ All 10 test suites passed
✓ 406 tests passed
✓ Integration test: "should fetch markets" passed
✓ Fetched 41 markets (up from 11 hardcoded)
✓ Sample market: { symbol: 'SOL/USD:USD', base: 'SOL', maxLeverage: 20, minAmount: 0.1 }
```

## Technical Details

### API Endpoint Discovery
The task description mentioned `https://data.api.drift.trade/perpMarkets`, but this endpoint doesn't exist. Investigation revealed:
- No dedicated markets list endpoint available
- DLOB orderbook API (`/l2?marketType=perp&marketIndex=N`) returns market metadata
- Each response includes `marketName` field (e.g., "SOL-PERP")

### Probing Strategy
Instead of relying on a non-existent markets endpoint:
1. Probe indices 0-50 in batches of 10
2. Extract market name from successful orderbook responses
3. Convert "SOL-PERP" → "SOL/USD:USD" using `driftToUnified()`
4. Build Market objects with config enhancement

### Fallback Behavior
If API discovery fails (network error, API down):
- Falls back to hardcoded `DRIFT_PERP_MARKETS` (11 markets)
- Ensures adapter always works even during API outages

## Files Modified
- `src/adapters/drift/DriftAdapter.ts`
- `src/adapters/drift/types.ts`
- `tests/integration/drift-integration.test.ts`

## Handoff

### What was attempted
- Tried to find a dedicated markets list endpoint (perpMarkets, markets, etc.)
- Tested various API paths on both `data.api.drift.trade` and `dlob.drift.trade`
- Explored different approaches to discover markets dynamically

### What worked
- Probing market indices via DLOB orderbook API
- Extracting `marketName` from orderbook responses
- Batching concurrent requests to avoid rate limits
- Using hardcoded configs as enhancement layer

### What didn't work
- `https://data.api.drift.trade/perpMarkets` endpoint (404 Not Found)
- All other attempted markets list endpoints (none exist)

### Remaining work
- None - implementation complete and tested
- Future: If Drift adds a markets endpoint, update to use it as primary source
