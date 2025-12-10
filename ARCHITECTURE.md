# Architecture Documentation

## Table of Contents
- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Adapter Structure](#adapter-structure)
- [Standardization Summary](#standardization-summary)
- [Design Decisions](#design-decisions)
- [Testing Strategy](#testing-strategy)
- [Adding New Adapters](#adding-new-adapters)
- [Migration Guide](#migration-guide)
- [Future Improvements](#future-improvements)

---

## Overview

PD-AIO-SDK is built on **hexagonal architecture** principles with a focus on clean separation of concerns, testability, and maintainability. After a comprehensive 5-week refactoring project, all 7 exchange adapters now follow **Pattern A (Full-Featured)** architecture, providing consistent structure and implementation patterns across the entire codebase.

### Why Hexagonal Architecture?

Hexagonal architecture (also known as Ports and Adapters) allows us to:
- **Isolate core business logic** from external dependencies (exchange APIs)
- **Enable easy testing** through dependency inversion
- **Support multiple exchanges** with minimal code duplication
- **Adapt to API changes** without affecting core functionality
- **Scale the codebase** as we add more exchanges

### Pattern A: Full-Featured Architecture

Pattern A represents our standardized approach to adapter implementation, characterized by:
- **Dedicated Normalizer class**: All data transformation logic in a separate, reusable class
- **Separation of concerns**: Clear boundaries between transformation, authentication, and business logic
- **Consistent structure**: Every adapter follows the same file organization and naming conventions
- **Enhanced testability**: Normalizer classes can be tested independently of adapters
- **Better maintainability**: Changes to data transformations don't affect adapter logic

---

## Core Concepts

### Hexagonal Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      User Application                        │
│              (Trading bots, portfolio managers)              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ Uses unified interface
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    Core Domain Layer                         │
│         (Common types: Order, Position, Market, etc.)        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ Implements
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      Adapters Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Hyperliquid  │  │   Paradex    │  │    GRVT      │      │
│  │   Adapter    │  │   Adapter    │  │   Adapter    │ ...  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │ Uses             │ Uses             │ Uses         │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐      │
│  │ Hyperliquid  │  │   Paradex    │  │    GRVT      │      │
│  │ Normalizer   │  │ Normalizer   │  │ Normalizer   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ Calls external APIs
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  Infrastructure Layer                        │
│         (HTTP clients, WebSocket, authentication)            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    External Services                         │
│     (Exchange APIs: Hyperliquid, Paradex, GRVT, etc.)       │
└─────────────────────────────────────────────────────────────┘
```

### Pattern A Architecture

Pattern A is our standardized "Full-Featured" architecture pattern that all adapters now follow.

**Key Characteristics:**
- **9-11 files** per adapter (depending on complexity)
- **Separate Normalizer class** for all data transformations
- **Dedicated Auth class** for complex authentication (EIP-712, StarkNet, etc.)
- **Minimal utils.ts** containing only helper functions
- **Clear public API** through index.ts exports

**Benefits over Pattern C (Hybrid):**
- ✅ **Consistency**: All adapters follow identical structure
- ✅ **Testability**: Normalizer logic tested independently
- ✅ **Reusability**: Normalizers can be used outside adapters
- ✅ **Maintainability**: Changes to normalization don't affect adapter code
- ✅ **Onboarding**: New contributors learn one pattern, apply everywhere
- ✅ **Scalability**: Adding new exchanges follows established template

---

## Adapter Structure

### File Organization

Every Pattern A adapter follows this structure:

```
src/adapters/{exchange}/
├── {Exchange}Adapter.ts       # Main adapter implementation
├── {Exchange}Normalizer.ts    # Data transformation class
├── {Exchange}Auth.ts          # Authentication class (if complex)
├── utils.ts                   # Helper functions only
├── constants.ts               # Configuration constants
├── types.ts                   # TypeScript type definitions
└── index.ts                   # Public API exports
```

### File Responsibilities

#### 1. `{Exchange}Adapter.ts` - Main Implementation

**Purpose**: Implements the `IExchangeAdapter` interface and orchestrates all exchange interactions.

**Responsibilities**:
- Initialize normalizer, auth, rate limiter instances
- Implement all adapter methods (`fetchMarkets`, `createOrder`, etc.)
- Handle HTTP requests and WebSocket connections
- Manage rate limiting
- Delegate data transformation to normalizer
- Delegate authentication to auth class

**Key Pattern**:
```typescript
export class HyperliquidAdapter extends BaseAdapter implements IExchangeAdapter {
  private normalizer: HyperliquidNormalizer;  // Always use normalizer instance
  private auth: HyperliquidAuth;
  protected rateLimiter: RateLimiter;

  constructor(config: HyperliquidConfig) {
    super(config);
    this.normalizer = new HyperliquidNormalizer();  // Initialize first
    this.auth = new HyperliquidAuth(config.wallet);
    // ... initialize rate limiter
  }

  async fetchMarkets(): Promise<Market[]> {
    const response = await this.request('GET', '/markets');
    // ALWAYS delegate to normalizer
    return response.map((m: any) => this.normalizer.normalizeMarket(m));
  }
}
```

#### 2. `{Exchange}Normalizer.ts` - Data Transformation

**Purpose**: Convert between exchange-specific and unified data formats.

**Responsibilities**:
- Symbol format conversion (exchange ↔ unified CCXT format)
- Market data normalization
- Order, position, balance normalization
- OrderBook, trade, ticker normalization
- Type mappings (order types, statuses, sides)

**Key Pattern**:
```typescript
export class HyperliquidNormalizer {
  /**
   * Public methods: Main normalization functions
   * These are called by the adapter
   */
  normalizeSymbol(exchangeSymbol: string): string {
    // BTC-PERP → BTC/USDT:USDT
  }

  toExchangeSymbol(symbol: string): string {
    // BTC/USDT:USDT → BTC-PERP
  }

  normalizeMarket(exchangeMarket: HyperliquidMarket): Market {
    return {
      id: exchangeMarket.name,
      symbol: this.normalizeSymbol(exchangeMarket.name),
      // ... transform all fields
    };
  }

  // More normalize methods...

  /**
   * Private methods: Internal helpers
   * These are implementation details
   */
  private normalizeOrderType(type: string): OrderType {
    // Map exchange-specific types to unified types
  }

  private normalizeOrderStatus(status: string): OrderStatus {
    // Map exchange-specific statuses to unified statuses
  }
}
```

#### 3. `{Exchange}Auth.ts` - Authentication (Optional)

**Purpose**: Handle complex authentication schemes.

**When to create**:
- ✅ EIP-712 signing (Ethereum-based exchanges)
- ✅ StarkNet ECDSA (StarkEx-based exchanges)
- ✅ JWT token management
- ✅ Multi-step authentication flows
- ❌ Simple API key + signature (can be in utils.ts)

**Example**:
```typescript
export class HyperliquidAuth {
  constructor(private wallet: Wallet) {}

  async signL1Action(action: any, vaultAddress?: string): Promise<Signature> {
    const payload = this.constructPhantomAgent(action, vaultAddress);
    return await this.wallet.signTypedData(/* EIP-712 params */);
  }

  private constructPhantomAgent(action: any, vaultAddress?: string): any {
    // HIP-3 phantom agent construction
  }
}
```

#### 4. `utils.ts` - Helper Functions Only

**Purpose**: Provide utility functions that don't fit in other classes.

**What belongs here**:
- ✅ Order request conversion helpers
- ✅ Error mapping functions
- ✅ Simple type conversions (e.g., `toExchangeOrderType`)
- ✅ Validation functions
- ✅ Formatting utilities

**What does NOT belong here**:
- ❌ Data normalization (belongs in Normalizer)
- ❌ Authentication logic (belongs in Auth class)
- ❌ API request logic (belongs in Adapter)

**Example**:
```typescript
/**
 * Convert unified order request to exchange-specific format
 */
export function convertOrderRequest(
  request: OrderRequest,
  exchangeSymbol: string
): ExchangeOrderRequest {
  return {
    symbol: exchangeSymbol,
    side: request.side.toUpperCase(),
    type: request.type.toUpperCase(),
    quantity: request.amount,
    price: request.price,
  };
}

/**
 * Map exchange errors to unified error types
 */
export function mapError(error: unknown): PerpDEXError {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('rate limit')) {
    return new RateLimitError(/* ... */);
  }

  // ... more error mappings

  return new PerpDEXError(message, 'UNKNOWN_ERROR', 'exchange');
}
```

#### 5. `constants.ts` - Configuration

**Purpose**: Store all configuration constants and mappings.

**Example**:
```typescript
export const HYPERLIQUID_API_URLS = {
  mainnet: {
    rest: 'https://api.hyperliquid.xyz',
    websocket: 'wss://api.hyperliquid.xyz/ws',
  },
  testnet: {
    rest: 'https://api.hyperliquid-testnet.xyz',
    websocket: 'wss://api.hyperliquid-testnet.xyz/ws',
  },
};

export const HYPERLIQUID_RATE_LIMITS = {
  maxRequests: 1200,
  windowMs: 60000,
  weights: {
    fetchMarkets: 1,
    fetchOrderBook: 2,
    createOrder: 5,
  },
};
```

#### 6. `types.ts` - Type Definitions

**Purpose**: Define all exchange-specific TypeScript types.

**Example**:
```typescript
export interface HyperliquidConfig extends ExchangeConfig {
  wallet: Wallet;
  testnet?: boolean;
  vaultAddress?: string;
}

export interface HyperliquidMarket {
  name: string;
  szDecimals: number;
  // ... all exchange-specific fields
}

export interface HyperliquidOrder {
  order: {
    oid: number;
    // ... all exchange-specific fields
  };
  status: string;
  statusTimestamp: number;
}
```

#### 7. `index.ts` - Public API

**Purpose**: Export the public API of the adapter module.

**Example**:
```typescript
export { HyperliquidAdapter } from './HyperliquidAdapter.js';
export { HyperliquidNormalizer } from './HyperliquidNormalizer.js';
export { HyperliquidAuth } from './HyperliquidAuth.js';

export type {
  HyperliquidConfig,
  HyperliquidMarket,
  HyperliquidOrder,
  HyperliquidPosition,
  // ... export all public types
} from './types.js';
```

### Data Flow

#### Request Flow: User → Exchange

```
User Application
      │
      │ Calls unified method
      │ adapter.createOrder({symbol: 'BTC/USDT:USDT', ...})
      ▼
Exchange Adapter
      │
      │ 1. Convert symbol to exchange format
      │    normalizer.toExchangeSymbol('BTC/USDT:USDT') → 'BTC-PERP'
      │
      │ 2. Convert order request to exchange format
      │    utils.convertOrderRequest(request, 'BTC-PERP')
      │
      │ 3. Sign request (if authenticated)
      │    auth.signL1Action(orderAction)
      │
      │ 4. Send HTTP request
      │    POST /exchange/order
      ▼
Exchange API
```

#### Response Flow: Exchange → User

```
Exchange API
      │
      │ Returns exchange-specific data
      │ {order: {oid: 123, ...}, status: 'open', ...}
      ▼
Exchange Adapter
      │
      │ Receives response
      ▼
Normalizer
      │
      │ Transform to unified format
      │ normalizeOrder(exchangeOrder)
      │
      │ Returns: {id: '123', symbol: 'BTC/USDT:USDT', status: 'open', ...}
      ▼
User Application
```

#### Error Handling Flow

```
Exchange API
      │
      │ Returns error response
      │ {error: 'Insufficient margin'}
      ▼
Exchange Adapter
      │
      │ Catches error
      │ catch (error) { throw mapError(error); }
      ▼
Utils (mapError)
      │
      │ Maps to unified error type
      │ 'Insufficient margin' → InsufficientMarginError
      ▼
User Application
      │
      │ Handles typed error
      │ if (error instanceof InsufficientMarginError) { ... }
```

---

## Standardization Summary

### Completed Work: 5-Week Project

Over 5 weeks (November-December 2025), we systematically refactored all exchange adapters to Pattern A:

#### Week 1: Tier 1 Adapter Testing
- **Goal**: Validate existing Pattern A adapters
- **Adapters**: Paradex, GRVT, Nado
- **Result**: ✅ All 3 adapters confirmed Pattern A compliant
- **Tests**: Existing tests passing, architecture validated

#### Week 2: Hyperliquid Comprehensive Testing
- **Goal**: Write comprehensive tests before refactoring
- **Adapter**: Hyperliquid (most complex adapter)
- **Work**: Expanded tests from 313 → 1,332 lines
- **Tests Created**: 77 unit tests, 32 auth tests, 49 integration tests
- **Result**: ✅ 158 total tests passing, 1 bug found and fixed

#### Week 3: Hyperliquid Refactoring
- **Goal**: Refactor Hyperliquid from Pattern C → Pattern A
- **Created**: HyperliquidNormalizer.ts (498 lines)
- **Modified**: utils.ts (456 → 132 lines, 71% reduction)
- **Result**: ✅ All 158 tests passing, 0 TypeScript errors

#### Week 4: EdgeX & Backpack Refactoring
- **Goal**: Refactor two mid-complexity adapters
- **EdgeX**: Created EdgeXNormalizer.ts (308 lines), utils.ts 380 → 79 lines (79% reduction)
- **Backpack**: Created BackpackNormalizer.ts (325 lines), utils.ts 396 → 93 lines (77% reduction)
- **Result**: ✅ 21 tests passing (10 EdgeX + 11 Backpack), 0 TypeScript errors

#### Week 5: Lighter Refactoring
- **Goal**: Complete final adapter standardization
- **Created**: LighterNormalizer.ts (235 lines)
- **Modified**: utils.ts (353 → 115 lines, 67% reduction)
- **Result**: ✅ 0 TypeScript errors, project 100% complete

### All 7 Adapters Standardized

| Adapter     | Pattern | Normalizer Size | utils.ts Before | utils.ts After | Reduction |
|-------------|---------|-----------------|-----------------|----------------|-----------|
| Hyperliquid | A       | 498 lines       | 456 lines       | 132 lines      | 71%       |
| Paradex     | A       | (existing)      | (existing)      | (existing)     | N/A       |
| GRVT        | A       | (existing)      | (existing)      | (existing)     | N/A       |
| Nado        | A       | (existing)      | (existing)      | (existing)     | N/A       |
| EdgeX       | A       | 308 lines       | 380 lines       | 79 lines       | 79%       |
| Backpack    | A       | 325 lines       | 396 lines       | 93 lines       | 77%       |
| Lighter     | A       | 235 lines       | 353 lines       | 115 lines      | 67%       |

### Code Quality Improvements

**Normalizer Code Created**: 1,366 lines across 4 new Normalizer classes

**Utils.ts Reduction**: ~1,200 lines removed (average 73% reduction per refactored adapter)

**Test Coverage**: 316+ tests across all adapters
- Unit tests for normalizers
- Integration tests for adapters
- Authentication tests for complex auth flows

**Code Health**:
- ✅ 0 TypeScript compilation errors
- ✅ 100% Pattern A compliance
- ✅ Consistent naming conventions
- ✅ Identical file structures

---

## Design Decisions

### Why Separate Normalizers?

**Problem**: Original Pattern C had normalization functions scattered in utils.ts, making them hard to test and reuse.

**Solution**: Extract all normalization logic into dedicated Normalizer classes.

**Benefits**:
1. **Testability**: Normalizer methods can be unit tested independently
   ```typescript
   // Easy to test in isolation
   const normalizer = new HyperliquidNormalizer();
   expect(normalizer.normalizeSymbol('BTC-PERP')).toBe('BTC/USDT:USDT');
   ```

2. **Reusability**: Normalizers can be used outside adapters
   ```typescript
   // Use normalizer without creating full adapter
   import { HyperliquidNormalizer } from 'pd-aio-sdk/adapters/hyperliquid';
   const normalizer = new HyperliquidNormalizer();
   ```

3. **Maintainability**: Changes to normalization don't affect adapter logic
   - Modify symbol format? Change only the normalizer
   - Add new field to Order? Update only normalizeOrder method

4. **Separation of Concerns**: Clear boundary between transformation and business logic
   - Adapter: Orchestrates API calls, manages state
   - Normalizer: Transforms data formats
   - Auth: Handles signatures
   - Utils: Provides helpers

### Why Pattern A Over Pattern C?

**Pattern C (Hybrid)** had these issues:
- ❌ Inconsistent structure across adapters
- ❌ Normalization functions exported from utils.ts
- ❌ Hard to find where transformations happen
- ❌ Testing requires mocking utils functions
- ❌ New contributors confused by mixed patterns

**Pattern A (Full-Featured)** provides:
- ✅ Identical structure across all adapters
- ✅ Clear location for all transformations (Normalizer class)
- ✅ Easy to understand: "If it transforms data, it's in the Normalizer"
- ✅ Straightforward testing: instantiate normalizer, test methods
- ✅ One pattern to learn, applies everywhere

### Trade-offs Considered

#### More Files vs Better Organization
- **Trade-off**: Pattern A adds 1-2 files per adapter (Normalizer, sometimes Auth)
- **Decision**: Better organization worth the extra files
- **Rationale**: Clear boundaries more important than file count

#### Class Overhead vs Clarity
- **Trade-off**: Classes have slightly more boilerplate than functions
- **Decision**: Clarity and consistency win
- **Rationale**: `this.normalizer.normalizeOrder()` is clearer than `normalizeOrder()` import

#### Migration Effort vs Long-term Benefits
- **Trade-off**: 5 weeks to refactor all adapters
- **Decision**: Invest time upfront for long-term maintainability
- **Rationale**: Consistency pays dividends as codebase grows

---

## Testing Strategy

### Test Organization

Our testing strategy follows the adapter structure:

```
tests/
├── unit/
│   ├── hyperliquid-normalizer.test.ts    # Normalizer tests
│   ├── hyperliquid-auth.test.ts          # Auth tests
│   └── hyperliquid-utils.test.ts         # Utils tests
└── integration/
    └── hyperliquid-adapter.test.ts       # Full adapter tests
```

### Unit Tests for Normalizers

**Purpose**: Test each normalization method in isolation.

**Coverage Requirements**: 100% of public methods

**Example**:
```typescript
describe('HyperliquidNormalizer', () => {
  const normalizer = new HyperliquidNormalizer();

  describe('Symbol Normalization', () => {
    test('converts perpetual symbols', () => {
      expect(normalizer.normalizeSymbol('BTC-PERP')).toBe('BTC/USDT:USDT');
      expect(normalizer.normalizeSymbol('ETH-PERP')).toBe('ETH/USDT:USDT');
    });

    test('handles spot symbols', () => {
      expect(normalizer.normalizeSymbol('BTC-SPOT')).toBe('BTC/USD');
    });
  });

  describe('Market Normalization', () => {
    test('normalizes all market fields', () => {
      const market = normalizer.normalizeMarket({
        name: 'BTC-PERP',
        szDecimals: 4,
        // ... all fields
      });

      expect(market.symbol).toBe('BTC/USDT:USDT');
      expect(market.amountPrecision).toBe(4);
      // ... assert all fields
    });
  });
});
```

### Integration Tests for Adapters

**Purpose**: Test adapter methods with mocked HTTP/WebSocket responses.

**Coverage Requirements**: 80%+ of adapter methods

**Example**:
```typescript
describe('HyperliquidAdapter Integration', () => {
  let adapter: HyperliquidAdapter;

  beforeEach(() => {
    adapter = new HyperliquidAdapter({
      wallet: mockWallet,
      testnet: true,
    });
  });

  test('fetchMarkets returns normalized markets', async () => {
    // Mock HTTP response
    mockHttpGet('/info', { universe: [/* mock data */] });

    const markets = await adapter.fetchMarkets();

    expect(markets).toHaveLength(5);
    expect(markets[0].symbol).toBe('BTC/USDT:USDT');
  });
});
```

### E2E Tests (Optional)

**Purpose**: Test against real testnet APIs (when available).

**When to use**: For critical adapters or before major releases.

---

## Adding New Adapters

To add a new exchange adapter following Pattern A:

1. **Read ADAPTER_GUIDE.md** - Comprehensive step-by-step guide
2. **Research the exchange API** - Understand endpoints, auth, rate limits
3. **Create file structure** - Follow Pattern A template
4. **Implement Normalizer first** - Get data transformations right
5. **Write unit tests** - Test normalizer methods
6. **Implement Adapter** - Use normalizer for all transformations
7. **Write integration tests** - Test adapter with mocked responses
8. **Update documentation** - Add to README.md supported exchanges

See [ADAPTER_GUIDE.md](./ADAPTER_GUIDE.md) for detailed instructions.

---

## Migration Guide

### For Users of the SDK

If you were using normalize functions directly from utils:

**Before (Pattern C)**:
```typescript
import { normalizeOrder } from 'pd-aio-sdk/adapters/hyperliquid/utils';

const order = normalizeOrder(exchangeOrder);
```

**After (Pattern A)**:
```typescript
import { HyperliquidNormalizer } from 'pd-aio-sdk/adapters/hyperliquid';

const normalizer = new HyperliquidNormalizer();
const order = normalizer.normalizeOrder(exchangeOrder);
```

**Best Practice**: Use adapter instances instead of direct normalization:
```typescript
import { HyperliquidAdapter } from 'pd-aio-sdk';

const adapter = new HyperliquidAdapter({wallet, testnet: true});
const orders = await adapter.fetchOrderHistory();  // Already normalized
```

### For Contributors

If you're updating an adapter:

1. **Never add normalize functions to utils.ts** - Always use the Normalizer class
2. **Always call `this.normalizer.normalizeX()`** - Never import functions
3. **Keep utils.ts minimal** - Only helper functions, no transformations
4. **Write tests for normalizer methods** - Unit test each public method

---

## Future Improvements

### Short-term (Next 3 Months)

1. **Enhanced Type Safety**
   - Stricter TypeScript types for exchange-specific data
   - Generic constraints for normalizer methods
   - Better inference for adapter methods

2. **Performance Optimizations**
   - Batch normalization for large datasets
   - Caching frequently accessed normalizations
   - Lazy initialization of normalizers

3. **Developer Experience**
   - CLI tool to scaffold new adapters
   - VSCode snippets for Pattern A files
   - Interactive documentation

### Long-term (Next 6-12 Months)

1. **Plugin System**
   - Community-contributed adapters as plugins
   - Adapter marketplace
   - Version management for adapters

2. **Cross-Adapter Features**
   - Unified liquidity aggregation
   - Smart order routing across exchanges
   - Cross-exchange arbitrage detection

3. **Advanced Patterns**
   - Pattern B (Lightweight) for simple exchanges
   - Pattern A+ (Extended) for exchanges with unique features
   - Adapter composition for related exchanges

### Community Contributions Welcome

We welcome contributions in these areas:
- 🔌 New exchange adapters
- 🧪 Additional test coverage
- 📚 Documentation improvements
- 🐛 Bug fixes and optimizations
- 💡 Feature suggestions

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## Conclusion

The Pattern A standardization represents a major milestone in PD-AIO-SDK's evolution. With all 7 adapters now following consistent architecture patterns, the codebase is more maintainable, testable, and scalable than ever before.

**Key Achievements**:
- ✅ 100% Pattern A compliance across all adapters
- ✅ 1,366 lines of new normalizer code
- ✅ 73% average reduction in utils.ts size
- ✅ 316+ tests ensuring quality
- ✅ 0 TypeScript errors
- ✅ Clear documentation and guidelines

This solid foundation enables us to:
- 🚀 Add new exchanges faster
- 🔧 Maintain existing adapters easier
- 📈 Scale the SDK confidently
- 🤝 Onboard contributors smoothly

Thank you to all contributors who made this standardization possible!

---

*Last updated: December 10, 2025*
*SDK Version: [Next Release]*
