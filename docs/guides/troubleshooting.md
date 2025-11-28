# Troubleshooting Guide

Comprehensive troubleshooting guide for Perp DEX SDK covering common issues, errors, and solutions.

## Table of Contents

- [Authentication Issues](#authentication-issues)
- [Network and Connectivity](#network-and-connectivity)
- [WebSocket Problems](#websocket-problems)
- [Rate Limiting](#rate-limiting)
- [Order Errors](#order-errors)
- [Position and Margin Issues](#position-and-margin-issues)
- [Development and Testing](#development-and-testing)
- [Performance Optimization](#performance-optimization)
- [Debugging Tips](#debugging-tips)

## Authentication Issues

### InvalidSignatureError

**Symptom**: `InvalidSignatureError: invalid signature` or `AuthError: authentication failed`

**Common Causes**:
1. Wrong private key or API credentials
2. Using testnet credentials on mainnet (or vice versa)
3. Wallet never used on the exchange before
4. Clock skew between local machine and exchange servers

**Solutions**:

```typescript
// 1. Verify your credentials
import { Wallet } from 'ethers';

const wallet = new Wallet(process.env.PRIVATE_KEY);
console.log('Wallet address:', wallet.address);

// Ensure this address matches your exchange account
```

```typescript
// 2. Check network configuration
const exchange = createExchange('hyperliquid', {
  wallet,
  testnet: true,  // Make sure this matches your credentials
});

// For testnet, use testnet wallet
// For mainnet, use mainnet wallet
```

```typescript
// 3. First-time wallet setup
// Some exchanges require a wallet to have transaction history
// before API trading is enabled. Make a small deposit/withdrawal
// from the exchange UI first.
```

```typescript
// 4. Check system time
// Ensure your system clock is synchronized
console.log('System time:', new Date().toISOString());

// If time is off by more than a few seconds, signatures may be rejected
// On Linux/Mac: sudo ntpdate -s time.nist.gov
// On Windows: net start w32time && w32tm /resync
```

### ExpiredAuthError

**Symptom**: `ExpiredAuthError: authentication token expired`

**Cause**: Session tokens or signatures have expired

**Solution**:

```typescript
// The SDK handles token refresh automatically
// If you encounter this error, reinitialize the exchange

await exchange.disconnect();
await exchange.initialize();

// For long-running applications, implement periodic reinitialization
setInterval(async () => {
  try {
    await exchange.disconnect();
    await exchange.initialize();
    console.log('Connection refreshed');
  } catch (error) {
    console.error('Refresh failed:', error);
  }
}, 3600000); // Every hour
```

### API Key Issues

**Symptom**: `AuthError: invalid API key`

**Common Issues**:
- API key not activated
- IP whitelist restrictions
- Insufficient permissions
- Key revoked or expired

**Solution**:

```typescript
// 1. Verify API key permissions
// Check exchange UI for:
// - Trading permission enabled
// - IP whitelist (if applicable)
// - Key expiration date

// 2. Test with read-only operations first
try {
  const markets = await exchange.fetchMarkets();
  console.log('✓ API key has read access');
} catch (error) {
  console.error('✗ API key lacks read access');
}

try {
  const balance = await exchange.fetchBalance();
  console.log('✓ API key has account access');
} catch (error) {
  console.error('✗ API key lacks account access');
}

// 3. For IP restrictions, ensure your server IP is whitelisted
```

## Network and Connectivity

### ExchangeUnavailableError

**Symptom**: `ExchangeUnavailableError: exchange is unavailable` or `NetworkError: request failed`

**Common Causes**:
1. Exchange maintenance
2. Network connectivity issues
3. Firewall/proxy blocking
4. DNS resolution failure

**Solutions**:

```typescript
// 1. Check exchange status
// Most exchanges have status pages:
// - Hyperliquid: status.hyperliquid.xyz
// - Check Twitter/Discord for announcements

// 2. Test network connectivity
async function testConnectivity() {
  try {
    const response = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
    });

    if (response.ok) {
      console.log('✓ Exchange API reachable');
    } else {
      console.error('✗ Exchange returned:', response.status);
    }
  } catch (error) {
    console.error('✗ Cannot reach exchange:', error);
  }
}

await testConnectivity();
```

```typescript
// 3. Implement retry logic
async function fetchWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      console.log(`Retry ${i + 1}/${maxRetries} after ${delayMs}ms`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2; // Exponential backoff
    }
  }
  throw new Error('Unreachable');
}

// Usage
const markets = await fetchWithRetry(() => exchange.fetchMarkets());
```

### Timeout Errors

**Symptom**: Requests timing out or taking too long

**Solutions**:

```typescript
// 1. Configure custom timeout
const exchange = createExchange('hyperliquid', {
  wallet,
  timeout: 30000, // 30 seconds (default: 10000)
});

// 2. Use WebSocket for real-time data instead of polling
// ❌ Bad: Polling every second
setInterval(async () => {
  const orderbook = await exchange.fetchOrderBook('BTC/USDT:USDT');
}, 1000);

// ✅ Good: WebSocket streaming
for await (const orderbook of exchange.watchOrderBook('BTC/USDT:USDT')) {
  // Real-time updates
}
```

## WebSocket Problems

### Connection Failures

**Symptom**: `WebSocketError: connection failed` or repeated reconnection attempts

**Solutions**:

```typescript
// 1. Check WebSocket URL accessibility
import WebSocket from 'ws';

function testWebSocket(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const ws = new WebSocket(url);

    ws.on('open', () => {
      console.log('✓ WebSocket connected');
      ws.close();
      resolve(true);
    });

    ws.on('error', (error) => {
      console.error('✗ WebSocket error:', error);
      resolve(false);
    });
  });
}

await testWebSocket('wss://api.hyperliquid.xyz/ws');
```

```typescript
// 2. Configure WebSocket reconnection
const exchange = createExchange('hyperliquid', {
  wallet,
  websocket: {
    maxReconnectAttempts: 10,
    reconnectDelay: 1000,
    maxReconnectDelay: 30000,
  },
});
```

```typescript
// 3. Handle stream interruptions gracefully
async function streamWithErrorHandling() {
  while (true) {
    try {
      for await (const orderbook of exchange.watchOrderBook('BTC/USDT:USDT')) {
        // Process orderbook
        processOrderbook(orderbook);
      }
    } catch (error) {
      console.error('Stream error:', error);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log('Reconnecting...');
    }
  }
}
```

### Subscription Not Receiving Updates

**Symptom**: WebSocket connected but no messages received

**Causes**:
- Invalid symbol format
- Exchange doesn't support the requested channel
- Subscription message malformed

**Solutions**:

```typescript
// 1. Verify symbol format
import { isValidSymbol } from 'perp-dex-sdk';

const symbol = 'BTC/USDT:USDT';
if (!isValidSymbol(symbol)) {
  console.error('Invalid symbol format');
}

// 2. Check feature support
if (!exchange.has.watchOrderBook) {
  console.error('Exchange does not support order book streaming');
}

// 3. Enable debug logging
const exchange = createExchange('hyperliquid', {
  wallet,
  debug: true, // Logs all WebSocket messages
});
```

### Memory Leaks

**Symptom**: Memory usage growing over time with WebSocket streams

**Solutions**:

```typescript
// 1. Always disconnect when done
async function temporaryStream() {
  const exchange = createExchange('hyperliquid', { wallet });
  await exchange.initialize();

  try {
    let count = 0;
    for await (const orderbook of exchange.watchOrderBook('BTC/USDT:USDT')) {
      processOrderbook(orderbook);

      if (++count >= 100) break; // Limit iterations
    }
  } finally {
    await exchange.disconnect(); // Always disconnect
  }
}

// 2. Use AbortController for controlled cancellation
async function streamWithAbort(signal: AbortSignal) {
  for await (const orderbook of exchange.watchOrderBook('BTC/USDT:USDT')) {
    if (signal.aborted) break;
    processOrderbook(orderbook);
  }
}

const controller = new AbortController();
setTimeout(() => controller.abort(), 60000); // Stop after 1 minute
await streamWithAbort(controller.signal);
```

## Rate Limiting

### RateLimitError

**Symptom**: `RateLimitError: rate limit exceeded` or `429 Too Many Requests`

**Causes**:
- Too many requests in short time
- Not accounting for endpoint weights
- Multiple SDK instances sharing same credentials

**Solutions**:

```typescript
// 1. The SDK has built-in rate limiting
// Requests are automatically queued when approaching limits

// 2. Adjust rate limit configuration
const exchange = createExchange('hyperliquid', {
  wallet,
  rateLimit: {
    maxRequests: 1000,    // Lower than exchange limit (safer)
    windowMs: 60000,      // 1 minute
    weights: {
      fetchMarkets: 1,
      fetchOrderBook: 2,
      createOrder: 5,
    },
  },
});

// 3. Use batch operations
// ❌ Bad: Multiple separate requests
await exchange.createOrder({ symbol: 'BTC/USDT:USDT', ... });
await exchange.createOrder({ symbol: 'ETH/USDT:USDT', ... });
await exchange.createOrder({ symbol: 'SOL/USDT:USDT', ... });

// ✅ Good: Single batch request
await exchange.createBatchOrders([
  { symbol: 'BTC/USDT:USDT', ... },
  { symbol: 'ETH/USDT:USDT', ... },
  { symbol: 'SOL/USDT:USDT', ... },
]);

// 4. Prefer WebSocket over REST polling
// ❌ Bad: REST polling
setInterval(async () => {
  await exchange.fetchPositions(); // Costs rate limit weight
}, 1000);

// ✅ Good: WebSocket streaming
for await (const positions of exchange.watchPositions()) {
  // No rate limit impact
}
```

### Distributed Rate Limiting

**Symptom**: Rate limit errors when running multiple bots/services

**Solution**:

```typescript
// 1. Use separate API keys for each service if possible

// 2. Implement shared rate limiter (Redis-based)
import { Redis } from 'ioredis';

class DistributedRateLimiter {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  async acquire(key: string, limit: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Remove old entries
    await this.redis.zremrangebyscore(key, 0, windowStart);

    // Count current requests
    const count = await this.redis.zcard(key);

    if (count < limit) {
      await this.redis.zadd(key, now, `${now}-${Math.random()}`);
      await this.redis.expire(key, Math.ceil(windowMs / 1000));
      return true;
    }

    return false;
  }
}

// Usage
const limiter = new DistributedRateLimiter('redis://localhost:6379');

async function createOrderWithDistributedLimit(order: OrderRequest) {
  while (!(await limiter.acquire('hyperliquid-rate-limit', 1200, 60000))) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return exchange.createOrder(order);
}
```

## Order Errors

### InvalidOrderError

**Symptom**: `InvalidOrderError: invalid order parameters`

**Common Issues**:

```typescript
// 1. Missing required fields
// ❌ Bad: Missing price for limit order
await exchange.createOrder({
  symbol: 'BTC/USDT:USDT',
  type: 'limit',
  side: 'buy',
  amount: 0.1,
  // Missing: price
});

// ✅ Good: All required fields
await exchange.createOrder({
  symbol: 'BTC/USDT:USDT',
  type: 'limit',
  side: 'buy',
  amount: 0.1,
  price: 50000,
});

// 2. Invalid amount precision
const market = await exchange.fetchMarkets().find(m => m.symbol === 'BTC/USDT:USDT');
const { amountPrecision } = market.limits;

// Round to correct precision
const amount = Number((0.123456).toFixed(amountPrecision));

await exchange.createOrder({
  symbol: 'BTC/USDT:USDT',
  type: 'limit',
  side: 'buy',
  amount,
  price: 50000,
});

// 3. Amount below minimum
if (amount < market.limits.amount.min) {
  throw new Error(`Amount ${amount} below minimum ${market.limits.amount.min}`);
}
```

### OrderNotFoundError

**Symptom**: `OrderNotFoundError: order not found`

**Causes**:
- Order already filled/cancelled
- Wrong order ID format
- Order from different account

**Solutions**:

```typescript
// 1. Check order status before cancelling
const orders = await exchange.fetchOpenOrders('BTC/USDT:USDT');
const order = orders.find(o => o.id === orderId);

if (order) {
  await exchange.cancelOrder(orderId, 'BTC/USDT:USDT');
} else {
  console.log('Order already closed');
}

// 2. Handle cancellation errors gracefully
async function safeCancelOrder(orderId: string, symbol: string) {
  try {
    await exchange.cancelOrder(orderId, symbol);
    console.log('Order cancelled');
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
      console.log('Order already closed');
    } else {
      throw error;
    }
  }
}

// 3. Track order lifecycle
const orderHistory = new Map();

async function createTrackedOrder(request: OrderRequest) {
  const order = await exchange.createOrder(request);
  orderHistory.set(order.id, {
    created: Date.now(),
    status: order.status,
  });
  return order;
}
```

### Post-Only Order Rejection

**Symptom**: Order rejected with "would immediately match" or "takes liquidity"

**Solution**:

```typescript
// Post-only orders must not cross the spread
const orderbook = await exchange.fetchOrderBook('BTC/USDT:USDT');
const [bidPrice] = orderbook.bids[0];
const [askPrice] = orderbook.asks[0];

// For buy orders, price must be below best ask
const buyPrice = bidPrice; // At or below bid side

await exchange.createOrder({
  symbol: 'BTC/USDT:USDT',
  type: 'limit',
  side: 'buy',
  amount: 0.1,
  price: buyPrice,
  postOnly: true,
});

// For sell orders, price must be above best bid
const sellPrice = askPrice; // At or above ask side

await exchange.createOrder({
  symbol: 'BTC/USDT:USDT',
  type: 'limit',
  side: 'sell',
  amount: 0.1,
  price: sellPrice,
  postOnly: true,
});
```

## Position and Margin Issues

### InsufficientMarginError

**Symptom**: `InsufficientMarginError: insufficient margin for trade`

**Solutions**:

```typescript
import { calculateRequiredMargin, calculateMaxPositionSize } from 'perp-dex-sdk';

// 1. Calculate required margin before trading
const price = 50000;
const amount = 0.5;
const leverage = 10;

const requiredMargin = calculateRequiredMargin(price, amount, leverage);
console.log('Required margin:', requiredMargin);

const balance = await exchange.fetchBalance();
const freeMargin = balance[0].free;

if (requiredMargin > freeMargin) {
  console.error('Insufficient margin');
  console.log(`Need: $${requiredMargin}, Have: $${freeMargin}`);
}

// 2. Calculate maximum position size
const maxSize = calculateMaxPositionSize(freeMargin, leverage, price);
console.log('Max position size:', maxSize);

// 3. Account for fees and funding
const makerFee = 0.0002; // 0.02%
const takerFee = 0.0005; // 0.05%

const positionValue = price * amount;
const feeEstimate = positionValue * takerFee;
const totalRequired = requiredMargin + feeEstimate;

console.log('Total required (with fees):', totalRequired);
```

### Liquidation Risk

**Symptom**: Position approaching liquidation price

**Solutions**:

```typescript
import { calculateLiquidationPrice } from 'perp-dex-sdk';

// 1. Monitor liquidation distance
async function monitorLiquidationRisk() {
  const positions = await exchange.fetchPositions();

  for (const position of positions) {
    const liqDistance = Math.abs(position.markPrice - position.liquidationPrice);
    const liqPct = (liqDistance / position.markPrice) * 100;

    if (liqPct < 10) {
      console.warn(`⚠️  ${position.symbol} close to liquidation: ${liqPct.toFixed(2)}%`);

      // Take action: reduce position, add margin, or close
      if (liqPct < 5) {
        console.error(`🚨 CRITICAL: Closing ${position.symbol} position`);
        await closePosition(position);
      }
    }
  }
}

// 2. Calculate safe leverage
function calculateSafeLeverage(
  stopLossPercent: number,
  maintenanceMarginRate: number = 0.005
): number {
  // Maximum leverage where stop-loss triggers before liquidation
  return 1 / (stopLossPercent / 100 + maintenanceMarginRate);
}

const safeLeverage = calculateSafeLeverage(5); // 5% stop-loss
console.log('Safe leverage:', safeLeverage); // ~16.67x

// 3. Implement automatic deleveraging
async function autoDeleverage(targetLiqPct: number = 15) {
  const positions = await exchange.fetchPositions();

  for (const position of positions) {
    const liqDistance = Math.abs(position.markPrice - position.liquidationPrice);
    const liqPct = (liqDistance / position.markPrice) * 100;

    if (liqPct < targetLiqPct) {
      // Reduce position by 25%
      const reduceAmount = position.size * 0.25;

      await exchange.createOrder({
        symbol: position.symbol,
        type: 'market',
        side: position.side === 'long' ? 'sell' : 'buy',
        amount: reduceAmount,
        reduceOnly: true,
      });

      console.log(`Reduced ${position.symbol} by 25%`);
    }
  }
}
```

## Development and Testing

### TypeScript Compilation Errors

**Common Issues**:

```typescript
// 1. Import path issues with ES modules
// ❌ Bad: Missing .js extension
import { createExchange } from './adapters/factory';

// ✅ Good: Include .js extension
import { createExchange } from './adapters/factory.js';

// 2. Type errors with BigInt
// ❌ Bad: Implicit any
const timestamp = BigInt(Date.now());

// ✅ Good: Explicit type
const timestamp: bigint = BigInt(Date.now());

// 3. Async generator types
// ✅ Correct async generator typing
async function* watchData(): AsyncGenerator<Data, void, unknown> {
  yield data;
}
```

### Testing on Testnet

**Setup**:

```typescript
// 1. Use testnet mode
const exchange = createExchange('hyperliquid', {
  wallet,
  testnet: true, // Enable testnet
});

// 2. Get testnet funds
// Hyperliquid testnet: https://app.hyperliquid-testnet.xyz/
// Usually has a faucet for test USDC

// 3. Verify testnet connection
await exchange.initialize();
const balance = await exchange.fetchBalance();
console.log('Testnet balance:', balance[0].total);

// 4. Use small test amounts
const TEST_AMOUNT = 0.001; // Very small for testing
```

### Mock Testing

**Setup**:

```typescript
// Create mock adapter for unit tests
class MockExchangeAdapter implements IExchangeAdapter {
  id = 'mock';
  name = 'Mock Exchange';
  has = { createOrder: true, fetchBalance: true };

  async fetchMarkets(): Promise<Market[]> {
    return [
      {
        id: 'BTC-PERP',
        symbol: 'BTC/USDT:USDT',
        base: 'BTC',
        quote: 'USDT',
        settle: 'USDT',
        type: 'swap',
        spot: false,
        margin: true,
        swap: true,
        active: true,
        maxLeverage: 50,
        // ... other fields
      },
    ];
  }

  // ... implement other methods
}

// Use in tests
const mockExchange = new MockExchangeAdapter();
await testTradingLogic(mockExchange);
```

## Performance Optimization

### Slow Request Times

**Solutions**:

```typescript
// 1. Enable request caching
const marketCache = new Map<string, { data: Market[]; timestamp: number }>();

async function fetchMarketsWithCache(ttlMs: number = 60000): Promise<Market[]> {
  const cached = marketCache.get('markets');

  if (cached && Date.now() - cached.timestamp < ttlMs) {
    return cached.data;
  }

  const data = await exchange.fetchMarkets();
  marketCache.set('markets', { data, timestamp: Date.now() });

  return data;
}

// 2. Use parallel requests
// ❌ Slow: Sequential
const markets = await exchange.fetchMarkets();
const balance = await exchange.fetchBalance();
const positions = await exchange.fetchPositions();

// ✅ Fast: Parallel
const [markets, balance, positions] = await Promise.all([
  exchange.fetchMarkets(),
  exchange.fetchBalance(),
  exchange.fetchPositions(),
]);

// 3. Minimize data fetching
// Only fetch what you need
const btcMarkets = await exchange.fetchMarkets({ symbols: ['BTC/USDT:USDT'] });
```

### High Memory Usage

**Solutions**:

```typescript
// 1. Limit orderbook depth
const orderbook = await exchange.fetchOrderBook('BTC/USDT:USDT', 20); // Only 20 levels

// 2. Clear old data periodically
const orderHistory: Order[] = [];
const MAX_HISTORY = 1000;

function addToHistory(order: Order) {
  orderHistory.push(order);

  if (orderHistory.length > MAX_HISTORY) {
    orderHistory.shift(); // Remove oldest
  }
}

// 3. Use streams instead of arrays
// ❌ Memory intensive: Load all trades
const trades = await exchange.fetchTrades('BTC/USDT:USDT', undefined, 10000);

// ✅ Memory efficient: Stream trades
for await (const trade of exchange.watchTrades('BTC/USDT:USDT')) {
  processTrade(trade);
  // Each trade is processed and discarded
}
```

## Debugging Tips

### Enable Debug Logging

```typescript
// 1. Enable SDK debug mode
const exchange = createExchange('hyperliquid', {
  wallet,
  debug: true, // Logs all requests/responses
});

// 2. Log all errors with context
try {
  await exchange.createOrder(orderRequest);
} catch (error) {
  console.error('Order creation failed');
  console.error('Request:', JSON.stringify(orderRequest, null, 2));
  console.error('Error:', error);

  if (error instanceof PerpDEXError) {
    console.error('Exchange:', error.exchange);
    console.error('Code:', error.code);
    console.error('Original error:', error.originalError);
  }
}

// 3. Trace request flow
async function debugRequest<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  console.log(`[${name}] Starting...`);
  const start = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - start;
    console.log(`[${name}] Success in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[${name}] Failed after ${duration}ms`, error);
    throw error;
  }
}

// Usage
const markets = await debugRequest('fetchMarkets', () => exchange.fetchMarkets());
```

### Network Debugging

```typescript
// 1. Capture all HTTP traffic
import https from 'https';

const originalRequest = https.request;
https.request = function (...args: any[]) {
  console.log('HTTPS Request:', args[0]);
  return originalRequest.apply(this, args);
};

// 2. Monitor WebSocket messages
exchange.on('websocket:message', (message) => {
  console.log('WS <<', JSON.stringify(message));
});

exchange.on('websocket:send', (message) => {
  console.log('WS >>', JSON.stringify(message));
});

// 3. Measure latency
class LatencyMonitor {
  private latencies: number[] = [];

  record(latencyMs: number) {
    this.latencies.push(latencyMs);

    // Keep last 100 measurements
    if (this.latencies.length > 100) {
      this.latencies.shift();
    }
  }

  getStats() {
    const sorted = [...this.latencies].sort((a, b) => a - b);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
      avg: sorted.reduce((sum, val) => sum + val, 0) / sorted.length,
      p95: sorted[Math.floor(sorted.length * 0.95)],
    };
  }
}

const monitor = new LatencyMonitor();

async function measureLatency<T>(operation: () => Promise<T>): Promise<T> {
  const start = Date.now();
  const result = await operation();
  monitor.record(Date.now() - start);
  return result;
}

// Check latency stats periodically
setInterval(() => {
  console.log('Latency stats:', monitor.getStats());
}, 60000);
```

## Getting Help

### Before Asking for Help

1. Check this troubleshooting guide
2. Review exchange-specific guides in `docs/guides/`
3. Enable debug logging to capture full error details
4. Test with minimal code example to isolate the issue

### Where to Get Help

- **GitHub Issues**: https://github.com/your-org/perp-dex-sdk/issues
- **Documentation**: See `docs/` directory
- **Exchange Documentation**:
  - Hyperliquid: https://hyperliquid.gitbook.io/
  - GRVT: https://docs.grvt.io/
  - Lighter: https://docs.lighter.xyz/

### Providing Debug Information

When reporting issues, include:

```typescript
// 1. SDK version
import { version } from 'perp-dex-sdk/package.json';
console.log('SDK version:', version);

// 2. Node.js version
console.log('Node.js:', process.version);

// 3. Exchange and network
console.log('Exchange:', exchange.id);
console.log('Testnet:', exchange.testnet);

// 4. Full error with stack trace
try {
  await operation();
} catch (error) {
  console.error('Error details:', {
    message: error.message,
    stack: error.stack,
    ...(error instanceof PerpDEXError && {
      exchange: error.exchange,
      code: error.code,
      originalError: error.originalError,
    }),
  });
}

// 5. Minimal reproduction code
// Provide smallest possible code that reproduces the issue
```

## Next Steps

- Review [Hyperliquid Guide](./hyperliquid.md) for exchange-specific information
- Check [API Documentation](../api/README.md) for detailed method references
- Explore [Examples](../../examples/) for working code samples
