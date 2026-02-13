# Fixer A Report: Live API Fixes

## Summary

Fixed 4 of 5 assigned exchanges. Pacifica is unfixable (API fully down).

| Exchange | Status | Root Cause | Fix |
|----------|--------|------------|-----|
| **Jupiter** | Fixed | jup.ag price API v2/v3 returns 401 (auth required) | Switched to Pyth Network Hermes API |
| **Extended** | Fixed | API returns `{status,data:[...]}` not `{markets:[...]}` | Updated response parsing + normalizer field mapping |
| **Ostium** | Fixed | Subgraph removed; metadata param format changed | Fixed param format; disabled trades (subgraph gone) |
| **Paradex** | Fixed | Public endpoints reject empty auth headers (INVALID_TOKEN) | Switched to public endpoints; conditional auth headers |
| **Pacifica** | Unfixable | All endpoints return 404 (API completely down) | No code fix possible |

## Detailed Fixes

### Jupiter (3 files)

**Problem**: Jupiter's price API (`api.jup.ag/price/v2`, `/v3`) now returns 401 Unauthorized. All variants tested (v1, v2, v3, lite-api) require authentication.

**Solution**: Switched to Pyth Network Hermes API (`hermes.pyth.network/v2/updates/price/latest`). Jupiter Perps uses Pyth oracles on-chain, so this is the canonical price source.

**Files changed**:
- `src/adapters/jupiter/constants.ts`: Changed price URL to Pyth; added `JUPITER_PYTH_FEED_IDS` mapping
- `src/adapters/jupiter/utils.ts`: Rewrote `buildPriceApiUrl` to build Pyth Hermes URL with feed IDs
- `src/adapters/jupiter/JupiterAdapter.ts`: Rewrote `fetchPrices` to parse Pyth response format `{parsed:[{id, price:{price,expo}}]}`

### Extended (2 files)

**Problem**: API returns `{status: "OK", data: [...]}` with 103 markets, but adapter expected `{markets: [...]}`. Normalizer field names also mismatched (e.g., `name` vs `symbol`, `assetName` vs `baseAsset`).

**Solution**: Updated response parsing to handle `{data:[...]}` format. Updated normalizer to use actual API field names.

**Files changed**:
- `src/adapters/extended/ExtendedAdapter.ts`: Handle `{data:[...]}` response format
- `src/adapters/extended/ExtendedNormalizer.ts`: Map actual fields (`name`, `assetName`, `collateralAssetName`, `tradingConfig.*`, `active`, etc.)

### Ostium (2 files)

**Problem**: Two issues:
1. Metadata API changed param format from `?pair=BTC/USD` to `?asset=BTCUSD` (concatenated, no slash)
2. The Graph hosted service subgraph was removed (301 redirect). Graph Studio requires API key.

Response format also changed from `{price, timestamp}` to `{bid, mid, ask, timestampSeconds}`.

**Solution**: Fixed metadata param format; updated normalizer for new response fields; disabled `fetchTrades` (subgraph gone).

**Files changed**:
- `src/adapters/ostium/OstiumAdapter.ts`: Fixed `fetchTicker` param format (`asset=BTCUSD`); set `fetchTrades: false`; replaced `fetchTrades` body with NotSupportedError
- `src/adapters/ostium/OstiumNormalizer.ts`: Handle `{bid, mid, ask, timestampSeconds}` response fields

### Paradex (3 files)

**Problem**: The path-based endpoints (`/markets/X/ticker`, `/trades/X`, `/markets/X/funding`) now require JWT authentication. Sending empty auth headers to public endpoints returns INVALID_TOKEN.

**Solution**: Found publicly accessible query-param endpoints (`/markets/summary?market=X`, `/trades?market=X`, `/funding/data?market=X`). Made auth headers conditional on having credentials.

**Files changed**:
- `src/adapters/paradex/ParadexAdapter.ts`: Rewrote `fetchTicker` (uses `/markets/summary`), `fetchTrades` (uses `/trades?market=X`), `fetchFundingRate` and `fetchFundingRateHistory` (use `/funding/data?market=X`)
- `src/adapters/paradex/ParadexAuth.ts`: Auth headers now conditional on `hasCredentials()`
- `src/adapters/paradex/ParadexNormalizer.ts`: Handle `created_at` field in trade normalization

### Pacifica

**Problem**: All endpoints return 404. DNS resolves, CloudFront serves the domain, but no API paths work. Tested `/markets`, `/orders`, `/positions`, `/v1/markets`, `/api/v1/markets` etc.

**Conclusion**: API appears completely offline/removed. No code fix possible.

## Test Updates

Updated all test mocks to match new response formats:
- `tests/unit/paradex-adapter.test.ts`: Updated fetchTrades, fetchFundingRate, fetchFundingRateHistory mocks
- `tests/unit/ostium-adapter.test.ts`: Updated fetchTrades tests (now NotSupportedError), feature map
- `tests/unit/ostium-coverage.test.ts`: Updated fetchTrades error propagation test
- `tests/unit/jupiter-adapter.test.ts`: Updated all fetch mocks to Pyth response format, URL expectations
- `tests/unit/jupiter-constants.test.ts`: Updated URL expectation to Pyth
- `tests/unit/jupiter-utils.test.ts`: Updated buildPriceApiUrl tests for Pyth format
- `tests/unit/paradex-auth.test.ts`: Updated auth header tests
- `tests/integration/paradex-adapter.test.ts`: Updated all endpoint paths and response formats
- `tests/integration/jupiter-adapter-extended.test.ts`: Updated fetch mock to Pyth format

## Verification

- `npx tsc --noEmit`: Clean (0 errors)
- `npx jest --no-coverage`: **6014 passed**, 78 skipped, 0 failures
- All 169 test suites pass (3 pre-existing skips)

## Handoff

- **Attempted**: Live API testing of all 5 exchanges, identifying root causes, implementing fixes, updating all affected tests
- **Worked**: Jupiter (Pyth), Extended (response format), Ostium (param format + normalizer), Paradex (public endpoints + conditional auth)
- **Failed**: Pacifica API is fully down (404 on everything). No code fix possible.
- **Remaining**: Pacifica needs monitoring for when/if the API comes back online. Ostium trades need Graph Studio API key integration if trade data is needed.
