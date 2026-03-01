/**
 * Ostium Constants
 */
export const OSTIUM_METADATA_URL = 'https://metadata-backend.ostium.io';
export const OSTIUM_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/ostium-labs/ostium-arbitrum';
export const OSTIUM_RPC_URLS = {
    mainnet: 'https://arb1.arbitrum.io/rpc',
    testnet: 'https://sepolia-rollup.arbitrum.io/rpc',
};
/**
 * Ostium contract addresses on Arbitrum One.
 *
 * WARNING: pairInfo, nftRewards, vault are PLACEHOLDER addresses and must be replaced
 * with actual deployed contract addresses before on-chain usage.
 *
 * Verified addresses:
 * - trading: 0x6d0ba1f9996dbd8885827e1b2e8f6593e7702411 (verified via Arbiscan)
 * - storage: 0xcCd5891083A8acD2074690F65d3024E7D13d66E7 (verified via Arbiscan)
 * - collateral: USDC on Arbitrum One (verified)
 *
 * @see https://arbiscan.io for address verification
 * @see https://github.com/0xOstium/smart-contracts-public
 */
export const OSTIUM_CONTRACTS = {
    trading: '0x6d0ba1f9996dbd8885827e1b2e8f6593e7702411', // Verified
    storage: '0xcCd5891083A8acD2074690F65d3024E7D13d66E7', // Verified
    pairInfo: '0x3D9B5C7E8F0A4D6E9C3B2A1F8D7E6C5B4A3F21e', // PLACEHOLDER
    nftRewards: '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0b', // PLACEHOLDER
    vault: '0x8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7a', // PLACEHOLDER
    collateral: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC (verified)
};
/**
 * Known placeholder addresses that must be replaced before production use
 */
const PLACEHOLDER_ADDRESSES = new Set([
    '0x3D9B5C7E8F0A4D6E9C3B2A1F8D7E6C5B4A3F21e', // pairInfo
    '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0b', // nftRewards
    '0x8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7a', // vault
]);
/**
 * Check if an address is a known placeholder
 */
export function isPlaceholderAddress(address) {
    return PLACEHOLDER_ADDRESSES.has(address.toLowerCase());
}
/**
 * Validate Ostium contract addresses, throwing error if placeholders are detected
 */
export function validateContractAddresses(contracts) {
    const placeholders = [];
    if (isPlaceholderAddress(contracts.pairInfo)) {
        placeholders.push('pairInfo');
    }
    if (isPlaceholderAddress(contracts.nftRewards)) {
        placeholders.push('nftRewards');
    }
    if (isPlaceholderAddress(contracts.vault)) {
        placeholders.push('vault');
    }
    if (placeholders.length > 0) {
        throw new Error(`Ostium contract addresses are placeholders for: ${placeholders.join(', ')}. ` +
            'Set real addresses before on-chain operations. ' +
            'See https://github.com/0xOstium/smart-contracts-public for deployment info.');
    }
}
export const OSTIUM_RATE_LIMITS = {
    metadata: {
        maxRequests: 300,
        windowMs: 60000,
    },
    subgraph: {
        maxRequests: 100,
        windowMs: 60000,
    },
};
export const OSTIUM_ENDPOINT_WEIGHTS = {
    fetchMarkets: 5,
    fetchTicker: 1,
    fetchTrades: 3,
    fetchFundingRate: 2,
    createOrder: 10,
    cancelOrder: 10,
    fetchPositions: 3,
    fetchBalance: 2,
    setLeverage: 1,
};
export const OSTIUM_GROUP_NAMES = {
    0: 'Crypto',
    1: 'Forex',
    2: 'Stocks',
    3: 'Commodities',
    4: 'Indices',
};
export const OSTIUM_PAIRS = [
    {
        pairIndex: 0,
        name: 'BTC/USD',
        from: 'BTC',
        to: 'USD',
        groupIndex: 0,
        groupName: 'Crypto',
        spreadP: '0.05',
        maxLeverage: 150,
        minLeverage: 2,
        maxPositionSize: '1000000',
        minPositionSize: '100',
        feedId: '',
    },
    {
        pairIndex: 1,
        name: 'ETH/USD',
        from: 'ETH',
        to: 'USD',
        groupIndex: 0,
        groupName: 'Crypto',
        spreadP: '0.05',
        maxLeverage: 100,
        minLeverage: 2,
        maxPositionSize: '500000',
        minPositionSize: '100',
        feedId: '',
    },
    {
        pairIndex: 2,
        name: 'AAPL/USD',
        from: 'AAPL',
        to: 'USD',
        groupIndex: 2,
        groupName: 'Stocks',
        spreadP: '0.1',
        maxLeverage: 50,
        minLeverage: 2,
        maxPositionSize: '200000',
        minPositionSize: '50',
        feedId: '',
    },
    {
        pairIndex: 3,
        name: 'TSLA/USD',
        from: 'TSLA',
        to: 'USD',
        groupIndex: 2,
        groupName: 'Stocks',
        spreadP: '0.1',
        maxLeverage: 50,
        minLeverage: 2,
        maxPositionSize: '200000',
        minPositionSize: '50',
        feedId: '',
    },
    {
        pairIndex: 4,
        name: 'NVDA/USD',
        from: 'NVDA',
        to: 'USD',
        groupIndex: 2,
        groupName: 'Stocks',
        spreadP: '0.1',
        maxLeverage: 50,
        minLeverage: 2,
        maxPositionSize: '200000',
        minPositionSize: '50',
        feedId: '',
    },
    {
        pairIndex: 5,
        name: 'EUR/USD',
        from: 'EUR',
        to: 'USD',
        groupIndex: 1,
        groupName: 'Forex',
        spreadP: '0.01',
        maxLeverage: 250,
        minLeverage: 2,
        maxPositionSize: '1000000',
        minPositionSize: '100',
        feedId: '',
    },
    {
        pairIndex: 6,
        name: 'GBP/USD',
        from: 'GBP',
        to: 'USD',
        groupIndex: 1,
        groupName: 'Forex',
        spreadP: '0.01',
        maxLeverage: 250,
        minLeverage: 2,
        maxPositionSize: '1000000',
        minPositionSize: '100',
        feedId: '',
    },
    {
        pairIndex: 7,
        name: 'XAU/USD',
        from: 'XAU',
        to: 'USD',
        groupIndex: 3,
        groupName: 'Commodities',
        spreadP: '0.05',
        maxLeverage: 100,
        minLeverage: 2,
        maxPositionSize: '500000',
        minPositionSize: '50',
        feedId: '',
    },
    {
        pairIndex: 8,
        name: 'CL/USD',
        from: 'CL',
        to: 'USD',
        groupIndex: 3,
        groupName: 'Commodities',
        spreadP: '0.05',
        maxLeverage: 100,
        minLeverage: 2,
        maxPositionSize: '500000',
        minPositionSize: '50',
        feedId: '',
    },
    {
        pairIndex: 9,
        name: 'SPX/USD',
        from: 'SPX',
        to: 'USD',
        groupIndex: 4,
        groupName: 'Indices',
        spreadP: '0.02',
        maxLeverage: 100,
        minLeverage: 2,
        maxPositionSize: '500000',
        minPositionSize: '50',
        feedId: '',
    },
    {
        pairIndex: 10,
        name: 'NDX/USD',
        from: 'NDX',
        to: 'USD',
        groupIndex: 4,
        groupName: 'Indices',
        spreadP: '0.02',
        maxLeverage: 100,
        minLeverage: 2,
        maxPositionSize: '500000',
        minPositionSize: '50',
        feedId: '',
    },
];
export const OSTIUM_TRADING_ABI = [
    'function openTrade(tuple(address trader, uint256 pairIndex, uint256 index, uint256 positionSizeDai, uint256 openPrice, bool buy, uint256 leverage, uint256 tp, uint256 sl) t, uint8 orderType, uint256 slippageP, address referral) external',
    'function closeTradeMarket(uint256 pairIndex, uint256 index) external',
    'function cancelOpenLimitOrder(uint256 pairIndex, uint256 index) external',
    'function updateTp(uint256 pairIndex, uint256 index, uint256 newTp) external',
    'function updateSl(uint256 pairIndex, uint256 index, uint256 newSl) external',
];
export const OSTIUM_STORAGE_ABI = [
    'function openTrades(address trader, uint256 pairIndex, uint256 index) view returns (tuple(address trader, uint256 pairIndex, uint256 index, uint256 positionSizeDai, uint256 openPrice, bool buy, uint256 leverage, uint256 tp, uint256 sl))',
    'function openTradesCount(address trader, uint256 pairIndex) view returns (uint256)',
    'function getOpenLimitOrders(address trader) view returns (tuple(address trader, uint256 pairIndex, uint256 index, uint256 positionSize, bool buy, uint256 leverage, uint256 tp, uint256 sl, uint256 minPrice, uint256 maxPrice, uint256 block, uint256 tokenId)[])',
];
export const OSTIUM_VAULT_ABI = ['function balanceOf(address account) view returns (uint256)'];
export const OSTIUM_COLLATERAL_ABI = [
    'function balanceOf(address account) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function decimals() view returns (uint8)',
];
export const OSTIUM_COLLATERAL_DECIMALS = 6;
export const OSTIUM_PRICE_DECIMALS = 10;
//# sourceMappingURL=constants.js.map