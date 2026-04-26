/**
 * Katana Network constants and configuration
 *
 * Katana is a perpetual futures DEX on a custom L2 (chainId 747474).
 * Uses dual authentication: HMAC-SHA256 for all private requests + EIP-712 for writes.
 *
 * @see https://api-docs-v1-perps.katana.network/#introduction
 */
/**
 * Katana API endpoints
 */
export declare const KATANA_API_URLS: {
    readonly mainnet: {
        readonly rest: "https://api-perps.katana.network/v1";
        readonly websocket: "wss://websocket-perps.katana.network/v1";
    };
    readonly sandbox: {
        readonly rest: "https://api-perps-sandbox.katana.network/v1";
        readonly websocket: "wss://websocket-perps-sandbox.katana.network/v1";
    };
};
/**
 * Rate limits
 *
 * Public without key: 5 req/s
 * Public with key: 10 req/s
 * Private: 10 req/s
 * Trade: 10 req/s
 */
export declare const KATANA_RATE_LIMITS: {
    readonly public: {
        readonly maxRequests: 10;
        readonly windowMs: 1000;
    };
    readonly private: {
        readonly maxRequests: 10;
        readonly windowMs: 1000;
    };
};
/**
 * Endpoint weights
 */
export declare const KATANA_ENDPOINT_WEIGHTS: {
    readonly fetchMarkets: 1;
    readonly fetchTicker: 1;
    readonly fetchOrderBook: 2;
    readonly fetchTrades: 2;
    readonly fetchOHLCV: 2;
    readonly fetchFundingRate: 1;
    readonly fetchFundingRateHistory: 2;
    readonly fetchPositions: 2;
    readonly fetchBalance: 2;
    readonly fetchOpenOrders: 2;
    readonly fetchOrderHistory: 3;
    readonly fetchMyTrades: 3;
    readonly createOrder: 5;
    readonly cancelOrder: 3;
    readonly cancelAllOrders: 10;
    readonly setLeverage: 3;
};
/**
 * Katana order type mapping (numeric enums)
 */
export declare const KATANA_ORDER_TYPES: {
    readonly market: 0;
    readonly limit: 1;
    readonly stopMarket: 2;
    readonly stopLimit: 3;
    readonly takeProfitMarket: 4;
    readonly takeProfitLimit: 5;
};
/**
 * Reverse mapping: Katana numeric → unified string
 */
export declare const KATANA_ORDER_TYPE_REVERSE: Record<number, string>;
/**
 * Katana order side mapping
 */
export declare const KATANA_ORDER_SIDES: {
    readonly buy: 0;
    readonly sell: 1;
};
export declare const KATANA_ORDER_SIDE_REVERSE: Record<number, string>;
/**
 * Katana time in force mapping
 */
export declare const KATANA_TIME_IN_FORCE: {
    readonly GTC: 0;
    readonly PO: 1;
    readonly IOC: 2;
    readonly FOK: 3;
};
export declare const KATANA_TIME_IN_FORCE_REVERSE: Record<number, string>;
/**
 * Katana trigger type mapping
 */
export declare const KATANA_TRIGGER_TYPES: {
    readonly none: 0;
    readonly index: 1;
    readonly trade: 2;
};
/**
 * Katana self-trade prevention
 */
export declare const KATANA_SELF_TRADE_PREVENTION: {
    readonly decrementAndCancel: 0;
    readonly cancelOldest: 1;
    readonly cancelNewest: 2;
    readonly cancelBoth: 3;
};
/**
 * Katana order status mapping
 */
export declare const KATANA_ORDER_STATUS: Record<string, string>;
/**
 * EIP-712 domain configuration for Katana
 */
export declare const KATANA_EIP712_DOMAIN: {
    readonly mainnet: {
        readonly name: "Katana";
        readonly version: "1";
        readonly chainId: 747474;
        readonly verifyingContract: "0x835Ba5b1B202773A94Daaa07168b26B22584637a";
    };
    readonly sandbox: {
        readonly name: "Katana";
        readonly version: "1";
        readonly chainId: 737373;
        readonly verifyingContract: "0x835Ba5b1B202773A94Daaa07168b26B22584637a";
    };
};
/**
 * EIP-712 Order type definition for order signing
 */
export declare const KATANA_EIP712_ORDER_TYPE: {
    Order: {
        name: string;
        type: string;
    }[];
};
/**
 * EIP-712 Cancel order type definition
 */
export declare const KATANA_EIP712_CANCEL_TYPE: {
    Cancel: {
        name: string;
        type: string;
    }[];
};
/**
 * EIP-712 Withdraw type definition
 */
export declare const KATANA_EIP712_WITHDRAW_TYPE: {
    Withdraw: {
        name: string;
        type: string;
    }[];
};
/**
 * Precision: all Katana values use 8-decimal zero-padded strings
 */
export declare const KATANA_PRECISION: {
    readonly amount: 8;
    readonly price: 8;
};
/**
 * HMAC authentication header names
 */
export declare const KATANA_AUTH_HEADERS: {
    readonly apiKey: "KP-API-KEY";
    readonly hmacSignature: "KP-HMAC-SIGNATURE";
};
/**
 * Funding rate interval: every 8 hours (00:00, 08:00, 16:00 UTC)
 */
export declare const KATANA_FUNDING_INTERVAL_HOURS = 8;
/**
 * Nonce freshness window (ms): 60 seconds
 */
export declare const KATANA_NONCE_WINDOW_MS = 60000;
/**
 * Default fees
 */
export declare const KATANA_DEFAULT_FEES: {
    readonly maker: 0.0001;
    readonly taker: 0.0004;
};
/**
 * WebSocket configuration
 */
export declare const KATANA_WS_CONFIG: {
    readonly pingInterval: 30000;
    readonly pongTimeout: 5000;
    readonly inactivityTimeout: 300000;
    readonly reconnectDelay: 1000;
    readonly maxReconnectDelay: 30000;
    readonly reconnectAttempts: 5;
};
/**
 * WebSocket channels
 */
export declare const KATANA_WS_CHANNELS: {
    readonly tickers: "tickers";
    readonly candles: "candles";
    readonly trades: "trades";
    readonly liquidations: "liquidations";
    readonly orderbookL1: "orderbook_l1";
    readonly orderbookL2: "orderbook_l2";
    readonly orders: "orders";
    readonly positions: "positions";
    readonly deposits: "deposits";
    readonly withdrawals: "withdrawals";
    readonly funding: "funding";
};
/**
 * OHLCV supported timeframes
 */
export declare const KATANA_TIMEFRAMES: Record<string, string>;
/**
 * Null address for delegated key (disabled)
 */
export declare const KATANA_NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
/**
 * Zero decimal string
 */
export declare const KATANA_ZERO_DECIMAL = "0.00000000";
//# sourceMappingURL=constants.d.ts.map