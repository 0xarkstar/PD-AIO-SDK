/**
 * Drift Protocol Order Builder
 *
 * Builds order parameters for Drift Protocol trading.
 * Converts unified order requests to Drift SDK format.
 */
import type { OrderRequest } from '../../types/index.js';
import { DRIFT_PERP_MARKETS } from './constants.js';
import type { DriftOrderParams } from './DriftClientWrapper.js';
/**
 * Order builder configuration
 */
export interface DriftOrderBuilderConfig {
    /** Default sub-account ID */
    subAccountId?: number;
    /** Slippage tolerance for market orders (default: 0.01 = 1%) */
    slippageTolerance?: number;
    /** Auction duration for limit orders (default: 60 slots) */
    auctionDuration?: number;
    /** Builder code index (Drift DBC) */
    builderIdx?: number;
    /** Builder fee in basis points */
    builderFee?: number;
}
/**
 * Builds order parameters for Drift Protocol
 */
export declare class DriftOrderBuilder {
    private readonly config;
    constructor(config?: DriftOrderBuilderConfig);
    /**
     * Build order parameters from a unified OrderRequest
     */
    buildOrderParams(request: OrderRequest, oraclePrice?: number): DriftOrderParams;
    /**
     * Build parameters for closing a position
     */
    buildClosePositionParams(symbol: string, size: number, isLong: boolean, oraclePrice?: number): DriftOrderParams;
    /**
     * Validate order parameters
     */
    private validateOrder;
    /**
     * Map unified order type to Drift order type
     */
    private mapOrderType;
    /**
     * Get direction based on side and reduce-only flag
     */
    private getDirection;
    /**
     * Calculate required margin for an order
     */
    calculateRequiredMargin(symbol: string, amount: number, price: number, leverage?: number): {
        margin: number;
        leverage: number;
    };
    /**
     * Calculate liquidation price for a position
     */
    calculateLiquidationPrice(symbol: string, entryPrice: number, leverage: number, isLong: boolean): number;
    /**
     * Get market configuration
     */
    getMarketConfig(symbol: string): (typeof DRIFT_PERP_MARKETS)[keyof typeof DRIFT_PERP_MARKETS] | undefined;
    /**
     * Get market index from symbol
     */
    getMarketIndex(symbol: string): number;
    /**
     * Round amount to step size
     */
    roundToStepSize(amount: number, symbol: string): number;
    /**
     * Round price to tick size
     */
    roundToTickSize(price: number, symbol: string): number;
}
/**
 * Create a default order builder instance
 */
export declare function createOrderBuilder(config?: DriftOrderBuilderConfig): DriftOrderBuilder;
//# sourceMappingURL=orderBuilder.d.ts.map