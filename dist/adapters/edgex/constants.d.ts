/**
 * EdgeX constants and configuration
 */
/**
 * EdgeX API endpoints
 */
export declare const EDGEX_API_URLS: {
    readonly mainnet: {
        readonly rest: "https://pro.edgex.exchange";
        readonly websocket: "wss://quote.edgex.exchange";
    };
    readonly testnet: {
        readonly rest: "https://pro.edgex.exchange";
        readonly websocket: "wss://quote.edgex.exchange";
    };
};
/**
 * EdgeX rate limits (per minute)
 */
export declare const EDGEX_RATE_LIMITS: {
    readonly rest: {
        readonly maxRequests: 1200;
        readonly windowMs: 60000;
    };
    readonly websocket: {
        readonly maxSubscriptions: 100;
    };
};
/**
 * EdgeX API endpoint weights
 */
export declare const EDGEX_ENDPOINT_WEIGHTS: {
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
 * EdgeX order types mapping
 */
export declare const EDGEX_ORDER_TYPES: {
    readonly market: "MARKET";
    readonly limit: "LIMIT";
};
/**
 * EdgeX order sides mapping
 */
export declare const EDGEX_ORDER_SIDES: {
    readonly buy: "BUY";
    readonly sell: "SELL";
};
/**
 * EdgeX time in force mapping
 */
export declare const EDGEX_TIME_IN_FORCE: {
    readonly GTC: "GTC";
    readonly IOC: "IOC";
    readonly FOK: "FOK";
};
/**
 * EdgeX order status mapping
 */
export declare const EDGEX_ORDER_STATUS: {
    readonly PENDING: "pending";
    readonly OPEN: "open";
    readonly PARTIALLY_FILLED: "partiallyFilled";
    readonly FILLED: "filled";
    readonly CANCELLED: "canceled";
    readonly REJECTED: "rejected";
};
/**
 * EdgeX WebSocket channels
 */
export declare const EDGEX_WS_CHANNELS: {
    readonly orderbook: "orderbook";
    readonly trades: "trades";
    readonly ticker: "ticker";
    readonly positions: "positions";
    readonly orders: "orders";
    readonly balance: "balance";
};
/**
 * StarkEx constants
 */
export declare const EDGEX_STARK_CONSTANTS: {
    readonly FIELD_PRIME: bigint;
    readonly MAX_AMOUNT: bigint;
};
/**
 * EdgeX precision defaults
 */
export declare const EDGEX_PRECISION: {
    readonly amount: 8;
    readonly price: 8;
};
/**
 * EdgeX max leverage
 */
export declare const EDGEX_MAX_LEVERAGE = 25;
/**
 * EdgeX maintenance margin rate
 */
export declare const EDGEX_MAINTENANCE_MARGIN_RATE = 0.04;
//# sourceMappingURL=constants.d.ts.map