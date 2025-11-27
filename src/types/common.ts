/**
 * Common Types for Perp DEX SDK
 *
 * Unified type definitions across all supported exchanges
 */

// =============================================================================
// Order Types
// =============================================================================

export const ORDER_TYPES = ['market', 'limit', 'stopMarket', 'stopLimit'] as const;
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

  /** Current order status */
  status: OrderStatus;

  /** Filled amount */
  filled: number;

  /** Remaining amount */
  remaining: number;

  /** Average fill price */
  averagePrice?: number;

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
