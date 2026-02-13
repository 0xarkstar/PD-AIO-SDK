/**
 * Jupiter Perps Exchange Constants
 *
 * Jupiter Perps is an on-chain perpetuals exchange on Solana using the JLP pool.
 * Unlike traditional perp exchanges, it uses borrow fees instead of funding rates.
 *
 * @see https://jup.ag/perps
 * @see https://dev.jup.ag/docs/perps
 */

// =============================================================================
// API Endpoints
// =============================================================================

export const JUPITER_API_URLS = {
  mainnet: {
    price: 'https://hermes.pyth.network/v2/updates/price/latest',
    stats: 'https://perp-api.jup.ag', // Stats API (unofficial, may change)
  },
  // Jupiter Perps only operates on mainnet
} as const;

export const JUPITER_MAINNET_PRICE_API = JUPITER_API_URLS.mainnet.price;
export const JUPITER_MAINNET_STATS_API = JUPITER_API_URLS.mainnet.stats;

/**
 * Pyth Network price feed IDs for Jupiter markets
 * @see https://pyth.network/developers/price-feed-ids
 */
export const JUPITER_PYTH_FEED_IDS: Record<string, string> = {
  SOL: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  ETH: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  BTC: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
};

// =============================================================================
// Solana Program Constants
// =============================================================================

/**
 * Jupiter Perpetuals Program ID on Solana mainnet
 */
export const JUPITER_PERPS_PROGRAM_ID = 'PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2verr';

/**
 * JLP Token Mint Address
 */
export const JLP_TOKEN_MINT = '27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4';

/**
 * Token mint addresses for collateral/markets
 */
export const JUPITER_TOKEN_MINTS = {
  SOL: 'So11111111111111111111111111111111111111112',
  ETH: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // Wormhole ETH
  BTC: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', // Wormhole BTC (WBTC)
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
} as const;

// =============================================================================
// Rate Limits
// =============================================================================

export const JUPITER_RATE_LIMIT = {
  maxRequests: 60,
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
};

// =============================================================================
// Trading Constants
// =============================================================================

/**
 * Supported perpetual markets on Jupiter
 * Jupiter Perps supports SOL, ETH, and BTC
 */
export const JUPITER_MARKETS = {
  'SOL-PERP': {
    symbol: 'SOL/USD:USD',
    baseToken: 'SOL',
    maxLeverage: 250,
    minPositionSize: 0.01,
    tickSize: 0.001,
    stepSize: 0.001,
  },
  'ETH-PERP': {
    symbol: 'ETH/USD:USD',
    baseToken: 'ETH',
    maxLeverage: 250,
    minPositionSize: 0.001,
    tickSize: 0.01,
    stepSize: 0.0001,
  },
  'BTC-PERP': {
    symbol: 'BTC/USD:USD',
    baseToken: 'BTC',
    maxLeverage: 250,
    minPositionSize: 0.0001,
    tickSize: 0.1,
    stepSize: 0.00001,
  },
} as const;

export const JUPITER_ORDER_SIDES = {
  LONG: 'long',
  SHORT: 'short',
} as const;

// =============================================================================
// Symbol Mappings
// =============================================================================

/**
 * Convert unified symbol to Jupiter format
 * @example "SOL/USD:USD" -> "SOL-PERP"
 * @example "BTC/USD:USD" -> "BTC-PERP"
 */
export function unifiedToJupiter(symbol: string): string {
  const parts = symbol.split('/');
  const base = parts[0];

  if (!base) {
    throw new Error(`Invalid symbol format: ${symbol}`);
  }

  // Jupiter format: "SOL-PERP", "ETH-PERP", "BTC-PERP"
  return `${base}-PERP`;
}

/**
 * Convert Jupiter symbol to unified format
 * @example "SOL-PERP" -> "SOL/USD:USD"
 * @example "BTC-PERP" -> "BTC/USD:USD"
 */
export function jupiterToUnified(exchangeSymbol: string): string {
  // Jupiter format: "SOL-PERP"
  const base = exchangeSymbol.replace('-PERP', '');

  // Jupiter Perps uses USD as quote currency
  return `${base}/USD:USD`;
}

/**
 * Get base token from unified symbol
 */
export function getBaseToken(symbol: string): string {
  const parts = symbol.split('/');
  return parts[0] || '';
}

// =============================================================================
// Precision Constants
// =============================================================================

export const JUPITER_DEFAULT_PRECISION = {
  price: 6,
  amount: 4,
};

// =============================================================================
// Borrow Fee Constants
// =============================================================================

/**
 * Jupiter Perps uses borrow fees instead of funding rates
 * Fees compound hourly based on position utilization
 */
export const JUPITER_BORROW_FEE = {
  intervalHours: 1, // Hourly compounding
  minRate: 0.0001, // 0.01% minimum hourly rate
  maxRate: 0.01, // 1% maximum hourly rate (during high utilization)
};

// =============================================================================
// Solana RPC Endpoints
// =============================================================================

export const SOLANA_RPC_ENDPOINTS = {
  mainnet: ['https://api.mainnet-beta.solana.com', 'https://solana-api.projectserum.com'],
} as const;

export const SOLANA_DEFAULT_RPC = SOLANA_RPC_ENDPOINTS.mainnet[0];

// =============================================================================
// Error Messages
// =============================================================================

export const JUPITER_ERROR_MESSAGES: Record<string, string> = {
  'insufficient collateral': 'INSUFFICIENT_MARGIN',
  'insufficient balance': 'INSUFFICIENT_BALANCE',
  'position not found': 'POSITION_NOT_FOUND',
  'invalid leverage': 'INVALID_LEVERAGE',
  'max leverage exceeded': 'MAX_LEVERAGE_EXCEEDED',
  'min position size': 'MIN_POSITION_SIZE',
  'oracle price stale': 'ORACLE_ERROR',
  'price not available': 'ORACLE_ERROR',
  'no price data': 'ORACLE_ERROR',
  'pool capacity exceeded': 'POOL_CAPACITY_EXCEEDED',
  'rate limit': 'RATE_LIMIT_EXCEEDED',
  'transaction failed': 'TRANSACTION_FAILED',
};
