/**
 * GMX v2 Order Builder
 *
 * Builds order parameters for GMX v2 ExchangeRouter contract.
 */
import type { OrderRequest } from '../../types/index.js';
import { GMX_MARKETS, type GMXMarketKey } from './constants.js';
import type { GmxChain } from './GmxAdapter.js';
import type { GmxAuth } from './GmxAuth.js';
import type { GmxContracts } from './GmxContracts.js';
import type { GmxCreateOrderParams } from './types.js';
/**
 * Price data for order calculations
 */
export interface GmxPriceData {
    indexPrice: number;
    longTokenPrice: number;
    shortTokenPrice: number;
}
/**
 * Order builder configuration
 */
export interface OrderBuilderConfig {
    /** Acceptable price slippage (default: 0.003 = 0.3%) */
    slippageTolerance?: number;
    /** Callback gas limit for keepers (default: 0) */
    callbackGasLimit?: bigint;
    /** Referral code (optional) */
    referralCode?: string;
}
/**
 * Builds order parameters for GMX v2 contracts
 */
export declare class GmxOrderBuilder {
    private readonly chain;
    private readonly auth;
    private readonly config;
    constructor(chain: GmxChain, auth: GmxAuth, _contracts: GmxContracts, config?: OrderBuilderConfig);
    /**
     * Build create order parameters for a new position or position increase
     */
    buildCreateOrderParams(request: OrderRequest, prices: GmxPriceData): GmxCreateOrderParams;
    /**
     * Build parameters for closing a position
     */
    buildClosePositionParams(symbol: string, sizeUsd: number, isLong: boolean, prices: GmxPriceData): GmxCreateOrderParams;
    /**
     * Calculate execution fee for order
     */
    calculateExecutionFee(): Promise<bigint>;
    /**
     * Calculate minimum execution fee based on current network conditions
     */
    getMinExecutionFee(): Promise<bigint>;
    /**
     * Get GMX order type based on request type
     */
    private getOrderType;
    /**
     * Calculate acceptable price with slippage
     */
    private calculateAcceptablePrice;
    /**
     * Calculate trigger price for limit/stop orders
     */
    private calculateTriggerPrice;
    /**
     * Validate order parameters
     */
    validateOrderParams(request: OrderRequest): void;
    /**
     * Get market configuration
     */
    getMarketConfig(symbol: string): (typeof GMX_MARKETS)[GMXMarketKey];
    /**
     * Calculate required collateral for a position
     */
    calculateRequiredCollateral(sizeUsd: number, leverage: number, _isLong: boolean): {
        collateralUsd: number;
        collateralToken: string;
    };
    /**
     * Calculate position's liquidation price
     */
    calculateLiquidationPrice(entryPrice: number, leverage: number, isLong: boolean, maintenanceMarginRate?: number): number;
}
//# sourceMappingURL=GmxOrderBuilder.d.ts.map