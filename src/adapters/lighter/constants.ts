/**
 * Lighter constants and configuration
 */

export const LIGHTER_API_URLS = {
  mainnet: {
    rest: 'https://mainnet.zklighter.elliot.ai',
    websocket: 'wss://mainnet.zklighter.elliot.ai/stream',
  },
  testnet: {
    rest: 'https://testnet.zklighter.elliot.ai',
    websocket: 'wss://testnet.zklighter.elliot.ai/stream',
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

/**
 * WebSocket configuration
 */
export const LIGHTER_WS_CONFIG = {
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  reconnectAttempts: 5,
  pingInterval: 30000,
  pongTimeout: 5000,
} as const;

/**
 * WebSocket channels
 */
export const LIGHTER_WS_CHANNELS = {
  ORDERBOOK: 'orderbook',
  TRADES: 'trades',
  TICKER: 'ticker',
  POSITIONS: 'positions',
  ORDERS: 'orders',
} as const;
