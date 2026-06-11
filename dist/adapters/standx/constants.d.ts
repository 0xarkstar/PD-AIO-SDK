/**
 * StandX Constants
 *
 * Recon-verified 2026-06-11 (all shapes byte-captured live, keyless).
 * REST: https://perps.standx.com — BARE payloads (no envelope); errors are
 * JSON {code,message} with real HTTP statuses.
 * WS public: wss://perps.standx.com/ws-stream/v1 — subscribe
 * {"subscribe":{channel,symbol}}; messages {seq,channel,symbol,data}.
 * No testnet is documented for StandX perps — mainnet only.
 */
export declare const STANDX_API_URLS: {
    mainnet: {
        rest: string;
        websocket: string;
    };
};
/**
 * Credit-bucket rate limit (docs): 45 credits/request, 1000 credits/s
 * replenish, 900 burst ⇒ 20-request burst, ~22 req/s sustained.
 * Configured conservatively at 20 req/s.
 */
export declare const STANDX_RATE_LIMITS: {
    rest: {
        maxRequests: number;
        windowMs: number;
    };
};
/**
 * Unified timeframe → venue kline resolution.
 * Venue enum: 1T 3S 1 5 15 60 1D 1W 1M (1T=tick and 3S=3s have no unified
 * counterpart). kline/history from/to params are SECONDS.
 */
export declare const STANDX_KLINE_RESOLUTIONS: Record<string, string>;
/** Timeframe lengths in seconds (window defaults for kline/history from/to) */
export declare const STANDX_TIMEFRAME_SECONDS: Record<string, number>;
/**
 * Funding settles HOURLY (live-verified: 23/23 consecutive captured history
 * gaps exactly 1.0h). Rates on the wire are FRACTIONAL per-interval
 * (0.0000125) — passthrough, NO percent conversion (no grvt-style trap).
 */
export declare const STANDX_FUNDING_INTERVAL_HOURS = 1;
/** Public WS channels (NO auth needed for these three) */
export declare const STANDX_WS_CHANNELS: {
    readonly DEPTH_BOOK: "depth_book";
    readonly PUBLIC_TRADE: "public_trade";
    readonly PRICE: "price";
};
/**
 * WS connection rules (docs): 24h max connection lifetime, server pings at
 * the WS PROTOCOL level (the runtime auto-pongs; missing pongs for 5 minutes
 * → close {code:408}), 10 connections/IP, 30 new connections/minute.
 * There is NO JSON heartbeat — the wrapper sends no ping frames.
 */
export declare const STANDX_WS_MAX_CONNECTION_MS: number;
//# sourceMappingURL=constants.d.ts.map