/**
 * Ethereal Exchange Constants
 */

// =============================================================================
// API Endpoints
// =============================================================================

export const ETHEREAL_API_URLS = {
  mainnet: {
    rest: 'https://api.ethereal.trade/v1',
    websocket: 'wss://ws.ethereal.trade',
  },
  testnet: {
    rest: 'https://api.etherealtest.net/v1',
    websocket: 'wss://ws.etherealtest.net',
  },
};

// =============================================================================
// EIP-712 Constants
// =============================================================================

export const ETHEREAL_CHAIN_ID = 0; // Placeholder — update when known

export const ETHEREAL_EIP712_DOMAIN = {
  name: 'Ethereal',
  version: '1',
  chainId: ETHEREAL_CHAIN_ID,
};

// =============================================================================
// Rate Limits
// =============================================================================

export const ETHEREAL_RATE_LIMITS = {
  rest: {
    maxRequests: 600,
    windowMs: 60000,
  },
  order: {
    maxRequests: 300,
    windowMs: 60000,
  },
};

export const ETHEREAL_ENDPOINT_WEIGHTS: Record<string, number> = {
  fetchMarkets: 1,
  fetchTicker: 1,
  fetchOrderBook: 2,
  fetchTrades: 1,
  fetchFundingRate: 1,
  fetchOHLCV: 2,
  fetchPositions: 2,
  fetchBalance: 2,
  createOrder: 5,
  cancelOrder: 3,
  cancelAllOrders: 10,
  fetchOpenOrders: 2,
  fetchMyTrades: 2,
};

// =============================================================================
// Trading Constants
// =============================================================================

export const ETHEREAL_ORDER_TYPES: Record<string, string> = {
  market: 'MARKET',
  limit: 'LIMIT',
  stopMarket: 'STOP_MARKET',
  stopLimit: 'STOP_LIMIT',
};

export const ETHEREAL_ORDER_SIDES: Record<string, string> = {
  buy: 'BUY',
  sell: 'SELL',
};

export const ETHEREAL_TIME_IN_FORCE: Record<string, string> = {
  GTC: 'GTC',
  IOC: 'IOC',
  FOK: 'FOK',
  PO: 'POST_ONLY',
};

export const ETHEREAL_ORDER_STATUS: Record<string, string> = {
  NEW: 'open',
  OPEN: 'open',
  PARTIALLY_FILLED: 'partiallyFilled',
  FILLED: 'filled',
  CANCELLED: 'canceled',
  CANCELED: 'canceled',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
};

export const ETHEREAL_KLINE_INTERVALS: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
  '1w': '1w',
};

// =============================================================================
// Symbol Mappings
// =============================================================================

/**
 * Convert unified symbol to Ethereal format
 * Ethereal uses "ETH-USD" style symbols
 * @example "ETH/USD:USD" -> "ETH-USD"
 */
export function unifiedToEthereal(symbol: string): string {
  const parts = symbol.split('/');
  const base = parts[0];
  if (!base) {
    throw new Error(`Invalid symbol format: ${symbol}`);
  }

  const quotePart = parts[1] ?? '';
  const quote = quotePart.split(':')[0] ?? 'USD';

  return `${base}-${quote}`;
}

/**
 * Convert Ethereal symbol to unified format
 * @example "ETH-USD" -> "ETH/USD:USD"
 */
export function etherealToUnified(exchangeSymbol: string): string {
  const parts = exchangeSymbol.split('-');
  const base = parts[0] ?? exchangeSymbol;
  const quote = parts[1] ?? 'USD';

  return `${base}/${quote}:${quote}`;
}

// =============================================================================
// Precision Constants
// =============================================================================

export const ETHEREAL_DEFAULT_PRECISION = {
  price: 8,
  amount: 6,
};

// =============================================================================
// Funding Rate
// =============================================================================

export const ETHEREAL_FUNDING_INTERVAL_HOURS = 1;
