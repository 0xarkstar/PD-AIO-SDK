# Project Context - PD AIO SDK

> Development context and guidelines for contributors and AI-assisted development tools.

## Project Overview
Unified TypeScript SDK for decentralized perpetual exchanges. Supports 16 exchanges: Hyperliquid, Lighter, GRVT, Paradex, EdgeX, Backpack, Nado, Extended, Variational, dYdX, Jupiter, Drift, GMX, Aster, Pacifica, Ostium.

## Architecture

### Hexagonal Architecture Pattern
- **Core Domain**: Pure business logic, no external dependencies
- **Adapters Layer**: Exchange-specific implementations using Pattern A
- **Infrastructure**: WebSocket, rate limiting, authentication

### Pattern A (Full-Featured) Architecture
All 16 exchange adapters follow **Pattern A** for consistency and maintainability.

**File Structure (9-11 files per adapter):**
```
src/adapters/{exchange}/
├── {Exchange}Adapter.ts       # Main adapter (400-600 lines)
├── {Exchange}Normalizer.ts    # Data transformation (300-500 lines) - REQUIRED
├── {Exchange}Auth.ts          # Authentication (200-400 lines, if complex)
├── utils.ts                   # Helper functions ONLY (80-150 lines)
├── constants.ts               # API URLs, rate limits
├── types.ts                   # TypeScript types + Zod schemas
└── index.ts                   # Public exports
```

**Key Principles:**
1. **Normalizer Class (REQUIRED)**: All data transformations in dedicated class
   - Symbol format conversion
   - Exchange-specific → unified format mapping
   - Can be used independently by SDK users
2. **Utils File**: Contains ONLY helper functions (NO normalization)
   - Order request conversions
   - Error mapping
   - Exchange-specific utilities
3. **Adapter Class**: Uses normalizer instance for all transformations
   - `this.normalizer.normalizeX()` pattern
4. **Separation of Concerns**: Clear boundaries between components

### Key Design Principles
1. **Adapter Pattern**: Each exchange implements `IExchangeAdapter` interface
2. **Pattern A Architecture**: Dedicated Normalizer classes for all transformations
3. **Feature Detection**: Capability-based runtime checks (CCXT style)
4. **Error Normalization**: Platform-specific errors mapped to unified hierarchy
5. **Type Safety**: Zod runtime validation + TypeScript strict mode

## Normalizer Conventions

### Required Methods
Every Normalizer class must implement these methods:
```typescript
class ExchangeNormalizer {
  // Symbol conversion (REQUIRED)
  normalizeSymbol(exchangeSymbol: string): string;      // Exchange → Unified
  toExchangeSymbol(symbol: string): string;             // Unified → Exchange

  // Market data normalization (REQUIRED)
  normalizeMarket(exchangeMarket: any): Market;
  normalizeOrder(exchangeOrder: any): Order;
  normalizePosition(exchangePosition: any): Position;
  normalizeBalance(exchangeBalance: any): Balance;
  normalizeOrderBook(exchangeOrderBook: any): OrderBook;
  normalizeTrade(exchangeTrade: any): Trade;
  normalizeTicker(exchangeTicker: any): Ticker;
  normalizeFundingRate(exchangeFunding: any): FundingRate;
}
```

### Private Helper Methods
Use private methods for internal transformations:
```typescript
private normalizeOrderType(exchangeType: string): OrderType;
private normalizeOrderSide(exchangeSide: string): OrderSide;
private normalizeOrderStatus(exchangeStatus: string): OrderStatus;
private normalizeTimeInForce(exchangeTif: string): TimeInForce;
private countDecimals(value: string): number;
```

### Usage in Adapter
Always use normalizer instance in adapter:
```typescript
class ExchangeAdapter implements IExchangeAdapter {
  private normalizer: ExchangeNormalizer;

  constructor(config: Config) {
    this.normalizer = new ExchangeNormalizer();
  }

  async fetchMarkets(): Promise<Market[]> {
    const response = await this.request('GET', '/markets');
    // Use normalizer for transformation
    return response.map((m: any) => this.normalizer.normalizeMarket(m));
  }

  symbolToExchange(symbol: string): string {
    return this.normalizer.toExchangeSymbol(symbol);
  }
}
```

### Common Pitfall: Arrow Functions in .map()
❌ **Wrong** - loses 'this' context:
```typescript
response.map(this.normalizer.normalizeOrder)
```

✅ **Correct** - preserves context:
```typescript
response.map((order: any) => this.normalizer.normalizeOrder(order))
```

## Code Style Conventions

### TypeScript Standards
- **Strict Mode**: All compiler strict checks enabled
- **No `any`**: Explicit types required (use `unknown` if truly dynamic)
- **ES Modules**: Use `import/export`, not `require`
- **Async/Await**: No raw Promise chains

### Naming Conventions
```typescript
// Interfaces: I prefix
interface IExchangeAdapter {}

// Types: PascalCase
type OrderType = 'market' | 'limit';

// Classes: PascalCase
class HyperliquidAdapter {}

// Functions: camelCase
function fetchMarkets() {}

// Constants: SCREAMING_SNAKE_CASE
const MAX_RETRIES = 5;
```

### Documentation Requirements
- **JSDoc**: All public APIs must have complete JSDoc
- **Examples**: Include `@example` for complex functions
- **Errors**: Document thrown errors with `@throws`

## Exchange Adapters

### Common Interface (`IExchangeAdapter`)
Every adapter must implement:
- Market data methods: `fetchMarkets`, `fetchOrderBook`, `fetchTrades`, `fetchFundingRate`
- Trading methods: `createOrder`, `cancelOrder`, `fetchPositions`
- WebSocket methods: `watchOrderBook`, `watchPositions`, `watchOrders`

### Authentication Strategies
- **Hyperliquid**: EIP-712 signing (chain ID 1337 for trading, 42161 for account ops)
- **Paradex**: StarkNet ECDSA + JWT tokens (5-min expiry)
- **Backpack**: ED25519 signatures (not secp256k1)
- **GRVT**: API key + session cookie + EIP-712
- **Lighter**: API key with configurable expiration
- **EdgeX**: ECDSA + Pedersen hash (StarkEx)
- **Nado**: EIP-712 on Ink L2 (Kraken)
- **Variational**: HMAC-SHA256 API key
- **Extended**: API key header
- **dYdX**: Cosmos SDK secp256k1 signing
- **Jupiter**: Solana wallet ed25519
- **Drift**: Solana wallet ed25519
- **GMX**: EVM wallet (on-chain)
- **Aster**: HMAC-SHA256 (Binance-compatible)
- **Pacifica**: Ed25519 API key
- **Ostium**: EVM private key (ethers.js)

### Rate Limiting
- **Hyperliquid**: 1200 weight/min
- **Lighter**: Tiered (60-4000 req/min)
- **GRVT**: Per 10-second windows
- **Paradex**: 1500 req/min per IP

## WebSocket Management

### Connection States
```typescript
type ConnectionState = 'connecting' | 'connected' | 'disconnecting' | 'disconnected';
```

### Reconnection Strategy
- Exponential backoff with jitter
- Max 10 retry attempts
- Backoff cap: 30 seconds
- Automatic resubscription after reconnect

### Subscription Patterns
- **Hyperliquid**: `{ method: "subscribe", subscription: {...} }`
- **GRVT/Paradex**: JSON-RPC 2.0 format
- **Backpack**: `{ method: "SUBSCRIBE", params: [...] }`

## Testing Strategy

### Test Structure
```
tests/
├── unit/           # Pure functions, no I/O
├── integration/    # Mock adapters, no network
├── e2e/            # Real testnet connections
└── fixtures/       # Mock API responses
```

### TDD Workflow
1. Write test first (must fail)
2. Implement minimal code to pass
3. Refactor while keeping tests green
4. No mocking in unit tests for domain logic

### Coverage Targets
- Current: 82.25% statements, 87.02% functions (threshold: 72%/78%)
- Critical paths (auth, WebSocket reconnection): 100%

## Error Handling

### Error Hierarchy
```typescript
PerpDEXError
├── TradingError
│   ├── InsufficientMarginError
│   ├── OrderNotFoundError
│   └── InvalidOrderError
├── NetworkError
│   ├── RateLimitError
│   └── ExchangeUnavailableError
└── AuthError
    ├── InvalidSignatureError
    └── ExpiredAuthError
```

### Error Handling Pattern
- Catch exchange-specific errors
- Map to unified error types
- Preserve original error in `originalError` field
- Include exchange identifier in error context

## Symbol Normalization

### CCXT Notation
Use format: `BASE/QUOTE:SETTLE`

Examples:
- Bitcoin perpetual: `BTC/USDT:USDT`
- Ethereum perpetual: `ETH/USDC:USDC`

### Exchange-Specific Mappings
- **Hyperliquid**: `BTC-PERP` → `BTC/USDT:USDT`
- **Backpack**: `BTCUSDT_PERP` → `BTC/USDT:USDT`

## Development Workflow

### Phase Sequence
1. **Foundation**: Project structure, configs (this phase)
2. **Type System**: Core interfaces and types
3. **WebSocket**: Connection management infrastructure
4. **Adapters**: Exchange implementations (Hyperliquid first)
5. **Testing**: Comprehensive test suites
6. **Documentation**: README, API docs, guides

### Quality Checkpoints
- TypeScript compilation: Zero errors
- ESLint: Zero warnings
- Prettier: Auto-formatted
- Tests: 6092 passing, 82% coverage, 56/96 live API methods verified
- No hardcoded credentials
- No exposed secrets in errors

## Critical Implementation Notes

### Security Considerations
- Never log private keys or API secrets
- Use environment variables for credentials
- Implement rate limiting to prevent API bans
- Validate all external API responses with Zod

### Performance Optimization
- Connection pooling for WebSocket
- Response caching with TTL where appropriate
- Batch operations when exchange supports it
- Lazy initialization of adapters

### HIP-3 Ecosystem
All Hyperliquid HIP-3 DEXs (trade.xyz, Ventuals, Based, etc.) use identical API.
Markets distinguished by `dex` field in `meta` response.
Single Hyperliquid adapter = 7+ DEXs supported automatically.

## Common Patterns

### Async Generators for Streaming
```typescript
async function* watchOrderBook(symbol: string): AsyncGenerator<OrderBook> {
  for await (const update of this.wsManager.subscribe(channel)) {
    yield this.normalizeOrderBook(update);
  }
}
```

### Zod Validation
```typescript
const response = ResponseSchema.parse(data); // Throws on validation error
```

### Error Mapping
```typescript
try {
  await exchange.createOrder(...);
} catch (error) {
  throw this.mapError(error);
}
```

## Dependencies

### Core
- `ethers`: EIP-712 signing, wallet management
- `ws`: WebSocket client
- `zod`: Runtime type validation
- `eventemitter3`: Event-driven architecture

### Development
- `typescript`: Latest stable (5.6+)
- `jest`: Testing framework
- `eslint` + `prettier`: Code quality

## File Naming Conventions
- Source files: `PascalCase.ts` for classes, `camelCase.ts` for utilities
- Test files: `*.test.ts`
- Type definitions: `types.ts` or `*.types.ts`
- Constants: `constants.ts`

## Import Order
1. External libraries (node_modules)
2. Internal absolute imports (@/)
3. Relative imports (../, ./)
4. Type imports (grouped separately)

```typescript
import { ethers } from 'ethers';
import WebSocket from 'ws';

import { IExchangeAdapter } from '../types/adapter.js';
import { normalizeSymbol } from '../utils/normalize.js';

import type { Order, Position } from '../types/common.js';
```
