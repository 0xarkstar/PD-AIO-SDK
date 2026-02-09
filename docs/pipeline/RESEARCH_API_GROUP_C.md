# API Audit Report — Group C: dYdX v4, Jupiter Perps, Drift Protocol, GMX v2

**Agent**: p-research-c
**Date**: 2026-02-09
**Status**: COMPLETE

---

## Executive Summary

Audited 4 exchange adapters against their real API documentation and on-chain program specifications. Found **23 issues total** across the 4 exchanges: 8 CRITICAL, 7 HIGH, 5 MEDIUM, 3 LOW.

| Exchange | CRITICAL | HIGH | MEDIUM | LOW | Files Reviewed |
|----------|----------|------|--------|-----|----------------|
| dYdX v4  | 2 | 2 | 1 | 1 | 8 |
| Jupiter  | 2 | 2 | 1 | 0 | 9 |
| Drift    | 2 | 1 | 2 | 1 | 5 |
| GMX v2   | 2 | 2 | 1 | 1 | 5 |

---

## 1. dYdX v4 Adapter

### Source Files
- `src/adapters/dydx/DydxAdapter.ts` (833 lines)
- `src/adapters/dydx/DydxNormalizer.ts` (550 lines)
- `src/adapters/dydx/types.ts` (389 lines)
- `src/adapters/dydx/constants.ts` (189 lines)
- `src/adapters/dydx/DydxAuth.ts` (275 lines)
- `src/adapters/dydx/error-codes.ts` (138 lines)
- `src/adapters/dydx/utils.ts` (271 lines)

### API Documentation Source
- Official: https://docs.dydx.exchange/api_integration-indexer/indexer_api
- GitHub spec: https://github.com/dydxprotocol/v4-chain/blob/main/indexer/services/comlink/public/api-documentation.md
- Redirects to: https://docs.dydx.xyz/indexer-client/http

### Endpoints Comparison

| Feature | SDK Implementation | Real API | Match? |
|---------|-------------------|----------|--------|
| Base URL | `https://indexer.dydx.trade/v4` | `https://indexer.dydx.trade/v4` | YES |
| Testnet URL | `https://indexer.v4testnet.dydx.exchange/v4` | `https://indexer.v4testnet.dydx.exchange/v4` | YES |
| Perpetual Markets | `GET /perpetualMarkets` | `GET /perpetualMarkets` | YES |
| Single Market | `GET /perpetualMarkets/{ticker}` | `GET /perpetualMarkets/{marketId}` | MINOR (param name) |
| Orderbook | `GET /orderbooks/perpetualMarket/{ticker}` | `GET /orderbooks/perpetualMarket/{ticker}` | YES |
| Trades | `GET /trades/perpetualMarket/{ticker}` | `GET /trades` with `market` query param | MISMATCH |
| Historical Funding | `GET /historicalFunding/{ticker}` | `GET /historicalFunding` with `market` query param | MISMATCH |
| Candles | `GET /candles/perpetualMarkets/{ticker}` | `GET /candles` with `market` query param | MISMATCH |
| Subaccount | `GET /addresses/{addr}/subaccountNumber/{n}` | `GET /addresses/{addr}/subaccountNumber/{n}` | YES |
| Orders | `GET /addresses/{addr}/orders` | `GET /addresses/{addr}/subaccountNumber/{n}/orders` | MISMATCH |
| Fills | `GET /addresses/{addr}/fills` | `GET /addresses/{addr}/subaccountNumber/{n}/fills` | MISMATCH |
| Funding Payments | Not implemented | `GET /addresses/{addr}/subaccountNumber/{n}/fundingPayments` | MISSING |
| WebSocket | `wss://indexer.dydx.trade/v4/ws` | `wss://indexer.dydx.trade/v4/ws` | YES |

### Issues Found

#### CRITICAL-D1: Trades endpoint path mismatch
- **SDK**: `GET /trades/perpetualMarket/{ticker}`
- **Real API**: `GET /trades` with `market` query parameter
- **Impact**: May return 404 or wrong data on production indexer versions
- **File**: `DydxAdapter.ts` (fetchTrades method)

#### CRITICAL-D2: Orders/Fills endpoint missing subaccountNumber in path
- **SDK**: `GET /addresses/{addr}/orders` (no subaccountNumber)
- **Real API**: `GET /addresses/{addr}/subaccountNumber/{n}/orders`
- **Impact**: Will return 404 — subaccountNumber is required in path
- **File**: `DydxAdapter.ts` (fetchOpenOrders, fetchOrderHistory, fetchMyTrades methods)

#### HIGH-D1: DydxAuth uses placeholder address derivation
- **SDK**: `simpleHash()` placeholder instead of proper Cosmos SDK address derivation
- **Real API**: Requires proper bech32 cosmos address from secp256k1 key
- **Impact**: All authenticated requests will use wrong address
- **File**: `DydxAuth.ts` (deriveAddress method)
- **Fix**: Must use `@cosmjs/proto-signing` or `@dydxprotocol/v4-client-js` for proper derivation

#### HIGH-D2: Hardcoded fee rates in normalizer
- **SDK**: makerFee=0.0001 (0.01%), takerFee=0.0005 (0.05%) hardcoded
- **Real API**: Fees vary by tier and can be fetched from subaccount endpoint
- **Impact**: Reported fees will be inaccurate for most users
- **File**: `DydxNormalizer.ts` (normalizeMarket method)

#### MEDIUM-D1: Candle resolution mapping uses non-standard values
- **SDK**: Maps 5m → `5MINS` (plural)
- **Real API**: Uses `1MIN, 5MINS, 15MINS, 30MINS, 1HOUR, 4HOURS, 1DAY`
- **Status**: Actually matches documented values (plural for >1). Verify edge cases.
- **File**: `utils.ts` (timeframe mapping)

#### LOW-D1: maxLeverage hardcoded to 20
- **SDK**: All markets hardcoded to 20x
- **Real API**: `perpetualMarkets` response includes `initialMarginFraction` from which max leverage can be derived (1/IMF). Varies per market.
- **File**: `DydxNormalizer.ts`

### Symbol Format Verification
- **SDK**: `BTC/USD:USD` ↔ `BTC-USD` — **CORRECT**
- dYdX v4 uses `{BASE}-USD` format (e.g., BTC-USD, ETH-USD)
- Conversion functions in `constants.ts` are correct

---

## 2. Jupiter Perps Adapter

### Source Files
- `src/adapters/jupiter/JupiterAdapter.ts` (1020 lines)
- `src/adapters/jupiter/JupiterNormalizer.ts` (434 lines)
- `src/adapters/jupiter/types.ts` (437 lines)
- `src/adapters/jupiter/constants.ts` (209 lines)
- `src/adapters/jupiter/instructions.ts` (716 lines)
- `src/adapters/jupiter/solana.ts` (520 lines)
- `src/adapters/jupiter/utils.ts` (378 lines)
- `src/adapters/jupiter/JupiterAuth.ts` (389 lines)
- `src/adapters/jupiter/error-codes.ts` (172 lines)

### API Documentation Source
- Official: https://dev.jup.ag/docs/perps (work in progress)
- Price API: `https://api.jup.ag/price/v3` (v2 deprecated)
- On-chain: Anchor IDL at program `PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2verr`
- Reference: https://github.com/julianfssen/jupiter-perps-anchor-idl-parsing

### Endpoints/On-Chain Comparison

| Feature | SDK Implementation | Real System | Match? |
|---------|-------------------|-------------|--------|
| Program ID | `PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2verr` | `PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2verr` | YES |
| JLP Mint | `27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4` | `27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4` | YES |
| Price API | `https://api.jup.ag/price/v3` | v2 at `https://api.jup.ag/price/v2`, v3 unconfirmed | NEEDS VERIFY |
| SOL Mint | `So11111111111111111111111111111111111111112` | `So11111111111111111111111111111111111111112` | YES |
| ETH Mint | `7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs` | Wormhole ETH on Solana | YES |
| BTC Mint | `3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh` | Wormhole WBTC on Solana | YES |
| USDC Mint | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` | Native USDC on Solana | YES |
| Supported Markets | SOL, ETH, BTC (3 markets) | SOL, ETH, BTC (confirmed 3 markets) | YES |
| Max Leverage | 250x all markets | Varies; typically 100x for most users | MISMATCH |
| Fee Model | Borrow fees (hourly) | Borrow fees (hourly, based on utilization) | CONCEPT OK |
| Funding Rate | Pseudo-funding from borrow fees | No traditional funding rate | OK (documented) |

### Issues Found

#### CRITICAL-J1: Price API version uncertainty
- **SDK**: Uses `https://api.jup.ag/price/v3`
- **Real Docs**: Official docs reference v2 (`https://api.jup.ag/price/v2`); v3 is not officially documented
- **Impact**: If v3 doesn't exist or has different response format, all price data will fail
- **File**: `constants.ts` (JUPITER_API_URLS)
- **Note**: `lite-api.jup.ag` deprecated as of Dec 2025 per official docs

#### CRITICAL-J2: fetchTrades returns empty array — no error handling
- **SDK**: `fetchTrades()` returns `[]` silently
- **Real System**: Jupiter has no public trade feed API. This is architecturally correct (on-chain trades only), but should throw `NotSupported` error instead of silently returning empty
- **Impact**: Users may think there are no trades rather than knowing the feature is unsupported
- **File**: `JupiterAdapter.ts` (fetchTrades method)

#### HIGH-J1: Max leverage claims 250x for all markets
- **SDK**: Hardcoded `maxLeverage: 250` for SOL, ETH, BTC
- **Real System**: Jupiter docs indicate up to 100x leverage for most markets. 250x may only be available in specific conditions or has been changed
- **Impact**: Users may attempt 250x positions that get rejected
- **File**: `constants.ts` (JUPITER_MARKETS)

#### HIGH-J2: On-chain instruction discriminators may be stale
- **SDK**: Hardcoded Anchor IDL discriminators in `instructions.ts`
- **Real System**: Discriminators are derived from Anchor IDL hash; if Jupiter updates their program, these break
- **Impact**: All trading transactions will fail if program is upgraded
- **File**: `instructions.ts` (all instruction builders)
- **Fix**: Should dynamically fetch IDL or use versioned discriminator registry

#### MEDIUM-J1: Borrow fee rate bounds may be inaccurate
- **SDK**: `minRate: 0.0001` (0.01%/hr), `maxRate: 0.01` (1%/hr)
- **Real System**: Borrow fees are dynamic based on pool utilization; bounds may differ
- **Impact**: Fee estimates could be misleading
- **File**: `constants.ts` (JUPITER_BORROW_FEE)

### Symbol Format Verification
- **SDK**: `SOL/USD:USD` ↔ `SOL-PERP` — **CORRECT** for internal use
- Jupiter doesn't use ticker symbols natively (on-chain program uses mint addresses)
- The SDK's internal symbol mapping is reasonable

---

## 3. Drift Protocol Adapter

### Source Files
- `src/adapters/drift/DriftAdapter.ts` (859 lines)
- `src/adapters/drift/DriftNormalizer.ts` (455 lines)
- `src/adapters/drift/types.ts` (649 lines)
- `src/adapters/drift/constants.ts` (362 lines)

### API Documentation Source
- Official: https://docs.drift.trade/sdk-documentation
- DLOB Server: https://drift-labs.github.io/v2-teacher/
- Program: https://github.com/drift-labs/protocol-v2

### Endpoints Comparison

| Feature | SDK Implementation | Real API | Match? |
|---------|-------------------|----------|--------|
| DLOB Base URL | `https://dlob.drift.trade` | `https://dlob.drift.trade/` | YES |
| Devnet DLOB | `https://master.dlob.drift.trade` | `https://master.dlob.drift.trade/` | YES |
| Data API | `https://data.api.drift.trade` | `https://data.api.drift.trade` | YES |
| Program ID | `dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH` | `dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH` | YES |
| L2 Orderbook | `GET /l2?marketIndex={n}&marketType=perp&depth={d}` | `GET /l2?marketIndex={n}&marketType=perp` | YES |
| Trades | `GET /trades?marketIndex={n}&marketType=perp` | `GET /trades?marketIndex={n}&marketType=perp` | YES |
| Funding Rate | `GET /fundingRate?marketIndex={n}` | `GET /fundingRate?marketIndex={n}` | YES |
| Funding History | `GET /fundingRateHistory` | `GET /fundingRateHistory` | YES |
| User/Positions | Via @drift-labs/sdk on-chain read | On-chain via RPC or Gateway `/v2/positions` | OK |
| WebSocket | `wss://dlob.drift.trade/ws` | `wss://dlob.drift.trade/ws` | YES |

### Precision Constants Verification

| Constant | SDK Value | Real API Docs | Match? |
|----------|-----------|---------------|--------|
| BASE_PRECISION | 1e9 | 1e9 | YES |
| QUOTE_PRECISION | 1e6 | 1e6 | YES |
| PRICE_PRECISION | 1e6 | 1e6 | YES |
| FUNDING_RATE_PRECISION | 1e9 | 1e9 | YES |
| MARGIN_PRECISION | 1e4 | 1e4 | YES |

### Issues Found

#### CRITICAL-DR1: Market list may be incomplete/stale
- **SDK**: Hardcodes 11 perp markets (SOL=0, BTC=1, ETH=2, APT=3, 1MBONK=4, MATIC=5, ARB=6, DOGE=7, BNB=8, SUI=9, PEPE=10)
- **Real Protocol**: Drift has added many more markets since these were defined (50+ perp markets as of 2025). New markets added on-chain won't be accessible.
- **Impact**: Users cannot trade newer markets (e.g., JTO, WIF, JUP, RNDR, TIA, etc.)
- **File**: `constants.ts` (DRIFT_PERP_MARKETS)
- **Fix**: Should dynamically fetch market list from on-chain PerpMarketAccount or use `@drift-labs/sdk`'s market map

#### CRITICAL-DR2: DLOB endpoint for user data may not have `/user` path
- **SDK**: Uses `GET /user?userAccount={addr}&subAccountId={id}` for positions
- **Real DLOB docs**: The DLOB server only documents `/l2`, `/l3`, `/topMakers`, `/trades`, `/fundingRate`, `/fundingRateHistory`, `/auctionParams`
- **Impact**: User data endpoint may not exist on DLOB server; should use on-chain reads or Gateway API instead
- **File**: `DriftAdapter.ts` (fetchPositions, fetchBalance)

#### HIGH-DR1: Hardcoded fee rates
- **SDK (DriftNormalizer.ts)**: Maker rebate = -0.02%, Taker fee = 0.1%
- **Real Protocol**: Fees are dynamic based on user's staking tier (0-0.1% taker, 0-0.02% maker rebate)
- **Impact**: Fee calculations will be wrong for most users
- **File**: `DriftNormalizer.ts`

#### MEDIUM-DR1: MATIC market may be renamed to POL
- **SDK**: Uses `MATIC-PERP` with marketIndex=5
- **Real Protocol**: MATIC was rebranded to POL; the market may have been renamed or market index reassigned
- **Impact**: Symbol conversion and market lookup could fail
- **File**: `constants.ts`

#### MEDIUM-DR2: Missing DLOB query parameters
- **SDK**: Some DLOB calls may be missing optional but important params
- **Real API**: `/l2` supports `depth`, `includeOracle`, `includeVamm` params; `/l3` supports `includeOracle`
- **Impact**: Missing `includeVamm=true` may result in incomplete orderbook depth (misses AMM liquidity)
- **File**: `DriftAdapter.ts` (fetchOrderBook)

#### LOW-DR1: Symbol `1MPEPE` naming inconsistency
- **SDK**: Market key is `PEPE-PERP` but baseAsset is `1MPEPE`, symbol is `1MPEPE/USD:USD`
- **Impact**: Minor confusion in symbol lookup; the key/symbol mismatch could cause bugs in lookups
- **File**: `constants.ts` (DRIFT_PERP_MARKETS['PEPE-PERP'])

### Symbol Format Verification
- **SDK**: `SOL/USD:USD` ↔ `SOL-PERP` — **CORRECT**
- Drift uses `{BASE}-PERP` naming convention
- Market index resolution is correct for the defined markets

---

## 4. GMX v2 Adapter

### Source Files
- `src/adapters/gmx/GmxAdapter.ts` (967 lines)
- `src/adapters/gmx/GmxNormalizer.ts` (433 lines)
- `src/adapters/gmx/types.ts` (343 lines)
- `src/adapters/gmx/constants.ts` (412 lines)

### API Documentation Source
- Official: https://docs.gmx.io/docs/api/rest/
- Arbitrum API: https://arbitrum-api.gmxinfra.io
- Avalanche API: https://avalanche-api.gmxinfra.io

### Endpoints Comparison

| Feature | SDK Implementation | Real API | Match? |
|---------|-------------------|----------|--------|
| Arbitrum Base URL | `https://arbitrum-api.gmxinfra.io` | `https://arbitrum-api.gmxinfra.io` | YES |
| Avalanche Base URL | `https://avalanche-api.gmxinfra.io` | `https://avalanche-api.gmxinfra.io` | YES |
| Markets Info | `GET /markets/info` | `GET /markets/info` | YES |
| Price Tickers | `GET /prices/tickers` | `GET /prices/tickers` | YES |
| Candlesticks | `GET /candlesticks` | `GET /prices/candles` | MISMATCH |
| Signed Prices | Not implemented | `GET /signed_prices/latest` | MISSING |
| Token List | Not implemented | `GET /tokens` | MISSING |
| Ping/Health | Not implemented | `GET /ping` | MISSING |
| Fee APYs | Not implemented | `GET /apy?period={p}` | MISSING |
| Subgraph | `https://gmx.squids.live/gmx-synthetics-arbitrum:prod/api/graphql` | Documented at gmx.squids.live | YES |
| Botanix chain | Not implemented | `https://botanix-api.gmxinfra.io` | MISSING (new chain) |
| Fallback URLs | Not implemented | `*-fallback.gmxinfra.io`, `*-fallback.gmxinfra2.io` | MISSING |

### Issues Found

#### CRITICAL-G1: Candlesticks endpoint path mismatch
- **SDK**: Uses `GET /candlesticks`
- **Real API**: Endpoint is `GET /prices/candles` with params `tokenSymbol`, `period` (1m,5m,15m,1h,4h,1d), `limit`
- **Impact**: OHLCV fetching will return 404
- **File**: `GmxAdapter.ts` (fetchOHLCV method)

#### CRITICAL-G2: Market list incomplete — only 11 markets vs 40+ real
- **SDK**: Defines only 11 markets (8 Arbitrum + 3 Avalanche)
- **Real API**: GMX v2 lists 40+ markets on Arbitrum including DOGE, SOL, LTC, UNI, LINK, ARB, XRP, BNB, AAVE, ATOM, NEAR, AVAX, OP, GMX, PEPE, WIF, wstETH, SHIB, STX, ORDI, EIGEN, and more
- **Impact**: Most markets are inaccessible to SDK users
- **File**: `constants.ts` (GMX_MARKETS)
- **Fix**: Should dynamically fetch markets from `/markets/info` endpoint

#### HIGH-G1: fetchOrderBook throws unsupported error
- **SDK**: Throws error saying "no traditional orderbook"
- **Real System**: While GMX doesn't have a traditional orderbook, the `/prices/tickers` endpoint provides bid/ask spread data that could be used to construct a synthetic orderbook
- **Impact**: Users cannot get any price depth information
- **File**: `GmxAdapter.ts`

#### HIGH-G2: fetchTrades throws unsupported error
- **SDK**: Throws error, says subgraph required
- **Real System**: Trades are available via subgraph queries (which the SDK already has configured). Should implement using `GmxSubgraph`
- **Impact**: Trade history completely unavailable despite infrastructure being in place
- **File**: `GmxAdapter.ts`

#### MEDIUM-G1: Missing Botanix chain support
- **SDK**: Only supports Arbitrum and Avalanche
- **Real API**: GMX has expanded to Botanix (Bitcoin L2) with `https://botanix-api.gmxinfra.io`
- **Impact**: Cannot access GMX on Botanix
- **File**: `constants.ts` (GMX_API_URLS)

#### LOW-G1: No fallback API URLs
- **SDK**: Only uses primary API URLs
- **Real API**: Provides fallback URLs (`*-fallback.gmxinfra.io`, `*-fallback.gmxinfra2.io`)
- **Impact**: No resilience if primary API goes down
- **File**: `constants.ts`

### Precision Verification

| Constant | SDK Value | Real Protocol | Match? |
|----------|-----------|---------------|--------|
| PRICE | 1e30 | 1e30 (oracle prices) | YES |
| USD | 1e30 | 1e30 | YES |
| FACTOR | 1e30 | 1e30 | YES |
| BASIS_POINTS | 1e4 | 1e4 | YES |

### Symbol Format Verification
- **SDK**: Uses `{BASE}/USD:{SETTLE}` format (e.g., `ETH/USD:ETH`, `SOL/USD:ETH`)
- Settlement token varies per market (not always same as base)
- This is correctly modeled with the `settleAsset` field

### Contract Address Verification
- **SDK contract addresses** for exchangeRouter, router, dataStore, reader, orderVault, positionRouter appear to match known GMX v2 deployment addresses
- **Note**: Contract addresses should be verified against latest GMX deployment as they may have been upgraded

---

## Cross-Cutting Issues

### 1. Stale Market Lists (Affects ALL 4 adapters)
- **Severity**: CRITICAL
- **Pattern**: All adapters hardcode market lists instead of fetching dynamically
- dYdX: Perpetual markets endpoint available but list is hardcoded for validation
- Jupiter: Only 3 markets (correct, but may expand)
- Drift: 11 markets hardcoded vs 50+ real
- GMX: 11 markets hardcoded vs 40+ real
- **Recommendation**: Implement dynamic market discovery using each exchange's market listing endpoints

### 2. Hardcoded Fee Rates (Affects dYdX, Drift)
- **Severity**: HIGH
- **Pattern**: Fee rates hardcoded in normalizers instead of fetched from API
- **Recommendation**: Fetch fee schedules from APIs or let users configure them

### 3. Trading Operations Not Implemented (Affects dYdX)
- **Severity**: HIGH
- dYdX: `createOrder` and `cancelOrder` throw errors saying they need official SDK
- This is architecturally valid for dYdX v4 (requires Cosmos SDK signing), but should be clearly documented

### 4. Missing Error Type for Unsupported Operations
- **Severity**: MEDIUM
- Some adapters return empty arrays for unsupported operations instead of throwing `NotSupported`
- Should use consistent error patterns across all adapters

---

## Recommendations Summary

### Immediate Fixes (CRITICAL)
1. **dYdX**: Fix endpoint paths for trades, candles, historical funding (use query params not path params)
2. **dYdX**: Add subaccountNumber to orders/fills endpoint paths
3. **Jupiter**: Verify Price API version (v2 vs v3) against live API
4. **Drift**: Implement dynamic market list fetching
5. **GMX**: Fix candlesticks endpoint from `/candlesticks` to `/prices/candles`
6. **GMX**: Implement dynamic market list fetching

### High Priority Fixes
7. **dYdX**: Replace placeholder address derivation in DydxAuth
8. **dYdX**: Fetch fee rates from API instead of hardcoding
9. **Jupiter**: Implement IDL-based discriminator resolution
10. **Jupiter**: Verify and correct max leverage values (250x → likely 100x)
11. **Drift**: Fetch fee rates dynamically
12. **GMX**: Implement fetchTrades using existing subgraph infrastructure
13. **GMX**: Implement synthetic orderbook from price ticker data

### Medium Priority
14. **Drift**: Verify MATIC → POL rename
15. **Drift**: Add `includeVamm=true` to DLOB orderbook calls
16. **GMX**: Add Botanix chain support
17. **All**: Standardize unsupported operation error handling

### Low Priority
18. **dYdX**: Dynamic max leverage from initialMarginFraction
19. **Drift**: Fix PEPE-PERP key/symbol naming inconsistency
20. **GMX**: Add fallback API URLs for resilience
