/**
 * Lighter-specific type definitions
 */

export interface LighterMarket {
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  active: boolean;
  minOrderSize: number;
  maxOrderSize: number;
  tickSize: number;
  stepSize: number;
  makerFee: number;
  takerFee: number;
  maxLeverage: number;
}

export interface LighterOrder {
  orderId: string;
  clientOrderId?: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  price?: number;
  size: number;
  filledSize: number;
  status: 'open' | 'filled' | 'cancelled' | 'partially_filled';
  timestamp: number;
  reduceOnly: boolean;
}

export interface LighterPosition {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number;
  unrealizedPnl: number;
  margin: number;
  leverage: number;
}

export interface LighterBalance {
  currency: string;
  total: number;
  available: number;
  reserved: number;
}

export interface LighterOrderBook {
  symbol: string;
  bids: Array<[number, number]>;
  asks: Array<[number, number]>;
  timestamp: number;
}

export interface LighterTrade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  timestamp: number;
}

export interface LighterTicker {
  symbol: string;
  last: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
  volume: number;
  timestamp: number;
}

export interface LighterFundingRate {
  symbol: string;
  fundingRate: number;
  markPrice: number;
  nextFundingTime: number;
}
