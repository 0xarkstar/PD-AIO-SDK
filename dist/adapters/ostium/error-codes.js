/**
 * Ostium Error Code Mapping
 */
import { ExchangeUnavailableError, InsufficientMarginError, InvalidOrderError, PerpDEXError, TransactionFailedError, } from '../../types/errors.js';
export const OSTIUM_ERROR_PATTERNS = {
    'insufficient funds': 'INSUFFICIENT_FUNDS',
    'insufficient balance': 'INSUFFICIENT_BALANCE',
    'execution reverted': 'EXECUTION_REVERTED',
    'max leverage': 'MAX_LEVERAGE',
    'min leverage': 'MIN_LEVERAGE',
    'max position size': 'MAX_POSITION_SIZE',
    'min position size': 'MIN_POSITION_SIZE',
    'pair not listed': 'PAIR_NOT_LISTED',
    'already has': 'ALREADY_EXISTS',
    'no open trade': 'NO_OPEN_TRADE',
    'wrong leverage': 'WRONG_LEVERAGE',
    'too late': 'EXPIRED',
    paused: 'TRADING_PAUSED',
    'market closed': 'MARKET_CLOSED',
    slippage: 'SLIPPAGE_EXCEEDED',
    'nonce too low': 'NONCE_TOO_LOW',
    'replacement fee too low': 'REPLACEMENT_UNDERPRICED',
};
export function mapOstiumError(error) {
    if (error instanceof PerpDEXError)
        return error;
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    if (message.includes('insufficient funds') || message.includes('insufficient balance')) {
        return new InsufficientMarginError(error instanceof Error ? error.message : String(error), 'INSUFFICIENT_FUNDS', 'ostium');
    }
    if (message.includes('max leverage') ||
        message.includes('min leverage') ||
        message.includes('wrong leverage') ||
        message.includes('max position') ||
        message.includes('min position') ||
        message.includes('slippage')) {
        return new InvalidOrderError(error instanceof Error ? error.message : String(error), 'INVALID_ORDER', 'ostium');
    }
    if (message.includes('execution reverted') ||
        message.includes('nonce too low') ||
        message.includes('replacement fee too low')) {
        return new TransactionFailedError(error instanceof Error ? error.message : String(error), 'TX_FAILED', 'ostium');
    }
    if (message.includes('paused') || message.includes('market closed')) {
        return new ExchangeUnavailableError(error instanceof Error ? error.message : String(error), 'EXCHANGE_UNAVAILABLE', 'ostium');
    }
    return new PerpDEXError(error instanceof Error ? error.message : String(error), 'UNKNOWN', 'ostium');
}
//# sourceMappingURL=error-codes.js.map