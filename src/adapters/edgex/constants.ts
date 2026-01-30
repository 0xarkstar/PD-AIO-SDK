/**
 * EdgeX constants and configuration
 */

/**
 * EdgeX API endpoints
 */
export const EDGEX_API_URLS = {
  mainnet: {
    rest: 'https://pro.edgex.exchange',
    websocket: 'wss://quote.edgex.exchange',
  },
  // Note: EdgeX does not provide a public testnet - uses mainnet URLs
  testnet: {
    rest: 'https://pro.edgex.exchange',
    websocket: 'wss://quote.edgex.exchange',
  },
} as const;

/**
 * EdgeX rate limits (per minute)
 */
export const EDGEX_RATE_LIMITS = {
  rest: {
    maxRequests: 1200,
    windowMs: 60000, // 1 minute
  },
  websocket: {
    maxSubscriptions: 100,
  },
} as const;

/**
 * EdgeX API endpoint weights
 */
export const EDGEX_ENDPOINT_WEIGHTS = {
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
 * EdgeX order types mapping
 */
export const EDGEX_ORDER_TYPES = {
  market: 'MARKET',
  limit: 'LIMIT',
} as const;

/**
 * EdgeX order sides mapping
 */
export const EDGEX_ORDER_SIDES = {
  buy: 'BUY',
  sell: 'SELL',
} as const;

/**
 * EdgeX time in force mapping
 */
export const EDGEX_TIME_IN_FORCE = {
  GTC: 'GTC',
  IOC: 'IOC',
  FOK: 'FOK',
} as const;

/**
 * EdgeX order status mapping
 */
export const EDGEX_ORDER_STATUS = {
  PENDING: 'pending',
  OPEN: 'open',
  PARTIALLY_FILLED: 'partiallyFilled',
  FILLED: 'filled',
  CANCELLED: 'canceled',
  REJECTED: 'rejected',
} as const;

/**
 * EdgeX WebSocket channels
 */
export const EDGEX_WS_CHANNELS = {
  orderbook: 'orderbook',
  trades: 'trades',
  ticker: 'ticker',
  positions: 'positions',
  orders: 'orders',
  balance: 'balance',
} as const;

/**
 * StarkEx constants
 */
export const EDGEX_STARK_CONSTANTS = {
  FIELD_PRIME: BigInt('0x800000000000011000000000000000000000000000000000000000000000001'),
  MAX_AMOUNT: BigInt('2') ** BigInt('63') - BigInt('1'),
} as const;

/**
 * EdgeX precision defaults
 */
export const EDGEX_PRECISION = {
  amount: 8,
  price: 8,
} as const;

/**
 * EdgeX max leverage
 */
export const EDGEX_MAX_LEVERAGE = 25;

/**
 * EdgeX maintenance margin rate
 */
export const EDGEX_MAINTENANCE_MARGIN_RATE = 0.04; // 4%
