/**
 * Backpack constants and configuration
 */

/**
 * Backpack API endpoints
 */
export const BACKPACK_API_URLS = {
  mainnet: {
    rest: 'https://api.backpack.exchange/v1',
    websocket: 'wss://ws.backpack.exchange/v1',
  },
  testnet: {
    rest: 'https://api-testnet.backpack.exchange/v1',
    websocket: 'wss://ws-testnet.backpack.exchange/v1',
  },
} as const;

/**
 * Backpack rate limits (per minute)
 */
export const BACKPACK_RATE_LIMITS = {
  rest: {
    maxRequests: 2000,
    windowMs: 60000, // 1 minute
  },
  websocket: {
    maxSubscriptions: 100,
  },
} as const;

/**
 * Backpack API endpoint weights
 */
export const BACKPACK_ENDPOINT_WEIGHTS = {
  fetchMarkets: 1,
  fetchTicker: 1,
  fetchOrderBook: 2,
  fetchTrades: 2,
  fetchFundingRate: 1,
  fetchPositions: 3,
  fetchBalance: 2,
  fetchOpenOrders: 3,
  fetchClosedOrders: 5,
  createOrder: 5,
  cancelOrder: 3,
  createBatchOrders: 15,
  cancelAllOrders: 10,
  modifyOrder: 5,
  fetchOrder: 2,
  fetchMyTrades: 5,
  setLeverage: 3,
} as const;

/**
 * Backpack order types mapping
 */
export const BACKPACK_ORDER_TYPES = {
  market: 'MARKET',
  limit: 'LIMIT',
  postOnly: 'POST_ONLY',
} as const;

/**
 * Backpack order sides mapping
 */
export const BACKPACK_ORDER_SIDES = {
  buy: 'BUY',
  sell: 'SELL',
} as const;

/**
 * Backpack time in force mapping
 */
export const BACKPACK_TIME_IN_FORCE = {
  GTC: 'GTC',
  IOC: 'IOC',
  FOK: 'FOK',
  POST_ONLY: 'POST_ONLY',
} as const;

/**
 * Backpack order status mapping
 */
export const BACKPACK_ORDER_STATUS = {
  NEW: 'open',
  OPEN: 'open',
  PARTIAL: 'partiallyFilled',
  FILLED: 'filled',
  CANCELLED: 'canceled',
  REJECTED: 'rejected',
} as const;

/**
 * Backpack WebSocket channels
 */
export const BACKPACK_WS_CHANNELS = {
  orderbook: 'orderbook',
  trades: 'trades',
  ticker: 'ticker',
  positions: 'positions',
  orders: 'orders',
  balance: 'balance',
} as const;

/**
 * Backpack precision defaults
 */
export const BACKPACK_PRECISION = {
  amount: 8,
  price: 8,
} as const;

/**
 * Backpack max leverage
 */
export const BACKPACK_MAX_LEVERAGE = 10;

/**
 * Backpack maintenance margin rate
 */
export const BACKPACK_MAINTENANCE_MARGIN_RATE = 0.05; // 5%
