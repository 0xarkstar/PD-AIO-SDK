# Perp DEX SDK

> Unified TypeScript SDK for decentralized perpetual exchanges

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue)](https://www.typescriptlang.org/)

## Overview

A production-ready SDK for trading on decentralized perpetual exchanges with a unified interface. Supports **7+ platforms** including Hyperliquid, Lighter, GRVT, Paradex, EdgeX, Backpack, and the entire HIP-3 ecosystem.

### Key Features

- 🔌 **Unified Interface**: Single API for multiple DEXs following CCXT patterns
- 🔐 **Multi-Chain Authentication**: EIP-712, StarkNet ECDSA, ED25519 support
- 🌊 **WebSocket Streaming**: Real-time order books, positions, and trades
- ⚡ **Fully Async**: Built on async/await with TypeScript strict mode
- 🛡️ **Type-Safe**: Runtime validation with Zod + compile-time TypeScript checks
- 🔄 **Auto-Reconnection**: Exponential backoff with subscription recovery
- 📊 **Feature Detection**: Capability-based runtime checks per exchange
- 🧪 **367 Unit Tests**: Comprehensive test coverage (>80%)
- 📝 **Structured Logging**: JSON logs with sensitive data masking
- 🏥 **Health & Metrics**: Built-in health checks and performance monitoring
- 💾 **Smart Caching**: Market data caching with configurable TTL
- 🔁 **Batch Operations**: Automatic fallback to sequential execution
- 🐍 **Python-Style Aliases**: snake_case method names for Python developers

## Supported Exchanges

| Exchange | Status | Testnet | Authentication | Features |
|----------|--------|---------|----------------|----------|
| **Hyperliquid** | ✅ Production | ✅ Yes | EIP-712 | REST + WebSocket, 200k orders/sec, HIP-3 ecosystem |
| **GRVT** | ✅ Production | ✅ Yes | EIP-712 + Session | Portfolio margin, hybrid CEX/DEX |
| **Paradex** | ✅ Production | ✅ Yes | StarkNet + JWT | StarkNet L2, low latency |
| **EdgeX** | ✅ Production | ✅ Yes | StarkEx + Pedersen | Sub-10ms matching, zero gas |
| **Backpack** | ✅ Production | ✅ Yes | ED25519 | Solana-based perps |
| **Lighter** | ✅ Production | ❌ No | API Key | ZK-SNARK proofs, orderbook DEX |

### HIP-3 Ecosystem (via Hyperliquid adapter)
- **trade.xyz**: US stock perpetuals (NVDA, TSLA, AAPL)
- **Ventuals**: Pre-IPO perps (SpaceX, OpenAI, Anthropic)
- **Based**: Trading super app
- **Volmex**: Volatility indices
- **Nunchi**: Yield/APY perpetuals
- **Aura**: US Treasury perps

## Installation

```bash
npm install perp-dex-sdk
# or
yarn add perp-dex-sdk
# or
pnpm add perp-dex-sdk
```

## Configuration

### Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Fill in your credentials for the exchanges you want to use:
```bash
# Hyperliquid
HYPERLIQUID_PRIVATE_KEY=your_private_key_here
HYPERLIQUID_TESTNET=true

# Lighter
LIGHTER_API_KEY=your_api_key_here
LIGHTER_API_SECRET=your_api_secret_here
LIGHTER_ACCOUNT_ID=your_account_id_here

# ... see .env.example for all exchanges
```

3. Validate your configuration (optional but recommended):
```typescript
import { validateConfig } from 'perp-dex-sdk';

try {
  validateConfig('hyperliquid');
  console.log('✅ Configuration valid');
} catch (error) {
  console.error('❌ Configuration error:', error.message);
}
```

## Quick Start

### Basic Trading Example

```typescript
import { createExchange, createSymbol } from 'perp-dex-sdk';
import { Wallet } from 'ethers';

// Initialize exchange adapter
const wallet = new Wallet(process.env.PRIVATE_KEY);
const exchange = createExchange('hyperliquid', {
  wallet,
  testnet: true
});

await exchange.initialize();

// Fetch markets
const markets = await exchange.fetchMarkets();
console.log('Available markets:', markets.map(m => m.symbol));

// Create symbol with helper (easier than manual format)
const btcSymbol = createSymbol('hyperliquid', 'BTC');  // "BTC/USDT:USDT"
const ethSymbol = createSymbol('hyperliquid', 'ETH', 'USDC');  // "ETH/USDC:USDC"

// Place a limit order
const order = await exchange.createOrder({
  symbol: btcSymbol,
  type: 'limit',
  side: 'buy',
  amount: 0.1,
  price: 50000,
  postOnly: true,
  reduceOnly: false
});

console.log('Order placed:', order.id);

// Check positions
const positions = await exchange.fetchPositions();
console.log('Open positions:', positions);

// Clean up when done
await exchange.disconnect();
```

### WebSocket Streaming Example

```typescript
import { createExchange, createSymbol } from 'perp-dex-sdk';

const exchange = createExchange('hyperliquid', { testnet: true });
await exchange.initialize();

const symbol = createSymbol('hyperliquid', 'BTC');

// Stream order book updates
for await (const orderbook of exchange.watchOrderBook(symbol)) {
  console.log('Best bid:', orderbook.bids[0]);
  console.log('Best ask:', orderbook.asks[0]);
}

// Stream position updates
for await (const positions of exchange.watchPositions()) {
  console.log('Positions changed:', positions);
}
```

### Resilient Trading with Auto-Retry

```typescript
import { createExchange, withRetry, createSymbol } from 'perp-dex-sdk';
import { Wallet } from 'ethers';

const wallet = new Wallet(process.env.PRIVATE_KEY);
const exchange = createExchange('hyperliquid', { wallet, testnet: true });

await exchange.initialize();

// Automatically retry on transient failures (rate limits, network errors, etc.)
const markets = await withRetry(
  () => exchange.fetchMarkets(),
  {
    maxAttempts: 3,
    baseDelay: 1000,
    onRetry: (attempt, error, delay) => {
      console.log(`Retry attempt ${attempt} after ${delay}ms: ${error.message}`);
    }
  }
);

// Place order with automatic retry
const symbol = createSymbol('hyperliquid', 'BTC');
const order = await withRetry(() =>
  exchange.createOrder({
    symbol,
    type: 'limit',
    side: 'buy',
    amount: 0.1,
    price: 50000,
  })
);

console.log('Order placed successfully:', order.id);
```

### Advanced Features

#### Structured Logging

```typescript
import { createExchange } from 'perp-dex-sdk';

// Enable debug logging
const exchange = createExchange('hyperliquid', {
  privateKey: process.env.PRIVATE_KEY,
  debug: true  // Enables DEBUG level logs
});

await exchange.initialize();

// Logs are structured JSON with adapter-specific context:
// {"timestamp":"2025-12-01T10:00:00.000Z","level":"info","context":"Hyperliquid","message":"Adapter initialized"}

// Sensitive data is automatically masked:
// {"apiKey":"***2345","apiSecret":"***7890"}
```

#### Health Checks & Metrics

```typescript
// Check adapter health
const health = await exchange.healthCheck();
console.log('Overall status:', health.overall);  // 'healthy' | 'degraded' | 'unhealthy'
console.log('API health:', health.components.api);
console.log('WebSocket health:', health.components.websocket);

// Get performance metrics
const metrics = exchange.getMetrics();
console.log('Total requests:', metrics.totalRequests);
console.log('Success rate:', metrics.successfulRequests / metrics.totalRequests);
console.log('Average latency:', metrics.averageLatency, 'ms');
console.log('Rate limit hits:', metrics.rateLimitHits);

// Endpoint-specific stats
metrics.endpointStats.forEach((stats, endpoint) => {
  console.log(`${endpoint}: ${stats.totalCalls} calls, ${stats.avgLatency}ms avg`);
});
```

#### Market Data Caching

```typescript
// Preload markets with 5-minute cache
await exchange.preloadMarkets({ ttl: 300000 });

// Subsequent calls use cache (much faster)
const markets = await exchange.getPreloadedMarkets();
if (markets) {
  console.log('Using cached markets:', markets.length);
} else {
  console.log('Cache expired, refetching...');
  const fresh = await exchange.fetchMarkets();
}

// Clear cache manually
exchange.clearCache();
```

#### Batch Operations

```typescript
// Create multiple orders at once
const orders = await exchange.createBatchOrders([
  { symbol: 'BTC/USDT:USDT', side: 'buy', type: 'limit', amount: 0.1, price: 50000 },
  { symbol: 'ETH/USDT:USDT', side: 'buy', type: 'limit', amount: 1.0, price: 3000 },
  { symbol: 'SOL/USDT:USDT', side: 'sell', type: 'limit', amount: 10, price: 100 },
]);

// Automatically uses native batch API if available,
// otherwise falls back to sequential execution
console.log('Orders created:', orders.length);

// Cancel multiple orders
const canceled = await exchange.cancelBatchOrders(['order-1', 'order-2', 'order-3']);
```

#### Python-Style Method Names

```typescript
// Use snake_case if you prefer Python style
const markets = await exchange.fetch_markets();      // Same as fetchMarkets()
const ticker = await exchange.fetch_ticker(symbol);  // Same as fetchTicker()
const order = await exchange.create_order(request);  // Same as createOrder()

// Both styles work identically
await exchange.fetchMarkets();   // camelCase (JavaScript/TypeScript)
await exchange.fetch_markets();  // snake_case (Python)
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   User Application                       │
├─────────────────────────────────────────────────────────┤
│                  Unified Perp DEX SDK                    │
│  ┌──────────┬──────────────┬────────────────────────┐   │
│  │ Public   │ Private API  │  WebSocket Streaming   │   │
│  │ Market   │  Trading     │  Real-time Updates     │   │
│  │ Data     │  Positions   │  Auto-Reconnection     │   │
│  └──────────┴──────────────┴────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│             Normalization & Error Handling               │
├─────────────────────────────────────────────────────────┤
│                  Exchange Adapters                       │
│  ┌──────────┬─────────┬────────┬─────────┬──────────┐   │
│  │Hyperliquid│ Lighter │ GRVT   │ Paradex │ EdgeX    │   │
│  └──────────┴─────────┴────────┴─────────┴──────────┘   │
├─────────────────────────────────────────────────────────┤
│                Infrastructure Layer                      │
│  Auth │ Rate Limiter │ WebSocket Manager │ Validation   │
└─────────────────────────────────────────────────────────┘
```

## Test Coverage

```bash
Test Suites: 20 passed, 20 total
Tests:       367 passed, 367 total
Snapshots:   0 total
Time:        ~8s
Coverage:    >80% (branches, functions, lines, statements)
```

**Test Breakdown:**
- Core Logger: 27 tests
- Logger Integration: 22 tests
- Batch Fallbacks: 16 tests
- Method Aliases: 23 tests
- Health System: 16 tests
- Metrics: 19 tests
- Market Cache: 13 tests
- Rate Limiter: 23 tests
- Validation: 18 tests
- Exchange Utils: 100+ tests
- And more...

## Documentation

- [Getting Started Guide](./docs/guides/getting-started.md)
- [API Reference](./docs/api/)
- [Exchange-Specific Guides](./docs/exchange-guides/)
- [WebSocket Streaming](./docs/guides/websocket.md)
- [Error Handling](./docs/guides/error-handling.md)
- [Development Documentation](./docs/development/) - Phase completion summaries

## Development

### Prerequisites

- Node.js >= 18.0.0
- TypeScript >= 5.6.0

### Setup

```bash
# Clone repository
git clone https://github.com/yourusername/perp-dex-sdk.git
cd perp-dex-sdk

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Run in development mode
npm run dev
```

### Running Tests

```bash
# Unit tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Integration tests (requires testnet access)
npm run test:integration

# E2E tests (requires mainnet access)
npm run test:e2e
```

### Code Quality

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Implement your feature
5. Ensure all tests pass (`npm test`)
6. Run linter (`npm run lint`)
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

## License

MIT License - see the [LICENSE](./LICENSE) file for details.

## Disclaimer

This SDK is for educational and development purposes. **Use at your own risk.** Trading perpetuals involves substantial risk of loss. The authors are not responsible for any financial losses incurred through the use of this software.

## Support

- 📖 [Documentation](./docs/)
- 🐛 [Issue Tracker](https://github.com/yourusername/perp-dex-sdk/issues)
- 💬 [Discussions](https://github.com/yourusername/perp-dex-sdk/discussions)

## Acknowledgments

Built with inspiration from [CCXT](https://github.com/ccxt/ccxt) architecture patterns.
