# PD AIO SDK

> **P**erp **D**EX **A**ll-**I**n-**O**ne SDK - Unified TypeScript SDK for Decentralized Perpetual Exchanges

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-409%20passed-brightgreen)](https://github.com/0xarkstar/PD-AIO-SDK)
[![npm version](https://img.shields.io/badge/npm-v0.1.0-blue)](https://www.npmjs.com/package/pd-aio-sdk)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

**[한국어 문서](./README.ko.md)** | English

---

## 🎯 What is PD AIO SDK?

**PD AIO SDK** (Perp DEX All-In-One SDK) is a production-ready, unified TypeScript SDK that lets you trade on **7 decentralized perpetual exchanges** through a single, consistent interface. No more learning different APIs for each exchange - write once, trade anywhere.

### Why "All-In-One"?

- **One Interface** → 7 Exchanges (Hyperliquid, GRVT, Paradex, EdgeX, Backpack, Lighter, Nado)
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
- **Hyperliquid** - Production + Testnet, 200k orders/sec, HIP-3 ecosystem
- **GRVT** - Production + Testnet, Hybrid CEX/DEX, portfolio margin
- **Paradex** - Production + Testnet (Sepolia), StarkNet L2
- **EdgeX** - Production only (V1), Sub-10ms matching, $130B+ volume
- **Backpack** - Production only, Solana-based, multi-market support
- **Lighter** - Beta + Testnet, ZK-SNARK proofs, orderbook DEX
- **Nado** - Production + Testnet, Ink L2 by Kraken, 5-15ms latency

### 🔐 Production-Grade Security
- **EIP-712 signatures** (Hyperliquid, GRVT, Nado)
- **StarkNet ECDSA** (Paradex, EdgeX)
- **ED25519** (Backpack)
- **API Key authentication** (Lighter)
- **Secure credential management** with validation

### ⚡ Enterprise Features
- **WebSocket streaming** - Real-time order books, positions, trades
- **Auto-reconnection** - Exponential backoff with subscription recovery
- **Rate limiting** - Exchange-specific limits respected automatically
- **Smart caching** - Market data caching with configurable TTL
- **Retry logic** - Automatic retry with exponential backoff
- **Type safety** - Runtime validation (Zod) + TypeScript strict mode

### 📊 Developer Experience
- **409 tests** - 100% pass rate, production-ready
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
import { createExchange, createSymbol } from 'pd-aio-sdk';
import { Wallet } from 'ethers';

// Initialize adapter
const wallet = new Wallet(process.env.PRIVATE_KEY);
const exchange = createExchange('hyperliquid', {
  wallet,
  testnet: true
});

await exchange.initialize();

// Create a symbol (exchange-aware)
const symbol = createSymbol('hyperliquid', 'BTC'); // Returns "BTC/USDT:USDT"

// Fetch market data
const markets = await exchange.fetchMarkets();
const orderBook = await exchange.fetchOrderBook(symbol);
const ticker = await exchange.fetchTicker(symbol);

// Place an order
const order = await exchange.createOrder({
  symbol,
  type: 'limit',
  side: 'buy',
  amount: 0.1,
  price: 50000
});

// Check positions
const positions = await exchange.fetchPositions();
const balances = await exchange.fetchBalance();

// Cancel order
await exchange.cancelOrder(order.id, symbol);

// Cleanup
await exchange.disconnect();
```

---

## 📚 Supported Exchanges

| Exchange | Status | Testnet | Auth Method | Special Features |
|----------|--------|---------|-------------|------------------|
| **Hyperliquid** | ✅ Production | ✅ Public | EIP-712 | 200k orders/sec, HIP-3 ecosystem, faucet available |
| **GRVT** | ✅ Production | ✅ Public | EIP-712 + Session | Hybrid CEX/DEX, portfolio margin |
| **Paradex** | ✅ Production | ✅ Public (Sepolia) | StarkNet + JWT | StarkNet L2, ultra-low latency |
| **EdgeX** | ✅ Production (V1) | ❌ Mainnet only* | StarkEx + Pedersen | Sub-10ms matching, $130B+ volume |
| **Backpack** | ✅ Production | ❌ Mainnet only | ED25519 | Solana-based, multi-market types |
| **Lighter** | ⚠️ Beta | ✅ Public (ETH testnet) | API Key | ZK-SNARK proofs, orderbook DEX |
| **Nado** | ✅ Production | ✅ Public (Ink L2) | EIP-712 | Ink L2 by Kraken, 5-15ms latency |

> *EdgeX V2 testnet planned for Q3 2025

### 🎁 Bonus: HIP-3 Ecosystem (via Hyperliquid)

All HIP-3 DEXs share Hyperliquid's infrastructure - **one adapter, 7+ platforms**:

- **trade.xyz** - US stock perpetuals (NVDA, TSLA, AAPL)
- **Ventuals** - Pre-IPO perps (SpaceX, OpenAI, Anthropic)
- **Based** - Trading super app
- **Volmex** - Volatility indices
- **Nunchi** - Yield/APY perpetuals
- **Aura** - US Treasury perps

---

## 🔧 Configuration

### 1. Environment Setup

```bash
# Copy example file
cp .env.example .env
```

### 2. Add Your Credentials

```bash
# Hyperliquid (EIP-712)
HYPERLIQUID_PRIVATE_KEY=0x1234...
HYPERLIQUID_TESTNET=true

# GRVT (EIP-712 + Session)
GRVT_PRIVATE_KEY=0x1234...
GRVT_API_KEY=your_api_key
GRVT_TESTNET=true

# Paradex (StarkNet)
PARADEX_PRIVATE_KEY=0x1234...
PARADEX_ACCOUNT_ADDRESS=0x5678...
PARADEX_TESTNET=true

# Backpack (ED25519)
BACKPACK_PRIVATE_KEY=base58_encoded_key
BACKPACK_TESTNET=true

# Lighter (API Key)
LIGHTER_API_KEY=your_api_key
LIGHTER_API_SECRET=your_api_secret
LIGHTER_ACCOUNT_ID=your_account_id

# EdgeX (StarkEx)
EDGEX_API_KEY=your_api_key
EDGEX_TESTNET=true
```

### 3. Validate Configuration (Optional)

```typescript
import { validateConfig } from 'pd-aio-sdk';

try {
  validateConfig('hyperliquid');
  console.log('✅ Configuration valid');
} catch (error) {
  console.error('❌ Configuration error:', error.message);
}
```

---

## 📖 Advanced Examples

### WebSocket Streaming

```typescript
import { createExchange } from 'pd-aio-sdk';

const exchange = createExchange('hyperliquid', {
  wallet: new Wallet(process.env.PRIVATE_KEY),
  testnet: true
});

await exchange.initialize();

// Stream order book updates
for await (const orderBook of exchange.watchOrderBook('BTC/USDT:USDT')) {
  console.log('Best bid:', orderBook.bids[0]);
  console.log('Best ask:', orderBook.asks[0]);
}

// Stream position updates
for await (const positions of exchange.watchPositions()) {
  console.log('Positions updated:', positions);
}

// Stream trades
for await (const trade of exchange.watchTrades('BTC/USDT:USDT')) {
  console.log('New trade:', trade);
}
```

### Error Handling with Retry

```typescript
import { createExchange, withRetry } from 'pd-aio-sdk';

const exchange = createExchange('hyperliquid', { testnet: true });

// Automatic retry on transient failures
const markets = await withRetry(
  () => exchange.fetchMarkets(),
  {
    maxAttempts: 3,
    initialDelay: 1000,
    backoffMultiplier: 2,
    maxDelay: 10000
  }
);
```

### Symbol Helper

```typescript
import { createSymbol } from 'pd-aio-sdk';

// Exchange-aware symbol creation
const btcHyper = createSymbol('hyperliquid', 'BTC');  // "BTC/USDT:USDT"
const ethGrvt = createSymbol('grvt', 'ETH');          // "ETH/USDT:USDT"
const solBack = createSymbol('backpack', 'SOL');      // "SOL/USDT:USDT"

// Custom quote currency
const btcUsdc = createSymbol('paradex', 'BTC', 'USDC'); // "BTC/USDC:USDC"
```

### Python-Style Aliases

```typescript
// TypeScript style
await exchange.fetchOrderBook('BTC/USDT:USDT');
await exchange.createOrder({ ... });

// Python style (snake_case)
await exchange.fetch_order_book('BTC/USDT:USDT');
await exchange.create_order({ ... });
```

### Health Monitoring

```typescript
import { createExchange } from 'pd-aio-sdk';

const exchange = createExchange('hyperliquid', { testnet: true });
await exchange.initialize();

// Check health
const health = await exchange.getHealth();
console.log('Status:', health.status);        // 'healthy' | 'degraded' | 'unhealthy'
console.log('Uptime:', health.uptimeSeconds);
console.log('Cache hit rate:', health.cache.hitRate);
```

---

## 🏗️ Architecture

### Hexagonal Architecture

```
┌─────────────────────────────────────────────┐
│         Application Layer                   │
│  (Your Trading Bot / Application)           │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│         PD AIO SDK - Unified Interface      │
│  ┌──────────────────────────────────────┐   │
│  │  Common Types & Interfaces           │   │
│  │  - IExchangeAdapter                  │   │
│  │  - Unified Order/Position/Balance    │   │
│  └──────────────────────────────────────┘   │
└────────────────┬────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
┌─────────┐  ┌─────────┐  ┌─────────┐
│Hyperliquid │GRVT    │Paradex  │  ...
│Adapter   │Adapter  │Adapter  │
└─────────┘  └─────────┘  └─────────┘
    │            │            │
    ▼            ▼            ▼
┌─────────────────────────────────────────────┐
│         Exchange APIs                       │
│  (Hyperliquid, GRVT, Paradex, etc.)        │
└─────────────────────────────────────────────┘
```

### Core Components

- **Adapters** - Exchange-specific implementations
- **Core** - Rate limiting, retry logic, logging, health checks
- **WebSocket** - Connection management, auto-reconnection
- **Utils** - Symbol normalization, validation, helpers
- **Types** - Unified data structures, error hierarchy

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
✅ 395 tests passing (100% pass rate)
✅ 22 test suites
✅ Integration tests: 17/17
✅ Unit tests: 378/378
```

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

# Format
npm run format

# Type check
npm run typecheck
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 🔗 Links

- **Documentation**: [Full API Documentation](./docs)
- **Korean Docs**: [한국어 문서](./README.ko.md)
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md)
- **API Audit**: [API Implementation Audit](./API_IMPLEMENTATION_AUDIT.md)

---

## 🙏 Acknowledgments

- Inspired by [CCXT](https://github.com/ccxt/ccxt) unified API design
- Built with [ethers.js](https://github.com/ethers-io/ethers.js), [starknet.js](https://github.com/starknet-io/starknet.js)
- Thanks to all exchange teams for comprehensive API documentation

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/0xarkstar/PD-AIO-SDK/issues)
- **Discussions**: [GitHub Discussions](https://github.com/0xarkstar/PD-AIO-SDK/discussions)

---

<div align="center">

**Built with ❤️ for the DeFi community**

[⭐ Star us on GitHub](https://github.com/0xarkstar/PD-AIO-SDK) | [📦 npm Package](https://www.npmjs.com/package/pd-aio-sdk)

</div>
