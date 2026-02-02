/**
 * dYdX v4 Exchange Constants
 *
 * dYdX v4 is built on a Cosmos SDK L1 blockchain
 */
export declare const DYDX_API_URLS: {
    readonly mainnet: {
        readonly indexer: "https://indexer.dydx.trade/v4";
        readonly websocket: "wss://indexer.dydx.trade/v4/ws";
    };
    readonly testnet: {
        readonly indexer: "https://indexer.v4testnet.dydx.exchange/v4";
        readonly websocket: "wss://indexer.v4testnet.dydx.exchange/v4/ws";
    };
};
export declare const DYDX_MAINNET_API: "https://indexer.dydx.trade/v4";
export declare const DYDX_TESTNET_API: "https://indexer.v4testnet.dydx.exchange/v4";
export declare const DYDX_MAINNET_WS: "wss://indexer.dydx.trade/v4/ws";
export declare const DYDX_TESTNET_WS: "wss://indexer.v4testnet.dydx.exchange/v4/ws";
export declare const DYDX_RATE_LIMIT: {
    maxRequests: number;
    windowMs: number;
    weights: {
        fetchMarkets: number;
        fetchOrderBook: number;
        fetchTrades: number;
        fetchTicker: number;
        fetchFundingRate: number;
        fetchFundingRateHistory: number;
        fetchOHLCV: number;
        fetchPositions: number;
        fetchBalance: number;
        createOrder: number;
        cancelOrder: number;
        cancelAllOrders: number;
        fetchOpenOrders: number;
        fetchOrderHistory: number;
        fetchMyTrades: number;
        setLeverage: number;
    };
};
export declare const DYDX_ORDER_TYPES: {
    readonly LIMIT: "LIMIT";
    readonly MARKET: "MARKET";
    readonly STOP_LIMIT: "STOP_LIMIT";
    readonly STOP_MARKET: "STOP_MARKET";
    readonly TRAILING_STOP: "TRAILING_STOP";
    readonly TAKE_PROFIT: "TAKE_PROFIT";
    readonly TAKE_PROFIT_MARKET: "TAKE_PROFIT_MARKET";
};
export declare const DYDX_ORDER_SIDES: {
    readonly BUY: "BUY";
    readonly SELL: "SELL";
};
export declare const DYDX_ORDER_STATUSES: {
    readonly OPEN: "OPEN";
    readonly FILLED: "FILLED";
    readonly CANCELED: "CANCELED";
    readonly BEST_EFFORT_CANCELED: "BEST_EFFORT_CANCELED";
    readonly UNTRIGGERED: "UNTRIGGERED";
    readonly PENDING: "PENDING";
};
export declare const DYDX_TIME_IN_FORCE: {
    readonly GTT: "GTT";
    readonly FOK: "FOK";
    readonly IOC: "IOC";
};
/**
 * Convert unified symbol to dYdX format
 * @example "BTC/USD:USD" -> "BTC-USD"
 */
export declare function unifiedToDydx(symbol: string): string;
/**
 * Convert dYdX symbol to unified format
 * @example "BTC-USD" -> "BTC/USD:USD"
 */
export declare function dydxToUnified(exchangeSymbol: string): string;
export declare const DYDX_DEFAULT_PRECISION: {
    price: number;
    amount: number;
};
export declare const DYDX_WS_CHANNELS: {
    readonly MARKETS: "v4_markets";
    readonly TRADES: "v4_trades";
    readonly ORDERBOOK: "v4_orderbook";
    readonly CANDLES: "v4_candles";
    readonly SUBACCOUNTS: "v4_subaccounts";
    readonly BLOCK_HEIGHT: "v4_block_height";
};
export declare const DYDX_WS_RECONNECT: {
    enabled: boolean;
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    multiplier: number;
    jitter: number;
};
export declare const DYDX_FUNDING_INTERVAL_HOURS = 1;
export declare const DYDX_DEFAULT_SUBACCOUNT_NUMBER = 0;
export declare const DYDX_ERROR_MESSAGES: Record<string, string>;
//# sourceMappingURL=constants.d.ts.map