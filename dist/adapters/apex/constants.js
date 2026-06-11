/**
 * ApeX Omni Constants
 *
 * Recon-verified 2026-06-11 (all shapes byte-captured live).
 * REST: https://omni.apex.exchange/api/v3 — envelope {data,timeCost} / {code,msg,timeCost}.
 * WS public: wss://quote.omni.apex.exchange/realtime_public?v=2&timestamp=<ms>.
 */
export const APEX_API_URLS = {
    mainnet: {
        rest: 'https://omni.apex.exchange/api/v3',
        websocket: 'wss://quote.omni.apex.exchange/realtime_public',
    },
    testnet: {
        rest: 'https://testnet.omni.apex.exchange/api/v3',
        // QA/testnet quote host per venue docs (mainnet host live-verified)
        websocket: 'wss://qa-quote.omni.apex.exchange/realtime_public',
    },
};
/**
 * Public rate limit: 600 req / 60s / IP (docs).
 * HTTP 403 = IP BAN (not throttle) — limiter stays conservative.
 */
export const APEX_RATE_LIMITS = {
    rest: {
        maxRequests: 600,
        windowMs: 60000,
    },
};
/**
 * Endpoint weights. /symbols is a heavy 731KB config payload — weighted high
 * and cached at the adapter level.
 */
export const APEX_ENDPOINT_WEIGHTS = {
    fetchMarkets: 10,
    fetchTicker: 1,
    fetchOrderBook: 5,
    fetchTrades: 5,
    fetchFundingRate: 1,
    fetchFundingRateHistory: 1,
    fetchOHLCV: 5,
};
/**
 * Unified timeframe → venue interval code.
 * Venue intervals: 1 5 15 30 60 120 240 360 720 "D" "W" "M"
 * (minutes + letters; start/end query params are SECONDS).
 */
export const APEX_KLINE_INTERVALS = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '30m': '30',
    '1h': '60',
    '2h': '120',
    '4h': '240',
    '6h': '360',
    '12h': '720',
    '1d': 'D',
    '1w': 'W',
    '1M': 'M',
};
/**
 * Funding settles HOURLY (live-verified: 19/19 consecutive history gaps
 * exactly 1.0h). Rates on the wire are FRACTIONAL per-interval (passthrough).
 */
export const APEX_FUNDING_INTERVAL_HOURS = 1;
/** WS topic builders — ALL WS topics use the NO-DASH symbol form */
export const APEX_WS_TOPICS = {
    /** orderBook{25|200}.{H}.{SYMBOL} — H = high frequency */
    ORDERBOOK: (symbol, depth = 200) => `orderBook${depth}.H.${symbol}`,
    /** recentlyTrade.H.{SYMBOL} */
    TRADES: (symbol) => `recentlyTrade.H.${symbol}`,
    /** instrumentInfo.H.{SYMBOL} — ticker, update-field-only semantics */
    TICKER: (symbol) => `instrumentInfo.H.${symbol}`,
    /** candle.{interval}.{SYMBOL} */
    CANDLE: (interval, symbol) => `candle.${interval}.${symbol}`,
};
/**
 * WS heartbeat: client pings every 15s ({op:'ping',args:["<ms>"]}); the server
 * ALSO sends {op:'ping'} and the client MUST reply {op:'pong'} (live-observed);
 * 150s staleness → server closes the connection.
 */
export const APEX_WS_CLIENT_PING_INTERVAL_MS = 15000;
/** Venue default trading fees (docs; not present in the /symbols payload) */
export const APEX_DEFAULT_MAKER_FEE = 0.0002;
export const APEX_DEFAULT_TAKER_FEE = 0.0005;
//# sourceMappingURL=constants.js.map