# Examples

This directory contains practical examples demonstrating how to use the Perp DEX SDK.

## Available Examples

### 1. Basic Usage (`basic-usage.ts`)

Demonstrates fundamental operations:
- Creating an exchange adapter
- Fetching market data (markets, order books, trades)
- Checking account balance
- Viewing open positions
- Placing and canceling orders

**Run:**
```bash
npm run build
PRIVATE_KEY=your_key node dist/examples/basic-usage.js
```

### 2. WebSocket Streaming (`websocket-streaming.ts`)

Shows real-time data streaming:
- Order book updates
- Position updates
- Order status updates

**Run:**
```bash
npm run build
PRIVATE_KEY=your_key node dist/examples/websocket-streaming.js
```

### 3. Multi-Exchange (`multi-exchange.ts`)

Demonstrates working with multiple exchanges:
- Price comparison across platforms
- Arbitrage opportunity detection
- Aggregated balance view
- Cross-exchange position management
- Funding rate comparison

**Run:**
```bash
npm run build
HYPERLIQUID_KEY=xxx PARADEX_API_KEY=yyy GRVT_API_KEY=zzz node dist/examples/multi-exchange.js
```

## Environment Setup

Create a `.env` file in the project root:

```env
# Hyperliquid
PRIVATE_KEY=0x...

# Paradex
PARADEX_API_KEY=...
PARADEX_STARK_KEY=0x...

# GRVT
GRVT_API_KEY=...

# EdgeX
EDGEX_API_KEY=...
EDGEX_PRIVATE_KEY=0x...

# Backpack
BACKPACK_API_KEY=...
BACKPACK_SECRET_KEY=...
```

## Important Notes

  **Security:**
- Never commit private keys to version control
- Use environment variables or secure key management
- Always test on testnet first

  **Trading:**
- The examples that place orders are commented out by default
- Uncomment only when you're ready to place real orders
- Start with very small amounts on testnet

  **Rate Limiting:**
- The SDK includes automatic rate limiting
- Excessive requests may still result in temporary bans
- Be respectful of exchange API limits

## Building and Running

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run an example
PRIVATE_KEY=your_key node dist/examples/basic-usage.js
```

## Troubleshooting

**"Module not found" error:**
- Make sure you've run `npm run build` first
- Check that the path in your `node` command is correct

**Authentication errors:**
- Verify your API keys/private keys are correct
- Make sure you're using the right format for each exchange
- Check that testnet mode matches your credentials

**WebSocket connection issues:**
- Some exchanges require authentication for WebSocket
- Check your firewall/network settings
- Verify the exchange's WebSocket endpoint is accessible

## Next Steps

- Read the [API Reference](../docs/api/) for detailed documentation
- Check the [Exchange Guides](../docs/exchange-guides/) for platform-specific info
- Join our [Discussions](https://github.com/yourusername/perp-dex-sdk/discussions) for help
