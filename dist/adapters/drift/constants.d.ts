/**
 * Drift Protocol Exchange Constants
 *
 * Drift is a decentralized perpetuals exchange on Solana with up to 20x leverage.
 * Uses DLOB (Decentralized Limit Order Book) for order matching.
 *
 * @see https://docs.drift.trade/
 * @see https://drift-labs.github.io/v2-teacher/
 */
export declare const DRIFT_API_URLS: {
    readonly mainnet: {
        readonly dlob: "https://dlob.drift.trade";
        readonly data: "https://data.api.drift.trade";
        readonly swift: "https://swift.drift.trade";
        readonly rpc: "https://api.mainnet-beta.solana.com";
    };
    readonly devnet: {
        readonly dlob: "https://master.dlob.drift.trade";
        readonly data: "https://data.api.drift.trade";
        readonly swift: "https://master.swift.drift.trade";
        readonly rpc: "https://api.devnet.solana.com";
    };
};
export declare const DRIFT_MAINNET_DLOB_API: "https://dlob.drift.trade";
export declare const DRIFT_MAINNET_DATA_API: "https://data.api.drift.trade";
export declare const DRIFT_DEVNET_DLOB_API: "https://master.dlob.drift.trade";
/**
 * Drift Protocol Program ID (same for mainnet and devnet)
 */
export declare const DRIFT_PROGRAM_ID = "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH";
/**
 * Drift uses specific precision constants for on-chain values
 */
export declare const DRIFT_PRECISION: {
    readonly BASE: 1000000000;
    readonly QUOTE: 1000000;
    readonly PRICE: 1000000;
    readonly FUNDING_RATE: 1000000000;
    readonly MARGIN: 10000;
    readonly PEG: 1000000;
    readonly PERCENTAGE: 1000000;
};
export declare const DRIFT_RATE_LIMIT: {
    readonly maxRequests: 100;
    readonly windowMs: 60000;
    readonly weights: {
        readonly fetchMarkets: 1;
        readonly fetchOrderBook: 2;
        readonly fetchTrades: 1;
        readonly fetchTicker: 1;
        readonly fetchFundingRate: 1;
        readonly fetchOHLCV: 2;
        readonly fetchPositions: 3;
        readonly fetchBalance: 2;
        readonly createOrder: 10;
        readonly cancelOrder: 5;
        readonly cancelAllOrders: 15;
    };
};
/**
 * Perpetual market configurations
 * marketIndex is used to identify markets on-chain
 */
export declare const DRIFT_PERP_MARKETS: {
    readonly 'SOL-PERP': {
        readonly marketIndex: 0;
        readonly symbol: "SOL/USD:USD";
        readonly baseAsset: "SOL";
        readonly maxLeverage: 20;
        readonly minOrderSize: 0.1;
        readonly tickSize: 0.001;
        readonly stepSize: 0.1;
        readonly contractTier: "B";
        readonly maintenanceMarginRatio: 0.05;
        readonly initialMarginRatio: 0.1;
    };
    readonly 'BTC-PERP': {
        readonly marketIndex: 1;
        readonly symbol: "BTC/USD:USD";
        readonly baseAsset: "BTC";
        readonly maxLeverage: 20;
        readonly minOrderSize: 0.001;
        readonly tickSize: 0.1;
        readonly stepSize: 0.001;
        readonly contractTier: "A";
        readonly maintenanceMarginRatio: 0.05;
        readonly initialMarginRatio: 0.1;
    };
    readonly 'ETH-PERP': {
        readonly marketIndex: 2;
        readonly symbol: "ETH/USD:USD";
        readonly baseAsset: "ETH";
        readonly maxLeverage: 20;
        readonly minOrderSize: 0.01;
        readonly tickSize: 0.01;
        readonly stepSize: 0.01;
        readonly contractTier: "B";
        readonly maintenanceMarginRatio: 0.05;
        readonly initialMarginRatio: 0.1;
    };
    readonly 'APT-PERP': {
        readonly marketIndex: 3;
        readonly symbol: "APT/USD:USD";
        readonly baseAsset: "APT";
        readonly maxLeverage: 10;
        readonly minOrderSize: 1;
        readonly tickSize: 0.001;
        readonly stepSize: 1;
        readonly contractTier: "B";
        readonly maintenanceMarginRatio: 0.1;
        readonly initialMarginRatio: 0.2;
    };
    readonly '1MBONK-PERP': {
        readonly marketIndex: 4;
        readonly symbol: "1MBONK/USD:USD";
        readonly baseAsset: "1MBONK";
        readonly maxLeverage: 10;
        readonly minOrderSize: 1;
        readonly tickSize: 0.00001;
        readonly stepSize: 1;
        readonly contractTier: "C";
        readonly maintenanceMarginRatio: 0.1;
        readonly initialMarginRatio: 0.2;
    };
    readonly 'MATIC-PERP': {
        readonly marketIndex: 5;
        readonly symbol: "MATIC/USD:USD";
        readonly baseAsset: "MATIC";
        readonly maxLeverage: 10;
        readonly minOrderSize: 10;
        readonly tickSize: 0.0001;
        readonly stepSize: 10;
        readonly contractTier: "B";
        readonly maintenanceMarginRatio: 0.1;
        readonly initialMarginRatio: 0.2;
    };
    readonly 'ARB-PERP': {
        readonly marketIndex: 6;
        readonly symbol: "ARB/USD:USD";
        readonly baseAsset: "ARB";
        readonly maxLeverage: 10;
        readonly minOrderSize: 10;
        readonly tickSize: 0.0001;
        readonly stepSize: 10;
        readonly contractTier: "B";
        readonly maintenanceMarginRatio: 0.1;
        readonly initialMarginRatio: 0.2;
    };
    readonly 'DOGE-PERP': {
        readonly marketIndex: 7;
        readonly symbol: "DOGE/USD:USD";
        readonly baseAsset: "DOGE";
        readonly maxLeverage: 10;
        readonly minOrderSize: 100;
        readonly tickSize: 0.00001;
        readonly stepSize: 100;
        readonly contractTier: "B";
        readonly maintenanceMarginRatio: 0.1;
        readonly initialMarginRatio: 0.2;
    };
    readonly 'BNB-PERP': {
        readonly marketIndex: 8;
        readonly symbol: "BNB/USD:USD";
        readonly baseAsset: "BNB";
        readonly maxLeverage: 10;
        readonly minOrderSize: 0.1;
        readonly tickSize: 0.01;
        readonly stepSize: 0.1;
        readonly contractTier: "B";
        readonly maintenanceMarginRatio: 0.1;
        readonly initialMarginRatio: 0.2;
    };
    readonly 'SUI-PERP': {
        readonly marketIndex: 9;
        readonly symbol: "SUI/USD:USD";
        readonly baseAsset: "SUI";
        readonly maxLeverage: 10;
        readonly minOrderSize: 10;
        readonly tickSize: 0.0001;
        readonly stepSize: 10;
        readonly contractTier: "B";
        readonly maintenanceMarginRatio: 0.1;
        readonly initialMarginRatio: 0.2;
    };
    readonly 'PEPE-PERP': {
        readonly marketIndex: 10;
        readonly symbol: "1MPEPE/USD:USD";
        readonly baseAsset: "1MPEPE";
        readonly maxLeverage: 10;
        readonly minOrderSize: 1;
        readonly tickSize: 0.00001;
        readonly stepSize: 1;
        readonly contractTier: "C";
        readonly maintenanceMarginRatio: 0.1;
        readonly initialMarginRatio: 0.2;
    };
};
/**
 * Map from market index to market key
 */
export declare const DRIFT_MARKET_INDEX_MAP: Record<number, string>;
export declare const DRIFT_ORDER_TYPES: {
    readonly MARKET: "market";
    readonly LIMIT: "limit";
    readonly TRIGGER_MARKET: "triggerMarket";
    readonly TRIGGER_LIMIT: "triggerLimit";
    readonly ORACLE: "oracle";
};
export declare const DRIFT_DIRECTIONS: {
    readonly LONG: "long";
    readonly SHORT: "short";
};
export declare const DRIFT_MARKET_TYPES: {
    readonly PERP: "perp";
    readonly SPOT: "spot";
};
/**
 * Convert unified symbol to Drift format
 * @example "SOL/USD:USD" -> "SOL-PERP"
 * @example "BTC/USD:USD" -> "BTC-PERP"
 */
export declare function unifiedToDrift(symbol: string): string;
/**
 * Convert Drift symbol to unified format
 * @example "SOL-PERP" -> "SOL/USD:USD"
 * @example "BTC-PERP" -> "BTC/USD:USD"
 */
export declare function driftToUnified(exchangeSymbol: string): string;
/**
 * Get market index from symbol
 */
export declare function getMarketIndex(symbol: string): number;
/**
 * Get symbol from market index
 */
export declare function getSymbolFromIndex(marketIndex: number): string | undefined;
/**
 * Get base token from unified symbol
 */
export declare function getBaseToken(symbol: string): string;
export declare const DRIFT_FUNDING: {
    readonly intervalHours: 1;
    readonly settlementFrequency: 3600;
};
export declare const DRIFT_WS_CHANNELS: {
    readonly ORDERBOOK: "orderbook";
    readonly TRADES: "trades";
    readonly FUNDING: "funding";
    readonly PERP_MARKETS: "perpMarkets";
    readonly SPOT_MARKETS: "spotMarkets";
    readonly USER: "user";
};
export declare const DRIFT_ERROR_MESSAGES: Record<string, string>;
//# sourceMappingURL=constants.d.ts.map