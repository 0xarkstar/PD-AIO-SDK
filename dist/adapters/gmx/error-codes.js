/**
 * GMX v2 Error Code Mappings
 *
 * Maps GMX-specific error messages to standardized error types
 */
import { ExchangeUnavailableError, InsufficientMarginError, InsufficientBalanceError, InvalidOrderError, InvalidSignatureError, OrderNotFoundError, PerpDEXError, PositionNotFoundError, RateLimitError, TransactionFailedError, LiquidationError, } from '../../types/errors.js';
import { GMX_ERROR_MESSAGES } from './constants.js';
/**
 * Map GMX errors to unified PerpDEX error types
 *
 * @param error - Error from GMX API or on-chain
 * @returns Unified PerpDEXError
 */
export function mapGmxError(error) {
    if (error instanceof PerpDEXError) {
        return error;
    }
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        // Check known error patterns from GMX_ERROR_MESSAGES
        for (const [pattern, code] of Object.entries(GMX_ERROR_MESSAGES)) {
            if (message.includes(pattern)) {
                switch (code) {
                    case 'INSUFFICIENT_MARGIN':
                        return new InsufficientMarginError(error.message, code, 'gmx', error);
                    case 'INSUFFICIENT_BALANCE':
                        return new InsufficientBalanceError(error.message, code, 'gmx', undefined, undefined, error);
                    case 'POSITION_NOT_FOUND':
                        return new PositionNotFoundError(error.message, code, 'gmx', error);
                    case 'ORDER_NOT_FOUND':
                        return new OrderNotFoundError(error.message, code, 'gmx', error);
                    case 'MAX_LEVERAGE_EXCEEDED':
                    case 'MIN_ORDER_SIZE':
                    case 'SLIPPAGE_EXCEEDED':
                    case 'INVALID_PRICE':
                        return new InvalidOrderError(error.message, code, 'gmx', error);
                    case 'ORACLE_ERROR':
                    case 'MARKET_PAUSED':
                    case 'KEEPER_ERROR':
                        return new ExchangeUnavailableError(error.message, code, 'gmx', error);
                    case 'TRANSACTION_FAILED':
                        return new TransactionFailedError(error.message, code, 'gmx', undefined, error);
                    case 'LIQUIDATION':
                        return new LiquidationError(error.message, code, 'gmx', error);
                }
            }
        }
        // Chain/network specific errors
        if (message.includes('insufficient funds') || message.includes('insufficient gas')) {
            return new InsufficientBalanceError('Insufficient funds for transaction', 'INSUFFICIENT_GAS', 'gmx', undefined, undefined, error);
        }
        if (message.includes('nonce') || message.includes('already known')) {
            return new TransactionFailedError('Transaction nonce error', 'NONCE_ERROR', 'gmx', undefined, error);
        }
        if (message.includes('signature') || message.includes('unauthorized')) {
            return new InvalidSignatureError('Invalid transaction signature', 'INVALID_SIGNATURE', 'gmx', error);
        }
        // RPC/API errors
        if (message.includes('429') ||
            message.includes('rate limit') ||
            message.includes('too many requests')) {
            return new RateLimitError('Rate limit exceeded', 'RATE_LIMIT', 'gmx', undefined, error);
        }
        if (message.includes('503') ||
            message.includes('502') ||
            message.includes('504') ||
            message.includes('service unavailable')) {
            return new ExchangeUnavailableError('GMX API temporarily unavailable', 'API_UNAVAILABLE', 'gmx', error);
        }
        if (message.includes('timeout') || message.includes('timed out')) {
            return new ExchangeUnavailableError('Request timeout', 'TIMEOUT', 'gmx', error);
        }
        if (message.includes('network') || message.includes('connection')) {
            return new ExchangeUnavailableError('Network connection error', 'NETWORK_ERROR', 'gmx', error);
        }
        // Subgraph/GraphQL errors
        if (message.includes('graphql') || message.includes('query')) {
            return new ExchangeUnavailableError('Subgraph query error', 'SUBGRAPH_ERROR', 'gmx', error);
        }
        // Order execution errors
        if (message.includes('reverted') || message.includes('revert')) {
            return new TransactionFailedError('Transaction reverted', 'TX_REVERTED', 'gmx', undefined, error);
        }
        if (message.includes('keeper') || message.includes('execution failed')) {
            return new TransactionFailedError('Order execution failed by keeper', 'KEEPER_EXECUTION_FAILED', 'gmx', undefined, error);
        }
        // Market specific errors
        if (message.includes('market not found') || message.includes('invalid market')) {
            return new InvalidOrderError('Invalid or unsupported market', 'INVALID_MARKET', 'gmx', error);
        }
        if (message.includes('disabled') || message.includes('paused')) {
            return new ExchangeUnavailableError('Market is disabled or paused', 'MARKET_DISABLED', 'gmx', error);
        }
        // Position errors
        if (message.includes('position size') || message.includes('exceeds')) {
            return new InvalidOrderError('Position size exceeds limit', 'MAX_POSITION_SIZE', 'gmx', error);
        }
        if (message.includes('min collateral')) {
            return new InsufficientMarginError('Below minimum collateral requirement', 'MIN_COLLATERAL', 'gmx', error);
        }
    }
    // Default to generic exchange error
    return new ExchangeUnavailableError('Unknown exchange error', 'UNKNOWN_ERROR', 'gmx', error);
}
/**
 * Standard GMX error codes for reference
 */
export const GmxErrorCodes = {
    // Trading errors
    INSUFFICIENT_MARGIN: 'INSUFFICIENT_MARGIN',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    INSUFFICIENT_GAS: 'INSUFFICIENT_GAS',
    MAX_LEVERAGE_EXCEEDED: 'MAX_LEVERAGE_EXCEEDED',
    MIN_ORDER_SIZE: 'MIN_ORDER_SIZE',
    MAX_POSITION_SIZE: 'MAX_POSITION_SIZE',
    MIN_COLLATERAL: 'MIN_COLLATERAL',
    SLIPPAGE_EXCEEDED: 'SLIPPAGE_EXCEEDED',
    INVALID_PRICE: 'INVALID_PRICE',
    // Position errors
    POSITION_NOT_FOUND: 'POSITION_NOT_FOUND',
    POSITION_LIQUIDATED: 'POSITION_LIQUIDATED',
    // Order errors
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    ORDER_CANCELLED: 'ORDER_CANCELLED',
    INVALID_MARKET: 'INVALID_MARKET',
    // Oracle errors
    ORACLE_ERROR: 'ORACLE_ERROR',
    INVALID_ORACLE_PRICE: 'INVALID_ORACLE_PRICE',
    // Market errors
    MARKET_PAUSED: 'MARKET_PAUSED',
    MARKET_DISABLED: 'MARKET_DISABLED',
    // Transaction errors
    TRANSACTION_FAILED: 'TRANSACTION_FAILED',
    TX_REVERTED: 'TX_REVERTED',
    NONCE_ERROR: 'NONCE_ERROR',
    INVALID_SIGNATURE: 'INVALID_SIGNATURE',
    // Keeper errors
    KEEPER_ERROR: 'KEEPER_ERROR',
    KEEPER_EXECUTION_FAILED: 'KEEPER_EXECUTION_FAILED',
    // Network errors
    RATE_LIMIT: 'RATE_LIMIT',
    API_UNAVAILABLE: 'API_UNAVAILABLE',
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT: 'TIMEOUT',
    SUBGRAPH_ERROR: 'SUBGRAPH_ERROR',
    // Liquidation
    LIQUIDATION: 'LIQUIDATION',
    // Generic
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};
//# sourceMappingURL=error-codes.js.map