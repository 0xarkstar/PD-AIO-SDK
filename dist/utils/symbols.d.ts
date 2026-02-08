/**
 * Symbol Normalization Utilities
 *
 * Utilities for parsing and converting trading pair symbols
 */
import type { SupportedExchange } from '../factory.js';
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
export declare function createSymbol(_exchange: SupportedExchange, base: string, quote?: string): string;
/**
 * Parse unified symbol into components
 *
 * @param symbol - Symbol in unified format (e.g., "BTC/USDT:USDT")
 * @returns Parsed components
 *
 * @example
 * ```typescript
 * const parts = parseSymbol('BTC/USDT:USDT');
 * // { base: 'BTC', quote: 'USDT', settle: 'USDT', type: 'swap' }
 * ```
 */
export interface SymbolParts {
    base: string;
    quote: string;
    settle: string;
    type: 'spot' | 'swap' | 'future';
}
export declare function parseSymbol(symbol: string): SymbolParts;
/**
 * Build unified symbol from components
 *
 * @param base - Base currency
 * @param quote - Quote currency
 * @param settle - Settlement currency (optional, for perpetuals)
 * @returns Unified symbol
 */
export declare function buildSymbol(base: string, quote: string, settle?: string): string;
/**
 * Validate symbol format
 *
 * @param symbol - Symbol to validate
 * @returns true if valid
 */
export declare function isValidSymbol(symbol: string): boolean;
/**
 * Extract base currency from symbol
 *
 * @param symbol - Unified symbol
 * @returns Base currency
 */
export declare function getBaseCurrency(symbol: string): string;
/**
 * Extract quote currency from symbol
 *
 * @param symbol - Unified symbol
 * @returns Quote currency
 */
export declare function getQuoteCurrency(symbol: string): string;
/**
 * Extract settlement currency from symbol
 *
 * @param symbol - Unified symbol
 * @returns Settlement currency
 */
export declare function getSettleCurrency(symbol: string): string;
/**
 * Check if symbol is a perpetual/swap
 *
 * @param symbol - Unified symbol
 * @returns true if perpetual
 */
export declare function isPerpetual(symbol: string): boolean;
/**
 * Normalize symbol (ensure consistent format)
 *
 * @param symbol - Symbol in any format
 * @returns Normalized symbol
 */
export declare function normalizeSymbol(symbol: string): string;
/**
 * Compare symbols (ignoring format differences)
 *
 * @param symbol1 - First symbol
 * @param symbol2 - Second symbol
 * @returns true if symbols refer to same trading pair
 */
export declare function compareSymbols(symbol1: string, symbol2: string): boolean;
/**
 * Filter symbols by base currency
 *
 * @param symbols - Array of symbols
 * @param baseCurrency - Base currency to filter by
 * @returns Filtered symbols
 */
export declare function filterByBase(symbols: string[], baseCurrency: string): string[];
/**
 * Filter symbols by quote currency
 *
 * @param symbols - Array of symbols
 * @param quoteCurrency - Quote currency to filter by
 * @returns Filtered symbols
 */
export declare function filterByQuote(symbols: string[], quoteCurrency: string): string[];
/**
 * Group symbols by base currency
 *
 * @param symbols - Array of symbols
 * @returns Map of base currency to symbols
 */
export declare function groupByBase(symbols: string[]): Map<string, string[]>;
//# sourceMappingURL=symbols.d.ts.map