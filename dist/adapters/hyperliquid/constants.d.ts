/**
 * Hyperliquid Exchange Constants
 */
export declare const HYPERLIQUID_MAINNET_API = "https://api.hyperliquid.xyz";
export declare const HYPERLIQUID_TESTNET_API = "https://api.hyperliquid-testnet.xyz";
export declare const HYPERLIQUID_MAINNET_WS = "wss://api.hyperliquid.xyz/ws";
export declare const HYPERLIQUID_TESTNET_WS = "wss://api.hyperliquid-testnet.xyz/ws";
export declare const HYPERLIQUID_CHAIN_ID = 1337;
export declare const HYPERLIQUID_ARBITRUM_CHAIN_ID = 42161;
export declare const HYPERLIQUID_EIP712_DOMAIN: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
};
export declare const HYPERLIQUID_ACTION_TYPES: {
    Agent: {
        name: string;
        type: string;
    }[];
};
export declare const HYPERLIQUID_RATE_LIMIT: {
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
        createBatchOrders: number;
        cancelAllOrders: number;
    };
};
export declare const HYPERLIQUID_ORDER_TYPES: {
    readonly LIMIT: "limit";
    readonly MARKET: "market";
};
export declare const HYPERLIQUID_TIME_IN_FORCE: {
    readonly GTC: "Gtc";
    readonly IOC: "Ioc";
    readonly ALO: "Alo";
};
/**
 * Convert unified symbol to Hyperliquid format
 * Hyperliquid uses just the base asset name (e.g., "BTC", "ETH")
 * @example "BTC/USDT:USDT" -> "BTC"
 */
export declare function unifiedToHyperliquid(symbol: string): string;
/**
 * Convert Hyperliquid symbol to unified format
 * @example "BTC" -> "BTC/USDT:USDT"
 */
export declare function hyperliquidToUnified(exchangeSymbol: string): string;
export declare const HYPERLIQUID_DEFAULT_PRECISION: {
    price: number;
    amount: number;
};
export declare const HYPERLIQUID_WS_CHANNELS: {
    readonly L2_BOOK: "l2Book";
    readonly TRADES: "trades";
    readonly ALL_MIDS: "allMids";
    readonly USER: "user";
    readonly USER_EVENTS: "userEvents";
    readonly USER_FILLS: "userFills";
};
export declare const HYPERLIQUID_WS_RECONNECT: {
    enabled: boolean;
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    multiplier: number;
    jitter: number;
};
export declare const HYPERLIQUID_FUNDING_INTERVAL_HOURS = 8;
export declare const HYPERLIQUID_ERROR_MESSAGES: Record<string, string>;
//# sourceMappingURL=constants.d.ts.map