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

export {
  GRVT_CHAIN_IDS,
  GRVT_EIP712_DOMAIN_NAME,
  GRVT_EIP712_DOMAIN_VERSION,
  GRVT_EIP712_ORDER_TYPES,
  GRVT_EIP712_ORDER_WITH_BUILDER_FEE_TYPES,
  GRVT_SIGN_TIME_IN_FORCE,
  GRVT_PRICE_DECIMALS,
  GRVT_BUILDER_FEE_DECIMALS,
} from './signing.js';

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
export const GRVT_API_URLS = {
  mainnet: {
    edge: 'https://edge.grvt.io',
    trades: 'https://trades.grvt.io',
    marketData: 'https://market-data.grvt.io',
    rest: 'https://market-data.grvt.io',
    websocketTrades: 'wss://trades.grvt.io/ws',
    websocketMarketData: 'wss://market-data.grvt.io/ws',
    websocket: 'wss://market-data.grvt.io/ws',
  },
  testnet: {
    edge: 'https://edge.testnet.grvt.io',
    trades: 'https://trades.testnet.grvt.io',
    marketData: 'https://market-data.testnet.grvt.io',
    rest: 'https://market-data.testnet.grvt.io',
    websocketTrades: 'wss://trades.testnet.grvt.io/ws',
    websocketMarketData: 'wss://market-data.testnet.grvt.io/ws',
    websocket: 'wss://market-data.testnet.grvt.io/ws',
  },
} as const;

/**
 * GRVT REST endpoint paths (all POST, response wrapped in `{ result: ... }`).
 */
export const GRVT_ENDPOINTS = {
  // Auth (edge host)
  login: '/auth/api_key/login',
  // Market data (market-data host)
  instruments: 'full/v1/instruments',
  ticker: 'full/v1/ticker',
  book: 'full/v1/book',
  trade: 'full/v1/trade',
  funding: 'full/v1/funding',
  kline: 'full/v1/kline',
  // Trade data (trades host)
  createOrder: 'full/v1/create_order',
  cancelOrder: 'full/v1/cancel_order',
  cancelAllOrders: 'full/v1/cancel_all_orders',
  openOrders: 'full/v1/open_orders',
  orderHistory: 'full/v1/order_history',
  fillHistory: 'full/v1/fill_history',
  positions: 'full/v1/positions',
  accountSummary: 'full/v1/sub_account_summary',
} as const;

/**
 * GRVT rate limits: 100 requests / 10s window (=10/s); WS 50 subscriptions.
 */
export const GRVT_RATE_LIMITS = {
  rest: {
    maxRequests: 100,
    windowMs: 10000, // 10 seconds
  },
  websocket: {
    maxSubscriptions: 50,
  },
} as const;

/**
 * GRVT API endpoint weights (used by the token-bucket rate limiter).
 */
export const GRVT_ENDPOINT_WEIGHTS = {
  fetchMarkets: 1,
  fetchTicker: 1,
  fetchOrderBook: 2,
  fetchTrades: 2,
  fetchFundingRate: 1,
  fetchPositions: 2,
  fetchBalance: 2,
  fetchOpenOrders: 2,
  fetchClosedOrders: 3,
  createOrder: 5,
  cancelOrder: 3,
  createBatchOrders: 10,
  cancelAllOrders: 10,
  modifyOrder: 5,
  fetchOrder: 2,
  fetchMyTrades: 3,
  fetchDeposits: 2,
  fetchWithdrawals: 2,
  transfer: 5,
  login: 1,
} as const;

/**
 * GRVT order sides (wire enum).
 */
export const GRVT_ORDER_SIDES = {
  buy: 'BUY',
  sell: 'SELL',
} as const;

/**
 * GRVT time-in-force API request strings (orderbook venue).
 *
 * Distinct from the SIGN enum (`GRVT_SIGN_TIME_IN_FORCE`, re-exported from
 * signing.ts). post_only is only valid with GOOD_TILL_TIME / ALL_OR_NONE.
 */
export const GRVT_TIME_IN_FORCE = {
  GOOD_TILL_TIME: 'GOOD_TILL_TIME',
  ALL_OR_NONE: 'ALL_OR_NONE',
  IMMEDIATE_OR_CANCEL: 'IMMEDIATE_OR_CANCEL',
  FILL_OR_KILL: 'FILL_OR_KILL',
} as const;

/**
 * Map the unified TimeInForce + postOnly intent to a GRVT API TIF string.
 * Maker quotes (post_only) require GOOD_TILL_TIME.
 */
export const GRVT_UNIFIED_TIF_TO_API = {
  GTC: 'GOOD_TILL_TIME',
  IOC: 'IMMEDIATE_OR_CANCEL',
  FOK: 'FILL_OR_KILL',
  PO: 'GOOD_TILL_TIME',
} as const;

/**
 * Map a GRVT order status to the unified OrderStatus string.
 */
export const GRVT_ORDER_STATUS = {
  PENDING: 'open',
  OPEN: 'open',
  PARTIALLY_FILLED: 'partiallyFilled',
  FILLED: 'filled',
  CANCELLED: 'canceled',
  CANCELED: 'canceled',
  REJECTED: 'rejected',
} as const;

/**
 * GRVT WebSocket JSON-RPC stream names.
 *
 * Public (market-data host): book.s (full snapshot), book.d (delta),
 * trade, ticker.s, mini.s. Private (trades host, needs cookie + account id):
 * order, fill, position.
 */
export const GRVT_WS_STREAMS = {
  bookSnapshot: 'v1.book.s',
  bookDelta: 'v1.book.d',
  trade: 'v1.trade',
  tickerSnapshot: 'v1.ticker.s',
  mini: 'v1.mini.s',
  order: 'v1.order',
  fill: 'v1.fill',
  position: 'v1.position',
} as const;

/**
 * Valid GRVT order book depths.
 */
export const GRVT_BOOK_DEPTHS = [10, 50, 100, 500] as const;

/**
 * GRVT instrument kind kept by this adapter (perpetuals only).
 */
export const GRVT_PERPETUAL_KIND = 'PERPETUAL';

/**
 * GRVT precision defaults (used when an instrument omits explicit precision).
 */
export const GRVT_PRECISION = {
  amount: 8,
  price: 8,
} as const;

/**
 * GRVT session cookie default lifetime (ms) when the login response omits an
 * explicit expiry. The session is refreshed when <5s remain.
 */
export const GRVT_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Refresh the session cookie when fewer than this many ms remain to expiry.
 */
export const GRVT_SESSION_REFRESH_BUFFER_MS = 5000;

/**
 * GRVT max leverage.
 */
export const GRVT_MAX_LEVERAGE = 100;
