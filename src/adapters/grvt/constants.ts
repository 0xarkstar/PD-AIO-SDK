/**
 * GRVT constants and configuration
 */

/**
 * GRVT API endpoints
 */
export const GRVT_API_URLS = {
  mainnet: {
    rest: 'https://api.grvt.io/v1',
    websocket: 'wss://ws.grvt.io/v1',
  },
  testnet: {
    rest: 'https://api-testnet.grvt.io/v1',
    websocket: 'wss://ws-testnet.grvt.io/v1',
  },
} as const;

/**
 * GRVT rate limits (per 10-second window)
 */
export const GRVT_RATE_LIMITS = {
  rest: {
    maxRequests: 100,
    windowMs: 10000, // 10 seconds
  },
  websocket: {
    maxSubscriptions: 50,
  },
} as const;

/**
 * GRVT API endpoint weights
 */
export const GRVT_ENDPOINT_WEIGHTS = {
  fetchMarkets: 1,
  fetchTicker: 1,
  fetchOrderBook: 2,
  fetchTrades: 2,
  fetchFundingRate: 1,
  fetchPositions: 2,
  fetchBalance: 2,
  fetchOpenOrders: 2,
  fetchClosedOrders: 3,
  createOrder: 5,
  cancelOrder: 3,
  createBatchOrders: 10,
  cancelAllOrders: 10,
  modifyOrder: 5,
  fetchOrder: 2,
  fetchMyTrades: 3,
  fetchDeposits: 2,
  fetchWithdrawals: 2,
  transfer: 5,
} as const;

/**
 * GRVT order types mapping
 */
export const GRVT_ORDER_TYPES = {
  market: 'MARKET',
  limit: 'LIMIT',
  limitMaker: 'LIMIT_MAKER',
} as const;

/**
 * GRVT order sides mapping
 */
export const GRVT_ORDER_SIDES = {
  buy: 'BUY',
  sell: 'SELL',
} as const;

/**
 * GRVT time in force mapping
 */
export const GRVT_TIME_IN_FORCE = {
  GTC: 'GTC',
  IOC: 'IOC',
  FOK: 'FOK',
  POST_ONLY: 'POST_ONLY',
} as const;

/**
 * GRVT order status mapping
 */
export const GRVT_ORDER_STATUS = {
  PENDING: 'pending',
  OPEN: 'open',
  PARTIALLY_FILLED: 'partiallyFilled',
  FILLED: 'filled',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
} as const;

/**
 * GRVT WebSocket channels
 */
export const GRVT_WS_CHANNELS = {
  orderbook: 'orderbook',
  trades: 'trades',
  ticker: 'ticker',
  positions: 'positions',
  orders: 'orders',
  balance: 'balance',
} as const;

/**
 * EIP-712 domain configuration for GRVT
 */
export const GRVT_EIP712_DOMAIN = {
  name: 'GRVT',
  version: '1',
  chainId: 1, // Mainnet
  verifyingContract: '0x0000000000000000000000000000000000000000', // Placeholder
} as const;

/**
 * EIP-712 order type definition
 */
export const GRVT_EIP712_ORDER_TYPE = {
  Order: [
    { name: 'instrument', type: 'string' },
    { name: 'orderType', type: 'string' },
    { name: 'side', type: 'string' },
    { name: 'size', type: 'string' },
    { name: 'price', type: 'string' },
    { name: 'timeInForce', type: 'string' },
    { name: 'reduceOnly', type: 'bool' },
    { name: 'postOnly', type: 'bool' },
    { name: 'nonce', type: 'uint256' },
    { name: 'expiry', type: 'uint256' },
  ],
} as const;

/**
 * GRVT precision defaults
 */
export const GRVT_PRECISION = {
  amount: 8,
  price: 8,
} as const;

/**
 * GRVT session cookie duration (milliseconds)
 */
export const GRVT_SESSION_DURATION = 3600000; // 1 hour

/**
 * GRVT max leverage
 */
export const GRVT_MAX_LEVERAGE = 100;

/**
 * GRVT maintenance margin rate
 */
export const GRVT_MAINTENANCE_MARGIN_RATE = 0.005; // 0.5%
