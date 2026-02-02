/**
 * Variational Exchange Constants
 *
 * API endpoints, rate limits, and configuration constants for Variational
 */
/**
 * API URLs for Variational mainnet and testnet
 */
export declare const VARIATIONAL_API_URLS: {
    readonly mainnet: {
        readonly rest: "https://omni-client-api.prod.ap-northeast-1.variational.io";
        readonly websocket: "wss://ws.variational.io";
    };
    readonly testnet: {
        readonly rest: "https://omni-client-api.testnet.variational.io";
        readonly websocket: "wss://ws-testnet.variational.io";
    };
};
/**
 * API endpoints
 */
export declare const VARIATIONAL_ENDPOINTS: {
    readonly METADATA_STATS: "/metadata/stats";
    readonly MARKETS: "/api/v1/markets";
    readonly TICKER: "/api/v1/ticker/{symbol}";
    readonly ORDERBOOK: "/api/v1/orderbook/{symbol}";
    readonly TRADES: "/api/v1/trades/{symbol}";
    readonly FUNDING_RATE: "/api/v1/funding/{symbol}";
    readonly FUNDING_HISTORY: "/api/v1/funding/{symbol}/history";
    readonly REQUEST_QUOTE: "/api/v1/rfq/request";
    readonly ACCEPT_QUOTE: "/api/v1/rfq/accept/{quoteId}";
    readonly QUOTES_HISTORY: "/api/v1/rfq/history";
    readonly CREATE_ORDER: "/api/v1/orders";
    readonly CANCEL_ORDER: "/api/v1/orders/{orderId}";
    readonly CANCEL_ALL_ORDERS: "/api/v1/orders/cancel-all";
    readonly OPEN_ORDERS: "/api/v1/orders/open";
    readonly ORDER_HISTORY: "/api/v1/orders/history";
    readonly ORDER_STATUS: "/api/v1/orders/{orderId}";
    readonly POSITIONS: "/api/v1/positions";
    readonly BALANCE: "/api/v1/balance";
    readonly USER_TRADES: "/api/v1/trades/user";
    readonly USER_FEES: "/api/v1/fees";
    readonly PORTFOLIO: "/api/v1/portfolio";
    readonly RATE_LIMIT_STATUS: "/api/v1/rate-limit";
};
/**
 * Rate limit configurations
 * Based on Variational API documentation:
 * - Per IP: 10 requests per 10 seconds
 * - Global: 1000 requests per minute
 */
export declare const VARIATIONAL_RATE_LIMITS: {
    readonly perIp: {
        readonly maxRequests: 10;
        readonly windowMs: 10000;
    };
    readonly global: {
        readonly maxRequests: 1000;
        readonly windowMs: 60000;
    };
    readonly default: {
        readonly maxRequests: 10;
        readonly windowMs: 10000;
    };
};
/**
 * Endpoint weights for rate limiting
 */
export declare const VARIATIONAL_ENDPOINT_WEIGHTS: {
    readonly "/metadata/stats": 1;
    readonly "/api/v1/markets": 1;
    readonly "/api/v1/ticker/{symbol}": 1;
    readonly "/api/v1/orderbook/{symbol}": 2;
    readonly "/api/v1/trades/{symbol}": 1;
    readonly "/api/v1/funding/{symbol}": 1;
    readonly "/api/v1/rfq/request": 5;
    readonly "/api/v1/rfq/accept/{quoteId}": 10;
    readonly "/api/v1/orders": 10;
    readonly "/api/v1/orders/{orderId}": 5;
    readonly "/api/v1/positions": 2;
    readonly "/api/v1/balance": 2;
};
/**
 * WebSocket configuration
 */
export declare const VARIATIONAL_WS_CONFIG: {
    readonly reconnectDelay: 1000;
    readonly maxReconnectDelay: 60000;
    readonly reconnectAttempts: 10;
    readonly pingInterval: 30000;
    readonly pongTimeout: 10000;
};
/**
 * WebSocket channels
 */
export declare const VARIATIONAL_WS_CHANNELS: {
    readonly ORDERBOOK: "orderbook";
    readonly TRADES: "trades";
    readonly TICKER: "ticker";
    readonly ORDERS: "orders";
    readonly POSITIONS: "positions";
    readonly BALANCE: "balance";
    readonly FUNDING: "funding";
};
/**
 * Order types supported by Variational
 */
export declare const VARIATIONAL_ORDER_TYPES: readonly ["market", "limit", "rfq"];
/**
 * Order sides
 */
export declare const VARIATIONAL_ORDER_SIDES: readonly ["buy", "sell"];
/**
 * Order status values
 */
export declare const VARIATIONAL_ORDER_STATUS: {
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
export declare const VARIATIONAL_POSITION_SIDES: readonly ["long", "short"];
/**
 * Default configuration values
 */
export declare const VARIATIONAL_DEFAULTS: {
    readonly timeout: 30000;
    readonly rateLimitTier: "default";
    readonly orderBookDepth: 50;
    readonly tradesLimit: 100;
    readonly orderHistoryLimit: 500;
    readonly quoteExpirationMs: 10000;
};
//# sourceMappingURL=constants.d.ts.map