/**
 * Jupiter Perps Exchange Constants
 *
 * Jupiter Perps is an on-chain perpetuals exchange on Solana using the JLP pool.
 * Unlike traditional perp exchanges, it uses borrow fees instead of funding rates.
 *
 * @see https://jup.ag/perps
 * @see https://dev.jup.ag/docs/perps
 */
export declare const JUPITER_API_URLS: {
    readonly mainnet: {
        readonly price: "https://api.jup.ag/price/v3";
        readonly stats: "https://perp-api.jup.ag";
    };
};
export declare const JUPITER_MAINNET_PRICE_API: "https://api.jup.ag/price/v3";
export declare const JUPITER_MAINNET_STATS_API: "https://perp-api.jup.ag";
/**
 * Jupiter Perpetuals Program ID on Solana mainnet
 */
export declare const JUPITER_PERPS_PROGRAM_ID = "PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2verr";
/**
 * JLP Token Mint Address
 */
export declare const JLP_TOKEN_MINT = "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4";
/**
 * Token mint addresses for collateral/markets
 */
export declare const JUPITER_TOKEN_MINTS: {
    readonly SOL: "So11111111111111111111111111111111111111112";
    readonly ETH: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs";
    readonly BTC: "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh";
    readonly USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    readonly USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
};
export declare const JUPITER_RATE_LIMIT: {
    maxRequests: number;
    windowMs: number;
    weights: {
        fetchMarkets: number;
        fetchOrderBook: number;
        fetchTrades: number;
        fetchTicker: number;
        fetchFundingRate: number;
        fetchOHLCV: number;
        fetchPositions: number;
        fetchBalance: number;
        createOrder: number;
        cancelOrder: number;
        cancelAllOrders: number;
    };
};
/**
 * Supported perpetual markets on Jupiter
 * Jupiter Perps supports SOL, ETH, and BTC
 */
export declare const JUPITER_MARKETS: {
    readonly 'SOL-PERP': {
        readonly symbol: "SOL/USD:USD";
        readonly baseToken: "SOL";
        readonly maxLeverage: 250;
        readonly minPositionSize: 0.01;
        readonly tickSize: 0.001;
        readonly stepSize: 0.001;
    };
    readonly 'ETH-PERP': {
        readonly symbol: "ETH/USD:USD";
        readonly baseToken: "ETH";
        readonly maxLeverage: 250;
        readonly minPositionSize: 0.001;
        readonly tickSize: 0.01;
        readonly stepSize: 0.0001;
    };
    readonly 'BTC-PERP': {
        readonly symbol: "BTC/USD:USD";
        readonly baseToken: "BTC";
        readonly maxLeverage: 250;
        readonly minPositionSize: 0.0001;
        readonly tickSize: 0.1;
        readonly stepSize: 0.00001;
    };
};
export declare const JUPITER_ORDER_SIDES: {
    readonly LONG: "long";
    readonly SHORT: "short";
};
/**
 * Convert unified symbol to Jupiter format
 * @example "SOL/USD:USD" -> "SOL-PERP"
 * @example "BTC/USD:USD" -> "BTC-PERP"
 */
export declare function unifiedToJupiter(symbol: string): string;
/**
 * Convert Jupiter symbol to unified format
 * @example "SOL-PERP" -> "SOL/USD:USD"
 * @example "BTC-PERP" -> "BTC/USD:USD"
 */
export declare function jupiterToUnified(exchangeSymbol: string): string;
/**
 * Get base token from unified symbol
 */
export declare function getBaseToken(symbol: string): string;
export declare const JUPITER_DEFAULT_PRECISION: {
    price: number;
    amount: number;
};
/**
 * Jupiter Perps uses borrow fees instead of funding rates
 * Fees compound hourly based on position utilization
 */
export declare const JUPITER_BORROW_FEE: {
    intervalHours: number;
    minRate: number;
    maxRate: number;
};
export declare const SOLANA_RPC_ENDPOINTS: {
    readonly mainnet: readonly ["https://api.mainnet-beta.solana.com", "https://solana-api.projectserum.com"];
};
export declare const SOLANA_DEFAULT_RPC: "https://api.mainnet-beta.solana.com";
export declare const JUPITER_ERROR_MESSAGES: Record<string, string>;
//# sourceMappingURL=constants.d.ts.map