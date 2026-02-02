/**
 * GRVT constants and configuration
 */
/**
 * GRVT API endpoints
 *
 * GRVT uses different hosts for different services:
 * - Market Data: market-data.{env}.grvt.io (public)
 * - Trading: edge.{env}.grvt.io (authenticated)
 * - WebSocket: market-data.{env}.grvt.io/ws
 *
 * @see https://api-docs.grvt.io/api_setup/
 */
export declare const GRVT_API_URLS: {
    readonly mainnet: {
        readonly rest: "https://market-data.grvt.io";
        readonly trading: "https://edge.grvt.io";
        readonly websocket: "wss://market-data.grvt.io/ws";
    };
    readonly testnet: {
        readonly rest: "https://market-data.testnet.grvt.io";
        readonly trading: "https://edge.testnet.grvt.io";
        readonly websocket: "wss://market-data.testnet.grvt.io/ws";
    };
};
/**
 * GRVT rate limits (per 10-second window)
 */
export declare const GRVT_RATE_LIMITS: {
    readonly rest: {
        readonly maxRequests: 100;
        readonly windowMs: 10000;
    };
    readonly websocket: {
        readonly maxSubscriptions: 50;
    };
};
/**
 * GRVT API endpoint weights
 */
export declare const GRVT_ENDPOINT_WEIGHTS: {
    readonly fetchMarkets: 1;
    readonly fetchTicker: 1;
    readonly fetchOrderBook: 2;
    readonly fetchTrades: 2;
    readonly fetchFundingRate: 1;
    readonly fetchPositions: 2;
    readonly fetchBalance: 2;
    readonly fetchOpenOrders: 2;
    readonly fetchClosedOrders: 3;
    readonly createOrder: 5;
    readonly cancelOrder: 3;
    readonly createBatchOrders: 10;
    readonly cancelAllOrders: 10;
    readonly modifyOrder: 5;
    readonly fetchOrder: 2;
    readonly fetchMyTrades: 3;
    readonly fetchDeposits: 2;
    readonly fetchWithdrawals: 2;
    readonly transfer: 5;
};
/**
 * GRVT order types mapping
 */
export declare const GRVT_ORDER_TYPES: {
    readonly market: "MARKET";
    readonly limit: "LIMIT";
    readonly limitMaker: "LIMIT_MAKER";
};
/**
 * GRVT order sides mapping
 */
export declare const GRVT_ORDER_SIDES: {
    readonly buy: "BUY";
    readonly sell: "SELL";
};
/**
 * GRVT time in force mapping
 */
export declare const GRVT_TIME_IN_FORCE: {
    readonly GTC: "GTC";
    readonly IOC: "IOC";
    readonly FOK: "FOK";
    readonly POST_ONLY: "POST_ONLY";
};
/**
 * GRVT order status mapping
 */
export declare const GRVT_ORDER_STATUS: {
    readonly PENDING: "pending";
    readonly OPEN: "open";
    readonly PARTIALLY_FILLED: "partiallyFilled";
    readonly FILLED: "filled";
    readonly CANCELLED: "canceled";
    readonly REJECTED: "rejected";
};
/**
 * GRVT WebSocket channels
 */
export declare const GRVT_WS_CHANNELS: {
    readonly orderbook: "orderbook";
    readonly trades: "trades";
    readonly ticker: "ticker";
    readonly positions: "positions";
    readonly orders: "orders";
    readonly balance: "balance";
};
/**
 * EIP-712 domain configuration for GRVT
 */
export declare const GRVT_EIP712_DOMAIN: {
    readonly name: "GRVT";
    readonly version: "1";
    readonly chainId: 1;
    readonly verifyingContract: "0x0000000000000000000000000000000000000000";
};
/**
 * EIP-712 order type definition
 */
export declare const GRVT_EIP712_ORDER_TYPE: {
    Order: {
        name: string;
        type: string;
    }[];
};
/**
 * GRVT precision defaults
 */
export declare const GRVT_PRECISION: {
    readonly amount: 8;
    readonly price: 8;
};
/**
 * GRVT session cookie duration (milliseconds)
 */
export declare const GRVT_SESSION_DURATION = 3600000;
/**
 * GRVT max leverage
 */
export declare const GRVT_MAX_LEVERAGE = 100;
/**
 * GRVT maintenance margin rate
 */
export declare const GRVT_MAINTENANCE_MARGIN_RATE = 0.005;
//# sourceMappingURL=constants.d.ts.map