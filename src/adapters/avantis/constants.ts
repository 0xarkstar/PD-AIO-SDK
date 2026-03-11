/**
 * Avantis Exchange Constants
 *
 * On-chain perpetual DEX on Base chain using Pyth oracle price feeds.
 */

// =============================================================================
// Chain Configuration
// =============================================================================

export const AVANTIS_CHAIN_ID_MAINNET = 8453; // Base mainnet
export const AVANTIS_CHAIN_ID_TESTNET = 84532; // Base Sepolia

// =============================================================================
// RPC URLs
// =============================================================================

export const AVANTIS_RPC_MAINNET = 'https://mainnet.base.org';
export const AVANTIS_RPC_TESTNET = 'https://sepolia.base.org';

// =============================================================================
// API Endpoints (REST + Socket)
// =============================================================================

export const AVANTIS_API_URLS = {
  socketApi: 'https://socket-api-pub.avantisfi.com/socket-api/v1/data',
  coreApi: 'https://core.avantisfi.com',
  feedV3: 'https://feed-v3.avantisfi.com',
  pythLazer: 'https://pyth-lazer-proxy-3.dourolabs.app/v1/stream',
} as const;

// =============================================================================
// Contract Addresses (Base Mainnet — from Avantis Trader SDK config.py)
// =============================================================================

export const AVANTIS_CONTRACTS_MAINNET = {
  trading: '0x44914408af82bC9983bbb330e3578E1105e11d4e',
  storage: '0x8a311D7048c35985aa31C131B9A13e03a5f7422d',
  pairInfo: '0x81F22d0Cc22977c91bEfE648C9fddf1f2bd977e5',
  pairStorage: '0x5db3772136e5557EFE028Db05EE95C84D76faEC4',
  pythOracle: '0x64e2625621970F8cfA17B294670d61CB883dA511',
  multicall: '0xA7cFc43872F4D7B0E6141ee8c36f1F7FEe5d099e',
  referral: '0x1A110bBA13A1f16cCa4b79758BD39290f29De82D',
  usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
} as const;

export const AVANTIS_CONTRACTS_TESTNET = {
  trading: '0x0000000000000000000000000000000000000011',
  storage: '0x0000000000000000000000000000000000000012',
  pairInfo: '0x0000000000000000000000000000000000000013',
  pairStorage: '0x0000000000000000000000000000000000000014',
  pythOracle: '0x0000000000000000000000000000000000000015',
  multicall: '0x0000000000000000000000000000000000000016',
  referral: '0x0000000000000000000000000000000000000017',
  usdc: '0x0000000000000000000000000000000000000018',
} as const;

// =============================================================================
// Pyth Price Feed IDs (mainnet)
// =============================================================================

export const PYTH_PRICE_FEED_IDS: Record<string, string> = {
  BTC: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  ETH: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  SOL: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  DOGE: '0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c',
  AVAX: '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1571f7d0b26ee',
  LINK: '0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221',
  ARB: '0x3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5',
  OP: '0x385f64d993f7b77d8182ed5003d97c60aa3361f3cecfe711544d2d59165e9bdf',
};

// =============================================================================
// Rate Limits (on-chain, so these are gas/block limits)
// =============================================================================

export const AVANTIS_RATE_LIMIT = {
  maxRequests: 100,
  windowMs: 60000,
  weights: {
    fetchMarkets: 1,
    fetchTicker: 1,
    fetchFundingRate: 1,
    fetchPositions: 2,
    fetchBalance: 1,
    createOrder: 5,
    cancelOrder: 3,
  },
};

// =============================================================================
// Trading Constants
// =============================================================================

export const AVANTIS_ORDER_TYPES = {
  MARKET: 0,
  LIMIT: 1,
  STOP_LIMIT: 2,
} as const;

export const AVANTIS_FUNDING_INTERVAL_HOURS = 1;

export const AVANTIS_DEFAULT_PRECISION = {
  price: 8,
  amount: 6,
};

// =============================================================================
// Symbol Mapping
// =============================================================================

/**
 * Map of unified base symbols to Avantis pair indices.
 * Avantis uses numeric pairIndex values to identify markets.
 */
export const AVANTIS_PAIR_INDEX_MAP: Record<string, number> = {
  BTC: 0,
  ETH: 1,
  SOL: 2,
  DOGE: 3,
  AVAX: 4,
  LINK: 5,
  ARB: 6,
  OP: 7,
};

/**
 * Reverse map: pairIndex -> base symbol
 */
export const AVANTIS_INDEX_TO_SYMBOL: Record<number, string> = Object.fromEntries(
  Object.entries(AVANTIS_PAIR_INDEX_MAP).map(([symbol, index]) => [index, symbol])
);

/**
 * Convert unified symbol to Avantis pairIndex
 * @example "BTC/USD:USD" -> 0
 */
export function unifiedToAvantis(symbol: string): number {
  const parts = symbol.split('/');
  const base = parts[0] ?? '';
  const pairIndex = AVANTIS_PAIR_INDEX_MAP[base];
  if (pairIndex === undefined) {
    throw new Error(`Unsupported Avantis symbol: ${symbol}`);
  }
  return pairIndex;
}

/**
 * Convert Avantis pairIndex to unified symbol
 * @example 0 -> "BTC/USD:USD"
 */
export function avantisToUnified(pairIndex: number): string {
  const base = AVANTIS_INDEX_TO_SYMBOL[pairIndex];
  if (!base) {
    throw new Error(`Unknown Avantis pairIndex: ${pairIndex}`);
  }
  return `${base}/USD:USD`;
}

// =============================================================================
// Contract ABIs (minimal function signatures)
// =============================================================================

export const AVANTIS_TRADING_ABI = [
  'function openTrade(tuple(address trader, uint256 pairIndex, uint256 index, uint256 initialPosToken, uint256 positionSizeDai, uint256 openPrice, bool buy, uint256 leverage, uint256 tp, uint256 sl) t, uint8 orderType, uint256 slippageP, bytes[] priceUpdateData) payable',
  'function closeTradeMarket(uint256 pairIndex, uint256 index, bytes[] priceUpdateData) payable',
  'function cancelOpenLimitOrder(uint256 pairIndex, uint256 index)',
] as const;

export const AVANTIS_STORAGE_ABI = [
  'function openTrades(address trader, uint256 pairIndex, uint256 index) view returns (tuple(address trader, uint256 pairIndex, uint256 index, uint256 initialPosToken, uint256 positionSizeDai, uint256 openPrice, bool buy, uint256 leverage, uint256 tp, uint256 sl))',
  'function openTradesCount(address trader, uint256 pairIndex) view returns (uint256)',
  'function openLimitOrders(address trader, uint256 pairIndex, uint256 index) view returns (tuple(address trader, uint256 pairIndex, uint256 index, uint256 positionSize, bool buy, uint256 leverage, uint256 tp, uint256 sl, uint256 minPrice, uint256 maxPrice, uint256 block, uint256 tokenId))',
  'function openLimitOrdersCount(address trader, uint256 pairIndex) view returns (uint256)',
] as const;

export const AVANTIS_PAIR_INFO_ABI = [
  'function pairs(uint256 index) view returns (tuple(string from, string to, uint256 spreadP, uint256 groupIndex, uint256 feeIndex))',
  'function pairsCount() view returns (uint256)',
  'function pairFundingFees(uint256 pairIndex) view returns (tuple(int256 accPerOiLong, int256 accPerOiShort, uint256 lastUpdateBlock))',
] as const;

export const AVANTIS_PYTH_ABI = [
  'function getPrice(bytes32 id) view returns (tuple(int64 price, uint64 conf, int32 expo, uint256 publishTime))',
  'function getUpdateFee(bytes[] updateData) view returns (uint256)',
] as const;

export const AVANTIS_ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
] as const;
