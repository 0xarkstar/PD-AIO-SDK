# Unified Async SDK Framework for Perpetual DEXs: Architecture & Implementation Guide

Building a unified trading SDK for decentralized perpetual exchanges requires abstracting seven distinct protocols—Hyperliquid, Lighter, GRVT, Paradex, EdgeX, Backpack, and Hyperliquid engine-based DEXs—into a single developer-friendly interface. This report provides the technical foundation for creating such a framework, drawing from CCXT's battle-tested architecture and modern SDK design patterns.

## Executive summary: The Perp DEX landscape consolidates around three technical paradigms

The seven target DEXs cluster into **three distinct architectural families**: Hyperliquid's native L1 with EIP-712 signing (covering HIP-3 DEXs like trade.xyz and Ventuals), StarkNet/StarkEx-based platforms (Paradex and EdgeX), and custom implementations (Lighter, GRVT, Backpack). A unified SDK must abstract these differences while preserving the unique capabilities each platform offers—from **200k orders/second** on Hyperliquid to **sub-10ms matching** on EdgeX.

The recommended architecture follows CCXT's adapter pattern with TypeScript as the source of truth, transpiled to Python. Each exchange implements a standard interface with exchange-specific signing, normalization, and WebSocket handling. The framework should support **feature detection** (not all DEXs offer all features), **error normalization** (mapping platform-specific errors to unified types), and **resilient connections** (exponential backoff, circuit breakers).

---

## Comprehensive DEX SDK/API comparison

| Platform | Official SDKs | API Type | Authentication | Async Support | Rate Limits | WebSocket Model |
|----------|--------------|----------|----------------|---------------|-------------|-----------------|
| **Hyperliquid** | Python (official), TS (community @nktkas) | REST + WS | EIP-712 + phantom agent | Full async | 1200 weight/min | Subscription-based |
| **Lighter** | Python, Go | REST + WS | API key signing, sub-accounts | Full asyncio | 60-4000 req/min (tiered) | 100 sessions, 1000 subs |
| **GRVT** | Python, TS, JS (all official) | REST + WS + JSON-RPC | API key + session cookie + EIP-712 | Sync + async | Tier-based per 10s | JSON-RPC streams |
| **Paradex** | Python, TS (official) | REST + WS JSON-RPC | JWT + StarkNet ECDSA | Full async | 1500 req/min per IP | Channel subscriptions |
| **EdgeX** | None (REST/WS only) | REST + WS | ECDSA + Pedersen hash | N/A | Undocumented (beta) | Standard WS |
| **Backpack** | Rust (official), Python (community) | REST + WS | ED25519 signing | Full async | Undocumented | Stream-based |
| **HIP-3 DEXs** | Same as Hyperliquid | Same as Hyperliquid | Same as Hyperliquid | Same | Same | Same |

### Detailed SDK availability matrix

| Platform | Python | TypeScript | Rust | Go | CCXT Support |
|----------|--------|------------|------|-----|--------------|
| Hyperliquid | ✅ Official | ✅ Community (@nktkas) | ⚠️ Unmaintained | ✅ Community | ✅ Yes |
| Lighter | ✅ Official | ❌ Community only | ❌ | ✅ Official | ❌ Pending |
| GRVT | ✅ Official | ✅ Official | ❌ | ❌ | ✅ Built-in |
| Paradex | ✅ Official | ✅ Official | ❌ | ✅ Samples | ✅ Yes |
| EdgeX | ❌ | ❌ | ❌ | ❌ | ❌ |
| Backpack | ✅ Community | ✅ Community | ✅ Official | ✅ Community | ❌ |

---

## Authentication mechanisms across platforms differ significantly

Each DEX employs a distinct authentication approach, requiring the unified SDK to abstract signing into pluggable strategies.

**Hyperliquid** uses a dual signing scheme: L1 actions (trading) employ `sign_l1_action` with a phantom agent mechanism and chain ID 1337, while user-signed actions (account operations) use standard EIP-712 with Arbitrum chain ID 42161. The platform supports API wallets that cannot withdraw funds—a security feature enabling delegation.

**Paradex** operates on StarkNet, requiring Pedersen hash computation and StarkNet curve ECDSA signatures. Authentication involves JWT tokens with 5-minute expiration and optional "readonly tokens" for monitoring. The SDK must handle both L1+L2 authentication (for onboarding) and L2-only (for trading with subkeys).

**Backpack** uniquely uses **ED25519 signatures** (not HMAC-SHA256 or secp256k1), with instruction-prefixed signing strings. The signature format requires alphabetically sorted parameters appended with timestamp and window values—a pattern distinct from other platforms.

**GRVT** combines API key authentication with session cookies and EIP-712 order signing, featuring a two-tier account structure (Funding Account → Trading Sub-accounts) similar to centralized exchange systems.

**Lighter** supports up to 256 API keys per sub-account with auth tokens that have configurable expiration, using ZK-SNARK proofs for verifiable order matching.

**EdgeX** uses standard ECDSA for API authentication plus Pedersen hash for L2 operations (limit orders, transfers), operating on StarkEx rather than StarkNet.

### Authentication abstraction pattern

```typescript
interface IAuthStrategy {
  sign(request: RequestParams): Promise<AuthenticatedRequest>;
  getHeaders(): Record<string, string>;
  refresh?(): Promise<void>;
}

class HyperliquidAuth implements IAuthStrategy {
  constructor(private wallet: ethers.Wallet) {}
  async sign(request: RequestParams): Promise<AuthenticatedRequest> {
    const signature = await this.signL1Action(request.action, request.nonce);
    return { ...request, signature };
  }
}

class ParadexAuth implements IAuthStrategy {
  private jwt: string;
  async sign(request: RequestParams): Promise<AuthenticatedRequest> {
    const starkSignature = await this.starkSign(request);
    return { ...request, headers: { Authorization: `Bearer ${this.jwt}` }, signature: starkSignature };
  }
}

class BackpackAuth implements IAuthStrategy {
  constructor(private privateKey: ed25519.Ed25519PrivateKey) {}
  async sign(request: RequestParams): Promise<AuthenticatedRequest> {
    const signString = this.buildSignString(request.instruction, request.params);
    const signature = base64.encode(this.privateKey.sign(signString));
    return { ...request, headers: { 'X-Signature': signature } };
  }
}
```

---

## Core functionality mapping reveals common operations with platform-specific implementations

### Order management standardization

All platforms support limit and market orders, but advanced order types vary significantly:

| Order Type | Hyperliquid | Lighter | GRVT | Paradex | EdgeX | Backpack |
|------------|-------------|---------|------|---------|-------|----------|
| Market | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Limit (GTC) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| IOC | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Post-Only (ALO) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reduce-Only | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Stop-Loss/TP | ✅ | ✅ | ✅ (via metadata) | ✅ | ✅ | ✅ |
| TWAP | ✅ | ✅ (30s slicing) | ❌ | ❌ | ❌ | ❌ |
| Multi-leg | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| FOK | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |

### Position and margin features

| Feature | Hyperliquid | Lighter | GRVT | Paradex | EdgeX | Backpack |
|---------|-------------|---------|------|---------|-------|----------|
| Cross Margin | ✅ | ✅ | ✅ | ✅ | ✅ (default) | ✅ (default) |
| Isolated Margin | ✅ (HIP-3 only) | ✅ | ✅ | ✅ | Via sub-accounts | Via sub-accounts |
| Max Leverage | 50x | 50x (BTC/ETH) | Varies | Varies | 100x | Configurable |
| Portfolio Margin | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |

### Market data standardization

The unified SDK should normalize these data structures:

```typescript
interface UnifiedOrderBook {
  symbol: string;
  timestamp: number;
  bids: [price: number, size: number][];
  asks: [price: number, size: number][];
  // Platform-specific data preserved in metadata
  metadata?: {
    checksum?: string;      // For delta verification
    sequenceId?: number;    // For ordering
    source: string;         // Exchange identifier
  };
}

interface UnifiedFundingRate {
  symbol: string;
  fundingRate: number;
  fundingTimestamp: number;
  nextFundingTimestamp: number;
  markPrice: number;
  indexPrice: number;
  // Intervals vary: Hyperliquid (8h), Backpack (1h), others (8h)
  fundingIntervalHours: number;
}

interface UnifiedPosition {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  leverage: number;
  marginMode: 'cross' | 'isolated';
  margin: number;
}
```

---

## HIP-3 ecosystem extends Hyperliquid's API to specialized markets

Hyperliquid's HIP-3 protocol creates a "exchange-of-exchanges" where builders stake **500,000 HYPE** (~$16.3M) to deploy perpetual markets. These DEXs inherit Hyperliquid's infrastructure while offering specialized products:

| HIP-3 DEX | Specialization | Status |
|-----------|---------------|--------|
| **trade.xyz (Hyperunit)** | US Stock Perps (NVDA, TSLA, AAPL) | Live - first HIP-3 deployment |
| **Ventuals** | Pre-IPO Perps (SpaceX, OpenAI, Anthropic) | Live |
| **Based** | Trading Super App (Ethena Labs backed) | Live |
| **Volmex** | Volatility Indices (BVIV, EVIV) | Announced |
| **Nunchi** | Yield/APY Perpetuals | Announced |
| **Aura** | US Treasury Perps | Announced |

**Critical insight for SDK design**: All HIP-3 markets use the **identical Hyperliquid API**. Markets appear in the `meta` response with a `dex` field identifying the deployer. A unified SDK automatically supports the entire HIP-3 ecosystem by implementing Hyperliquid once.

---

## Recommended architecture follows CCXT patterns with DEX-specific adaptations

### High-level architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        User Application                              │
├─────────────────────────────────────────────────────────────────────┤
│                      Unified Perp DEX SDK                            │
│  ┌─────────────────┬──────────────────┬──────────────────────────┐  │
│  │   Public API    │   Private API    │     WebSocket API        │  │
│  │  fetchMarkets   │  createOrder     │  watchOrderBook          │  │
│  │  fetchOrderBook │  cancelOrder     │  watchPositions          │  │
│  │  fetchFundingRate│ fetchPositions  │  watchFundingRate        │  │
│  └─────────────────┴──────────────────┴──────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│                    Normalization Layer                               │
│   Symbol Mapping │ Response Parsing │ Error Normalization            │
├─────────────────────────────────────────────────────────────────────┤
│                    Exchange Adapters                                 │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┬────────┐  │
│  │Hyperliquid│ Lighter │   GRVT   │ Paradex  │  EdgeX   │Backpack│  │
│  │  + HIP-3  │         │          │          │          │        │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┴────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                              │
│  Auth Strategies │ Rate Limiter │ WebSocket Manager │ Circuit Breaker│
└─────────────────────────────────────────────────────────────────────┘
```

### Feature detection pattern (from CCXT)

Each adapter declares supported capabilities:

```typescript
class HyperliquidAdapter extends BaseAdapter {
  has = {
    // Market Data
    fetchMarkets: true,
    fetchOrderBook: true,
    fetchTrades: true,
    fetchFundingRate: true,
    fetchFundingRateHistory: true,
    
    // Trading
    createOrder: true,
    cancelOrder: true,
    createBatchOrders: true,
    cancelBatchOrders: true,
    
    // Positions
    fetchPositions: true,
    setLeverage: true,
    setMarginMode: 'emulated',  // Via sub-accounts for HIP-3
    
    // WebSocket
    watchOrderBook: true,
    watchTrades: true,
    watchPositions: true,
    watchFundingRate: true,
    
    // Advanced
    twapOrders: true,
    vaultTrading: true,
  };
}
```

### Unified interface contract

```typescript
interface IUnifiedPerpDEX {
  // Configuration
  readonly exchange: string;
  readonly has: FeatureMap;
  
  // Market Data (Public)
  fetchMarkets(params?: MarketParams): Promise<Market[]>;
  fetchTicker(symbol: string): Promise<Ticker>;
  fetchOrderBook(symbol: string, limit?: number): Promise<OrderBook>;
  fetchTrades(symbol: string, limit?: number): Promise<Trade[]>;
  fetchFundingRate(symbol: string): Promise<FundingRate>;
  fetchFundingRateHistory(symbol: string, since?: number): Promise<FundingRate[]>;
  
  // Trading (Private)
  createOrder(symbol: string, type: OrderType, side: OrderSide, 
              amount: number, price?: number, params?: OrderParams): Promise<Order>;
  cancelOrder(id: string, symbol: string): Promise<Order>;
  createBatchOrders(orders: OrderRequest[]): Promise<Order[]>;
  cancelAllOrders(symbol?: string): Promise<Order[]>;
  
  // Positions
  fetchPositions(symbols?: string[]): Promise<Position[]>;
  fetchBalance(): Promise<Balance>;
  setLeverage(symbol: string, leverage: number): Promise<void>;
  
  // WebSocket
  watchOrderBook(symbol: string): AsyncGenerator<OrderBook>;
  watchTrades(symbol: string): AsyncGenerator<Trade>;
  watchPositions(): AsyncGenerator<Position[]>;
  watchOrders(): AsyncGenerator<Order[]>;
}
```

---

## WebSocket management requires robust reconnection and subscription handling

### Connection manager architecture

```typescript
class WebSocketManager {
  private connections = new Map<string, WebSocketClient>();
  private subscriptions = new Map<string, Set<string>>();
  private reconnectAttempts = new Map<string, number>();
  
  async subscribe(channel: string, callback: (data: any) => void): Promise<void> {
    const wsId = this.getConnectionId(channel);
    let ws = this.connections.get(wsId);
    
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      ws = await this.createConnection(wsId);
    }
    
    this.addSubscription(wsId, channel, callback);
    await this.sendSubscription(ws, channel);
  }
  
  private async createConnection(id: string): Promise<WebSocketClient> {
    const ws = new WebSocketClient(this.getUrl(id), {
      onOpen: () => this.handleOpen(id),
      onClose: () => this.handleClose(id),
      onError: (err) => this.handleError(id, err),
      onMessage: (msg) => this.routeMessage(id, msg),
    });
    
    await ws.connect();
    this.connections.set(id, ws);
    return ws;
  }
  
  private async handleClose(id: string): Promise<void> {
    const attempt = (this.reconnectAttempts.get(id) || 0) + 1;
    this.reconnectAttempts.set(id, attempt);
    
    if (attempt > 10) {
      this.emit('maxRetriesExceeded', { connectionId: id });
      return;
    }
    
    // Exponential backoff with jitter
    const delay = Math.min(500 * Math.pow(2, attempt) + Math.random() * 1000, 30000);
    await sleep(delay);
    
    const ws = await this.createConnection(id);
    await this.resubscribeAll(id, ws);
  }
}
```

### Platform-specific WebSocket patterns

| Platform | Format | Subscription Method | Heartbeat |
|----------|--------|---------------------|-----------|
| Hyperliquid | JSON | `{ method: "subscribe", subscription: {...} }` | None documented |
| Lighter | Standard WS | Direct subscription | None documented |
| GRVT | JSON-RPC 2.0 | `{ jsonrpc: "2.0", method: "subscribe", params: {...} }` | Stream-based |
| Paradex | JSON-RPC 2.0 | Channel-based | 55s ping/pong |
| Backpack | JSON | `{ method: "SUBSCRIBE", params: [...] }` | 60s ping, 120s timeout |
| EdgeX | Standard WS | Undocumented | Undocumented |

---

## Error handling requires normalization across diverse error formats

### Unified error hierarchy

```typescript
class PerpDEXError extends Error {
  constructor(
    message: string,
    public code: string,
    public exchange: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'PerpDEXError';
  }
}

// Trading errors
class InsufficientMarginError extends PerpDEXError {}
class OrderNotFoundError extends PerpDEXError {}
class InvalidOrderError extends PerpDEXError {}
class PositionNotFoundError extends PerpDEXError {}

// Network errors
class RateLimitError extends PerpDEXError {}
class ExchangeUnavailableError extends PerpDEXError {}
class WebSocketDisconnectedError extends PerpDEXError {}

// Authentication errors
class InvalidSignatureError extends PerpDEXError {}
class ExpiredAuthError extends PerpDEXError {}
class InsufficientPermissionsError extends PerpDEXError {}

// DEX-specific errors
class TransactionFailedError extends PerpDEXError {}
class SlippageExceededError extends PerpDEXError {}
class LiquidationError extends PerpDEXError {}
```

### Error mapping per exchange

```typescript
const ERROR_MAPPINGS = {
  hyperliquid: {
    'Insufficient margin': InsufficientMarginError,
    'Invalid signature': InvalidSignatureError,
    'Order would immediately match': InvalidOrderError,
  },
  paradex: {
    'INSUFFICIENT_BALANCE': InsufficientMarginError,
    'ORDER_NOT_FOUND': OrderNotFoundError,
    'SIGNATURE_INVALID': InvalidSignatureError,
  },
  backpack: {
    'ACCOUNT_LIQUIDATING': LiquidationError,
    // HTTP 429 -> RateLimitError
  },
  grvt: {
    1000: InvalidSignatureError,  // Auth required
    1002: ExchangeUnavailableError,  // Internal error
  },
};
```

---

## Type safety with Zod ensures runtime validation

```typescript
import { z } from 'zod';

// Order request schema
const OrderRequestSchema = z.object({
  symbol: z.string().min(1),
  type: z.enum(['market', 'limit', 'stopLimit', 'stopMarket']),
  side: z.enum(['buy', 'sell']),
  amount: z.number().positive(),
  price: z.number().positive().optional(),
  stopPrice: z.number().positive().optional(),
  reduceOnly: z.boolean().default(false),
  postOnly: z.boolean().default(false),
  clientOrderId: z.string().optional(),
  leverage: z.number().int().min(1).max(100).optional(),
}).refine(
  (data) => data.type === 'market' || data.price !== undefined,
  { message: 'Limit orders require a price' }
);

type OrderRequest = z.infer<typeof OrderRequestSchema>;

// Response validation
const HyperliquidOrderResponseSchema = z.object({
  status: z.literal('ok'),
  response: z.object({
    type: z.literal('order'),
    data: z.object({
      statuses: z.array(z.union([
        z.object({ resting: z.object({ oid: z.number() }) }),
        z.object({ filled: z.object({ totalSz: z.string(), avgPx: z.string(), oid: z.number() }) }),
        z.object({ error: z.string() }),
      ])),
    }),
  }),
});
```

---

## Implementation roadmap prioritizes high-value exchanges first

### Phase 1: Core foundation (Weeks 1-3)

- Define unified interfaces (IUnifiedPerpDEX, all data types)
- Implement base adapter class with common functionality
- Create authentication strategy interface with implementations for:
  - EIP-712 (Hyperliquid, GRVT)
  - StarkNet ECDSA (Paradex)
  - ED25519 (Backpack)
- Set up Zod schemas for all request/response types
- Establish error hierarchy and normalization layer

### Phase 2: Hyperliquid implementation (Weeks 3-5)

Hyperliquid provides the highest ROI due to HIP-3 ecosystem coverage:
- Implement REST adapter (info + exchange endpoints)
- Add WebSocket support with subscription management
- Test against mainnet and testnet
- Validate HIP-3 market compatibility

### Phase 3: Additional exchanges (Weeks 5-10)

Prioritized by SDK availability and documentation quality:
1. **GRVT** (Week 5-6): Official SDK with CCXT compatibility
2. **Paradex** (Week 6-7): Official Python/TS SDKs, comprehensive docs
3. **Lighter** (Week 7-8): Official Python SDK, zero fees for standard accounts
4. **Backpack** (Week 8-9): Community SDKs, unique ED25519 signing
5. **EdgeX** (Week 9-10): No SDK, requires full implementation from API docs

### Phase 4: Resilience and DX (Weeks 10-12)

- Implement circuit breaker pattern (using `cockatiel` or `opossum`)
- Add request batching for supported exchanges
- Implement market data caching with configurable TTL
- Create comprehensive documentation with examples
- Add logging with configurable verbosity

### Phase 5: Testing and optimization (Weeks 12-14)

- Unit tests with mocked responses for each exchange
- Integration tests against testnets
- Performance profiling and optimization
- Property-based testing for normalization functions

---

## Potential challenges and mitigation strategies

### Challenge 1: Diverse signing requirements
**Problem**: Each platform uses different cryptographic primitives (secp256k1, StarkNet curve, ED25519).
**Solution**: Abstract signing into pluggable strategies with clear interfaces. Use battle-tested libraries: `ethers.js` for EIP-712, `starknet.js` for StarkNet, `@noble/ed25519` for Backpack.

### Challenge 2: Rate limit heterogeneity
**Problem**: Rate limits vary from weight-based (Hyperliquid: 1200/min) to tier-based (GRVT: per 10s) to undocumented (EdgeX, Backpack).
**Solution**: Implement adaptive rate limiter that tracks exchange-specific quotas. Default to conservative limits for undocumented exchanges. Use token bucket algorithm with per-endpoint weights.

### Challenge 3: WebSocket reconnection state
**Problem**: After reconnection, subscription state must be restored and any missed data handled.
**Solution**: Maintain subscription registry, implement automatic resubscription on reconnect, use sequence numbers where available (GRVT, Paradex) to detect gaps.

### Challenge 4: Symbol standardization
**Problem**: Same asset has different symbols across exchanges (e.g., `BTC-PERP`, `BTC/USDT:USDT`, `BTCUSDT_PERP`).
**Solution**: Create symbol mapping middleware with bidirectional conversion. Use CCXT's notation: `BASE/QUOTE:SETTLE` for perpetuals.

### Challenge 5: EdgeX beta status
**Problem**: EdgeX API is in beta with limited documentation and no SDK.
**Solution**: Implement EdgeX adapter last, design for easy updates as API stabilizes. Consider community contribution for maintenance.

---

## Code structure recommendation

```
perp-dex-sdk/
├── src/
│   ├── index.ts                    # Public exports
│   ├── types/
│   │   ├── common.ts               # Unified types (Order, Position, etc.)
│   │   ├── schemas.ts              # Zod schemas
│   │   └── errors.ts               # Error classes
│   ├── base/
│   │   ├── BaseAdapter.ts          # Abstract base class
│   │   ├── AuthStrategy.ts         # Auth interface + implementations
│   │   ├── WebSocketManager.ts     # Connection management
│   │   ├── RateLimiter.ts          # Token bucket implementation
│   │   └── CircuitBreaker.ts       # Fault tolerance
│   ├── exchanges/
│   │   ├── hyperliquid/
│   │   │   ├── HyperliquidAdapter.ts
│   │   │   ├── HyperliquidAuth.ts
│   │   │   ├── types.ts            # Exchange-specific types
│   │   │   └── constants.ts        # Endpoints, asset mappings
│   │   ├── lighter/
│   │   ├── grvt/
│   │   ├── paradex/
│   │   ├── edgex/
│   │   └── backpack/
│   ├── utils/
│   │   ├── crypto.ts               # Signing utilities
│   │   ├── normalize.ts            # Symbol/response normalization
│   │   └── time.ts                 # Timestamp handling
│   └── factory.ts                  # Exchange factory
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/                   # Mock responses
├── examples/
│   ├── basic-trading.ts
│   ├── websocket-streaming.ts
│   └── multi-exchange-arbitrage.ts
└── docs/
    ├── getting-started.md
    ├── api-reference/
    └── exchange-guides/
```

---

## Conclusion: A unified SDK unlocks the Perp DEX ecosystem

The perpetual DEX landscape presents significant fragmentation—seven platforms with three distinct authentication paradigms, varying feature sets, and inconsistent API designs. A well-architected unified SDK transforms this complexity into a consistent developer experience.

The recommended approach follows CCXT's proven patterns: TypeScript as source of truth, adapter pattern for exchange abstraction, feature detection for capability handling, and comprehensive error normalization. Starting with Hyperliquid (covering 7+ HIP-3 DEXs) provides immediate ecosystem breadth, while the modular architecture enables incremental addition of other platforms.

Key success factors include robust WebSocket management with automatic reconnection, pluggable authentication strategies, and thorough type safety using Zod. The implementation roadmap spans 14 weeks, prioritizing exchanges with the best SDK support and documentation quality.

The resulting framework will enable developers to build multi-exchange perpetual trading applications—from arbitrage bots to portfolio management systems—without managing the underlying complexity of each protocol.