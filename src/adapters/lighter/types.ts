/**
 * Lighter-specific type definitions
 */

/**
 * Lighter API configuration
 *
 * Supports two authentication modes:
 * 1. HMAC mode (legacy): Uses apiKey + apiSecret for HMAC-SHA256 signing
 * 2. WASM mode (recommended): Uses apiPrivateKey for WASM-based signing
 *
 * WASM mode is required for full trading functionality as it supports
 * the transaction signing required by the Lighter protocol.
 * Install @oraichain/lighter-ts-sdk for WASM signing support.
 */
export interface LighterConfig {
  // ============ HMAC Auth (Legacy) ============
  /** API key for HMAC authentication (legacy mode) */
  apiKey?: string;
  /** API secret for HMAC authentication (legacy mode) */
  apiSecret?: string;

  // ============ WASM Auth (Recommended - Full Trading) ============
  /** API private key (hex string) for WASM signing */
  apiPrivateKey?: string;
  /** API public key (hex string, optional - derived from private if not provided) */
  apiPublicKey?: string;
  /** Account index for trading (default: 0) */
  accountIndex?: number;
  /** API key index (default: 255 for main key) */
  apiKeyIndex?: number;

  // ============ Network Settings ============
  /** Use testnet (default: false) */
  testnet?: boolean;
  /** Chain ID override (300 = testnet, 304 = mainnet) */
  chainId?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Rate limit tier */
  rateLimitTier?: 'tier1' | 'tier2' | 'tier3';
}

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
