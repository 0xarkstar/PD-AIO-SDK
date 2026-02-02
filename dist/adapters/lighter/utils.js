/**
 * Lighter Utility Functions
 *
 * Helper functions for order conversion and error mapping.
 * Normalization functions have been moved to LighterNormalizer.ts
 */
import { PerpDEXError, RateLimitError, InsufficientMarginError, InvalidOrderError, OrderNotFoundError, InvalidSignatureError, ExchangeUnavailableError } from '../../types/errors.js';
/**
 * Convert unified order request to Lighter format
 */
export function convertOrderRequest(request, lighterSymbol) {
    const order = {
        symbol: lighterSymbol,
        side: request.side,
        type: request.type,
        quantity: request.amount,
    };
    if (request.price !== undefined) {
        order.price = request.price;
    }
    if (request.clientOrderId) {
        order.clientOrderId = request.clientOrderId;
    }
    if (request.reduceOnly) {
        order.reduceOnly = true;
    }
    if (request.postOnly) {
        order.timeInForce = 'PO'; // Post-only
    }
    else if (request.timeInForce) {
        order.timeInForce = request.timeInForce;
    }
    return order;
}
/**
 * Map Lighter errors to unified error types
 */
export function mapError(error) {
    if (error instanceof PerpDEXError) {
        return error;
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorLower = errorMessage.toLowerCase();
    const originalError = error instanceof Error ? error : undefined;
    // Rate limit errors
    if (errorLower.includes('rate limit') || errorLower.includes('too many requests')) {
        return new RateLimitError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 'lighter', undefined, originalError);
    }
    // Insufficient margin
    if (errorLower.includes('insufficient') &&
        (errorLower.includes('margin') || errorLower.includes('balance'))) {
        return new InsufficientMarginError('Insufficient margin for order', 'INSUFFICIENT_MARGIN', 'lighter', originalError);
    }
    // Invalid order errors
    if (errorLower.includes('invalid order') ||
        errorLower.includes('order size') ||
        errorLower.includes('price')) {
        return new InvalidOrderError('Invalid order parameters', 'INVALID_ORDER', 'lighter', originalError);
    }
    // Order not found
    if (errorLower.includes('not found') && errorLower.includes('order')) {
        return new OrderNotFoundError('Order not found', 'ORDER_NOT_FOUND', 'lighter', originalError);
    }
    // Authentication errors
    if (errorLower.includes('unauthorized') ||
        errorLower.includes('authentication') ||
        errorLower.includes('invalid signature')) {
        return new InvalidSignatureError('Authentication failed', 'INVALID_SIGNATURE', 'lighter', originalError);
    }
    // Exchange unavailable
    if (errorLower.includes('unavailable') ||
        errorLower.includes('maintenance') ||
        errorLower.includes('offline')) {
        return new ExchangeUnavailableError('Exchange temporarily unavailable', 'EXCHANGE_UNAVAILABLE', 'lighter', originalError);
    }
    // Generic error
    return new PerpDEXError(errorMessage, 'UNKNOWN_ERROR', 'lighter', originalError);
}
//# sourceMappingURL=utils.js.map