# API Reference

Complete API documentation for PD AIO SDK.

---

## Table of Contents

1. [Core Interface](#core-interface)
   - [IExchangeAdapter](#iexchangeadapter)
   - [Factory Functions](#factory-functions)
2. [Adapters](#adapters)
   - [Hyperliquid](#hyperliquid-adapter)
   - [GRVT](#grvt-adapter)
   - [Paradex](#paradex-adapter)
   - [EdgeX](#edgex-adapter)
   - [Backpack](#backpack-adapter)
   - [Lighter](#lighter-adapter)
   - [Nado](#nado-adapter)
   - [Variational](#variational-adapter)
   - [Extended](#extended-adapter)
   - [dYdX v4](#dydx-v4-adapter)
   - [Jupiter Perps](#jupiter-perps-adapter)
   - [Drift Protocol](#drift-protocol-adapter)
   - [GMX v2](#gmx-v2-adapter)
   - [Aster](#aster-adapter)
   - [Pacifica](#pacifica-adapter)
   - [Ostium](#ostium-adapter)
3. [Normalizers](#normalizers)
4. [Types](#types)
   - [Market Data Types](#market-data-types)
   - [Trading Types](#trading-types)
   - [Error Types](#error-types)
5. [Utility Functions](#utility-functions)

---

## Core Interface

### IExchangeAdapter

The unified interface that all exchange adapters implement.

```typescript
interface IExchangeAdapter {
  // Lifecycle
  initialize(): Promise<void>;
  disconnect(): Promise<void>;
  getHealth(): Promise<HealthStatus>;

  // Market Data
  fetchMarkets(): Promise<Market[]>;
  fetchTicker(symbol: string): Promise<Ticker>;
  fetchOrderBook(symbol: string, limit?: number): Promise<OrderBook>;
  fetchTrades(symbol: string, limit?: number): Promise<Trade[]>;
  fetchOHLCV?(symbol: string, timeframe: string, since?: number, limit?: number): Promise<OHLCV[]>;
  fetchFundingRate(symbol: string): Promise<FundingRate>;
  fetchFundingRateHistory?(symbol: string, since?: number, limit?: number): Promise<FundingRate[]>;

  // Trading
  createOrder(request: OrderRequest): Promise<Order>;
  cancelOrder(orderId: string, symbol: string): Promise<Order>;
  cancelAllOrders?(symbol?: string): Promise<Order[]>;
  fetchOrder(orderId: string, symbol: string): Promise<Order>;
  fetchOpenOrders(symbol?: string): Promise<Order[]>;
  fetchClosedOrders?(symbol?: string, since?: number, limit?: number): Promise<Order[]>;
  fetchMyTrades?(symbol?: string, since?: number, limit?: number): Promise<Trade[]>;

  // Positions
  fetchPositions(symbols?: string[]): Promise<Position[]>;
  fetchPosition?(symbol: string): Promise<Position>;
  setLeverage?(symbol: string, leverage: number): Promise<void>;
  setMarginMode?(symbol: string, marginMode: 'isolated' | 'cross'): Promise<void>;

  // Account
  fetchBalance(): Promise<Balance>;

  // WebSocket Streaming
  watchOrderBook(symbol: string): AsyncGenerator<OrderBook>;
  watchTrades(symbol: string): AsyncGenerator<Trade>;
  watchTicker?(symbol: string): AsyncGenerator<Ticker>;
  watchOrders?(): AsyncGenerator<Order[]>;
  watchPositions?(): AsyncGenerator<Position[]>;
  watchBalance?(): AsyncGenerator<Balance>;

  // Symbol Conversion
  symbolToExchange(symbol: string): string;
  symbolFromExchange(exchangeSymbol: string): string;
}
```

**Optional Methods**: Methods marked with `?` are optional and may not be supported by all exchanges.

---

### Factory Functions

#### createExchange

Creates an exchange adapter instance.

```typescript
function createExchange(
  exchangeId: ExchangeId,
  config: ExchangeConfig
): IExchangeAdapter
```

**Parameters:**
- `exchangeId`: Exchange identifier (`'hyperliquid'` | `'grvt'` | `'paradex'` | `'edgex'` | `'backpack'` | `'lighter'` | `'nado'` | `'variational'` | `'extended'` | `'dydx'` | `'jupiter'` | `'drift'` | `'gmx'` | `'aster'` | `'pacifica'` | `'ostium'`)
- `config`: Exchange-specific configuration

**Returns:** Exchange adapter instance

**Example:**
```typescript
import { createExchange } from 'pd-aio-sdk';

const exchange = createExchange('hyperliquid', {
  privateKey: process.env.HYPERLIQUID_PRIVATE_KEY,
  testnet: true
});

await exchange.initialize();
```

#### createSymbol

Creates a unified symbol string for a specific exchange.

```typescript
function createSymbol(
  exchangeId: ExchangeId,
  base: string,
  quote?: string
): string
```

**Parameters:**
- `exchangeId`: Exchange identifier
- `base`: Base currency (e.g., `'BTC'`, `'ETH'`)
- `quote`: Quote currency (optional, defaults to exchange's default)

**Returns:** Unified symbol in CCXT format (`BASE/QUOTE:SETTLE`)

**Example:**
```typescript
import { createSymbol } from 'pd-aio-sdk';

createSymbol('hyperliquid', 'BTC');        // "BTC/USDT:USDT"
createSymbol('grvt', 'ETH');                // "ETH/USDT:USDT"
createSymbol('paradex', 'BTC', 'USDC');    // "BTC/USDC:USDC"
```

---

## Adapters

### Hyperliquid Adapter

Production-ready adapter for Hyperliquid and HIP-3 ecosystem.

**Configuration:**
```typescript
interface HyperliquidConfig {
  privateKey?: string;         // EVM private key (0x...)
  testnet?: boolean;           // Default: false
  vaultAddress?: string;       // For vault trading
  rateLimitPerMinute?: number; // Default: 1200
}
```

**Authentication:** EIP-712 signatures (chain ID 1337 for trading, 42161 for account ops)

**Special Features:**
- HIP-3 ecosystem support (trade.xyz, Ventuals, Based, etc.)
- 200k orders/sec capacity
- Testnet faucet available
- Vault trading support

**Example:**
```typescript
import { createExchange } from 'pd-aio-sdk';

const exchange = createExchange('hyperliquid', {
  privateKey: process.env.HYPERLIQUID_PRIVATE_KEY,
  testnet: true
});

await exchange.initialize();

// Place order
const order = await exchange.createOrder({
  symbol: 'BTC/USDT:USDT',
  type: 'limit',
  side: 'buy',
  amount: 0.1,
  price: 50000
});

// Fetch positions
const positions = await exchange.fetchPositions();

// Stream order book
for await (const orderBook of exchange.watchOrderBook('BTC/USDT:USDT')) {
  console.log('Best bid:', orderBook.bids[0]);
  console.log('Best ask:', orderBook.asks[0]);
}
```

**Symbol Format:**
- Exchange: `BTC-PERP`, `ETH-PERP`
- Unified: `BTC/USDT:USDT`, `ETH/USDT:USDT`

**Supported Methods:**
- ✅ All core methods
- ✅ `fetchOHLCV` (1m, 5m, 15m, 1h, 4h, 1d)
- ✅ `cancelAllOrders`
- ✅ `fetchClosedOrders`
- ✅ `fetchMyTrades`
- ✅ `setLeverage`
- ✅ `setMarginMode`
- ✅ WebSocket streaming (all channels)
- ⚠️ `fetchTrades` throws `NotSupportedError` — use `watchTrades` (WebSocket) instead

---

### GRVT Adapter

Hybrid CEX/DEX adapter with portfolio margin.

**Configuration:**
```typescript
interface GRVTConfig {
  privateKey?: string;         // EVM private key (0x...)
  apiKey?: string;             // API key
  testnet?: boolean;           // Default: false
  rateLimitPerMinute?: number; // Default: 600
}
```

**Authentication:** EIP-712 + Session cookies + API key

**Special Features:**
- Portfolio margin support
- Hybrid CEX/DEX model
- Sub-account support
- Advanced order types

**Example:**
```typescript
const exchange = createExchange('grvt', {
  privateKey: process.env.GRVT_PRIVATE_KEY,
  apiKey: process.env.GRVT_API_KEY,
  testnet: true
});

await exchange.initialize();
```

**Symbol Format:**
- Exchange: `BTC_USDT_Perp`, `ETH_USDT_Perp`
- Unified: `BTC/USDT:USDT`, `ETH/USDT:USDT`

**Supported Methods:**
- ✅ All core methods
- ✅ `cancelAllOrders`
- ✅ `fetchMyTrades`
- ✅ `setLeverage`
- ✅ WebSocket streaming (orderbook, trades, positions)

---

### Paradex Adapter

StarkNet L2 perpetual DEX adapter.

**Configuration:**
```typescript
interface ParadexConfig {
  starkPrivateKey?: string;    // StarkNet private key
  accountAddress?: string;     // StarkNet account address
  testnet?: boolean;           // Default: false (Sepolia testnet)
  rateLimitPerMinute?: number; // Default: 1500
}
```

**Authentication:** StarkNet ECDSA + JWT tokens (5-minute expiry)

**Special Features:**
- StarkNet L2 ultra-low latency
- JWT token auto-refresh
- Account abstraction
- Gas-less trading

**Example:**
```typescript
const exchange = createExchange('paradex', {
  starkPrivateKey: process.env.PARADEX_STARK_PRIVATE_KEY,
  accountAddress: process.env.PARADEX_ACCOUNT_ADDRESS,
  testnet: true
});

await exchange.initialize();
```

**Symbol Format:**
- Exchange: `BTC-USD-PERP`, `ETH-USD-PERP`
- Unified: `BTC/USD:USD`, `ETH/USD:USD`

**Supported Methods:**
- ✅ All core methods
- ✅ `fetchMyTrades`
- ✅ WebSocket streaming (orderbook, trades, positions, orders)

---

### EdgeX Adapter

High-performance StarkEx-based DEX.

**Configuration:**
```typescript
interface EdgeXConfig {
  apiKey?: string;             // API key
  starkPrivateKey?: string;    // StarkNet private key for signing
  testnet?: boolean;           // V1 mainnet only currently
  rateLimitPerMinute?: number; // Default: 300
}
```

**Authentication:** StarkNet ECDSA + Pedersen hash (StarkEx)

**Special Features:**
- Sub-10ms matching engine
- $130B+ cumulative volume
- V2 testnet planned Q3 2025

**Example:**
```typescript
const exchange = createExchange('edgex', {
  apiKey: process.env.EDGEX_API_KEY,
  starkPrivateKey: process.env.EDGEX_STARK_PRIVATE_KEY,
  testnet: false  // V1 mainnet only
});

await exchange.initialize();
```

**Symbol Format:**
- Exchange: `BTC-USDC-PERP`, `ETH-USDC-PERP`
- Unified: `BTC/USDC:USDC`, `ETH/USDC:USDC`

**Supported Methods:**
- ✅ Core market data methods
- ✅ Core trading methods
- ✅ Position management
- ⚠️ Limited WebSocket support (V2 will expand)

---

### Backpack Adapter

Solana-based perpetual DEX.

**Configuration:**
```typescript
interface BackpackConfig {
  privateKey: string;          // Base58 encoded ED25519 private key
  testnet?: boolean;           // Default: false
  rateLimitPerMinute?: number; // Default: 600
}
```

**Authentication:** ED25519 signatures with instruction-prefixed signing. All request parameters (including `instruction`, `timestamp`, `window`) are alphabetized and concatenated as `key=value&...` before signing. Signed requests require the following headers:
- `X-API-KEY` - API key
- `X-Timestamp` - Request timestamp (ms)
- `X-Window` - Validity window in ms (default: `5000`)
- `X-Signature` - Base64-encoded ED25519 signature

**Order Format (Cycle 5):**
- Order sides: `Bid` (buy) / `Ask` (sell) — not `BUY`/`SELL`
- Order types: `Market` / `Limit` / `PostOnly` — not `MARKET`/`LIMIT`

**Special Features:**
- Solana-based high throughput
- Multi-market support
- Fast finality

**Example:**
```typescript
const exchange = createExchange('backpack', {
  privateKey: process.env.BACKPACK_PRIVATE_KEY,
  testnet: true
});

await exchange.initialize();
```

**Symbol Format:**
- Exchange: `BTCUSDT_PERP`, `ETHUSDT_PERP`
- Unified: `BTC/USDT:USDT`, `ETH/USDT:USDT`

**Supported Methods:**
- ✅ All core methods
- ✅ `cancelAllOrders`
- ✅ WebSocket streaming (orderbook, trades)

---

### Lighter Adapter

ZK-SNARK based orderbook DEX.

**Configuration:**
```typescript
interface LighterConfig {
  apiKey: string;              // API key
  apiSecret: string;           // API secret
  accountId: string;           // Account ID
  testnet?: boolean;           // Default: false
  rateLimitPerMinute?: number; // Default: 60 (tier-based)
}
```

**Authentication:** WASM-based signing (recommended) or API key with HMAC-SHA256 signatures

**API Notes (Cycle 5):**
- All REST endpoints use the `/api/v1/` prefix (e.g., `/api/v1/orderBookDetails`, `/api/v1/trades`, `/api/v1/sendTx`, `/api/v1/account`)

**API Notes (Cycle 13):**
- `fetchTrades` endpoint changed to `/api/v1/recentTrades?market_id={id}`
- `fetchFundingRate` response format changed to `{funding_rates: [{rate, ...}]}` array

**Special Features:**
- ZK-SNARK proofs
- Orderbook DEX model
- WASM signing (cross-platform, no native dependencies)
- Testnet on Ethereum testnet

**Example:**
```typescript
const exchange = createExchange('lighter', {
  apiKey: process.env.LIGHTER_API_KEY,
  apiSecret: process.env.LIGHTER_API_SECRET,
  accountId: process.env.LIGHTER_ACCOUNT_ID,
  testnet: true
});

await exchange.initialize();
```

**Symbol Format:**
- Exchange: `BTC-USDT-PERP`, `ETH-USDT-PERP`
- Unified: `BTC/USDT:USDT`, `ETH/USDT:USDT`

**Supported Methods:**
- ✅ Core market data methods
- ✅ Core trading methods
- ✅ Position management
- ⚠️ WebSocket support limited (expanding)

---

### Nado Adapter

Ink L2 (by Kraken) perpetual DEX.

**Configuration:**
```typescript
interface NadoConfig {
  privateKey?: string;         // EVM private key (0x...)
  testnet?: boolean;           // Default: false
  rateLimitPerMinute?: number; // Default: 600
}
```

**Authentication:** EIP-712 signatures

**Special Features:**
- Kraken's Ink L2 infrastructure
- 5-15ms latency
- Production + testnet support
- Institutional grade

**Example:**
```typescript
const exchange = createExchange('nado', {
  privateKey: process.env.NADO_PRIVATE_KEY,
  testnet: true
});

await exchange.initialize();
```

**Symbol Format:**
- Exchange: `BTC-PERP`, `ETH-PERP`
- Unified: `BTC/USDT:USDT`, `ETH/USDT:USDT`

**Supported Methods:**
- ✅ All core methods
- ✅ WebSocket streaming (orderbook, trades, positions)

---

### Variational Adapter

Arbitrum-based RFQ perpetual DEX.

**Configuration:**
```typescript
interface VariationalConfig {
  apiKey?: string;             // API key
  apiSecret?: string;          // API secret
  testnet?: boolean;           // Default: false
  rateLimitPerMinute?: number; // Default: 600
}
```

**Authentication:** HMAC-SHA256 API signatures

**Special Features:**
- RFQ (Request for Quote) model
- Synthetic order book from quotes
- Quote-based liquidity
- Multiple market makers

**Example:**
```typescript
const exchange = createExchange('variational', {
  apiKey: process.env.VARIATIONAL_API_KEY,
  apiSecret: process.env.VARIATIONAL_API_SECRET,
  testnet: true
});

await exchange.initialize();

// Request quotes
const quotes = await exchange.requestQuote('BTC/USDC:USDC', 'buy', 0.1);

// Accept a quote
const order = await exchange.acceptQuote(quotes[0].quoteId);
```

**Symbol Format:**
- Exchange: `BTC-USDC-PERP`, `ETH-USDC-PERP`
- Unified: `BTC/USDC:USDC`, `ETH/USDC:USDC`

**Supported Methods:**
- ✅ Core market data methods
- ✅ Core trading methods
- ✅ Account methods
- ✅ RFQ-specific methods
- ❌ WebSocket streaming (not available)

---

### Extended Adapter

StarkNet-based hybrid CLOB perpetual DEX.

**Configuration:**
```typescript
interface ExtendedConfig {
  apiKey?: string;                 // API key
  starknetPrivateKey?: string;     // StarkNet private key
  starknetAccountAddress?: string; // StarkNet account address
  testnet?: boolean;               // Default: false (testnet offline)
  rateLimitPerMinute?: number;     // Default: 1000
}
```

**Authentication:** API key + StarkNet ECDSA

**Special Features:**
- Up to 100x leverage
- Hybrid CLOB/AMM model
- Sub-millisecond latency
- Mainnet only (testnet offline)

**Example:**
```typescript
const exchange = createExchange('extended', {
  apiKey: process.env.EXTENDED_API_KEY,
  starknetPrivateKey: process.env.EXTENDED_STARK_PRIVATE_KEY,
  starknetAccountAddress: process.env.EXTENDED_ACCOUNT_ADDRESS
});

await exchange.initialize();
```

**Symbol Format:**
- Exchange: `BTC-USD`, `ETH-USD`
- Unified: `BTC/USD:USD`, `ETH/USD:USD`

**Supported Methods:**
- ✅ All core methods
- ✅ `fetchOHLCV`
- ✅ `fetchFundingRateHistory`
- ✅ `cancelAllOrders`
- ✅ `fetchClosedOrders`
- ✅ `fetchMyTrades`
- ✅ `setLeverage`
- ✅ `setMarginMode`
- ✅ WebSocket streaming (all channels)

---

### dYdX v4 Adapter

Cosmos SDK-based L1 blockchain for perpetual futures.

**Configuration:**
```typescript
interface DydxConfig {
  mnemonic?: string;           // 24-word Cosmos mnemonic
  privateKey?: string;         // Alternative to mnemonic
  subaccountNumber?: number;   // Default: 0
  testnet?: boolean;           // Default: false
  rateLimitPerMinute?: number; // Default: 600
}
```

**Authentication:** Cosmos SDK signing (secp256k1)

**API Notes (Cycle 13):**
- Market data endpoints use **path-based routing**: `/trades/perpetualMarket/{ticker}`, `/candles/perpetualMarket/{ticker}`, `/historicalFunding/{ticker}`
- Private endpoints embed `subaccountNumber` in the URL path: `/addresses/{address}/subaccountNumber/{n}/orders`
- Live API validated: fetchMarkets, fetchTicker, fetchOrderBook, fetchTrades, fetchFundingRate all PASS

**Special Features:**
- 220+ perpetual markets
- Native L1 blockchain
- Hourly funding rates
- Cross-margin trading
- Full decentralization

**Example:**
```typescript
const exchange = createExchange('dydx', {
  mnemonic: process.env.DYDX_MNEMONIC,  // 24 words
  subaccountNumber: 0,
  testnet: true
});

await exchange.initialize();
```

**Symbol Format:**
- Exchange: `BTC-USD`, `ETH-USD`
- Unified: `BTC/USD:USD`, `ETH/USD:USD`

**Supported Methods:**
- ✅ All core methods
- ✅ `fetchOHLCV`
- ✅ `fetchFundingRateHistory`
- ✅ `cancelAllOrders`
- ✅ `fetchClosedOrders`
- ✅ `fetchMyTrades`
- ✅ WebSocket streaming (orderbook, trades, ticker, positions, orders, balance, myTrades)

---

### Jupiter Perps Adapter

Solana-based perpetuals using JLP liquidity pool.

**Configuration:**
```typescript
interface JupiterConfig {
  privateKey?: string | Uint8Array; // Solana private key (optional for read-only)
  walletAddress?: string;           // Solana wallet address
  rpcEndpoint?: string;             // Custom Solana RPC (optional)
  testnet?: boolean;                // Default: false
}
```

**Authentication:** Solana wallet (ed25519)

**API Notes (Cycle 13):**
- Migrated from jup.ag price API (now requires auth, returns 401) to **Pyth Network Hermes API** for price feeds
- Runtime initialization may fail if Pyth feed IDs need updating — unit tests pass but live API requires correct feed configuration

**Special Features:**
- SOL, ETH, BTC perpetuals
- Up to 250x leverage
- Borrow fees (instead of funding rates)
- JLP liquidity pool
- On-chain positions

**Example:**
```typescript
const exchange = createExchange('jupiter', {
  privateKey: process.env.JUPITER_PRIVATE_KEY,  // Base58 or Uint8Array
  walletAddress: process.env.JUPITER_WALLET_ADDRESS,
  rpcEndpoint: 'https://your-rpc.com'
});

await exchange.initialize();
```

**Symbol Format:**
- Exchange: `SOL`, `ETH`, `BTC`
- Unified: `SOL/USD:USD`, `ETH/USD:USD`, `BTC/USD:USD`

**Supported Methods:**
- ✅ Core market data methods
- ✅ Core trading methods
- ✅ Position and balance methods
- ✅ `fetchFundingRate` (borrow fee)
- ❌ WebSocket streaming (not available)
- ❌ `fetchOHLCV`
- ⚠️ `fetchTrades` throws `NotSupportedError` — Jupiter trades are on-chain only

---

### Drift Protocol Adapter

Solana-based perpetual DEX with DLOB (Decentralized Limit Order Book).

**Configuration:**
```typescript
interface DriftConfig {
  privateKey?: string | Uint8Array; // Solana private key (optional for read-only)
  walletAddress?: string;           // Solana wallet address
  subAccountId?: number;            // Default: 0
  rpcEndpoint?: string;             // Custom Solana RPC (optional)
  testnet?: boolean;                // Default: false
}
```

**Authentication:** Solana wallet (ed25519)

**Special Features:**
- 30+ perpetual markets
- Up to 20x leverage
- Hourly funding rates
- Cross-margin by default
- DLOB order book
- JIT (Just-In-Time) auctions

**Example:**
```typescript
const exchange = createExchange('drift', {
  privateKey: process.env.DRIFT_PRIVATE_KEY,  // Base58 or Uint8Array
  walletAddress: process.env.DRIFT_WALLET_ADDRESS,
  subAccountId: 0
});

await exchange.initialize();
```

**Symbol Format:**
- Exchange: `SOL-PERP`, `BTC-PERP`, `ETH-PERP`
- Unified: `SOL/USD:USD`, `BTC/USD:USD`, `ETH/USD:USD`

**Supported Methods:**
- ✅ Most core methods (fetchMarkets, fetchTicker, fetchOrderBook, fetchFundingRate)
- ❌ `fetchTrades` (DLOB API removed this endpoint)
- ❌ `fetchOHLCV` (not supported)
- ✅ `fetchFundingRate` (via Data API: `data.api.drift.trade`)
- ✅ `fetchClosedOrders`
- ✅ `fetchMyTrades`
- ✅ WebSocket streaming (orderbook, trades, ticker, positions, orders, balance, myTrades)
- ❌ `setLeverage` (per-position at order time)

---

### GMX v2 Adapter

Arbitrum/Avalanche-based synthetics perpetual DEX.

**Configuration:**
```typescript
interface GmxConfig {
  chain?: 'arbitrum' | 'avalanche'; // Default: arbitrum
  walletAddress?: string;           // Wallet address for positions
  privateKey?: string;              // EVM private key (for trading)
  rpcEndpoint?: string;             // Custom RPC endpoint
  testnet?: boolean;                // Default: false
}
```

**Authentication:** EVM wallet (read-only via REST, trading via SDK)

**Special Features:**
- Up to 100x leverage
- Cross-margin
- Continuous funding rate
- On-chain keeper execution
- Multi-collateral support
- AMM-based (no traditional orderbook)

**Example:**
```typescript
const exchange = createExchange('gmx', {
  chain: 'arbitrum',
  walletAddress: process.env.GMX_WALLET_ADDRESS,
  privateKey: process.env.GMX_PRIVATE_KEY  // For trading
});

await exchange.initialize();
```

**Symbol Format:**
- Exchange: `BTC/USD`, `ETH/USD`
- Unified: `BTC/USD:ETH`, `ETH/USD:ETH` (settled in collateral)

**API Notes (Cycle 5):**
- Candles endpoint: `/prices/candles` (not `/candlesticks`)
- Candles query parameter: `tokenSymbol` (not `marketAddress`)

**API Notes (Cycle 13):**
- Fixed price precision: per-token divisor `10^(30-tokenDecimals)` instead of flat `1e30` division
- Funding rate: Added NaN guards for missing `fundingFactorPerSecond` values
- Live API validated: fetchMarkets, fetchTicker, fetchFundingRate all PASS

**Supported Methods:**
- ✅ `fetchMarkets`, `fetchTicker`, `fetchFundingRate`
- ✅ `fetchOHLCV`
- ⚠️ Read-only REST API
- ❌ Trading requires `@gmx-io/sdk` and on-chain transactions
- ❌ WebSocket streaming (not available)
- ❌ `fetchOrderBook` (AMM-based, no orderbook)

**Note:** GMX v2 trading requires on-chain transactions via the ExchangeRouter contract. This adapter provides read-only market data access. For trading, use the official `@gmx-io/sdk` package.

---

### Aster Adapter

Binance-style perpetual DEX with HMAC-SHA256 authentication.

**Configuration:**
```typescript
interface AsterConfig {
  apiKey?: string;              // API key
  apiSecret?: string;           // API secret (HMAC-SHA256)
  testnet?: boolean;            // Default: false
  timeout?: number;             // Request timeout in ms (default: 30000)
  referralCode?: string;        // Referral/builder code for fee sharing
  rateLimitPerMinute?: number;  // Default: 1200
}
```

**Authentication:** HMAC-SHA256 API key + secret (Binance-compatible signing)

**Special Features:**
- Binance-compatible API surface (`/fapi/v1/` endpoints)
- Up to 1200 requests/min (REST), 300/min (WebSocket)
- Builder code / referral code support with on/off toggle
- PERPETUAL contract filtering

**Example:**
```typescript
const exchange = createExchange('aster', {
  apiKey: process.env.ASTER_API_KEY,
  apiSecret: process.env.ASTER_API_SECRET,
  testnet: true
});

await exchange.initialize();
```

**Symbol Format:**
- Exchange: `BTCUSDT`, `ETHUSDT`
- Unified: `BTC/USDT:USDT`, `ETH/USDT:USDT`

**Supported Methods:**
- ✅ All core market data methods
- ✅ `fetchOHLCV` (1m, 5m, 15m, 1h, 4h, 1d, and more)
- ✅ `fetchFundingRate` + `fetchFundingRateHistory`
- ✅ `createOrder`, `cancelOrder`, `cancelAllOrders`
- ✅ `fetchPositions`, `fetchBalance`
- ✅ `setLeverage`
- ❌ `fetchMyTrades` (not yet implemented)
- ❌ `fetchOrderHistory` (not yet implemented)
- ❌ WebSocket streaming (not available)

---

### Pacifica Adapter

Solana-based perpetual DEX with Ed25519 authentication.

**Configuration:**
```typescript
interface PacificaConfig {
  apiKey?: string;              // API key
  apiSecret?: string;           // API secret (Ed25519)
  testnet?: boolean;            // Default: false
  timeout?: number;             // Request timeout in ms (default: 30000)
  builderCode?: string;         // Builder code for fee attribution
  maxBuilderFeeRate?: number;   // Max builder fee rate (default: 500)
  rateLimitPerMinute?: number;  // Default: 600
}
```

**Authentication:** Ed25519 API key + secret signatures

**Special Features:**
- Solana-based high-throughput DEX
- Builder code auto-registration on `initialize()` (approved on-chain)
- Configurable max builder fee rate
- Per-symbol leverage setting

**Example:**
```typescript
const exchange = createExchange('pacifica', {
  apiKey: process.env.PACIFICA_API_KEY,
  apiSecret: process.env.PACIFICA_API_SECRET,
  builderCode: 'your-builder-code',
  testnet: true
});

await exchange.initialize();  // Auto-registers builder code if set
```

**Symbol Format:**
- Exchange: `BTC-PERP`, `ETH-PERP`
- Unified: `BTC/USD:USD`, `ETH/USD:USD`

**Supported Methods:**
- ✅ Core market data methods (`fetchMarkets`, `fetchTicker`, `fetchOrderBook`, `fetchTrades`)
- ✅ `fetchFundingRate`
- ✅ `createOrder`, `cancelOrder`
- ✅ `fetchPositions`, `fetchBalance`
- ✅ `setLeverage`
- ❌ `cancelAllOrders` (not supported)
- ❌ `fetchFundingRateHistory` (not supported)
- ❌ `fetchOrderHistory`, `fetchMyTrades` (not supported)
- ❌ WebSocket streaming (not available)

**API Notes (Cycle 13):**
- **WARNING**: Pacifica API is currently offline. All endpoints return HTTP 404. No code fix possible — awaiting API restoration.

---

### Ostium Adapter

Arbitrum-based RWA (Real World Asset) perpetual DEX using on-chain contracts + GraphQL subgraph.

**Configuration:**
```typescript
interface OstiumConfig {
  privateKey?: string;           // EVM private key for signing transactions
  rpcUrl?: string;               // Arbitrum RPC URL (default: public endpoint)
  subgraphUrl?: string;          // GraphQL subgraph URL for trade/position data
  metadataUrl?: string;          // Metadata API URL for price feeds
  referralAddress?: string;      // Ethereum address for referral fee attribution
  rateLimitPerMinute?: number;   // Default: 300
}
```

**Authentication:** EVM private key for on-chain transaction signing (Arbitrum)

**Special Features:**
- Real World Asset (RWA) perpetuals: crypto, stocks (AAPL, TSLA, NVDA), forex (EUR/USD, GBP/USD), commodities (Gold, Oil), indices (SPX)
- Hybrid architecture: REST metadata API + GraphQL subgraph + EVM smart contracts
- Up to 250x leverage (forex), 150x (crypto), 100x (commodities/indices), 50x (stocks)
- USDC collateral (on Arbitrum)
- Rollover fees instead of funding rates
- Leverage set per-trade (not per-symbol)
- Builder code support via referral address

**Example:**
```typescript
const exchange = createExchange('ostium', {
  privateKey: process.env.OSTIUM_PRIVATE_KEY,
  rpcUrl: 'https://arb1.arbitrum.io/rpc',
  referralAddress: '0xYourReferralAddress'
});

await exchange.initialize();

// Fetch RWA markets (crypto, stocks, forex, commodities, indices)
const markets = await exchange.fetchMarkets();

// Trade AAPL perpetual
const order = await exchange.createOrder({
  symbol: 'AAPL/USD:USD',
  type: 'market',
  side: 'buy',
  amount: 100,    // Position size in USDC
  leverage: 20
});
```

**Symbol Format:**
- Exchange: pair index (`0` = BTC/USD, `2` = AAPL/USD, `5` = EUR/USD, `7` = XAU/USD)
- Unified: `BTC/USD:USD`, `AAPL/USD:USD`, `EUR/USD:USD`, `XAU/USD:USD`

**Available Markets:**
| Group | Pairs | Max Leverage |
|-------|-------|:------------:|
| Crypto | BTC/USD, ETH/USD | 150x |
| Stocks | AAPL/USD, TSLA/USD, NVDA/USD | 50x |
| Forex | EUR/USD, GBP/USD | 250x |
| Commodities | XAU/USD (Gold), CL/USD (Oil) | 100x |
| Indices | SPX/USD | 100x |

**Supported Methods:**
- ✅ `fetchMarkets` (static pair list)
- ✅ `fetchTicker` (via metadata API)
- ❌ `fetchTrades` (The Graph hosted subgraph removed; disabled in Cycle 13)
- ✅ `createOrder`, `cancelOrder` (on-chain transactions)
- ✅ `fetchPositions` (via GraphQL subgraph)
- ✅ `fetchBalance` (on-chain collateral balance)
- ❌ `fetchOrderBook` (on-chain DEX, no order book)
- ❌ `fetchFundingRate` (uses rollover fees, not funding rates)
- ❌ `cancelAllOrders` (not supported)
- ❌ `setLeverage` (set per-trade at order time)
- ❌ `fetchOrderHistory`, `fetchMyTrades` (not available via REST)
- ❌ WebSocket streaming (not available)

**API Notes (Cycle 13):**
- The Graph hosted subgraph (`api.thegraph.com/subgraphs/name/ostium-labs/ostium-arbitrum`) has been removed
- `fetchTicker` metadata API parameter format fixed: `asset=BTCUSD` (not `pair=BTC/USD`)
- `fetchTrades` disabled — subgraph migration needed for trade history

**Note:** Ostium is unique in this SDK as an RWA perpetual DEX. It supports traditional finance assets (stocks, forex, commodities, indices) alongside crypto, all settled in USDC on Arbitrum.

---

## Normalizers

All adapters use dedicated Normalizer classes for data transformation (Pattern A architecture).

### Base Normalizer Interface

```typescript
class BaseNormalizer {
  // Symbol conversion
  normalizeSymbol(exchangeSymbol: string): string;
  toExchangeSymbol(symbol: string): string;

  // Market data normalization
  normalizeMarket(exchangeMarket: any): Market;
  normalizeTicker(exchangeTicker: any): Ticker;
  normalizeOrderBook(exchangeOrderBook: any): OrderBook;
  normalizeTrade(exchangeTrade: any): Trade;
  normalizeFundingRate(exchangeFunding: any): FundingRate;

  // Trading normalization
  normalizeOrder(exchangeOrder: any): Order;
  normalizeBalance(exchangeBalance: any): Balance;
  normalizePosition(exchangePosition: any): Position;
}
```

### Normalizer Examples

**Direct Normalizer Usage:**
```typescript
import { HyperliquidNormalizer } from 'pd-aio-sdk/adapters/hyperliquid';

const normalizer = new HyperliquidNormalizer();

// Convert symbols
const unified = normalizer.normalizeSymbol('BTC-PERP');
// Returns: 'BTC/USDT:USDT'

const exchange = normalizer.toExchangeSymbol('BTC/USDT:USDT');
// Returns: 'BTC-PERP'

// Normalize market data
const market = normalizer.normalizeMarket(rawMarketData);
```

**Available Normalizers:**
- `HyperliquidNormalizer`
- `GRVTNormalizer`
- `ParadexNormalizer`
- `EdgeXNormalizer`
- `BackpackNormalizer`
- `LighterNormalizer`
- `NadoNormalizer`
- `VariationalNormalizer`
- `ExtendedNormalizer`
- `DydxNormalizer`
- `JupiterNormalizer`
- `DriftNormalizer`
- `GmxNormalizer`
- `AsterNormalizer`
- `PacificaNormalizer`
- `OstiumNormalizer`

---

## Types

### Market Data Types

#### Market

```typescript
interface Market {
  id: string;                  // Exchange-specific market ID
  symbol: string;              // Unified symbol (BTC/USDT:USDT)
  base: string;                // Base currency (BTC)
  quote: string;               // Quote currency (USDT)
  settle: string;              // Settlement currency (USDT)
  type: 'swap' | 'future';     // Market type
  spot: false;                 // Always false for perps
  margin: boolean;             // Margin trading enabled
  contract: boolean;           // Always true for perps
  contractSize: number;        // Contract size (usually 1)
  active: boolean;             // Market is active
  precision: {
    amount: number;            // Amount precision decimals
    price: number;             // Price precision decimals
  };
  limits: {
    amount?: { min?: number; max?: number };
    price?: { min?: number; max?: number };
    cost?: { min?: number; max?: number };
  };
  info: any;                   // Raw exchange data
}
```

#### Ticker

```typescript
interface Ticker {
  symbol: string;              // Unified symbol
  timestamp: number;           // Unix timestamp in ms
  datetime: string;            // ISO 8601 datetime
  high: number;                // 24h high price
  low: number;                 // 24h low price
  bid: number;                 // Best bid price
  ask: number;                 // Best ask price
  last: number;                // Last traded price
  close: number;               // Close price (same as last)
  baseVolume: number;          // 24h volume in base currency
  quoteVolume: number;         // 24h volume in quote currency
  info: any;                   // Raw exchange data
}
```

#### OrderBook

```typescript
interface OrderBook {
  symbol: string;              // Unified symbol
  timestamp: number;           // Unix timestamp in ms
  datetime: string;            // ISO 8601 datetime
  bids: [number, number][];    // [[price, amount], ...]
  asks: [number, number][];    // [[price, amount], ...]
  nonce?: number;              // Update ID for deltas
}
```

#### Trade

```typescript
interface Trade {
  id: string;                  // Trade ID
  order?: string;              // Order ID
  timestamp: number;           // Unix timestamp in ms
  datetime: string;            // ISO 8601 datetime
  symbol: string;              // Unified symbol
  type: OrderType;             // Order type
  side: OrderSide;             // 'buy' | 'sell'
  price: number;               // Execution price
  amount: number;              // Trade amount
  cost: number;                // Total cost (price * amount)
  fee?: {
    cost: number;              // Fee amount
    currency: string;          // Fee currency
  };
  takerOrMaker?: 'taker' | 'maker';
  info: any;                   // Raw exchange data
}
```

#### FundingRate

```typescript
interface FundingRate {
  symbol: string;              // Unified symbol
  fundingRate: number;         // Current funding rate
  fundingTimestamp: number;    // Next funding time (ms)
  fundingDatetime: string;     // Next funding time (ISO 8601)
  timestamp: number;           // Current time (ms)
  datetime: string;            // Current time (ISO 8601)
  info: any;                   // Raw exchange data
}
```

---

### Trading Types

#### OrderRequest

```typescript
interface OrderRequest {
  symbol: string;              // Unified symbol
  type: OrderType;             // 'market' | 'limit'
  side: OrderSide;             // 'buy' | 'sell'
  amount: number;              // Order size
  price?: number;              // Limit price (required for limit orders)
  params?: {
    clientOrderId?: string;    // Client-assigned order ID
    timeInForce?: TimeInForce; // 'GTC' | 'IOC' | 'FOK' | 'PO'
    postOnly?: boolean;        // Post-only order
    reduceOnly?: boolean;      // Reduce-only order
    leverage?: number;         // Leverage (if supported)
    stopPrice?: number;        // Stop price (for stop orders)
    triggerPrice?: number;     // Trigger price
  };
}
```

#### Order

```typescript
interface Order {
  id: string;                  // Order ID
  clientOrderId?: string;      // Client order ID
  timestamp: number;           // Creation time (ms)
  datetime: string;            // Creation time (ISO 8601)
  lastTradeTimestamp?: number; // Last trade time (ms)
  symbol: string;              // Unified symbol
  type: OrderType;             // 'market' | 'limit'
  side: OrderSide;             // 'buy' | 'sell'
  price: number;               // Order price
  amount: number;              // Order amount
  filled: number;              // Filled amount
  remaining: number;           // Remaining amount
  cost: number;                // Total cost
  average?: number;            // Average fill price
  status: OrderStatus;         // 'open' | 'closed' | 'canceled'
  fee?: {
    cost: number;              // Fee amount
    currency: string;          // Fee currency
  };
  trades?: Trade[];            // Related trades
  timeInForce?: TimeInForce;   // Time in force
  postOnly?: boolean;          // Post-only flag
  reduceOnly?: boolean;        // Reduce-only flag
  info: any;                   // Raw exchange data
}
```

#### Position

```typescript
interface Position {
  symbol: string;              // Unified symbol
  timestamp: number;           // Update time (ms)
  datetime: string;            // Update time (ISO 8601)
  side: 'long' | 'short';      // Position side
  contracts: number;           // Number of contracts
  contractSize: number;        // Contract size
  entryPrice: number;          // Average entry price
  markPrice: number;           // Current mark price
  notional: number;            // Position notional value
  leverage: number;            // Current leverage
  collateral: number;          // Position collateral
  initialMargin: number;       // Initial margin
  maintenanceMargin: number;   // Maintenance margin
  unrealizedPnl: number;       // Unrealized PnL
  percentage: number;          // PnL percentage
  marginMode: 'isolated' | 'cross';
  liquidationPrice?: number;   // Liquidation price
  info: any;                   // Raw exchange data
}
```

#### Balance

```typescript
interface Balance {
  timestamp: number;           // Update time (ms)
  datetime: string;            // Update time (ISO 8601)
  free: { [currency: string]: number };     // Available balance
  used: { [currency: string]: number };     // Used balance
  total: { [currency: string]: number };    // Total balance
  info: any;                   // Raw exchange data
}
```

---

### Error Types

```typescript
class PerpDEXError extends Error {
  exchange: string;            // Exchange identifier
  originalError?: Error;       // Original error
}

// Trading Errors
class InsufficientMarginError extends PerpDEXError {}
class OrderNotFoundError extends PerpDEXError {}
class InvalidOrderError extends PerpDEXError {}
class PositionNotFoundError extends PerpDEXError {}
class SlippageExceededError extends PerpDEXError {}
class LiquidationError extends PerpDEXError {}

// Network Errors
class RateLimitError extends PerpDEXError {
  retryAfter?: number;         // Seconds until retry allowed
}
class ExchangeUnavailableError extends PerpDEXError {}
class WebSocketDisconnectedError extends PerpDEXError {}

// Auth Errors
class InvalidSignatureError extends PerpDEXError {}
class ExpiredAuthError extends PerpDEXError {}
class InsufficientPermissionsError extends PerpDEXError {}
```

---

## Utility Functions

### withRetry

Retry a function with exponential backoff.

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T>

interface RetryOptions {
  maxAttempts?: number;        // Default: 3
  initialDelay?: number;       // Default: 1000ms
  backoffMultiplier?: number;  // Default: 2
  maxDelay?: number;           // Default: 30000ms
}
```

**Example:**
```typescript
import { withRetry } from 'pd-aio-sdk';

const markets = await withRetry(
  () => exchange.fetchMarkets(),
  { maxAttempts: 5, initialDelay: 2000 }
);
```

### validateConfig

Validate exchange configuration.

```typescript
function validateConfig(exchangeId: ExchangeId): void
```

Throws error if required environment variables are missing.

**Example:**
```typescript
import { validateConfig } from 'pd-aio-sdk';

try {
  validateConfig('hyperliquid');
  console.log('✅ Config valid');
} catch (error) {
  console.error('❌ Config error:', error.message);
}
```

---

## Error Handling Best Practices

```typescript
import {
  RateLimitError,
  InsufficientMarginError,
  OrderNotFoundError
} from 'pd-aio-sdk';

try {
  await exchange.createOrder({ ... });
} catch (error) {
  if (error instanceof RateLimitError) {
    // Wait and retry
    console.log(`Rate limited. Retry after ${error.retryAfter}s`);
    await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000));
  } else if (error instanceof InsufficientMarginError) {
    // Handle margin error
    console.error('Insufficient margin for order');
  } else if (error instanceof OrderNotFoundError) {
    // Order doesn't exist
    console.error('Order not found');
  } else {
    // Generic error handling
    console.error('Order failed:', error.message);
  }
}
```

---

## WebSocket Streaming Best Practices

```typescript
// Use try/finally to ensure cleanup
try {
  for await (const orderBook of exchange.watchOrderBook('BTC/USDT:USDT')) {
    console.log('Spread:', orderBook.asks[0][0] - orderBook.bids[0][0]);

    // Break on some condition
    if (shouldStop) break;
  }
} finally {
  await exchange.disconnect();
}

// Handle reconnections gracefully
for await (const positions of exchange.watchPositions()) {
  // Subscriptions automatically resume after reconnection
  console.log('Position update:', positions);
}
```

---

## Type Enums

```typescript
type OrderType = 'market' | 'limit';
type OrderSide = 'buy' | 'sell';
type OrderStatus = 'open' | 'closed' | 'canceled' | 'rejected' | 'expired';
type TimeInForce = 'GTC' | 'IOC' | 'FOK' | 'PO';
type ExchangeId = 'hyperliquid' | 'grvt' | 'paradex' | 'edgex' | 'backpack' | 'lighter' | 'nado' | 'variational' | 'extended' | 'dydx' | 'jupiter' | 'drift' | 'gmx' | 'aster' | 'pacifica' | 'ostium';
```

---

For more information, see:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture guide
- [ADAPTER_GUIDE.md](./ADAPTER_GUIDE.md) - Guide for adding new exchanges
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development guidelines
