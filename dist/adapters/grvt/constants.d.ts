/**
 * GRVT constants and configuration.
 *
 * Ground-truthed 2026-05-26 against the official GRVT SDK + api-docs + live API.
 * GRVT splits its API across three hosts per environment:
 *  - edge:        auth (`POST /auth/api_key/login`)
 *  - trades:      orders / account (`full/v1/create_order`, ...)
 *  - market-data: public market data (`full/v1/{instruments,ticker,book,trade}`)
 *
 * EIP-712 order signing lives in `signing.ts` (proven leg-based struct). The
 * domain / order-type / sign-TIF enum / chain-ids are re-exported from there so
 * other files have a single source of truth and never re-define them.
 */
export { GRVT_CHAIN_IDS, GRVT_EIP712_DOMAIN_NAME, GRVT_EIP712_DOMAIN_VERSION, GRVT_EIP712_ORDER_TYPES, GRVT_EIP712_ORDER_WITH_BUILDER_FEE_TYPES, GRVT_SIGN_TIME_IN_FORCE, GRVT_PRICE_DECIMALS, GRVT_BUILDER_FEE_DECIMALS, } from './signing.js';
/**
 * GRVT API hosts (three per environment).
 *
 * Testnet swaps the `.` host segment for `.testnet.` (e.g. `edge.testnet.grvt.io`).
 * WebSocket lives on the trades + market-data hosts under the `/ws` base path
 * (the JSON-RPC `stream` name selects book/trade/ticker, NOT a URL suffix).
 *
 * `rest` aliases `marketData` for the BaseAdapter URL plumbing that expects a
 * single REST host; authed calls always target `trades`.
 *
 * @see https://api-docs.grvt.io/
 */
export declare const GRVT_API_URLS: {
    readonly mainnet: {
        readonly edge: "https://edge.grvt.io";
        readonly trades: "https://trades.grvt.io";
        readonly marketData: "https://market-data.grvt.io";
        readonly rest: "https://market-data.grvt.io";
        readonly websocketTrades: "wss://trades.grvt.io/ws";
        readonly websocketMarketData: "wss://market-data.grvt.io/ws";
        readonly websocket: "wss://market-data.grvt.io/ws";
    };
    readonly testnet: {
        readonly edge: "https://edge.testnet.grvt.io";
        readonly trades: "https://trades.testnet.grvt.io";
        readonly marketData: "https://market-data.testnet.grvt.io";
        readonly rest: "https://market-data.testnet.grvt.io";
        readonly websocketTrades: "wss://trades.testnet.grvt.io/ws";
        readonly websocketMarketData: "wss://market-data.testnet.grvt.io/ws";
        readonly websocket: "wss://market-data.testnet.grvt.io/ws";
    };
};
/**
 * GRVT REST endpoint paths (all POST, response wrapped in `{ result: ... }`).
 */
export declare const GRVT_ENDPOINTS: {
    readonly login: "/auth/api_key/login";
    readonly instruments: "full/v1/instruments";
    readonly ticker: "full/v1/ticker";
    readonly book: "full/v1/book";
    readonly trade: "full/v1/trade";
    readonly funding: "full/v1/funding";
    readonly kline: "full/v1/kline";
    readonly createOrder: "full/v1/create_order";
    readonly cancelOrder: "full/v1/cancel_order";
    readonly cancelAllOrders: "full/v1/cancel_all_orders";
    readonly openOrders: "full/v1/open_orders";
    readonly orderHistory: "full/v1/order_history";
    readonly fillHistory: "full/v1/fill_history";
    readonly positions: "full/v1/positions";
    readonly accountSummary: "full/v1/sub_account_summary";
};
/**
 * GRVT rate limits: 100 requests / 10s window (=10/s); WS 50 subscriptions.
 */
export declare const GRVT_RATE_LIMITS: {
    readonly rest: {
        readonly maxRequests: 100;
        readonly windowMs: 10000;
    };
    readonly websocket: {
        readonly maxSubscriptions: 50;
    };
};
/**
 * GRVT API endpoint weights (used by the token-bucket rate limiter).
 */
export declare const GRVT_ENDPOINT_WEIGHTS: {
    readonly fetchMarkets: 1;
    readonly fetchTicker: 1;
    readonly fetchOrderBook: 2;
    readonly fetchTrades: 2;
    readonly fetchFundingRate: 1;
    readonly fetchPositions: 2;
    readonly fetchBalance: 2;
    readonly fetchOpenOrders: 2;
    readonly fetchClosedOrders: 3;
    readonly createOrder: 5;
    readonly cancelOrder: 3;
    readonly createBatchOrders: 10;
    readonly cancelAllOrders: 10;
    readonly modifyOrder: 5;
    readonly fetchOrder: 2;
    readonly fetchMyTrades: 3;
    readonly fetchDeposits: 2;
    readonly fetchWithdrawals: 2;
    readonly transfer: 5;
    readonly login: 1;
};
/**
 * GRVT order sides (wire enum).
 */
export declare const GRVT_ORDER_SIDES: {
    readonly buy: "BUY";
    readonly sell: "SELL";
};
/**
 * GRVT time-in-force API request strings (orderbook venue).
 *
 * Distinct from the SIGN enum (`GRVT_SIGN_TIME_IN_FORCE`, re-exported from
 * signing.ts). post_only is only valid with GOOD_TILL_TIME / ALL_OR_NONE.
 */
export declare const GRVT_TIME_IN_FORCE: {
    readonly GOOD_TILL_TIME: "GOOD_TILL_TIME";
    readonly ALL_OR_NONE: "ALL_OR_NONE";
    readonly IMMEDIATE_OR_CANCEL: "IMMEDIATE_OR_CANCEL";
    readonly FILL_OR_KILL: "FILL_OR_KILL";
};
/**
 * Map the unified TimeInForce + postOnly intent to a GRVT API TIF string.
 * Maker quotes (post_only) require GOOD_TILL_TIME.
 */
export declare const GRVT_UNIFIED_TIF_TO_API: {
    readonly GTC: "GOOD_TILL_TIME";
    readonly IOC: "IMMEDIATE_OR_CANCEL";
    readonly FOK: "FILL_OR_KILL";
    readonly PO: "GOOD_TILL_TIME";
};
/**
 * Map a GRVT order status to the unified OrderStatus string.
 */
export declare const GRVT_ORDER_STATUS: {
    readonly PENDING: "open";
    readonly OPEN: "open";
    readonly PARTIALLY_FILLED: "partiallyFilled";
    readonly FILLED: "filled";
    readonly CANCELLED: "canceled";
    readonly CANCELED: "canceled";
    readonly REJECTED: "rejected";
};
/**
 * GRVT WebSocket JSON-RPC stream names.
 *
 * Public (market-data host): book.s (full snapshot), book.d (delta),
 * trade, ticker.s, mini.s. Private (trades host, needs cookie + account id):
 * order, fill, position.
 */
export declare const GRVT_WS_STREAMS: {
    readonly bookSnapshot: "v1.book.s";
    readonly bookDelta: "v1.book.d";
    readonly trade: "v1.trade";
    readonly tickerSnapshot: "v1.ticker.s";
    readonly mini: "v1.mini.s";
    readonly order: "v1.order";
    readonly fill: "v1.fill";
    readonly position: "v1.position";
};
/**
 * Valid GRVT order book depths.
 */
export declare const GRVT_BOOK_DEPTHS: readonly [10, 50, 100, 500];
/**
 * GRVT instrument kind kept by this adapter (perpetuals only).
 */
export declare const GRVT_PERPETUAL_KIND = "PERPETUAL";
/**
 * GRVT precision defaults (used when an instrument omits explicit precision).
 */
export declare const GRVT_PRECISION: {
    readonly amount: 8;
    readonly price: 8;
};
/**
 * GRVT session cookie default lifetime (ms) when the login response omits an
 * explicit expiry. The session is refreshed when <5s remain.
 */
export declare const GRVT_SESSION_DURATION: number;
/**
 * Refresh the session cookie when fewer than this many ms remain to expiry.
 */
export declare const GRVT_SESSION_REFRESH_BUFFER_MS = 5000;
/**
 * GRVT max leverage.
 */
export declare const GRVT_MAX_LEVERAGE = 100;
//# sourceMappingURL=constants.d.ts.map