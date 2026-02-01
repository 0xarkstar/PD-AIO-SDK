# PD AIO SDK

> **P**erp **D**EX **A**ll-**I**n-**O**ne SDK - Unified TypeScript SDK for Decentralized Perpetual Exchanges

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-1982%20passed-brightgreen)](https://github.com/0xarkstar/PD-AIO-SDK)
[![npm version](https://img.shields.io/badge/npm-v0.2.0-blue)](https://www.npmjs.com/package/pd-aio-sdk)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

**[한국어 문서](./README.ko.md)** | English

---

## 🎯 What is PD AIO SDK?

**PD AIO SDK** (Perp DEX All-In-One SDK) is a production-ready, unified TypeScript SDK that lets you trade on **9 decentralized perpetual exchanges** through a single, consistent interface. No more learning different APIs for each exchange - write once, trade anywhere.

### Why "All-In-One"?

- **One Interface** → 9 Exchanges (Hyperliquid, GRVT, Paradex, EdgeX, Backpack, Lighter, Nado, Extended, Variational)
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

| Exchange | Status | Perp | Spot | Public API | Private API |
|----------|--------|------|------|------------|-------------|
| **Hyperliquid** | ✅ Production Ready | 228 | - | ✅ Full | ✅ Full |
| **EdgeX** | ✅ Production Ready | 292 | - | ⚠️ No REST Trades¹ | ✅ Full |
| **Paradex** | ✅ Production Ready | 108 | - | ✅ Full | ✅ Full (StarkNet) |
| **GRVT** | ✅ Production Ready | 80 | - | ✅ Full | ✅ Full |
| **Backpack** | ✅ Production Ready | 75 | 79 | ✅ Full | ✅ Full |
| **Lighter** | ✅ Production Ready | 132 | - | ✅ Full | ✅ Full (Native FFI) |
| **Nado** | ✅ Production Ready | 23 | 3 | ⚠️ No REST Trades¹ | ⚠️ No fetchMyTrades |
| **Extended** | 🟡 Mainnet Only | - | - | ✅ Full | ✅ Full |
| **Variational** | 🟡 In Development | RFQ | - | ✅ Full | ✅ Full (No WS) |

> ¹ Use WebSocket (`watchTrades`) for real-time trade data

### 📊 API Completion Matrix

#### Legend
- ✅ Fully implemented
- ⚠️ Partial (has limitations)
- ❌ Not implemented

#### Public API Methods
| Method | Backpack | EdgeX | Extended | GRVT | Hyperliquid | Lighter | Nado | Paradex | Variational |
|--------|:--------:|:-----:|:--------:|:----:|:-----------:|:-------:|:----:|:-------:|:-----------:|
| fetchMarkets | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| fetchTicker | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| fetchOrderBook | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| fetchTrades | ✅ | ❌¹ | ✅ | ✅ | ⚠️² | ✅ | ⚠️³ | ✅ | ❌ |
| fetchOHLCV | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| fetchFundingRate | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| fetchFundingRateHistory | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |

#### Trading Methods
| Method | Backpack | EdgeX | Extended | GRVT | Hyperliquid | Lighter | Nado | Paradex | Variational |
|--------|:--------:|:-----:|:--------:|:----:|:-----------:|:-------:|:----:|:-------:|:-----------:|
| createOrder | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| cancelOrder | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| cancelAllOrders | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| createBatchOrders | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ⚠️⁴ |
| cancelBatchOrders | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ⚠️⁴ |
| editOrder | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

#### Account Methods
| Method | Backpack | EdgeX | Extended | GRVT | Hyperliquid | Lighter | Nado | Paradex | Variational |
|--------|:--------:|:-----:|:--------:|:----:|:-----------:|:-------:|:----:|:-------:|:-----------:|
| fetchPositions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| fetchBalance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| fetchOrderHistory | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| fetchMyTrades | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| fetchUserFees | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| fetchPortfolio | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| setLeverage | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| setMarginMode | ❌ | ❌ | ✅ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ |

#### WebSocket Methods
| Method | Backpack | EdgeX | Extended | GRVT | Hyperliquid | Lighter | Nado | Paradex | Variational |
|--------|:--------:|:-----:|:--------:|:----:|:-----------:|:-------:|:----:|:-------:|:-----------:|
| watchOrderBook | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| watchTrades | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| watchTicker | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| watchPositions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| watchOrders | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| watchBalance | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| watchMyTrades | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| watchFundingRate | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

#### Completion Summary by Adapter

| Adapter | Public | Trading | Account | WebSocket | **Total** |
|---------|:------:|:-------:|:-------:|:---------:|:---------:|
| **Extended** | 6/7 (86%) | 6/6 (100%) | 8/8 (100%) | 7/8 (88%) | **93%** |
| **Hyperliquid** | 6/7 (86%) | 5/6 (83%) | 7/8 (88%) | 6/8 (75%) | **83%** |
| **GRVT** | 6/7 (86%) | 4/6 (67%) | 5/8 (63%) | 6/8 (75%) | **72%** |
| **Paradex** | 5/7 (71%) | 3/6 (50%) | 6/8 (75%) | 7/8 (88%) | **71%** |
| **Backpack** | 5/7 (71%) | 3/6 (50%) | 5/8 (63%) | 6/8 (75%) | **65%** |
| **Lighter** | 5/7 (71%) | 3/6 (50%) | 5/8 (63%) | 6/8 (75%) | **65%** |
| **Nado** | 4/7 (57%) | 4/6 (67%) | 5/8 (63%) | 5/8 (63%) | **62%** |
| **EdgeX** | 4/7 (57%) | 3/6 (50%) | 4/8 (50%) | 6/8 (75%) | **58%** |
| **Variational** | 4/7 (57%) | 5/6 (83%) | 6/8 (75%) | 0/8 (0%) | **52%** |

#### Notes
¹ EdgeX: Use WebSocket (`watchTrades`) instead - no REST endpoint available
² Hyperliquid: Returns empty array from REST API, use WebSocket for real-time trades
³ Nado: Requires WebSocket for real-time trades
⁴ Variational: Emulated batch operations (sequential execution)

### 🔐 Production-Grade Security
- **EIP-712 signatures** (Hyperliquid, GRVT, Nado)
- **StarkNet ECDSA + SHA3** (EdgeX)
- **StarkNet signatures** (Paradex)
- **ED25519** (Backpack)
- **API Key authentication** (Lighter, Extended)
- **Secure credential management** with validation

### ⚡ Enterprise Features
- **WebSocket streaming** - Real-time order books, positions, trades with backpressure handling
- **Auto-reconnection** - Exponential backoff with subscription recovery
- **Rate limiting** - Exchange-specific limits respected automatically
- **Smart caching** - Market data caching with configurable TTL
- **Retry logic** - Automatic retry with exponential backoff
- **Circuit breaker** - Fault tolerance with automatic recovery
- **Request tracing** - Correlation IDs for distributed debugging
- **Type safety** - Runtime validation (Zod) + TypeScript strict mode
- **OHLCV support** - Candlestick data (1m to 1M timeframes)

### 📊 Developer Experience
- **Pattern A Architecture** - All 9 adapters follow standardized structure
- **1982+ tests** - 100% pass rate, production-ready
- **Structured logging** - JSON logs with sensitive data masking + correlation IDs
- **Health checks** - Built-in system monitoring with Prometheus metrics
- **Comprehensive docs** - English + Korean documentation
- **TypeScript strict mode** - Full type safety
- **Validation middleware** - Zod schemas for all request/response types
- **Examples included** - 10+ ready-to-use examples

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

## 📚 Supported Exchanges

### ✅ Production Ready

#### Hyperliquid
```typescript
const exchange = createExchange('hyperliquid', {
  privateKey: process.env.HYPERLIQUID_PRIVATE_KEY, // Optional for public API
  testnet: true
});
```
- **Markets**: 228 perp
- **Auth**: EIP-712 signatures
- **Features**: 200k orders/sec, HIP-3 ecosystem, full WebSocket support

#### EdgeX
```typescript
const exchange = createExchange('edgex', {
  starkPrivateKey: process.env.EDGEX_STARK_PRIVATE_KEY, // Optional for public API
});
```
- **Markets**: 292 perp
- **Auth**: SHA3-256 + ECDSA signatures
- **Note**: fetchTrades only via WebSocket (no REST endpoint)

#### Nado
```typescript
const exchange = createExchange('nado', {
  privateKey: process.env.NADO_PRIVATE_KEY, // Optional for public API
  testnet: true
});
```
- **Markets**: 23 perp + 3 spot
- **Auth**: EIP-712 signatures on Ink L2 (by Kraken)

#### GRVT
```typescript
const exchange = createExchange('grvt', {
  apiKey: process.env.GRVT_API_KEY, // Optional for public API
  testnet: false
});
```
- **Markets**: 80 perp
- **Auth**: API Key + EIP-712 signatures
- **Features**: Sub-millisecond latency, hybrid CEX/DEX architecture
- **Leverage**: Up to 100x
- **WebSocket**: Real-time orderbook, trades, positions, orders

#### Backpack
```typescript
const exchange = createExchange('backpack', {
  apiKey: process.env.BACKPACK_API_KEY, // Optional for public API
  apiSecret: process.env.BACKPACK_API_SECRET,
  testnet: false
});
```
- **Markets**: 75 perp + 79 spot
- **Auth**: ED25519 signatures
- **Features**: Solana-based, full REST API + WebSocket
- **Leverage**: Up to 20x for perpetuals

#### Lighter
```typescript
const exchange = createExchange('lighter', {
  apiPrivateKey: process.env.LIGHTER_PRIVATE_KEY, // Optional for public API
  testnet: true
});
```
- **Markets**: 132 perp
- **Auth**: Native FFI signing (koffi + C library)
- **Features**: Full trading support, WebSocket streaming
- **Setup**: Requires native library from `lighter-sdk` Python package (see [Setup Guide](#lighter-native-library-setup))

#### Paradex
```typescript
const exchange = createExchange('paradex', {
  starkPrivateKey: process.env.PARADEX_STARK_PRIVATE_KEY, // Optional for public API
  testnet: true
});
```
- **Markets**: 108 perp
- **Auth**: StarkNet ECDSA signatures + JWT
- **Features**: Full REST API + WebSocket streaming
- **WebSocket**: Real-time orderbook, trades, ticker, positions, orders, balance, user trades

### 🟡 Partial Support

#### Extended
```typescript
const exchange = createExchange('extended', {
  apiKey: process.env.EXTENDED_API_KEY,
  // Optional: StarkNet integration
  starknetPrivateKey: process.env.STARKNET_PRIVATE_KEY,
  starknetAccountAddress: process.env.STARKNET_ACCOUNT_ADDRESS,
});
```
- **Status**: Testnet not operational, mainnet only
- **Features**: Full REST API + WebSocket streaming
- **WebSocket**: Real-time orderbook, trades, ticker, positions, orders, balance, funding rates
- **Leverage**: Up to 100x
- **StarkNet**: Optional on-chain integration for advanced operations

### 🟡 In Development

#### Variational
```typescript
const exchange = createExchange('variational', {
  apiKey: process.env.VARIATIONAL_API_KEY,
  apiSecret: process.env.VARIATIONAL_API_SECRET,
  testnet: true,
});
```
- **Type**: RFQ-based perpetual DEX (Request For Quote)
- **Trading**: ✅ createOrder, cancelOrder, cancelAllOrders
- **Account**: ✅ fetchPositions, fetchBalance, fetchOrderHistory, fetchMyTrades
- **Public**: ✅ fetchMarkets, fetchTicker, fetchOrderBook, fetchFundingRate
- **WebSocket**: ❌ Not available (API under development)
- **Note**: RFQ model - quotes provided at multiple notional sizes ($1k, $100k, $1M)

---

## 🔧 Configuration

### Environment Variables

```bash
# ============================================
# Hyperliquid (EIP-712) - ✅ Production Ready
# ============================================
HYPERLIQUID_PRIVATE_KEY=0x...  # 64 hex characters
HYPERLIQUID_TESTNET=true

# ============================================
# EdgeX (SHA3 + ECDSA) - ✅ Production Ready
# ============================================
EDGEX_STARK_PRIVATE_KEY=0x...  # StarkNet private key

# ============================================
# Nado (EIP-712 on Ink L2) - ✅ Production Ready
# ============================================
NADO_PRIVATE_KEY=0x...  # EVM private key
NADO_TESTNET=true

# ============================================
# GRVT (API Key + EIP-712) - ✅ Production Ready
# ============================================
GRVT_API_KEY=your_api_key
GRVT_PRIVATE_KEY=0x...  # Optional: for EIP-712 order signing
GRVT_TESTNET=false

# ============================================
# Backpack (ED25519) - ✅ Production Ready
# ============================================
BACKPACK_API_KEY=your_api_key
BACKPACK_API_SECRET=base64_ed25519_private_key
BACKPACK_TESTNET=false

# ============================================
# Lighter (Native FFI) - ✅ Production Ready
# ============================================
LIGHTER_PRIVATE_KEY=0x...  # 64 hex characters
LIGHTER_TESTNET=true
# Note: Requires native library setup (see below)

# ============================================
# Paradex (StarkNet) - 🟡 Limited
# ============================================
PARADEX_STARK_PRIVATE_KEY=0x...  # StarkNet private key
PARADEX_TESTNET=true

# ============================================
# Extended (API Key) - 🟡 Mainnet Only
# ============================================
EXTENDED_API_KEY=your_api_key
# Note: testnet (Sepolia) is not operational
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
// Currently available on: Hyperliquid, GRVT
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

## 🔧 Lighter Native Library Setup

Lighter requires a native C library for transaction signing. Follow these steps to enable full trading functionality:

### Step 1: Install Python SDK

```bash
pip3 install lighter-sdk
```

### Step 2: Locate and Copy Native Library

```bash
# Find the library location
python3 -c "import lighter; print(lighter.__file__)"
# Output: /path/to/site-packages/lighter/__init__.py

# Copy libraries to your project
cp /path/to/site-packages/lighter/signers/* native/lighter/
```

### Step 3: Remove macOS Quarantine (if needed)

```bash
xattr -d com.apple.quarantine native/lighter/*.dylib
```

### Step 4: Install koffi (FFI library)

```bash
npm install koffi
```

### Verify Installation

```typescript
import { createExchange } from 'pd-aio-sdk';

const lighter = createExchange('lighter', {
  apiPrivateKey: '0x...',
  testnet: true,
});

await lighter.initialize();
console.log('FFI Signing:', lighter.hasFFISigning); // Should be true
```

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
✅ 1982+ tests passing (100% pass rate)
✅ 70 test suites
✅ Integration tests: All passing
✅ Unit tests: All passing
✅ Coverage thresholds enforced
```

### API Verification Results (2026-02-01)

| Exchange | Markets | Ticker | OrderBook | OHLCV | FundingRate | Status |
|----------|---------|--------|-----------|-------|-------------|--------|
| **Hyperliquid** | ✅ 228 | ✅ | ✅ | ✅ | ✅ | Production Ready |
| **GRVT** | ✅ 80 | ✅ | ✅ | ✅ | ✅ | Production Ready |
| **EdgeX** | ✅ 292 | ✅ | ✅ | ❌ | ✅ | Production Ready |
| **Nado** | ✅ 26 | ✅ | ✅ | ❌ | ✅ | Production Ready |
| **Backpack** | ✅ 154 | ✅ | ✅ | ❌ | ✅ | Production Ready |
| **Lighter** | ✅ 132 | ✅ | ✅ | ❌ | - | Production Ready |
| **Paradex** | ✅ 108 | ❌ JWT | ❌ JWT | ❌ | - | Limited |
| **Extended** | ✅ 0 | - | - | ❌ | - | Mainnet Only |
| **Variational** | ✅ | ✅ | ✅ | ❌ | ✅ | In Development |

---

## 🏗️ Architecture

### Pattern A: Full-Featured Architecture

All **9 exchange adapters** follow **Pattern A** (Full-Featured) architecture:

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
