# PD AIO SDK

> **P**erp **D**EX **A**ll-**I**n-**O**ne SDK - Unified TypeScript SDK for Decentralized Perpetual Exchanges

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-2400%2B%20passed-brightgreen)](https://github.com/0xarkstar/PD-AIO-SDK)
[![npm version](https://img.shields.io/badge/npm-v0.2.0-blue)](https://www.npmjs.com/package/pd-aio-sdk)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

**[한국어 문서](./README.ko.md)** | English

---

## 🎯 What is PD AIO SDK?

**PD AIO SDK** (Perp DEX All-In-One SDK) is a production-ready, unified TypeScript SDK that lets you trade on **13 decentralized perpetual exchanges** through a single, consistent interface. No more learning different APIs for each exchange - write once, trade anywhere.

### Why "All-In-One"?

- **One Interface** → 13 Exchanges (Hyperliquid, GRVT, Paradex, EdgeX, Backpack, Lighter, Nado, Extended, Variational, dYdX, Jupiter, Drift, GMX)
- **One Codebase** → All Trading Operations (market data, orders, positions, WebSocket)
- **One Installation** → Full-Stack Solution (authentication, rate limiting, error handling)

---

## ✨ Key Features

### 🔌 Unified Interface
- **CCXT-style API** - Familiar interface for developers
- **Fully Async/Await** - All methods return Promises, no callbacks
- **Consistent method names** across all exchanges
- **Python aliases** available (snake_case for Python developers)

### 🌐 Multi-Exchange Support

| Exchange | Status | Markets | Auth | Notes |
|----------|--------|---------|------|-------|
| **Hyperliquid** | ✅ Production | 228 perp | EIP-712 | Full API + WebSocket |
| **EdgeX** | ✅ Production | 292 perp | StarkNet ECDSA | No REST trades¹ |
| **Paradex** | ✅ Production | 108 perp | StarkNet + JWT | Full API + WebSocket |
| **GRVT** | ✅ Production | 80 perp | API Key + EIP-712 | Sub-ms latency |
| **Backpack** | ✅ Production | 75 perp, 79 spot | ED25519 | Solana-based |
| **Lighter** | ✅ Production | 132 perp | WASM Signing | Cross-platform |
| **Nado** | ✅ Production | 23 perp, 3 spot | EIP-712 (Ink L2) | No REST trades¹ |
| **Extended** | 🟡 Mainnet Only | 94 perp | API Key | Testnet offline |
| **Variational** | 🟡 Dev | RFQ-based | API Key | No WebSocket |
| **dYdX v4** | ✅ Production | 220+ perp | Cosmos SDK | Full trading + WebSocket |
| **Jupiter Perps** | ✅ Production | 3 perp | Solana Wallet | SOL/ETH/BTC markets |
| **Drift Protocol** | ✅ Production | 30+ perp | Solana Wallet | DLOB + WebSocket |
| **GMX v2** | 🟡 Read-Only | 11 perp | On-chain | Arbitrum/Avalanche² |

> ¹ Use `watchTrades()` for real-time trade data
> ² GMX trading requires on-chain transactions via ExchangeRouter contract

### 📊 API Completion Matrix

#### Legend
- ✅ Fully implemented
- ⚠️ Partial (has limitations)
- ❌ Not implemented

#### Public API Methods
| Method | Backpack | EdgeX | Extended | GRVT | Hyperliquid | Lighter | Nado | Paradex | Variational | dYdX | Jupiter | Drift | GMX |
|--------|:--------:|:-----:|:--------:|:----:|:-----------:|:-------:|:----:|:-------:|:-----------:|:----:|:-------:|:-----:|:---:|
| fetchMarkets | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| fetchTicker | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| fetchOrderBook | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌⁵ |
| fetchTrades | ✅ | ❌¹ | ✅ | ✅ | ⚠️² | ✅ | ⚠️³ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| fetchOHLCV | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| fetchFundingRate | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| fetchFundingRateHistory | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |

#### Trading Methods
| Method | Backpack | EdgeX | Extended | GRVT | Hyperliquid | Lighter | Nado | Paradex | Variational | dYdX | Jupiter | Drift | GMX |
|--------|:--------:|:-----:|:--------:|:----:|:-----------:|:-------:|:----:|:-------:|:-----------:|:----:|:-------:|:-----:|:---:|
| createOrder | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌⁶ |
| cancelOrder | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌⁶ |
| cancelAllOrders | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌⁶ |
| createBatchOrders | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ⚠️⁴ | ✅ | ❌ | ❌ | ❌ |
| cancelBatchOrders | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ⚠️⁴ | ✅ | ❌ | ❌ | ❌ |
| editOrder | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

#### Account Methods
| Method | Backpack | EdgeX | Extended | GRVT | Hyperliquid | Lighter | Nado | Paradex | Variational | dYdX | Jupiter | Drift | GMX |
|--------|:--------:|:-----:|:--------:|:----:|:-----------:|:-------:|:----:|:-------:|:-----------:|:----:|:-------:|:-----:|:---:|
| fetchPositions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌⁷ |
| fetchBalance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌⁷ |
| fetchOrderHistory | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| fetchMyTrades | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| fetchUserFees | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| fetchPortfolio | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| setLeverage | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌⁸ |
| setMarginMode | ❌ | ❌ | ✅ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

#### WebSocket Methods
| Method | Backpack | EdgeX | Extended | GRVT | Hyperliquid | Lighter | Nado | Paradex | Variational | dYdX | Jupiter | Drift | GMX |
|--------|:--------:|:-----:|:--------:|:----:|:-----------:|:-------:|:----:|:-------:|:-----------:|:----:|:-------:|:-----:|:---:|
| watchOrderBook | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| watchTrades | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| watchTicker | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| watchPositions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| watchOrders | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| watchBalance | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| watchMyTrades | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| watchFundingRate | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

#### Completion Summary by Adapter

| Adapter | Public | Trading | Account | WebSocket | **Total** |
|---------|:------:|:-------:|:-------:|:---------:|:---------:|
| **Extended** | 6/7 (86%) | 6/6 (100%) | 8/8 (100%) | 7/8 (88%) | **93%** |
| **dYdX v4** | 7/7 (100%) | 5/6 (83%) | 5/8 (63%) | 7/8 (88%) | **83%** |
| **Hyperliquid** | 6/7 (86%) | 5/6 (83%) | 7/8 (88%) | 6/8 (75%) | **83%** |
| **Drift** | 6/7 (86%) | 3/6 (50%) | 5/8 (63%) | 7/8 (88%) | **72%** |
| **GRVT** | 6/7 (86%) | 4/6 (67%) | 5/8 (63%) | 6/8 (75%) | **72%** |
| **Paradex** | 5/7 (71%) | 3/6 (50%) | 6/8 (75%) | 7/8 (88%) | **71%** |
| **Backpack** | 5/7 (71%) | 3/6 (50%) | 5/8 (63%) | 6/8 (75%) | **65%** |
| **Lighter** | 5/7 (71%) | 3/6 (50%) | 5/8 (63%) | 6/8 (75%) | **65%** |
| **Nado** | 4/7 (57%) | 4/6 (67%) | 5/8 (63%) | 5/8 (63%) | **62%** |
| **EdgeX** | 4/7 (57%) | 5/6 (83%) | 4/8 (50%) | 6/8 (75%) | **62%** |
| **Jupiter** | 5/7 (71%) | 3/6 (50%) | 3/8 (38%) | 0/8 (0%) | **38%** |
| **Variational** | 4/7 (57%) | 5/6 (83%) | 4/8 (50%) | 0/8 (0%) | **45%** |
| **GMX v2** | 5/7 (71%) | 0/6 (0%) | 0/8 (0%) | 0/8 (0%) | **17%** |

> **Notes:**
> - ¹ EdgeX: No REST endpoint for trades
> - ² Hyperliquid: REST returns empty, use WebSocket
> - ³ Nado: REST available but limited, prefer WebSocket
> - ⁴ Variational: Batch operations are emulated (sequential)
> - ⁵ GMX: AMM-based, no traditional orderbook
> - ⁶ GMX: Trading requires on-chain transactions via ExchangeRouter
> - ⁷ GMX: Requires subgraph or RPC integration
> - ⁸ dYdX/Jupiter/Drift/GMX: Leverage is per-position at order time

### ⚡ Enterprise Features
- **WebSocket streaming** - Real-time data with backpressure handling
- **Auto-reconnection** - Exponential backoff with subscription recovery
- **Rate limiting** - Exchange-specific limits respected automatically
- **Retry logic** - Automatic retry with exponential backoff
- **Circuit breaker** - Fault tolerance with automatic recovery
- **Request tracing** - Correlation IDs for distributed debugging
- **Type safety** - Runtime validation (Zod) + TypeScript strict mode
- **Health checks** - Prometheus metrics, structured JSON logging
- **2400+ tests** - 100% pass rate, coverage thresholds enforced

---

## 🚀 Quick Start

### Installation

```bash
npm install pd-aio-sdk
# or
yarn add pd-aio-sdk
# or
pnpm add pd-aio-sdk
```

### Basic Usage

```typescript
import { createExchange } from 'pd-aio-sdk';

// Initialize adapter (no auth needed for public API)
const exchange = createExchange('hyperliquid', { testnet: true });
await exchange.initialize();

// Fetch market data (Public API - no credentials needed)
const markets = await exchange.fetchMarkets();
const orderBook = await exchange.fetchOrderBook('BTC/USDT:USDT');
const ticker = await exchange.fetchTicker('BTC/USDT:USDT');

console.log(`Found ${markets.length} markets`);
console.log(`BTC price: ${ticker.last}`);
```

### With Authentication (for Trading)

```typescript
import { createExchange } from 'pd-aio-sdk';

// Initialize with credentials for private API
const exchange = createExchange('hyperliquid', {
  privateKey: process.env.HYPERLIQUID_PRIVATE_KEY,
  testnet: true
});

await exchange.initialize();

// Place an order (requires authentication)
const order = await exchange.createOrder({
  symbol: 'BTC/USDT:USDT',
  type: 'limit',
  side: 'buy',
  amount: 0.1,
  price: 50000
});

// Check positions and balance
const positions = await exchange.fetchPositions();
const balances = await exchange.fetchBalance();

// Cancel order
await exchange.cancelOrder(order.id, 'BTC/USDT:USDT');

// Cleanup
await exchange.disconnect();
```

---

## 📚 Exchange Setup

### Quick Reference

```typescript
// Hyperliquid (EIP-712)
const hl = createExchange('hyperliquid', {
  privateKey: process.env.HYPERLIQUID_PRIVATE_KEY,
  testnet: true
});

// EdgeX (StarkNet ECDSA)
const edgex = createExchange('edgex', {
  starkPrivateKey: process.env.EDGEX_STARK_PRIVATE_KEY
});

// Paradex (StarkNet + JWT)
const paradex = createExchange('paradex', {
  starkPrivateKey: process.env.PARADEX_STARK_PRIVATE_KEY,
  testnet: true
});

// GRVT (API Key + EIP-712)
const grvt = createExchange('grvt', {
  apiKey: process.env.GRVT_API_KEY,
  testnet: false
});

// Backpack (ED25519)
const backpack = createExchange('backpack', {
  apiKey: process.env.BACKPACK_API_KEY,
  apiSecret: process.env.BACKPACK_API_SECRET
});

// Lighter (WASM Signing) - cross-platform, no native dependencies
const lighter = createExchange('lighter', {
  apiPrivateKey: process.env.LIGHTER_PRIVATE_KEY,
  testnet: true
});

// Nado (EIP-712 on Ink L2)
const nado = createExchange('nado', {
  privateKey: process.env.NADO_PRIVATE_KEY,
  testnet: true
});

// Extended (API Key) - mainnet only
const extended = createExchange('extended', {
  apiKey: process.env.EXTENDED_API_KEY
});

// Variational (API Key) - no WebSocket
const variational = createExchange('variational', {
  apiKey: process.env.VARIATIONAL_API_KEY,
  apiSecret: process.env.VARIATIONAL_API_SECRET,
  testnet: true
});

// dYdX v4 (Cosmos SDK)
const dydx = createExchange('dydx', {
  mnemonic: process.env.DYDX_MNEMONIC,  // 24-word seed phrase
  testnet: true
});

// Jupiter Perps (Solana)
const jupiter = createExchange('jupiter', {
  walletAddress: process.env.JUPITER_WALLET_ADDRESS,
  privateKey: process.env.JUPITER_PRIVATE_KEY,  // Optional, for trading
});

// Drift Protocol (Solana)
const drift = createExchange('drift', {
  walletAddress: process.env.DRIFT_WALLET_ADDRESS,
  privateKey: process.env.DRIFT_PRIVATE_KEY,  // Optional, for trading
});

// GMX v2 (Arbitrum/Avalanche) - read-only via REST
const gmx = createExchange('gmx', {
  chain: 'arbitrum',  // or 'avalanche'
  walletAddress: process.env.GMX_WALLET_ADDRESS,  // Optional, for positions
});
```

### Exchange-Specific Notes

| Exchange | Special Requirements |
|----------|---------------------|
| **Lighter** | WASM-based signing, works cross-platform without native dependencies |
| **Extended** | Testnet offline, mainnet only |
| **Variational** | RFQ-based, no WebSocket support |
| **EdgeX/Nado** | Use `watchTrades()` instead of `fetchTrades()` |
| **dYdX v4** | Requires 24-word Cosmos mnemonic for trading |
| **Jupiter/Drift** | Solana wallet required; private key for trading |
| **GMX v2** | Read-only REST API; trading requires @gmx-io/sdk |

---

## 🔧 Configuration

### Environment Variables

```bash
# Hyperliquid
HYPERLIQUID_PRIVATE_KEY=0x...     # 64 hex chars (EVM private key)

# EdgeX
EDGEX_STARK_PRIVATE_KEY=0x...     # StarkNet private key

# Paradex
PARADEX_STARK_PRIVATE_KEY=0x...   # StarkNet private key

# GRVT
GRVT_API_KEY=your_api_key

# Backpack
BACKPACK_API_KEY=your_api_key
BACKPACK_API_SECRET=base64_key    # ED25519 private key (base64)

# Lighter
LIGHTER_PRIVATE_KEY=0x...         # 64 hex chars

# Nado
NADO_PRIVATE_KEY=0x...            # EVM private key

# Extended (mainnet only)
EXTENDED_API_KEY=your_api_key

# Variational
VARIATIONAL_API_KEY=your_api_key
VARIATIONAL_API_SECRET=your_secret

# dYdX v4
DYDX_MNEMONIC="word1 word2 ... word24"  # 24-word Cosmos seed phrase

# Jupiter Perps
JUPITER_WALLET_ADDRESS=your_solana_address
JUPITER_PRIVATE_KEY=base58_private_key   # Optional, for trading

# Drift Protocol
DRIFT_WALLET_ADDRESS=your_solana_address
DRIFT_PRIVATE_KEY=base58_private_key     # Optional, for trading

# GMX v2
GMX_CHAIN=arbitrum                        # or 'avalanche'
GMX_WALLET_ADDRESS=0x...                  # Optional, for position data
```

---

## 📖 Advanced Examples

### OHLCV (Candlestick) Data

```typescript
import { createExchange } from 'pd-aio-sdk';

const exchange = createExchange('hyperliquid', { testnet: true });
await exchange.initialize();

// Fetch 1-hour candles for the last 24 hours
const candles = await exchange.fetchOHLCV('BTC/USDT:USDT', '1h', {
  limit: 24
});

for (const [timestamp, open, high, low, close, volume] of candles) {
  console.log(`${new Date(timestamp).toISOString()}: O=${open} H=${high} L=${low} C=${close} V=${volume}`);
}

// Supported timeframes: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M
// Currently available on: Hyperliquid, GRVT, dYdX, Drift, GMX
```

### WebSocket Streaming

```typescript
import { createExchange } from 'pd-aio-sdk';

const exchange = createExchange('hyperliquid', {
  privateKey: process.env.PRIVATE_KEY,
  testnet: true
});

await exchange.initialize();

// Stream order book updates
for await (const orderBook of exchange.watchOrderBook('BTC/USDT:USDT')) {
  console.log('Best bid:', orderBook.bids[0]);
  console.log('Best ask:', orderBook.asks[0]);
}

// Stream position updates (requires auth)
for await (const positions of exchange.watchPositions()) {
  console.log('Positions updated:', positions);
}

// Stream your own trades (requires auth)
for await (const trade of exchange.watchMyTrades('BTC/USDT:USDT')) {
  console.log('My trade:', trade.side, trade.amount, '@', trade.price);
}
```

### Multi-Exchange Example

```typescript
import { createExchange } from 'pd-aio-sdk';

// Initialize multiple exchanges (public API - no auth needed)
const hyperliquid = createExchange('hyperliquid', { testnet: true });
const edgex = createExchange('edgex', {});
const nado = createExchange('nado', { testnet: true });

await Promise.all([
  hyperliquid.initialize(),
  edgex.initialize(),
  nado.initialize()
]);

// Fetch markets from all exchanges
const [hlMarkets, edgexMarkets, nadoMarkets] = await Promise.all([
  hyperliquid.fetchMarkets(),
  edgex.fetchMarkets(),
  nado.fetchMarkets()
]);

console.log(`Hyperliquid: ${hlMarkets.length} markets`);
console.log(`EdgeX: ${edgexMarkets.length} markets`);
console.log(`Nado: ${nadoMarkets.length} markets`);
```

### Error Handling

```typescript
import { createExchange, PerpDEXError } from 'pd-aio-sdk';

const exchange = createExchange('hyperliquid', { testnet: true });
await exchange.initialize();

try {
  // This will throw if no credentials provided
  await exchange.fetchBalance();
} catch (error) {
  if (error instanceof PerpDEXError) {
    console.log('Error code:', error.code);      // 'MISSING_CREDENTIALS'
    console.log('Exchange:', error.exchange);     // 'hyperliquid'
    console.log('Message:', error.message);
    console.log('Correlation ID:', error.correlationId); // For tracing
  }
}
```

### Metrics & Monitoring

```typescript
import { createExchange } from 'pd-aio-sdk';

const exchange = createExchange('hyperliquid', { testnet: true });
await exchange.initialize();

// Get API metrics
const metrics = exchange.getMetrics();
console.log(`Total requests: ${metrics.totalRequests}`);
console.log(`Success rate: ${(metrics.successRate * 100).toFixed(2)}%`);
console.log(`Avg latency: ${metrics.averageLatency.toFixed(2)}ms`);

// Get circuit breaker status
const cbState = exchange.getCircuitBreakerState();
console.log(`Circuit breaker: ${cbState}`); // 'CLOSED', 'OPEN', or 'HALF_OPEN'

// Health check
const health = await exchange.healthCheck();
console.log(`Status: ${health.status}`); // 'healthy', 'degraded', or 'unhealthy'
console.log(`API latency: ${health.api.latency}ms`);
```

---

## 🔧 Lighter Setup

Lighter uses WASM-based transaction signing that works cross-platform without any native dependencies. The `@oraichain/lighter-ts-sdk` package is included as a dependency.

### Basic Setup

```typescript
import { createExchange } from 'pd-aio-sdk';

const lighter = createExchange('lighter', {
  apiPrivateKey: '0x...',  // Your Lighter private key
  testnet: true,
});

await lighter.initialize();

// Verify WASM signing is available
console.log('WASM Signing:', lighter.hasWasmSigning); // Should be true

// Full trading support - no additional setup required
const order = await lighter.createOrder({
  symbol: 'BTC/USDT:USDT',
  side: 'buy',
  type: 'limit',
  amount: 0.01,
  price: 50000,
});
```

### Features
- **Cross-platform**: Works on macOS, Linux, Windows without native binaries
- **No Python required**: Pure TypeScript/WASM implementation
- **Full trading support**: Orders, cancellations, withdrawals all work out of the box

---

## 🧪 Testing

### Run Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Specific exchange
npm test -- hyperliquid
```

### Test Results

```
✅ 2400+ tests passing (100% pass rate)
✅ 90+ test suites
✅ Coverage thresholds enforced (60%+)
```

---

## 🏗️ Architecture

### Pattern A: Full-Featured Architecture

All **13 exchange adapters** follow **Pattern A** (Full-Featured) architecture:

```
src/adapters/{exchange}/
├── {Exchange}Adapter.ts       # Main adapter implementation
├── {Exchange}Normalizer.ts    # Data transformation
├── auth.ts                    # Authentication (if complex)
├── utils.ts                   # Helper functions
├── constants.ts               # Configuration
├── types.ts                   # TypeScript types
└── index.ts                   # Public API
```

### Core Components

- **Adapters** - Exchange-specific implementations
- **Normalizers** - Data transformation (CCXT format ↔ Exchange format)
- **Core** - Rate limiting, retry logic, circuit breaker, logging with correlation IDs
- **WebSocket** - Connection management, auto-reconnection, backpressure handling
- **Validation** - Zod schemas for runtime type checking
- **Types** - Unified data structures, error hierarchy
- **Monitoring** - Prometheus metrics, health checks

**Learn More**: See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation

---

## 📦 Build & Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode
npm run dev

# Lint
npm run lint

# Type check
npm run typecheck
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 🔗 Links

### Documentation
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **API Reference**: [API.md](./API.md)
- **Adapter Guide**: [ADAPTER_GUIDE.md](./ADAPTER_GUIDE.md)
- **Contributing**: [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Korean Docs**: [한국어 문서](./README.ko.md)

### Resources
- **Exchange Guides**: [docs/guides/](./docs/guides/)
- **Examples**: [examples/](./examples/)

---

## 🙏 Acknowledgments

- Inspired by [CCXT](https://github.com/ccxt/ccxt) unified API design
- Built with [ethers.js](https://github.com/ethers-io/ethers.js), [starknet.js](https://github.com/starknet-io/starknet.js)

---

<div align="center">

**Built with ❤️ for the DeFi community**

[⭐ Star us on GitHub](https://github.com/0xarkstar/PD-AIO-SDK) | [📦 npm Package](https://www.npmjs.com/package/pd-aio-sdk)

</div>
