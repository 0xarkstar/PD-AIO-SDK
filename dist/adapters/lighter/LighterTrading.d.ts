/**
 * Lighter Trading Helper Functions
 *
 * Extracted from LighterAdapter to reduce file size.
 * Contains WASM and HMAC order creation, cancellation, and collateral management.
 */
import type { Order, OrderRequest } from '../../types/common.js';
import type { LighterNormalizer } from './LighterNormalizer.js';
import type { LighterWasmSigner } from './signer/index.js';
import type { NonceManager } from './NonceManager.js';
/** Market metadata required for order building */
export interface MarketMetadata {
    baseDecimals: number;
    quoteDecimals: number;
    tickSize: number;
    stepSize: number;
}
/** Dependencies injected from the adapter */
export interface TradingDeps {
    normalizer: LighterNormalizer;
    signer: LighterWasmSigner | null;
    nonceManager: NonceManager | null;
    apiKey?: string;
    apiSecret?: string;
    marketIdCache: Map<string, number>;
    marketMetadataCache: Map<string, MarketMetadata>;
    fetchMarkets: () => Promise<unknown>;
    request: <T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: Record<string, unknown>) => Promise<T>;
    handleTransactionError: (code: number) => Promise<void>;
}
/**
 * Create order using WASM signing
 */
export declare function createOrderWasm(deps: TradingDeps, request: OrderRequest): Promise<Order>;
/**
 * Create order using HMAC signing (legacy)
 */
export declare function createOrderHMAC(deps: TradingDeps, request: OrderRequest): Promise<Order>;
/**
 * Cancel order using WASM signing
 */
export declare function cancelOrderWasm(deps: TradingDeps, orderId: string, symbol?: string): Promise<Order>;
/**
 * Cancel order using HMAC signing (legacy)
 */
export declare function cancelOrderHMAC(deps: TradingDeps, orderId: string): Promise<Order>;
/**
 * Cancel all orders using WASM signing
 */
export declare function cancelAllOrdersWasm(deps: TradingDeps, symbol?: string): Promise<Order[]>;
/**
 * Cancel all orders using HMAC signing (legacy)
 */
export declare function cancelAllOrdersHMAC(deps: TradingDeps, symbol?: string): Promise<Order[]>;
/**
 * Withdraw collateral from trading account
 *
 * Requires WASM signing - HMAC mode does not support withdrawals.
 */
export declare function withdrawCollateral(deps: TradingDeps, collateralIndex: number, amount: bigint, destinationAddress: string): Promise<string>;
//# sourceMappingURL=LighterTrading.d.ts.map