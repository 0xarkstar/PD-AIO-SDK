/**
 * Pacifica Error Code Mapping
 */
import { ExchangeUnavailableError, InsufficientMarginError, InvalidOrderError, InvalidSignatureError, OrderNotFoundError, PerpDEXError, RateLimitError, } from '../../types/errors.js';
export const PACIFICA_ERROR_CODES = {
    INVALID_SIGNATURE: 'INVALID_SIGNATURE',
    EXPIRED_TIMESTAMP: 'EXPIRED_TIMESTAMP',
    INVALID_API_KEY: 'INVALID_API_KEY',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    INSUFFICIENT_MARGIN: 'INSUFFICIENT_MARGIN',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    INVALID_ORDER: 'INVALID_ORDER',
    INVALID_PRICE: 'INVALID_PRICE',
    INVALID_SIZE: 'INVALID_SIZE',
    REDUCE_ONLY_REJECTED: 'REDUCE_ONLY_REJECTED',
    POST_ONLY_REJECTED: 'POST_ONLY_REJECTED',
    MAX_LEVERAGE_EXCEEDED: 'MAX_LEVERAGE_EXCEEDED',
    POSITION_NOT_FOUND: 'POSITION_NOT_FOUND',
    BUILDER_CODE_INVALID: 'BUILDER_CODE_INVALID',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
};
export function isRetryableError(code) {
    return (code === 'RATE_LIMIT_EXCEEDED' || code === 'SERVICE_UNAVAILABLE' || code === 'INTERNAL_ERROR');
}
export function mapPacificaError(code, message) {
    switch (code) {
        case 'RATE_LIMIT_EXCEEDED':
            return new RateLimitError(message, code, 'pacifica');
        case 'INVALID_SIGNATURE':
        case 'EXPIRED_TIMESTAMP':
        case 'INVALID_API_KEY':
            return new InvalidSignatureError(message, code, 'pacifica');
        case 'ORDER_NOT_FOUND':
            return new OrderNotFoundError(message, code, 'pacifica');
        case 'INSUFFICIENT_MARGIN':
        case 'INSUFFICIENT_BALANCE':
            return new InsufficientMarginError(message, code, 'pacifica');
        case 'INVALID_ORDER':
        case 'INVALID_PRICE':
        case 'INVALID_SIZE':
        case 'REDUCE_ONLY_REJECTED':
        case 'POST_ONLY_REJECTED':
        case 'MAX_LEVERAGE_EXCEEDED':
        case 'BUILDER_CODE_INVALID':
            return new InvalidOrderError(message, code, 'pacifica');
        case 'SERVICE_UNAVAILABLE':
        case 'INTERNAL_ERROR':
            return new ExchangeUnavailableError(message, code, 'pacifica');
        default:
            return new PerpDEXError(message, code, 'pacifica');
    }
}
//# sourceMappingURL=error-codes.js.map