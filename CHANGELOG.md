# Changelog

# PD AIO SDK - Change Log

All notable changes to **PD AIO SDK** (Perp DEX All-In-One SDK) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**[한국어](./CHANGELOG.ko.md)** | English

---

## [0.2.0] - 2026-02-14

> Cycles 4-13: Major quality push, 3 new exchanges, builder codes, subpath exports, live API verification, and npm publish readiness.
> **6,092 tests | 82.25% statement coverage | 87.02% function coverage | 16 exchanges supported | 56/96 live API methods verified**

### Added (Cycle 13)

#### Live API Compatibility Verification
- **`tests/production/live-api-validation.ts`** — standalone live E2E validation script for all 16 exchanges
- Tested 6 public methods per exchange (fetchMarkets, fetchTicker, fetchOrderBook, fetchTrades, fetchFundingRate, fetchOHLCV) against live mainnet APIs
- Results: **56 PASS**, 1 FAIL, 10 SKIP, 29 ERROR across 96 total method calls
- 12/16 exchanges operational with 3+ methods working

#### API Contract Specifications (9 new)
- `dydx.spec.ts` — dYdX v4 indexer API (5 endpoints, Zod schemas)
- `aster.spec.ts` — Aster DEX API (6 endpoints, Binance-compatible)
- `pacifica.spec.ts` — Pacifica API (5 endpoints)
- `extended.spec.ts` — Extended API (6 endpoints)
- `variational.spec.ts` — Variational API (1 public endpoint)
- `gmx.spec.ts` — GMX v2 API (3 REST endpoints)
- `drift.spec.ts` — Drift DLOB API (4 endpoints)
- `jupiter.spec.ts` — Jupiter price API (1 endpoint)
- `ostium.spec.ts` — Ostium metadata API (1 endpoint)
- API contract registry expanded from 7 to **16 exchanges**

### Fixed (Cycle 13)

#### Adapter Endpoint & Data Fixes
- **dYdX**: Fixed `fetchTrades` and `fetchOHLCV` — switched from query params to path-based routing (`/trades/perpetualMarket/{ticker}`, `/candles/perpetualMarket/{ticker}`)
- **Drift**: Fixed `fetchFundingRate` — switched from DLOB API to Data API (`data.api.drift.trade/fundingRates`); marked `fetchTrades` as unsupported (DLOB removed endpoint)
- **GMX**: Fixed inverted ticker prices — per-token divisor `10^(30-tokenDecimals)` instead of flat `1e30`; added NaN guards for funding rate
- **Lighter**: Fixed `fetchTrades` — switched to `/api/v1/recentTrades` endpoint; fixed `fetchFundingRate` — rewritten to parse `{funding_rates: [{rate}]}` array format
- **Jupiter**: Migrated from jup.ag price API (now requires auth) to Pyth Network Hermes API
- **Extended**: Fixed response parsing (`{data:[...]}` not `{markets:[...]}`)
- **Ostium**: Fixed metadata API parameter format (`asset=BTCUSD` not `pair=BTC/USD`); disabled `fetchTrades` (The Graph hosted subgraph removed)
- **Paradex**: Switched to public endpoints (`/markets/summary`, `/trades?market=X`, `/funding/data?market=X`); made auth headers conditional

#### Exchange Status Changes
- **Pacifica**: Confirmed API fully offline (all endpoints return 404) — no code fix possible

### Breaking Changes

- **`createExchange()` is now async** — returns `Promise<ExchangeAdapter>` instead of `ExchangeAdapter`. Use `createExchangeSync()` for synchronous usage or call `await createExchange(...)` (Cycle 12)

### Added

#### New Exchange Adapters (Cycle 9)
- **Aster** adapter — BNB Chain perpetual DEX
- **Pacifica** adapter — Solana-based perpetual DEX
- **Ostium** adapter — Arbitrum RWA (Real World Assets) perpetual DEX
- SDK now supports **16 exchanges** total

#### Builder Code Framework (Cycles 9 + 11)
- `ExchangeConfig.builderCode` and `OrderRequest.builderCode` fields for exchange-level builder/referral codes
- `builderCodeEnabled` toggle on `ExchangeConfig` for on/off control
- Builder codes implemented for 7 exchanges: Hyperliquid, GRVT, Pacifica, Aster, Ostium, GMX, Drift

#### Subpath Exports & Lazy Loading (Cycle 12)
- **18 subpath exports** for per-adapter tree-shaking (`import { HyperliquidAdapter } from 'pd-aio-sdk/hyperliquid'`)
- `createExchange()` now uses **dynamic imports** — only loads the adapter you need
- `createExchangeSync()` for synchronous adapter creation (requires `preloadAdapters()` first)
- `preloadAdapters()` utility for pre-loading adapters before sync usage

#### Documentation Overhaul (Cycle 12)
- **API.md**: all 16 exchanges fully documented with method signatures and examples
- **README** rewrite: 5-minute quickstart guide, builder code usage, subpath import examples
- **Competitive analysis** research completed (no direct multi-DEX SDK competitor exists)

#### Perp DEX Landscape Research (Cycle 8)
- `docs/PERP_DEX_LANDSCAPE.md` — comprehensive perpetual DEX market analysis

#### Test Coverage Expansion (Cycles 4-12)
- **+2,270 tests** across cycles (from 3,822 to 6,092)
- Cycle 4: Jest coverage thresholds configured
- Cycle 5: Auth and endpoint fix tests
- Cycle 6: +135 tests (dYdX, Drift, GMX, Jupiter)
- Cycle 7: +312 tests for type-safety validation
- Cycle 8: +253 tests (Hyperliquid 63, Lighter 68, GRVT 42, Nado 35, WebSocket 36)
- Cycle 9: +254 tests for Aster, Pacifica, Ostium adapters
- Cycle 10: +133 tests for adapter bug fix verification
- Cycle 11: +42 tests for builder code toggle logic

### Changed

#### ESLint v9 Migration & Full Sweep (Cycles 4 + 7 + 8)
- Migrated from `.eslintrc.json` to ESLint v9 flat config (`eslint.config.js`)
- ESLint errors: **2,934 -> 1,708 -> 0** (100% clean)
- `as any` usage: **82 -> 15 -> 13** (-84% reduction)

#### Type Safety Improvements (Cycle 7)
- New `type-guards.ts` utility module for runtime type checking
- `Logger.getConfig()` accessor added
- `WebSocket` `NodeWebSocket` interface for cross-platform compatibility

#### Code Splitting (Cycle 4)
- `LighterAdapter` split: 1,293 -> 761 lines (6 new helper files extracted)
- `HyperliquidAdapter` split: 1,115 -> 737 lines (helper files extracted)

#### Error Standardization (Cycle 6)
- `BaseAdapter`: 27 generic error throws replaced with typed SDK errors
- Consistent error classes across all adapter methods

#### API Documentation Sync (Cycle 6)
- `API.md` updated to match actual adapter implementations across all 13 exchanges (at time of Cycle 6)

### Fixed

#### Critical API & Auth Fixes (Cycle 5)
- **Backpack**: Auth signature rewrite — fixed HMAC construction for production API
- **Paradex**: 3 API endpoint paths corrected
- **Lighter**: 5 API endpoint paths corrected
- **Extended**: Rate limit handling fix
- **dYdX**: Request parameter marshalling fixed
- **GMX**: Endpoint URL corrections
- **Hyperliquid**: Added `NotSupportedError` for unsupported method calls
- **Jupiter**: Added `NotSupportedError` for unsupported method calls
- 60+ issues identified across 13 exchanges; all CRITICAL and HIGH severity issues resolved

#### Adapter Bug Fixes (Cycle 10)
- 6 bug fixes across Aster, Pacifica, and Ostium adapters found through systematic adapter inspection

#### TypeScript Strict Mode Cleanup
- Removed `@ts-ignore` directive from `NadoAPIClient`

---

## [0.1.1] - 2026-02-08 (pre-release, unpublished)

> Cycles 1-3: Architecture standardization, Nado adapter, developer experience, and stability.
> **3,822 tests | 7 -> 13 exchanges**

### Added

#### Architecture - Pattern A Standardization (5-Week Project)

All **7 original exchange adapters** standardized to **Pattern A** (Full-Featured) architecture, providing consistent structure, enhanced testability, and improved maintainability.

**Pattern A Benefits:**
- Dedicated Normalizer classes for all data transformations
- Clean separation of concerns (Adapter, Normalizer, Auth, Utils)
- Consistent file structure across all adapters
- Enhanced testability with isolated unit tests
- Normalizers can be used directly by SDK users

**New Normalizer Classes Created:**
- `HyperliquidNormalizer` (498 lines) - Symbol format: `BTC-PERP` <-> `BTC/USDT:USDT`
- `EdgeXNormalizer` (308 lines) - Symbol format: `BTC-USDC-PERP` <-> `BTC/USDC:USDC`
- `BackpackNormalizer` (325 lines) - Symbol format: `BTCUSDT_PERP` <-> `BTC/USDT:USDT`
- `LighterNormalizer` (235 lines) - Symbol format: `BTC-USDT-PERP` <-> `BTC/USDT:USDT`

**Adapters Using Pattern A:**
1. Hyperliquid (refactored)
2. Paradex (already Pattern A)
3. GRVT (already Pattern A)
4. Nado (already Pattern A)
5. EdgeX (refactored)
6. Backpack (refactored)
7. Lighter (refactored)

#### Nado Adapter - 7th Exchange
- Built on Ink L2 by Kraken team, 5-15ms matching engine latency
- EIP-712 typed data signing with X18 decimal format
- Full REST + WebSocket API support
- Component-based architecture: NadoAuth, NadoAPIClient, NadoNormalizer, NadoSubscriptionBuilder
- `watchBalance()` — real-time balance updates via WebSocket streaming
- 206 new test cases across 6 test files

#### 6 New Exchange Adapters (Cycles 2-3)
- **dYdX v4** — Cosmos-based perpetual DEX
- **Jupiter Perps** — Solana-based perpetual DEX
- **Drift** — Solana-based perpetual DEX
- **GMX v2** — Arbitrum-based perpetual DEX
- **Extended** — Additional exchange support
- **Variational** — Additional exchange support

#### Developer Experience
- `createSymbol()` helper for exchange-aware symbol generation
- `validateConfig()` for pre-flight credential checks with clear error messages
- `.env.example` template with all supported exchanges

#### Stability & Resilience
- `withRetry()` — exponential backoff with jitter for transient failures
- Automatic rate limit handling (respects `retryAfter`)
- Resource cleanup system for memory leak prevention

#### Documentation
- **ARCHITECTURE.md** (720 lines) — Hexagonal architecture deep dive
- **API.md** (936 lines) — Complete API reference
- **ADAPTER_GUIDE.md** (762 lines) — Step-by-step guide for adding new exchanges
- **CONTRIBUTING.md** updated with Pattern A requirements

### Changed
- All adapters follow consistent Pattern A structure
- Utils files simplified to helper functions only (normalization moved to Normalizer classes)
- `BaseAdapter` enhanced with resource tracking and cleanup
- Factory optionally validates configuration on creation

### Fixed
- Hyperliquid: Removed non-existent `feeToken` property from `normalizeFill`
- EdgeX: Fixed TypeScript implicit `any` errors in `.map()` calls
- Backpack: Consistent arrow functions for better type safety
- Lighter: Fixed `AuthError` import (replaced with `InvalidSignatureError`)
- Nado: `RateLimitError` constructor parameter ordering fix
- Nado: `Buffer.alloc()` replaced with `ethers.zeroPadValue()` for browser compatibility
- Nado: NaN/Infinity detection added in numeric conversions
- Potential memory leaks from untracked timers

---

## [0.1.0] - 2025-12-01

### Added
- **Initial release of PD AIO SDK**
- Support for 6 exchanges: Hyperliquid, Lighter, GRVT, Paradex, EdgeX, Backpack
- HIP-3 ecosystem support (7+ platforms via Hyperliquid adapter)
- Unified interface following CCXT patterns
- WebSocket streaming infrastructure
- Comprehensive type safety (TypeScript + Zod)
- 395 tests with 100% pass rate
- Production-grade authentication for all exchanges
- English + Korean documentation
