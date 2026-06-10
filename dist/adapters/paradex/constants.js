/**
 * Paradex constants and configuration
 */
/**
 * Paradex API endpoints
 */
export const PARADEX_API_URLS = {
    mainnet: {
        rest: 'https://api.prod.paradex.trade/v1',
        // Live-verified 2026-06-11: the former 'wss://ws.prod.paradex.trade/v1' is NXDOMAIN
        websocket: 'wss://ws.api.prod.paradex.trade/v1',
    },
    testnet: {
        rest: 'https://api.testnet.paradex.trade/v1',
        // unverified — no testnet capture; fixed by analogy with the mainnet ws.api host
        websocket: 'wss://ws.api.testnet.paradex.trade/v1',
    },
};
/**
 * Paradex rate limits (per minute)
 */
export const PARADEX_RATE_LIMITS = {
    default: {
        maxRequests: 1500,
        windowMs: 60000, // 1 minute
    },
    premium: {
        maxRequests: 5000,
        windowMs: 60000, // 1 minute
    },
};
/**
 * Paradex API endpoint weights
 */
export const PARADEX_ENDPOINT_WEIGHTS = {
    fetchMarkets: 1,
    fetchTicker: 1,
    fetchOrderBook: 2,
    fetchTrades: 2,
    fetchFundingRate: 1,
    fetchFundingRateHistory: 3,
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
};
/**
 * Paradex order types mapping
 */
export const PARADEX_ORDER_TYPES = {
    market: 'MARKET',
    limit: 'LIMIT',
    limitMaker: 'LIMIT_MAKER',
};
/**
 * Paradex order sides mapping
 */
export const PARADEX_ORDER_SIDES = {
    buy: 'BUY',
    sell: 'SELL',
};
/**
 * Paradex time in force mapping
 */
export const PARADEX_TIME_IN_FORCE = {
    GTC: 'GTC',
    IOC: 'IOC',
    FOK: 'FOK',
    POST_ONLY: 'POST_ONLY',
};
/**
 * Paradex order status mapping
 */
export const PARADEX_ORDER_STATUS = {
    PENDING: 'pending',
    OPEN: 'open',
    PARTIAL: 'partiallyFilled',
    FILLED: 'filled',
    CANCELLED: 'canceled',
    REJECTED: 'rejected',
};
/**
 * Paradex WebSocket channels
 *
 * Live-verified 2026-06-11: the order book channel prefix is `order_book`
 * (the former `orderbook.{market}` was rejected with -32600 "invalid channel").
 */
export const PARADEX_WS_CHANNELS = {
    orderBookSnapshot: 'order_book',
    trades: 'trades',
    ticker: 'ticker',
    positions: 'positions',
    orders: 'orders',
    balance: 'balance',
};
/**
 * Build the order-book snapshot channel name for a Paradex market.
 *
 * Emits full self-contained 15+15 snapshots (`update_type: "s"`, throttled
 * ~100ms). Depth is baked into the channel name and fixed at 15 — the only
 * live-verified variant (capture 2026-06-11). The contiguous-seq_no
 * `order_book.{market}.deltas` channel is DELTAS DEFERRED.
 *
 * @param market - Paradex market (e.g., "BTC-USD-PERP")
 * @returns Channel name (e.g., "order_book.BTC-USD-PERP.snapshot@15@100ms")
 */
export function paradexOrderBookSnapshotChannel(market) {
    return `${PARADEX_WS_CHANNELS.orderBookSnapshot}.${market}.snapshot@15@100ms`;
}
/**
 * StarkNet domain for signing
 */
export const PARADEX_STARK_DOMAIN = {
    name: 'Paradex',
    version: '1',
};
/**
 * JWT token expiry buffer (seconds)
 */
export const PARADEX_JWT_EXPIRY_BUFFER = 60; // 1 minute before actual expiry
/**
 * Paradex precision defaults
 */
export const PARADEX_PRECISION = {
    amount: 8,
    price: 8,
};
/**
 * Paradex max leverage
 */
export const PARADEX_MAX_LEVERAGE = 20;
/**
 * Paradex maintenance margin rate
 */
export const PARADEX_MAINTENANCE_MARGIN_RATE = 0.025; // 2.5%
//# sourceMappingURL=constants.js.map