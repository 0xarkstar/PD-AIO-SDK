/**
 * Common Types for Perp DEX SDK
 *
 * Unified type definitions across all supported exchanges
 */

// =============================================================================
// Order Types
// =============================================================================

export const ORDER_TYPES = ['market', 'limit', 'stopMarket', 'stopLimit', 'takeProfit', 'trailingStop'] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const ORDER_SIDES = ['buy', 'sell'] as const;
export type OrderSide = (typeof ORDER_SIDES)[number];

export const ORDER_STATUSES = [
  'open',
  'closed',
  'canceled',
  'expired',
  'rejected',
  'filled',
  'partiallyFilled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const TIME_IN_FORCE = ['GTC', 'IOC', 'FOK', 'PO'] as const;
export type TimeInForce = (typeof TIME_IN_FORCE)[number];

/**
 * Order fee information (CCXT-compatible)
 */
export interface OrderFee {
  /** Fee cost */
  cost: number;

  /** Fee currency */
  currency: string;

  /** Fee rate (decimal) */
  rate?: number;
}

/**
 * Unified order structure
 */
export interface Order {
  /** Unique order identifier */
  id: string;

  /** Symbol in unified format (e.g., "BTC/USDT:USDT") */
  symbol: string;

  /** Order type */
  type: OrderType;

  /** Order side */
  side: OrderSide;

  /** Order amount in base currency */
  amount: number;

  /** Limit price (undefined for market orders) */
  price?: number;

  /** Stop/trigger price (for stop orders) */
  stopPrice?: number;

  /** Take profit price */
  takeProfitPrice?: number;

  /** Stop loss price */
  stopLossPrice?: number;

  /** Current order status */
  status: OrderStatus;

  /** Filled amount */
  filled: number;

  /** Remaining amount */
  remaining: number;

  /** Average fill price */
  averagePrice?: number;

  /** Total cost (price × filled) */
  cost?: number;

  /** Fee information */
  fee?: OrderFee;

  /** Time in force */
  timeInForce?: TimeInForce;

  /** Whether order reduces position only */
  reduceOnly: boolean;

  /** Whether order is post-only (maker-only) */
  postOnly: boolean;

  /** Client-specified order ID */
  clientOrderId?: string;

  /** Order creation timestamp (ms) */
  timestamp: number;

  /** Last update timestamp (ms) */
  lastUpdateTimestamp?: number;

  /** Exchange-specific metadata */
  info?: Record<string, unknown>;
}

/**
 * Order request parameters
 */
export interface OrderRequest {
  /** Symbol in unified format */
  symbol: string;

  /** Order type */
  type: OrderType;

  /** Order side */
  side: OrderSide;

  /** Order amount */
  amount: number;

  /** Limit price (required for limit orders) */
  price?: number;

  /** Stop price (for stop orders) */
  stopPrice?: number;

  /** Time in force */
  timeInForce?: TimeInForce;

  /** Reduce-only flag */
  reduceOnly?: boolean;

  /** Post-only flag */
  postOnly?: boolean;

  /** Client order ID */
  clientOrderId?: string;

  /** Leverage (if not using account default) */
  leverage?: number;

  /** Exchange-specific parameters */
  params?: Record<string, unknown>;
}

// =============================================================================
// Position Types
// =============================================================================

export const POSITION_SIDES = ['long', 'short'] as const;
export type PositionSide = (typeof POSITION_SIDES)[number];

export const MARGIN_MODES = ['cross', 'isolated'] as const;
export type MarginMode = (typeof MARGIN_MODES)[number];

/**
 * Unified position structure
 */
export interface Position {
  /** Symbol in unified format */
  symbol: string;

  /** Position side */
  side: PositionSide;

  /** Position size in base currency */
  size: number;

  /** Average entry price */
  entryPrice: number;

  /** Current mark price */
  markPrice: number;

  /** Liquidation price */
  liquidationPrice: number;

  /** Unrealized PnL */
  unrealizedPnl: number;

  /** Realized PnL */
  realizedPnl: number;

  /** Current leverage */
  leverage: number;

  /** Margin mode */
  marginMode: MarginMode;

  /** Initial margin */
  margin: number;

  /** Maintenance margin */
  maintenanceMargin: number;

  /** Percentage until liquidation */
  marginRatio: number;

  /** Position timestamp (ms) */
  timestamp: number;

  /** Exchange-specific metadata */
  info?: Record<string, unknown>;
}

// =============================================================================
// Market Types
// =============================================================================

/**
 * Market/Trading pair information
 */
export interface Market {
  /** Unique market identifier */
  id: string;

  /** Symbol in unified format */
  symbol: string;

  /** Base currency (e.g., "BTC") */
  base: string;

  /** Quote currency (e.g., "USDT") */
  quote: string;

  /** Settlement currency */
  settle: string;

  /** Whether market is active */
  active: boolean;

  /** Minimum order size */
  minAmount: number;

  /** Maximum order size */
  maxAmount?: number;

  /** Minimum order value (in quote currency) */
  minCost?: number;

  /** Price precision (decimal places) */
  pricePrecision: number;

  /** Amount precision (decimal places) */
  amountPrecision: number;

  /** Price tick size */
  priceTickSize: number;

  /** Amount step size */
  amountStepSize: number;

  /** Maker fee (negative for rebate) */
  makerFee: number;

  /** Taker fee */
  takerFee: number;

  /** Maximum leverage available */
  maxLeverage: number;

  /** Funding rate interval (hours) */
  fundingIntervalHours: number;

  /** Contract size (for inverse contracts) */
  contractSize?: number;

  /** Exchange-specific metadata */
  info?: Record<string, unknown>;
}

// =============================================================================
// Order Book Types
// =============================================================================

/**
 * Order book price level [price, size]
 */
export type PriceLevel = [number, number];

/**
 * Unified order book
 */
export interface OrderBook {
  /** Symbol in unified format */
  symbol: string;

  /** Order book timestamp (ms) */
  timestamp: number;

  /** Bid price levels (sorted descending) */
  bids: PriceLevel[];

  /** Ask price levels (sorted ascending) */
  asks: PriceLevel[];

  /** Sequence number (for delta updates) */
  sequenceId?: number;

  /** Checksum (for validation) */
  checksum?: string;

  /** Exchange source */
  exchange: string;
}

// =============================================================================
// Trade Types
// =============================================================================

/**
 * Public trade
 */
export interface Trade {
  /** Trade ID */
  id: string;

  /** Symbol in unified format */
  symbol: string;

  /** Order ID (if available) */
  orderId?: string;

  /** Trade side */
  side: OrderSide;

  /** Trade price */
  price: number;

  /** Trade amount */
  amount: number;

  /** Trade value (price * amount) */
  cost: number;

  /** Fee information */
  fee?: OrderFee;

  /** Trade timestamp (ms) */
  timestamp: number;

  /** Exchange-specific metadata */
  info?: Record<string, unknown>;
}

// =============================================================================
// Funding Rate Types
// =============================================================================

/**
 * Funding rate information
 */
export interface FundingRate {
  /** Symbol in unified format */
  symbol: string;

  /** Current funding rate (decimal, e.g., 0.0001 = 0.01%) */
  fundingRate: number;

  /** Current funding timestamp (ms) */
  fundingTimestamp: number;

  /** Next funding timestamp (ms) */
  nextFundingTimestamp: number;

  /** Current mark price */
  markPrice: number;

  /** Current index price */
  indexPrice: number;

  /** Funding interval (hours) */
  fundingIntervalHours: number;

  /** Exchange-specific metadata */
  info?: Record<string, unknown>;
}

// =============================================================================
// Balance Types
// =============================================================================

/**
 * Account balance
 */
export interface Balance {
  /** Currency code */
  currency: string;

  /** Total balance */
  total: number;

  /** Free/available balance */
  free: number;

  /** Used/locked balance */
  used: number;

  /** Balance in USD equivalent */
  usdValue?: number;

  /** Exchange-specific metadata */
  info?: Record<string, unknown>;
}

// =============================================================================
// Ticker Types
// =============================================================================

/**
 * 24h ticker statistics
 */
export interface Ticker {
  /** Symbol in unified format */
  symbol: string;

  /** Last trade price */
  last: number;

  /** Best bid price */
  bid: number;

  /** Best bid size */
  bidVolume?: number;

  /** Best ask price */
  ask: number;

  /** Best ask size */
  askVolume?: number;

  /** 24h high price */
  high: number;

  /** 24h low price */
  low: number;

  /** 24h open price */
  open: number;

  /** 24h close price */
  close: number;

  /** 24h price change */
  change: number;

  /** 24h price change percentage */
  percentage: number;

  /** 24h volume in base currency */
  baseVolume: number;

  /** 24h volume in quote currency */
  quoteVolume: number;

  /** Ticker timestamp (ms) */
  timestamp: number;

  /** Exchange-specific metadata */
  info?: Record<string, unknown>;
}

// =============================================================================
// Transaction Types (Deposits/Withdrawals)
// =============================================================================

export const TRANSACTION_TYPES = ['deposit', 'withdrawal'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_STATUSES = ['pending', 'processing', 'completed', 'failed', 'canceled'] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

/**
 * Deposit or withdrawal transaction
 */
export interface Transaction {
  /** Transaction ID */
  id: string;

  /** Transaction type */
  type: TransactionType;

  /** Currency code */
  currency: string;

  /** Transaction amount */
  amount: number;

  /** Transaction status */
  status: TransactionStatus;

  /** Transaction fee */
  fee?: number;

  /** Blockchain transaction hash */
  txid?: string;

  /** Deposit/withdrawal address */
  address?: string;

  /** Address tag/memo (for certain currencies) */
  tag?: string;

  /** Network/chain (e.g., "ERC20", "TRC20") */
  network?: string;

  /** Transaction timestamp (ms) */
  timestamp: number;

  /** Update timestamp (ms) */
  updated?: number;

  /** Exchange-specific metadata */
  info?: Record<string, unknown>;
}

// =============================================================================
// OHLCV (Candlestick) Types
// =============================================================================

/**
 * Timeframe for OHLCV data
 */
export const OHLCV_TIMEFRAMES = [
  '1m', '3m', '5m', '15m', '30m',
  '1h', '2h', '4h', '6h', '8h', '12h',
  '1d', '3d', '1w', '1M'
] as const;
export type OHLCVTimeframe = (typeof OHLCV_TIMEFRAMES)[number];

/**
 * OHLCV candlestick data
 * Represented as a tuple: [timestamp, open, high, low, close, volume]
 */
export type OHLCV = [
  timestamp: number,   // Opening time in milliseconds
  open: number,        // Open price
  high: number,        // High price
  low: number,         // Low price
  close: number,       // Close price
  volume: number       // Volume in base currency
];

/**
 * Detailed OHLCV structure with named fields
 */
export interface OHLCVData {
  /** Opening timestamp (ms) */
  timestamp: number;

  /** Opening price */
  open: number;

  /** Highest price */
  high: number;

  /** Lowest price */
  low: number;

  /** Closing price */
  close: number;

  /** Volume in base currency */
  volume: number;

  /** Volume in quote currency */
  quoteVolume?: number;

  /** Number of trades in this candle */
  trades?: number;

  /** Exchange-specific metadata */
  info?: Record<string, unknown>;
}

// =============================================================================
// Parameter Types
// =============================================================================

/**
 * Common parameters for fetching markets
 */
export interface MarketParams {
  /** Filter by active markets only */
  active?: boolean;

  /** Filter by specific market IDs */
  ids?: string[];
}

/**
 * Parameters for order book fetching
 */
export interface OrderBookParams {
  /** Depth limit (number of levels) */
  limit?: number;
}

/**
 * Parameters for trade fetching
 */
export interface TradeParams {
  /** Limit number of trades */
  limit?: number;

  /** Start timestamp (ms) */
  since?: number;
}

/**
 * Parameters for OHLCV fetching
 */
export interface OHLCVParams {
  /** Limit number of candles */
  limit?: number;

  /** Start timestamp (ms) */
  since?: number;

  /** End timestamp (ms) */
  until?: number;
}

// =============================================================================
// Fee Types
// =============================================================================

/**
 * User fee information
 */
export interface UserFees {
  /** Maker fee rate (negative for rebate) */
  maker: number;

  /** Taker fee rate */
  taker: number;

  /** Fee tier level */
  tier?: string;

  /** 30-day volume (for fee calculation) */
  volume30d?: number;

  /** Exchange-specific metadata */
  info?: Record<string, unknown>;
}

// =============================================================================
// Portfolio Types
// =============================================================================

/**
 * Portfolio performance metrics
 */
export interface Portfolio {
  /** Total portfolio value */
  totalValue: number;

  /** Daily PnL */
  dailyPnl: number;

  /** Daily PnL percentage */
  dailyPnlPercentage: number;

  /** Weekly PnL */
  weeklyPnl?: number;

  /** Weekly PnL percentage */
  weeklyPnlPercentage?: number;

  /** Monthly PnL */
  monthlyPnl?: number;

  /** Monthly PnL percentage */
  monthlyPnlPercentage?: number;

  /** All-time PnL */
  allTimePnl?: number;

  /** Timestamp */
  timestamp: number;

  /** Exchange-specific metadata */
  info?: Record<string, unknown>;
}

// =============================================================================
// Rate Limit Types
// =============================================================================

/**
 * Rate limit status
 */
export interface RateLimitStatus {
  /** Remaining requests in current window */
  remaining: number;

  /** Maximum requests per window */
  limit: number;

  /** Window reset timestamp (ms) */
  resetAt: number;

  /** Percentage of limit used */
  percentUsed: number;

  /** Exchange-specific metadata */
  info?: Record<string, unknown>;
}

// =============================================================================
// Ledger Types (CCXT-compatible)
// =============================================================================

export const LEDGER_ENTRY_TYPES = [
  'trade',
  'fee',
  'deposit',
  'withdrawal',
  'transfer',
  'funding',
  'margin',
  'rebate',
  'cashback',
  'referral',
  'other',
] as const;
export type LedgerEntryType = (typeof LEDGER_ENTRY_TYPES)[number];

/**
 * Account ledger entry
 */
export interface LedgerEntry {
  /** Unique ledger entry ID */
  id: string;

  /** Entry type */
  type: LedgerEntryType;

  /** Currency */
  currency: string;

  /** Amount (positive for credit, negative for debit) */
  amount: number;

  /** Balance after this entry */
  after?: number;

  /** Balance before this entry */
  before?: number;

  /** Related order ID (for trades) */
  referenceId?: string;

  /** Related account (for transfers) */
  referenceAccount?: string;

  /** Entry timestamp (ms) */
  timestamp: number;

  /** Fee (if applicable) */
  fee?: OrderFee;

  /** Entry description */
  description?: string;

  /** Exchange-specific metadata */
  info?: Record<string, unknown>;
}

// =============================================================================
// Funding Payment Types (CCXT-compatible)
// =============================================================================

/**
 * Funding payment record
 */
export interface FundingPayment {
  /** Unique funding payment ID */
  id: string;

  /** Symbol */
  symbol: string;

  /** Funding rate applied */
  fundingRate: number;

  /** Payment amount (positive = received, negative = paid) */
  amount: number;

  /** Position size at time of funding */
  positionSize?: number;

  /** Payment timestamp (ms) */
  timestamp: number;

  /** Exchange-specific metadata */
  info?: Record<string, unknown>;
}

// =============================================================================
// Currency Types (CCXT-compatible)
// =============================================================================

/**
 * Currency/Asset information
 */
export interface Currency {
  /** Currency ID (e.g., "BTC") */
  id: string;

  /** Currency code (e.g., "BTC") */
  code: string;

  /** Currency name (e.g., "Bitcoin") */
  name?: string;

  /** Whether currency is active */
  active: boolean;

  /** Decimal precision */
  precision: number;

  /** Minimum withdrawal amount */
  minWithdraw?: number;

  /** Maximum withdrawal amount */
  maxWithdraw?: number;

  /** Withdrawal fee */
  withdrawFee?: number;

  /** Supported networks */
  networks?: string[];

  /** Exchange-specific metadata */
  info?: Record<string, unknown>;
}

// =============================================================================
// Exchange Status Types (CCXT-compatible)
// =============================================================================

export const EXCHANGE_STATUS_VALUES = ['ok', 'maintenance', 'error', 'unknown'] as const;
export type ExchangeStatusValue = (typeof EXCHANGE_STATUS_VALUES)[number];

/**
 * Exchange operational status
 */
export interface ExchangeStatus {
  /** Overall status */
  status: ExchangeStatusValue;

  /** Status message */
  message?: string;

  /** Last updated timestamp (ms) */
  updated: number;

  /** Estimated maintenance end (ms) */
  eta?: number;

  /** Exchange URL */
  url?: string;

  /** Exchange-specific metadata */
  info?: Record<string, unknown>;
}
