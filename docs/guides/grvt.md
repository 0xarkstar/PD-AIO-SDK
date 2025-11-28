# GRVT Exchange Guide

Complete guide for using the GRVT adapter in Perp DEX SDK.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Basic Usage](#basic-usage)
- [Trading](#trading)
- [WebSocket Streaming](#websocket-streaming)
- [Rate Limits](#rate-limits)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

GRVT (Gravity) is a high-performance hybrid decentralized exchange with:
- **Sub-millisecond latency** for order execution
- **100x maximum leverage**
- **Hybrid architecture** combining CEX speed with DEX security
- **EIP-712 signing** for orders
- **Layer 2 scaling** for low fees
- **API key + session cookie** authentication

### Key Features

- ✅ REST API for market data and trading
- ✅ WebSocket for real-time updates
- ✅ Batch order operations
- ✅ Advanced order types (post-only, IOC, FOK)
- ✅ Cross-margin and isolated margin support
- ✅ Low latency order matching

## Authentication

GRVT supports two authentication methods:

### 1. Wallet-Based Authentication (Recommended)

Uses EIP-712 signatures for secure, self-custodial trading:

```typescript
import { Wallet } from 'ethers';
import { createExchange } from 'perp-dex-sdk';

const wallet = new Wallet(process.env.PRIVATE_KEY);

const exchange = createExchange('grvt', {
  wallet,
  testnet: true, // Use testnet for development
});

await exchange.initialize();
```

### 2. API Key Authentication

For programmatic trading with pre-generated API keys:

```typescript
const exchange = createExchange('grvt', {
  apiKey: process.env.GRVT_API_KEY,
  apiSecret: process.env.GRVT_API_SECRET,
  testnet: false, // Mainnet
});

await exchange.initialize();
```

### Session Management

GRVT uses session cookies that expire after 1 hour. The SDK automatically manages session renewal:

```typescript
// Session is automatically refreshed when needed
// Manual refresh (optional):
await exchange.disconnect();
await exchange.initialize();
```

## Basic Usage

### Fetch Markets

```typescript
// Get all active markets
const markets = await exchange.fetchMarkets({ active: true });

console.log(`Found ${markets.length} markets`);

// Find specific market
const btcMarket = markets.find((m) => m.symbol === 'BTC/USDT:USDT');

console.log('BTC Market:', {
  maxLeverage: btcMarket.maxLeverage, // 100
  makerFee: btcMarket.makerFee,       // 0.0002 (0.02%)
  takerFee: btcMarket.takerFee,       // 0.0005 (0.05%)
  minSize: btcMarket.limits.amount.min,
  maxSize: btcMarket.limits.amount.max,
});
```

### Fetch Order Book

```typescript
const orderbook = await exchange.fetchOrderBook('BTC/USDT:USDT', 20);

console.log('Best Bid:', orderbook.bids[0]); // [price, size]
console.log('Best Ask:', orderbook.asks[0]);

// Calculate mid price
const midPrice = (orderbook.bids[0][0] + orderbook.asks[0][0]) / 2;
console.log(`Mid Price: $${midPrice.toLocaleString()}`);

// Calculate spread
const [bidPrice] = orderbook.bids[0];
const [askPrice] = orderbook.asks[0];
const spreadBps = ((askPrice - bidPrice) / bidPrice) * 10000;
console.log(`Spread: ${spreadBps.toFixed(2)} bps`);
```

### Fetch Ticker

```typescript
const ticker = await exchange.fetchTicker('BTC/USDT:USDT');

console.log({
  last: ticker.last,
  bid: ticker.bid,
  ask: ticker.ask,
  high24h: ticker.high,
  low24h: ticker.low,
  volume24h: ticker.volume,
});
```

### Fetch Funding Rate

```typescript
const fundingRate = await exchange.fetchFundingRate('ETH/USDT:USDT');

console.log({
  rate: fundingRate.fundingRate,         // 0.0001 = 0.01%
  markPrice: fundingRate.markPrice,
  nextFunding: new Date(fundingRate.nextFundingTimestamp),
});

// Calculate 8-hour funding payment for 10 ETH position
const positionValue = 10 * fundingRate.markPrice;
const fundingPayment = positionValue * fundingRate.fundingRate;
console.log(`Funding payment: $${fundingPayment.toFixed(2)}`);
```

### Fetch Recent Trades

```typescript
// Get last 100 trades
const trades = await exchange.fetchTrades('BTC/USDT:USDT', undefined, 100);

trades.forEach((trade) => {
  console.log({
    price: trade.price,
    amount: trade.amount,
    side: trade.side,
    time: new Date(trade.timestamp),
  });
});
```

## Trading

### Place Limit Order

```typescript
import { calculateLiquidationPrice } from 'perp-dex-sdk';

// Place post-only limit buy (maker order)
const order = await exchange.createOrder({
  symbol: 'BTC/USDT:USDT',
  type: 'limit',
  side: 'buy',
  amount: 0.5,              // 0.5 BTC
  price: 49000,             // $49,000
  postOnly: true,           // Add liquidity only
  reduceOnly: false,
});

console.log('Order placed:', {
  id: order.id,
  status: order.status,
  price: order.price,
});

// Calculate liquidation price (20x leverage, 0.5% maintenance margin)
const liqPrice = calculateLiquidationPrice('long', 49000, 20, 0.005);
console.log(`Liquidation price: $${liqPrice.toFixed(2)}`);
```

### Place Market Order

```typescript
// Market buy (immediate execution)
const order = await exchange.createOrder({
  symbol: 'ETH/USDT:USDT',
  type: 'market',
  side: 'buy',
  amount: 2.0,              // 2 ETH
});

console.log('Filled at:', order.averagePrice);
console.log('Total cost:', order.amount * (order.averagePrice ?? 0));
```

### IOC (Immediate or Cancel) Order

```typescript
const order = await exchange.createOrder({
  symbol: 'BTC/USDT:USDT',
  type: 'limit',
  side: 'sell',
  amount: 0.3,
  price: 51000,
  timeInForce: 'IOC',  // Fill immediately or cancel
});

if (order.status === 'filled') {
  console.log('Fully filled');
} else if (order.status === 'partiallyFilled') {
  console.log(`Partially filled: ${order.filled}/${order.amount}`);
} else {
  console.log('Order cancelled (not filled)');
}
```

### FOK (Fill or Kill) Order

```typescript
const order = await exchange.createOrder({
  symbol: 'BTC/USDT:USDT',
  type: 'limit',
  side: 'buy',
  amount: 1.0,
  price: 50000,
  timeInForce: 'FOK',  // Fill entire order or cancel
});
```

### Cancel Order

```typescript
// Cancel specific order
await exchange.cancelOrder(order.id, 'BTC/USDT:USDT');
console.log('Order cancelled');

// Cancel all orders for a symbol
await exchange.cancelAllOrders('BTC/USDT:USDT');

// Cancel ALL open orders across all symbols
await exchange.cancelAllOrders();
```

### Batch Orders

```typescript
// Create multiple orders in a single request
const orders = await exchange.createBatchOrders([
  {
    symbol: 'BTC/USDT:USDT',
    type: 'limit',
    side: 'buy',
    amount: 0.1,
    price: 48000,
    postOnly: true,
  },
  {
    symbol: 'BTC/USDT:USDT',
    type: 'limit',
    side: 'buy',
    amount: 0.1,
    price: 47000,
    postOnly: true,
  },
  {
    symbol: 'ETH/USDT:USDT',
    type: 'limit',
    side: 'buy',
    amount: 1.0,
    price: 2800,
    postOnly: true,
  },
]);

console.log(`Placed ${orders.length} orders`);
```

### Fetch Open Orders

```typescript
// Get all open orders
const allOrders = await exchange.fetchOpenOrders();

console.log(`Total open orders: ${allOrders.length}`);

// Get open orders for specific symbol
const btcOrders = await exchange.fetchOpenOrders('BTC/USDT:USDT');

btcOrders.forEach((order) => {
  console.log(`${order.side} ${order.amount} @ $${order.price}`);
});
```

### Fetch Positions

```typescript
import { calculateUnrealizedPnl, calculateROE } from 'perp-dex-sdk';

const positions = await exchange.fetchPositions();

for (const position of positions) {
  console.log(`\n${position.symbol}:`);
  console.log(`  Side: ${position.side.toUpperCase()}`);
  console.log(`  Size: ${position.size}`);
  console.log(`  Entry: $${position.entryPrice.toLocaleString()}`);
  console.log(`  Mark: $${position.markPrice.toLocaleString()}`);
  console.log(`  PnL: $${position.unrealizedPnl.toLocaleString()}`);
  console.log(`  Leverage: ${position.leverage}x`);
  console.log(`  Liquidation: $${position.liquidationPrice?.toLocaleString()}`);

  // Calculate ROE
  const roe = calculateROE(position.unrealizedPnl, position.margin);
  console.log(`  ROE: ${(roe * 100).toFixed(2)}%`);

  // Calculate distance to liquidation
  if (position.liquidationPrice) {
    const liqDistance = Math.abs(position.markPrice - position.liquidationPrice);
    const liqPct = (liqDistance / position.markPrice) * 100;
    console.log(`  Liquidation Distance: ${liqPct.toFixed(2)}%`);
  }
}
```

### Fetch Balance

```typescript
const balances = await exchange.fetchBalance();

balances.forEach((balance) => {
  console.log(`${balance.currency}:`);
  console.log(`  Total: $${balance.total.toLocaleString()}`);
  console.log(`  Free: $${balance.free.toLocaleString()}`);
  console.log(`  Used: $${balance.used.toLocaleString()}`);
});

// Calculate account equity
const totalEquity = balances.reduce((sum, b) => sum + b.total, 0);
console.log(`Total Equity: $${totalEquity.toLocaleString()}`);
```

## WebSocket Streaming

### Stream Order Book

```typescript
console.log('Streaming BTC order book...');

let updateCount = 0;

for await (const orderbook of exchange.watchOrderBook('BTC/USDT:USDT')) {
  updateCount++;

  const [bidPrice, bidSize] = orderbook.bids[0];
  const [askPrice, askSize] = orderbook.asks[0];

  console.log(`Update #${updateCount}:`);
  console.log(`  Bid: $${bidPrice.toLocaleString()} x ${bidSize}`);
  console.log(`  Ask: $${askPrice.toLocaleString()} x ${askSize}`);
  console.log(`  Spread: $${(askPrice - bidPrice).toFixed(2)}`);

  if (updateCount >= 10) break; // Stop after 10 updates
}
```

### Stream Trades

```typescript
console.log('Streaming real-time trades...');

for await (const trade of exchange.watchTrades('BTC/USDT:USDT')) {
  console.log('Trade:', {
    side: trade.side,
    price: trade.price,
    amount: trade.amount,
    time: new Date(trade.timestamp).toISOString(),
  });
}
```

### Stream Positions

```typescript
// Monitor position changes in real-time
for await (const positions of exchange.watchPositions()) {
  console.log(`${positions.length} open positions`);

  for (const pos of positions) {
    console.log(`  ${pos.symbol}: ${pos.side} ${pos.size} @ $${pos.entryPrice}`);
    console.log(`    PnL: $${pos.unrealizedPnl.toLocaleString()}`);
  }
}
```

### Stream Orders

```typescript
// Monitor order updates
for await (const orders of exchange.watchOrders()) {
  for (const order of orders) {
    console.log('Order update:', {
      id: order.id,
      symbol: order.symbol,
      status: order.status,
      filled: `${order.filled}/${order.amount}`,
    });
  }
}
```

### Multiple Concurrent Streams

```typescript
// Run multiple streams simultaneously
await Promise.all([
  // Stream BTC orderbook
  (async () => {
    for await (const ob of exchange.watchOrderBook('BTC/USDT:USDT')) {
      console.log('BTC orderbook update');
    }
  })(),

  // Stream ETH orderbook
  (async () => {
    for await (const ob of exchange.watchOrderBook('ETH/USDT:USDT')) {
      console.log('ETH orderbook update');
    }
  })(),

  // Stream positions
  (async () => {
    for await (const positions of exchange.watchPositions()) {
      console.log(`Positions: ${positions.length}`);
    }
  })(),

  // Stream orders
  (async () => {
    for await (const orders of exchange.watchOrders()) {
      console.log(`Orders: ${orders.length}`);
    }
  })(),
]);
```

## Rate Limits

GRVT enforces rate limits per 10-second windows:

- **REST API**: 100 requests per 10 seconds
- **WebSocket**: 50 maximum concurrent subscriptions

### Endpoint Weights

| Endpoint | Weight |
|----------|--------|
| `fetchMarkets` | 1 |
| `fetchTicker` | 1 |
| `fetchOrderBook` | 2 |
| `fetchTrades` | 2 |
| `fetchFundingRate` | 1 |
| `fetchPositions` | 2 |
| `fetchBalance` | 2 |
| `createOrder` | 5 |
| `cancelOrder` | 3 |
| `createBatchOrders` | 10 |
| `cancelAllOrders` | 10 |

### Rate Limit Best Practices

```typescript
// The SDK automatically handles rate limiting
// Requests are queued when approaching limits

// Use batch operations when possible
// ❌ Bad: Multiple separate requests
for (const order of orders) {
  await exchange.createOrder(order);
}

// ✅ Good: Single batch request
await exchange.createBatchOrders(orders);

// Use WebSocket for real-time data
// ❌ Bad: Polling with REST
setInterval(async () => {
  await exchange.fetchOrderBook('BTC/USDT:USDT');
}, 1000);

// ✅ Good: WebSocket streaming
for await (const ob of exchange.watchOrderBook('BTC/USDT:USDT')) {
  // Real-time updates, no rate limit impact
}
```

## Best Practices

### 1. Use Post-Only for Better Fees

```typescript
// Post-only orders get maker rebates
const order = await exchange.createOrder({
  symbol: 'BTC/USDT:USDT',
  type: 'limit',
  side: 'buy',
  amount: 0.1,
  price: 49500,
  postOnly: true,  // Ensures maker fee (rebate)
});
```

### 2. Monitor Liquidation Risk

```typescript
const positions = await exchange.fetchPositions();

for (const pos of positions) {
  const liqDistance = Math.abs(pos.markPrice - (pos.liquidationPrice ?? 0));
  const liqPct = (liqDistance / pos.markPrice) * 100;

  if (liqPct < 10) {
    console.warn(`⚠️  ${pos.symbol} close to liquidation: ${liqPct.toFixed(2)}%`);
  }

  if (liqPct < 5) {
    console.error(`🚨 CRITICAL: ${pos.symbol} at high liquidation risk!`);
    // Take action: reduce position, add margin, or close
  }
}
```

### 3. Use Reduce-Only for Closing Positions

```typescript
// Ensure order only reduces existing position
const order = await exchange.createOrder({
  symbol: 'BTC/USDT:USDT',
  type: 'market',
  side: 'sell',
  amount: 0.5,
  reduceOnly: true,  // Won't increase position if over-filled
});
```

### 4. Handle WebSocket Reconnections

```typescript
async function streamWithReconnect() {
  while (true) {
    try {
      for await (const orderbook of exchange.watchOrderBook('BTC/USDT:USDT')) {
        // Process orderbook
        processOrderbook(orderbook);
      }
    } catch (error) {
      console.error('Stream error:', error);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      console.log('Reconnecting...');
    }
  }
}
```

### 5. Calculate Position Metrics

```typescript
import {
  calculateUnrealizedPnl,
  calculateROE,
  calculateLiquidationPrice,
  calculateRequiredMargin,
} from 'perp-dex-sdk';

const position = positions[0];

// Calculate metrics
const roe = calculateROE(position.unrealizedPnl, position.margin);
const requiredMargin = calculateRequiredMargin(
  position.entryPrice,
  position.size,
  position.leverage
);

console.log({
  roe: `${(roe * 100).toFixed(2)}%`,
  requiredMargin: `$${requiredMargin.toLocaleString()}`,
  marginUsage: `${((position.margin / requiredMargin) * 100).toFixed(2)}%`,
});
```

## Troubleshooting

### Invalid Signature Error

**Problem**: `InvalidSignatureError: invalid signature`

**Solutions**:
1. Verify wallet private key is correct
2. Ensure using correct network (testnet vs mainnet)
3. Check system time is synchronized

```typescript
import { Wallet } from 'ethers';

const wallet = new Wallet(process.env.PRIVATE_KEY);
console.log('Wallet address:', wallet.address);

// Verify signature locally
const message = 'test';
const signature = await wallet.signMessage(message);
console.log('Test signature successful');
```

### Session Expired Error

**Problem**: `ExpiredAuthError: authentication token expired`

**Solution**: Reinitialize the exchange connection

```typescript
await exchange.disconnect();
await exchange.initialize();
```

### Insufficient Margin Error

**Problem**: `InsufficientMarginError: insufficient margin for trade`

**Solution**: Calculate required margin before trading

```typescript
import { calculateRequiredMargin, calculateMaxPositionSize } from 'perp-dex-sdk';

const balance = await exchange.fetchBalance();
const freeMargin = balance[0].free;

const price = 50000;
const leverage = 20;

// Calculate max position size
const maxSize = calculateMaxPositionSize(freeMargin, leverage, price);
console.log('Max position size:', maxSize);

// Use smaller size with buffer
const safeSize = maxSize * 0.9; // 90% of max
```

### Rate Limit Exceeded

**Problem**: `RateLimitError: rate limit exceeded`

**Solutions**:
1. Use batch operations
2. Implement request spacing
3. Switch to WebSocket for real-time data

```typescript
// Add delay between requests
async function createOrdersWithDelay(requests: OrderRequest[]) {
  const orders = [];

  for (const request of requests) {
    const order = await exchange.createOrder(request);
    orders.push(order);

    // Wait 100ms between orders
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return orders;
}
```

### Post-Only Order Rejected

**Problem**: Order rejected with "would immediately match"

**Solution**: Adjust price to not cross the spread

```typescript
const orderbook = await exchange.fetchOrderBook('BTC/USDT:USDT');
const [bidPrice] = orderbook.bids[0];
const [askPrice] = orderbook.asks[0];

// For buy orders, price must be at or below best bid
const buyPrice = bidPrice;

await exchange.createOrder({
  symbol: 'BTC/USDT:USDT',
  type: 'limit',
  side: 'buy',
  amount: 0.1,
  price: buyPrice,
  postOnly: true,
});
```

## Next Steps

- Check [API Documentation](../api/README.md) for detailed method references
- Review [Troubleshooting Guide](./troubleshooting.md) for common issues
- Explore [Examples](../../examples/) for working code samples
- Learn about [Hyperliquid Adapter](./hyperliquid.md) for comparison
