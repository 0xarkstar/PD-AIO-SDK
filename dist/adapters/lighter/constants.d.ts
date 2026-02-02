/**
 * Lighter constants and configuration
 */
export declare const LIGHTER_API_URLS: {
    readonly mainnet: {
        readonly rest: "https://mainnet.zklighter.elliot.ai";
        readonly websocket: "wss://mainnet.zklighter.elliot.ai/stream";
    };
    readonly testnet: {
        readonly rest: "https://testnet.zklighter.elliot.ai";
        readonly websocket: "wss://testnet.zklighter.elliot.ai/stream";
    };
};
export declare const LIGHTER_RATE_LIMITS: {
    readonly tier1: {
        readonly maxRequests: 60;
        readonly windowMs: 60000;
    };
    readonly tier2: {
        readonly maxRequests: 600;
        readonly windowMs: 60000;
    };
    readonly tier3: {
        readonly maxRequests: 4000;
        readonly windowMs: 60000;
    };
};
export declare const LIGHTER_ENDPOINT_WEIGHTS: {
    readonly fetchMarkets: 1;
    readonly fetchTicker: 1;
    readonly fetchOrderBook: 2;
    readonly fetchTrades: 2;
    readonly fetchFundingRate: 1;
    readonly fetchPositions: 2;
    readonly fetchBalance: 2;
    readonly fetchOpenOrders: 2;
    readonly createOrder: 5;
    readonly cancelOrder: 3;
    readonly createBatchOrders: 10;
    readonly cancelAllOrders: 10;
};
export declare const LIGHTER_MAX_LEVERAGE = 50;
export declare const LIGHTER_FUNDING_INTERVAL_HOURS = 8;
/**
 * WebSocket configuration
 */
export declare const LIGHTER_WS_CONFIG: {
    readonly reconnectDelay: 1000;
    readonly maxReconnectDelay: 30000;
    readonly reconnectAttempts: 5;
    readonly pingInterval: 30000;
    readonly pongTimeout: 5000;
};
/**
 * WebSocket channels
 */
export declare const LIGHTER_WS_CHANNELS: {
    readonly ORDERBOOK: "orderbook";
    readonly TRADES: "trades";
    readonly TICKER: "ticker";
    readonly POSITIONS: "positions";
    readonly ORDERS: "orders";
    readonly FILLS: "fills";
};
//# sourceMappingURL=constants.d.ts.map