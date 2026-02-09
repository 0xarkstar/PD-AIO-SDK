/**
 * Extended Exchange Constants
 *
 * API endpoints, rate limits, and configuration constants for Extended
 */

/**
 * API URLs for Extended mainnet and testnet
 */
export const EXTENDED_API_URLS = {
  mainnet: {
    rest: 'https://api.starknet.extended.exchange',
    websocket: 'wss://ws.starknet.extended.exchange',
    starknet: 'https://starknet-mainnet.public.blastapi.io',
  },
  testnet: {
    rest: 'https://api.starknet.sepolia.extended.exchange',
    websocket: 'wss://ws.starknet.sepolia.extended.exchange',
    starknet: 'https://starknet-sepolia.public.blastapi.io',
  },
} as const;

/**
 * API endpoints
 */
export const EXTENDED_ENDPOINTS = {
  // Market Data (Public)
  MARKETS: '/api/v1/info/markets',
  TICKER: '/api/v1/info/markets',
  TICKER_SYMBOL: '/api/v1/info/markets/{market}/stats',
  ORDERBOOK: '/api/v1/info/markets/{market}/orderbook',
  TRADES: '/api/v1/info/markets/{market}/trades',
  FUNDING_RATE: '/api/v1/info/{market}/funding',
  FUNDING_HISTORY: '/api/v1/info/{market}/funding/history',

  // Trading (Private)
  CREATE_ORDER: '/api/v1/user/order',
  CANCEL_ORDER: '/api/v1/user/order/{orderId}',
  CANCEL_ALL_ORDERS: '/api/v1/user/orders/cancel-all',
  EDIT_ORDER: '/api/v1/user/order/{orderId}',
  BATCH_ORDERS: '/api/v1/user/orders/batch',
  OPEN_ORDERS: '/api/v1/user/orders',
  ORDER_HISTORY: '/api/v1/user/orders/history',
  ORDER_STATUS: '/api/v1/user/order/{orderId}',

  // Positions & Account
  POSITIONS: '/api/v1/user/positions',
  BALANCE: '/api/v1/user/balance',
  LEVERAGE: '/api/v1/user/leverage',
  MARGIN_MODE: '/api/v1/user/margin-mode',
  USER_TRADES: '/api/v1/user/trades',
  USER_FEES: '/api/v1/user/fees',
  PORTFOLIO: '/api/v1/user/portfolio',

  // StarkNet specific
  STARKNET_STATE: '/api/v1/starknet/state',
  STARKNET_TX: '/api/v1/starknet/transaction/{txHash}',
  STARKNET_ACCOUNT: '/api/v1/starknet/account/{address}',

  // Rate Limit Status
  RATE_LIMIT_STATUS: '/api/v1/rate-limit',
} as const;

/**
 * Rate limit configurations
 */
export const EXTENDED_RATE_LIMITS = {
  default: {
    maxRequests: 1000,
    windowMs: 60000, // 1 minute (1000 req/min per API docs)
  },
  authenticated: {
    maxRequests: 1000,
    windowMs: 60000, // 1 minute
  },
  vip: {
    maxRequests: 12000,
    windowMs: 300000, // 5 minutes (60000/5min for market makers)
  },
} as const;

/**
 * Endpoint weights for rate limiting
 */
export const EXTENDED_ENDPOINT_WEIGHTS = {
  [EXTENDED_ENDPOINTS.MARKETS]: 1,
  [EXTENDED_ENDPOINTS.TICKER_SYMBOL]: 1,
  [EXTENDED_ENDPOINTS.ORDERBOOK]: 2,
  [EXTENDED_ENDPOINTS.TRADES]: 1,
  [EXTENDED_ENDPOINTS.FUNDING_RATE]: 1,
  [EXTENDED_ENDPOINTS.CREATE_ORDER]: 10,
  // CANCEL_ORDER and EDIT_ORDER share the same endpoint path, use higher weight
  [EXTENDED_ENDPOINTS.CANCEL_ORDER]: 10,
  [EXTENDED_ENDPOINTS.CANCEL_ALL_ORDERS]: 10,
  [EXTENDED_ENDPOINTS.BATCH_ORDERS]: 20,
  [EXTENDED_ENDPOINTS.POSITIONS]: 2,
  [EXTENDED_ENDPOINTS.BALANCE]: 2,
  [EXTENDED_ENDPOINTS.LEVERAGE]: 5,
} as const;

/**
 * WebSocket configuration
 */
export const EXTENDED_WS_CONFIG = {
  reconnectDelay: 1000,
  maxReconnectDelay: 60000,
  reconnectAttempts: 10,
  pingInterval: 30000,
  pongTimeout: 10000,
} as const;

/**
 * WebSocket channels
 */
export const EXTENDED_WS_CHANNELS = {
  ORDERBOOK: 'orderbook',
  TRADES: 'trades',
  TICKER: 'ticker',
  ORDERS: 'orders',
  POSITIONS: 'positions',
  BALANCE: 'balance',
  FUNDING: 'funding',
} as const;

/**
 * Order types supported by Extended
 */
export const EXTENDED_ORDER_TYPES = ['market', 'limit', 'stop', 'stop_limit'] as const;

/**
 * Order sides
 */
export const EXTENDED_ORDER_SIDES = ['buy', 'sell'] as const;

/**
 * Order status values
 */
export const EXTENDED_ORDER_STATUS = {
  PENDING: 'pending',
  OPEN: 'open',
  FILLED: 'filled',
  PARTIALLY_FILLED: 'partially_filled',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const;

/**
 * Position sides
 */
export const EXTENDED_POSITION_SIDES = ['long', 'short'] as const;

/**
 * Margin modes
 */
export const EXTENDED_MARGIN_MODES = ['cross', 'isolated'] as const;

/**
 * Leverage tiers
 */
export const EXTENDED_LEVERAGE_TIERS = {
  MIN: 1,
  MAX: 100,
  DEFAULT: 10,
} as const;

/**
 * Default configuration values
 */
export const EXTENDED_DEFAULTS = {
  timeout: 30000, // 30 seconds
  orderBookDepth: 50,
  tradesLimit: 100,
  orderHistoryLimit: 500,
  defaultLeverage: 10,
  maxLeverage: 100,
} as const;

/**
 * StarkNet configuration
 */
export const EXTENDED_STARKNET_CONFIG = {
  chainId: {
    mainnet: 'SN_MAIN',
    testnet: 'SN_GOERLI',
  },
  blockTime: 600000, // 10 minutes in milliseconds
  confirmations: 1,
} as const;
