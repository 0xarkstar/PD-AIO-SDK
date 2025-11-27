# Exchange Adapter Development Guidelines

## Adapter Structure

Every exchange adapter must:

1. Extend `BaseAdapter` abstract class
2. Implement `IExchangeAdapter` interface
3. Define capability flags in `has` property
4. Provide exchange-specific authentication
5. Normalize all responses to unified types

## File Organization

```
src/adapters/[exchange-name]/
├── [ExchangeName]Adapter.ts    # Main adapter implementation
├── [ExchangeName]Auth.ts       # Authentication strategy
├── types.ts                     # Exchange-specific types
├── constants.ts                 # Endpoints, mappings
└── utils.ts                     # Helper functions
```

## Implementation Checklist

### 1. Capability Declaration

```typescript
class HyperliquidAdapter extends BaseAdapter {
  readonly has = {
    // Market Data
    fetchMarkets: true,
    fetchOrderBook: true,
    fetchTrades: true,
    fetchFundingRate: true,

    // Trading
    createOrder: true,
    cancelOrder: true,
    createBatchOrders: true,    // If supported

    // Positions
    fetchPositions: true,
    setLeverage: true,

    // WebSocket
    watchOrderBook: true,
    watchTrades: true,
    watchPositions: true,
  } as const;
}
```

### 2. Authentication Implementation

Create a separate auth strategy class:

```typescript
// hyperliquid/HyperliquidAuth.ts
export class HyperliquidAuth implements IAuthStrategy {
  constructor(private wallet: Wallet) {}

  async sign(request: RequestParams): Promise<AuthenticatedRequest> {
    // Exchange-specific signing logic
    const signature = await this.signL1Action(request);
    return { ...request, signature };
  }

  getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }
}
```

### 3. Response Normalization

Always normalize exchange responses to unified types:

```typescript
private normalizeOrder(exchangeOrder: HyperliquidOrder): Order {
  return {
    id: exchangeOrder.oid.toString(),
    symbol: this.normalizeSymbol(exchangeOrder.coin),
    type: exchangeOrder.orderType === 'Limit' ? 'limit' : 'market',
    side: exchangeOrder.side === 'B' ? 'buy' : 'sell',
    amount: parseFloat(exchangeOrder.sz),
    price: exchangeOrder.limitPx ? parseFloat(exchangeOrder.limitPx) : undefined,
    status: this.normalizeOrderStatus(exchangeOrder.status),
    timestamp: exchangeOrder.timestamp,
  };
}
```

### 4. Error Mapping

Map exchange-specific errors to unified hierarchy:

```typescript
private mapError(error: unknown): PerpDEXError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('insufficient margin')) {
      return new InsufficientMarginError(
        error.message,
        'INSUFFICIENT_MARGIN',
        'hyperliquid',
        error
      );
    }

    if (message.includes('invalid signature')) {
      return new InvalidSignatureError(
        error.message,
        'INVALID_SIGNATURE',
        'hyperliquid',
        error
      );
    }
  }

  return new ExchangeUnavailableError(
    'Unknown exchange error',
    'UNKNOWN_ERROR',
    'hyperliquid',
    error
  );
}
```

### 5. Rate Limiting

Implement exchange-specific rate limiting:

```typescript
class HyperliquidAdapter extends BaseAdapter {
  private rateLimiter = new RateLimiter({
    maxRequests: 1200,
    windowMs: 60000,  // 1 minute
    weights: {
      'fetchMarkets': 1,
      'fetchOrderBook': 2,
      'createOrder': 5,
      'createBatchOrders': 20,
    }
  });

  async fetchMarkets(): Promise<Market[]> {
    await this.rateLimiter.acquire('fetchMarkets');
    // ... implementation
  }
}
```

### 6. WebSocket Integration

Use the shared WebSocket manager:

```typescript
async *watchOrderBook(symbol: string): AsyncGenerator<OrderBook> {
  const channel = this.getOrderBookChannel(symbol);

  for await (const message of this.wsManager.subscribe(channel)) {
    if (this.isOrderBookUpdate(message)) {
      yield this.normalizeOrderBook(message);
    }
  }
}

private getOrderBookChannel(symbol: string): string {
  return `orderbook.${this.symbolToExchange(symbol)}`;
}
```

### 7. Symbol Conversion

Implement bidirectional symbol conversion:

```typescript
// Unified -> Exchange
private symbolToExchange(symbol: string): string {
  // "BTC/USDT:USDT" -> "BTC-PERP"
  const [base] = symbol.split('/');
  return `${base}-PERP`;
}

// Exchange -> Unified
private normalizeSymbol(exchangeSymbol: string): string {
  // "BTC-PERP" -> "BTC/USDT:USDT"
  const base = exchangeSymbol.replace('-PERP', '');
  return `${base}/USDT:USDT`;
}
```

## Testing Requirements

### Unit Tests

Test each normalization function:

```typescript
describe('HyperliquidAdapter', () => {
  describe('normalizeOrder', () => {
    it('should convert exchange order to unified format', () => {
      const exchangeOrder = {
        oid: 12345,
        coin: 'BTC-PERP',
        side: 'B',
        sz: '0.5',
        limitPx: '50000',
        orderType: 'Limit',
        status: 'open',
        timestamp: 1234567890,
      };

      const result = adapter.normalizeOrder(exchangeOrder);

      expect(result).toEqual({
        id: '12345',
        symbol: 'BTC/USDT:USDT',
        type: 'limit',
        side: 'buy',
        amount: 0.5,
        price: 50000,
        status: 'open',
        timestamp: 1234567890,
      });
    });
  });
});
```

### Integration Tests

Use mock responses:

```typescript
describe('HyperliquidAdapter Integration', () => {
  it('should fetch markets from API', async () => {
    // Use fixtures instead of live API
    const mockResponse = loadFixture('hyperliquid/markets.json');

    jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => mockResponse,
    } as Response);

    const markets = await adapter.fetchMarkets();
    expect(markets).toHaveLength(50);
  });
});
```

## Common Pitfalls

### ❌ Don't hardcode credentials

```typescript
// BAD
const API_KEY = 'sk_live_...';

// GOOD
const API_KEY = process.env.HYPERLIQUID_API_KEY;
if (!API_KEY) {
  throw new Error('HYPERLIQUID_API_KEY environment variable required');
}
```

### ❌ Don't skip validation

```typescript
// BAD
const order = await response.json();
return order;

// GOOD
const data = await response.json();
const order = OrderResponseSchema.parse(data);
return this.normalizeOrder(order);
```

### ❌ Don't swallow errors

```typescript
// BAD
try {
  await exchange.createOrder(...);
} catch (error) {
  console.error('Error:', error);
  return null;  // Silent failure
}

// GOOD
try {
  await exchange.createOrder(...);
} catch (error) {
  throw this.mapError(error);  // Propagate typed error
}
```

### ❌ Don't block on WebSocket

```typescript
// BAD - blocks forever
async function watchOrders() {
  while (true) {
    const update = await this.wsManager.waitForMessage();
    // ...
  }
}

// GOOD - async generator
async function* watchOrders(): AsyncGenerator<Order[]> {
  for await (const message of this.wsManager.subscribe('orders')) {
    yield this.normalizeOrders(message);
  }
}
```

## Performance Considerations

1. **Connection Pooling**: Reuse WebSocket connections across subscriptions
2. **Batch Operations**: Use batch APIs when available
3. **Caching**: Cache market metadata that doesn't change frequently
4. **Lazy Initialization**: Don't connect until first API call

```typescript
class HyperliquidAdapter extends BaseAdapter {
  private _ws?: WebSocketManager;

  private get ws(): WebSocketManager {
    if (!this._ws) {
      this._ws = new WebSocketManager(this.wsUrl, this.auth);
    }
    return this._ws;
  }
}
```

## Documentation

Every adapter should have:

1. Exchange-specific guide in `docs/exchange-guides/[exchange].md`
2. Authentication setup instructions
3. Rate limit documentation
4. Known limitations and quirks
5. Example code snippets

## Checklist Before PR

- [ ] Implements all required methods from `IExchangeAdapter`
- [ ] Has complete `has` capability declaration
- [ ] Includes authentication strategy
- [ ] Normalizes all responses to unified types
- [ ] Maps errors to unified hierarchy
- [ ] Implements rate limiting
- [ ] Has unit tests with >80% coverage
- [ ] Has integration tests with mock responses
- [ ] Includes JSDoc for all public methods
- [ ] No hardcoded credentials
- [ ] Symbol conversion is bidirectional
- [ ] WebSocket auto-reconnection works
