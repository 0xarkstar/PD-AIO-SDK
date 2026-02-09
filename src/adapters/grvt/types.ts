/**
 * GRVT-specific type definitions
 */

/**
 * GRVT market information
 */
export interface GRVTMarket {
  instrument_id: string;
  instrument: string;
  base_currency: string;
  quote_currency: string;
  settlement_currency: string;
  instrument_type: 'PERP' | 'SPOT';
  is_active: boolean;
  maker_fee: string;
  taker_fee: string;
  max_leverage: string;
  min_size: string;
  max_size: string;
  tick_size: string;
  step_size: string;
  mark_price: string;
  index_price: string;
  funding_rate?: string;
  next_funding_time?: number;
  open_interest?: string;
}

/**
 * GRVT order book snapshot
 */
export interface GRVTOrderBook {
  instrument: string;
  bids: Array<[string, string]>; // [price, size]
  asks: Array<[string, string]>;
  timestamp: number;
  sequence: number;
}

/**
 * GRVT order
 */
export interface GRVTOrder {
  order_id: string;
  client_order_id?: string;
  instrument: string;
  order_type: 'MARKET' | 'LIMIT' | 'LIMIT_MAKER';
  side: 'BUY' | 'SELL';
  size: string;
  price?: string;
  time_in_force: 'GTC' | 'IOC' | 'FOK' | 'POST_ONLY';
  reduce_only: boolean;
  post_only: boolean;
  status: 'PENDING' | 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  filled_size: string;
  average_fill_price?: string;
  created_at: number;
  updated_at: number;
}

/**
 * GRVT position
 */
export interface GRVTPosition {
  instrument: string;
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
 * GRVT balance
 */
export interface GRVTBalance {
  currency: string;
  total: string;
  available: string;
  reserved: string;
  unrealized_pnl: string;
}

/**
 * GRVT trade
 */
export interface GRVTTrade {
  trade_id: string;
  instrument: string;
  side: 'BUY' | 'SELL';
  price: string;
  size: string;
  timestamp: number;
  is_buyer_maker: boolean;
}

/**
 * GRVT ticker
 */
export interface GRVTTicker {
  instrument: string;
  last_price: string;
  best_bid: string;
  best_ask: string;
  volume_24h: string;
  high_24h: string;
  low_24h: string;
  price_change_24h: string;
  timestamp: number;
}

/**
 * GRVT order request
 */
export interface GRVTOrderRequest {
  instrument: string;
  order_type: 'MARKET' | 'LIMIT' | 'LIMIT_MAKER';
  side: 'BUY' | 'SELL';
  size: string;
  price?: string;
  time_in_force?: 'GTC' | 'IOC' | 'FOK' | 'POST_ONLY';
  reduce_only?: boolean;
  post_only?: boolean;
  client_order_id?: string;
}

/**
 * GRVT cancel order request
 */
export interface GRVTCancelRequest {
  order_id?: string;
  client_order_id?: string;
  instrument?: string;
}

/**
 * GRVT WebSocket subscription
 */
export interface GRVTSubscription {
  method: 'subscribe' | 'unsubscribe';
  params: {
    channels: string[];
  };
}

/**
 * GRVT WebSocket message
 */
export interface GRVTWsMessage {
  channel: string;
  data: unknown;
  timestamp: number;
}

/**
 * GRVT order book update
 */
export interface GRVTWsOrderBookUpdate {
  instrument: string;
  bids: Array<[string, string]>;
  asks: Array<[string, string]>;
  timestamp: number;
  sequence: number;
  is_snapshot: boolean;
}

/**
 * GRVT trade update
 */
export interface GRVTWsTradeUpdate {
  trades: GRVTTrade[];
}

/**
 * GRVT position update
 */
export interface GRVTWsPositionUpdate {
  positions: GRVTPosition[];
}

/**
 * GRVT order update
 */
export interface GRVTWsOrderUpdate {
  orders: GRVTOrder[];
}

/**
 * EIP-712 domain for GRVT
 */
export interface GRVTEip712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

/**
 * GRVT order signature payload
 */
export interface GRVTOrderSignPayload {
  instrument: string;
  order_type: string;
  side: string;
  size: string;
  price: string;
  time_in_force: string;
  reduce_only: boolean;
  post_only: boolean;
  nonce: number;
  expiry: number;
}

