# PD-AIO-SDK Codebase Analysis

**Research Date**: 2026-02-13
**SDK Version**: 0.2.0
**Total Source Files**: ~170 TypeScript files (~60,639 lines)

## Executive Summary

PD-AIO-SDK is a well-architected, production-oriented unified TypeScript SDK covering 16 decentralized perpetual exchanges through a single `IExchangeAdapter` interface. The codebase demonstrates strong engineering fundamentals: strict TypeScript configuration, a comprehensive error hierarchy with 20+ typed error classes, CCXT-compatible API design, and enterprise features (circuit breaker, rate limiter, Prometheus metrics, structured logging with correlation IDs). At ~60,600 lines of source code with 139 unit test files and 22 integration test files producing 78% line coverage, the SDK is well-tested but has coverage gaps in newer adapters (Drift 10%, Extended 0%, GMX 30%). The primary competitive differentiator is breadth — no other SDK covers this many perp DEX exchanges with a unified interface.

## Architecture

### Directory Layout

```
src/
├── adapters/           # 17 adapter directories (16 exchanges + base)
│   ├── base/           # BaseAdapter (1,394 lines) + BaseAdapterCore + mixins
│   ├── hyperliquid/    # Most mature: 12 files, full WebSocket
│   ├── dydx/           # 8 files, Cosmos SDK integration
│   ├── lighter/        # 15 files, WASM signer support
│   ├── aster/          # 8 files, Binance-style API (newest)
│   ├── pacifica/       # 8 files, Solana-based (newest)
│   ├── ostium/         # 10 files, RWA perps (newest)
│   └── ... (10 more: grvt, paradex, edgex, backpack, nado, variational,
│            extended, drift, jupiter, gmx)
├── core/               # Infrastructure (9 files)
│   ├── CircuitBreaker.ts, RateLimiter.ts, retry.ts, resilience.ts
│   ├── logger.ts, http/HTTPClient.ts
│   ├── calculations/pnl.ts
│   └── validation/     # Zod-based runtime validation
├── types/              # 6 files: adapter.ts (937 lines), common.ts (907), errors.ts (497)
├── utils/              # 5 files: symbols.ts, config.ts, crypto.ts, buffer.ts, type-guards.ts
├── websocket/          # WebSocketClient.ts (369 lines), WebSocketManager.ts
├── monitoring/         # Prometheus metrics + metrics HTTP server
├── browser/            # Browser WebSocket polyfill
├── factory.ts          # Exchange factory with plugin registry
└── index.ts            # Barrel exports (348 lines)
```

### Adapter Pattern

The architecture follows a clean **Template Method / Strategy** pattern:

1. **`IExchangeAdapter`** (937 lines) — comprehensive interface with 50+ methods spanning market data, trading, positions, WebSocket, and account history
2. **`BaseAdapter`** (1,394 lines) — abstract base class providing:
   - HTTP request handling with retry (3 attempts, exponential backoff)
   - Circuit breaker integration
   - Market cache management (5-min TTL)
   - Health check orchestration
   - Metrics tracking (latency, success/failure, per-endpoint)
   - Validation (Zod-based `validateOrderRequest`)
   - CCXT convenience methods (`createLimitBuyOrder`, etc.)
   - Python-style snake_case aliases
   - Resource tracking (timers, intervals, AbortControllers)
   - Default `NotSupportedError` for unimplemented features
3. **Exchange Adapters** — each implements:
   - `has` feature map (which features are supported)
   - `symbolToExchange` / `symbolFromExchange` for symbol normalization
   - Market data methods (fetchMarkets, fetchTicker, etc.)
   - Trading methods (createOrder, cancelOrder, etc.)
   - Separate files for: Auth, Normalizer, Constants, Types, Utils, Error Codes

### Per-Adapter Architecture Pattern (consistent across all 16)

```
<Exchange>/
├── <Exchange>Adapter.ts       # Main adapter (640-1,025 lines)
├── <Exchange>Auth.ts          # Authentication strategy
├── <Exchange>Normalizer.ts    # API response → unified types
├── constants.ts               # URLs, rate limits, mappings
├── types.ts                   # Exchange-specific raw types
├── utils.ts                   # Exchange-specific utilities
├── error-codes.ts             # Error code mapping
├── index.ts                   # Barrel exports
└── <Exchange>WebSocket*.ts    # (if supported) WebSocket wrapper
```

### Core Infrastructure

| Component | Implementation | Quality |
|-----------|---------------|---------|
| **Rate Limiter** | Token bucket with per-endpoint weights, queue, destroy cleanup | Production-ready |
| **Circuit Breaker** | 3-state (CLOSED/OPEN/HALF_OPEN), configurable thresholds, EventEmitter events | Production-ready |
| **Retry** | Exponential backoff, configurable, stats tracking, `withRetry` wrapper | Production-ready |
| **Resilience** | Composable: circuit breaker + retry + fallback + bulkhead + timeout + cache | Production-ready |
| **Logger** | Structured JSON, LogLevels, correlation IDs, sensitive data masking | Production-ready |
| **HTTPClient** | Separate class (used by newer adapters), vs. `BaseAdapter.request()` | Two patterns co-exist |
| **Validation** | Zod schemas for Order, Position, Market, etc. + middleware validators | Production-ready |
| **WebSocket** | Client + Manager, auto-reconnect, heartbeat, subscription management | Production-ready |

### Type System

- **TypeScript Strict Mode**: All strict checks enabled (`strict: true`, `noUncheckedIndexedAccess`, `noImplicitReturns`, `noUnusedLocals/Parameters`)
- **ES2022 target**: Modern JavaScript output
- **Generics usage**: Factory `createExchange<T>` with mapped config types
- **Const assertions**: `as const` for all enums (ORDER_TYPES, ORDER_SIDES, etc.)
- **Type guards**: `isPerpDEXError`, `isRateLimitError`, `isAuthError`, etc.
- **`as any` count**: Only 13 occurrences across 6 files (excellent for 60K lines)

### Error Handling

Comprehensive error hierarchy with 20+ typed error classes:

```
PerpDEXError (base)
├── ExchangeError
├── NotSupportedError
├── BadRequestError / BadResponseError
├── AuthenticationError
│   ├── InvalidSignatureError
│   ├── ExpiredAuthError
│   └── InsufficientPermissionsError
├── NetworkError
│   ├── RateLimitError (with retryAfter)
│   ├── ExchangeUnavailableError
│   └── WebSocketDisconnectedError
├── Trading Errors
│   ├── InsufficientMarginError / InsufficientBalanceError
│   ├── InvalidOrderError / OrderNotFoundError / OrderRejectedError
│   ├── MinimumOrderSizeError
│   └── LiquidationError
├── Validation Errors
│   ├── ValidationError
│   ├── InvalidSymbolError
│   └── InvalidParameterError
├── Timeout Errors
│   └── RequestTimeoutError
└── DEX-Specific
    ├── TransactionFailedError (with txHash)
    └── SlippageExceededError (with expectedPrice/actualPrice)
```

All errors include: `code`, `exchange`, `correlationId`, `originalError`, and `toJSON()`.

**StandardErrorCodes** provides 30+ standardized string codes for consistent error mapping across adapters.

Each adapter has a dedicated `error-codes.ts` with an error mapper function (e.g., `mapAsterError`, `mapOstiumError`).

## Feature Matrix

### Exchange Support Summary (16 Exchanges)

| Exchange | Chain | Auth | Markets | Public API | Trading | Account | WebSocket | Overall |
|----------|-------|------|---------|:----------:|:-------:|:-------:|:---------:|:-------:|
| **Extended** | StarkNet | API Key | 94 perp | 6/7 (86%) | 6/6 (100%) | 8/8 (100%) | 7/8 (88%) | **93%** |
| **Hyperliquid** | L1 | EIP-712 | 228 perp | 6/7 (86%) | 5/6 (83%) | 7/8 (88%) | 6/8 (75%) | **83%** |
| **dYdX v4** | Cosmos | Cosmos SDK | 220+ perp | 7/7 (100%) | 5/6 (83%) | 5/8 (63%) | 7/8 (88%) | **83%** |
| **GRVT** | zkSync | API Key + EIP-712 | 80 perp | 6/7 (86%) | 4/6 (67%) | 5/8 (63%) | 6/8 (75%) | **72%** |
| **Drift** | Solana | Solana Wallet | 30+ perp | 6/7 (86%) | 3/6 (50%) | 5/8 (63%) | 7/8 (88%) | **72%** |
| **Paradex** | StarkNet | StarkNet + JWT | 108 perp | 5/7 (71%) | 3/6 (50%) | 6/8 (75%) | 7/8 (88%) | **71%** |
| **Backpack** | Solana | ED25519 | 75+79 | 5/7 (71%) | 3/6 (50%) | 5/8 (63%) | 6/8 (75%) | **65%** |
| **Lighter** | Lighter L2 | WASM Signing | 132 perp | 5/7 (71%) | 3/6 (50%) | 5/8 (63%) | 6/8 (75%) | **65%** |
| **Nado** | Ink L2 | EIP-712 | 23+3 | 4/7 (57%) | 4/6 (67%) | 5/8 (63%) | 5/8 (63%) | **62%** |
| **EdgeX** | StarkNet | StarkNet ECDSA | 292 perp | 4/7 (57%) | 5/6 (83%) | 4/8 (50%) | 6/8 (75%) | **62%** |
| **Aster** | BNB Chain | HMAC-SHA256 | 100+ perp | 7/7 (100%) | 3/6 (50%) | 4/8 (50%) | 0/8 (0%) | **48%** |
| **Variational** | - | API Key | RFQ | 4/7 (57%) | 5/6 (83%) | 4/8 (50%) | 0/8 (0%) | **45%** |
| **Pacifica** | Solana | ED25519 | 50+ perp | 5/7 (71%) | 3/6 (50%) | 4/8 (50%) | 0/8 (0%) | **41%** |
| **Jupiter** | Solana | Solana Wallet | 3 perp | 5/7 (71%) | 3/6 (50%) | 3/8 (38%) | 0/8 (0%) | **38%** |
| **Ostium** | Arbitrum | ethers.js | 11 RWA | 3/7 (43%) | 3/6 (50%) | 3/8 (38%) | 0/8 (0%) | **31%** |
| **GMX v2** | Arbitrum | On-chain | 11 perp | 5/7 (71%) | 0/6 (0%) | 0/8 (0%) | 0/8 (0%) | **17%** |

### Public API Methods

| Method | HL | EdgeX | Ext | GRVT | Paradex | Backpack | Lighter | Nado | Var | dYdX | Jupiter | Drift | GMX | Aster | Pacifica | Ostium |
|--------|:--:|:-----:|:---:|:----:|:-------:|:--------:|:-------:|:----:|:---:|:----:|:-------:|:-----:|:---:|:-----:|:--------:|:------:|
| fetchMarkets | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| fetchTicker | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| fetchOrderBook | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | - | Y | Y | - |
| fetchTrades | Y | - | Y | Y | Y | Y | Y | ~ | - | Y | - | Y | - | Y | Y | Y |
| fetchOHLCV | Y | - | - | Y | - | - | - | - | - | Y | - | Y | Y | Y | - | - |
| fetchFundingRate | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | - |
| fetchFundingRateHistory | Y | - | Y | - | Y | Y | - | - | - | Y | - | - | - | Y | - | - |

(Y = implemented, ~ = partial, - = not implemented)

### WebSocket Support Distribution

- **Full WebSocket (7+ streams)**: Extended, dYdX, Drift, Paradex, Hyperliquid
- **Partial WebSocket (5-6 streams)**: GRVT, Backpack, Lighter, EdgeX, Nado
- **No WebSocket**: Aster, Pacifica, Ostium, Jupiter, Variational, GMX

### Key Feature Gaps

- **5 exchanges lack WebSocket entirely** (Aster, Pacifica, Ostium, Jupiter, Variational)
- **GMX v2 is read-only** (no trading, requires on-chain tx through ExchangeRouter)
- **fetchOHLCV** only on 7/16 exchanges
- **fetchOrderHistory** only on 10/16 exchanges
- **setLeverage** only on 8/16 exchanges

## Developer Experience

### Getting Started (Good)

```typescript
import { createExchange } from 'pd-aio-sdk';

const exchange = createExchange('hyperliquid', { testnet: true });
await exchange.initialize();
const markets = await exchange.fetchMarkets();
```

- Factory pattern with typed config per exchange
- `getSupportedExchanges()` for discovery
- Plugin system via `registerExchange()` for custom adapters

### API Consistency (Very Good)

- **Unified symbol format**: `BTC/USDT:USDT` (CCXT-compatible)
- **Consistent method signatures**: All adapters implement same interface
- **Feature discovery**: `exchange.has.fetchOHLCV` before calling
- **CCXT-compatible convenience methods**: `createLimitBuyOrder()`, `createMarketSellOrder()`, etc.
- **Python aliases**: `exchange.fetch_markets()`, `exchange.create_order()`, etc.

### TypeScript Quality (Excellent)

- All strict mode checks enabled
- `ExchangeConfigMap` provides per-exchange type narrowing
- `FeatureMap` with 40+ boolean/string flags
- Const assertions for all enum-like values
- Only 13 `as any` in 60K lines of source
- `noUncheckedIndexedAccess` enabled

### Error Messages (Good)

- Typed errors with exchange context
- Correlation IDs for request tracing
- Standard error codes for consistency
- Per-exchange error code mappers

### Configuration (Good but Complex)

- Base `ExchangeConfig` with common fields (apiUrl, wsUrl, testnet, timeout, debug, rateLimit, circuitBreaker, builderCode)
- Per-exchange configs add specific auth fields (wallet, privateKey, apiKey, etc.)
- `.env.example` with 6,229 lines documenting all env vars
- `validateConfig()` utility for config validation

### Pain Points

1. **Inconsistent HTTP patterns**: Older adapters use `BaseAdapter.request()`, newer ones use `HTTPClient` — two separate HTTP abstractions
2. **No lazy loading**: All 16 adapters imported in factory.ts even if only 1 is used (impacts bundle size)
3. **`initialize()` is required but easy to forget** — some methods may silently fail without it
4. **Large `.env.example`** (6,229 lines) — overwhelming for new users

## Code Quality

### File Size Analysis

| Category | Largest Files | Lines |
|----------|--------------|-------|
| Base infrastructure | BaseAdapter.ts | 1,394 |
| Adapter | JupiterAdapter.ts | 1,025 |
| Adapter | GmxAdapter.ts | 984 |
| Adapter | ExtendedAdapter.ts | 944 |
| Type definitions | adapter.ts | 937 |
| Type definitions | common.ts | 907 |

**Files exceeding 800 lines** (6 files):
- `BaseAdapter.ts` (1,394) - justified as the base class
- `JupiterAdapter.ts` (1,025) - could benefit from decomposition
- `GmxAdapter.ts` (984) - complex subgraph + contract interactions
- `ExtendedAdapter.ts` (944) - many features implemented
- `adapter.ts` (937) - comprehensive interface definition
- `common.ts` (907) - all unified type definitions

Most adapter files are well within 400-800 line range. The codebase follows the "many small files" pattern well — each exchange has 8-15 focused files.

### Test Coverage

**Global Coverage (from coverage-summary.json):**

| Metric | Covered | Total | Percentage |
|--------|---------|-------|:----------:|
| Lines | 8,834 | 11,293 | **78.22%** |
| Statements | 9,029 | 11,620 | **77.70%** |
| Functions | 1,958 | 2,342 | **83.60%** |
| Branches | 3,856 | 5,456 | **70.67%** |

**Test Volume:**
- 139 unit test files (~64,754 lines)
- 22 integration test files (~12,978 lines)
- API contract tests, production tests, manual tests available
- 6,000+ test cases (per README badge)

**High-Coverage Modules (90%+):**
- `src/utils/` — 100% statements, 100% functions, 93% branches
- `src/core/calculations/` — 100% statements, 100% functions, 83% branches
- `src/adapters/backpack/` — 97-100% across all metrics
- `src/adapters/hyperliquid/utils.ts` — 91% lines, 88% branches
- `src/adapters/edgex/utils.ts` — 100% everything

**Low-Coverage Modules (potential risk):**
- `src/adapters/drift/` — 10% statements, 13% branches (mostly DriftAdapter.ts at 11%)
- `src/adapters/extended/` — 0% threshold (types.ts has no coverage)
- `src/adapters/gmx/` — 30% statements, 23% branches
- `src/adapters/jupiter/` — 45% statements, 35% branches
- `src/adapters/lighter/signer/` — 38% statements, 20% branches

### ESLint Configuration

Strong configuration with:
- TypeScript ESLint recommended + type-checked rules
- `@typescript-eslint/no-explicit-any: 'warn'`
- `@typescript-eslint/no-floating-promises: 'error'` (important for async code)
- `@typescript-eslint/await-thenable: 'error'`
- `no-console: 'warn'` (with allow for warn/error)
- Prettier integration for formatting

### `as any` Usage (13 occurrences — excellent)

| File | Count | Context |
|------|:-----:|---------|
| factory.ts | 1 | AdapterConstructor cast |
| type-guards.ts | 2 | Type narrowing helpers |
| DriftAdapter.ts | 5 | @drift-labs/sdk interop |
| DriftClientWrapper.ts | 3 | @drift-labs/sdk interop |
| ParadexParaclearWrapper.ts | 1 | @paradex/sdk interop |
| GRVTWebSocketWrapper.ts | 1 | @grvt/client interop |

Most `as any` usage is at SDK boundary interop — expected and acceptable.

### Code Patterns (Positive)

- **Immutable patterns**: Spread operators for object creation, no mutation of inputs
- **Consistent Normalizer pattern**: Each adapter maps raw API types → unified types through a dedicated Normalizer class
- **Error mapping**: Each adapter has dedicated error-code mapper converting exchange-specific errors to `PerpDEXError` subtypes
- **Resource cleanup**: BaseAdapter tracks timers/intervals/AbortControllers and cleans them in `disconnect()`
- **Builder code support**: Universal referral/builder code system across 7 exchanges with on/off toggle

## Documentation

### Existing Documentation (4,346+ lines total)

| Document | Lines | Quality |
|----------|-------|---------|
| **README.md** | 684 | Excellent — badges, feature matrix, quick start, examples |
| **README.ko.md** | ~700 | Korean translation (internationalization) |
| **API.md** | 1,226 | Good — TOC, interface docs, adapter-specific configs |
| **ADAPTER_GUIDE.md** | 947 | Good — how to build new adapters |
| **ARCHITECTURE.md** | 794 | Good — system design overview |
| **CONTRIBUTING.md** | 281 | Basic — code style, PR process |
| **CHANGELOG.md** | 414 | Basic — version history |
| **docs/guides/** | 4 files | Exchange-specific guides (Hyperliquid, GRVT, testnet, troubleshooting) |
| **docs/*.md** | 4 files | Production readiness, security audit, monitoring, landscape |
| **examples/** | 16 files | Trading, market data, error handling, health, WebSocket, strategies |

### Documentation Gaps

1. **API.md is slightly outdated**: Lists 13 exchanges, missing Aster/Pacifica/Ostium
2. **No auto-generated TypeDoc output** deployed (typedoc.json exists, `npm run docs` available)
3. **No migration guide** between SDK versions
4. **Exchange-specific guides** only for 2/16 exchanges (Hyperliquid, GRVT)
5. **No cookbook/recipes** for common patterns (cross-exchange arbitrage, risk management, portfolio tracking)

### JSDoc Coverage

Public API types (`adapter.ts`, `common.ts`) have comprehensive JSDoc with `@param`, `@returns`, `@throws`, `@example` annotations. Internal adapter code has moderate JSDoc (mostly class/method-level descriptions, not parameter-level).

## Packaging & Distribution

### package.json Analysis

```json
{
  "name": "pd-aio-sdk",
  "version": "0.2.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "browser": "./dist/index.js",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "engines": { "node": ">=18.0.0" },
  "files": ["dist", "src", "native"]
}
```

**Strengths:**
- ESM-first with CJS fallback via esbuild
- Browser field with polyfills (ws → browser shim, crypto → false, WASM signer)
- Source maps and declaration maps included
- `prepublishOnly` runs build + test
- `engines` field specifies Node 18+

**Concerns:**
- **No tree-shaking**: Single entry point exports everything, including all 16 adapters
- **No subpath exports**: Can't `import { HyperliquidAdapter } from 'pd-aio-sdk/adapters/hyperliquid'`
- **CJS bundle is fully bundled**: esbuild bundles everything into one file
- **`files` includes `src`**: Good for source maps, but increases package size
- **608MB node_modules**: Heavy dependencies (@drift-labs/sdk, @solana/web3.js, starknet, ethers)
- **6.6MB dist**: Reasonable but could be smaller with tree-shaking
- **No peer dependencies**: ethers, starknet, @solana/web3.js are all direct deps (users can't deduplicate)
- **Optional dep `koffi`**: Native FFI for Lighter signer (good use of optionalDependencies)

### Dependency Footprint

| Dependency | Size Impact | Required By |
|------------|------------|-------------|
| `@drift-labs/sdk` | Very large | Drift |
| `@solana/web3.js` | Large | Jupiter, Drift, Pacifica, Backpack |
| `starknet` | Large | Paradex, EdgeX, Extended |
| `ethers` | Large | Hyperliquid, GRVT, Ostium |
| `@paradex/sdk`, `@grvt/client` | Moderate | Paradex, GRVT |
| `zod` | Small | Core validation |
| `eventemitter3` | Tiny | Core events |

Users who only need Hyperliquid still install the full Solana + StarkNet stack.

## Strengths

1. **Unmatched breadth**: 16 exchanges in one unified interface — no competitor offers this for perp DEX
2. **Strong TypeScript**: Strict mode, const assertions, 13 `as any` in 60K lines
3. **Enterprise infrastructure**: Circuit breaker, rate limiter, Prometheus metrics, structured logging, health checks, retry with backoff
4. **CCXT-compatible design**: Familiar API for traders/developers already using CCXT
5. **Comprehensive error hierarchy**: 20+ typed errors with correlation IDs, exchange context, and standard codes
6. **Good test coverage**: 78% lines, 84% functions, 139 unit test files, 6,000+ tests
7. **Well-organized codebase**: Consistent adapter structure (Auth/Normalizer/Constants/Types/Utils/ErrorCodes per exchange)
8. **Builder code system**: Universal referral/fee attribution across 7 exchanges
9. **Python aliases**: snake_case method names for Python developer familiarity
10. **Internationalization**: Korean README (significant market for crypto trading)
11. **Plugin system**: `registerExchange()` allows custom adapter registration
12. **Resilience utilities**: Composable `withResilience`, `Bulkhead`, `withCache`, `withTimeout` for production use

## Weaknesses & Gaps

### P0 (Critical — would block production/enterprise adoption)

1. **No tree-shaking / lazy loading**: Importing the SDK loads all 16 exchange adapters + all their dependencies (ethers, starknet, @solana/web3.js, @drift-labs/sdk). Bundle size is unacceptable for frontend/serverless use cases.
2. **Heavy dependency footprint**: 608MB node_modules. Users wanting only 1 exchange still get everything.
3. **GMX v2 is read-only**: Listed as supported but has 0% trading capability — potentially misleading.

### P1 (High — significant friction for adoption)

4. **No subpath exports**: Can't import individual adapters (`pd-aio-sdk/hyperliquid`)
5. **5 exchanges have no WebSocket**: Aster, Pacifica, Ostium, Jupiter, Variational — limiting for real-time use cases
6. **Two HTTP abstraction patterns**: Older adapters use `BaseAdapter.request()`, newer ones use `HTTPClient` class — inconsistency
7. **Drift/Jupiter/GMX have very low test coverage** (10-30% statements): These are Solana/on-chain adapters with complex interactions
8. **BaseAdapter at 1,394 lines**: Does too many things — could benefit from further decomposition
9. **API.md outdated**: Missing 3 newest exchanges (Aster, Pacifica, Ostium)

### P2 (Medium — polish items for competitive positioning)

10. **No exchange-specific guides** for 14/16 exchanges
11. **No auto-generated API docs** deployed/hosted
12. **No migration guide** between versions
13. **Large .env.example** (6,229 lines) — needs exchange-specific sections or splitting
14. **No cookbook/recipes** for common trading patterns
15. **No benchmarks** (latency per exchange, throughput, memory)
16. **No changelog entries since recent Cycles** — CHANGELOG.md needs updating

### P3 (Low — nice-to-have improvements)

17. **Newer adapters (Aster, Pacifica, Ostium)** have fewer features than mature ones
18. **No browser-specific test suite** — browser field exists but not tested
19. **`koffi` optional dep** may confuse users who don't need Lighter
20. **No OpenAPI/Swagger spec** for the unified interface

## Recommendations

### Immediate (next release)

1. **Add subpath exports** to package.json for per-adapter imports:
   ```json
   {
     "exports": {
       ".": { ... },
       "./hyperliquid": "./dist/adapters/hyperliquid/index.js",
       "./dydx": "./dist/adapters/dydx/index.js"
     }
   }
   ```
2. **Update API.md** to include all 16 exchanges
3. **Mark GMX v2 as "read-only / market-data only"** more prominently
4. **Increase test coverage for Drift** (currently 10%) — at minimum for core trading flows

### Short-term (next 2-3 releases)

5. **Implement lazy adapter loading** in factory.ts using dynamic imports
6. **Migrate all adapters to HTTPClient** pattern (standardize away from `BaseAdapter.request()`)
7. **Add WebSocket support** for Aster and Pacifica (both exchanges have WebSocket APIs)
8. **Deploy TypeDoc** to GitHub Pages
9. **Create exchange-specific guides** for top 5 exchanges by usage

### Medium-term (v1.0 readiness)

10. **Move exchange-specific SDKs to peer/optional deps** (@drift-labs/sdk, starknet, @solana/web3.js) so users only install what they need
11. **Add benchmark suite** comparing adapter latencies
12. **Add browser test suite** with Playwright
13. **Create cookbook** with cross-exchange arbitrage, DCA, portfolio rebalancing examples
14. **Consider monorepo split**: `@pd-aio/core`, `@pd-aio/hyperliquid`, `@pd-aio/dydx`, etc.

## Handoff

- **Attempted**: Full codebase analysis covering architecture, types, adapters, tests, docs, packaging across all 16 exchanges
- **Worked**: Comprehensive data collection from src/, tests/, coverage-summary.json, package.json, tsconfig.json; analysis of feature maps, error hierarchy, type system, file sizes, test coverage, dependency footprint
- **Failed**: Could not run actual test suite or build (read-only analysis); could not measure actual bundle size via bundlephobia
- **Remaining**: Live test execution, ESLint run output analysis, `npm audit` security check, actual bundle size measurement, per-adapter latency benchmarking
