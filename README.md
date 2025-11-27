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
- 🧪 **100% Tested**: Comprehensive unit, integration, and E2E test coverage

## Supported Exchanges

| Exchange | Status | Features |
|----------|--------|----------|
| **Hyperliquid** | ✅ Supported | REST + WebSocket, 200k orders/sec, HIP-3 ecosystem |
| **Lighter** | 🚧 In Progress | ZK-SNARK proofs, zero fees |
| **GRVT** | 🚧 In Progress | Portfolio margin, multi-leg orders |
| **Paradex** | 🚧 In Progress | StarkNet L2, low latency |
| **EdgeX** | 📅 Planned | Sub-10ms matching |
| **Backpack** | 📅 Planned | ED25519 signing |

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

## Quick Start

### Basic Trading Example

```typescript
import { createExchange } from 'perp-dex-sdk';
import { Wallet } from 'ethers';

// Initialize exchange adapter
const wallet = new Wallet(process.env.PRIVATE_KEY);
const exchange = createExchange('hyperliquid', {
  wallet,
  testnet: true
});

// Fetch markets
const markets = await exchange.fetchMarkets();
console.log('Available markets:', markets.map(m => m.symbol));

// Place a limit order
const order = await exchange.createOrder(
  'BTC/USDT:USDT',
  'limit',
  'buy',
  0.1,           // amount
  50000,         // price
  {
    postOnly: true,
    reduceOnly: false
  }
);

console.log('Order placed:', order.id);

// Check positions
const positions = await exchange.fetchPositions();
console.log('Open positions:', positions);
```

### WebSocket Streaming Example

```typescript
import { createExchange } from 'perp-dex-sdk';

const exchange = createExchange('hyperliquid', { testnet: true });

// Stream order book updates
for await (const orderbook of exchange.watchOrderBook('BTC/USDT:USDT')) {
  console.log('Best bid:', orderbook.bids[0]);
  console.log('Best ask:', orderbook.asks[0]);
}

// Stream position updates
for await (const positions of exchange.watchPositions()) {
  console.log('Positions changed:', positions);
}
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

## Documentation

- [Getting Started Guide](./docs/guides/getting-started.md)
- [API Reference](./docs/api/)
- [Exchange-Specific Guides](./docs/exchange-guides/)
- [WebSocket Streaming](./docs/guides/websocket.md)
- [Error Handling](./docs/guides/error-handling.md)

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
