/**
 * Avantis Error Handling
 *
 * Maps on-chain errors (reverts, gas issues) to unified SDK error types.
 */
import { includesValue } from '../../utils/type-guards.js';
import { PerpDEXError, InvalidOrderError, InsufficientMarginError, RateLimitError, ExchangeUnavailableError, BadRequestError, } from '../../types/errors.js';
/**
 * On-chain revert error patterns
 */
export const AVANTIS_REVERT_ERRORS = {
    WRONG_TRADE: 'WRONG_TRADE',
    WRONG_LEVERAGE: 'WRONG_LEVERAGE',
    WRONG_TP: 'WRONG_TP',
    WRONG_SL: 'WRONG_SL',
    MAX_TRADES_PER_PAIR: 'MAX_TRADES_PER_PAIR',
    ABOVE_MAX_POS: 'ABOVE_MAX_POS',
    BELOW_MIN_POS: 'BELOW_MIN_POS',
    PAIR_NOT_LISTED: 'PAIR_NOT_LISTED',
    NO_TRADE: 'NO_TRADE',
    NO_LIMIT: 'NO_LIMIT',
    ALREADY_BEING_CLOSED: 'ALREADY_BEING_CLOSED',
    PRICE_NOT_HIT: 'PRICE_NOT_HIT',
};
/**
 * Transaction-level errors
 */
export const AVANTIS_TX_ERRORS = {
    INSUFFICIENT_GAS: 'INSUFFICIENT_GAS',
    NONCE_TOO_LOW: 'NONCE_TOO_LOW',
    TRANSACTION_REVERTED: 'TRANSACTION_REVERTED',
    REPLACEMENT_UNDERPRICED: 'REPLACEMENT_UNDERPRICED',
    RPC_ERROR: 'RPC_ERROR',
    TIMEOUT: 'TIMEOUT',
};
/**
 * Error message pattern mapping
 */
export const AVANTIS_ERROR_MESSAGES = {
    'insufficient funds': AVANTIS_TX_ERRORS.INSUFFICIENT_GAS,
    'nonce too low': AVANTIS_TX_ERRORS.NONCE_TOO_LOW,
    'transaction reverted': AVANTIS_TX_ERRORS.TRANSACTION_REVERTED,
    reverted: AVANTIS_TX_ERRORS.TRANSACTION_REVERTED,
    'replacement fee too low': AVANTIS_TX_ERRORS.REPLACEMENT_UNDERPRICED,
    'execution reverted': AVANTIS_TX_ERRORS.TRANSACTION_REVERTED,
    timeout: AVANTIS_TX_ERRORS.TIMEOUT,
    wrong_trade: AVANTIS_REVERT_ERRORS.WRONG_TRADE,
    wrong_leverage: AVANTIS_REVERT_ERRORS.WRONG_LEVERAGE,
    max_trades_per_pair: AVANTIS_REVERT_ERRORS.MAX_TRADES_PER_PAIR,
    above_max_pos: AVANTIS_REVERT_ERRORS.ABOVE_MAX_POS,
    below_min_pos: AVANTIS_REVERT_ERRORS.BELOW_MIN_POS,
    pair_not_listed: AVANTIS_REVERT_ERRORS.PAIR_NOT_LISTED,
    no_trade: AVANTIS_REVERT_ERRORS.NO_TRADE,
    no_limit: AVANTIS_REVERT_ERRORS.NO_LIMIT,
    'insufficient margin': 'INSUFFICIENT_MARGIN',
};
/**
 * Extract error code from error message
 */
export function extractErrorCode(errorMessage) {
    const messageLower = errorMessage.toLowerCase();
    for (const [pattern, code] of Object.entries(AVANTIS_ERROR_MESSAGES)) {
        if (messageLower.includes(pattern)) {
            return code;
        }
    }
    if (messageLower.includes('429') || messageLower.includes('rate limit')) {
        return 'RATE_LIMIT_EXCEEDED';
    }
    if (messageLower.includes('500') || messageLower.includes('503')) {
        return AVANTIS_TX_ERRORS.RPC_ERROR;
    }
    return 'UNKNOWN_ERROR';
}
/**
 * Map Avantis error to unified SDK error type
 */
export function mapAvantisError(errorCode, message, originalError) {
    switch (errorCode) {
        case 'INSUFFICIENT_MARGIN':
        case AVANTIS_TX_ERRORS.INSUFFICIENT_GAS:
            return new InsufficientMarginError(message, errorCode, 'avantis', originalError);
        case AVANTIS_REVERT_ERRORS.WRONG_TRADE:
        case AVANTIS_REVERT_ERRORS.WRONG_LEVERAGE:
        case AVANTIS_REVERT_ERRORS.WRONG_TP:
        case AVANTIS_REVERT_ERRORS.WRONG_SL:
        case AVANTIS_REVERT_ERRORS.MAX_TRADES_PER_PAIR:
        case AVANTIS_REVERT_ERRORS.ABOVE_MAX_POS:
        case AVANTIS_REVERT_ERRORS.BELOW_MIN_POS:
            return new InvalidOrderError(message, errorCode, 'avantis', originalError);
        case AVANTIS_REVERT_ERRORS.PAIR_NOT_LISTED:
            return new BadRequestError(message, errorCode, 'avantis', originalError);
        case AVANTIS_REVERT_ERRORS.NO_TRADE:
        case AVANTIS_REVERT_ERRORS.NO_LIMIT:
        case AVANTIS_REVERT_ERRORS.ALREADY_BEING_CLOSED:
            return new InvalidOrderError(message, errorCode, 'avantis', originalError);
        case 'RATE_LIMIT_EXCEEDED':
            return new RateLimitError(message, errorCode, 'avantis', undefined, originalError);
        default:
            if (includesValue(Object.values(AVANTIS_TX_ERRORS), errorCode)) {
                return new ExchangeUnavailableError(message, errorCode, 'avantis', originalError);
            }
            return new PerpDEXError(message, errorCode, 'avantis', originalError);
    }
}
/**
 * Map error from unknown type
 */
export function mapError(error) {
    if (error instanceof PerpDEXError) {
        return error;
    }
    if (error instanceof Error) {
        const errorCode = extractErrorCode(error.message);
        return mapAvantisError(errorCode, error.message, error);
    }
    return new ExchangeUnavailableError('Unknown exchange error', 'UNKNOWN_ERROR', 'avantis', error);
}
/**
 * Check if error is retryable
 */
export function isRetryableError(errorCode) {
    return (errorCode === AVANTIS_TX_ERRORS.RPC_ERROR ||
        errorCode === AVANTIS_TX_ERRORS.TIMEOUT ||
        errorCode === AVANTIS_TX_ERRORS.NONCE_TOO_LOW ||
        errorCode === 'RATE_LIMIT_EXCEEDED');
}
//# sourceMappingURL=error-codes.js.map