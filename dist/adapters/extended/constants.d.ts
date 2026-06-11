/**
 * Extended Exchange Constants
 *
 * API endpoints, rate limits, and configuration constants for Extended
 */
/**
 * API URLs for Extended mainnet and testnet
 *
 * `websocket` is the per-stream WS BASE (live-verified 2026-06-11). Stream
 * URLs are composed as `{websocket}/{stream}/{market}` (e.g.
 * `{websocket}/orderbooks/BTC-USD`) and the HTTP upgrade itself IS the
 * subscription — no subscribe frames exist. The previous
 * `wss://ws.starknet.extended.exchange` host was fictional (NXDOMAIN).
 */
export declare const EXTENDED_API_URLS: {
    readonly mainnet: {
        readonly rest: "https://api.starknet.extended.exchange";
        readonly websocket: "wss://api.starknet.extended.exchange/stream.extended.exchange/v1";
        readonly starknet: "https://starknet-mainnet.public.blastapi.io";
    };
    readonly testnet: {
        readonly rest: "https://api.starknet.sepolia.extended.exchange";
        readonly websocket: "wss://starknet.sepolia.extended.exchange/stream.extended.exchange/v1";
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
        readonly maxRequests: 1000;
        readonly windowMs: 60000;
    };
    readonly authenticated: {
        readonly maxRequests: 1000;
        readonly windowMs: 60000;
    };
    readonly vip: {
        readonly maxRequests: 12000;
        readonly windowMs: 300000;
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
 *
 * No JSON heartbeat exists on the wire: the SERVER sends WS protocol-level
 * PINGs (~1s) and the runtime auto-PONGs, so the old pingInterval/pongTimeout
 * (a fictional JSON ping) were dropped.
 */
export declare const EXTENDED_WS_CONFIG: {
    readonly reconnectDelay: 1000;
    readonly maxReconnectDelay: 60000;
    readonly reconnectAttempts: 10;
};
/**
 * WebSocket per-stream path segments (live-verified 2026-06-11)
 *
 * These are URL path segments, not channel names: the stream URL
 * `{base}/{segment}/{market}` IS the subscription. Only the public
 * orderbooks + publicTrades streams are implemented; the venue funding
 * stream exists but is out of scope for this repair.
 */
export declare const EXTENDED_WS_CHANNELS: {
    readonly ORDERBOOKS: "orderbooks";
    readonly PUBLIC_TRADES: "publicTrades";
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
        readonly mainnet: "0x534e5f4d41494e";
        readonly testnet: "0x534e5f5345504f4c4941";
    };
    readonly blockTime: 600000;
    readonly confirmations: 1;
};
//# sourceMappingURL=constants.d.ts.map