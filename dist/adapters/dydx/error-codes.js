/**
 * dYdX v4 Error Code Mappings
 *
 * Maps dYdX-specific error messages to standardized error types
 */
import { ExchangeUnavailableError, InsufficientMarginError, InvalidOrderError, InvalidSignatureError, OrderNotFoundError, PerpDEXError, PositionNotFoundError, RateLimitError, InvalidSymbolError, } from '../../types/errors.js';
import { DYDX_ERROR_MESSAGES } from './constants.js';
/**
 * Map dYdX API errors to unified PerpDEX error types
 *
 * @param error - Error from dYdX API
 * @returns Unified PerpDEXError
 */
export function mapDydxError(error) {
    if (error instanceof PerpDEXError) {
        return error;
    }
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        // Check known error patterns
        for (const [pattern, code] of Object.entries(DYDX_ERROR_MESSAGES)) {
            if (message.includes(pattern)) {
                switch (code) {
                    case 'INSUFFICIENT_MARGIN':
                        return new InsufficientMarginError(error.message, code, 'dydx', error);
                    case 'INVALID_SIGNATURE':
                        return new InvalidSignatureError(error.message, code, 'dydx', error);
                    case 'ORDER_WOULD_MATCH':
                        return new InvalidOrderError(error.message, code, 'dydx', error);
                    case 'POSITION_NOT_FOUND':
                        return new PositionNotFoundError(error.message, code, 'dydx', error);
                    case 'ORDER_NOT_FOUND':
                        return new OrderNotFoundError(error.message, code, 'dydx', error);
                    case 'RATE_LIMIT_EXCEEDED':
                        return new RateLimitError(error.message, code, 'dydx', undefined, error);
                    case 'INVALID_ORDER_SIZE':
                        return new InvalidOrderError(error.message, code, 'dydx', error);
                    case 'PRICE_OUT_OF_BOUNDS':
                        return new InvalidOrderError(error.message, code, 'dydx', error);
                    case 'MARKET_NOT_FOUND':
                        return new InvalidSymbolError(error.message, code, 'dydx', error);
                    case 'SUBACCOUNT_NOT_FOUND':
                        return new PerpDEXError(error.message, code, 'dydx', error);
                    case 'UNAUTHORIZED':
                        return new InvalidSignatureError(error.message, code, 'dydx', error);
                }
            }
        }
        // HTTP status code errors
        if (message.includes('429')) {
            return new RateLimitError('Rate limit exceeded', 'RATE_LIMIT', 'dydx', undefined, error);
        }
        if (message.includes('503') || message.includes('502') || message.includes('504')) {
            return new ExchangeUnavailableError('Exchange temporarily unavailable', 'EXCHANGE_DOWN', 'dydx', error);
        }
        if (message.includes('401') || message.includes('403')) {
            return new InvalidSignatureError('Authentication failed', 'UNAUTHORIZED', 'dydx', error);
        }
        if (message.includes('404')) {
            return new PerpDEXError('Resource not found', 'NOT_FOUND', 'dydx', error);
        }
        if (message.includes('400')) {
            return new InvalidOrderError('Bad request', 'BAD_REQUEST', 'dydx', error);
        }
    }
    // Default to generic exchange error
    return new ExchangeUnavailableError('Unknown exchange error', 'UNKNOWN_ERROR', 'dydx', error);
}
/**
 * Standard dYdX error codes for reference
 */
export const DydxErrorCodes = {
    // Trading errors
    INSUFFICIENT_MARGIN: 'INSUFFICIENT_MARGIN',
    INVALID_ORDER_SIZE: 'INVALID_ORDER_SIZE',
    PRICE_OUT_OF_BOUNDS: 'PRICE_OUT_OF_BOUNDS',
    ORDER_WOULD_MATCH: 'ORDER_WOULD_MATCH',
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    POSITION_NOT_FOUND: 'POSITION_NOT_FOUND',
    // Market errors
    MARKET_NOT_FOUND: 'MARKET_NOT_FOUND',
    MARKET_PAUSED: 'MARKET_PAUSED',
    // Account errors
    SUBACCOUNT_NOT_FOUND: 'SUBACCOUNT_NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    INVALID_SIGNATURE: 'INVALID_SIGNATURE',
    // Network errors
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    EXCHANGE_DOWN: 'EXCHANGE_DOWN',
    TIMEOUT: 'TIMEOUT',
    // Generic
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    BAD_REQUEST: 'BAD_REQUEST',
    NOT_FOUND: 'NOT_FOUND',
};
//# sourceMappingURL=error-codes.js.map