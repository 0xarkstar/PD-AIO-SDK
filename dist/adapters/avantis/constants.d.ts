/**
 * Avantis Exchange Constants
 *
 * On-chain perpetual DEX on Base chain using Pyth oracle price feeds.
 */
export declare const AVANTIS_CHAIN_ID_MAINNET = 8453;
export declare const AVANTIS_CHAIN_ID_TESTNET = 84532;
export declare const AVANTIS_RPC_MAINNET = "https://mainnet.base.org";
export declare const AVANTIS_RPC_TESTNET = "https://sepolia.base.org";
export declare const AVANTIS_API_URLS: {
    readonly socketApi: "https://socket-api-pub.avantisfi.com/socket-api/v1/data";
    readonly coreApi: "https://core.avantisfi.com";
    readonly feedV3: "https://feed-v3.avantisfi.com";
    readonly pythLazer: "https://pyth-lazer-proxy-3.dourolabs.app/v1/stream";
};
export declare const AVANTIS_CONTRACTS_MAINNET: {
    readonly trading: "0x44914408af82bC9983bbb330e3578E1105e11d4e";
    readonly storage: "0x8a311D7048c35985aa31C131B9A13e03a5f7422d";
    readonly pairInfo: "0x81F22d0Cc22977c91bEfE648C9fddf1f2bd977e5";
    readonly pairStorage: "0x5db3772136e5557EFE028Db05EE95C84D76faEC4";
    readonly pythOracle: "0x64e2625621970F8cfA17B294670d61CB883dA511";
    readonly multicall: "0xA7cFc43872F4D7B0E6141ee8c36f1F7FEe5d099e";
    readonly referral: "0x1A110bBA13A1f16cCa4b79758BD39290f29De82D";
    readonly usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
};
export declare const AVANTIS_CONTRACTS_TESTNET: {
    readonly trading: "0x0000000000000000000000000000000000000011";
    readonly storage: "0x0000000000000000000000000000000000000012";
    readonly pairInfo: "0x0000000000000000000000000000000000000013";
    readonly pairStorage: "0x0000000000000000000000000000000000000014";
    readonly pythOracle: "0x0000000000000000000000000000000000000015";
    readonly multicall: "0x0000000000000000000000000000000000000016";
    readonly referral: "0x0000000000000000000000000000000000000017";
    readonly usdc: "0x0000000000000000000000000000000000000018";
};
export declare const PYTH_PRICE_FEED_IDS: Record<string, string>;
export declare const AVANTIS_RATE_LIMIT: {
    maxRequests: number;
    windowMs: number;
    weights: {
        fetchMarkets: number;
        fetchTicker: number;
        fetchFundingRate: number;
        fetchPositions: number;
        fetchBalance: number;
        createOrder: number;
        cancelOrder: number;
    };
};
export declare const AVANTIS_ORDER_TYPES: {
    readonly MARKET: 0;
    readonly LIMIT: 1;
    readonly STOP_LIMIT: 2;
};
export declare const AVANTIS_FUNDING_INTERVAL_HOURS = 1;
export declare const AVANTIS_DEFAULT_PRECISION: {
    price: number;
    amount: number;
};
/**
 * Map of unified base symbols to Avantis pair indices.
 * Avantis uses numeric pairIndex values to identify markets.
 */
export declare const AVANTIS_PAIR_INDEX_MAP: Record<string, number>;
/**
 * Reverse map: pairIndex -> base symbol
 */
export declare const AVANTIS_INDEX_TO_SYMBOL: Record<number, string>;
/**
 * Convert unified symbol to Avantis pairIndex
 * @example "BTC/USD:USD" -> 0
 */
export declare function unifiedToAvantis(symbol: string): number;
/**
 * Convert Avantis pairIndex to unified symbol
 * @example 0 -> "BTC/USD:USD"
 */
export declare function avantisToUnified(pairIndex: number): string;
export declare const AVANTIS_TRADING_ABI: readonly ["function openTrade(tuple(address trader, uint256 pairIndex, uint256 index, uint256 initialPosToken, uint256 positionSizeDai, uint256 openPrice, bool buy, uint256 leverage, uint256 tp, uint256 sl) t, uint8 orderType, uint256 slippageP, bytes[] priceUpdateData) payable", "function closeTradeMarket(uint256 pairIndex, uint256 index, bytes[] priceUpdateData) payable", "function cancelOpenLimitOrder(uint256 pairIndex, uint256 index)"];
export declare const AVANTIS_STORAGE_ABI: readonly ["function openTrades(address trader, uint256 pairIndex, uint256 index) view returns (tuple(address trader, uint256 pairIndex, uint256 index, uint256 initialPosToken, uint256 positionSizeDai, uint256 openPrice, bool buy, uint256 leverage, uint256 tp, uint256 sl))", "function openTradesCount(address trader, uint256 pairIndex) view returns (uint256)", "function openLimitOrders(address trader, uint256 pairIndex, uint256 index) view returns (tuple(address trader, uint256 pairIndex, uint256 index, uint256 positionSize, bool buy, uint256 leverage, uint256 tp, uint256 sl, uint256 minPrice, uint256 maxPrice, uint256 block, uint256 tokenId))", "function openLimitOrdersCount(address trader, uint256 pairIndex) view returns (uint256)"];
export declare const AVANTIS_PAIR_INFO_ABI: readonly ["function pairs(uint256 index) view returns (tuple(string from, string to, uint256 spreadP, uint256 groupIndex, uint256 feeIndex))", "function pairsCount() view returns (uint256)", "function pairFundingFees(uint256 pairIndex) view returns (tuple(int256 accPerOiLong, int256 accPerOiShort, uint256 lastUpdateBlock))"];
export declare const AVANTIS_PYTH_ABI: readonly ["function getPrice(bytes32 id) view returns (tuple(int64 price, uint64 conf, int32 expo, uint256 publishTime))", "function getUpdateFee(bytes[] updateData) view returns (uint256)"];
export declare const AVANTIS_ERC20_ABI: readonly ["function balanceOf(address account) view returns (uint256)", "function decimals() view returns (uint8)", "function approve(address spender, uint256 amount) returns (bool)", "function allowance(address owner, address spender) view returns (uint256)"];
//# sourceMappingURL=constants.d.ts.map