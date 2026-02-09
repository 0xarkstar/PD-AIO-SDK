# Design: API Audit Fix Plan — Cycle 5

## Audit Summary
- 13 exchanges audited against real API docs
- 60+ issues found: ~17 CRITICAL, ~20 HIGH, ~15 MEDIUM, ~10 LOW
- 3 research reports: RESEARCH_API_GROUP_A/B/C.md

## Scope: CRITICAL + HIGH Fixes Only (Code-Only, No New Dependencies)

### DEFERRED (needs live verification, new deps, or architecture changes)
- dYdX auth (needs @cosmjs for Cosmos address derivation)
- Jupiter Price API v2 vs v3 (needs live API test)
- Drift/GMX dynamic market lists (architecture change — needs fetchMarkets refactor)
- Drift DLOB /user endpoint (needs live verification)
- Variational trading API (not live yet — nothing to fix)
- Nado V2 migration (V1 still works, V2 is enhancement)

---

## Implementation Streams

### Stream 1: Backpack Adapter Fix (HIGHEST PRIORITY — All Trading Broken)
**Owner**: p-impl-backpack
**Files**: `src/adapters/backpack/constants.ts`, `BackpackAuth.ts`, `BackpackAdapter.ts`, `BackpackNormalizer.ts`

Fixes:
1. **constants.ts**: Order sides `BUY/SELL` → `Bid/Ask`
2. **constants.ts**: Order types `MARKET/LIMIT/POST_ONLY` → `Market/Limit/PostOnly`
3. **BackpackAuth.ts**: Rewrite signature format — alphabetized params with `instruction` prefix
4. **BackpackAdapter.ts**: Add `X-Window` header (default 5000ms) to all authenticated requests
5. **BackpackNormalizer.ts**: Update `normalizeOrderSide` to handle `Bid/Ask` responses, `normalizeOrderType` to handle `Market/Limit`

### Stream 2: Paradex + Lighter + Extended Endpoint Fixes
**Owner**: p-impl-endpoints-a
**Files**: Paradex (`src/adapters/paradex/ParadexAdapter.ts`), Lighter (`src/adapters/lighter/LighterMarketData.ts`, `LighterAccount.ts`, `LighterAdapter.ts`), Extended (`src/adapters/extended/constants.ts`, `ExtendedAdapter.ts`)

Fixes:
1. **Paradex**: Fix 3 endpoint paths
   - orderbook: `/markets/{m}/orderbook` → `/orderbook/{m}`
   - trades: `/markets/{m}/trades` → `/trades/{m}`
   - balance: `/account/balance` → `/balance`
2. **Lighter**: Fix endpoint paths
   - funding: `/funding/{symbol}` → `/api/v1/funding-rates?symbol={symbol}`
   - account: `/account/positions` → `/api/v1/account?l1_address={addr}`
   - active orders: `/orders` → `/api/v1/accountActiveOrders`
   - inactive orders: `/account/inactiveOrders` → `/api/v1/accountInactiveOrders`
3. **Extended**: Fix rate limit from 100/sec (6000/min) to 1000/min

### Stream 3: dYdX + GMX + Silent-Return Fixes
**Owner**: p-impl-endpoints-b
**Files**: dYdX (`src/adapters/dydx/DydxAdapter.ts`), GMX (`src/adapters/gmx/GmxAdapter.ts`), Hyperliquid (`src/adapters/hyperliquid/HyperliquidAdapter.ts`), Jupiter (`src/adapters/jupiter/JupiterAdapter.ts`), GRVT (`src/adapters/grvt/types.ts`)

Fixes:
1. **dYdX**: Fix endpoint paths
   - trades: path param → query param (`/trades?market={ticker}`)
   - candles: path param → query param
   - historical funding: path param → query param
   - orders/fills: add subaccountNumber to path
2. **GMX**: Fix candlesticks endpoint `/candlesticks` → `/prices/candles`
3. **Hyperliquid**: `fetchTrades` should throw PerpDEXError NOT_SUPPORTED instead of returning []
4. **Jupiter**: `fetchTrades` should throw PerpDEXError NOT_SUPPORTED instead of returning []
5. **GRVT**: Remove dead legacy types from types.ts (unused local type definitions)

---

## File Ownership Map

```
p-impl-backpack:
  - src/adapters/backpack/constants.ts
  - src/adapters/backpack/BackpackAuth.ts
  - src/adapters/backpack/BackpackAdapter.ts
  - src/adapters/backpack/BackpackNormalizer.ts
  - tests/unit/backpack*.test.ts (test updates only)
  - tests/integration/backpack*.test.ts (test updates only)

p-impl-endpoints-a:
  - src/adapters/paradex/ParadexAdapter.ts
  - src/adapters/lighter/LighterMarketData.ts
  - src/adapters/lighter/LighterAccount.ts
  - src/adapters/lighter/LighterAdapter.ts
  - src/adapters/extended/constants.ts
  - src/adapters/extended/ExtendedAdapter.ts

p-impl-endpoints-b:
  - src/adapters/dydx/DydxAdapter.ts
  - src/adapters/gmx/GmxAdapter.ts
  - src/adapters/hyperliquid/HyperliquidAdapter.ts
  - src/adapters/jupiter/JupiterAdapter.ts
  - src/adapters/grvt/types.ts
```

## Quality Gates
- `npx tsc --noEmit` — 0 errors
- `npx jest --forceExit` — 4822+ tests, 0 failures (update tests as needed)
- `npm run build` — PASS
- No breaking changes to public TypeScript types
