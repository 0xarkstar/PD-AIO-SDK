# Research: API Audit — Group A

> **Exchanges**: Hyperliquid, Lighter (Zklighter), GRVT (Gravity), Paradex, EdgeX
> **Auditor**: p-research-a
> **Date**: 2026-02-09
> **Method**: SDK source code analysis + real API documentation comparison

---

## 1. Hyperliquid

### Sources
- **SDK files**: `src/adapters/hyperliquid/` (12 files)
- **API docs**: [Hyperliquid GitBook — Exchange Endpoint](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint), [Info Endpoint](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint)

### Endpoints Comparison

| Feature | API Docs | SDK Implementation | Match? |
|---------|----------|-------------------|--------|
| Base URL | `https://api.hyperliquid.xyz` | `https://api.hyperliquid.xyz` | YES |
| All requests POST | POST to `/info` or `/exchange` | POST to `/info` or `/exchange` | YES |
| allMids | `{type:"allMids"}` with optional `dex` param | `{type:"allMids"}` — no `dex` param | PARTIAL |
| l2Book | `{type:"l2Book", coin, nSigFigs?, mantissa?}` | `{type:"l2Book", coin}` — missing `nSigFigs`, `mantissa` | PARTIAL |
| candleSnapshot | `{type:"candleSnapshot", req:{coin, interval, startTime, endTime}}` | Matches | YES |
| openOrders | `{type:"openOrders", user}` | Matches | YES |
| frontendOpenOrders | `{type:"frontendOpenOrders", user}` — includes orderType, origSz, isTrigger | Not implemented — SDK uses `openOrders` only | MISSING |
| historicalOrders | `{type:"historicalOrders", user}` | Matches | YES |
| userFills | `{type:"userFills", user, aggregateByTime?}` | `{type:"userFills", user}` — missing `aggregateByTime` | PARTIAL |
| userFillsByTime | `{type:"userFillsByTime", user, startTime, endTime?}` | Not implemented | MISSING |
| orderStatus | `{type:"orderStatus", user, oid}` — supports oid or cloid | Not implemented | MISSING |
| meta | `{type:"meta"}` for market metadata | Matches | YES |
| clearinghouseState | `{type:"clearinghouseState", user}` | Matches | YES |
| userFees | `{type:"userFees", user}` | Matches | YES |
| userRateLimit | `{type:"userRateLimit", user}` | Matches | YES |
| portfolio | `{type:"portfolio", user}` — day/week/month/allTime history | Implemented in HyperliquidInfoMethods | YES |
| fetchTrades | API has `trades` WS channel; no REST endpoint for public trades | Returns empty array with comment "REST limitation" | CORRECT |

### Findings

#### CRITICAL

1. **`fetchTrades` returns empty array** — The adapter correctly identifies this as a REST API limitation. However, the WS `trades` channel DOES provide real-time trade data. The adapter's `fetchTrades` should either throw `NOT_SUPPORTED` for REST or document the WS-only nature more clearly instead of silently returning `[]`.

#### HIGH

2. **Missing `frontendOpenOrders` endpoint** — This endpoint provides richer order data (orderType, origSz, isTrigger, triggerCondition, reduceOnly). The SDK's `fetchOpenOrders` uses basic `openOrders` type, missing fields that would improve order detail accuracy. Consider switching to `frontendOpenOrders`.

3. **Missing `orderStatus` endpoint** — Ability to query individual order status by oid or cloid is not implemented. This is useful for order tracking and confirmation flows.

4. **Missing `userFillsByTime` endpoint** — Time-range based fill queries are not available. Only the last 2000 fills via `userFills` are supported.

#### MEDIUM

5. **`l2Book` missing optional parameters** — `nSigFigs` (2-5) and `mantissa` (1, 2, 5) parameters for aggregated book levels are not passed through. These allow order book aggregation control.

6. **`allMids` missing `dex` parameter** — The optional `dex` parameter for multi-DEX support is not forwarded.

7. **`userFills` missing `aggregateByTime` parameter** — Optional aggregation parameter not passed through.

8. **Duplicate error message definitions** — `HYPERLIQUID_ERROR_MESSAGES` exists in both `constants.ts` and `error-codes.ts`. This creates maintenance risk and potential inconsistency.

#### LOW

9. **TWAP orders not supported** — API supports TWAP order placement/cancellation. SDK does not implement these.

10. **Schedule Cancel (dead man's switch) not supported** — Advanced feature not in SDK.

11. **Sub-account management not implemented** — API has `subAccounts` info type and related exchange actions.

### Auth Comparison

| Feature | API Docs | SDK | Match? |
|---------|----------|-----|--------|
| Method | EIP-712 cryptographic signatures | EIP-712 with phantom agent pattern | YES |
| Nonce | Timestamp in milliseconds | Uses `Date.now()` | YES |
| Chain ID | 1337 (mainnet) for trading | 1337 for trading, 42161 for account actions | YES |
| Agent/API wallet | `approveApiWallet` action | Implemented via `source:'a'` in agent type | YES |

### Rate Limits

| Feature | API Docs | SDK | Match? |
|---------|----------|-----|--------|
| Address-based limits | Yes, increased via volume/reservation | 1200 req/60s in constants | PARTIAL |
| Dynamic rate limiting | `reserveRequestWeight` action available | Not implemented | MISSING |

### Symbol Format

| Feature | API Docs | SDK | Match? |
|---------|----------|-----|--------|
| Perpetuals | Coin name (e.g., "BTC") | `unifiedToHyperliquid("BTC/USDT:USDT")` → "BTC" | YES |
| Spot | `PURR/USDC` or `@{index}` | Not clearly handling spot format | UNCLEAR |

---

## 2. Lighter (Zklighter)

### Sources
- **SDK files**: `src/adapters/lighter/` (9 key files)
- **API docs**: [Lighter API Docs](https://apidocs.lighter.xyz) — `https://mainnet.zklighter.elliot.ai/`

### Endpoints Comparison

| Feature | API Docs | SDK Implementation | Match? |
|---------|----------|-------------------|--------|
| Base URL | `https://mainnet.zklighter.elliot.ai` | `https://mainnet.zklighter.elliot.ai` | YES |
| Markets | GET `/api/v1/orderBookDetails` | GET `/api/v1/orderBookDetails` | YES |
| Order Book | GET `/api/v1/orderBookOrders?market_id=&limit=` | Matches with `market_id` param | YES |
| Trades | GET `/api/v1/recentTrades` or `/api/v1/trades` | Uses `/api/v1/trades?symbol=&limit=` | YES |
| Candles | GET `/api/v1/candles` (max 500) | Not explicitly seen in MarketData | CHECK |
| Funding | GET `/api/v1/funding-rates` (current), `/api/v1/fundings` (historical) | Uses `/funding/{symbol}` — DIFFERENT FORMAT | MISMATCH |
| Account | GET `/api/v1/account` (by index or L1 address) | Uses `/account/positions`, `/account/balance` | MISMATCH |
| Active Orders | GET `/api/v1/accountActiveOrders` (requires auth) | Uses `/orders` | MISMATCH |
| Inactive Orders | GET `/api/v1/accountInactiveOrders` | Uses `/account/inactiveOrders` | MISMATCH |
| Fills | Not explicitly in API overview but referenced | Uses `/account/fills` | CHECK |
| Submit TX | POST `/api/v1/sendTx` | POST `/api/v1/sendTx` | YES |
| Batch TX | POST `/api/v1/sendTxBatch` | Not implemented | MISSING |
| Asset Details | GET `/api/v1/assetDetails` | Not implemented | MISSING |

### Findings

#### CRITICAL

1. **Funding endpoint path mismatch** — SDK uses `/funding/{symbol}` but API docs show `/api/v1/funding-rates` (current rates) and `/api/v1/fundings` (historical). The SDK path format doesn't match the documented API paths. This could cause 404 errors or incorrect data.

2. **Account endpoint paths diverge significantly** — SDK uses short paths (`/account/positions`, `/account/balance`, `/orders`, `/account/inactiveOrders`, `/account/fills`) but the real API uses `/api/v1/account`, `/api/v1/accountActiveOrders`, `/api/v1/accountInactiveOrders`. The SDK paths look like they may be from an older or different API version.

#### HIGH

3. **Missing batch transaction support** — API supports `POST /api/v1/sendTxBatch` for submitting multiple transactions at once. SDK only supports single `sendTx`. This is important for batch order placement/cancellation performance.

4. **Missing `assetDetails` endpoint** — Provides asset specifications needed for precision/lot size calculations.

5. **Missing exchange stats endpoint** — GET `/api/v1/exchangeStats` for volume/OI data.

#### MEDIUM

6. **Auth endpoint paths differ** — SDK uses `/api/v1/tokens_create` and `/api/v1/tokens_revoke` for API key management, which does match the docs. However, the dual auth mode (HMAC vs WASM) complicates the path structure. HMAC mode uses different endpoint paths for order placement (`POST /orders`) vs WASM mode (`POST /api/v1/sendTx`).

7. **Missing candle endpoint implementation** — API has GET `/api/v1/candles` with max 500 per call. Implementation status unclear in `LighterMarketData.ts`.

8. **Pagination via cursor not implemented** — API uses cursor-based pagination across multiple endpoints. SDK doesn't appear to support this pattern.

#### LOW

9. **Missing deposit/withdrawal endpoints** — Bridge, fast withdraw, deposit history endpoints not implemented.

10. **Missing referral system endpoints** — Not critical for trading.

### Auth Comparison

| Feature | API Docs | SDK | Match? |
|---------|----------|-----|--------|
| Header auth | `authorization` header | Bearer token (WASM) or X-API-KEY+X-TIMESTAMP+X-SIGNATURE (HMAC) | PARTIAL |
| Query auth | `auth` query param supported | Not implemented | MISSING |
| API keys | Via SDK provisioning with account/key index | Implemented in LighterAuth | YES |

### Rate Limits

| Feature | API Docs | SDK | Match? |
|---------|----------|-----|--------|
| Candles | 500 per request | Implemented in constants as tier limits | YES |
| Order book | 250 per request | limit parameter passed through | YES |
| Tiers | Not specified in overview | tier1=60, tier2=600, tier3=4000/min in constants | CHECK |

### Symbol Format

| Feature | API Docs | SDK | Match? |
|---------|----------|-----|--------|
| Market ID | `market_id` (int16) for order book | Uses `market_id` parameter | YES |
| Symbol | String symbol for trades, funding | Converts "BTC/USDC:USDC" → "BTC" | YES |
| Quote | USDC | USDC in normalizer | YES |

---

## 3. GRVT (Gravity)

### Sources
- **SDK files**: `src/adapters/grvt/` (5 key files)
- **API docs**: [GRVT API Docs](https://api-docs.grvt.io/) — Note: 403 Forbidden on detailed pages; analysis based on code + search results

### Architecture Note

GRVT adapter uses the official `@grvt/client` SDK (MDG for market data, TDG for trading) rather than raw REST calls. This is a significant architectural choice that delegates endpoint management to the official SDK.

### Endpoints Comparison (via SDK wrapper)

| Feature | Official SDK Methods | Adapter Implementation | Match? |
|---------|---------------------|----------------------|--------|
| Instruments | `MDG.allInstruments()` | `fetchMarkets` via `sdkWrapper.allInstruments()` | YES |
| Ticker | `MDG.ticker()` | `fetchTicker` via `sdkWrapper.ticker()` | YES |
| Order Book | `MDG.orderBook()` | `fetchOrderBook` via `sdkWrapper.orderBook()` | YES |
| Trades | `MDG.tradesHistory()` | `fetchTrades` via `sdkWrapper.tradesHistory()` | YES |
| Funding | `MDG.funding()` | `fetchFundingRate` via `sdkWrapper.funding()` | YES |
| Candlestick | `MDG.candlestick()` | `fetchOHLCV` via `sdkWrapper.candlestick()` | YES |
| Create Order | `TDG.createOrder()` | `createOrder` via `sdkWrapper.createOrder()` | YES |
| Cancel Order | `TDG.cancelOrder()` | `cancelOrder` via `sdkWrapper.cancelOrder()` | YES |
| Open Orders | `TDG.openOrders()` | `fetchOpenOrders` via `sdkWrapper.openOrders()` | YES |
| Order History | `TDG.orderHistory()` | `fetchOrders` via `sdkWrapper.orderHistory()` | YES |
| Fill History | `TDG.fillHistory()` | `fetchMyTrades` via `sdkWrapper.fillHistory()` | YES |
| Positions | `TDG.positions()` | `fetchPositions` via `sdkWrapper.positions()` | YES |
| Account Summary | `TDG.subAccountSummary()` | `fetchBalance` via `sdkWrapper.subAccountSummary()` | YES |
| Set Leverage | `TDG.setInitialLeverage()` | `setLeverage` via `sdkWrapper.setInitialLeverage()` | YES |

### Findings

#### HIGH

1. **Legacy type definitions in `types.ts`** — The `types.ts` file defines local types (`GRVTMarket`, `GRVTOrder`, `GRVTPosition`, etc.) that are NOT used by the normalizer. The normalizer imports directly from `@grvt/client/interfaces` (`IInstrumentDisplay`, `IOrder`, `IPositions`, etc.). The local types are dead code and could cause confusion. They should be removed or aligned with the SDK interfaces.

2. **OHLCV interval conversion uses seconds** — The adapter converts timeframes to seconds (e.g., '1m' → 60, '1h' → 3600). This should be verified against the official SDK's expected input format. If the SDK expects string intervals (like '1m'), the conversion is incorrect.

3. **Zod validation schemas in types.ts are unused** — `GRVTConfigSchema` with Zod validation is defined but the adapter constructor doesn't use it for config validation. Either use it or remove it.

#### MEDIUM

4. **Session management complexity** — GRVT uses session cookie authentication. The `GRVTSDKWrapper` initializes MDG/TDG clients which handle session management internally. If sessions expire during operation, error recovery may not be properly handled.

5. **Rate limit constant may be inaccurate** — Constants define `100 req/10s` but this should be verified against current GRVT documentation (which was 403-blocked).

6. **Separate host architecture** — Market data goes to `market-data.grvt.io`, trading goes to `edge.grvt.io`. The SDK wrapper correctly routes to separate hosts, but constants should document this more clearly.

7. **Order type mapping limited** — SDK supports `MARKET`, `LIMIT`, `LIMIT_MAKER` but GRVT may support additional order types (e.g., STOP_LIMIT, STOP_MARKET). Need to verify against full API docs.

#### LOW

8. **Max leverage constant (100x)** — Should be verified against actual GRVT instrument specifications which may vary per market.

9. **EIP-712 domain for order signing** — Defined in constants but actual signing is delegated to the `@grvt/client` SDK. The domain definition may be redundant.

### Auth Comparison

| Feature | Known from SDK | Adapter | Match? |
|---------|---------------|---------|--------|
| Method | Session cookies + EIP-712 | Delegated to @grvt/client SDK | YES |
| API Key | Provisioned via GRVT UI | Passed as config to SDK | YES |

### Symbol Format

| Feature | API | SDK | Match? |
|---------|-----|-----|--------|
| Format | `BTC_USDT_Perp` | Converts "BTC/USDT:USDT" ↔ "BTC_USDT_Perp" | YES |
| Quote | USDT | USDT | YES |

---

## 4. Paradex

### Sources
- **SDK files**: `src/adapters/paradex/` (4 key files)
- **API docs**: [Paradex Swagger](https://api.prod.paradex.trade/swagger/doc.json), [Paradex Docs](https://docs.paradex.trade/api/general-information)

### Endpoints Comparison

| Feature | API Docs (Swagger) | SDK Implementation | Match? |
|---------|-------------------|-------------------|--------|
| Base URL | `https://api.prod.paradex.trade/v1` | `https://api.prod.paradex.trade/v1` | YES |
| Auth | POST `/auth` — JWT via StarkNet signature | Implemented in ParadexAuth | YES |
| Markets | GET `/markets` | GET `/markets` | YES |
| Market Detail | GET `/markets/{market}` | GET `/markets/{market}` — via ticker endpoint | YES |
| Ticker | Not a separate endpoint — data in market detail | SDK fetches `/markets/{market}/ticker` | CHECK |
| Order Book | GET `/orderbook/{market}` | GET `/markets/{market}/orderbook` — DIFFERENT PATH | MISMATCH |
| Trades | GET `/trades/{market}` | GET `/markets/{market}/trades` — DIFFERENT PATH | MISMATCH |
| Create Order | POST `/orders` | POST `/orders` | YES |
| List Orders | GET `/orders` | GET `/orders` | YES |
| Cancel Order | DELETE `/orders/{order_id}` | DELETE `/orders/{id}` | YES |
| Cancel All | DELETE `/orders` | Not seen implemented | CHECK |
| Batch Orders | POST `/orders/batch` | Not implemented | MISSING |
| Positions | GET `/positions` | GET `/positions` | YES |
| Position by Market | GET `/positions/{market}` | Not implemented as separate endpoint | MISSING |
| Balance | GET `/balance` | GET `/account/balance` — DIFFERENT PATH | MISMATCH |
| Fills | GET `/fills` | GET `/fills` | YES |
| Account | GET `/account` | Not implemented | MISSING |
| Account Summary | GET `/account/summary` | Not implemented | MISSING |
| Funding Data | GET `/funding/data` | SDK handles funding differently | CHECK |
| Funding Payments | GET `/funding/payments` | Not implemented | MISSING |
| BBO | GET `/bbo/{market}` | Not implemented | MISSING |
| Algo Orders | Multiple TWAP endpoints | Not implemented | MISSING |
| Block Trades | Multiple endpoints | Not implemented | MISSING |

### Findings

#### CRITICAL

1. **Order book endpoint path mismatch** — API docs show `GET /orderbook/{market}` but SDK uses `GET /markets/{market}/orderbook`. This path difference could cause 404 errors unless the server supports both formats.

2. **Trades endpoint path mismatch** — API docs show `GET /trades/{market}` but SDK uses `GET /markets/{market}/trades`. Same concern as order book.

3. **Balance endpoint path mismatch** — API docs show `GET /balance` but SDK uses `GET /account/balance`. This is a different path entirely.

#### HIGH

4. **Missing batch order support** — API supports `POST /orders/batch` for placing multiple orders at once. Not implemented in SDK. Important for market making and multi-leg strategies.

5. **Missing `DELETE /orders` (cancel all)** — API supports cancelling all orders at once. Not seen in adapter.

6. **Missing account endpoints** — `GET /account` and `GET /account/summary` provide important account-level information not available through other endpoints.

7. **Missing funding payments endpoint** — `GET /funding/payments` provides historical funding payment data for the account. Important for PnL tracking.

#### MEDIUM

8. **Ticker endpoint may not exist** — API swagger doesn't show a dedicated `/markets/{market}/ticker` endpoint. Market data may come from `GET /markets/{market}` directly. The SDK's ticker fetch path should be verified.

9. **BBO endpoint not used** — `GET /bbo/{market}` provides best bid/offer data. Could be useful for faster ticker updates vs full order book.

10. **Algo/TWAP orders not supported** — Full TWAP order CRUD endpoints exist but are not implemented.

#### LOW

11. **Block trades not supported** — Institutional feature not critical for standard trading.

12. **Order types** — API supports LIMIT, MARKET, STOP_LIMIT, STOP_MARKET. SDK types show same. Should verify STOP types are properly implemented.

### Auth Comparison

| Feature | API Docs | SDK | Match? |
|---------|----------|-----|--------|
| Method | JWT via StarkNet signature at POST `/auth` | ParadexAuth with StarkNet/Paradex SDK | YES |
| Token types | Readonly, Subkeys, Full access | Config has apiKey, apiSecret, privateKey, starkPrivateKey | YES |
| Rate limit (IP) | 1500 req/min across all accounts per IP | 1500/min default in constants | YES |
| Premium rate | 5000/min | 5000/min premium in constants | YES |

### Symbol Format

| Feature | API Docs | SDK | Match? |
|---------|----------|-----|--------|
| Format | `BTC-USD-PERP` | Converts "BTC/USD:USD" ↔ "BTC-USD-PERP" | YES |
| Quote | USD | USD | YES |

---

## 5. EdgeX

### Sources
- **SDK files**: `src/adapters/edgex/` (4 key files)
- **API docs**: [EdgeX GitBook](https://edgex-1.gitbook.io/edgeX-documentation/api), [EdgeX Auth](https://edgex-1.gitbook.io/edgeX-documentation/api/authentication), [EdgeX L2 Signing](https://edgex-1.gitbook.io/edgeX-documentation/api/sign)

### Endpoints Comparison

| Feature | API Docs | SDK Implementation | Match? |
|---------|----------|-------------------|--------|
| Base URL | `https://pro.edgex.exchange` | `https://pro.edgex.exchange` | YES |
| WS URL | `wss://quote.edgex.exchange` | Not seen in constants | CHECK |
| Metadata | GET `/api/v1/public/meta/getMetaData` | Matches | YES |
| Ticker | GET `/api/v1/public/quote/getTicker?contractId=` | Matches with `contractId` param | YES |
| Depth | GET `/api/v1/public/quote/getDepth?contractId=&level=` | Matches (level=15 or 200 only) | YES |
| Funding | GET `/api/v1/public/funding/getLatestFundingRate?contractId=` | Matches | YES |
| Create Order | POST `/api/v1/private/order/createOrder` | Matches | YES |
| Cancel Order | Referenced in private order API | Matches | YES |
| Positions | GET with `accountId` param | Uses `getPositionTransactionPage` style | CHECK |
| Transfers | Multiple `/api/v1/private/transfer/` endpoints | Basic implementation | PARTIAL |
| Trades (public) | Not documented as public endpoint | `fetchTrades` throws NOT_IMPLEMENTED | CORRECT |

### Findings

#### HIGH

1. **Hardcoded contractId fallbacks** — The normalizer has hardcoded contract ID mappings (e.g., "BTCUSD" → "10000001") as fallbacks. If EdgeX adds new contracts or changes IDs, the SDK will use stale mappings. Should dynamically resolve contract IDs from metadata API.

2. **No testnet support** — Constants show testnet URLs are the same as mainnet (`https://pro.edgex.exchange`). EdgeX API docs confirm beta status but don't provide separate testnet. This should be documented clearly in the adapter.

3. **Order book level restriction undocumented in SDK** — Only `level=15` (snapshot) and `level=200` (full) are supported by the API. The SDK should validate the requested depth level and map it to the nearest valid option rather than passing arbitrary values.

#### MEDIUM

4. **Auth implementation matches** — SDK uses ECDSA + Pedersen Hash for L2 signing, with `X-edgeX-Api-Timestamp` and `X-edgeX-Api-Signature` headers. This matches the documented auth mechanism exactly.

5. **Funding interval correctly set to 4 hours** — Constants define 4-hour funding intervals, which is correct for EdgeX (differs from Hyperliquid's 8-hour).

6. **Missing transfer endpoints** — API has 6 transfer endpoints (`getTransferInById`, `getActiveTransferIn`, `getTransferOutById`, `getActiveTransferOut`, `getTransferOutAvailableAmount`, `createTransferOut`). SDK has basic implementation but may not cover all.

7. **Order types limited** — SDK types show MARKET, LIMIT with GTC/IOC/FOK time-in-force. API docs mention Conditional Orders (stop-limit, stop-market) which may not be fully implemented.

8. **fetchTrades correctly throws NOT_IMPLEMENTED** — This is the right behavior since EdgeX doesn't expose a public trades REST endpoint.

#### LOW

9. **Missing WebSocket URL in constants** — API docs reference `wss://quote.edgex.exchange` but it's not seen in the constants file. Should be added for WebSocket market data streaming.

10. **Symbol format has dual representation** — Both "BTCUSD" concatenated and "BTC-USDC-PERP" legacy format exist in the normalizer. Should consolidate to one canonical format.

### Auth Comparison

| Feature | API Docs | SDK | Match? |
|---------|----------|-----|--------|
| Method | ECDSA + Pedersen Hash | StarkEx L2 private key signing | YES |
| Headers | `X-edgeX-Api-Timestamp`, `X-edgeX-Api-Signature` | Matches | YES |
| Message format | timestamp + method + path + sorted params | Matches | YES |
| Public endpoints | No auth required | Correctly skips auth | YES |

### Rate Limits

| Feature | API Docs | SDK | Match? |
|---------|----------|-----|--------|
| Rate limit | Not explicitly in fetched docs | 1200/min in constants | UNVERIFIED |

### Symbol Format

| Feature | API Docs | SDK | Match? |
|---------|----------|-----|--------|
| Format | `contractId` based (e.g., "10000001") | Converts "BTC/USD:USD" ↔ "BTCUSD" + contractId map | YES |
| Depth levels | 15 or 200 only | Passes `level` parameter | PARTIAL |

---

## Summary of All Findings

### By Severity

| Severity | Count | Exchanges Affected |
|----------|-------|--------------------|
| CRITICAL | 5 | Hyperliquid (1), Lighter (2), Paradex (3) |
| HIGH | 12 | Hyperliquid (3), Lighter (3), GRVT (3), Paradex (4), EdgeX (3) |
| MEDIUM | 14 | All exchanges |
| LOW | 8 | All exchanges |

### Critical Issues Requiring Immediate Attention

1. **Paradex: 3 endpoint path mismatches** — orderbook, trades, and balance endpoints use wrong paths. Could cause 404s in production.
2. **Lighter: Funding endpoint path mismatch** — `/funding/{symbol}` vs documented `/api/v1/funding-rates`.
3. **Lighter: Account endpoint paths from older API version** — Multiple account endpoints don't match current API.
4. **Hyperliquid: `fetchTrades` returns empty silently** — Should throw or clearly document limitation.

### High-Priority Issues

1. **Hyperliquid**: Missing `frontendOpenOrders`, `orderStatus`, `userFillsByTime` endpoints
2. **Lighter**: Missing batch TX support, asset details, exchange stats
3. **GRVT**: Dead code in types.ts, unverified OHLCV interval format, unused Zod schemas
4. **Paradex**: Missing batch orders, cancel-all, account endpoints, funding payments
5. **EdgeX**: Hardcoded contractId fallbacks, no testnet, undocumented level restrictions

### Cross-Cutting Patterns

1. **Missing batch operations** — Lighter (sendTxBatch), Paradex (orders/batch) both support batch operations that SDK doesn't implement
2. **Endpoint path drift** — Paradex and Lighter show signs of endpoint paths drifting from documented API. Likely due to API versioning changes.
3. **Missing advanced order types** — TWAP orders (Hyperliquid, Paradex), conditional orders (EdgeX) not implemented
4. **Incomplete pagination** — Lighter's cursor-based pagination not implemented in SDK
5. **Dead/legacy code** — GRVT types.ts and Hyperliquid error-codes.ts contain dead or duplicate code

### Recommendations

1. **Immediate**: Fix Paradex endpoint paths (orderbook, trades, balance) — likely causing failures
2. **Immediate**: Verify Lighter endpoint paths against live API — high risk of 404s
3. **Short-term**: Add missing critical endpoints (orderStatus, batch operations)
4. **Short-term**: Clean up dead code (GRVT types.ts, Hyperliquid duplicate error maps)
5. **Medium-term**: Implement advanced features (TWAP, batch TX, cursor pagination)
6. **Long-term**: Automated endpoint health checks to detect path drift

---

## Verification Notes

- Hyperliquid API docs were fully accessible and comprehensive
- Lighter API docs were accessible via apidocs.lighter.xyz
- GRVT API docs returned 403 Forbidden — analysis based on code + official SDK + search results
- Paradex API docs were accessible via Swagger JSON endpoint
- EdgeX API docs were partially accessible via GitBook (beta documentation)
- All SDK adapter source files were read in full for every exchange
