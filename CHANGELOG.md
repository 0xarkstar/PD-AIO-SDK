# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Developer Experience (P0)
- **Simple Symbol Helper** (`createSymbol`) - Easy symbol generation with exchange-aware defaults
  - `createSymbol('hyperliquid', 'BTC')` → `"BTC/USDT:USDT"`
  - Automatic uppercase normalization
  - Input validation
  - Support for custom quote currencies

#### Security & Configuration (P0)
- **Credential Validation System** - Comprehensive environment variable validation
  - `.env.example` template with all supported exchanges
  - `validateConfig(exchange)` - Pre-flight credential checks
  - `ConfigurationError` - Clear error messages with setup instructions
  - Helper functions: `isValidPrivateKey()`, `isValidApiKey()`, `maskSensitive()`
  - Security best practices documentation

#### Stability & Resilience (P0)
- **Automatic Retry Logic** - Production-grade error recovery
  - `withRetry()` - Exponential backoff with jitter
  - Configurable retry strategies
  - Automatic rate limit handling (respects `retryAfter`)
  - Custom retry predicates
  - Statistics tracking with `RetryStats`
  - Linear and exponential backoff modes

#### Resource Management (P0)
- **Comprehensive Cleanup System** - Memory leak prevention
  - Automatic timer/interval tracking
  - Abort controller management for pending requests
  - Cache management with TTL
  - `isDisconnected()` - State verification
  - `clearCache()` - Manual cache invalidation

### Changed
- **BaseAdapter** - Enhanced with resource tracking and cleanup
  - All timers and intervals now automatically registered
  - HTTP requests use tracked abort controllers
  - `disconnect()` now performs complete cleanup
- **Factory** - Can now optionally validate configuration on creation

### Fixed
- Potential memory leaks from untracked timers
- Missing cleanup in disconnect flow

---

## Implementation Details

### P0 Improvements Summary

| Feature | Files Added/Modified | Tests Added | Impact |
|---------|---------------------|-------------|--------|
| Symbol Helper | `src/utils/symbols.ts` | 10 tests | DX: High |
| Config Validation | `src/utils/config.ts`, `.env.example` | 26 tests | Security: Critical |
| Retry Logic | `src/core/retry.ts` | 17 tests | Stability: Critical |
| Resource Cleanup | `src/adapters/base/BaseAdapter.ts` | N/A | Stability: High |

**Total New Tests:** 53 unit tests
**Test Coverage:** 233/233 passing (100% of unit tests)

### Breaking Changes
**None.** All P0 improvements are additive or internal optimizations.

### Migration Guide
No migration required. All existing code continues to work without changes.

**Optional adoption of new features:**

```typescript
// Before: Manual symbol construction
const order = await exchange.createOrder({
  symbol: 'BTC/USDT:USDT',
  // ...
});

// After: Use symbol helper (optional)
import { createSymbol } from 'perp-dex-sdk';
const symbol = createSymbol('hyperliquid', 'BTC');
const order = await exchange.createOrder({
  symbol,
  // ...
});

// Before: No retry on transient failures
const markets = await exchange.fetchMarkets();

// After: Automatic retry (optional)
import { withRetry } from 'perp-dex-sdk';
const markets = await withRetry(() => exchange.fetchMarkets());

// Before: No config validation
const exchange = createExchange('hyperliquid', config);

// After: Validate before creation (optional)
import { validateConfig } from 'perp-dex-sdk';
validateConfig('hyperliquid'); // Throws if env vars missing
const exchange = createExchange('hyperliquid', config);
```

---

## Planned (Next Release)

### P1: Completeness Enhancements
- [ ] Health Check System
- [ ] API Metrics Tracking
- [ ] Market Data Preloading
- [ ] Interactive Examples

### P2: Nice-to-Have
- [ ] Batch Operation Fallbacks
- [ ] Structured Logging
- [ ] Method Name Aliases

### P3: Future
- [ ] Browser Environment Support
- [ ] CommonJS Build

---

## [0.1.0] - 2025-12-01

### Added
- Initial release
- Support for 6 exchanges: Hyperliquid, Lighter, GRVT, Paradex, EdgeX, Backpack
- Unified interface following CCXT patterns
- WebSocket streaming infrastructure
- Comprehensive type safety (TypeScript + Zod)
- 80%+ test coverage
