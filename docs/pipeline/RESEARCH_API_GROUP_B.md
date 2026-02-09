# Research: API Audit Group B

**Exchanges:** Backpack, Nado, Variational, Extended
**Date:** 2026-02-09
**Agent:** p-research-b

---

## 1. Backpack Exchange

### API Documentation Source
- https://docs.backpack.exchange
- Base URL confirmed: `https://api.backpack.exchange/`

### Findings

#### CRITICAL: Order Side Values Are Wrong
- **SDK** (`constants.ts:67-70`, `utils.ts`): Uses `BUY` / `SELL`
- **API docs**: Expects `Bid` / `Ask`
- **Impact**: All order placement will fail. This is a breaking runtime error.
- **Fix**: Change `BACKPACK_ORDER_SIDES` to `{ buy: 'Bid', sell: 'Ask' }` and update `toBackpackOrderSide()`

#### CRITICAL: Order Type Casing Is Wrong
- **SDK** (`constants.ts:58-62`, `utils.ts`): Uses `MARKET` / `LIMIT` / `POST_ONLY`
- **API docs**: Expects `Market` / `Limit` (PascalCase, not UPPER_CASE)
- **Impact**: All order placement will fail.
- **Fix**: Change `BACKPACK_ORDER_TYPES` to `{ market: 'Market', limit: 'Limit', postOnly: 'PostOnly' }`

#### CRITICAL: Authentication Signature Format Is Wrong
- **SDK** (`BackpackAuth.ts`): Signs `${method}${path}${timestamp}${body}`
- **API docs**: Signature payload is alphabetized query params with instruction prefix, format: `instruction=orderExecute&orderType=Limit&price=100&...&timestamp=...&window=5000`
- **Impact**: All authenticated requests will return 401. Complete auth failure.
- **Fix**: Rewrite `BackpackAuth.sign()` to use alphabetized param format with instruction prefix

#### CRITICAL: Missing X-Window Header
- **SDK** (`BackpackAuth.ts`): Sends headers `X-API-KEY`, `X-Timestamp`, `X-Signature`
- **API docs**: Also requires `X-Window` header (validity window in ms, range 5000-60000)
- **Impact**: Authenticated requests will be rejected.
- **Fix**: Add `X-Window` header to all authenticated requests, default to `5000`

#### HIGH: Missing API Endpoints
- **API has but SDK lacks**:
  - `GET /api/v1/markPrices` — mark prices for all markets
  - `GET /api/v1/openInterest` — open interest data
  - `GET /api/v1/klines` — candlestick/OHLCV data
- **Impact**: Missing market data capabilities
- **Fix**: Add these endpoints to `BACKPACK_ENDPOINTS` and implement in adapter

#### MEDIUM: Cancel All Orders Uses Instruction-Based Approach
- **API docs**: Cancel all uses DELETE `/api/v1/orders` with instruction `orderCancelAll`
- **SDK**: May not include the `instruction` field in the request
- **Verify**: Check if `cancelAllOrders()` includes the instruction parameter in signed payload

#### LOW: Max Leverage Needs Verification
- **SDK** (`constants.ts:117`): `BACKPACK_MAX_LEVERAGE = 10`
- **API docs**: No explicit max leverage documented; may vary by market
- **Action**: Verify against API response or add dynamic leverage lookup

### Summary Table

| Category | Finding | Severity |
|----------|---------|----------|
| Order Sides | `BUY/SELL` should be `Bid/Ask` | CRITICAL |
| Order Types | `MARKET/LIMIT` should be `Market/Limit` | CRITICAL |
| Auth Signature | Wrong signature format (simple concat vs alphabetized params) | CRITICAL |
| Auth Headers | Missing `X-Window` header | CRITICAL |
| Endpoints | Missing markPrices, openInterest, klines | HIGH |
| Cancel All | May miss instruction parameter | MEDIUM |
| Leverage | Hardcoded max 10, needs verification | LOW |

---

## 2. Nado Exchange

### API Documentation Source
- https://docs.nado.xyz/developer-resources/api
- Gateway REST: `https://gateway.prod.nado.xyz/v1`
- Gateway V2: `https://gateway.prod.nado.xyz/v2`

### Findings

#### HIGH: V2 API Available — SDK Uses V1 Only
- **SDK** (`constants.ts:13-22`): Only V1 endpoints configured
- **API docs**: V2 introduces separate Gateway (real-time) and Archive (historical) endpoints:
  - Gateway V2: `https://gateway.prod.nado.xyz/v2` (Assets, Pairs, Orderbook)
  - Archive V2: `https://archive.prod.nado.xyz/v2` (Tickers, Contracts, Trades)
- **Impact**: SDK missing V2 features; V1 may be deprecated in future
- **Fix**: Add V2 URLs to `NADO_API_URLS`; consider dual support or migration path

#### HIGH: Missing Archive/Indexer Endpoints
- **SDK**: No archive/indexer URL configured
- **API docs**: Available endpoints:
  - Archive V1: `https://archive.prod.nado.xyz/v1`
  - Archive V2: `https://archive.prod.nado.xyz/v2`
- **Impact**: Cannot query historical data (trades history, order history, events)
- **Fix**: Add archive URLs and implement history query methods

#### HIGH: Missing Trigger Service Endpoint
- **SDK**: No trigger service URL
- **API docs**: `https://trigger.prod.nado.xyz/v1` — for stop-loss/take-profit orders
- **Impact**: Cannot use conditional/trigger orders
- **Fix**: Add trigger URL and implement trigger order methods

#### HIGH: New Place Orders Batch Execute (Nov 2025)
- **SDK** (`NadoAdapter.ts`): Uses single `place_order` execute
- **API docs (Nov 2025 changelog)**: New `place_orders` batch execute type with `stop_on_failure` parameter
- **Impact**: Missing batch order capability; single order placement still works
- **Fix**: Add `place_orders` batch execute type to `NADO_EXECUTE_TYPES`

#### HIGH: Order Appendix Field Changes (Feb 2026)
- **API docs (Feb 2026)**: New `appendix` field (128-bit) in PlaceOrder:
  - Includes `builder` (16 bits), `builder_fee_rate` (10 bits)
  - Full bit layout: `value(64b) | reserved(50b) | trigger(2b) | reduce_only(1b) | order_type(2b) | isolated(1b) | version(8b)`
- **SDK**: May not handle the updated appendix format with builder fields
- **Impact**: Cannot set builder codes for fee sharing
- **Fix**: Update EIP-712 order type definition and appendix encoding

#### MEDIUM: Missing Subscription WebSocket URL
- **SDK** (`constants.ts:16`): WS URL is `wss://gateway.prod.nado.xyz/v1/ws`
- **API docs**: Subscription-specific URL: `wss://gateway.prod.nado.xyz/v1/subscribe`
- **Impact**: Subscription streaming may fail if using wrong endpoint
- **Verify**: Check if `/v1/ws` and `/v1/subscribe` serve different purposes

#### MEDIUM: Quote Currency Inconsistency
- **SDK** (`NadoNormalizer.ts`): `normalizeSymbol()` uses USDC for perps, but `symbolToCCXT()` defaults to USDT
- **API docs**: Nado uses USDT0 (USDT on Ink L2) for settlement
- **Impact**: Symbol normalization may produce incorrect CCXT symbols
- **Fix**: Standardize on USDT for all Nado symbols; verify `USDT0` vs `USDT` handling

#### MEDIUM: New WebSocket Streams (Nov 2025)
- **SDK** (`constants.ts:150-157`): Channels include orderbook, trades, positions, orders, subaccount, fills
- **API docs**: New streams added:
  - `FundingPayment` — hourly funding events
  - `Liquidation` — liquidation info
  - `LatestCandlestick` — candlestick updates
  - `FundingRate` — funding rate updates every 20 seconds
- **Impact**: Missing streaming data for funding, liquidations, candles
- **Fix**: Add new channels to `NADO_WS_CHANNELS`

#### MEDIUM: Query Renamed: `usdc_price` → `quote_price`
- **API docs (Nov 2025)**: Query `usdc_price` renamed to `quote_price`
- **SDK**: Check if using `usdc_price` anywhere
- **Fix**: Update to use `quote_price`

#### MEDIUM: New `trading_status` Field (Jan 2026)
- **API docs**: Symbols query now returns `trading_status` field
  - Values: `"live"`, `"post_only"`, `"not_tradable"`, `null`
  - `delisted` field maps to `trading_status == "not_tradable"`
- **SDK**: May not handle `trading_status`
- **Fix**: Add `trading_status` to `NadoSymbol` type and use in market filtering

#### MEDIUM: New Error Codes
- **API docs**: New error codes since Nov 2025:
  - `2069` — `MarketTradingBlocked`
  - `2117` — `MarketPostOnlyMode`
  - `2118` — `InvalidBuilder`
- **SDK** (`error-codes.ts`): May not include these
- **Fix**: Add new error codes to `NADO_ERROR_CODES`

#### LOW: EIP-712 Domain — Chain ID Confirmation
- **SDK** (`constants.ts:28-29`): mainnet=57073, testnet=763373
- **API docs**: Confirms testnet chain ID 763373
- **Status**: Correct

#### LOW: Min Size Denomination Changed (Nov 2025)
- **API docs**: `min_size` is now USDT0-denominated (notional), not base-denominated
- **SDK**: Check how `min_size` is used in order validation
- **Fix**: Ensure `min_size` is interpreted as notional value, not base quantity

### Summary Table

| Category | Finding | Severity |
|----------|---------|----------|
| API Version | V2 API available, SDK only uses V1 | HIGH |
| Endpoints | Missing archive/indexer endpoints | HIGH |
| Endpoints | Missing trigger service endpoint | HIGH |
| Orders | Batch `place_orders` execute not supported | HIGH |
| Orders | Appendix field updated with builder fields (Feb 2026) | HIGH |
| WebSocket | Subscription URL may differ from WS URL | MEDIUM |
| Normalizer | Quote currency inconsistency (USDC vs USDT) | MEDIUM |
| WebSocket | Missing new stream channels (funding, liquidation, candles) | MEDIUM |
| Query | `usdc_price` renamed to `quote_price` | MEDIUM |
| Types | Missing `trading_status` field | MEDIUM |
| Errors | Missing new error codes (2069, 2117, 2118) | MEDIUM |
| Config | Chain IDs correct | LOW (OK) |
| Orders | `min_size` denomination changed to notional | LOW |

---

## 3. Variational Exchange

### API Documentation Source
- https://docs.variational.io/technical-documentation/api
- Base URL: `https://omni-client-api.prod.ap-northeast-1.variational.io`

### Findings

#### HIGH: Trading API Is Not Yet Available
- **SDK** (`VariationalAdapter.ts:1-50`): Claims "FULLY FUNCTIONAL" with trading, positions, balance
- **API docs**: Trading API is explicitly "in development" and "not yet available to any users"
- **Only available endpoint**: `GET /metadata/stats` (read-only market data)
- **Impact**: All trading methods (`createOrder`, `cancelOrder`, `fetchPositions`, `fetchBalance`, `requestQuote`, `acceptQuote`) will fail at runtime
- **Fix**: Mark trading methods as "not yet available"; update adapter status to partial

#### HIGH: Authentication Header Names Are Wrong
- **SDK** (`VariationalAdapter.ts`): Uses `X-API-Key`, `X-Timestamp`, `X-Signature`
- **API docs**: Uses `X-Variational-Key`, `X-Request-Timestamp-Ms`, `X-Variational-Signature`
- **Impact**: All authenticated requests will fail (wrong header names)
- **Fix**: Update header names to match API docs

#### HIGH: Signature Format Is Wrong
- **SDK**: Signs `${timestamp}${method}${path}${body}` with HMAC-SHA256
- **API docs**: Signs `API_KEY|timestamp_ms|HTTP_METHOD|request_path_with_query_string` (pipe-delimited), with body appended after another pipe for POST requests
- **Impact**: All authenticated requests will return signature mismatch
- **Fix**: Update signature generation to use pipe-delimited format with API key included

#### MEDIUM: Many Endpoints Are Speculative
- **SDK** (`constants.ts:29-57`): Lists numerous endpoints marked "Planned/Expected" and "Under Development"
- **API docs**: Only `/metadata/stats` is confirmed available
- **Impact**: Most endpoint paths are guesses that may not match actual API when released
- **Fix**: Remove or clearly mark speculative endpoints; implement only confirmed ones

#### MEDIUM: Rate Limits Match
- **SDK** (`constants.ts:66-80`): Per IP 10/10s, Global 1000/min
- **API docs**: Per IP 10/10s, Global 1000/min
- **Status**: Correct

#### LOW: WebSocket URLs Are Placeholders
- **SDK** (`constants.ts:14,18`): `wss://ws.variational.io`, `wss://ws-testnet.variational.io`
- **API docs**: No WebSocket API documented
- **Impact**: WebSocket connections will fail; these are placeholder URLs
- **Fix**: Mark as TODO, remove from active configuration

#### LOW: Testnet URL Is Speculative
- **SDK** (`constants.ts:17`): `https://omni-client-api.testnet.variational.io`
- **API docs**: No testnet URL documented
- **Fix**: Verify or mark as unconfirmed

### Summary Table

| Category | Finding | Severity |
|----------|---------|----------|
| Trading API | Not available — SDK claims "FULLY FUNCTIONAL" | HIGH |
| Auth Headers | Wrong names: should be X-Variational-Key, X-Request-Timestamp-Ms, X-Variational-Signature | HIGH |
| Auth Signature | Wrong format: should be pipe-delimited with API key | HIGH |
| Endpoints | Most endpoints are speculative/unconfirmed | MEDIUM |
| Rate Limits | Correct (10/10s per IP, 1000/min global) | LOW (OK) |
| WebSocket | URLs are placeholders, no WS API exists | LOW |
| Testnet | URL is speculative | LOW |

---

## 4. Extended Exchange

### API Documentation Source
- https://api.docs.extended.exchange/
- Base URL: `https://api.starknet.extended.exchange`

### Findings

#### CRITICAL: Rate Limit Configuration Mismatch
- **SDK** (`constants.ts:67-80`): Default 100 req/sec (= 6000/min), Authenticated 200/sec, VIP 500/sec
- **API docs**: 1,000 req/min per IP (standard), 60,000/5min for market makers, HTTP 429 on exceed
- **Impact**: SDK rate limiter is 6x too permissive (100/sec = 6000/min vs actual 1000/min limit). Users will get rate limited.
- **Fix**: Change default to `{ maxRequests: 1000, windowMs: 60000 }` (per minute)

#### HIGH: Several Endpoint Paths Don't Match API Docs
- **SDK** (`constants.ts:39`): `CANCEL_ALL_ORDERS: '/api/v1/user/orders/cancel-all'`
- **API docs**: Mass cancel is `DELETE /api/v1/user/orders` (with optional `market` param)
- **SDK** (`constants.ts:40`): `EDIT_ORDER: '/api/v1/user/order/{orderId}'` (same path as cancel)
- **API docs**: Create/Edit order is `POST /api/v1/user/order` (same endpoint for both create and edit)
- **SDK** (`constants.ts:41`): `BATCH_ORDERS: '/api/v1/user/orders/batch'`
- **API docs**: No batch orders endpoint documented
- **SDK** (`constants.ts:34`): `FUNDING_HISTORY: '/api/v1/info/{market}/funding/history'`
- **API docs**: Funding history is at `/api/v1/info/{market}/funding` (same as funding rate, with params)
- **Impact**: Cancel-all and batch order requests will 404
- **Fix**: Update endpoint paths to match API docs

#### HIGH: Missing API Endpoints
- **API has but SDK lacks**:
  - `GET /api/v1/info/candles/{market}/{candleType}` — OHLCV candlestick data
  - `GET /api/v1/info/{market}/open-interests` — open interest history
  - `GET /api/v1/info/builder/dashboard` — builder dashboard
  - `GET /api/v1/user/account/info` — account details
  - `GET /api/v1/user/assetOperations` — deposit/withdrawal history
  - `GET /api/v1/user/positions/history` — position close history
  - `GET /api/v1/user/orders/{id}` — get single order by ID
  - `GET /api/v1/user/orders/external/{externalId}` — get order by external ID
  - `DELETE /api/v1/user/order/external/{externalId}` — cancel by external ID
  - `POST /api/v1/user/orders/auto-cancel` — dead man's switch
  - `GET /api/v1/user/funding/history` — funding payments
  - `PATCH /api/v1/user/leverage` — update leverage (SDK has GET but not PATCH)
  - `GET /api/v1/user/fees` — fee info with builderId
  - `GET /api/v1/user/equity-history` — account equity history
  - `GET /api/v1/user/pnl-history` — PnL history
  - Transfer, bridge, referral, and points endpoints
- **Impact**: Missing significant functionality
- **Fix**: Add critical endpoints (candles, open interest, auto-cancel, funding history, leverage update)

#### HIGH: StarkNet Testnet Chain ID Is Deprecated
- **SDK** (`constants.ts:185`): `testnet: 'SN_GOERLI'`
- **Reality**: StarkNet Goerli was deprecated in favor of Sepolia (mid-2024)
- **Impact**: Testnet StarkNet operations will fail
- **Fix**: Change to `'SN_SEPOLIA'`

#### HIGH: Order Creation Requires Stark Signature
- **API docs**: Order creation requires `settlement` field with Stark key signature
- **SDK** (`ExtendedAdapter.ts`): Has optional `starkNetClient` but may not include `settlement` in order payload
- **Impact**: Orders may be rejected without proper Stark signature
- **Verify**: Check if `createOrder` constructs proper settlement payload

#### MEDIUM: Missing Required User-Agent Header
- **API docs**: `User-Agent` header is required for all requests
- **SDK**: May not set this header
- **Fix**: Add `User-Agent: PD-AIO-SDK/1.0` header to all requests

#### MEDIUM: Pagination Model
- **API docs**: Cursor-based pagination with `cursor` and `limit` params, response includes `pagination: { cursor, count }`
- **SDK**: Verify that history methods support cursor-based pagination
- **Fix**: Ensure all list methods support `cursor` parameter

#### MEDIUM: SDK Has Phantom Endpoints
- **SDK** (`constants.ts:53-61`): Has endpoints not in API docs:
  - `/api/v1/user/margin-mode` — not documented
  - `/api/v1/user/portfolio` — not documented
  - `/api/v1/starknet/state` — not documented
  - `/api/v1/starknet/transaction/{txHash}` — not documented
  - `/api/v1/starknet/account/{address}` — not documented
  - `/api/v1/rate-limit` — not documented
- **Impact**: These endpoints may not exist, causing 404 errors
- **Fix**: Verify or remove undocumented endpoints

#### LOW: Response Format
- **API docs**: `{ status: "ok"|"error", data: {}, error: { code, message }, pagination: { cursor, count } }`
- **SDK**: Verify response parsing matches this format
- **Fix**: Ensure normalizers handle `status: "ok"` (not `"success"`)

### Summary Table

| Category | Finding | Severity |
|----------|---------|----------|
| Rate Limits | 6x too permissive (100/sec vs 1000/min) | CRITICAL |
| Endpoints | Cancel-all path wrong (`/cancel-all` vs DELETE `/orders`) | HIGH |
| Endpoints | Batch orders endpoint doesn't exist | HIGH |
| Endpoints | Funding history path wrong | HIGH |
| Endpoints | 15+ API endpoints missing from SDK | HIGH |
| StarkNet | Testnet chain ID `SN_GOERLI` deprecated, should be `SN_SEPOLIA` | HIGH |
| Orders | May need Stark signature in `settlement` field | HIGH |
| Headers | Missing required `User-Agent` header | MEDIUM |
| Pagination | Cursor-based model needs verification | MEDIUM |
| Endpoints | 6 SDK endpoints not in API docs (phantom) | MEDIUM |
| Response | Status value may be `ok` not `success` | LOW |

---

## Cross-Exchange Summary

### Critical Issues (Will Cause Runtime Failures)

| Exchange | Issue | Category |
|----------|-------|----------|
| Backpack | Order sides `BUY/SELL` should be `Bid/Ask` | Data format |
| Backpack | Order types `MARKET/LIMIT` should be `Market/Limit` | Data format |
| Backpack | Auth signature uses wrong format | Authentication |
| Backpack | Missing `X-Window` auth header | Authentication |
| Extended | Rate limit 6x too permissive | Rate limiting |

### High-Priority Issues

| Exchange | Issue | Category |
|----------|-------|----------|
| Nado | V2 API available, SDK only uses V1 | API version |
| Nado | Missing archive, trigger endpoints | Missing features |
| Nado | Batch orders, appendix changes | API changes |
| Variational | Trading API not yet available | API availability |
| Variational | Auth header names are wrong | Authentication |
| Variational | Auth signature format is wrong | Authentication |
| Extended | Multiple endpoint paths wrong | Endpoint paths |
| Extended | 15+ missing endpoints | Missing features |
| Extended | StarkNet Goerli deprecated | Configuration |
| Extended | Stark signature for orders | Authentication |

### Exchanges Ranked by Fix Urgency

1. **Backpack** — 4 CRITICAL issues, all trading broken (auth + order format)
2. **Extended** — 1 CRITICAL + 5 HIGH issues, rate limiting and endpoints wrong
3. **Variational** — 3 HIGH issues, but trading API not live yet (lower urgency)
4. **Nado** — 0 CRITICAL, 5 HIGH issues, V1 still works but missing V2 features

---

## Methodology

1. Read all SDK adapter files (33 files across 4 exchanges)
2. Fetched real API documentation from official sources
3. Compared endpoint paths, request parameters, authentication, and response formats
4. Checked API changelogs for recent breaking changes
5. Severity ratings: CRITICAL = runtime failure, HIGH = missing functionality, MEDIUM = suboptimal, LOW = minor
