/**
 * Symbol Normalization Utilities
 *
 * Utilities for parsing and converting trading pair symbols
 */

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

export function parseSymbol(symbol: string): SymbolParts {
  // Format: BASE/QUOTE:SETTLE for perpetuals
  // Format: BASE/QUOTE for spot

  const parts = symbol.split(':');

  if (parts.length === 2) {
    // Perpetual/swap
    const [pair, settle] = parts as [string, string];
    const [base, quote] = (pair ?? '').split('/') as [string, string];

    if (!base || !quote || !settle) {
      throw new Error(`Invalid symbol format: ${symbol}`);
    }

    return {
      base,
      quote,
      settle,
      type: 'swap',
    };
  } else if (parts.length === 1) {
    // Spot
    const [base, quote] = (parts[0] ?? '').split('/') as [string, string];

    if (!base || !quote) {
      throw new Error(`Invalid symbol format: ${symbol}`);
    }

    return {
      base,
      quote,
      settle: quote,
      type: 'spot',
    };
  } else {
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
export function buildSymbol(base: string, quote: string, settle?: string): string {
  if (settle && settle !== quote) {
    return `${base}/${quote}:${settle}`;
  } else if (settle) {
    return `${base}/${quote}:${settle}`;
  } else {
    return `${base}/${quote}`;
  }
}

/**
 * Validate symbol format
 *
 * @param symbol - Symbol to validate
 * @returns true if valid
 */
export function isValidSymbol(symbol: string): boolean {
  try {
    parseSymbol(symbol);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract base currency from symbol
 *
 * @param symbol - Unified symbol
 * @returns Base currency
 */
export function getBaseCurrency(symbol: string): string {
  const parts = parseSymbol(symbol);
  return parts.base;
}

/**
 * Extract quote currency from symbol
 *
 * @param symbol - Unified symbol
 * @returns Quote currency
 */
export function getQuoteCurrency(symbol: string): string {
  const parts = parseSymbol(symbol);
  return parts.quote;
}

/**
 * Extract settlement currency from symbol
 *
 * @param symbol - Unified symbol
 * @returns Settlement currency
 */
export function getSettleCurrency(symbol: string): string {
  const parts = parseSymbol(symbol);
  return parts.settle;
}

/**
 * Check if symbol is a perpetual/swap
 *
 * @param symbol - Unified symbol
 * @returns true if perpetual
 */
export function isPerpetual(symbol: string): boolean {
  return symbol.includes(':');
}

/**
 * Normalize symbol (ensure consistent format)
 *
 * @param symbol - Symbol in any format
 * @returns Normalized symbol
 */
export function normalizeSymbol(symbol: string): string {
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
export function compareSymbols(symbol1: string, symbol2: string): boolean {
  try {
    const parts1 = parseSymbol(symbol1);
    const parts2 = parseSymbol(symbol2);

    return (
      parts1.base === parts2.base &&
      parts1.quote === parts2.quote &&
      parts1.settle === parts2.settle
    );
  } catch {
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
export function filterByBase(symbols: string[], baseCurrency: string): string[] {
  return symbols.filter((symbol) => {
    try {
      return getBaseCurrency(symbol) === baseCurrency.toUpperCase();
    } catch {
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
export function filterByQuote(symbols: string[], quoteCurrency: string): string[] {
  return symbols.filter((symbol) => {
    try {
      return getQuoteCurrency(symbol) === quoteCurrency.toUpperCase();
    } catch {
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
export function groupByBase(symbols: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();

  for (const symbol of symbols) {
    try {
      const base = getBaseCurrency(symbol);
      const existing = groups.get(base) ?? [];
      existing.push(symbol);
      groups.set(base, existing);
    } catch {
      // Skip invalid symbols
    }
  }

  return groups;
}
