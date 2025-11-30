/**
 * Symbol Utilities Unit Tests
 */

import {
  createSymbol,
  parseSymbol,
  buildSymbol,
  isValidSymbol,
  getBaseCurrency,
  getQuoteCurrency,
  getSettleCurrency,
  isPerpetual,
  normalizeSymbol,
  compareSymbols,
  filterByBase,
  filterByQuote,
  groupByBase,
} from '../../src/utils/symbols.js';

describe('Symbol Utilities', () => {
  describe('createSymbol', () => {
    test('creates symbol with default USDT quote', () => {
      expect(createSymbol('hyperliquid', 'BTC')).toBe('BTC/USDT:USDT');
      expect(createSymbol('lighter', 'ETH')).toBe('ETH/USDT:USDT');
      expect(createSymbol('grvt', 'SOL')).toBe('SOL/USDT:USDT');
    });

    test('creates symbol with custom quote currency', () => {
      expect(createSymbol('hyperliquid', 'BTC', 'USDC')).toBe('BTC/USDC:USDC');
      expect(createSymbol('paradex', 'ETH', 'USD')).toBe('ETH/USD:USD');
    });

    test('normalizes input to uppercase', () => {
      expect(createSymbol('hyperliquid', 'btc')).toBe('BTC/USDT:USDT');
      expect(createSymbol('lighter', 'eth', 'usdc')).toBe('ETH/USDC:USDC');
    });

    test('trims whitespace from inputs', () => {
      expect(createSymbol('hyperliquid', ' BTC ')).toBe('BTC/USDT:USDT');
      expect(createSymbol('lighter', 'ETH ', ' USDC ')).toBe('ETH/USDC:USDC');
    });

    test('throws on empty base currency', () => {
      expect(() => createSymbol('hyperliquid', '')).toThrow('Base currency cannot be empty');
      expect(() => createSymbol('hyperliquid', '  ')).toThrow('Base currency cannot be empty');
    });

    test('throws on empty quote currency', () => {
      expect(() => createSymbol('hyperliquid', 'BTC', '')).toThrow('Quote currency cannot be empty');
      expect(() => createSymbol('hyperliquid', 'BTC', '  ')).toThrow('Quote currency cannot be empty');
    });

    test('throws on invalid base currency characters', () => {
      expect(() => createSymbol('hyperliquid', 'BTC-USD')).toThrow('Invalid base currency');
      expect(() => createSymbol('hyperliquid', 'BTC/ETH')).toThrow('Invalid base currency');
    });

    test('throws on invalid quote currency characters', () => {
      expect(() => createSymbol('hyperliquid', 'BTC', 'USD-T')).toThrow('Invalid quote currency');
      expect(() => createSymbol('hyperliquid', 'BTC', 'US/DT')).toThrow('Invalid quote currency');
    });

    test('works with all supported exchanges', () => {
      expect(createSymbol('hyperliquid', 'BTC')).toBe('BTC/USDT:USDT');
      expect(createSymbol('lighter', 'BTC')).toBe('BTC/USDT:USDT');
      expect(createSymbol('grvt', 'BTC')).toBe('BTC/USDT:USDT');
      expect(createSymbol('paradex', 'BTC')).toBe('BTC/USDT:USDT');
      expect(createSymbol('edgex', 'BTC')).toBe('BTC/USDT:USDT');
      expect(createSymbol('backpack', 'BTC')).toBe('BTC/USDT:USDT');
    });

    test('handles numeric characters in symbols', () => {
      expect(createSymbol('hyperliquid', '1INCH')).toBe('1INCH/USDT:USDT');
      expect(createSymbol('lighter', 'APE3S')).toBe('APE3S/USDT:USDT');
    });
  });

  describe('parseSymbol', () => {
    test('parses perpetual symbol correctly', () => {
      const parts = parseSymbol('BTC/USDT:USDT');

      expect(parts).toEqual({
        base: 'BTC',
        quote: 'USDT',
        settle: 'USDT',
        type: 'swap',
      });
    });

    test('parses spot symbol correctly', () => {
      const parts = parseSymbol('ETH/USDC');

      expect(parts).toEqual({
        base: 'ETH',
        quote: 'USDC',
        settle: 'USDC',
        type: 'spot',
      });
    });

    test('throws on invalid format', () => {
      expect(() => parseSymbol('INVALID')).toThrow();
      expect(() => parseSymbol('BTC/')).toThrow();
      expect(() => parseSymbol('/USDT')).toThrow();
    });
  });

  describe('buildSymbol', () => {
    test('builds perpetual symbol', () => {
      const symbol = buildSymbol('BTC', 'USDT', 'USDT');
      expect(symbol).toBe('BTC/USDT:USDT');
    });

    test('builds spot symbol', () => {
      const symbol = buildSymbol('ETH', 'USDC');
      expect(symbol).toBe('ETH/USDC');
    });

    test('builds perpetual even without settle param if quote matches', () => {
      const symbol = buildSymbol('BTC', 'USDT', 'USDT');
      expect(symbol).toBe('BTC/USDT:USDT');
    });
  });

  describe('isValidSymbol', () => {
    test('validates correct symbols', () => {
      expect(isValidSymbol('BTC/USDT:USDT')).toBe(true);
      expect(isValidSymbol('ETH/USDC')).toBe(true);
      expect(isValidSymbol('SOL/USDT:USDT')).toBe(true);
    });

    test('rejects invalid symbols', () => {
      expect(isValidSymbol('INVALID')).toBe(false);
      expect(isValidSymbol('BTC/')).toBe(false);
      expect(isValidSymbol('/USDT')).toBe(false);
      expect(isValidSymbol('')).toBe(false);
    });
  });

  describe('getBaseCurrency', () => {
    test('extracts base from perpetual', () => {
      expect(getBaseCurrency('BTC/USDT:USDT')).toBe('BTC');
    });

    test('extracts base from spot', () => {
      expect(getBaseCurrency('ETH/USDC')).toBe('ETH');
    });
  });

  describe('getQuoteCurrency', () => {
    test('extracts quote from perpetual', () => {
      expect(getQuoteCurrency('BTC/USDT:USDT')).toBe('USDT');
    });

    test('extracts quote from spot', () => {
      expect(getQuoteCurrency('ETH/USDC')).toBe('USDC');
    });
  });

  describe('getSettleCurrency', () => {
    test('extracts settlement from perpetual', () => {
      expect(getSettleCurrency('BTC/USDT:USDT')).toBe('USDT');
    });

    test('returns quote as settlement for spot', () => {
      expect(getSettleCurrency('ETH/USDC')).toBe('USDC');
    });
  });

  describe('isPerpetual', () => {
    test('identifies perpetuals', () => {
      expect(isPerpetual('BTC/USDT:USDT')).toBe(true);
      expect(isPerpetual('ETH/USDC:USDC')).toBe(true);
    });

    test('identifies spot as non-perpetual', () => {
      expect(isPerpetual('BTC/USDT')).toBe(false);
      expect(isPerpetual('ETH/USDC')).toBe(false);
    });
  });

  describe('normalizeSymbol', () => {
    test('normalizes valid symbols', () => {
      expect(normalizeSymbol('btc/usdt:usdt')).toBe('BTC/USDT:USDT');
      expect(normalizeSymbol('eth/usdc')).toBe('ETH/USDC');
    });

    test('normalizes PERP suffix', () => {
      expect(normalizeSymbol('BTC-PERP')).toBe('BTC/USDT:USDT');
      expect(normalizeSymbol('ETH_PERPETUAL')).toBe('ETH/USDT:USDT');
    });

    test('throws on invalid symbols', () => {
      expect(() => normalizeSymbol('INVALID')).toThrow();
    });
  });

  describe('compareSymbols', () => {
    test('identifies matching symbols', () => {
      expect(compareSymbols('BTC/USDT:USDT', 'BTC/USDT:USDT')).toBe(true);
    });

    test('identifies different symbols', () => {
      expect(compareSymbols('BTC/USDT:USDT', 'ETH/USDT:USDT')).toBe(false);
    });

    test('identifies spot vs perpetual', () => {
      expect(compareSymbols('BTC/USDT', 'BTC/USDT:USDT')).toBe(false);
    });

    test('handles invalid symbols', () => {
      expect(compareSymbols('INVALID', 'BTC/USDT:USDT')).toBe(false);
    });
  });

  describe('filterByBase', () => {
    test('filters symbols by base currency', () => {
      const symbols = [
        'BTC/USDT:USDT',
        'ETH/USDT:USDT',
        'BTC/USDC:USDC',
        'SOL/USDT:USDT',
      ];

      const btcSymbols = filterByBase(symbols, 'BTC');
      expect(btcSymbols).toHaveLength(2);
      expect(btcSymbols).toContain('BTC/USDT:USDT');
      expect(btcSymbols).toContain('BTC/USDC:USDC');
    });

    test('handles empty result', () => {
      const symbols = ['ETH/USDT:USDT', 'SOL/USDT:USDT'];
      const btcSymbols = filterByBase(symbols, 'BTC');
      expect(btcSymbols).toHaveLength(0);
    });

    test('ignores invalid symbols', () => {
      const symbols = ['BTC/USDT:USDT', 'INVALID', 'ETH/USDT:USDT'];
      const btcSymbols = filterByBase(symbols, 'BTC');
      expect(btcSymbols).toHaveLength(1);
    });
  });

  describe('filterByQuote', () => {
    test('filters symbols by quote currency', () => {
      const symbols = [
        'BTC/USDT:USDT',
        'ETH/USDC:USDC',
        'BTC/USDC:USDC',
        'SOL/USDT:USDT',
      ];

      const usdtSymbols = filterByQuote(symbols, 'USDT');
      expect(usdtSymbols).toHaveLength(2);
      expect(usdtSymbols).toContain('BTC/USDT:USDT');
      expect(usdtSymbols).toContain('SOL/USDT:USDT');
    });
  });

  describe('groupByBase', () => {
    test('groups symbols by base currency', () => {
      const symbols = [
        'BTC/USDT:USDT',
        'ETH/USDT:USDT',
        'BTC/USDC:USDC',
        'ETH/USDC:USDC',
      ];

      const groups = groupByBase(symbols);

      expect(groups.size).toBe(2);
      expect(groups.get('BTC')).toEqual(['BTC/USDT:USDT', 'BTC/USDC:USDC']);
      expect(groups.get('ETH')).toEqual(['ETH/USDT:USDT', 'ETH/USDC:USDC']);
    });

    test('handles empty input', () => {
      const groups = groupByBase([]);
      expect(groups.size).toBe(0);
    });

    test('ignores invalid symbols', () => {
      const symbols = ['BTC/USDT:USDT', 'INVALID', 'ETH/USDT:USDT'];
      const groups = groupByBase(symbols);
      expect(groups.size).toBe(2);
    });
  });
});
