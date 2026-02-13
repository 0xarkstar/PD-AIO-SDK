/**
 * GMX v2 Exchange Constants
 *
 * GMX v2 is a decentralized perpetuals exchange on Arbitrum and Avalanche.
 * Uses synthetics-based perpetuals with on-chain keepers for order execution.
 *
 * @see https://docs.gmx.io/docs/api/rest-v2/
 * @see https://github.com/gmx-io/gmx-synthetics
 */

// =============================================================================
// API Endpoints
// =============================================================================

export const GMX_API_URLS = {
  arbitrum: {
    api: 'https://arbitrum-api.gmxinfra.io',
    subgraph: 'https://gmx.squids.live/gmx-synthetics-arbitrum:prod/api/graphql',
    rpc: 'https://arb1.arbitrum.io/rpc',
    chainId: 42161,
  },
  avalanche: {
    api: 'https://avalanche-api.gmxinfra.io',
    subgraph: 'https://gmx.squids.live/gmx-synthetics-avalanche:prod/api/graphql',
    rpc: 'https://api.avax.network/ext/bc/C/rpc',
    chainId: 43114,
  },
  arbitrumSepolia: {
    api: 'https://arbitrum-sepolia-api.gmxinfra.io',
    subgraph: 'https://gmx.squids.live/gmx-synthetics-arbitrum-sepolia:prod/api/graphql',
    rpc: 'https://sepolia-rollup.arbitrum.io/rpc',
    chainId: 421614,
  },
} as const;

export const GMX_ARBITRUM_API = GMX_API_URLS.arbitrum.api;
export const GMX_AVALANCHE_API = GMX_API_URLS.avalanche.api;

// =============================================================================
// Precision Constants
// =============================================================================

/**
 * GMX uses specific precision constants for on-chain values
 * Oracle prices use 30 decimals
 */
export const GMX_PRECISION = {
  PRICE: 1e30, // Oracle price precision (30 decimals)
  USD: 1e30, // USD amounts
  FACTOR: 1e30, // General factor precision
  BASIS_POINTS: 1e4, // 10000 = 100%
  FLOAT: 1e8, // Float precision for percentages
  TOKEN_DECIMALS: {
    ETH: 18,
    WETH: 18,
    BTC: 8,
    WBTC: 8,
    USDC: 6,
    USDT: 6,
    DAI: 18,
    AVAX: 18,
    ARB: 18,
    SOL: 9,
    LINK: 18,
    UNI: 18,
  },
} as const;

// =============================================================================
// Rate Limits
// =============================================================================

export const GMX_RATE_LIMIT = {
  maxRequests: 60,
  windowMs: 60000, // 1 minute
  weights: {
    fetchMarkets: 1,
    fetchTicker: 1,
    fetchOrderBook: 2,
    fetchTrades: 1,
    fetchFundingRate: 1,
    fetchOHLCV: 2,
    fetchPositions: 3,
    fetchBalance: 2,
  },
} as const;

// =============================================================================
// Market Definitions
// =============================================================================

/**
 * GMX v2 market configurations
 * Markets are defined by index token + long/short collateral tokens
 */
export const GMX_MARKETS = {
  // Arbitrum Markets
  'ETH/USD:ETH': {
    marketAddress: '0x70d95587d40A2caf56bd97485aB3Eec10Bee6336',
    indexToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
    longToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
    shortToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
    symbol: 'ETH/USD:ETH',
    baseAsset: 'ETH',
    quoteAsset: 'USD',
    settleAsset: 'ETH',
    maxLeverage: 100,
    minOrderSize: 0.001,
    tickSize: 0.01,
    stepSize: 0.0001,
    chain: 'arbitrum',
  },
  'BTC/USD:BTC': {
    marketAddress: '0x47c031236e19d024b42f8AE6780E44A573170703',
    indexToken: '0x47904963fc8b2340414262125aF798B9655E58Cd', // WBTC
    longToken: '0x47904963fc8b2340414262125aF798B9655E58Cd', // WBTC
    shortToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
    symbol: 'BTC/USD:BTC',
    baseAsset: 'BTC',
    quoteAsset: 'USD',
    settleAsset: 'BTC',
    maxLeverage: 100,
    minOrderSize: 0.0001,
    tickSize: 0.1,
    stepSize: 0.00001,
    chain: 'arbitrum',
  },
  'SOL/USD:ETH': {
    marketAddress: '0x09400D9DB990D5ed3f35D7be61DfAEB900Af03C9',
    indexToken: '0x2bcC6D6CdBbDC0a4071e48bb3B969b06B3330c07', // SOL
    longToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
    shortToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
    symbol: 'SOL/USD:ETH',
    baseAsset: 'SOL',
    quoteAsset: 'USD',
    settleAsset: 'ETH',
    maxLeverage: 50,
    minOrderSize: 0.1,
    tickSize: 0.001,
    stepSize: 0.01,
    chain: 'arbitrum',
  },
  'ARB/USD:ARB': {
    marketAddress: '0xC25cEf6061Cf5dE5eb761b50E4743c1F5D7E5407',
    indexToken: '0x912CE59144191C1204E64559FE8253a0e49E6548', // ARB
    longToken: '0x912CE59144191C1204E64559FE8253a0e49E6548', // ARB
    shortToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
    symbol: 'ARB/USD:ARB',
    baseAsset: 'ARB',
    quoteAsset: 'USD',
    settleAsset: 'ARB',
    maxLeverage: 50,
    minOrderSize: 1,
    tickSize: 0.0001,
    stepSize: 0.1,
    chain: 'arbitrum',
  },
  'LINK/USD:ETH': {
    marketAddress: '0x7f1fa204bb700853D36994DA19F830b6Ad18455C',
    indexToken: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4', // LINK
    longToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
    shortToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
    symbol: 'LINK/USD:ETH',
    baseAsset: 'LINK',
    quoteAsset: 'USD',
    settleAsset: 'ETH',
    maxLeverage: 50,
    minOrderSize: 0.1,
    tickSize: 0.001,
    stepSize: 0.01,
    chain: 'arbitrum',
  },
  'DOGE/USD:ETH': {
    marketAddress: '0x6853EA96FF216fAb11D2d930CE3C508556A4bdc4',
    indexToken: '0xC4da4c24fd591125c3F47b340b6f4f76111883d8', // DOGE
    longToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
    shortToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
    symbol: 'DOGE/USD:ETH',
    baseAsset: 'DOGE',
    quoteAsset: 'USD',
    settleAsset: 'ETH',
    maxLeverage: 50,
    minOrderSize: 10,
    tickSize: 0.00001,
    stepSize: 1,
    chain: 'arbitrum',
  },
  'XRP/USD:ETH': {
    marketAddress: '0x0CCB4fAa6f1F1B30911619f1184082aB4E25813c',
    indexToken: '0xc14e065b0067dE91534e032868f5Ac6ecf2c6868', // XRP
    longToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
    shortToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
    symbol: 'XRP/USD:ETH',
    baseAsset: 'XRP',
    quoteAsset: 'USD',
    settleAsset: 'ETH',
    maxLeverage: 50,
    minOrderSize: 1,
    tickSize: 0.0001,
    stepSize: 0.1,
    chain: 'arbitrum',
  },
  'LTC/USD:ETH': {
    marketAddress: '0xD9535bB5f58A1a75032416F2dFe7880C30575a41',
    indexToken: '0xB46A094Bc4B0adBD801E14b9DB95e05E28962764', // LTC
    longToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
    shortToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
    symbol: 'LTC/USD:ETH',
    baseAsset: 'LTC',
    quoteAsset: 'USD',
    settleAsset: 'ETH',
    maxLeverage: 50,
    minOrderSize: 0.01,
    tickSize: 0.01,
    stepSize: 0.001,
    chain: 'arbitrum',
  },
  // Avalanche Markets
  'AVAX/USD:AVAX': {
    marketAddress: '0xD996ff47A1F763E1e55415BC4437c59292D1F415',
    indexToken: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', // WAVAX
    longToken: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', // WAVAX
    shortToken: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC
    symbol: 'AVAX/USD:AVAX',
    baseAsset: 'AVAX',
    quoteAsset: 'USD',
    settleAsset: 'AVAX',
    maxLeverage: 100,
    minOrderSize: 0.1,
    tickSize: 0.01,
    stepSize: 0.01,
    chain: 'avalanche',
  },
  'ETH/USD:AVAX': {
    marketAddress: '0xB7e69749E3d2EDd90ea59A4932EFEa2D41E245d7',
    indexToken: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', // WETH.e
    longToken: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', // WAVAX
    shortToken: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC
    symbol: 'ETH/USD:AVAX',
    baseAsset: 'ETH',
    quoteAsset: 'USD',
    settleAsset: 'AVAX',
    maxLeverage: 100,
    minOrderSize: 0.001,
    tickSize: 0.01,
    stepSize: 0.0001,
    chain: 'avalanche',
  },
  'BTC/USD:AVAX': {
    marketAddress: '0xFb02132333A79C8B5Bd5b6BD5e895bE3936F97c0',
    indexToken: '0x152b9d0FdC40C096757F570A51E494bd4b943E50', // BTC.b
    longToken: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', // WAVAX
    shortToken: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC
    symbol: 'BTC/USD:AVAX',
    baseAsset: 'BTC',
    quoteAsset: 'USD',
    settleAsset: 'AVAX',
    maxLeverage: 100,
    minOrderSize: 0.0001,
    tickSize: 0.1,
    stepSize: 0.00001,
    chain: 'avalanche',
  },
} as const;

export type GMXMarketKey = keyof typeof GMX_MARKETS;

/**
 * Map from market address to symbol
 */
export const GMX_MARKET_ADDRESS_MAP: Record<string, GMXMarketKey> = Object.entries(
  GMX_MARKETS
).reduce(
  (acc, [key, config]) => {
    acc[config.marketAddress.toLowerCase()] = key as GMXMarketKey;
    return acc;
  },
  {} as Record<string, GMXMarketKey>
);

// =============================================================================
// Order Types and Directions
// =============================================================================

export const GMX_ORDER_TYPES = {
  MARKET_INCREASE: 0, // Open/increase position at market
  MARKET_DECREASE: 1, // Close/decrease position at market
  LIMIT_INCREASE: 2, // Limit order to open/increase
  LIMIT_DECREASE: 3, // Limit order to close/decrease
  STOP_LOSS: 4, // Stop loss order
  LIQUIDATION: 5, // Liquidation order
} as const;

export const GMX_DECREASE_POSITION_SWAP_TYPES = {
  NO_SWAP: 0,
  SWAP_PNL_TOKEN_TO_COLLATERAL: 1,
  SWAP_COLLATERAL_TO_PNL_TOKEN: 2,
} as const;

// =============================================================================
// Symbol Conversion
// =============================================================================

/**
 * Convert unified symbol to GMX market key
 * @example "ETH/USD:ETH" -> "ETH/USD:ETH"
 * @example "BTC/USD" -> "BTC/USD:BTC"
 */
export function unifiedToGmx(symbol: string): GMXMarketKey | undefined {
  // If already a valid GMX market key
  if (symbol in GMX_MARKETS) {
    return symbol as GMXMarketKey;
  }

  // Try to find a matching market by base asset
  const base = symbol.split('/')[0]?.toUpperCase();
  if (!base) return undefined;

  // Look for exact match first
  for (const [key, market] of Object.entries(GMX_MARKETS)) {
    if (market.baseAsset === base) {
      return key as GMXMarketKey;
    }
  }

  return undefined;
}

/**
 * Convert GMX market to unified format
 */
export function gmxToUnified(marketKey: GMXMarketKey): string {
  const market = GMX_MARKETS[marketKey];
  return market?.symbol || marketKey;
}

/**
 * Get market config by address
 */
export function getMarketByAddress(
  address: string
): (typeof GMX_MARKETS)[GMXMarketKey] | undefined {
  const key = GMX_MARKET_ADDRESS_MAP[address.toLowerCase()];
  return key ? GMX_MARKETS[key] : undefined;
}

/**
 * Get base token from symbol
 */
export function getBaseToken(symbol: string): string {
  const parts = symbol.split('/');
  return parts[0]?.toUpperCase() || '';
}

/**
 * Get token decimals for a base asset
 * GMX oracle prices are stored as: price * 10^(30 - tokenDecimals)
 * So to convert raw price to USD: raw / 10^(30 - tokenDecimals)
 */
export function getTokenDecimals(baseAsset: string): number {
  const decimals =
    GMX_PRECISION.TOKEN_DECIMALS[baseAsset as keyof typeof GMX_PRECISION.TOKEN_DECIMALS];
  return decimals ?? 18; // Default to 18 decimals
}

/**
 * Get the price divisor for a token's oracle price
 * Oracle prices = price_usd * 10^(30 - tokenDecimals)
 * Divisor = 10^(30 - tokenDecimals)
 */
export function getOraclePriceDivisor(baseAsset: string): number {
  const tokenDecimals = getTokenDecimals(baseAsset);
  return Math.pow(10, 30 - tokenDecimals);
}

/**
 * Get markets for a specific chain
 */
export function getMarketsForChain(
  chain: 'arbitrum' | 'avalanche'
): (typeof GMX_MARKETS)[GMXMarketKey][] {
  return Object.values(GMX_MARKETS).filter((m) => m.chain === chain);
}

// =============================================================================
// Funding Rate Constants
// =============================================================================

export const GMX_FUNDING = {
  // Funding rates are calculated per second and accumulate continuously
  // Rate depends on long/short open interest ratio
  calculationType: 'continuous', // GMX uses continuous funding
  baseRateFactor: 0.0000000001, // Base factor for funding calculations
} as const;

// =============================================================================
// Contract Addresses
// =============================================================================

export const GMX_CONTRACTS = {
  arbitrum: {
    exchangeRouter: '0x7C68C7866A64FA2160F78EEaE12217FFbf871fa8',
    router: '0x7452c558d45f8afC8c83dAe62C3f8A5BE19c71f6',
    dataStore: '0xFD70de6b91282D8017aA4E741e9Ae325CAb992d8',
    reader: '0xf60becbba223EEA9495Da3f606753867eC10d139',
    orderVault: '0x31eF83a530Fde1B38EE9A18093A333D8Bbbc40D5',
    positionRouter: '0xb87a436B93fFE9D75c5cFA7bAcFff96430b09868',
  },
  avalanche: {
    exchangeRouter: '0x79be2F4eC8A4143BaF963206c6e0d8b3b8a74a38',
    router: '0x820F5FfC5b525cD4d88Cd91aCd2119b38cB97b10',
    dataStore: '0x2F0b22339414AcD8fc5b7F5a299fdF5A96E0DfB6',
    reader: '0xdCf06A4A40579A5F4F53F3D57f2C2f145f404757',
    orderVault: '0xD3D60D22d415aD43b7e64b510D86A30f19B1B12C',
    positionRouter: '0xffF6D276Bc37c61A23f06410Dce4A400f66420f8',
  },
} as const;

// =============================================================================
// Error Messages
// =============================================================================

export const GMX_ERROR_MESSAGES: Record<string, string> = {
  'insufficient collateral': 'INSUFFICIENT_MARGIN',
  'insufficient balance': 'INSUFFICIENT_BALANCE',
  'position not found': 'POSITION_NOT_FOUND',
  'order not found': 'ORDER_NOT_FOUND',
  'max leverage exceeded': 'MAX_LEVERAGE_EXCEEDED',
  'min order size': 'MIN_ORDER_SIZE',
  'oracle error': 'ORACLE_ERROR',
  'market disabled': 'MARKET_PAUSED',
  'execution failed': 'TRANSACTION_FAILED',
  slippage: 'SLIPPAGE_EXCEEDED',
  liquidation: 'LIQUIDATION',
  'invalid price': 'INVALID_PRICE',
  keeper: 'KEEPER_ERROR',
} as const;
