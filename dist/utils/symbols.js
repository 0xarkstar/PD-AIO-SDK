/**
 * Symbol Normalization Utilities
 *
 * Utilities for parsing and converting trading pair symbols
 */
/**
 * Create a symbol in unified format for a specific exchange
 *
 * @param exchange - Exchange identifier
 * @param base - Base currency (e.g., 'BTC', 'ETH')
 * @param quote - Quote currency (default: 'USDT')
 * @returns Unified symbol format (e.g., 'BTC/USDT:USDT')
 *
 * @example
 * ```typescript
 * import { createSymbol } from 'perp-dex-sdk';
 *
 * // Simple usage with defaults
 * const btc = createSymbol('hyperliquid', 'BTC');  // "BTC/USDT:USDT"
 *
 * // Custom quote currency
 * const eth = createSymbol('lighter', 'ETH', 'USDC');  // "ETH/USDC:USDC"
 *
 * // Works with all supported exchanges
 * const sol = createSymbol('backpack', 'SOL');  // "SOL/USDT:USDT"
 * ```
 */
export function createSymbol(exchange, base, quote = 'USDT') {
    // Normalize to uppercase
    const normalizedBase = base.toUpperCase().trim();
    const normalizedQuote = quote.toUpperCase().trim();
    // Validate inputs
    if (!normalizedBase) {
        throw new Error('Base currency cannot be empty');
    }
    if (!normalizedQuote) {
        throw new Error('Quote currency cannot be empty');
    }
    if (!/^[A-Z0-9]+$/.test(normalizedBase)) {
        throw new Error(`Invalid base currency: ${base}`);
    }
    if (!/^[A-Z0-9]+$/.test(normalizedQuote)) {
        throw new Error(`Invalid quote currency: ${quote}`);
    }
    // All supported exchanges use perpetual contracts with same settlement currency as quote
    // Format: BASE/QUOTE:SETTLE where SETTLE === QUOTE for perpetuals
    return `${normalizedBase}/${normalizedQuote}:${normalizedQuote}`;
}
export function parseSymbol(symbol) {
    // Format: BASE/QUOTE:SETTLE for perpetuals
    // Format: BASE/QUOTE for spot
    const parts = symbol.split(':');
    if (parts.length === 2) {
        // Perpetual/swap
        const [pair, settle] = parts;
        const [base, quote] = (pair ?? '').split('/');
        if (!base || !quote || !settle) {
            throw new Error(`Invalid symbol format: ${symbol}`);
        }
        return {
            base,
            quote,
            settle,
            type: 'swap',
        };
    }
    else if (parts.length === 1) {
        // Spot
        const [base, quote] = (parts[0] ?? '').split('/');
        if (!base || !quote) {
            throw new Error(`Invalid symbol format: ${symbol}`);
        }
        return {
            base,
            quote,
            settle: quote,
            type: 'spot',
        };
    }
    else {
        throw new Error(`Invalid symbol format: ${symbol}`);
    }
}
/**
 * Build unified symbol from components
 *
 * @param base - Base currency
 * @param quote - Quote currency
 * @param settle - Settlement currency (optional, for perpetuals)
 * @returns Unified symbol
 */
export function buildSymbol(base, quote, settle) {
    if (settle && settle !== quote) {
        return `${base}/${quote}:${settle}`;
    }
    else if (settle) {
        return `${base}/${quote}:${settle}`;
    }
    else {
        return `${base}/${quote}`;
    }
}
/**
 * Validate symbol format
 *
 * @param symbol - Symbol to validate
 * @returns true if valid
 */
export function isValidSymbol(symbol) {
    try {
        parseSymbol(symbol);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Extract base currency from symbol
 *
 * @param symbol - Unified symbol
 * @returns Base currency
 */
export function getBaseCurrency(symbol) {
    const parts = parseSymbol(symbol);
    return parts.base;
}
/**
 * Extract quote currency from symbol
 *
 * @param symbol - Unified symbol
 * @returns Quote currency
 */
export function getQuoteCurrency(symbol) {
    const parts = parseSymbol(symbol);
    return parts.quote;
}
/**
 * Extract settlement currency from symbol
 *
 * @param symbol - Unified symbol
 * @returns Settlement currency
 */
export function getSettleCurrency(symbol) {
    const parts = parseSymbol(symbol);
    return parts.settle;
}
/**
 * Check if symbol is a perpetual/swap
 *
 * @param symbol - Unified symbol
 * @returns true if perpetual
 */
export function isPerpetual(symbol) {
    return symbol.includes(':');
}
/**
 * Normalize symbol (ensure consistent format)
 *
 * @param symbol - Symbol in any format
 * @returns Normalized symbol
 */
export function normalizeSymbol(symbol) {
    const trimmed = symbol.trim().toUpperCase();
    // Handle common variations
    if (trimmed.includes('PERP') || trimmed.includes('PERPETUAL')) {
        // Extract base currency
        const base = trimmed.split(/[-_]/)[0];
        return `${base}/USDT:USDT`;
    }
    // Already in correct format
    if (isValidSymbol(trimmed)) {
        return trimmed;
    }
    throw new Error(`Cannot normalize symbol: ${symbol}`);
}
/**
 * Compare symbols (ignoring format differences)
 *
 * @param symbol1 - First symbol
 * @param symbol2 - Second symbol
 * @returns true if symbols refer to same trading pair
 */
export function compareSymbols(symbol1, symbol2) {
    try {
        const parts1 = parseSymbol(symbol1);
        const parts2 = parseSymbol(symbol2);
        return (parts1.base === parts2.base &&
            parts1.quote === parts2.quote &&
            parts1.settle === parts2.settle &&
            parts1.type === parts2.type);
    }
    catch {
        return false;
    }
}
/**
 * Filter symbols by base currency
 *
 * @param symbols - Array of symbols
 * @param baseCurrency - Base currency to filter by
 * @returns Filtered symbols
 */
export function filterByBase(symbols, baseCurrency) {
    return symbols.filter((symbol) => {
        try {
            return getBaseCurrency(symbol) === baseCurrency.toUpperCase();
        }
        catch {
            return false;
        }
    });
}
/**
 * Filter symbols by quote currency
 *
 * @param symbols - Array of symbols
 * @param quoteCurrency - Quote currency to filter by
 * @returns Filtered symbols
 */
export function filterByQuote(symbols, quoteCurrency) {
    return symbols.filter((symbol) => {
        try {
            return getQuoteCurrency(symbol) === quoteCurrency.toUpperCase();
        }
        catch {
            return false;
        }
    });
}
/**
 * Group symbols by base currency
 *
 * @param symbols - Array of symbols
 * @returns Map of base currency to symbols
 */
export function groupByBase(symbols) {
    const groups = new Map();
    for (const symbol of symbols) {
        try {
            const base = getBaseCurrency(symbol);
            const existing = groups.get(base) ?? [];
            existing.push(symbol);
            groups.set(base, existing);
        }
        catch {
            // Skip invalid symbols
        }
    }
    return groups;
}
//# sourceMappingURL=symbols.js.map