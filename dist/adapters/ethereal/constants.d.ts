/**
 * Ethereal Exchange Constants
 */
export declare const ETHEREAL_API_URLS: {
    mainnet: {
        rest: string;
        websocket: string;
    };
    testnet: {
        rest: string;
        websocket: string;
    };
};
export declare const ETHEREAL_CHAIN_ID = 0;
export declare const ETHEREAL_EIP712_DOMAIN: {
    name: string;
    version: string;
    chainId: number;
};
export declare const ETHEREAL_RATE_LIMITS: {
    rest: {
        maxRequests: number;
        windowMs: number;
    };
    order: {
        maxRequests: number;
        windowMs: number;
    };
};
export declare const ETHEREAL_ENDPOINT_WEIGHTS: Record<string, number>;
export declare const ETHEREAL_ORDER_TYPES: Record<string, string>;
export declare const ETHEREAL_ORDER_SIDES: Record<string, string>;
export declare const ETHEREAL_TIME_IN_FORCE: Record<string, string>;
export declare const ETHEREAL_ORDER_STATUS: Record<string, string>;
export declare const ETHEREAL_KLINE_INTERVALS: Record<string, string>;
/**
 * Convert unified symbol to Ethereal format
 * Ethereal uses "ETH-USD" style symbols
 * @example "ETH/USD:USD" -> "ETH-USD"
 */
export declare function unifiedToEthereal(symbol: string): string;
/**
 * Convert Ethereal symbol to unified format
 * @example "ETH-USD" -> "ETH/USD:USD"
 */
export declare function etherealToUnified(exchangeSymbol: string): string;
export declare const ETHEREAL_DEFAULT_PRECISION: {
    price: number;
    amount: number;
};
export declare const ETHEREAL_FUNDING_INTERVAL_HOURS = 1;
//# sourceMappingURL=constants.d.ts.map