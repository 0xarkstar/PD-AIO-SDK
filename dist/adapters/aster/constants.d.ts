/**
 * Aster Constants
 */
export declare const ASTER_API_URLS: {
    mainnet: {
        rest: string;
        websocket: string;
    };
    testnet: {
        rest: string;
        websocket: string;
    };
};
export declare const ASTER_RATE_LIMITS: {
    rest: {
        maxRequests: number;
        windowMs: number;
    };
    order: {
        maxRequests: number;
        windowMs: number;
    };
};
export declare const ASTER_ENDPOINT_WEIGHTS: Record<string, number>;
export declare const ASTER_ORDER_TYPES: Record<string, string>;
export declare const ASTER_ORDER_SIDES: Record<string, string>;
export declare const ASTER_TIME_IN_FORCE: Record<string, string>;
export declare const ASTER_ORDER_STATUS: Record<string, string>;
export declare const ASTER_KLINE_INTERVALS: Record<string, string>;
export declare const ASTER_DEFAULT_RECV_WINDOW = 5000;
//# sourceMappingURL=constants.d.ts.map