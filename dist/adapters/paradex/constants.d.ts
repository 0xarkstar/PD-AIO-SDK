/**
 * Paradex constants and configuration
 */
/**
 * Paradex API endpoints
 */
export declare const PARADEX_API_URLS: {
    readonly mainnet: {
        readonly rest: "https://api.prod.paradex.trade/v1";
        readonly websocket: "wss://ws.api.prod.paradex.trade/v1";
    };
    readonly testnet: {
        readonly rest: "https://api.testnet.paradex.trade/v1";
        readonly websocket: "wss://ws.api.testnet.paradex.trade/v1";
    };
};
/**
 * Paradex rate limits (per minute)
 */
export declare const PARADEX_RATE_LIMITS: {
    readonly default: {
        readonly maxRequests: 1500;
        readonly windowMs: 60000;
    };
    readonly premium: {
        readonly maxRequests: 5000;
        readonly windowMs: 60000;
    };
};
/**
 * Paradex API endpoint weights
 */
export declare const PARADEX_ENDPOINT_WEIGHTS: {
    readonly fetchMarkets: 1;
    readonly fetchTicker: 1;
    readonly fetchOrderBook: 2;
    readonly fetchTrades: 2;
    readonly fetchFundingRate: 1;
    readonly fetchFundingRateHistory: 3;
    readonly fetchPositions: 3;
    readonly fetchBalance: 2;
    readonly fetchOpenOrders: 3;
    readonly fetchClosedOrders: 5;
    readonly createOrder: 5;
    readonly cancelOrder: 3;
    readonly createBatchOrders: 15;
    readonly cancelAllOrders: 10;
    readonly modifyOrder: 5;
    readonly fetchOrder: 2;
    readonly fetchMyTrades: 5;
    readonly setLeverage: 3;
};
/**
 * Paradex order types mapping
 */
export declare const PARADEX_ORDER_TYPES: {
    readonly market: "MARKET";
    readonly limit: "LIMIT";
    readonly limitMaker: "LIMIT_MAKER";
};
/**
 * Paradex order sides mapping
 */
export declare const PARADEX_ORDER_SIDES: {
    readonly buy: "BUY";
    readonly sell: "SELL";
};
/**
 * Paradex time in force mapping
 */
export declare const PARADEX_TIME_IN_FORCE: {
    readonly GTC: "GTC";
    readonly IOC: "IOC";
    readonly FOK: "FOK";
    readonly POST_ONLY: "POST_ONLY";
};
/**
 * Paradex order status mapping
 */
export declare const PARADEX_ORDER_STATUS: {
    readonly PENDING: "pending";
    readonly OPEN: "open";
    readonly PARTIAL: "partiallyFilled";
    readonly FILLED: "filled";
    readonly CANCELLED: "canceled";
    readonly REJECTED: "rejected";
};
/**
 * Paradex WebSocket channels
 *
 * Live-verified 2026-06-11: the order book channel prefix is `order_book`
 * (the former `orderbook.{market}` was rejected with -32600 "invalid channel").
 */
export declare const PARADEX_WS_CHANNELS: {
    readonly orderBookSnapshot: "order_book";
    readonly trades: "trades";
    readonly ticker: "ticker";
    readonly positions: "positions";
    readonly orders: "orders";
    readonly balance: "balance";
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
export declare function paradexOrderBookSnapshotChannel(market: string): string;
/**
 * StarkNet domain for signing
 */
export declare const PARADEX_STARK_DOMAIN: {
    readonly name: "Paradex";
    readonly version: "1";
};
/**
 * JWT token expiry buffer (seconds)
 */
export declare const PARADEX_JWT_EXPIRY_BUFFER = 60;
/**
 * Paradex precision defaults
 */
export declare const PARADEX_PRECISION: {
    readonly amount: 8;
    readonly price: 8;
};
/**
 * Paradex max leverage
 */
export declare const PARADEX_MAX_LEVERAGE = 20;
/**
 * Paradex maintenance margin rate
 */
export declare const PARADEX_MAINTENANCE_MARGIN_RATE = 0.025;
//# sourceMappingURL=constants.d.ts.map