/**
 * Extended Exchange Constants
 *
 * API endpoints, rate limits, and configuration constants for Extended
 */
/**
 * API URLs for Extended mainnet and testnet
 *
 * `websocket` is the per-stream WS BASE (live-verified 2026-06-11). Stream
 * URLs are composed as `{websocket}/{stream}/{market}` (e.g.
 * `{websocket}/orderbooks/BTC-USD`) and the HTTP upgrade itself IS the
 * subscription — no subscribe frames exist. The previous
 * `wss://ws.starknet.extended.exchange` host was fictional (NXDOMAIN).
 */
export const EXTENDED_API_URLS = {
    mainnet: {
        rest: 'https://api.starknet.extended.exchange',
        websocket: 'wss://api.starknet.extended.exchange/stream.extended.exchange/v1',
        starknet: 'https://starknet-mainnet.public.blastapi.io',
    },
    testnet: {
        rest: 'https://api.starknet.sepolia.extended.exchange',
        websocket: 'wss://starknet.sepolia.extended.exchange/stream.extended.exchange/v1',
        starknet: 'https://starknet-sepolia.public.blastapi.io',
    },
};
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
};
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
};
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
};
/**
 * WebSocket configuration
 *
 * No JSON heartbeat exists on the wire: the SERVER sends WS protocol-level
 * PINGs (~1s) and the runtime auto-PONGs, so the old pingInterval/pongTimeout
 * (a fictional JSON ping) were dropped.
 */
export const EXTENDED_WS_CONFIG = {
    reconnectDelay: 1000,
    maxReconnectDelay: 60000,
    reconnectAttempts: 10,
};
/**
 * WebSocket per-stream path segments (live-verified 2026-06-11)
 *
 * These are URL path segments, not channel names: the stream URL
 * `{base}/{segment}/{market}` IS the subscription. Only the public
 * orderbooks + publicTrades streams are implemented; the venue funding
 * stream exists but is out of scope for this repair.
 */
export const EXTENDED_WS_CHANNELS = {
    ORDERBOOKS: 'orderbooks',
    PUBLIC_TRADES: 'publicTrades',
};
/**
 * Order types supported by Extended
 */
export const EXTENDED_ORDER_TYPES = ['market', 'limit', 'stop', 'stop_limit'];
/**
 * Order sides
 */
export const EXTENDED_ORDER_SIDES = ['buy', 'sell'];
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
};
/**
 * Position sides
 */
export const EXTENDED_POSITION_SIDES = ['long', 'short'];
/**
 * Margin modes
 */
export const EXTENDED_MARGIN_MODES = ['cross', 'isolated'];
/**
 * Leverage tiers
 */
export const EXTENDED_LEVERAGE_TIERS = {
    MIN: 1,
    MAX: 100,
    DEFAULT: 10,
};
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
};
/**
 * StarkNet configuration
 */
export const EXTENDED_STARKNET_CONFIG = {
    chainId: {
        mainnet: '0x534e5f4d41494e', // SN_MAIN (StarkNet hex chain ID)
        testnet: '0x534e5f5345504f4c4941', // SN_SEPOLIA (StarkNet hex chain ID)
    },
    blockTime: 600000, // 10 minutes in milliseconds
    confirmations: 1,
};
//# sourceMappingURL=constants.js.map