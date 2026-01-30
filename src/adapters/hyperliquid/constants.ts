/**
 * Hyperliquid Exchange Constants
 */

// =============================================================================
// API Endpoints
// =============================================================================

export const HYPERLIQUID_MAINNET_API = 'https://api.hyperliquid.xyz';
export const HYPERLIQUID_TESTNET_API = 'https://api.hyperliquid-testnet.xyz';

export const HYPERLIQUID_MAINNET_WS = 'wss://api.hyperliquid.xyz/ws';
export const HYPERLIQUID_TESTNET_WS = 'wss://api.hyperliquid-testnet.xyz/ws';

// =============================================================================
// EIP-712 Constants
// =============================================================================

export const HYPERLIQUID_CHAIN_ID = 1337; // Trading operations (phantom agent)
export const HYPERLIQUID_ARBITRUM_CHAIN_ID = 42161; // Account operations

export const HYPERLIQUID_EIP712_DOMAIN = {
  name: 'Exchange',
  version: '1',
  chainId: HYPERLIQUID_CHAIN_ID,
  verifyingContract: '0x0000000000000000000000000000000000000000',
};

export const HYPERLIQUID_ACTION_TYPES = {
  Agent: [
    { name: 'source', type: 'string' },
    { name: 'connectionId', type: 'bytes32' },
  ],
};

// =============================================================================
// Rate Limits
// =============================================================================

export const HYPERLIQUID_RATE_LIMIT = {
  maxRequests: 1200,
  windowMs: 60000, // 1 minute
  weights: {
    // Public endpoints
    fetchMarkets: 1,
    fetchOrderBook: 2,
    fetchTrades: 1,
    fetchTicker: 1,
    fetchFundingRate: 1,

    // Private endpoints
    fetchPositions: 2,
    fetchBalance: 2,
    createOrder: 5,
    cancelOrder: 3,
    createBatchOrders: 20,
    cancelAllOrders: 10,
  },
};

// =============================================================================
// Trading Constants
// =============================================================================

export const HYPERLIQUID_ORDER_TYPES = {
  LIMIT: 'limit',
  MARKET: 'market',
} as const;

export const HYPERLIQUID_TIME_IN_FORCE = {
  GTC: 'Gtc', // Good till cancel
  IOC: 'Ioc', // Immediate or cancel
  ALO: 'Alo', // Add liquidity only (post-only)
} as const;

// =============================================================================
// Symbol Mappings
// =============================================================================

/**
 * Convert unified symbol to Hyperliquid format
 * Hyperliquid uses just the base asset name (e.g., "BTC", "ETH")
 * @example "BTC/USDT:USDT" -> "BTC"
 */
export function unifiedToHyperliquid(symbol: string): string {
  const parts = symbol.split('/');
  const base = parts[0];
  if (!base) {
    throw new Error(`Invalid symbol format: ${symbol}`);
  }

  // Hyperliquid API uses just the base symbol
  return base;
}

/**
 * Convert Hyperliquid symbol to unified format
 * @example "BTC" -> "BTC/USDT:USDT"
 */
export function hyperliquidToUnified(exchangeSymbol: string): string {
  // Hyperliquid perpetuals are all quoted in USDT
  return `${exchangeSymbol}/USDT:USDT`;
}

// =============================================================================
// Precision Constants
// =============================================================================

export const HYPERLIQUID_DEFAULT_PRECISION = {
  price: 6,
  amount: 3,
};

// =============================================================================
// WebSocket Constants
// =============================================================================

export const HYPERLIQUID_WS_CHANNELS = {
  L2_BOOK: 'l2Book',
  TRADES: 'trades',
  ALL_MIDS: 'allMids',
  USER: 'user',
  USER_EVENTS: 'userEvents',
  USER_FILLS: 'userFills',
} as const;

export const HYPERLIQUID_WS_RECONNECT = {
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

export const HYPERLIQUID_FUNDING_INTERVAL_HOURS = 8;

// =============================================================================
// Error Messages
// =============================================================================

export const HYPERLIQUID_ERROR_MESSAGES: Record<string, string> = {
  'insufficient margin': 'INSUFFICIENT_MARGIN',
  'invalid signature': 'INVALID_SIGNATURE',
  'order would immediately match': 'ORDER_WOULD_MATCH',
  'position does not exist': 'POSITION_NOT_FOUND',
  'order not found': 'ORDER_NOT_FOUND',
  'rate limit exceeded': 'RATE_LIMIT_EXCEEDED',
};
