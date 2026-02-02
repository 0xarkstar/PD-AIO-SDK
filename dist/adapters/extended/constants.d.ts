/**
 * Extended Exchange Constants
 *
 * API endpoints, rate limits, and configuration constants for Extended
 */
/**
 * API URLs for Extended mainnet and testnet
 */
export declare const EXTENDED_API_URLS: {
    readonly mainnet: {
        readonly rest: "https://api.starknet.extended.exchange";
        readonly websocket: "wss://ws.starknet.extended.exchange";
        readonly starknet: "https://starknet-mainnet.public.blastapi.io";
    };
    readonly testnet: {
        readonly rest: "https://api.starknet.sepolia.extended.exchange";
        readonly websocket: "wss://ws.starknet.sepolia.extended.exchange";
        readonly starknet: "https://starknet-sepolia.public.blastapi.io";
    };
};
/**
 * API endpoints
 */
export declare const EXTENDED_ENDPOINTS: {
    readonly MARKETS: "/api/v1/info/markets";
    readonly TICKER: "/api/v1/info/markets";
    readonly TICKER_SYMBOL: "/api/v1/info/markets/{market}/stats";
    readonly ORDERBOOK: "/api/v1/info/markets/{market}/orderbook";
    readonly TRADES: "/api/v1/info/markets/{market}/trades";
    readonly FUNDING_RATE: "/api/v1/info/{market}/funding";
    readonly FUNDING_HISTORY: "/api/v1/info/{market}/funding/history";
    readonly CREATE_ORDER: "/api/v1/user/order";
    readonly CANCEL_ORDER: "/api/v1/user/order/{orderId}";
    readonly CANCEL_ALL_ORDERS: "/api/v1/user/orders/cancel-all";
    readonly EDIT_ORDER: "/api/v1/user/order/{orderId}";
    readonly BATCH_ORDERS: "/api/v1/user/orders/batch";
    readonly OPEN_ORDERS: "/api/v1/user/orders";
    readonly ORDER_HISTORY: "/api/v1/user/orders/history";
    readonly ORDER_STATUS: "/api/v1/user/order/{orderId}";
    readonly POSITIONS: "/api/v1/user/positions";
    readonly BALANCE: "/api/v1/user/balance";
    readonly LEVERAGE: "/api/v1/user/leverage";
    readonly MARGIN_MODE: "/api/v1/user/margin-mode";
    readonly USER_TRADES: "/api/v1/user/trades";
    readonly USER_FEES: "/api/v1/user/fees";
    readonly PORTFOLIO: "/api/v1/user/portfolio";
    readonly STARKNET_STATE: "/api/v1/starknet/state";
    readonly STARKNET_TX: "/api/v1/starknet/transaction/{txHash}";
    readonly STARKNET_ACCOUNT: "/api/v1/starknet/account/{address}";
    readonly RATE_LIMIT_STATUS: "/api/v1/rate-limit";
};
/**
 * Rate limit configurations
 */
export declare const EXTENDED_RATE_LIMITS: {
    readonly default: {
        readonly maxRequests: 100;
        readonly windowMs: 1000;
    };
    readonly authenticated: {
        readonly maxRequests: 200;
        readonly windowMs: 1000;
    };
    readonly vip: {
        readonly maxRequests: 500;
        readonly windowMs: 1000;
    };
};
/**
 * Endpoint weights for rate limiting
 */
export declare const EXTENDED_ENDPOINT_WEIGHTS: {
    readonly "/api/v1/info/markets": 1;
    readonly "/api/v1/info/markets/{market}/stats": 1;
    readonly "/api/v1/info/markets/{market}/orderbook": 2;
    readonly "/api/v1/info/markets/{market}/trades": 1;
    readonly "/api/v1/info/{market}/funding": 1;
    readonly "/api/v1/user/order": 10;
    readonly "/api/v1/user/order/{orderId}": 10;
    readonly "/api/v1/user/orders/cancel-all": 10;
    readonly "/api/v1/user/orders/batch": 20;
    readonly "/api/v1/user/positions": 2;
    readonly "/api/v1/user/balance": 2;
    readonly "/api/v1/user/leverage": 5;
};
/**
 * WebSocket configuration
 */
export declare const EXTENDED_WS_CONFIG: {
    readonly reconnectDelay: 1000;
    readonly maxReconnectDelay: 60000;
    readonly reconnectAttempts: 10;
    readonly pingInterval: 30000;
    readonly pongTimeout: 10000;
};
/**
 * WebSocket channels
 */
export declare const EXTENDED_WS_CHANNELS: {
    readonly ORDERBOOK: "orderbook";
    readonly TRADES: "trades";
    readonly TICKER: "ticker";
    readonly ORDERS: "orders";
    readonly POSITIONS: "positions";
    readonly BALANCE: "balance";
    readonly FUNDING: "funding";
};
/**
 * Order types supported by Extended
 */
export declare const EXTENDED_ORDER_TYPES: readonly ["market", "limit", "stop", "stop_limit"];
/**
 * Order sides
 */
export declare const EXTENDED_ORDER_SIDES: readonly ["buy", "sell"];
/**
 * Order status values
 */
export declare const EXTENDED_ORDER_STATUS: {
    readonly PENDING: "pending";
    readonly OPEN: "open";
    readonly FILLED: "filled";
    readonly PARTIALLY_FILLED: "partially_filled";
    readonly CANCELLED: "cancelled";
    readonly REJECTED: "rejected";
    readonly EXPIRED: "expired";
};
/**
 * Position sides
 */
export declare const EXTENDED_POSITION_SIDES: readonly ["long", "short"];
/**
 * Margin modes
 */
export declare const EXTENDED_MARGIN_MODES: readonly ["cross", "isolated"];
/**
 * Leverage tiers
 */
export declare const EXTENDED_LEVERAGE_TIERS: {
    readonly MIN: 1;
    readonly MAX: 100;
    readonly DEFAULT: 10;
};
/**
 * Default configuration values
 */
export declare const EXTENDED_DEFAULTS: {
    readonly timeout: 30000;
    readonly orderBookDepth: 50;
    readonly tradesLimit: 100;
    readonly orderHistoryLimit: 500;
    readonly defaultLeverage: 10;
    readonly maxLeverage: 100;
};
/**
 * StarkNet configuration
 */
export declare const EXTENDED_STARKNET_CONFIG: {
    readonly chainId: {
        readonly mainnet: "SN_MAIN";
        readonly testnet: "SN_GOERLI";
    };
    readonly blockTime: 600000;
    readonly confirmations: 1;
};
//# sourceMappingURL=constants.d.ts.map