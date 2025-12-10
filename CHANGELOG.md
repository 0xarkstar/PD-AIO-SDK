# Changelog

# PD AIO SDK - Change Log

All notable changes to **PD AIO SDK** (Perp DEX All-In-One SDK) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**[한국어](./CHANGELOG.ko.md)** | English

## [Unreleased]

### Added

#### Architecture - Pattern A Standardization (5-Week Project)

All **7 exchange adapters** have been standardized to **Pattern A** (Full-Featured) architecture, providing consistent structure, enhanced testability, and improved maintainability across the entire SDK.

**Pattern A Benefits:**
- ✅ Dedicated Normalizer classes for all data transformations
- ✅ Clean separation of concerns (Adapter, Normalizer, Auth, Utils)
- ✅ Consistent file structure across all 7 adapters
- ✅ Enhanced testability with isolated unit tests
- ✅ Normalizers can be used directly by SDK users

**Project Timeline:**
- **Week 1**: Validated existing Pattern A adapters (Paradex, GRVT, Nado)
- **Week 2**: Comprehensive testing for Hyperliquid (1332 lines, 77 tests)
- **Week 3**: Refactored Hyperliquid from Pattern C → Pattern A
- **Week 4**: Refactored EdgeX and Backpack to Pattern A
- **Week 5**: Refactored Lighter to Pattern A

**New Normalizer Classes Created:**
- `HyperliquidNormalizer` (498 lines) - Symbol format: `BTC-PERP` ↔ `BTC/USDT:USDT`
- `EdgeXNormalizer` (308 lines) - Symbol format: `BTC-USDC-PERP` ↔ `BTC/USDC:USDC`
- `BackpackNormalizer` (325 lines) - Symbol format: `BTCUSDT_PERP` ↔ `BTC/USDT:USDT`
- `LighterNormalizer` (235 lines) - Symbol format: `BTC-USDT-PERP` ↔ `BTC/USDT:USDT`

**Utils Files Refactored:**
- Hyperliquid: 456 → 132 lines (71% reduction)
- EdgeX: 380 → 79 lines (79% reduction)
- Backpack: 396 → 93 lines (77% reduction)
- Lighter: 353 → 115 lines (67% reduction)
- **Total removed**: ~1,200 lines of normalization logic migrated to Normalizer classes

**Test Coverage:**
- 158 tests for Hyperliquid (77 unit + 32 auth + 49 integration)
- 10 tests for EdgeX
- 11 tests for Backpack
- Lighter: 0 tests (no test files exist, verified via TypeScript compilation)
- **Total**: 316+ tests passing, 0 TypeScript errors

**Adapters Now Using Pattern A:**
1. Hyperliquid ✅ (refactored Week 3)
2. Paradex ✅ (already Pattern A)
3. GRVT ✅ (already Pattern A)
4. Nado ✅ (already Pattern A)
5. EdgeX ✅ (refactored Week 4)
6. Backpack ✅ (refactored Week 4)
7. Lighter ✅ (refactored Week 5)

**New Comprehensive Documentation:**
- **ARCHITECTURE.md** (720 lines) - Hexagonal architecture deep dive, Pattern A vs Pattern C comparison, standardization timeline, design decisions, testing strategy, migration guide
- **API.md** (936 lines) - Complete API reference for all 7 adapters, Normalizer classes, types, examples, best practices
- **ADAPTER_GUIDE.md** (762 lines) - Step-by-step guide for adding new exchanges with Pattern A structure, file-by-file implementation, testing requirements, common pitfalls
- **Updated CONTRIBUTING.md** - Pattern A architecture requirements for new adapters
- **Updated README.md** - Pattern A architecture explanation and links to new documentation

**Public API Enhancements:**
```typescript
// Normalizers can now be used directly
import { HyperliquidNormalizer } from 'pd-aio-sdk/adapters/hyperliquid';

const normalizer = new HyperliquidNormalizer();
const unifiedSymbol = normalizer.normalizeSymbol('BTC-PERP');
// Returns: 'BTC/USDT:USDT'
```

**Code Metrics:**
- Normalizer code created: 1,366 lines across 4 new classes
- Utils reduction: ~1,200 lines removed
- Documentation added: 2,418 lines (ARCHITECTURE.md + API.md + ADAPTER_GUIDE.md)
- TypeScript compilation: 0 errors
- Architecture: 100% consistent Pattern A implementation across all adapters

### Changed

#### Architecture Refactoring
- **All adapters** now follow consistent Pattern A structure
- **Utils files** simplified to contain ONLY helper functions (no normalization)
- **Normalizer classes** handle all data transformations independently
- **Adapter classes** use normalizer instances (`this.normalizer.normalizeX()`)
- **Test structure** reorganized for better coverage of Normalizer classes

### Fixed
- Hyperliquid: Removed non-existent `feeToken` property from `normalizeFill` method
- EdgeX: Fixed TypeScript implicit 'any' errors in `.map()` calls with type annotations
- Backpack: Consistent arrow functions in `.map()` for better type safety
- Lighter: Fixed AuthError import → InvalidSignatureError (AuthError doesn't exist in errors module)
- All adapters: Consistent use of `(item: any) => this.normalizer.normalizeItem(item)` pattern

### Breaking Changes
**None.** Pattern A standardization is an internal architecture change. All public APIs remain unchanged.

**For SDK users:**
- All existing code continues to work without modification
- Adapter methods maintain identical signatures and behavior
- New feature: Normalizers can now be imported and used directly

**For contributors:**
- New adapters MUST follow Pattern A architecture (see ADAPTER_GUIDE.md)
- Dedicated Normalizer class is now required for all adapters
- Utils files should contain ONLY helper functions

#### Exchange Support
- **Nado Adapter** - 7th supported exchange
  - Built on Ink L2 by Kraken team
  - 5-15ms matching engine latency
  - EIP-712 typed data signing
  - X18 decimal format (18 decimals)
  - Full REST + WebSocket API support
  - Public testnet available (Chain ID: 763373)
  - Mainnet production ready (Chain ID: 57073)
  - 31 new unit tests
  - 20 integration test cases
  - Complete documentation and examples

#### Nado Adapter - Architecture Refactoring
- **Component-Based Architecture** - Separated concerns into specialized modules
  - **NadoAuth** (`src/adapters/nado/NadoAuth.ts`) - EIP-712 signature generation and nonce management
    - `signOrder()` - Sign order placement with product-specific verifying contract
    - `signCancellation()` - Sign batch order cancellations
    - `getNextNonce()` / `getCurrentNonce()` - Atomic nonce management
    - `getAddress()` - Wallet address accessor
    - Cross-platform compatible (browser + Node.js)

  - **NadoAPIClient** (`src/adapters/nado/NadoAPIClient.ts`) - HTTP communication with automatic retry
    - Exponential backoff retry strategy (max 3 attempts)
    - Intelligent error classification (retries server/network errors only)
    - Rate limit handling with token bucket algorithm
    - Configurable timeout (default: 30 seconds)
    - Automatic error mapping to unified error types

  - **NadoNormalizer** (`src/adapters/nado/NadoNormalizer.ts`) - Data transformation with precision safety
    - Precision-safe x18 numeric conversions
    - NaN/Infinity detection and validation
    - Precision loss warnings for large numbers
    - Batch processing: `normalizeOrders()`, `normalizePositions()`, `normalizeTrades()`
    - Symbol conversion: `symbolToCCXT()`, `symbolFromCCXT()`
    - Zod schema validation for all API responses
    - Graceful per-item error handling in batch operations

  - **NadoSubscriptionBuilder** (`src/adapters/nado/subscriptions.ts`) - WebSocket subscription payload generator
    - `orderBook(productId)` - Subscribe to order book updates
    - `positions(subaccount)` - Subscribe to position updates
    - `orders(subaccount)` - Subscribe to order updates
    - `trades(productId)` - Subscribe to trade feed
    - `balance(subaccount)` - Subscribe to balance updates (new!)
    - `channelId()` - Generate unique channel identifiers
    - `unsubscribe()` - Create unsubscribe payloads

- **New Features**
  - `watchBalance()` - Real-time balance updates via WebSocket streaming
    - Returns `AsyncGenerator<Balance[]>` for continuous monitoring
    - Automatically subscribes to `subaccount_info` channel
    - Example added to `examples/nado-basic.ts`

- **Test Coverage Expansion**
  - `tests/unit/nado-auth.test.ts` (54 test cases) - EIP-712 signing, nonce management, address conversion
  - `tests/unit/nado-api-client.test.ts` (42 test cases) - HTTP requests, retry logic, rate limiting, error mapping
  - `tests/unit/nado-normalizer.test.ts` (40 test cases) - Data normalization, precision safety, batch processing
  - `tests/unit/nado-errors.test.ts` (38 test cases) - Error classification, mapping, retry decisions
  - `tests/unit/nado-subscriptions.test.ts` (32 test cases) - Subscription payload generation, channel IDs
  - `tests/integration/nado-adapter.test.ts` - Full integration tests with mocked fetch
  - **Total: 206 new test cases** across 6 test files

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

#### Nado Adapter Internal Refactoring
- **NadoAdapter** - Refactored to use component-based architecture
  - Removed 403-line `utils.ts` file (all functionality migrated to components)
  - Removed internal methods: `query()`, `execute()`, `mapError()`, `getNextNonce()`
  - Changed `productMappings` key from `productId` to `ccxtSymbol` for O(1) lookup efficiency
  - All HTTP calls now go through `NadoAPIClient` with automatic retry
  - All EIP-712 signing now handled by `NadoAuth` component
  - All data normalization now through `NadoNormalizer` with validation
  - WebSocket subscriptions now use `NadoSubscriptionBuilder` for consistent payloads

- **Code Quality Improvements**
  - Reduced code complexity through separation of concerns
  - Better error handling with automatic retry for transient failures
  - Improved type safety with Zod runtime validation
  - Enhanced maintainability with focused, testable components

### Fixed
- Potential memory leaks from untracked timers
- Missing cleanup in disconnect flow

#### Nado Adapter Critical Fixes
- **RateLimitError constructor calls** - Fixed missing `retryAfter` parameter (`src/adapters/nado/errors.ts`)
  - Lines 192, 230-234: Added explicit `undefined` for `retryAfter` parameter
  - Previously `originalError` was passed to wrong parameter position
  - Now matches constructor signature: `(message, code, exchange, retryAfter?, originalError?)`

- **Cross-platform compatibility** - Fixed Node.js-only Buffer API (`src/adapters/nado/NadoAuth.ts`)
  - Line 362: Replaced `Buffer.alloc()` with `ethers.zeroPadValue()` for browser compatibility
  - `productIdToVerifyingContract()` now works in both Node.js and browser environments

- **Precision handling** - Added NaN/Infinity detection in numeric conversions
  - `toX18Safe()` validates input before conversion
  - `fromX18Safe()` validates output and warns on precision loss
  - Prevents silent data corruption from invalid numeric values

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

### Nado Adapter Refactoring Summary

| Component | Lines of Code | Test Cases | Purpose |
|-----------|---------------|------------|---------|
| NadoAuth | 316 | 54 | EIP-712 signing + nonce management |
| NadoAPIClient | 309 | 42 | HTTP communication + retry logic |
| NadoNormalizer | 558 | 40 | Data transformation + validation |
| NadoSubscriptionBuilder | 194 | 32 | WebSocket subscription payloads |
| Error Handling | 227 | 38 | Error classification + mapping |

**Files Deleted:** `utils.ts` (403 lines)
**Net Code Change:** +1,604 lines added, -403 lines removed
**Total New Tests:** 206 test cases across 6 files
**Test Coverage:** All tests passing with mocked fetch

### Breaking Changes
**None.** All P0 improvements are additive or internal optimizations.

#### Nado Adapter - No Breaking Changes
**Public API unchanged:** All public adapter methods maintain identical signatures and behavior:
- `createOrder()`, `cancelOrder()`, `fetchMarkets()`, `fetchBalance()`, etc.
- WebSocket methods: `watchOrderBook()`, `watchPositions()`, `watchOrders()`
- New method: `watchBalance()` (additive, not breaking)

**Internal changes only:** The refactoring reorganized internal implementation without affecting public API:
- Component architecture is internal to `NadoAdapter`
- Removed `utils.ts` exports (was internal utility module)
- No changes to method signatures or return types

### Migration Guide
No migration required. All existing code continues to work without changes.

#### Nado Adapter Refactoring - Migration Notes

**For basic users:** No action required. All public methods work exactly as before.

**For advanced users who were importing from `utils.ts`:**

The `utils.ts` file has been removed. If you were importing internal utilities, use the adapter's public API instead:

```typescript
// Before (unsupported - utils.ts no longer exists)
import { signNadoOrder, normalizeNadoProduct } from 'perp-dex-sdk/adapters/nado/utils';

// After (use adapter's public methods)
import { createExchange } from 'perp-dex-sdk';
const nado = createExchange('nado', { wallet, testnet: true });

// All signing and normalization now handled internally
const order = await nado.createOrder({
  symbol: 'BTC/USDT:USDT',
  side: 'buy',
  type: 'limit',
  amount: 0.01,
  price: 50000,
});
```

**New feature - Balance streaming:**

```typescript
// New watchBalance() method for real-time balance updates
const balanceStream = nado.watchBalance();

for await (const balances of balanceStream) {
  balances.forEach(balance => {
    console.log(`${balance.currency}: ${balance.total} (free: ${balance.free})`);
  });

  // Stop after some condition
  if (someCondition) break;
}
```

**Internal improvements you get automatically:**
- Automatic retry on transient HTTP errors (network issues, server errors, rate limits)
- Better error messages with error classification
- Precision loss warnings for large numeric values
- Cross-platform compatibility (works in browser and Node.js)

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
- **Initial release of PD AIO SDK**
- Support for 6 exchanges: Hyperliquid, Lighter, GRVT, Paradex, EdgeX, Backpack
- HIP-3 ecosystem support (7+ platforms via Hyperliquid adapter)
- Unified interface following CCXT patterns
- WebSocket streaming infrastructure
- Comprehensive type safety (TypeScript + Zod)
- 395 tests with 100% pass rate
- Production-grade authentication for all exchanges
- English + Korean documentation
