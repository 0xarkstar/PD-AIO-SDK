/**
 * Variational Exchange Constants
 *
 * API endpoints, rate limits, and configuration constants for Variational
 */
/**
 * API URLs for Variational mainnet and testnet
 */
export const VARIATIONAL_API_URLS = {
    mainnet: {
        rest: 'https://omni-client-api.prod.ap-northeast-1.variational.io',
        websocket: 'wss://ws.variational.io', // TODO: Update when WebSocket available
    },
    testnet: {
        rest: 'https://omni-client-api.testnet.variational.io', // TODO: Update when testnet available
        websocket: 'wss://ws-testnet.variational.io',
    },
};
/**
 * API endpoints
 */
export const VARIATIONAL_ENDPOINTS = {
    // Market Data (Public) - Currently Available
    METADATA_STATS: '/metadata/stats', // Returns platform-wide and per-listing statistics
    // Market Data (Public) - Planned/Expected
    MARKETS: '/api/v1/markets',
    TICKER: '/api/v1/ticker/{symbol}',
    ORDERBOOK: '/api/v1/orderbook/{symbol}',
    TRADES: '/api/v1/trades/{symbol}',
    FUNDING_RATE: '/api/v1/funding/{symbol}',
    FUNDING_HISTORY: '/api/v1/funding/{symbol}/history',
    // RFQ Specific - Under Development
    REQUEST_QUOTE: '/api/v1/rfq/request',
    ACCEPT_QUOTE: '/api/v1/rfq/accept/{quoteId}',
    QUOTES_HISTORY: '/api/v1/rfq/history',
    // Trading (Private) - Under Development
    CREATE_ORDER: '/api/v1/orders',
    CANCEL_ORDER: '/api/v1/orders/{orderId}',
    CANCEL_ALL_ORDERS: '/api/v1/orders/cancel-all',
    OPEN_ORDERS: '/api/v1/orders/open',
    ORDER_HISTORY: '/api/v1/orders/history',
    ORDER_STATUS: '/api/v1/orders/{orderId}',
    // Account & Positions - Under Development
    POSITIONS: '/api/v1/positions',
    BALANCE: '/api/v1/balance',
    USER_TRADES: '/api/v1/trades/user',
    USER_FEES: '/api/v1/fees',
    PORTFOLIO: '/api/v1/portfolio',
    // Rate Limit Status
    RATE_LIMIT_STATUS: '/api/v1/rate-limit',
};
/**
 * Rate limit configurations
 * Based on Variational API documentation:
 * - Per IP: 10 requests per 10 seconds
 * - Global: 1000 requests per minute
 */
export const VARIATIONAL_RATE_LIMITS = {
    perIp: {
        maxRequests: 10,
        windowMs: 10000, // 10 seconds
    },
    global: {
        maxRequests: 1000,
        windowMs: 60000, // 1 minute
    },
    // Conservative default (use per-IP limit)
    default: {
        maxRequests: 10,
        windowMs: 10000, // 10 seconds
    },
};
/**
 * Endpoint weights for rate limiting
 */
export const VARIATIONAL_ENDPOINT_WEIGHTS = {
    [VARIATIONAL_ENDPOINTS.METADATA_STATS]: 1,
    [VARIATIONAL_ENDPOINTS.MARKETS]: 1,
    [VARIATIONAL_ENDPOINTS.TICKER]: 1,
    [VARIATIONAL_ENDPOINTS.ORDERBOOK]: 2,
    [VARIATIONAL_ENDPOINTS.TRADES]: 1,
    [VARIATIONAL_ENDPOINTS.FUNDING_RATE]: 1,
    [VARIATIONAL_ENDPOINTS.REQUEST_QUOTE]: 5,
    [VARIATIONAL_ENDPOINTS.ACCEPT_QUOTE]: 10,
    [VARIATIONAL_ENDPOINTS.CREATE_ORDER]: 10,
    [VARIATIONAL_ENDPOINTS.CANCEL_ORDER]: 5,
    [VARIATIONAL_ENDPOINTS.POSITIONS]: 2,
    [VARIATIONAL_ENDPOINTS.BALANCE]: 2,
};
/**
 * WebSocket configuration
 */
export const VARIATIONAL_WS_CONFIG = {
    reconnectDelay: 1000,
    maxReconnectDelay: 60000,
    reconnectAttempts: 10,
    pingInterval: 30000,
    pongTimeout: 10000,
};
/**
 * WebSocket channels
 */
export const VARIATIONAL_WS_CHANNELS = {
    ORDERBOOK: 'orderbook',
    TRADES: 'trades',
    TICKER: 'ticker',
    ORDERS: 'orders',
    POSITIONS: 'positions',
    BALANCE: 'balance',
    FUNDING: 'funding',
};
/**
 * Order types supported by Variational
 */
export const VARIATIONAL_ORDER_TYPES = ['market', 'limit', 'rfq'];
/**
 * Order sides
 */
export const VARIATIONAL_ORDER_SIDES = ['buy', 'sell'];
/**
 * Order status values
 */
export const VARIATIONAL_ORDER_STATUS = {
    PENDING: 'pending',
    OPEN: 'open',
    FILLED: 'filled',
    PARTIALLY_FILLED: 'partially_filled',
    CANCELLED: 'cancelled',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
};
/**
 * Position sides
 */
export const VARIATIONAL_POSITION_SIDES = ['long', 'short'];
/**
 * Default configuration values
 */
export const VARIATIONAL_DEFAULTS = {
    timeout: 30000, // 30 seconds
    rateLimitTier: 'default',
    orderBookDepth: 50,
    tradesLimit: 100,
    orderHistoryLimit: 500,
    quoteExpirationMs: 10000, // 10 seconds for RFQ quotes
};
//# sourceMappingURL=constants.js.map