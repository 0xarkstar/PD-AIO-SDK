# Perp DEX SDK - Examples

This directory contains practical, runnable examples demonstrating all major features of the Perp DEX SDK.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run an example (using ts-node, no build needed)
npx ts-node examples/01-basic-trading.ts

# Or build first, then run
npm run build
node dist/examples/01-basic-trading.js
```

## 📚 New Examples (Production-Ready Patterns)

### 01. Basic Trading (`01-basic-trading.ts`) ⭐

**What you'll learn:**
- ✅ Credential validation with `validateConfig()`
- ✅ Symbol creation with `createSymbol()`
- ✅ Order management (create, cancel)
- ✅ Position and balance queries
- ✅ Proper cleanup with `disconnect()`

**Requirements:** Testnet credentials

```bash
npx ts-node examples/01-basic-trading.ts
```

---

### 02. Market Data (`02-market-data.ts`) ⭐

**What you'll learn:**
- ✅ Fetching markets, tickers, order books
- ✅ Market data preloading with `preloadMarkets()`
- ✅ Funding rates
- ✅ Comparing multiple markets
- ✅ No credentials required (public API)

**Requirements:** None

```bash
npx ts-node examples/02-market-data.ts
```

---

### 03. Error Handling (`03-error-handling.ts`) ⭐

**What you'll learn:**
- ✅ Automatic retry with `withRetry()`
- ✅ Error classification (retryable vs non-retryable)
- ✅ Rate limit handling
- ✅ Graceful degradation patterns
- ✅ Circuit breaker implementation
- ✅ Production error handling

**Requirements:** None

```bash
npx ts-node examples/03-error-handling.ts
```

---

### 04. Health Monitoring (`04-health-monitoring.ts`) ⭐

**What you'll learn:**
- ✅ Running health checks with `healthCheck()`
- ✅ Collecting metrics with `getMetrics()`
- ✅ Performance analysis (top/slowest/error-prone endpoints)
- ✅ Continuous monitoring loops
- ✅ Production alerting patterns

**Requirements:** None

```bash
npx ts-node examples/04-health-monitoring.ts
```

## 📋 Original Examples

### Basic Usage (`basic-usage.ts`)

Fundamental operations:
- Creating exchange adapters
- Fetching market data
- Checking balances
- Managing positions
- Placing and canceling orders

```bash
npm run build
PRIVATE_KEY=your_key node dist/examples/basic-usage.js
```

---

### WebSocket Streaming (`websocket-streaming.ts`)

Real-time data:
- Order book updates
- Position updates
- Order status updates

```bash
npm run build
PRIVATE_KEY=your_key node dist/examples/websocket-streaming.js
```

---

### Multi-Exchange (`multi-exchange.ts`)

Cross-exchange operations:
- Price comparison
- Arbitrage detection
- Aggregated balances
- Funding rate comparison

```bash
npm run build
HYPERLIQUID_KEY=xxx PARADEX_KEY=yyy node dist/examples/multi-exchange.js
```

---

### Advanced Examples

**DCA Strategy** (`dca-strategy.ts`)
- Dollar-cost averaging implementation
- Scheduled order placement
- Position tracking

**Portfolio Management** (`portfolio-management.ts`)
- Multi-asset portfolio tracking
- PnL calculations
- Risk exposure analysis

**Risk Management** (`risk-management.ts`)
- Position size limits
- Stop-loss automation
- Margin monitoring

**GRVT Basic** (`grvt-basic.ts`)
- GRVT exchange integration
- Session management
- Order placement

## 🔧 Environment Setup

### Option 1: Using .env file (Recommended)

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your credentials
# For testnet:
HYPERLIQUID_PRIVATE_KEY=your_testnet_private_key_here
```

### Option 2: Environment Variables

```bash
# Unix/Linux/macOS
export HYPERLIQUID_PRIVATE_KEY=0x...
npx ts-node examples/01-basic-trading.ts

# Windows (PowerShell)
$env:HYPERLIQUID_PRIVATE_KEY="0x..."
npx ts-node examples/01-basic-trading.ts
```

### Get Testnet Credentials

- **Hyperliquid Testnet:** https://app.hyperliquid-testnet.xyz
- **Testnet Faucet:** https://app.hyperliquid-testnet.xyz/faucet

## 🎯 Learning Path

**For Beginners:**

1. Start with `02-market-data.ts` (no credentials needed)
2. Set up testnet and run `01-basic-trading.ts`
3. Learn error handling with `03-error-handling.ts`
4. Understand monitoring with `04-health-monitoring.ts`

**For Production:**

1. Study `03-error-handling.ts` - Implement retry logic
2. Study `04-health-monitoring.ts` - Set up monitoring
3. Review all examples for best practices
4. Test thoroughly on testnet before mainnet

**For Trading Bots:**

1. `01-basic-trading.ts` - Order management
2. `02-market-data.ts` - Market data access
3. `websocket-streaming.ts` - Real-time updates
4. `risk-management.ts` - Risk controls

## 💡 Key Features Demonstrated

### 🔐 Security & Validation

```typescript
import { validateConfig } from '../src/utils/config.js';

// Validate credentials before use
validateConfig('hyperliquid');
```

### 🎯 Symbol Helper

```typescript
import { createSymbol } from '../src/utils/symbols.js';

// Safe symbol creation
const symbol = createSymbol('hyperliquid', 'BTC'); // "BTC/USDT:USDT"
```

### 🔄 Automatic Retry

```typescript
import { withRetry } from '../src/core/retry.js';

// Automatic retry with exponential backoff
const markets = await withRetry(
  () => exchange.fetchMarkets(),
  { maxAttempts: 3 }
);
```

### 📊 Health Checks

```typescript
const health = await exchange.healthCheck();
console.log('Status:', health.status);
console.log('Latency:', health.latency, 'ms');
```

### 📈 Metrics Tracking

```typescript
const metrics = exchange.getMetrics();
console.log('Total requests:', metrics.totalRequests);
console.log('Success rate:', (metrics.successRate * 100).toFixed(2), '%');
```

### 💾 Market Caching

```typescript
// Preload markets with 10-minute TTL
await exchange.preloadMarkets({ ttl: 600000 });

// Subsequent calls use cache
const cached = exchange.getPreloadedMarkets();
```

## ⚠️ Important Notes

### Security

- ⚠️ **Never commit private keys to version control**
- ✅ Use `.env` file (already in `.gitignore`)
- ✅ Always test on testnet first
- ✅ Use minimal amounts for testing

### Trading

- 📌 Examples use testnet by default
- 📌 Order examples are safe (low prices, small amounts)
- 📌 Review code before running on mainnet
- 📌 Start with very small position sizes

### Rate Limiting

- ✅ SDK includes automatic rate limiting
- ✅ Retry logic handles transient failures
- ⚠️ Respect exchange API limits
- ⚠️ Excessive requests may cause temporary bans

## 🐛 Troubleshooting

### "Configuration error: Missing environment variables"

**Solution:** Set up `.env` file

```bash
cp .env.example .env
# Edit .env and add your HYPERLIQUID_PRIVATE_KEY
```

### "Cannot find module '../src/index.js'"

**Solution:** Run from project root

```bash
cd /path/to/perp-dex-sdk
npx ts-node examples/01-basic-trading.ts
```

### "Rate limit exceeded"

**Solution:** The SDK will automatically retry. If it persists:
1. Wait a few seconds between requests
2. Check if you're making too many concurrent calls
3. Consider increasing retry delays

### Connection timeouts

**Solution:**
1. Check your internet connection
2. Verify exchange is operational
3. Try with `{ timeout: 60000 }` (60 seconds)
4. Enable debug mode: `{ debug: true }`

### Authentication errors

**Solutions:**
- Verify private key format (0x prefix)
- Check testnet vs mainnet setting
- Ensure you have testnet funds
- Try regenerating credentials

## 📊 Running with Debug Mode

```typescript
const exchange = new HyperliquidAdapter({
  debug: true, // Enable verbose logging
  testnet: true,
});
```

This will log all API requests and responses.

## 🔗 Multiple Exchanges

```typescript
import { GRVTAdapter, ParadexAdapter } from '../src/index.js';

// GRVT
const grvt = new GRVTAdapter({
  apiKey: process.env.GRVT_API_KEY,
  apiSecret: process.env.GRVT_API_SECRET,
});

// Paradex
const paradex = new ParadexAdapter({
  apiKey: process.env.PARADEX_API_KEY,
  starkKey: process.env.PARADEX_STARK_KEY,
});
```

## 📚 Additional Resources

- **Main README:** [../README.md](../README.md)
- **Improvements Doc:** [../IMPROVEMENTS.md](../IMPROVEMENTS.md)
- **Changelog:** [../CHANGELOG.md](../CHANGELOG.md)
- **P0 Summary:** [../P0_COMPLETION_SUMMARY.md](../P0_COMPLETION_SUMMARY.md)
- **P1 Summary:** [../P1_COMPLETION_SUMMARY.md](../P1_COMPLETION_SUMMARY.md)

## 🚀 Next Steps

After completing these examples:

1. ✅ Build your own trading bot
2. ✅ Implement your strategy
3. ✅ Test thoroughly on testnet
4. ✅ Set up monitoring and alerting
5. ✅ Deploy with proper risk controls

## 📄 License

Same as main project - See [../LICENSE](../LICENSE)

---

**Happy Trading!** 🎉

*Remember: Always test on testnet first and never risk more than you can afford to lose.*
