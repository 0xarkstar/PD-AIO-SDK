/**
 * Ostium Constants
 */
import type { OstiumContractAddresses, OstiumPairInfo } from './types.js';
export declare const OSTIUM_METADATA_URL = "https://metadata-backend.ostium.io";
export declare const OSTIUM_SUBGRAPH_URL = "https://api.thegraph.com/subgraphs/name/ostium-labs/ostium-arbitrum";
export declare const OSTIUM_RPC_URLS: {
    mainnet: string;
    testnet: string;
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
export declare const OSTIUM_CONTRACTS: OstiumContractAddresses;
/**
 * Check if an address is a known placeholder
 */
export declare function isPlaceholderAddress(address: string): boolean;
/**
 * Validate Ostium contract addresses, throwing error if placeholders are detected
 */
export declare function validateContractAddresses(contracts: OstiumContractAddresses): void;
export declare const OSTIUM_RATE_LIMITS: {
    metadata: {
        maxRequests: number;
        windowMs: number;
    };
    subgraph: {
        maxRequests: number;
        windowMs: number;
    };
};
export declare const OSTIUM_ENDPOINT_WEIGHTS: Record<string, number>;
export declare const OSTIUM_GROUP_NAMES: Record<number, string>;
export declare const OSTIUM_PAIRS: OstiumPairInfo[];
export declare const OSTIUM_TRADING_ABI: string[];
export declare const OSTIUM_STORAGE_ABI: string[];
export declare const OSTIUM_VAULT_ABI: string[];
export declare const OSTIUM_COLLATERAL_ABI: string[];
export declare const OSTIUM_COLLATERAL_DECIMALS = 6;
export declare const OSTIUM_PRICE_DECIMALS = 10;
//# sourceMappingURL=constants.d.ts.map