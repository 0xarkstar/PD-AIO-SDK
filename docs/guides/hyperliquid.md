# Hyperliquid Exchange Guide

Complete guide for using the Hyperliquid adapter in Perp DEX SDK.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Basic Usage](#basic-usage)
- [Trading](#trading)
- [WebSocket Streaming](#websocket-streaming)
- [Rate Limits](#rate-limits)
- [HIP-3 Ecosystem](#hip-3-ecosystem)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Hyperliquid is a high-performance decentralized perpetual exchange with:
- **200,000+ orders/second** throughput
- **50x maximum leverage**
- **EIP-712 signing** for orders
- **HIP-3 ecosystem** support (7+ DEXs with same API)
- **Cross-margin** by default (isolated available on HIP-3)

### Key Features

- ✅ REST API for market data and trading
- ✅ WebSocket for real-time updates
- ✅ Batch order operations
- ✅ Sub-second latency
- ✅ No gas fees for trading

## Authentication

Hyperliquid uses **EIP-712 signatures** with a phantom agent mechanism.

### Setup with Private Key

```typescript
import { createExchange } from 'perp-dex-sdk';

const exchange = createExchange('hyperliquid', {
  privateKey: process.env.HYPERLIQUID_PRIVATE_KEY,
  testnet: true, // Use testnet for development
});

await exchange.initialize();
```

### Setup with Wallet

```typescript
import { Wallet } from 'ethers';
import { createExchange } from 'perp-dex-sdk';

const wallet = new Wallet(process.env.PRIVATE_KEY);

const exchange = createExchange('hyperliquid', {
  wallet,
  testnet: false, // Mainnet
});

await exchange.initialize();
```

### API Wallet (Read-Only)

For monitoring without trading permissions:

```typescript
// API wallets cannot withdraw funds - safe for delegation
const exchange = createExchange('hyperliquid', {
  // Use API wallet private key
  privateKey: process.env.API_WALLET_KEY,
  testnet: false,
});

// Can fetch positions and balances, but cannot trade
const positions = await exchange.fetchPositions();
const balance = await exchange.fetchBalance();
```

## Basic Usage

### Fetch Markets

```typescript
// Get all active markets
const markets = await exchange.fetchMarkets({ active: true });

console.log(`Found ${markets.length} markets`);

// Find BTC perpetual
const btcMarket = markets.find((m) => m.symbol === 'BTC/USDT:USDT');

console.log('BTC Market:', {
  maxLeverage: btcMarket.maxLeverage, // 50
  makerFee: btcMarket.makerFee,       // 0.0002 (0.02%)
  takerFee: btcMarket.takerFee,       // 0.0005 (0.05%)
  fundingInterval: btcMarket.fundingIntervalHours, // 8
});
```

### Fetch Order Book

```typescript
const orderbook = await exchange.fetchOrderBook('BTC/USDT:USDT');

console.log('Best Bid:', orderbook.bids[0]); // [price, size]
console.log('Best Ask:', orderbook.asks[0]);

// Calculate spread
const [bidPrice] = orderbook.bids[0];
const [askPrice] = orderbook.asks[0];
const spread = askPrice - bidPrice;
const spreadBps = (spread / bidPrice) * 10000;

console.log(`Spread: $${spread} (${spreadBps.toFixed(2)} bps)`);
```

### Fetch Ticker

```typescript
const ticker = await exchange.fetchTicker('BTC/USDT:USDT');

console.log({
  last: ticker.last,
  bid: ticker.bid,
  ask: ticker.ask,
});
```

### Fetch Funding Rate

```typescript
const fundingRate = await exchange.fetchFundingRate('BTC/USDT:USDT');

console.log({
  rate: fundingRate.fundingRate,         // 0.0001 = 0.01%
  nextFunding: new Date(fundingRate.nextFundingTimestamp),
  markPrice: fundingRate.markPrice,
});

// Calculate 8-hour funding payment for 1 BTC position
const positionValue = 1 * fundingRate.markPrice;
const fundingPayment = positionValue * fundingRate.fundingRate;
console.log(`Funding payment: $${fundingPayment.toFixed(2)}`);
```

## Trading

### Place Limit Order

```typescript
import { calculateLiquidationPrice } from 'perp-dex-sdk';

// Place post-only limit buy
const order = await exchange.createOrder({
  symbol: 'BTC/USDT:USDT',
  type: 'limit',
  side: 'buy',
  amount: 0.1,              // 0.1 BTC
  price: 50000,             // $50,000
  postOnly: true,           // Add liquidity only
  reduceOnly: false,
});

console.log('Order placed:', order.id);

// Calculate liquidation price (10x leverage, 0.5% maintenance margin)
const liqPrice = calculateLiquidationPrice('long', 50000, 10, 0.005);
console.log(`Liquidation price: $${liqPrice.toFixed(2)}`);
```

### Place Market Order

```typescript
// Market sell (immediate execution)
const order = await exchange.createOrder({
  symbol: 'ETH/USDT:USDT',
  type: 'market',
  side: 'sell',
  amount: 1.0,
  reduceOnly: true,  // Only reduce existing position
});

console.log('Filled at:', order.averagePrice);
```

### IOC (Immediate or Cancel) Order

```typescript
const order = await exchange.createOrder({
  symbol: 'BTC/USDT:USDT',
  type: 'limit',
  side: 'buy',
  amount: 0.5,
  price: 49500,
  timeInForce: 'IOC',  // Fill immediately or cancel
});
```

### Cancel Order

```typescript
// Cancel specific order
await exchange.cancelOrder(order.id, 'BTC/USDT:USDT');

// Cancel all orders for a symbol
await exchange.cancelAllOrders('BTC/USDT:USDT');

// Cancel ALL open orders
await exchange.cancelAllOrders();
```

### Batch Orders

```typescript
// Create multiple orders at once (single transaction)
const orders = await exchange.createBatchOrders([
  {
    symbol: 'BTC/USDT:USDT',
    type: 'limit',
    side: 'buy',
    amount: 0.1,
    price: 49000,
    postOnly: true,
  },
  {
    symbol: 'BTC/USDT:USDT',
    type: 'limit',
    side: 'buy',
    amount: 0.1,
    price: 48000,
    postOnly: true,
  },
  {
    symbol: 'ETH/USDT:USDT',
    type: 'limit',
    side: 'buy',
    amount: 1.0,
    price: 2900,
    postOnly: true,
  },
]);

console.log(`Placed ${orders.length} orders`);
```

### Fetch Positions

```typescript
import { calculateUnrealizedPnl, calculateROE } from 'perp-dex-sdk';

const positions = await exchange.fetchPositions();

for (const position of positions) {
  console.log(`${position.symbol}:`, {
    side: position.side,
    size: position.size,
    entryPrice: position.entryPrice,
    markPrice: position.markPrice,
    unrealizedPnl: position.unrealizedPnl,
    leverage: position.leverage,
    liquidationPrice: position.liquidationPrice,
  });

  // Calculate ROE
  const roe = calculateROE(position.unrealizedPnl, position.margin);
  console.log(`  ROE: ${(roe * 100).toFixed(2)}%`);
}
```

### Fetch Balance

```typescript
const balances = await exchange.fetchBalance();

for (const balance of balances) {
  console.log(`${balance.currency}:`, {
    total: balance.total,
    free: balance.free,
    used: balance.used,
  });
}
```

## WebSocket Streaming

### Stream Order Book

```typescript
console.log('Streaming order book updates...');

let updateCount = 0;

for await (const orderbook of exchange.watchOrderBook('BTC/USDT:USDT')) {
  updateCount++;

  const [bidPrice, bidSize] = orderbook.bids[0];
  const [askPrice, askSize] = orderbook.asks[0];

  console.log(`Update #${updateCount}:`, {
    bid: `$${bidPrice} x ${bidSize}`,
    ask: `$${askPrice} x ${askSize}`,
    spread: `$${(askPrice - bidPrice).toFixed(2)}`,
  });

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
    time: new Date(trade.timestamp),
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
  }
}
```

### Multiple Streams (Concurrent)

```typescript
// Run multiple streams concurrently
await Promise.all([
  (async () => {
    for await (const ob of exchange.watchOrderBook('BTC/USDT:USDT')) {
      console.log('BTC orderbook update');
    }
  })(),
  (async () => {
    for await (const ob of exchange.watchOrderBook('ETH/USDT:USDT')) {
      console.log('ETH orderbook update');
    }
  })(),
  (async () => {
    for await (const positions of exchange.watchPositions()) {
      console.log('Positions update');
    }
  })(),
]);
```

## Rate Limits

Hyperliquid enforces rate limits based on **weight system**:

- **Maximum**: 1200 weight per minute
- **Window**: Rolling 60-second window

### Default Weights

| Endpoint | Weight |
|----------|--------|
| `fetchMarkets` | 1 |
| `fetchTicker` | 1 |
| `fetchOrderBook` | 2 |
| `fetchTrades` | 1 |
| `fetchFundingRate` | 1 |
| `fetchPositions` | 2 |
| `fetchBalance` | 2 |
| `createOrder` | 5 |
| `cancelOrder` | 3 |
| `createBatchOrders` | 20 |
| `cancelAllOrders` | 10 |

### Custom Rate Limit Configuration

```typescript
const exchange = createExchange('hyperliquid', {
  privateKey: process.env.PRIVATE_KEY,
  rateLimit: {
    maxRequests: 1200,
    windowMs: 60000,
    weights: {
      fetchMarkets: 1,
      createOrder: 5,
      // Custom weights...
    },
  },
});
```

### Check Rate Limit Status

The rate limiter automatically queues requests when approaching limits.

## HIP-3 Ecosystem

Hyperliquid's HIP-3 protocol allows builders to deploy specialized perpetual markets. **All HIP-3 DEXs use the identical Hyperliquid API**.

### Supported HIP-3 DEXs

| DEX | Specialization | Markets |
|-----|---------------|---------|
| **trade.xyz** | US Stock Perps | NVDA, TSLA, AAPL, etc. |
| **Ventuals** | Pre-IPO Perps | SpaceX, OpenAI, Anthropic |
| **Based** | Trading Super App | Various |
| **Volmex** | Volatility Indices | BVIV, EVIV |

### Using HIP-3 Markets

```typescript
// Same code works for all HIP-3 DEXs
const markets = await exchange.fetchMarkets();

// Filter for specific DEX
const tradeXyzMarkets = markets.filter((m) =>
  m.info?.dex === 'trade.xyz'
);

console.log('trade.xyz markets:', tradeXyzMarkets.map((m) => m.symbol));

// Trade on trade.xyz (NVDA perp)
const order = await exchange.createOrder({
  symbol: 'NVDA/USDT:USDT',  // Same format
  type: 'limit',
  side: 'buy',
  amount: 10,
  price: 800,
  postOnly: true,
});
```

## Best Practices

### 1. Use Post-Only for Maker Rebates

```typescript
// Get maker rebate (negative fee)
const order = await exchange.createOrder({
  symbol: 'BTC/USDT:USDT',
  type: 'limit',
  side: 'buy',
  amount: 0.1,
  price: 49500,
  postOnly: true,  // Ensures maker order
});
```

### 2. Monitor Liquidation Distance

```typescript
import { calculateLiquidationPrice } from 'perp-dex-sdk';

const positions = await exchange.fetchPositions();

for (const pos of positions) {
  const liqDistance = Math.abs(pos.markPrice - pos.liquidationPrice);
  const liqPct = (liqDistance / pos.markPrice) * 100;

  if (liqPct < 5) {
    console.warn(`⚠️  ${pos.symbol} close to liquidation: ${liqPct.toFixed(2)}%`);
  }
}
```

### 3. Use Reduce-Only for Closing

```typescript
// Ensure order only reduces position (won't increase)
const order = await exchange.createOrder({
  symbol: 'BTC/USDT:USDT',
  type: 'market',
  side: 'sell',
  amount: 0.5,
  reduceOnly: true,  // Safety flag
});
```

### 4. Handle WebSocket Reconnections

The SDK automatically handles reconnections, but you should handle stream interruptions:

```typescript
async function streamWithRetry() {
  while (true) {
    try {
      for await (const ob of exchange.watchOrderBook('BTC/USDT:USDT')) {
        // Process orderbook
      }
    } catch (error) {
      console.error('Stream error:', error);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Reconnecting...');
    }
  }
}
```

## Troubleshooting

### Invalid Signature Error

**Problem**: `InvalidSignatureError: invalid signature`

**Solution**:
- Verify private key is correct
- Check you're using the right network (testnet vs mainnet)
- Ensure wallet has been used on Hyperliquid before

```typescript
// Test signature
import { Wallet } from 'ethers';

const wallet = new Wallet(process.env.PRIVATE_KEY);
console.log('Address:', wallet.address);

// First transaction on Hyperliquid must be from this address
```

### Insufficient Margin Error

**Problem**: `InsufficientMarginError: insufficient margin for trade`

**Solution**:
- Check available balance
- Reduce position size
- Lower leverage
- Close other positions to free margin

```typescript
const balances = await exchange.fetchBalance();
console.log('Free margin:', balances[0].free);

// Calculate max position size
import { calculateMaxPositionSize } from 'perp-dex-sdk';

const maxSize = calculateMaxPositionSize(
  balances[0].free,  // available margin
  10,                // leverage
  50000              // BTC price
);
console.log('Max BTC size:', maxSize);
```

### Rate Limit Exceeded

**Problem**: `RateLimitError: rate limit exceeded`

**Solution**:
The SDK automatically queues requests. If you're still hitting limits:

1. Reduce request frequency
2. Use batch operations
3. Use WebSocket instead of polling REST

```typescript
// ❌ Bad: Polling
setInterval(async () => {
  await exchange.fetchOrderBook('BTC/USDT:USDT');
}, 100);

// ✅ Good: WebSocket
for await (const ob of exchange.watchOrderBook('BTC/USDT:USDT')) {
  // Real-time updates
}
```

### Order Would Match (Post-Only Rejection)

**Problem**: `InvalidOrderError: order would immediately match`

**Solution**:
Post-only orders are rejected if they would take liquidity. Either:
- Adjust price to not cross spread
- Remove `postOnly` flag
- Use IOC instead

```typescript
const orderbook = await exchange.fetchOrderBook('BTC/USDT:USDT');
const [bidPrice] = orderbook.bids[0];

// Place limit buy below best bid
const order = await exchange.createOrder({
  symbol: 'BTC/USDT:USDT',
  type: 'limit',
  side: 'buy',
  amount: 0.1,
  price: bidPrice - 1,  // Below market
  postOnly: true,
});
```

## Next Steps

- Explore [Advanced Examples](../examples/advanced-trading.md)
- Read [API Documentation](../api/README.md)
- Check [Troubleshooting Guide](./troubleshooting.md)
- Learn about [GRVT Adapter](./grvt.md)
