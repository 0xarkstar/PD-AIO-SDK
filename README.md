# PD AIO SDK

> **P**erp **D**EX **A**ll-**I**n-**O**ne SDK - Unified TypeScript SDK for Decentralized Perpetual Exchanges

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-2246%20passed-brightgreen)](https://github.com/0xarkstar/PD-AIO-SDK)
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

| Exchange | Status | Markets | Public API | Private API |
|----------|--------|---------|------------|-------------|
| **Hyperliquid** | ✅ Production Ready | 206 | ✅ Full | ✅ Full |
| **EdgeX** | ✅ Production Ready | 292 | ✅ Full | ✅ Full |
| **Nado** | ✅ Production Ready | 26 | ✅ Full | ✅ Full |
| **Lighter** | 🟡 Public API Only | 3 | ✅ Full | ⚠️ Requires Official SDK |
| **Paradex** | 🟡 Limited | 7 | ✅ Markets Only | ⚠️ JWT Required |
| **Extended** | 🟡 Mainnet Only | 0 | ✅ Works | - |
| **GRVT** | ⚠️ Testing | - | ⚠️ | ⚠️ |
| **Backpack** | 🔴 Network Issues | - | ❌ | ❌ |
| **Variational** | 🔴 Alpha (RFQ) | - | ❌ | ❌ |

### 🔐 Production-Grade Security
- **EIP-712 signatures** (Hyperliquid, GRVT, Nado)
- **StarkNet ECDSA + SHA3** (EdgeX)
- **StarkNet signatures** (Paradex)
- **ED25519** (Backpack)
- **API Key authentication** (Lighter, Extended)
- **Secure credential management** with validation

### ⚡ Enterprise Features
- **WebSocket streaming** - Real-time order books, positions, trades
- **Auto-reconnection** - Exponential backoff with subscription recovery
- **Rate limiting** - Exchange-specific limits respected automatically
- **Smart caching** - Market data caching with configurable TTL
- **Retry logic** - Automatic retry with exponential backoff
- **Type safety** - Runtime validation (Zod) + TypeScript strict mode

### 📊 Developer Experience
- **Pattern A Architecture** - All 9 adapters follow standardized structure
- **2246 tests** - 100% pass rate, production-ready
- **Structured logging** - JSON logs with sensitive data masking
- **Health checks** - Built-in system monitoring
- **Comprehensive docs** - English + Korean documentation
- **TypeScript strict mode** - Full type safety
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
- **Markets**: 206 perpetual contracts
- **Auth**: EIP-712 signatures
- **Features**: 200k orders/sec, HIP-3 ecosystem, full WebSocket support

#### EdgeX
```typescript
const exchange = createExchange('edgex', {
  starkPrivateKey: process.env.EDGEX_STARK_PRIVATE_KEY, // Optional for public API
});
```
- **Markets**: 292 perpetual contracts
- **Auth**: SHA3-256 + ECDSA signatures
- **Note**: fetchTrades only via WebSocket (no REST endpoint)

#### Nado
```typescript
const exchange = createExchange('nado', {
  privateKey: process.env.NADO_PRIVATE_KEY, // Optional for public API
  testnet: true
});
```
- **Markets**: 26 perpetual contracts
- **Auth**: EIP-712 signatures on Ink L2 (by Kraken)

### 🟡 Partial Support

#### Lighter
```typescript
const exchange = createExchange('lighter', { testnet: true });
```
- **Markets**: 3 perpetual contracts (BTC, ETH, SOL)
- **Public API**: ✅ fetchMarkets, fetchTicker, fetchOrderBook
- **Private API**: ❌ Requires official `lighter-sdk` (SignerClient-based auth)
- **Reference**: https://github.com/elliottech/lighter-python

#### Paradex
```typescript
const exchange = createExchange('paradex', { testnet: true });
```
- **Markets**: 7 perpetual contracts
- **Public API**: ✅ fetchMarkets only
- **Ticker/OrderBook**: Requires JWT authentication (Paradex-specific limitation)
- **Private API**: Requires StarkNet signatures + JWT

#### Extended
```typescript
const exchange = createExchange('extended', {
  apiKey: process.env.EXTENDED_API_KEY
});
```
- **Status**: Testnet not operational, mainnet only
- **Markets**: Currently returning 0 (service status unclear)

### 🔴 Not Production Ready

| Exchange | Issue | Notes |
|----------|-------|-------|
| **GRVT** | URL update needed | Hybrid CEX/DEX architecture |
| **Backpack** | Network connectivity | Solana-based |
| **Variational** | RFQ-based, API in development | Not standard orderbook |

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
# Lighter - 🟡 Public API Only
# ============================================
# Note: Private API requires official lighter-sdk
LIGHTER_TESTNET=true

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

// Stream trades
for await (const trade of exchange.watchTrades('BTC/USDT:USDT')) {
  console.log('New trade:', trade);
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
  }
}
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
✅ 2246 tests passing (100% pass rate)
✅ 79 test suites
✅ Integration tests: All passing
✅ Unit tests: All passing
```

### API Verification Results (2026-01-31)

| Exchange | Markets | Ticker | OrderBook | FundingRate | Status |
|----------|---------|--------|-----------|-------------|--------|
| **Hyperliquid** | ✅ 206 | ✅ | ✅ | ✅ | Production Ready |
| **EdgeX** | ✅ 292 | ✅ | ✅ | ✅ | Production Ready |
| **Nado** | ✅ 26 | ✅ | ✅ | ✅ | Production Ready |
| **Lighter** | ✅ 3 | ✅ | ✅ | - | Public API Ready |
| **Paradex** | ✅ 7 | ❌ JWT | ❌ JWT | - | Limited |
| **Extended** | ✅ 0 | - | - | - | Mainnet Only |

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
- **Core** - Rate limiting, retry logic, logging
- **WebSocket** - Connection management, auto-reconnection
- **Types** - Unified data structures, error hierarchy

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
