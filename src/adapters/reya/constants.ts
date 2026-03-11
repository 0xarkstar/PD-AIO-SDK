/**
 * Reya Exchange Constants
 */

// =============================================================================
// API Endpoints
// =============================================================================

export const REYA_MAINNET_API = 'https://api.reya.xyz/v2';
export const REYA_TESTNET_API = 'https://api-test.reya.xyz/v2';

export const REYA_MAINNET_WS = 'wss://ws.reya.xyz';
export const REYA_TESTNET_WS = 'wss://websocket-testnet.reya.xyz';

// =============================================================================
// EIP-712 Constants
// =============================================================================

export const REYA_CHAIN_ID = 1729; // Reya Network L2

export const REYA_EIP712_DOMAIN = {
  name: 'Reya',
  version: '1',
  chainId: REYA_CHAIN_ID,
};

// =============================================================================
// Rate Limits
// =============================================================================

export const REYA_RATE_LIMIT = {
  maxRequests: 600,
  windowMs: 60000, // 1 minute
  weights: {
    fetchMarkets: 1,
    fetchOrderBook: 2,
    fetchTrades: 1,
    fetchTicker: 1,
    fetchFundingRate: 1,
    fetchOHLCV: 2,
    fetchPositions: 2,
    fetchBalance: 2,
    createOrder: 5,
    cancelOrder: 3,
    cancelAllOrders: 10,
    fetchOpenOrders: 2,
    fetchMyTrades: 2,
  },
};

// =============================================================================
// Trading Constants
// =============================================================================

export const REYA_ORDER_TYPES = {
  LIMIT: 'LIMIT',
  TP: 'TP',
  SL: 'SL',
} as const;

export const REYA_TIME_IN_FORCE = {
  IOC: 'IOC',
  GTC: 'GTC',
} as const;

export const REYA_ORDER_STATUS = {
  OPEN: 'OPEN',
  FILLED: 'FILLED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
} as const;

// =============================================================================
// Symbol Mappings
// =============================================================================

/**
 * Convert unified symbol to Reya format
 * Reya uses symbols like "BTCRUSDPERP" for perpetuals
 * @example "BTC/USD:USD" -> "BTCRUSDPERP"
 */
export function unifiedToReya(symbol: string): string {
  const parts = symbol.split('/');
  const base = parts[0];
  if (!base) {
    throw new Error(`Invalid symbol format: ${symbol}`);
  }

  // Extract quote from "USD:USD" format
  const quotePart = parts[1] ?? '';
  const quote = quotePart.split(':')[0] ?? 'USD';

  // Reya uses format: BASERQUOTEperp (e.g., BTCRUSDPERP)
  return `${base}R${quote}PERP`;
}

/**
 * Convert Reya symbol to unified format
 * @example "BTCRUSDPERP" -> "BTC/USD:USD"
 */
export function reyaToUnified(exchangeSymbol: string): string {
  // Parse BTCRUSDPERP -> base=BTC, quote=USD
  const perpIdx = exchangeSymbol.indexOf('PERP');
  if (perpIdx === -1) {
    // Could be a spot market like WETHRUSD
    const rIdx = exchangeSymbol.indexOf('RUSD');
    if (rIdx !== -1) {
      const base = exchangeSymbol.slice(0, rIdx);
      return `${base}/USD:USD`;
    }
    return exchangeSymbol;
  }

  const marketPart = exchangeSymbol.slice(0, perpIdx);
  // Find the 'R' separator before quote
  const rIdx = marketPart.indexOf('RUSD');
  if (rIdx !== -1) {
    const base = marketPart.slice(0, rIdx);
    return `${base}/USD:USD`;
  }

  return exchangeSymbol;
}

// =============================================================================
// Precision Constants
// =============================================================================

export const REYA_DEFAULT_PRECISION = {
  price: 8,
  amount: 6,
};

// =============================================================================
// WebSocket Constants
// =============================================================================

export const REYA_WS_CHANNELS = {
  MARKET_DEPTH: '/v2/market/depth',
  MARKET_SUMMARY: '/v2/market/summary',
  MARKET_PERP_EXECUTIONS: '/v2/market/perp-executions',
  MARKETS_SUMMARY: '/v2/markets/summary',
  PRICES: '/v2/prices',
  PRICE: '/v2/price',
  WALLET_POSITIONS: '/v2/wallet/positions',
  WALLET_ORDERS: '/v2/wallet/order-changes',
  WALLET_BALANCES: '/v2/wallet/account-balances',
  WALLET_PERP_EXECUTIONS: '/v2/wallet/perp-executions',
} as const;

export const REYA_WS_RECONNECT = {
  enabled: true,
  maxAttempts: 10,
  initialDelay: 500,
  maxDelay: 30000,
  multiplier: 2,
  jitter: 0.1,
};

// =============================================================================
// Funding Rate
// =============================================================================

export const REYA_FUNDING_INTERVAL_HOURS = 1; // Reya uses continuous funding

// =============================================================================
// Exchange ID
// =============================================================================

export const REYA_EXCHANGE_ID = 1; // Default exchange ID for perps
