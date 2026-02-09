/**
 * Backpack-specific type definitions
 */

/**
 * Backpack adapter configuration
 */
export interface BackpackConfig {
  apiKey?: string;
  apiSecret?: string;
  ed25519PrivateKey?: string;
  testnet?: boolean;
  timeout?: number;
}

/**
 * Backpack market response
 * API uses camelCase
 */
export interface BackpackMarket {
  symbol: string;
  baseSymbol: string;
  quoteSymbol: string;
  marketType: 'SPOT' | 'PERP';
  orderBookState: string;
  visible: boolean;
  filters: {
    price: {
      tickSize: string;
      minPrice?: string;
      maxPrice?: string | null;
    };
    quantity: {
      stepSize: string;
      minQuantity: string;
      maxQuantity?: string | null;
    };
  };
  fundingInterval?: number | null;
  imfFunction?: unknown;
  mmfFunction?: unknown;
  positionLimitWeight?: unknown;
  openInterestLimit?: string;
}

/**
 * Backpack order response
 */
export interface BackpackOrder {
  order_id: string;
  client_order_id?: string;
  market: string;
  side: 'Bid' | 'Ask' | 'BUY' | 'SELL';
  type: 'Market' | 'Limit' | 'PostOnly' | 'MARKET' | 'LIMIT' | 'POST_ONLY';
  size: string;
  price?: string;
  filled_size: string;
  avg_price?: string;
  status:
    | 'New'
    | 'Open'
    | 'PartiallyFilled'
    | 'Filled'
    | 'Cancelled'
    | 'Rejected'
    | 'NEW'
    | 'OPEN'
    | 'PARTIAL'
    | 'PARTIALLY_FILLED'
    | 'FILLED'
    | 'CANCELLED'
    | 'REJECTED';
  time_in_force: 'GTC' | 'IOC' | 'FOK' | 'POST_ONLY';
  post_only: boolean;
  reduce_only: boolean;
  created_at: number;
  updated_at: number;
}

/**
 * Backpack position response
 */
export interface BackpackPosition {
  market: string;
  side: 'LONG' | 'SHORT';
  size: string;
  entry_price: string;
  mark_price: string;
  liquidation_price?: string;
  unrealized_pnl: string;
  realized_pnl: string;
  margin: string;
  leverage: string;
  timestamp: number;
}

/**
 * Backpack balance response
 */
export interface BackpackBalance {
  asset: string;
  total: string;
  available: string;
  locked: string;
}

/**
 * Backpack order book response (depth endpoint)
 */
export interface BackpackOrderBook {
  bids: [string, string][];
  asks: [string, string][];
  lastUpdateId?: string;
}

/**
 * Backpack trade response
 * API uses camelCase
 */
export interface BackpackTrade {
  id: number;
  price: string;
  quantity: string;
  quoteQuantity: string;
  timestamp: number;
  isBuyerMaker: boolean;
}

/**
 * Backpack ticker response
 * API returns camelCase fields
 */
export interface BackpackTicker {
  symbol: string;
  firstPrice: string;
  lastPrice: string;
  high: string;
  low: string;
  volume: string;
  quoteVolume: string;
  priceChange: string;
  priceChangePercent: string;
  trades: string;
}

/**
 * Backpack funding rate response
 * API returns: { fundingRate, intervalEndTimestamp, symbol }
 */
export interface BackpackFundingRate {
  symbol: string;
  fundingRate: string;
  intervalEndTimestamp: string;
}

/**
 * Backpack order sign payload
 */
export interface BackpackOrderSignPayload {
  market: string;
  side: 'Bid' | 'Ask';
  order_type: string;
  size: string;
  price: string;
  time_in_force: string;
  reduce_only: boolean;
  post_only: boolean;
  timestamp: number;
}
