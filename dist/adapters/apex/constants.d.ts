/**
 * ApeX Omni Constants
 *
 * Recon-verified 2026-06-11 (all shapes byte-captured live).
 * REST: https://omni.apex.exchange/api/v3 — envelope {data,timeCost} / {code,msg,timeCost}.
 * WS public: wss://quote.omni.apex.exchange/realtime_public?v=2&timestamp=<ms>.
 */
export declare const APEX_API_URLS: {
    mainnet: {
        rest: string;
        websocket: string;
    };
    testnet: {
        rest: string;
        websocket: string;
    };
};
/**
 * Public rate limit: 600 req / 60s / IP (docs).
 * HTTP 403 = IP BAN (not throttle) — limiter stays conservative.
 */
export declare const APEX_RATE_LIMITS: {
    rest: {
        maxRequests: number;
        windowMs: number;
    };
};
/**
 * Endpoint weights. /symbols is a heavy 731KB config payload — weighted high
 * and cached at the adapter level.
 */
export declare const APEX_ENDPOINT_WEIGHTS: Record<string, number>;
/**
 * Unified timeframe → venue interval code.
 * Venue intervals: 1 5 15 30 60 120 240 360 720 "D" "W" "M"
 * (minutes + letters; start/end query params are SECONDS).
 */
export declare const APEX_KLINE_INTERVALS: Record<string, string>;
/**
 * Funding settles HOURLY (live-verified: 19/19 consecutive history gaps
 * exactly 1.0h). Rates on the wire are FRACTIONAL per-interval (passthrough).
 */
export declare const APEX_FUNDING_INTERVAL_HOURS = 1;
/** WS topic builders — ALL WS topics use the NO-DASH symbol form */
export declare const APEX_WS_TOPICS: {
    /** orderBook{25|200}.{H}.{SYMBOL} — H = high frequency */
    readonly ORDERBOOK: (symbol: string, depth?: 25 | 200) => string;
    /** recentlyTrade.H.{SYMBOL} */
    readonly TRADES: (symbol: string) => string;
    /** instrumentInfo.H.{SYMBOL} — ticker, update-field-only semantics */
    readonly TICKER: (symbol: string) => string;
    /** candle.{interval}.{SYMBOL} */
    readonly CANDLE: (interval: string, symbol: string) => string;
};
/**
 * WS heartbeat: client pings every 15s ({op:'ping',args:["<ms>"]}); the server
 * ALSO sends {op:'ping'} and the client MUST reply {op:'pong'} (live-observed);
 * 150s staleness → server closes the connection.
 */
export declare const APEX_WS_CLIENT_PING_INTERVAL_MS = 15000;
/** Venue default trading fees (docs; not present in the /symbols payload) */
export declare const APEX_DEFAULT_MAKER_FEE = 0.0002;
export declare const APEX_DEFAULT_TAKER_FEE = 0.0005;
//# sourceMappingURL=constants.d.ts.map