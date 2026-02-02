/**
 * Variational Utility Functions
 *
 * Helper functions for Variational adapter
 */
import { PerpDEXError } from '../../types/errors.js';
import { mapVariationalError } from './error-codes.js';
/**
 * Convert unified order request to Variational format
 */
export function convertOrderRequest(request) {
    return {
        symbol: request.symbol,
        type: request.type,
        side: request.side,
        amount: request.amount.toString(),
        price: request.price?.toString(),
        clientOrderId: request.clientOrderId,
        postOnly: request.postOnly,
        reduceOnly: request.reduceOnly,
    };
}
/**
 * Map error from Variational API
 */
export function mapError(error) {
    if (error instanceof PerpDEXError) {
        return error;
    }
    const message = error?.message || error?.error || String(error);
    const code = error?.code || error?.status || 'UNKNOWN_ERROR';
    const context = {
        originalError: error,
    };
    return mapVariationalError(code, message, context);
}
/**
 * Count decimal places in a number string
 */
export function countDecimals(value) {
    if (!value || !value.includes('.')) {
        return 0;
    }
    return value.split('.')[1]?.length || 0;
}
/**
 * Format symbol for Variational API
 * Converts "BTC/USDT:USDT" to "BTC-USDT-PERP"
 */
export function formatSymbolForAPI(unifiedSymbol) {
    const [pair, settle] = unifiedSymbol.split(':');
    if (!pair) {
        return unifiedSymbol;
    }
    const [base, quote] = pair.split('/');
    if (!base || !quote) {
        return unifiedSymbol;
    }
    return `${base}-${quote}-PERP`;
}
/**
 * Parse symbol from Variational format
 * Converts "BTC-USDT-PERP" to "BTC/USDT:USDT"
 */
export function parseSymbolFromAPI(variationalSymbol) {
    const parts = variationalSymbol.split('-');
    if (parts.length === 3 && parts[2] === 'PERP') {
        const [base, quote] = parts;
        return `${base}/${quote}:${quote}`;
    }
    return variationalSymbol;
}
/**
 * Validate order request parameters
 */
export function validateOrderRequest(request) {
    if (!request.symbol) {
        throw new PerpDEXError('Symbol is required', 'INVALID_SYMBOL', 'variational');
    }
    if (!request.type) {
        throw new PerpDEXError('Order type is required', 'INVALID_ORDER_TYPE', 'variational');
    }
    if (!request.side) {
        throw new PerpDEXError('Order side is required', 'INVALID_ORDER_SIDE', 'variational');
    }
    if (!request.amount || request.amount <= 0) {
        throw new PerpDEXError('Amount must be greater than 0', 'INVALID_AMOUNT', 'variational');
    }
    if (request.type === 'limit' && (!request.price || request.price <= 0)) {
        throw new PerpDEXError('Price is required for limit orders', 'INVALID_PRICE', 'variational');
    }
}
/**
 * Generate a unique client order ID
 */
export function generateClientOrderId() {
    return `var_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
/**
 * Check if quote has expired
 */
export function isQuoteExpired(expiresAt) {
    return Date.now() >= expiresAt;
}
/**
 * Calculate time until quote expiration (in milliseconds)
 */
export function getQuoteTimeRemaining(expiresAt) {
    const remaining = expiresAt - Date.now();
    return Math.max(0, remaining);
}
/**
 * Format price with correct precision
 */
export function formatPrice(price, tickSize) {
    const decimals = countDecimals(tickSize);
    return price.toFixed(decimals);
}
/**
 * Format amount with correct precision
 */
export function formatAmount(amount, minOrderSize) {
    const decimals = countDecimals(minOrderSize);
    return amount.toFixed(decimals);
}
/**
 * Safely parse a numeric string value
 */
export function safeParseFloat(value) {
    if (value === undefined || value === null || value === '') {
        return 0;
    }
    const parsed = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(parsed) ? 0 : parsed;
}
//# sourceMappingURL=utils.js.map