# Exchange Adapter Development Guide

Complete step-by-step guide for adding new exchange adapters to PD AIO SDK using **Pattern A** (Full-Featured) architecture.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Pattern A Architecture](#pattern-a-architecture)
4. [Step-by-Step Guide](#step-by-step-guide)
5. [File-by-File Implementation](#file-by-file-implementation)
6. [Testing Requirements](#testing-requirements)
7. [Integration Steps](#integration-steps)
8. [Best Practices](#best-practices)
9. [Common Pitfalls](#common-pitfalls)
10. [Example: Hyperliquid Adapter](#example-hyperliquid-adapter)

---

## Overview

All exchange adapters in PD AIO SDK follow **Pattern A** (Full-Featured) architecture for consistency, maintainability, and testability. This guide walks you through creating a new adapter from scratch.

**What you'll build:**
- A fully functional exchange adapter
- Dedicated Normalizer class for data transformation
- Comprehensive test suite (50+ tests)
- Documentation and examples

**Time estimate:** 2-4 weeks for a complete, production-ready adapter

---

## Prerequisites

### Exchange Requirements

Before starting, ensure the exchange meets these criteria:

- ✅ **Public API** - REST API with comprehensive documentation
- ✅ **WebSocket Support** - Real-time data streams (optional but recommended)
- ✅ **Perpetual Contracts** - Supports perpetual futures/swaps
- ✅ **Testnet Available** - Testing environment for development
- ✅ **Authentication** - API key, wallet signatures, or similar
- ✅ **Active Development** - Exchange actively maintains API

### Developer Requirements

- Strong TypeScript knowledge
- Understanding of async/await patterns
- Familiarity with REST APIs and WebSockets
- Experience with perpetual contracts/derivatives
- Basic knowledge of cryptographic signing (if applicable)

### Tools & Setup

```bash
# Clone the repository
git clone https://github.com/0xarkstar/PD-AIO-SDK.git
cd PD-AIO-SDK

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Verify setup
npm run build
npm test
```

---

## Pattern A Architecture

### File Structure

Every adapter follows this standardized structure:

```
src/adapters/yourexchange/
├── YourExchangeAdapter.ts      # Main adapter implementation (400-600 lines)
├── YourExchangeNormalizer.ts   # Data transformation (300-500 lines)
├── YourExchangeAuth.ts         # Authentication (200-400 lines, if complex)
├── utils.ts                    # Helper functions ONLY (80-150 lines)
├── constants.ts                # API URLs, rate limits (50-100 lines)
├── types.ts                    # TypeScript types, Zod schemas (100-200 lines)
└── index.ts                    # Public exports (10-20 lines)
```

### Separation of Concerns

**Pattern A Principles:**

1. **Normalizer Class** (REQUIRED)
   - All data transformation logic
   - Symbol format conversion
   - Exchange-specific → unified format mapping
   - Can be used independently by SDK users

2. **Adapter Class**
   - Implements `IExchangeAdapter` interface
   - Uses normalizer instance for all transformations
   - Handles API requests/responses
   - Manages WebSocket connections

3. **Utils File** (Helper functions ONLY)
   - Order request conversions
   - Error mapping
   - Exchange-specific utilities
   - **NO normalization functions** (those go in Normalizer)

4. **Auth Class** (Complex authentication only)
   - EIP-712 signing
   - StarkNet signatures
   - JWT token management
   - Session handling

---

## Step-by-Step Guide

### Phase 1: Research & Planning (1-3 days)

#### 1.1 Study Exchange API

Read and understand the exchange's API documentation:

- REST API endpoints (public + private)
- Authentication mechanism
- Rate limits and quotas
- WebSocket message formats
- Symbol format and market structure
- Order types and parameters
- Error codes and responses

**Create a checklist:**
```markdown
- [ ] Market data endpoints mapped
- [ ] Trading endpoints mapped
- [ ] Account endpoints mapped
- [ ] WebSocket channels documented
- [ ] Authentication flow understood
- [ ] Rate limits noted
- [ ] Symbol format documented
- [ ] Error codes cataloged
```

#### 1.2 Analyze Symbol Format

**Example symbol formats:**
- Hyperliquid: `BTC-PERP` → `BTC/USDT:USDT`
- EdgeX: `BTC-USDC-PERP` → `BTC/USDC:USDC`
- Backpack: `BTCUSDT_PERP` → `BTC/USDT:USDT`
- Lighter: `BTC-USDT-PERP` → `BTC/USDT:USDT`

**Document:**
- Exchange format pattern
- Unified format conversion rules
- Quote/settle currency mapping

#### 1.3 Set Up Testnet Account

- Create testnet account
- Get testnet credentials (API keys, wallet, etc.)
- Test basic API calls with curl/Postman
- Verify authentication works

---

### Phase 2: Core Files Setup (1-2 days)

#### 2.1 Create Directory Structure

```bash
mkdir -p src/adapters/yourexchange
cd src/adapters/yourexchange
touch YourExchangeAdapter.ts YourExchangeNormalizer.ts constants.ts types.ts utils.ts index.ts
```

#### 2.2 Create constants.ts

```typescript
export const API_URLS = {
  mainnet: {
    rest: 'https://api.yourexchange.com',
    ws: 'wss://ws.yourexchange.com'
  },
  testnet: {
    rest: 'https://testnet-api.yourexchange.com',
    ws: 'wss://testnet-ws.yourexchange.com'
  }
};

export const RATE_LIMITS = {
  perMinute: 600,
  perSecond: 10
};

export const DEFAULT_QUOTE_CURRENCY = 'USDT';
export const DEFAULT_SETTLE_CURRENCY = 'USDT';
```

#### 2.3 Create types.ts

Start with basic types from exchange documentation:

```typescript
import { z } from 'zod';

// Exchange-specific market type
export interface YourExchangeMarket {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  minOrderSize: string;
  tickSize: string;
  // ... other fields
}

// Exchange-specific order type
export interface YourExchangeOrder {
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  // ... other fields
}

// Zod schemas for runtime validation
export const YourExchangeMarketSchema = z.object({
  symbol: z.string(),
  baseAsset: z.string(),
  quoteAsset: z.string(),
  // ...
});
```

---

### Phase 3: Normalizer Implementation (3-5 days)

The Normalizer is the heart of Pattern A architecture. Implement all transformation logic here.

#### 3.1 Create Normalizer Class

```typescript
// YourExchangeNormalizer.ts
export class YourExchangeNormalizer {
  /**
   * Convert exchange symbol to unified format
   * Exchange: BTC-PERP → Unified: BTC/USDT:USDT
   */
  normalizeSymbol(exchangeSymbol: string): string {
    // Implementation
  }

  /**
   * Convert unified symbol to exchange format
   * Unified: BTC/USDT:USDT → Exchange: BTC-PERP
   */
  toExchangeSymbol(symbol: string): string {
    // Implementation
  }

  /**
   * Normalize market data
   */
  normalizeMarket(exchangeMarket: YourExchangeMarket): Market {
    return {
      id: exchangeMarket.symbol,
      symbol: this.normalizeSymbol(exchangeMarket.symbol),
      base: exchangeMarket.baseAsset,
      quote: exchangeMarket.quoteAsset,
      settle: exchangeMarket.quoteAsset,
      type: 'swap',
      spot: false,
      margin: true,
      contract: true,
      contractSize: 1,
      active: true,
      precision: {
        amount: this.countDecimals(exchangeMarket.minOrderSize),
        price: this.countDecimals(exchangeMarket.tickSize)
      },
      limits: {
        amount: {
          min: parseFloat(exchangeMarket.minOrderSize),
          max: undefined
        },
        price: {
          min: parseFloat(exchangeMarket.tickSize),
          max: undefined
        }
      },
      info: exchangeMarket
    };
  }

  // Helper method (private)
  private countDecimals(value: string): number {
    const parts = value.split('.');
    return parts.length > 1 ? parts[1].length : 0;
  }

  // Implement all required normalization methods:
  // - normalizeOrder()
  // - normalizePosition()
  // - normalizeBalance()
  // - normalizeOrderBook()
  // - normalizeTrade()
  // - normalizeTicker()
  // - normalizeFundingRate()
}
```

#### 3.2 Implement All Normalization Methods

**Required methods** (implement each one):

1. `normalizeSymbol(exchangeSymbol: string): string`
2. `toExchangeSymbol(symbol: string): string`
3. `normalizeMarket(exchangeMarket: any): Market`
4. `normalizeOrder(exchangeOrder: any): Order`
5. `normalizePosition(exchangePosition: any): Position`
6. `normalizeBalance(exchangeBalance: any): Balance`
7. `normalizeOrderBook(exchangeOrderBook: any): OrderBook`
8. `normalizeTrade(exchangeTrade: any): Trade`
9. `normalizeTicker(exchangeTicker: any): Ticker`
10. `normalizeFundingRate(exchangeFunding: any): FundingRate`

**Helper methods** (private):
- `normalizeOrderType(exchangeType: string): OrderType`
- `normalizeOrderSide(exchangeSide: string): OrderSide`
- `normalizeOrderStatus(exchangeStatus: string): OrderStatus`
- `normalizeTimeInForce(exchangeTif: string): TimeInForce`
- `countDecimals(value: string): number`

---

### Phase 4: Utils Implementation (1 day)

**IMPORTANT:** Utils should contain ONLY helper functions, NO normalization.

```typescript
// utils.ts
import type { OrderRequest } from '../../types/adapter.js';
import type { YourExchangeOrderRequest } from './types.js';
import {
  PerpDEXError,
  RateLimitError,
  InsufficientMarginError,
  InvalidOrderError,
  OrderNotFoundError,
  InvalidSignatureError,
  ExchangeUnavailableError
} from '../../types/errors.js';

/**
 * Convert unified OrderRequest to exchange format
 */
export function convertOrderRequest(request: OrderRequest): YourExchangeOrderRequest {
  return {
    symbol: request.symbol,  // Will be converted by adapter
    side: request.side,
    type: toExchangeOrderType(request.type),
    quantity: request.amount.toString(),
    price: request.price?.toString(),
    clientOrderId: request.params?.clientOrderId,
    timeInForce: request.params?.timeInForce
      ? toExchangeTimeInForce(request.params.timeInForce)
      : undefined,
    reduceOnly: request.params?.reduceOnly,
    postOnly: request.params?.postOnly
  };
}

/**
 * Convert unified OrderType to exchange format
 */
export function toExchangeOrderType(type: string): string {
  const map: Record<string, string> = {
    market: 'MARKET',
    limit: 'LIMIT'
  };
  return map[type] || 'LIMIT';
}

/**
 * Convert unified OrderSide to exchange format
 */
export function toExchangeOrderSide(side: string): string {
  return side.toUpperCase();
}

/**
 * Convert unified TimeInForce to exchange format
 */
export function toExchangeTimeInForce(tif: string): string {
  const map: Record<string, string> = {
    GTC: 'GOOD_TILL_CANCEL',
    IOC: 'IMMEDIATE_OR_CANCEL',
    FOK: 'FILL_OR_KILL',
    PO: 'POST_ONLY'
  };
  return map[tif] || 'GOOD_TILL_CANCEL';
}

/**
 * Map exchange errors to unified error types
 */
export function mapError(error: any): PerpDEXError {
  const message = error.message || error.toString();
  const code = error.code || error.statusCode;

  // Rate limiting
  if (code === 429 || message.includes('rate limit')) {
    return new RateLimitError(message, 'yourexchange', error);
  }

  // Insufficient margin
  if (message.includes('insufficient') && message.includes('margin')) {
    return new InsufficientMarginError(message, 'yourexchange', error);
  }

  // Invalid order
  if (message.includes('invalid order')) {
    return new InvalidOrderError(message, 'yourexchange', error);
  }

  // Order not found
  if (code === 404 || message.includes('order not found')) {
    return new OrderNotFoundError(message, 'yourexchange', error);
  }

  // Authentication errors
  if (code === 401 || code === 403 || message.includes('auth')) {
    return new InvalidSignatureError(message, 'yourexchange', error);
  }

  // Exchange unavailable
  if (code === 502 || code === 503 || message.includes('unavailable')) {
    return new ExchangeUnavailableError(message, 'yourexchange', error);
  }

  // Generic error
  return new PerpDEXError(message, 'yourexchange', error);
}
```

---

### Phase 5: Adapter Implementation (5-7 days)

#### 5.1 Create Adapter Class

```typescript
// YourExchangeAdapter.ts
import type { IExchangeAdapter } from '../../types/adapter.js';
import { YourExchangeNormalizer } from './YourExchangeNormalizer.js';
import { convertOrderRequest, mapError } from './utils.js';
import { API_URLS, RATE_LIMITS } from './constants.js';

export class YourExchangeAdapter implements IExchangeAdapter {
  private normalizer: YourExchangeNormalizer;
  private apiUrl: string;
  private wsUrl: string;
  private apiKey: string;
  private apiSecret: string;

  constructor(config: YourExchangeConfig) {
    this.normalizer = new YourExchangeNormalizer();

    const urls = config.testnet ? API_URLS.testnet : API_URLS.mainnet;
    this.apiUrl = urls.rest;
    this.wsUrl = urls.ws;

    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
  }

  async initialize(): Promise<void> {
    // Initialize connection, verify credentials, etc.
  }

  async disconnect(): Promise<void> {
    // Cleanup resources
  }

  async fetchMarkets(): Promise<Market[]> {
    try {
      const response = await this.request('GET', '/markets');
      return response.map((m: any) => this.normalizer.normalizeMarket(m));
    } catch (error) {
      throw mapError(error);
    }
  }

  // Implement all IExchangeAdapter methods...

  symbolToExchange(symbol: string): string {
    return this.normalizer.toExchangeSymbol(symbol);
  }

  symbolFromExchange(exchangeSymbol: string): string {
    return this.normalizer.normalizeSymbol(exchangeSymbol);
  }

  private async request(method: string, path: string, data?: any): Promise<any> {
    // HTTP request implementation with authentication
  }
}
```

#### 5.2 Implement All Required Methods

**Lifecycle:**
- `initialize(): Promise<void>`
- `disconnect(): Promise<void>`
- `getHealth(): Promise<HealthStatus>`

**Market Data:**
- `fetchMarkets(): Promise<Market[]>`
- `fetchTicker(symbol: string): Promise<Ticker>`
- `fetchOrderBook(symbol: string, limit?: number): Promise<OrderBook>`
- `fetchTrades(symbol: string, limit?: number): Promise<Trade[]>`
- `fetchFundingRate(symbol: string): Promise<FundingRate>`

**Trading:**
- `createOrder(request: OrderRequest): Promise<Order>`
- `cancelOrder(orderId: string, symbol: string): Promise<Order>`
- `fetchOrder(orderId: string, symbol: string): Promise<Order>`
- `fetchOpenOrders(symbol?: string): Promise<Order[]>`

**Positions & Account:**
- `fetchPositions(symbols?: string[]): Promise<Position[]>`
- `fetchBalance(): Promise<Balance>`

**WebSocket (if supported):**
- `watchOrderBook(symbol: string): AsyncGenerator<OrderBook>`
- `watchTrades(symbol: string): AsyncGenerator<Trade>`
- `watchPositions?(): AsyncGenerator<Position[]>`

---

### Phase 6: Authentication (2-4 days, if complex)

For complex authentication (EIP-712, StarkNet, etc.), create a separate Auth class.

```typescript
// YourExchangeAuth.ts (if needed)
import { Wallet } from 'ethers';

export class YourExchangeAuth {
  constructor(private wallet: Wallet) {}

  async signRequest(request: any): Promise<string> {
    // Implement signing logic
  }

  async getAuthHeaders(method: string, path: string, body?: any): Promise<Record<string, string>> {
    // Generate authentication headers
  }
}
```

**Common auth patterns:**
- **API Key + Secret**: HMAC-SHA256 signatures (Lighter, Variational)
- **EIP-712**: Ethereum wallet signatures (Hyperliquid, GRVT, Nado)
- **StarkNet/StarkEx**: Pedersen hash + ECDSA signatures (Paradex, EdgeX)
- **ED25519**: Solana signatures (Backpack)

### Exchange Credential Reference

| Exchange | Auth Type | Required Environment Variables | Config Fields |
|----------|-----------|-------------------------------|---------------|
| **Hyperliquid** | EIP-712 | `HYPERLIQUID_PRIVATE_KEY` | `privateKey` |
| **Lighter** | HMAC-SHA256 | `LIGHTER_API_KEY`, `LIGHTER_API_SECRET` | `apiKey`, `apiSecret` |
| **EdgeX** | StarkEx Pedersen | `EDGEX_STARK_PRIVATE_KEY` | `starkPrivateKey` |
| **Nado** | EIP-712 (Ink L2) | `NADO_PRIVATE_KEY` | `privateKey` |
| **Extended** | API Key | `EXTENDED_API_KEY` | `apiKey` (+ optional `starknetPrivateKey`) |
| **Variational** | HMAC-SHA256 | `VARIATIONAL_API_KEY`, `VARIATIONAL_API_SECRET` | `apiKey`, `apiSecret` |
| **GRVT** | EIP-712 + API | `GRVT_PRIVATE_KEY`, `GRVT_API_KEY` | `privateKey`, `apiKey` |
| **Paradex** | StarkNet | `PARADEX_STARK_PRIVATE_KEY` | `starkPrivateKey` |
| **Backpack** | ED25519 | `BACKPACK_API_KEY`, `BACKPACK_SECRET_KEY` | `apiKey`, `secretKey` |

---

## Testing Requirements

### Test Structure

```
tests/
├── unit/
│   └── yourexchange-utils.test.ts      # Normalizer + utils tests
└── integration/
    └── yourexchange-adapter.test.ts     # Full adapter tests
```

### Minimum Test Coverage

**Unit Tests (20+ tests):**
- Symbol conversion (2-4 tests)
- Each normalization method (10+ tests)
- Utility functions (5+ tests)

**Integration Tests (30+ tests):**
- Market data methods (8+ tests)
- Trading methods (10+ tests)
- Position/account methods (5+ tests)
- WebSocket streaming (5+ tests)
- Error handling (2+ tests)

### Example Unit Test

```typescript
// tests/unit/yourexchange-utils.test.ts
import { YourExchangeNormalizer } from '../../src/adapters/yourexchange/YourExchangeNormalizer.js';

const normalizer = new YourExchangeNormalizer();

describe('YourExchangeNormalizer', () => {
  describe('Symbol Conversion', () => {
    it('should convert exchange symbol to unified format', () => {
      expect(normalizer.normalizeSymbol('BTC-PERP')).toBe('BTC/USDT:USDT');
      expect(normalizer.normalizeSymbol('ETH-PERP')).toBe('ETH/USDT:USDT');
    });

    it('should convert unified symbol to exchange format', () => {
      expect(normalizer.toExchangeSymbol('BTC/USDT:USDT')).toBe('BTC-PERP');
      expect(normalizer.toExchangeSymbol('ETH/USDT:USDT')).toBe('ETH-PERP');
    });
  });

  describe('normalizeMarket', () => {
    it('should normalize market data correctly', () => {
      const exchangeMarket = {
        symbol: 'BTC-PERP',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
        minOrderSize: '0.001',
        tickSize: '0.1'
      };

      const result = normalizer.normalizeMarket(exchangeMarket);

      expect(result).toMatchObject({
        symbol: 'BTC/USDT:USDT',
        base: 'BTC',
        quote: 'USDT',
        settle: 'USDT',
        type: 'swap',
        precision: {
          amount: 3,
          price: 1
        }
      });
    });
  });
});
```

---

## Integration Steps

### 1. Add to Factory

```typescript
// src/factory.ts

// Add to type
export type SupportedExchange =
  | 'hyperliquid'
  | 'grvt'
  | 'paradex'
  | 'edgex'
  | 'backpack'
  | 'lighter'
  | 'nado'
  | 'yourexchange';  // Add here

// Add to config map
export interface ExchangeConfigMap {
  // ... existing
  yourexchange: YourExchangeConfig;
}

// Add to factory function
export function createExchange<T extends SupportedExchange>(
  exchangeId: T,
  config: ExchangeConfigMap[T]
): IExchangeAdapter {
  switch (exchangeId) {
    // ... existing cases
    case 'yourexchange':
      return new YourExchangeAdapter(config as YourExchangeConfig);
    default:
      throw new Error(`Unsupported exchange: ${exchangeId}`);
  }
}
```

### 2. Update README.md

Add to Supported Exchanges table:

```markdown
| **YourExchange** | ✅ Production | ✅/❌ Testnet | Auth Method | Pattern A | Special Features |
```

### 3. Add to .env.example

```bash
# YourExchange
YOUREXCHANGE_API_KEY=your_api_key
YOUREXCHANGE_API_SECRET=your_api_secret
YOUREXCHANGE_TESTNET=true
```

### 4. Create Exchange Guide

```bash
# docs/guides/yourexchange.md
```

Include:
- Quick start guide
- Authentication setup
- Code examples
- Common issues
- Rate limits

---

## Best Practices

### Code Quality

1. **Use TypeScript strict mode** - No `any` without good reason
2. **Validate all inputs** - Use Zod schemas for API responses
3. **Handle errors gracefully** - Map all exchange errors to unified types
4. **Add JSDoc comments** - Document all public methods
5. **Follow naming conventions** - Match existing adapters

### Performance

1. **Implement caching** - Cache market data with TTL
2. **Respect rate limits** - Use rate limiter
3. **Batch requests** - Combine multiple requests where possible
4. **Optimize WebSocket** - Efficient subscription management

### Security

1. **Never log secrets** - Mask API keys/private keys in logs
2. **Validate signatures** - Verify all authentication
3. **Sanitize inputs** - Prevent injection attacks
4. **Use HTTPS only** - No plain HTTP requests

---

## Common Pitfalls

### 1. Forgetting Arrow Functions in .map()

❌ **Wrong:**
```typescript
response.map(this.normalizer.normalizeOrder)  // 'this' context lost
```

✅ **Correct:**
```typescript
response.map((order: any) => this.normalizer.normalizeOrder(order))
```

### 2. Normalization in Utils

❌ **Wrong:**
```typescript
// utils.ts
export function normalizeOrder(order: any): Order { /* ... */ }
```

✅ **Correct:**
```typescript
// YourExchangeNormalizer.ts
class YourExchangeNormalizer {
  normalizeOrder(order: any): Order { /* ... */ }
}
```

### 3. Missing Error Mapping

Always wrap API calls with error mapping:

```typescript
try {
  const result = await this.request(...);
  return result;
} catch (error) {
  throw mapError(error);  // Essential!
}
```

### 4. Incorrect Symbol Conversion

Always convert symbols using the normalizer:

```typescript
// In adapter methods
const exchangeSymbol = this.normalizer.toExchangeSymbol(symbol);
const response = await this.request('GET', `/ticker/${exchangeSymbol}`);
return this.normalizer.normalizeTicker(response);
```

---

## Example: Hyperliquid Adapter

Study the Hyperliquid adapter as a reference implementation:

```
src/adapters/hyperliquid/
├── HyperliquidAdapter.ts       # 498 lines
├── HyperliquidNormalizer.ts    # 498 lines
├── HyperliquidAuth.ts          # 387 lines
├── utils.ts                    # 132 lines
├── constants.ts                # 76 lines
├── types.ts                    # 143 lines
└── index.ts                    # 12 lines
```

**Key takeaways:**
- Normalizer handles ALL data transformations
- Utils contains ONLY helper functions
- Comprehensive test suite (158 tests)
- Clean separation of concerns

**Files to review:**
- `src/adapters/hyperliquid/HyperliquidNormalizer.ts` - Symbol conversion patterns
- `src/adapters/hyperliquid/utils.ts` - Minimal helper functions only
- `tests/unit/hyperliquid-utils.test.ts` - Normalizer testing patterns

---

## Checklist

Use this checklist to track your progress:

### Phase 1: Research
- [ ] API documentation reviewed
- [ ] Symbol format documented
- [ ] Authentication method understood
- [ ] Rate limits noted
- [ ] Testnet account created

### Phase 2: Core Files
- [ ] Directory created
- [ ] constants.ts created
- [ ] types.ts created with Zod schemas
- [ ] index.ts created

### Phase 3: Normalizer
- [ ] Normalizer class created
- [ ] Symbol conversion implemented
- [ ] All 10 normalize methods implemented
- [ ] Helper methods implemented

### Phase 4: Utils
- [ ] convertOrderRequest implemented
- [ ] mapError implemented
- [ ] Helper functions implemented
- [ ] NO normalization in utils

### Phase 5: Adapter
- [ ] Adapter class created
- [ ] IExchangeAdapter implemented
- [ ] All required methods implemented
- [ ] Uses normalizer for all transforms

### Phase 6: Authentication
- [ ] Auth class created (if needed)
- [ ] Signing logic implemented
- [ ] Tested with testnet

### Phase 7: Testing
- [ ] Unit tests created (20+)
- [ ] Integration tests created (30+)
- [ ] All tests passing
- [ ] Coverage > 80%

### Phase 8: Integration
- [ ] Added to factory.ts
- [ ] Updated README.md
- [ ] Added to .env.example
- [ ] Created exchange guide
- [ ] Updated CHANGELOG.md
- [ ] Updated API.md

### Phase 9: Documentation
- [ ] JSDoc comments added
- [ ] Code examples included
- [ ] Exchange guide complete
- [ ] README updated

### Phase 10: Final Review
- [ ] TypeScript: 0 errors
- [ ] Linter: 0 warnings
- [ ] Tests: 100% passing
- [ ] Documentation reviewed
- [ ] PR submitted

---

## Getting Help

If you get stuck:

1. **Review existing adapters** - Hyperliquid, GRVT, Paradex are good references
2. **Check ARCHITECTURE.md** - Detailed architecture documentation
3. **Read API.md** - Complete API reference
4. **Open an issue** - Ask for help on GitHub
5. **Join discussions** - GitHub Discussions for questions

---

## Summary

**Pattern A Architecture = Consistency + Maintainability + Testability**

By following this guide, you'll create a high-quality adapter that:
- ✅ Matches all existing adapters in structure
- ✅ Is easy to test and maintain
- ✅ Provides excellent developer experience
- ✅ Integrates seamlessly with the SDK

**Good luck building your adapter!** 🚀

---

For more information:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture guide
- [API.md](./API.md) - Complete API reference
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development guidelines
