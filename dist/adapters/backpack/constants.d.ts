/**
 * Backpack constants and configuration
 */
/**
 * Backpack API endpoints
 */
export declare const BACKPACK_API_URLS: {
    readonly mainnet: {
        readonly rest: "https://api.backpack.exchange";
        readonly websocket: "wss://ws.backpack.exchange";
    };
    readonly testnet: {
        readonly rest: "https://api-testnet.backpack.exchange";
        readonly websocket: "wss://ws-testnet.backpack.exchange";
    };
};
/**
 * Backpack rate limits (per minute)
 */
export declare const BACKPACK_RATE_LIMITS: {
    readonly rest: {
        readonly maxRequests: 2000;
        readonly windowMs: 60000;
    };
    readonly websocket: {
        readonly maxSubscriptions: 100;
    };
};
/**
 * Backpack API endpoint weights
 */
export declare const BACKPACK_ENDPOINT_WEIGHTS: {
    readonly fetchMarkets: 1;
    readonly fetchTicker: 1;
    readonly fetchOrderBook: 2;
    readonly fetchTrades: 2;
    readonly fetchFundingRate: 1;
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
 * Backpack order types mapping
 */
export declare const BACKPACK_ORDER_TYPES: {
    readonly market: "Market";
    readonly limit: "Limit";
    readonly postOnly: "PostOnly";
};
/**
 * Backpack order sides mapping
 */
export declare const BACKPACK_ORDER_SIDES: {
    readonly buy: "Bid";
    readonly sell: "Ask";
};
/**
 * Backpack time in force mapping
 */
export declare const BACKPACK_TIME_IN_FORCE: {
    readonly GTC: "GTC";
    readonly IOC: "IOC";
    readonly FOK: "FOK";
    readonly POST_ONLY: "POST_ONLY";
};
/**
 * Backpack order status mapping
 */
export declare const BACKPACK_ORDER_STATUS: {
    readonly NEW: "open";
    readonly OPEN: "open";
    readonly PARTIAL: "partiallyFilled";
    readonly FILLED: "filled";
    readonly CANCELLED: "canceled";
    readonly REJECTED: "rejected";
};
/**
 * Backpack WebSocket channels
 */
export declare const BACKPACK_WS_CHANNELS: {
    readonly orderbook: "orderbook";
    readonly trades: "trades";
    readonly ticker: "ticker";
    readonly positions: "positions";
    readonly orders: "orders";
    readonly balance: "balance";
};
/**
 * Backpack precision defaults
 */
export declare const BACKPACK_PRECISION: {
    readonly amount: 8;
    readonly price: 8;
};
/**
 * Backpack max leverage
 */
export declare const BACKPACK_MAX_LEVERAGE = 10;
/**
 * Backpack maintenance margin rate
 */
export declare const BACKPACK_MAINTENANCE_MARGIN_RATE = 0.05;
//# sourceMappingURL=constants.d.ts.map