/**
 * Order Helpers
 *
 * Utility functions for creating common order types.
 * Provides CCXT-compatible convenience methods.
 */
import type { OrderRequest, OrderSide } from '../../types/common.js';
/**
 * Create a limit buy order request
 *
 * @param symbol - Trading pair symbol
 * @param amount - Order amount
 * @param price - Limit price
 * @param params - Additional parameters
 * @returns OrderRequest
 */
export declare function createLimitBuyOrderRequest(symbol: string, amount: number, price: number, params?: Record<string, unknown>): OrderRequest;
/**
 * Create a limit sell order request
 *
 * @param symbol - Trading pair symbol
 * @param amount - Order amount
 * @param price - Limit price
 * @param params - Additional parameters
 * @returns OrderRequest
 */
export declare function createLimitSellOrderRequest(symbol: string, amount: number, price: number, params?: Record<string, unknown>): OrderRequest;
/**
 * Create a market buy order request
 *
 * @param symbol - Trading pair symbol
 * @param amount - Order amount
 * @param params - Additional parameters
 * @returns OrderRequest
 */
export declare function createMarketBuyOrderRequest(symbol: string, amount: number, params?: Record<string, unknown>): OrderRequest;
/**
 * Create a market sell order request
 *
 * @param symbol - Trading pair symbol
 * @param amount - Order amount
 * @param params - Additional parameters
 * @returns OrderRequest
 */
export declare function createMarketSellOrderRequest(symbol: string, amount: number, params?: Record<string, unknown>): OrderRequest;
/**
 * Create a stop loss order request
 *
 * @param symbol - Trading pair symbol
 * @param amount - Order amount
 * @param stopPrice - Stop trigger price
 * @param side - Order side (defaults to 'sell' for stop loss)
 * @param params - Additional parameters
 * @returns OrderRequest
 */
export declare function createStopLossOrderRequest(symbol: string, amount: number, stopPrice: number, side?: OrderSide, params?: Record<string, unknown>): OrderRequest;
/**
 * Create a take profit order request
 *
 * @param symbol - Trading pair symbol
 * @param amount - Order amount
 * @param takeProfitPrice - Take profit price
 * @param side - Order side (defaults to 'sell' for take profit)
 * @param params - Additional parameters
 * @returns OrderRequest
 */
export declare function createTakeProfitOrderRequest(symbol: string, amount: number, takeProfitPrice: number, side?: OrderSide, params?: Record<string, unknown>): OrderRequest;
/**
 * Create a stop limit order request
 *
 * @param symbol - Trading pair symbol
 * @param amount - Order amount
 * @param price - Limit price
 * @param stopPrice - Stop trigger price
 * @param side - Order side
 * @param params - Additional parameters
 * @returns OrderRequest
 */
export declare function createStopLimitOrderRequest(symbol: string, amount: number, price: number, stopPrice: number, side: OrderSide, params?: Record<string, unknown>): OrderRequest;
/**
 * Create a trailing stop order request
 *
 * @param symbol - Trading pair symbol
 * @param amount - Order amount
 * @param trailingDelta - Trailing distance (percentage or absolute)
 * @param side - Order side
 * @param params - Additional parameters
 * @returns OrderRequest
 */
export declare function createTrailingStopOrderRequest(symbol: string, amount: number, trailingDelta: number, side?: OrderSide, params?: Record<string, unknown>): OrderRequest;
/**
 * Validate an order request
 *
 * @param request - Order request to validate
 * @returns true if valid
 * @throws Error if invalid
 */
export declare function validateOrderRequest(request: OrderRequest): boolean;
//# sourceMappingURL=OrderHelpers.d.ts.map