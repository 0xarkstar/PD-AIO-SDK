/**
 * dYdX v4 Exchange Constants
 *
 * dYdX v4 is built on a Cosmos SDK L1 blockchain
 */
// =============================================================================
// API Endpoints
// =============================================================================
export const DYDX_API_URLS = {
    mainnet: {
        indexer: 'https://indexer.dydx.trade/v4',
        websocket: 'wss://indexer.dydx.trade/v4/ws',
    },
    testnet: {
        indexer: 'https://indexer.v4testnet.dydx.exchange/v4',
        websocket: 'wss://indexer.v4testnet.dydx.exchange/v4/ws',
    },
};
export const DYDX_MAINNET_API = DYDX_API_URLS.mainnet.indexer;
export const DYDX_TESTNET_API = DYDX_API_URLS.testnet.indexer;
export const DYDX_MAINNET_WS = DYDX_API_URLS.mainnet.websocket;
export const DYDX_TESTNET_WS = DYDX_API_URLS.testnet.websocket;
// =============================================================================
// Rate Limits
// =============================================================================
export const DYDX_RATE_LIMIT = {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    weights: {
        // Public endpoints
        fetchMarkets: 1,
        fetchOrderBook: 2,
        fetchTrades: 1,
        fetchTicker: 1,
        fetchFundingRate: 1,
        fetchFundingRateHistory: 2,
        fetchOHLCV: 2,
        // Private endpoints
        fetchPositions: 2,
        fetchBalance: 2,
        createOrder: 5,
        cancelOrder: 3,
        cancelAllOrders: 10,
        fetchOpenOrders: 2,
        fetchOrderHistory: 2,
        fetchMyTrades: 2,
        setLeverage: 3,
    },
};
// =============================================================================
// Trading Constants
// =============================================================================
export const DYDX_ORDER_TYPES = {
    LIMIT: 'LIMIT',
    MARKET: 'MARKET',
    STOP_LIMIT: 'STOP_LIMIT',
    STOP_MARKET: 'STOP_MARKET',
    TRAILING_STOP: 'TRAILING_STOP',
    TAKE_PROFIT: 'TAKE_PROFIT',
    TAKE_PROFIT_MARKET: 'TAKE_PROFIT_MARKET',
};
export const DYDX_ORDER_SIDES = {
    BUY: 'BUY',
    SELL: 'SELL',
};
export const DYDX_ORDER_STATUSES = {
    OPEN: 'OPEN',
    FILLED: 'FILLED',
    CANCELED: 'CANCELED',
    BEST_EFFORT_CANCELED: 'BEST_EFFORT_CANCELED',
    UNTRIGGERED: 'UNTRIGGERED',
    PENDING: 'PENDING',
};
export const DYDX_TIME_IN_FORCE = {
    GTT: 'GTT', // Good Till Time
    FOK: 'FOK', // Fill or Kill
    IOC: 'IOC', // Immediate or Cancel
};
// =============================================================================
// Symbol Mappings
// =============================================================================
/**
 * Convert unified symbol to dYdX format
 * @example "BTC/USD:USD" -> "BTC-USD"
 */
export function unifiedToDydx(symbol) {
    // Unified format: "BTC/USD:USD" or "ETH/USD:USD"
    const parts = symbol.split('/');
    const base = parts[0];
    if (!base) {
        throw new Error(`Invalid symbol format: ${symbol}`);
    }
    // dYdX format: "BTC-USD", "ETH-USD"
    // dYdX v4 uses USD as quote currency
    return `${base}-USD`;
}
/**
 * Convert dYdX symbol to unified format
 * @example "BTC-USD" -> "BTC/USD:USD"
 */
export function dydxToUnified(exchangeSymbol) {
    // dYdX format: "BTC-USD"
    const parts = exchangeSymbol.split('-');
    const base = parts[0];
    const quote = parts[1] || 'USD';
    // Unified format: "BTC/USD:USD"
    return `${base}/${quote}:${quote}`;
}
// =============================================================================
// Precision Constants
// =============================================================================
export const DYDX_DEFAULT_PRECISION = {
    price: 6,
    amount: 4,
};
// =============================================================================
// WebSocket Constants
// =============================================================================
export const DYDX_WS_CHANNELS = {
    MARKETS: 'v4_markets',
    TRADES: 'v4_trades',
    ORDERBOOK: 'v4_orderbook',
    CANDLES: 'v4_candles',
    SUBACCOUNTS: 'v4_subaccounts',
    BLOCK_HEIGHT: 'v4_block_height',
};
export const DYDX_WS_RECONNECT = {
    enabled: true,
    maxAttempts: 10,
    initialDelay: 500,
    maxDelay: 30000,
    multiplier: 2,
    jitter: 0.1,
};
// =============================================================================
// Funding Rate
// =============================================================================
export const DYDX_FUNDING_INTERVAL_HOURS = 1; // dYdX v4 has hourly funding
// =============================================================================
// Subaccount Constants
// =============================================================================
export const DYDX_DEFAULT_SUBACCOUNT_NUMBER = 0;
// =============================================================================
// Error Messages
// =============================================================================
export const DYDX_ERROR_MESSAGES = {
    'insufficient funds': 'INSUFFICIENT_MARGIN',
    'insufficient margin': 'INSUFFICIENT_MARGIN',
    'invalid signature': 'INVALID_SIGNATURE',
    'order would immediately match': 'ORDER_WOULD_MATCH',
    'position does not exist': 'POSITION_NOT_FOUND',
    'order not found': 'ORDER_NOT_FOUND',
    'order does not exist': 'ORDER_NOT_FOUND',
    'rate limit exceeded': 'RATE_LIMIT_EXCEEDED',
    'invalid order size': 'INVALID_ORDER_SIZE',
    'price out of bounds': 'PRICE_OUT_OF_BOUNDS',
    'market not found': 'MARKET_NOT_FOUND',
    'subaccount not found': 'SUBACCOUNT_NOT_FOUND',
    'unauthorized': 'UNAUTHORIZED',
};
//# sourceMappingURL=constants.js.map