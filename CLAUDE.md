# Perp DEX SDK Project Context

## Project Overview
Unified TypeScript SDK for decentralized perpetual exchanges. Supports 7+ platforms: Hyperliquid (+ HIP-3 ecosystem), Lighter, GRVT, Paradex, EdgeX, Backpack.

## Architecture

### Hexagonal Architecture Pattern
- **Core Domain**: Pure business logic, no external dependencies
- **Adapters Layer**: Exchange-specific implementations
- **Infrastructure**: WebSocket, rate limiting, authentication

### Key Design Principles
1. **Adapter Pattern**: Each exchange implements `IExchangeAdapter` interface
2. **Feature Detection**: Capability-based runtime checks (CCXT style)
3. **Error Normalization**: Platform-specific errors mapped to unified hierarchy
4. **Type Safety**: Zod runtime validation + TypeScript strict mode

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
- Minimum: 80% across branches/functions/lines/statements
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
- Tests: All passing, >80% coverage
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
