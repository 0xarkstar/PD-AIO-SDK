/**
 * Pacifica Constants
 */
export declare const PACIFICA_API_URLS: {
    readonly mainnet: {
        readonly rest: "https://api.pacifica.fi/api/v1";
        readonly websocket: "wss://ws.pacifica.fi/ws";
    };
    readonly testnet: {
        readonly rest: "https://testnet-api.pacifica.fi/api/v1";
        readonly websocket: "wss://testnet-ws.pacifica.fi/ws";
    };
};
export declare const PACIFICA_RATE_LIMITS: {
    readonly rest: {
        readonly maxRequests: 600;
        readonly windowMs: 60000;
    };
    readonly order: {
        readonly maxRequests: 100;
        readonly windowMs: 10000;
    };
};
export declare const PACIFICA_ENDPOINT_WEIGHTS: Record<string, number>;
export declare const PACIFICA_ORDER_STATUS: Record<string, string>;
export declare const PACIFICA_AUTH_WINDOW = 5000;
//# sourceMappingURL=constants.d.ts.map