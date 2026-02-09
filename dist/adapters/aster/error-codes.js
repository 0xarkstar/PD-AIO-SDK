/**
 * Aster Error Code Mapping (Binance-style)
 */
import { ExchangeUnavailableError, InsufficientMarginError, InvalidOrderError, InvalidSignatureError, OrderNotFoundError, PerpDEXError, RateLimitError, } from '../../types/errors.js';
export const ASTER_ERROR_CODES = {
    [-1000]: 'UNKNOWN',
    [-1001]: 'DISCONNECTED',
    [-1002]: 'UNAUTHORIZED',
    [-1003]: 'TOO_MANY_REQUESTS',
    [-1006]: 'UNEXPECTED_RESPONSE',
    [-1007]: 'TIMEOUT',
    [-1010]: 'SERVER_BUSY',
    [-1015]: 'TOO_MANY_ORDERS',
    [-1016]: 'SERVICE_SHUTTING_DOWN',
    [-1020]: 'UNSUPPORTED_OPERATION',
    [-1021]: 'INVALID_TIMESTAMP',
    [-1022]: 'INVALID_SIGNATURE',
    [-2010]: 'NEW_ORDER_REJECTED',
    [-2011]: 'CANCEL_REJECTED',
    [-2013]: 'NO_SUCH_ORDER',
    [-2014]: 'BAD_API_KEY_FMT',
    [-2015]: 'REJECTED_MBX_KEY',
    [-2018]: 'BALANCE_NOT_SUFFICIENT',
    [-2019]: 'MARGIN_NOT_SUFFICIENT',
    [-2020]: 'UNABLE_TO_FILL',
    [-2021]: 'ORDER_WOULD_TRIGGER',
    [-2022]: 'REDUCE_ONLY_REJECT',
    [-2026]: 'ORDER_NOT_FOUND',
    [-4000]: 'INVALID_ORDER_STATUS',
    [-4001]: 'PRICE_LESS_THAN_ZERO',
    [-4002]: 'PRICE_GREATER_THAN_MAX',
    [-4003]: 'QTY_LESS_THAN_ZERO',
    [-4014]: 'PRICE_NOT_INCREASED',
    [-4015]: 'LEVERAGE_NOT_CHANGED',
    [-4028]: 'INVALID_LEVERAGE',
    [-4029]: 'MAX_LEVERAGE_RATIO',
    [-4046]: 'POST_ONLY_REJECT',
};
export function isRetryableError(code) {
    return (code === -1001 ||
        code === -1003 ||
        code === -1006 ||
        code === -1007 ||
        code === -1010 ||
        code === -1016);
}
export function mapAsterError(code, message) {
    if (code === -1003 || code === -1015) {
        return new RateLimitError(message, String(code), 'aster');
    }
    if (code === -1022 || code === -2014 || code === -2015) {
        return new InvalidSignatureError(message, String(code), 'aster');
    }
    if (code === -2013 || code === -2026) {
        return new OrderNotFoundError(message, String(code), 'aster');
    }
    if (code === -2018 || code === -2019) {
        return new InsufficientMarginError(message, String(code), 'aster');
    }
    if (code === -2010 ||
        code === -2020 ||
        code === -2021 ||
        code === -2022 ||
        code === -4000 ||
        code === -4001 ||
        code === -4002 ||
        code === -4003 ||
        code === -4014 ||
        code === -4028 ||
        code === -4029 ||
        code === -4046) {
        return new InvalidOrderError(message, String(code), 'aster');
    }
    if (code === -1001 || code === -1006 || code === -1007 || code === -1010 || code === -1016) {
        return new ExchangeUnavailableError(message, String(code), 'aster');
    }
    return new PerpDEXError(message, String(code), 'aster');
}
//# sourceMappingURL=error-codes.js.map