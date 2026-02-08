/**
 * Order Helpers
 *
 * Utility functions for creating common order types.
 * Provides CCXT-compatible convenience methods.
 */
/**
 * Create a limit buy order request
 *
 * @param symbol - Trading pair symbol
 * @param amount - Order amount
 * @param price - Limit price
 * @param params - Additional parameters
 * @returns OrderRequest
 */
export function createLimitBuyOrderRequest(symbol, amount, price, params) {
    return {
        symbol,
        type: 'limit',
        side: 'buy',
        amount,
        price,
        ...params,
    };
}
/**
 * Create a limit sell order request
 *
 * @param symbol - Trading pair symbol
 * @param amount - Order amount
 * @param price - Limit price
 * @param params - Additional parameters
 * @returns OrderRequest
 */
export function createLimitSellOrderRequest(symbol, amount, price, params) {
    return {
        symbol,
        type: 'limit',
        side: 'sell',
        amount,
        price,
        ...params,
    };
}
/**
 * Create a market buy order request
 *
 * @param symbol - Trading pair symbol
 * @param amount - Order amount
 * @param params - Additional parameters
 * @returns OrderRequest
 */
export function createMarketBuyOrderRequest(symbol, amount, params) {
    return {
        symbol,
        type: 'market',
        side: 'buy',
        amount,
        ...params,
    };
}
/**
 * Create a market sell order request
 *
 * @param symbol - Trading pair symbol
 * @param amount - Order amount
 * @param params - Additional parameters
 * @returns OrderRequest
 */
export function createMarketSellOrderRequest(symbol, amount, params) {
    return {
        symbol,
        type: 'market',
        side: 'sell',
        amount,
        ...params,
    };
}
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
export function createStopLossOrderRequest(symbol, amount, stopPrice, side = 'sell', params) {
    return {
        symbol,
        type: 'stopMarket',
        side,
        amount,
        stopPrice,
        reduceOnly: true,
        ...params,
    };
}
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
export function createTakeProfitOrderRequest(symbol, amount, takeProfitPrice, side = 'sell', params) {
    return {
        symbol,
        type: 'limit',
        side,
        amount,
        price: takeProfitPrice,
        reduceOnly: true,
        ...params,
    };
}
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
export function createStopLimitOrderRequest(symbol, amount, price, stopPrice, side, params) {
    return {
        symbol,
        type: 'stopLimit',
        side,
        amount,
        price,
        stopPrice,
        ...params,
    };
}
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
export function createTrailingStopOrderRequest(symbol, amount, trailingDelta, side = 'sell', params) {
    return {
        symbol,
        type: 'trailingStop',
        side,
        amount,
        reduceOnly: true,
        trailingDelta,
        ...params,
    };
}
/**
 * Validate an order request
 *
 * @param request - Order request to validate
 * @returns true if valid
 * @throws Error if invalid
 */
export function validateOrderRequest(request) {
    if (!request.symbol) {
        throw new Error('Order request must have a symbol');
    }
    if (!request.side || !['buy', 'sell'].includes(request.side)) {
        throw new Error('Order request must have a valid side (buy/sell)');
    }
    if (!request.type) {
        throw new Error('Order request must have a type');
    }
    if (typeof request.amount !== 'number' || request.amount <= 0) {
        throw new Error('Order request must have a positive amount');
    }
    if (request.type === 'limit' && (typeof request.price !== 'number' || request.price <= 0)) {
        throw new Error('Limit order must have a positive price');
    }
    if ((request.type === 'stopMarket' || request.type === 'stopLimit') &&
        (typeof request.stopPrice !== 'number' || request.stopPrice <= 0)) {
        throw new Error('Stop order must have a positive stop price');
    }
    return true;
}
//# sourceMappingURL=OrderHelpers.js.map