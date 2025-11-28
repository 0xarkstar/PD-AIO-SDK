/**
 * Lighter constants and configuration
 */

export const LIGHTER_API_URLS = {
  mainnet: {
    rest: 'https://api.lighter.xyz/v1',
    websocket: 'wss://ws.lighter.xyz/v1',
  },
  testnet: {
    rest: 'https://api-testnet.lighter.xyz/v1',
    websocket: 'wss://ws-testnet.lighter.xyz/v1',
  },
} as const;

export const LIGHTER_RATE_LIMITS = {
  tier1: { maxRequests: 60, windowMs: 60000 },
  tier2: { maxRequests: 600, windowMs: 60000 },
  tier3: { maxRequests: 4000, windowMs: 60000 },
} as const;

export const LIGHTER_ENDPOINT_WEIGHTS = {
  fetchMarkets: 1,
  fetchTicker: 1,
  fetchOrderBook: 2,
  fetchTrades: 2,
  fetchFundingRate: 1,
  fetchPositions: 2,
  fetchBalance: 2,
  fetchOpenOrders: 2,
  createOrder: 5,
  cancelOrder: 3,
  createBatchOrders: 10,
  cancelAllOrders: 10,
} as const;

export const LIGHTER_MAX_LEVERAGE = 50;
export const LIGHTER_FUNDING_INTERVAL_HOURS = 8;
