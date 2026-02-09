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
export declare const OSTIUM_CONTRACTS: OstiumContractAddresses;
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