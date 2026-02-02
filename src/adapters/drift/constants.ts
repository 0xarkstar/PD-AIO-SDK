/**
 * Drift Protocol Exchange Constants
 *
 * Drift is a decentralized perpetuals exchange on Solana with up to 20x leverage.
 * Uses DLOB (Decentralized Limit Order Book) for order matching.
 *
 * @see https://docs.drift.trade/
 * @see https://drift-labs.github.io/v2-teacher/
 */

// =============================================================================
// API Endpoints
// =============================================================================

export const DRIFT_API_URLS = {
  mainnet: {
    dlob: 'https://dlob.drift.trade',
    data: 'https://data.api.drift.trade',
    swift: 'https://swift.drift.trade',
    rpc: 'https://api.mainnet-beta.solana.com',
  },
  devnet: {
    dlob: 'https://master.dlob.drift.trade',
    data: 'https://data.api.drift.trade',
    swift: 'https://master.swift.drift.trade',
    rpc: 'https://api.devnet.solana.com',
  },
} as const;

export const DRIFT_MAINNET_DLOB_API = DRIFT_API_URLS.mainnet.dlob;
export const DRIFT_MAINNET_DATA_API = DRIFT_API_URLS.mainnet.data;
export const DRIFT_DEVNET_DLOB_API = DRIFT_API_URLS.devnet.dlob;

// =============================================================================
// Solana Program Constants
// =============================================================================

/**
 * Drift Protocol Program ID (same for mainnet and devnet)
 */
export const DRIFT_PROGRAM_ID = 'dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH';

// =============================================================================
// Precision Constants
// =============================================================================

/**
 * Drift uses specific precision constants for on-chain values
 */
export const DRIFT_PRECISION = {
  BASE: 1e9, // BASE_PRECISION - for perp base asset amounts
  QUOTE: 1e6, // QUOTE_PRECISION - for quote/USD amounts
  PRICE: 1e6, // PRICE_PRECISION - for prices
  FUNDING_RATE: 1e9, // FUNDING_RATE_PRECISION
  MARGIN: 1e4, // MARGIN_PRECISION - for margin ratios (basis points)
  PEG: 1e6, // PEG_PRECISION - for AMM peg
  PERCENTAGE: 1e6, // PERCENTAGE_PRECISION
} as const;

// =============================================================================
// Rate Limits
// =============================================================================

export const DRIFT_RATE_LIMIT = {
  maxRequests: 100,
  windowMs: 60000, // 1 minute
  weights: {
    // Public endpoints
    fetchMarkets: 1,
    fetchOrderBook: 2,
    fetchTrades: 1,
    fetchTicker: 1,
    fetchFundingRate: 1,
    fetchOHLCV: 2,

    // Private endpoints
    fetchPositions: 3,
    fetchBalance: 2,
    createOrder: 10,
    cancelOrder: 5,
    cancelAllOrders: 15,
  },
} as const;

// =============================================================================
// Market Definitions
// =============================================================================

/**
 * Perpetual market configurations
 * marketIndex is used to identify markets on-chain
 */
export const DRIFT_PERP_MARKETS = {
  'SOL-PERP': {
    marketIndex: 0,
    symbol: 'SOL/USD:USD',
    baseAsset: 'SOL',
    maxLeverage: 20,
    minOrderSize: 0.1,
    tickSize: 0.001,
    stepSize: 0.1,
    contractTier: 'B',
    maintenanceMarginRatio: 0.05, // 5%
    initialMarginRatio: 0.1, // 10%
  },
  'BTC-PERP': {
    marketIndex: 1,
    symbol: 'BTC/USD:USD',
    baseAsset: 'BTC',
    maxLeverage: 20,
    minOrderSize: 0.001,
    tickSize: 0.1,
    stepSize: 0.001,
    contractTier: 'A',
    maintenanceMarginRatio: 0.05,
    initialMarginRatio: 0.1,
  },
  'ETH-PERP': {
    marketIndex: 2,
    symbol: 'ETH/USD:USD',
    baseAsset: 'ETH',
    maxLeverage: 20,
    minOrderSize: 0.01,
    tickSize: 0.01,
    stepSize: 0.01,
    contractTier: 'B',
    maintenanceMarginRatio: 0.05,
    initialMarginRatio: 0.1,
  },
  'APT-PERP': {
    marketIndex: 3,
    symbol: 'APT/USD:USD',
    baseAsset: 'APT',
    maxLeverage: 10,
    minOrderSize: 1,
    tickSize: 0.001,
    stepSize: 1,
    contractTier: 'B',
    maintenanceMarginRatio: 0.1,
    initialMarginRatio: 0.2,
  },
  '1MBONK-PERP': {
    marketIndex: 4,
    symbol: '1MBONK/USD:USD',
    baseAsset: '1MBONK',
    maxLeverage: 10,
    minOrderSize: 1,
    tickSize: 0.00001,
    stepSize: 1,
    contractTier: 'C',
    maintenanceMarginRatio: 0.1,
    initialMarginRatio: 0.2,
  },
  'MATIC-PERP': {
    marketIndex: 5,
    symbol: 'MATIC/USD:USD',
    baseAsset: 'MATIC',
    maxLeverage: 10,
    minOrderSize: 10,
    tickSize: 0.0001,
    stepSize: 10,
    contractTier: 'B',
    maintenanceMarginRatio: 0.1,
    initialMarginRatio: 0.2,
  },
  'ARB-PERP': {
    marketIndex: 6,
    symbol: 'ARB/USD:USD',
    baseAsset: 'ARB',
    maxLeverage: 10,
    minOrderSize: 10,
    tickSize: 0.0001,
    stepSize: 10,
    contractTier: 'B',
    maintenanceMarginRatio: 0.1,
    initialMarginRatio: 0.2,
  },
  'DOGE-PERP': {
    marketIndex: 7,
    symbol: 'DOGE/USD:USD',
    baseAsset: 'DOGE',
    maxLeverage: 10,
    minOrderSize: 100,
    tickSize: 0.00001,
    stepSize: 100,
    contractTier: 'B',
    maintenanceMarginRatio: 0.1,
    initialMarginRatio: 0.2,
  },
  'BNB-PERP': {
    marketIndex: 8,
    symbol: 'BNB/USD:USD',
    baseAsset: 'BNB',
    maxLeverage: 10,
    minOrderSize: 0.1,
    tickSize: 0.01,
    stepSize: 0.1,
    contractTier: 'B',
    maintenanceMarginRatio: 0.1,
    initialMarginRatio: 0.2,
  },
  'SUI-PERP': {
    marketIndex: 9,
    symbol: 'SUI/USD:USD',
    baseAsset: 'SUI',
    maxLeverage: 10,
    minOrderSize: 10,
    tickSize: 0.0001,
    stepSize: 10,
    contractTier: 'B',
    maintenanceMarginRatio: 0.1,
    initialMarginRatio: 0.2,
  },
  'PEPE-PERP': {
    marketIndex: 10,
    symbol: '1MPEPE/USD:USD',
    baseAsset: '1MPEPE',
    maxLeverage: 10,
    minOrderSize: 1,
    tickSize: 0.00001,
    stepSize: 1,
    contractTier: 'C',
    maintenanceMarginRatio: 0.1,
    initialMarginRatio: 0.2,
  },
} as const;

/**
 * Map from market index to market key
 */
export const DRIFT_MARKET_INDEX_MAP: Record<number, string> = Object.entries(
  DRIFT_PERP_MARKETS
).reduce(
  (acc, [key, config]) => {
    acc[config.marketIndex] = key;
    return acc;
  },
  {} as Record<number, string>
);

// =============================================================================
// Order Types and Directions
// =============================================================================

export const DRIFT_ORDER_TYPES = {
  MARKET: 'market',
  LIMIT: 'limit',
  TRIGGER_MARKET: 'triggerMarket',
  TRIGGER_LIMIT: 'triggerLimit',
  ORACLE: 'oracle',
} as const;

export const DRIFT_DIRECTIONS = {
  LONG: 'long',
  SHORT: 'short',
} as const;

export const DRIFT_MARKET_TYPES = {
  PERP: 'perp',
  SPOT: 'spot',
} as const;

// =============================================================================
// Symbol Conversion
// =============================================================================

/**
 * Convert unified symbol to Drift format
 * @example "SOL/USD:USD" -> "SOL-PERP"
 * @example "BTC/USD:USD" -> "BTC-PERP"
 */
export function unifiedToDrift(symbol: string): string {
  const parts = symbol.split('/');
  const base = parts[0];

  if (!base) {
    throw new Error(`Invalid symbol format: ${symbol}`);
  }

  return `${base}-PERP`;
}

/**
 * Convert Drift symbol to unified format
 * @example "SOL-PERP" -> "SOL/USD:USD"
 * @example "BTC-PERP" -> "BTC/USD:USD"
 */
export function driftToUnified(exchangeSymbol: string): string {
  const base = exchangeSymbol.replace('-PERP', '');
  return `${base}/USD:USD`;
}

/**
 * Get market index from symbol
 */
export function getMarketIndex(symbol: string): number {
  const driftSymbol = symbol.includes('-PERP') ? symbol : unifiedToDrift(symbol);
  const market = DRIFT_PERP_MARKETS[driftSymbol as keyof typeof DRIFT_PERP_MARKETS];

  if (!market) {
    throw new Error(`Unknown market: ${symbol}`);
  }

  return market.marketIndex;
}

/**
 * Get symbol from market index
 */
export function getSymbolFromIndex(marketIndex: number): string | undefined {
  return DRIFT_MARKET_INDEX_MAP[marketIndex];
}

/**
 * Get base token from unified symbol
 */
export function getBaseToken(symbol: string): string {
  const parts = symbol.split('/');
  return parts[0] || '';
}

// =============================================================================
// Funding Rate Constants
// =============================================================================

export const DRIFT_FUNDING = {
  intervalHours: 1, // Hourly funding
  settlementFrequency: 3600, // Settle every hour (seconds)
} as const;

// =============================================================================
// WebSocket Channels
// =============================================================================

export const DRIFT_WS_CHANNELS = {
  ORDERBOOK: 'orderbook',
  TRADES: 'trades',
  FUNDING: 'funding',
  PERP_MARKETS: 'perpMarkets',
  SPOT_MARKETS: 'spotMarkets',
  USER: 'user',
} as const;

// =============================================================================
// Error Messages
// =============================================================================

export const DRIFT_ERROR_MESSAGES: Record<string, string> = {
  'insufficient collateral': 'INSUFFICIENT_MARGIN',
  'insufficient balance': 'INSUFFICIENT_BALANCE',
  'position does not exist': 'POSITION_NOT_FOUND',
  'order does not exist': 'ORDER_NOT_FOUND',
  'max leverage exceeded': 'MAX_LEVERAGE_EXCEEDED',
  'min order size': 'MIN_ORDER_SIZE',
  'oracle price unavailable': 'ORACLE_ERROR',
  'market paused': 'MARKET_PAUSED',
  'reduce only': 'REDUCE_ONLY_VIOLATION',
  'post only': 'POST_ONLY_VIOLATION',
  'rate limit': 'RATE_LIMIT_EXCEEDED',
  'transaction failed': 'TRANSACTION_FAILED',
  'liquidation': 'LIQUIDATION',
} as const;
