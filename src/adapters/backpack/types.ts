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
}

/**
 * Backpack market response
 */
export interface BackpackMarket {
  symbol: string;
  base_currency: string;
  quote_currency: string;
  settlement_currency: string;
  status: string;
  min_order_size: string;
  max_order_size: string;
  tick_size: string;
  step_size: string;
  maker_fee: string;
  taker_fee: string;
  max_leverage: string;
  is_active: boolean;
}

/**
 * Backpack order response
 */
export interface BackpackOrder {
  order_id: string;
  client_order_id?: string;
  market: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'POST_ONLY';
  size: string;
  price?: string;
  filled_size: string;
  avg_price?: string;
  status: 'NEW' | 'OPEN' | 'PARTIAL' | 'FILLED' | 'CANCELLED' | 'REJECTED';
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
 * Backpack order book response
 */
export interface BackpackOrderBook {
  market: string;
  bids: [string, string][];
  asks: [string, string][];
  timestamp: number;
  last_update_id: number;
}

/**
 * Backpack trade response
 */
export interface BackpackTrade {
  id: string;
  market: string;
  side: 'BUY' | 'SELL';
  price: string;
  size: string;
  timestamp: number;
}

/**
 * Backpack ticker response
 */
export interface BackpackTicker {
  market: string;
  last_price: string;
  bid: string;
  ask: string;
  high_24h: string;
  low_24h: string;
  volume_24h: string;
  price_change_24h: string;
  price_change_percent_24h: string;
  timestamp: number;
}

/**
 * Backpack funding rate response
 */
export interface BackpackFundingRate {
  market: string;
  rate: string;
  timestamp: number;
  next_funding_time: number;
  mark_price: string;
  index_price: string;
}

/**
 * Backpack order sign payload
 */
export interface BackpackOrderSignPayload {
  market: string;
  side: 'BUY' | 'SELL';
  order_type: string;
  size: string;
  price: string;
  time_in_force: string;
  reduce_only: boolean;
  post_only: boolean;
  timestamp: number;
}
