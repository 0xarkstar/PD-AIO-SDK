/**
 * Aster Exchange-Specific Types
 */

import type { ExchangeConfig } from '../../types/adapter.js';

export interface AsterConfig extends ExchangeConfig {
  apiKey?: string;
  apiSecret?: string;
  testnet?: boolean;
  timeout?: number;
  /** Referral code for fee sharing */
  referralCode?: string;
}

// --- API Response Types ---

export interface AsterExchangeInfo {
  timezone: string;
  serverTime: number;
  symbols: AsterSymbolInfo[];
}

export interface AsterSymbolInfo {
  symbol: string; // "BTCUSDT"
  pair: string; // "BTCUSDT"
  contractType: string; // "PERPETUAL"
  deliveryDate: number;
  onboardDate: number;
  status: string; // "TRADING"
  baseAsset: string; // "BTC"
  quoteAsset: string; // "USDT"
  marginAsset: string; // "USDT"
  pricePrecision: number;
  quantityPrecision: number;
  baseAssetPrecision: number;
  quotePrecision: number;
  underlyingType: string;
  settlePlan: number;
  triggerProtect: string;
  filters: AsterFilter[];
  orderTypes: string[];
  timeInForce: string[];
  liquidationFee: string;
  marketTakeBound: string;
}

export type AsterFilter =
  | AsterPriceFilter
  | AsterLotSizeFilter
  | AsterMinNotionalFilter
  | AsterMaxOrdersFilter
  | AsterPercentPriceFilter;

export interface AsterPriceFilter {
  filterType: 'PRICE_FILTER';
  minPrice: string;
  maxPrice: string;
  tickSize: string;
}

export interface AsterLotSizeFilter {
  filterType: 'LOT_SIZE';
  minQty: string;
  maxQty: string;
  stepSize: string;
}

export interface AsterMinNotionalFilter {
  filterType: 'MIN_NOTIONAL';
  notional: string;
}

export interface AsterMaxOrdersFilter {
  filterType: 'MAX_NUM_ORDERS';
  limit: number;
}

export interface AsterPercentPriceFilter {
  filterType: 'PERCENT_PRICE';
  multiplierUp: string;
  multiplierDown: string;
  multiplierDecimal: string;
}

export interface AsterTicker24hr {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  lastPrice: string;
  lastQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface AsterOrderBookResponse {
  lastUpdateId: number;
  bids: [string, string][]; // [price, qty]
  asks: [string, string][];
  T: number;
}

export interface AsterTradeResponse {
  id: number;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
}

export interface AsterPremiumIndex {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  estimatedSettlePrice: string;
  lastFundingRate: string;
  nextFundingTime: number;
  interestRate: string;
  time: number;
}

export interface AsterKlineResponse {
  0: number; // Open time
  1: string; // Open
  2: string; // High
  3: string; // Low
  4: string; // Close
  5: string; // Volume
  6: number; // Close time
  7: string; // Quote asset volume
  8: number; // Number of trades
  9: string; // Taker buy base volume
  10: string; // Taker buy quote volume
  11: string; // Ignore
}

export interface AsterOrderResponse {
  orderId: number;
  symbol: string;
  status: string;
  clientOrderId: string;
  price: string;
  avgPrice: string;
  origQty: string;
  executedQty: string;
  cumQuote: string;
  timeInForce: string;
  type: string;
  reduceOnly: boolean;
  closePosition: boolean;
  side: string; // "BUY" | "SELL"
  positionSide: string; // "BOTH" | "LONG" | "SHORT"
  stopPrice: string;
  workingType: string;
  origType: string;
  updateTime: number;
}

export interface AsterPositionRisk {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice: string;
  unRealizedProfit: string;
  liquidationPrice: string;
  leverage: string;
  maxNotionalValue: string;
  marginType: string; // "cross" | "isolated"
  isolatedMargin: string;
  isAutoAddMargin: string;
  positionSide: string;
  notional: string;
  isolatedWallet: string;
  updateTime: number;
}

export interface AsterAccountBalance {
  accountAlias: string;
  asset: string;
  balance: string;
  crossWalletBalance: string;
  crossUnPnl: string;
  availableBalance: string;
  maxWithdrawAmount: string;
  marginAvailable: boolean;
  updateTime: number;
}
