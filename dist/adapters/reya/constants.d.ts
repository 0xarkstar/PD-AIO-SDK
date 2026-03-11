/**
 * Reya Exchange Constants
 */
export declare const REYA_MAINNET_API = "https://api.reya.xyz/v2";
export declare const REYA_TESTNET_API = "https://api-test.reya.xyz/v2";
export declare const REYA_MAINNET_WS = "wss://ws.reya.xyz";
export declare const REYA_TESTNET_WS = "wss://websocket-testnet.reya.xyz";
export declare const REYA_CHAIN_ID = 1729;
export declare const REYA_EIP712_DOMAIN: {
    name: string;
    version: string;
    chainId: number;
};
export declare const REYA_RATE_LIMIT: {
    maxRequests: number;
    windowMs: number;
    weights: {
        fetchMarkets: number;
        fetchOrderBook: number;
        fetchTrades: number;
        fetchTicker: number;
        fetchFundingRate: number;
        fetchOHLCV: number;
        fetchPositions: number;
        fetchBalance: number;
        createOrder: number;
        cancelOrder: number;
        cancelAllOrders: number;
        fetchOpenOrders: number;
        fetchMyTrades: number;
    };
};
export declare const REYA_ORDER_TYPES: {
    readonly LIMIT: "LIMIT";
    readonly TP: "TP";
    readonly SL: "SL";
};
export declare const REYA_TIME_IN_FORCE: {
    readonly IOC: "IOC";
    readonly GTC: "GTC";
};
export declare const REYA_ORDER_STATUS: {
    readonly OPEN: "OPEN";
    readonly FILLED: "FILLED";
    readonly CANCELLED: "CANCELLED";
    readonly REJECTED: "REJECTED";
};
/**
 * Convert unified symbol to Reya format
 * Reya uses symbols like "BTCRUSDPERP" for perpetuals
 * @example "BTC/USD:USD" -> "BTCRUSDPERP"
 */
export declare function unifiedToReya(symbol: string): string;
/**
 * Convert Reya symbol to unified format
 * @example "BTCRUSDPERP" -> "BTC/USD:USD"
 */
export declare function reyaToUnified(exchangeSymbol: string): string;
export declare const REYA_DEFAULT_PRECISION: {
    price: number;
    amount: number;
};
export declare const REYA_WS_CHANNELS: {
    readonly MARKET_DEPTH: "/v2/market/depth";
    readonly MARKET_SUMMARY: "/v2/market/summary";
    readonly MARKET_PERP_EXECUTIONS: "/v2/market/perp-executions";
    readonly MARKETS_SUMMARY: "/v2/markets/summary";
    readonly PRICES: "/v2/prices";
    readonly PRICE: "/v2/price";
    readonly WALLET_POSITIONS: "/v2/wallet/positions";
    readonly WALLET_ORDERS: "/v2/wallet/order-changes";
    readonly WALLET_BALANCES: "/v2/wallet/account-balances";
    readonly WALLET_PERP_EXECUTIONS: "/v2/wallet/perp-executions";
};
export declare const REYA_WS_RECONNECT: {
    enabled: boolean;
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    multiplier: number;
    jitter: number;
};
export declare const REYA_FUNDING_INTERVAL_HOURS = 1;
export declare const REYA_EXCHANGE_ID = 1;
//# sourceMappingURL=constants.d.ts.map