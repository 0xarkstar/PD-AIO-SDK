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
- `exchangeId`: Exchange identifier (`'hyperliquid'` | `'grvt'` | `'paradex'` | `'edgex'` | `'backpack'` | `'lighter'` | `'nado'`)
- `config`: Exchange-specific configuration

**Returns:** Exchange adapter instance

**Example:**
```typescript
import { createExchange } from 'pd-aio-sdk';
import { Wallet } from 'ethers';

const wallet = new Wallet(process.env.PRIVATE_KEY);
const exchange = createExchange('hyperliquid', {
  wallet,
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
  wallet: Wallet;              // ethers.js Wallet
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
import { Wallet } from 'ethers';

const exchange = createExchange('hyperliquid', {
  wallet: new Wallet(process.env.PRIVATE_KEY),
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

---

### GRVT Adapter

Hybrid CEX/DEX adapter with portfolio margin.

**Configuration:**
```typescript
interface GRVTConfig {
  wallet: Wallet;              // ethers.js Wallet
  apiKey: string;              // API key
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
  wallet: new Wallet(process.env.PRIVATE_KEY),
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
  privateKey: string;          // StarkNet private key
  accountAddress: string;      // StarkNet account address
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
  privateKey: process.env.PARADEX_PRIVATE_KEY,
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
  apiKey: string;              // API key
  privateKey: string;          // Private key for signing
  testnet?: boolean;           // V1 mainnet only currently
  rateLimitPerMinute?: number; // Default: 300
}
```

**Authentication:** ECDSA + Pedersen hash (StarkEx)

**Special Features:**
- Sub-10ms matching engine
- $130B+ cumulative volume
- V2 testnet planned Q3 2025

**Example:**
```typescript
const exchange = createExchange('edgex', {
  apiKey: process.env.EDGEX_API_KEY,
  privateKey: process.env.EDGEX_PRIVATE_KEY,
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

**Authentication:** ED25519 signatures (not secp256k1)

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

**Authentication:** API key with HMAC signatures

**Special Features:**
- ZK-SNARK proofs
- Orderbook DEX model
- Beta status (active development)
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
  wallet: Wallet;              // ethers.js Wallet
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
  wallet: new Wallet(process.env.PRIVATE_KEY),
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

## Python-Style Aliases

All methods support snake_case aliases for Python developers.

```typescript
// TypeScript style
await exchange.fetchOrderBook('BTC/USDT:USDT');
await exchange.createOrder({ ... });
await exchange.fetchPositions();

// Python style (identical functionality)
await exchange.fetch_order_book('BTC/USDT:USDT');
await exchange.create_order({ ... });
await exchange.fetch_positions();
```

**Available aliases:**
- `fetch_markets` → `fetchMarkets`
- `fetch_ticker` → `fetchTicker`
- `fetch_order_book` → `fetchOrderBook`
- `fetch_trades` → `fetchTrades`
- `fetch_funding_rate` → `fetchFundingRate`
- `create_order` → `createOrder`
- `cancel_order` → `cancelOrder`
- `cancel_all_orders` → `cancelAllOrders`
- `fetch_order` → `fetchOrder`
- `fetch_open_orders` → `fetchOpenOrders`
- `fetch_closed_orders` → `fetchClosedOrders`
- `fetch_my_trades` → `fetchMyTrades`
- `fetch_positions` → `fetchPositions`
- `fetch_position` → `fetchPosition`
- `fetch_balance` → `fetchBalance`
- `set_leverage` → `setLeverage`
- `set_margin_mode` → `setMarginMode`
- `watch_order_book` → `watchOrderBook`
- `watch_trades` → `watchTrades`
- `watch_ticker` → `watchTicker`
- `watch_orders` → `watchOrders`
- `watch_positions` → `watchPositions`
- `watch_balance` → `watchBalance`

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
type ExchangeId = 'hyperliquid' | 'grvt' | 'paradex' | 'edgex' | 'backpack' | 'lighter' | 'nado';
```

---

For more information, see:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture guide
- [ADAPTER_GUIDE.md](./ADAPTER_GUIDE.md) - Guide for adding new exchanges
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development guidelines
