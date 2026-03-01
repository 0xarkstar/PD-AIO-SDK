/**
 * EdgeX-specific type definitions
 */

/**
 * EdgeX adapter configuration
 *
 * EdgeX uses StarkEx L2 for order signing with Pedersen hash + ECDSA.
 * The starkPrivateKey is required for all authenticated operations.
 */
export interface EdgeXConfig {
  /** StarkEx L2 private key for Pedersen hash signing (required for trading) */
  starkPrivateKey?: string;
  /** Use testnet environment */
  testnet?: boolean;
}

/**
 * EdgeX market response
 */
export interface EdgeXMarket {
  market_id: string;
  symbol: string;
  base_asset: string;
  quote_asset: string;
  settlement_asset: string;
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
 * EdgeX order response
 */
export interface EdgeXOrder {
  order_id: string;
  client_order_id?: string;
  market: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  size: string;
  price?: string;
  filled_size: string;
  average_price?: string;
  status: 'PENDING' | 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  time_in_force: 'GTC' | 'IOC' | 'FOK';
  post_only: boolean;
  reduce_only: boolean;
  created_at: number;
  updated_at: number;
}

/**
 * EdgeX position response
 */
export interface EdgeXPosition {
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
 * EdgeX balance response
 */
export interface EdgeXBalance {
  asset: string;
  total: string;
  available: string;
  locked: string;
}

/**
 * EdgeX order book response
 */
export interface EdgeXOrderBook {
  market: string;
  bids: [string, string][];
  asks: [string, string][];
  timestamp: number;
}

/**
 * EdgeX trade response
 */
export interface EdgeXTrade {
  trade_id: string;
  market: string;
  side: 'BUY' | 'SELL';
  price: string;
  size: string;
  timestamp: number;
}

/**
 * EdgeX ticker response
 */
export interface EdgeXTicker {
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
 * EdgeX funding rate response
 */
export interface EdgeXFundingRate {
  market: string;
  rate: string;
  timestamp: number;
  next_funding_time: number;
  mark_price: string;
  index_price: string;
}

/**
 * EdgeX API contract response from /api/v1/public/contract/getContracts
 * New API format with contractName/contractId fields.
 */
export interface EdgeXAPIContract {
  contractId: string;
  contractName: string;
  enableTrade?: boolean;
  minOrderSize?: string;
  tickSize?: string;
  stepSize?: string;
  defaultMakerFeeRate?: string;
  defaultTakerFeeRate?: string;
  riskTierList?: Array<{ maxLeverage?: string }>;
}

/**
 * EdgeX API depth response from /api/v1/public/quote/getDepth
 */
export interface EdgeXDepthData {
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
}

/**
 * EdgeX API ticker response from /api/v1/public/quote/getTicker
 */
export interface EdgeXAPITicker {
  contractName?: string;
  lastPrice?: string;
  close?: string;
  open?: string;
  high?: string;
  low?: string;
  priceChange?: string;
  priceChangePercent?: string;
  size?: string;
  volume?: string;
  value?: string;
  endTime?: string;
}

/**
 * EdgeX API funding rate response from /api/v1/public/funding/getLatestFundingRate
 */
export interface EdgeXAPIFundingData {
  fundingRate?: string;
  fundingTime?: string;
  fundingTimestamp?: string;
  markPrice?: string;
  indexPrice?: string;
  nextFundingTime?: string;
}

/**
 * EdgeX order sign payload
 */
export interface EdgeXOrderSignPayload {
  market: string;
  side: 'BUY' | 'SELL';
  order_type: string;
  size: string;
  price: string;
  time_in_force: string;
  reduce_only: boolean;
  post_only: boolean;
  nonce: number;
  expiry: number;
}
