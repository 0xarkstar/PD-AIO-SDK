/**
 * GMX v2 Exchange Constants
 *
 * GMX v2 is a decentralized perpetuals exchange on Arbitrum and Avalanche.
 * Uses synthetics-based perpetuals with on-chain keepers for order execution.
 *
 * @see https://docs.gmx.io/docs/api/rest-v2/
 * @see https://github.com/gmx-io/gmx-synthetics
 */
export declare const GMX_API_URLS: {
    readonly arbitrum: {
        readonly api: "https://arbitrum-api.gmxinfra.io";
        readonly subgraph: "https://gmx.squids.live/gmx-synthetics-arbitrum:prod/api/graphql";
        readonly rpc: "https://arb1.arbitrum.io/rpc";
        readonly chainId: 42161;
    };
    readonly avalanche: {
        readonly api: "https://avalanche-api.gmxinfra.io";
        readonly subgraph: "https://gmx.squids.live/gmx-synthetics-avalanche:prod/api/graphql";
        readonly rpc: "https://api.avax.network/ext/bc/C/rpc";
        readonly chainId: 43114;
    };
    readonly arbitrumSepolia: {
        readonly api: "https://arbitrum-sepolia-api.gmxinfra.io";
        readonly subgraph: "https://gmx.squids.live/gmx-synthetics-arbitrum-sepolia:prod/api/graphql";
        readonly rpc: "https://sepolia-rollup.arbitrum.io/rpc";
        readonly chainId: 421614;
    };
};
export declare const GMX_ARBITRUM_API: "https://arbitrum-api.gmxinfra.io";
export declare const GMX_AVALANCHE_API: "https://avalanche-api.gmxinfra.io";
/**
 * GMX uses specific precision constants for on-chain values
 * Oracle prices use 30 decimals
 */
export declare const GMX_PRECISION: {
    readonly PRICE: 1e+30;
    readonly USD: 1e+30;
    readonly FACTOR: 1e+30;
    readonly BASIS_POINTS: 10000;
    readonly FLOAT: 100000000;
    readonly TOKEN_DECIMALS: {
        readonly ETH: 18;
        readonly WETH: 18;
        readonly BTC: 8;
        readonly WBTC: 8;
        readonly USDC: 6;
        readonly USDT: 6;
        readonly DAI: 18;
        readonly AVAX: 18;
        readonly ARB: 18;
        readonly SOL: 9;
        readonly LINK: 18;
        readonly UNI: 18;
    };
};
export declare const GMX_RATE_LIMIT: {
    readonly maxRequests: 60;
    readonly windowMs: 60000;
    readonly weights: {
        readonly fetchMarkets: 1;
        readonly fetchTicker: 1;
        readonly fetchOrderBook: 2;
        readonly fetchTrades: 1;
        readonly fetchFundingRate: 1;
        readonly fetchOHLCV: 2;
        readonly fetchPositions: 3;
        readonly fetchBalance: 2;
    };
};
/**
 * GMX v2 market configurations
 * Markets are defined by index token + long/short collateral tokens
 */
export declare const GMX_MARKETS: {
    readonly 'ETH/USD:ETH': {
        readonly marketAddress: "0x70d95587d40A2caf56bd97485aB3Eec10Bee6336";
        readonly indexToken: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
        readonly longToken: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
        readonly shortToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
        readonly symbol: "ETH/USD:ETH";
        readonly baseAsset: "ETH";
        readonly quoteAsset: "USD";
        readonly settleAsset: "ETH";
        readonly maxLeverage: 100;
        readonly minOrderSize: 0.001;
        readonly tickSize: 0.01;
        readonly stepSize: 0.0001;
        readonly chain: "arbitrum";
    };
    readonly 'BTC/USD:BTC': {
        readonly marketAddress: "0x47c031236e19d024b42f8AE6780E44A573170703";
        readonly indexToken: "0x47904963fc8b2340414262125aF798B9655E58Cd";
        readonly longToken: "0x47904963fc8b2340414262125aF798B9655E58Cd";
        readonly shortToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
        readonly symbol: "BTC/USD:BTC";
        readonly baseAsset: "BTC";
        readonly quoteAsset: "USD";
        readonly settleAsset: "BTC";
        readonly maxLeverage: 100;
        readonly minOrderSize: 0.0001;
        readonly tickSize: 0.1;
        readonly stepSize: 0.00001;
        readonly chain: "arbitrum";
    };
    readonly 'SOL/USD:ETH': {
        readonly marketAddress: "0x09400D9DB990D5ed3f35D7be61DfAEB900Af03C9";
        readonly indexToken: "0x2bcC6D6CdBbDC0a4071e48bb3B969b06B3330c07";
        readonly longToken: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
        readonly shortToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
        readonly symbol: "SOL/USD:ETH";
        readonly baseAsset: "SOL";
        readonly quoteAsset: "USD";
        readonly settleAsset: "ETH";
        readonly maxLeverage: 50;
        readonly minOrderSize: 0.1;
        readonly tickSize: 0.001;
        readonly stepSize: 0.01;
        readonly chain: "arbitrum";
    };
    readonly 'ARB/USD:ARB': {
        readonly marketAddress: "0xC25cEf6061Cf5dE5eb761b50E4743c1F5D7E5407";
        readonly indexToken: "0x912CE59144191C1204E64559FE8253a0e49E6548";
        readonly longToken: "0x912CE59144191C1204E64559FE8253a0e49E6548";
        readonly shortToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
        readonly symbol: "ARB/USD:ARB";
        readonly baseAsset: "ARB";
        readonly quoteAsset: "USD";
        readonly settleAsset: "ARB";
        readonly maxLeverage: 50;
        readonly minOrderSize: 1;
        readonly tickSize: 0.0001;
        readonly stepSize: 0.1;
        readonly chain: "arbitrum";
    };
    readonly 'LINK/USD:ETH': {
        readonly marketAddress: "0x7f1fa204bb700853D36994DA19F830b6Ad18455C";
        readonly indexToken: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4";
        readonly longToken: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
        readonly shortToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
        readonly symbol: "LINK/USD:ETH";
        readonly baseAsset: "LINK";
        readonly quoteAsset: "USD";
        readonly settleAsset: "ETH";
        readonly maxLeverage: 50;
        readonly minOrderSize: 0.1;
        readonly tickSize: 0.001;
        readonly stepSize: 0.01;
        readonly chain: "arbitrum";
    };
    readonly 'DOGE/USD:ETH': {
        readonly marketAddress: "0x6853EA96FF216fAb11D2d930CE3C508556A4bdc4";
        readonly indexToken: "0xC4da4c24fd591125c3F47b340b6f4f76111883d8";
        readonly longToken: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
        readonly shortToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
        readonly symbol: "DOGE/USD:ETH";
        readonly baseAsset: "DOGE";
        readonly quoteAsset: "USD";
        readonly settleAsset: "ETH";
        readonly maxLeverage: 50;
        readonly minOrderSize: 10;
        readonly tickSize: 0.00001;
        readonly stepSize: 1;
        readonly chain: "arbitrum";
    };
    readonly 'XRP/USD:ETH': {
        readonly marketAddress: "0x0CCB4fAa6f1F1B30911619f1184082aB4E25813c";
        readonly indexToken: "0xc14e065b0067dE91534e032868f5Ac6ecf2c6868";
        readonly longToken: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
        readonly shortToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
        readonly symbol: "XRP/USD:ETH";
        readonly baseAsset: "XRP";
        readonly quoteAsset: "USD";
        readonly settleAsset: "ETH";
        readonly maxLeverage: 50;
        readonly minOrderSize: 1;
        readonly tickSize: 0.0001;
        readonly stepSize: 0.1;
        readonly chain: "arbitrum";
    };
    readonly 'LTC/USD:ETH': {
        readonly marketAddress: "0xD9535bB5f58A1a75032416F2dFe7880C30575a41";
        readonly indexToken: "0xB46A094Bc4B0adBD801E14b9DB95e05E28962764";
        readonly longToken: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
        readonly shortToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
        readonly symbol: "LTC/USD:ETH";
        readonly baseAsset: "LTC";
        readonly quoteAsset: "USD";
        readonly settleAsset: "ETH";
        readonly maxLeverage: 50;
        readonly minOrderSize: 0.01;
        readonly tickSize: 0.01;
        readonly stepSize: 0.001;
        readonly chain: "arbitrum";
    };
    readonly 'AVAX/USD:AVAX': {
        readonly marketAddress: "0xD996ff47A1F763E1e55415BC4437c59292D1F415";
        readonly indexToken: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7";
        readonly longToken: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7";
        readonly shortToken: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E";
        readonly symbol: "AVAX/USD:AVAX";
        readonly baseAsset: "AVAX";
        readonly quoteAsset: "USD";
        readonly settleAsset: "AVAX";
        readonly maxLeverage: 100;
        readonly minOrderSize: 0.1;
        readonly tickSize: 0.01;
        readonly stepSize: 0.01;
        readonly chain: "avalanche";
    };
    readonly 'ETH/USD:AVAX': {
        readonly marketAddress: "0xB7e69749E3d2EDd90ea59A4932EFEa2D41E245d7";
        readonly indexToken: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB";
        readonly longToken: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7";
        readonly shortToken: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E";
        readonly symbol: "ETH/USD:AVAX";
        readonly baseAsset: "ETH";
        readonly quoteAsset: "USD";
        readonly settleAsset: "AVAX";
        readonly maxLeverage: 100;
        readonly minOrderSize: 0.001;
        readonly tickSize: 0.01;
        readonly stepSize: 0.0001;
        readonly chain: "avalanche";
    };
    readonly 'BTC/USD:AVAX': {
        readonly marketAddress: "0xFb02132333A79C8B5Bd5b6BD5e895bE3936F97c0";
        readonly indexToken: "0x152b9d0FdC40C096757F570A51E494bd4b943E50";
        readonly longToken: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7";
        readonly shortToken: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E";
        readonly symbol: "BTC/USD:AVAX";
        readonly baseAsset: "BTC";
        readonly quoteAsset: "USD";
        readonly settleAsset: "AVAX";
        readonly maxLeverage: 100;
        readonly minOrderSize: 0.0001;
        readonly tickSize: 0.1;
        readonly stepSize: 0.00001;
        readonly chain: "avalanche";
    };
};
export type GMXMarketKey = keyof typeof GMX_MARKETS;
/**
 * Map from market address to symbol
 */
export declare const GMX_MARKET_ADDRESS_MAP: Record<string, GMXMarketKey>;
export declare const GMX_ORDER_TYPES: {
    readonly MARKET_INCREASE: 0;
    readonly MARKET_DECREASE: 1;
    readonly LIMIT_INCREASE: 2;
    readonly LIMIT_DECREASE: 3;
    readonly STOP_LOSS: 4;
    readonly LIQUIDATION: 5;
};
export declare const GMX_DECREASE_POSITION_SWAP_TYPES: {
    readonly NO_SWAP: 0;
    readonly SWAP_PNL_TOKEN_TO_COLLATERAL: 1;
    readonly SWAP_COLLATERAL_TO_PNL_TOKEN: 2;
};
/**
 * Convert unified symbol to GMX market key
 * @example "ETH/USD:ETH" -> "ETH/USD:ETH"
 * @example "BTC/USD" -> "BTC/USD:BTC"
 */
export declare function unifiedToGmx(symbol: string): GMXMarketKey | undefined;
/**
 * Convert GMX market to unified format
 */
export declare function gmxToUnified(marketKey: GMXMarketKey): string;
/**
 * Get market config by address
 */
export declare function getMarketByAddress(address: string): (typeof GMX_MARKETS)[GMXMarketKey] | undefined;
/**
 * Get base token from symbol
 */
export declare function getBaseToken(symbol: string): string;
/**
 * Get markets for a specific chain
 */
export declare function getMarketsForChain(chain: 'arbitrum' | 'avalanche'): (typeof GMX_MARKETS)[GMXMarketKey][];
export declare const GMX_FUNDING: {
    readonly calculationType: "continuous";
    readonly baseRateFactor: 1e-10;
};
export declare const GMX_CONTRACTS: {
    readonly arbitrum: {
        readonly exchangeRouter: "0x7C68C7866A64FA2160F78EEaE12217FFbf871fa8";
        readonly router: "0x7452c558d45f8afC8c83dAe62C3f8A5BE19c71f6";
        readonly dataStore: "0xFD70de6b91282D8017aA4E741e9Ae325CAb992d8";
        readonly reader: "0xf60becbba223EEA9495Da3f606753867eC10d139";
        readonly orderVault: "0x31eF83a530Fde1B38EE9A18093A333D8Bbbc40D5";
        readonly positionRouter: "0xb87a436B93fFE9D75c5cFA7bAcFff96430b09868";
    };
    readonly avalanche: {
        readonly exchangeRouter: "0x79be2F4eC8A4143BaF963206c6e0d8b3b8a74a38";
        readonly router: "0x820F5FfC5b525cD4d88Cd91aCd2119b38cB97b10";
        readonly dataStore: "0x2F0b22339414AcD8fc5b7F5a299fdF5A96E0DfB6";
        readonly reader: "0xdCf06A4A40579A5F4F53F3D57f2C2f145f404757";
        readonly orderVault: "0xD3D60D22d415aD43b7e64b510D86A30f19B1B12C";
        readonly positionRouter: "0xffF6D276Bc37c61A23f06410Dce4A400f66420f8";
    };
};
export declare const GMX_ERROR_MESSAGES: Record<string, string>;
//# sourceMappingURL=constants.d.ts.map