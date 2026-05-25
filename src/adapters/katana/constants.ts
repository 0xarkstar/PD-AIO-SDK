/**
 * Katana Network constants and configuration
 *
 * Katana is a perpetual futures DEX on a custom L2 (chainId 747474).
 * Uses dual authentication: HMAC-SHA256 for all private requests + EIP-712 for writes.
 *
 * @see https://api-docs-v1-perps.katana.network/#introduction
 */

/**
 * Katana API endpoints
 */
export const KATANA_API_URLS = {
  mainnet: {
    rest: 'https://api-perps.katana.network/v1',
    websocket: 'wss://websocket-perps.katana.network/v1',
  },
  sandbox: {
    rest: 'https://api-perps-sandbox.katana.network/v1',
    websocket: 'wss://websocket-perps-sandbox.katana.network/v1',
  },
} as const;

/**
 * Rate limits
 *
 * Public without key: 5 req/s
 * Public with key: 10 req/s
 * Private: 10 req/s
 * Trade: 10 req/s
 */
export const KATANA_RATE_LIMITS = {
  public: {
    maxRequests: 10,
    windowMs: 1000,
  },
  private: {
    maxRequests: 10,
    windowMs: 1000,
  },
} as const;

/**
 * Endpoint weights
 */
export const KATANA_ENDPOINT_WEIGHTS = {
  fetchMarkets: 1,
  fetchTicker: 1,
  fetchOrderBook: 2,
  fetchTrades: 2,
  fetchOHLCV: 2,
  fetchFundingRate: 1,
  fetchFundingRateHistory: 2,
  fetchPositions: 2,
  fetchBalance: 2,
  fetchOpenOrders: 2,
  fetchOrderHistory: 3,
  fetchMyTrades: 3,
  createOrder: 5,
  cancelOrder: 3,
  cancelAllOrders: 10,
  setLeverage: 3,
} as const;

/**
 * Katana order type mapping (numeric enums)
 */
export const KATANA_ORDER_TYPES = {
  market: 0,
  limit: 1,
  stopMarket: 2,
  stopLimit: 3,
  takeProfitMarket: 4,
  takeProfitLimit: 5,
} as const;

/**
 * Reverse mapping: Katana numeric → unified string
 */
export const KATANA_ORDER_TYPE_REVERSE: Record<number, string> = {
  0: 'market',
  1: 'limit',
  2: 'stopMarket',
  3: 'stopLimit',
  4: 'takeProfit',
  5: 'takeProfit',
};

/**
 * Katana order side mapping
 */
export const KATANA_ORDER_SIDES = {
  buy: 0,
  sell: 1,
} as const;

export const KATANA_ORDER_SIDE_REVERSE: Record<number, string> = {
  0: 'buy',
  1: 'sell',
};

/**
 * Katana time in force mapping
 */
export const KATANA_TIME_IN_FORCE = {
  GTC: 0,
  PO: 1, // GTX / post-only / maker
  IOC: 2,
  FOK: 3,
} as const;

export const KATANA_TIME_IN_FORCE_REVERSE: Record<number, string> = {
  0: 'GTC',
  1: 'PO',
  2: 'IOC',
  3: 'FOK',
};

/**
 * Wire-body human strings for time-in-force (what POST /v1/orders sends).
 *
 * The EIP-712 struct uses uint8 values; the HTTP body uses these human strings.
 * Spec: gtc=0, gtx=1 (post-only/maker), ioc=2, fok=3.
 */
export const KATANA_WIRE_TIME_IN_FORCE: Record<number, string> = {
  0: 'gtc',
  1: 'gtx',
  2: 'ioc',
  3: 'fok',
};

/**
 * Wire-body human strings for self-trade-prevention (what POST /v1/orders sends).
 *
 * The EIP-712 struct uses uint8 values; the HTTP body uses these human strings.
 * Spec: dc=0, co=1, cn=2, cb=3.
 */
export const KATANA_WIRE_SELF_TRADE_PREVENTION: Record<number, string> = {
  0: 'dc',
  1: 'co',
  2: 'cn',
  3: 'cb',
};

/**
 * Katana trigger type mapping
 */
export const KATANA_TRIGGER_TYPES = {
  none: 0,
  index: 1,
  trade: 2,
} as const;

/**
 * Katana self-trade prevention
 */
export const KATANA_SELF_TRADE_PREVENTION = {
  decrementAndCancel: 0,
  cancelOldest: 1,
  cancelNewest: 2,
  cancelBoth: 3,
} as const;

/**
 * Katana order status mapping
 */
export const KATANA_ORDER_STATUS: Record<string, string> = {
  active: 'open',
  open: 'open',
  partiallyFilled: 'partiallyFilled',
  filled: 'closed',
  canceled: 'canceled',
  rejected: 'rejected',
  notFound: 'rejected',
};

/**
 * EIP-712 domain configuration for Katana (IDEX-v1 perps).
 *
 * Aligned to the live-verified Katana spec:
 * - `verifyingContract` equals the `exchangeContractAddress` returned by
 *   GET /v1/exchange (LIVE-CONFIRMED).
 * - `name`/`version`/`chainId` per the official API docs
 *   (api-docs-v1-perps.katana.network).
 *
 * VERIFY-LIVE: the docs sidebar lists EIP-712 `version` "2.0.0", while some
 * code samples show "1.0.0". The values below follow the sidebar. Confirm
 * against SANDBOX (chainId 737373) before placing mainnet orders — a wrong
 * `version` produces a different domain separator and the venue rejects the
 * signature.
 */
export const KATANA_EIP712_DOMAIN = {
  mainnet: {
    name: 'KatanaPerps',
    version: '2.0.0',
    chainId: 747474,
    verifyingContract: '0x62230CeA619F734cc215bB8074bbF07bE4Eb633e',
  },
  sandbox: {
    name: 'KatanaPerps',
    version: '2.0.0-sandbox',
    chainId: 737373, // Bokuto / sandbox testnet
    verifyingContract: '0x92d3072dDe1aD3e9B7895500F504aA5e664E71d3',
  },
} as const;

/**
 * EIP-712 Order type definition for order signing.
 *
 * Field order + types match the live Katana IDEX-v1 `Order` struct exactly
 * (17 fields). `nonce` and `conditionalOrderId` are `uint128` — they MUST be
 * passed to the signer as BigInt (or a decimal string of the BigInt), never as
 * a UUID string or a JS `number` (a uint128 does not fit in a JS number).
 */
export const KATANA_EIP712_ORDER_TYPE = {
  Order: [
    { name: 'nonce', type: 'uint128' },
    { name: 'wallet', type: 'address' },
    { name: 'marketSymbol', type: 'string' },
    { name: 'orderType', type: 'uint8' },
    { name: 'orderSide', type: 'uint8' },
    { name: 'quantity', type: 'string' },
    { name: 'limitPrice', type: 'string' },
    { name: 'triggerPrice', type: 'string' },
    { name: 'triggerType', type: 'uint8' },
    { name: 'callbackRate', type: 'string' },
    { name: 'conditionalOrderId', type: 'uint128' },
    { name: 'isReduceOnly', type: 'bool' },
    { name: 'timeInForce', type: 'uint8' },
    { name: 'selfTradePrevention', type: 'uint8' },
    { name: 'isLiquidationAcquisitionOnly', type: 'bool' },
    { name: 'delegatedPublicKey', type: 'address' },
    { name: 'clientOrderId', type: 'string' },
  ],
};

/**
 * EIP-712 Cancel-by-market type definition.
 *
 * Cancel-by-market signs `{ wallet, market }` under the corrected
 * KatanaPerps/2.0.0 domain.
 */
export const KATANA_EIP712_CANCEL_TYPE = {
  OrderCancellationByMarketSymbol: [
    { name: 'wallet', type: 'address' },
    { name: 'market', type: 'string' },
  ],
};

/**
 * EIP-712 Withdraw type definition (KatanaPerps/2.0.0 domain).
 */
export const KATANA_EIP712_WITHDRAW_TYPE = {
  Withdraw: [
    { name: 'nonce', type: 'uint128' },
    { name: 'wallet', type: 'address' },
    { name: 'quantity', type: 'string' },
  ],
};

/**
 * Precision: all Katana values use 8-decimal zero-padded strings
 */
export const KATANA_PRECISION = {
  amount: 8,
  price: 8,
} as const;

/**
 * HMAC authentication header names
 */
export const KATANA_AUTH_HEADERS = {
  apiKey: 'KP-API-KEY',
  hmacSignature: 'KP-HMAC-SIGNATURE',
} as const;

/**
 * Funding rate interval: every 8 hours (00:00, 08:00, 16:00 UTC)
 */
export const KATANA_FUNDING_INTERVAL_HOURS = 8;

/**
 * Nonce freshness window (ms): 60 seconds
 */
export const KATANA_NONCE_WINDOW_MS = 60000;

/**
 * Default fees
 */
export const KATANA_DEFAULT_FEES = {
  maker: 0.0001, // 0.01%
  taker: 0.0004, // 0.04%
} as const;

/**
 * WebSocket configuration
 */
export const KATANA_WS_CONFIG = {
  pingInterval: 30000,
  pongTimeout: 5000,
  inactivityTimeout: 300000, // 5 minutes
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  reconnectAttempts: 5,
} as const;

/**
 * WebSocket channels
 */
export const KATANA_WS_CHANNELS = {
  // Public
  tickers: 'tickers',
  candles: 'candles',
  trades: 'trades',
  liquidations: 'liquidations',
  orderbookL1: 'orderbook_l1',
  orderbookL2: 'orderbook_l2',
  // Private (require auth token)
  orders: 'orders',
  positions: 'positions',
  deposits: 'deposits',
  withdrawals: 'withdrawals',
  funding: 'funding',
} as const;

/**
 * OHLCV supported timeframes
 */
export const KATANA_TIMEFRAMES: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
};

/**
 * Null address for delegated key (disabled)
 */
export const KATANA_NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Zero decimal string
 */
export const KATANA_ZERO_DECIMAL = '0.00000000';
