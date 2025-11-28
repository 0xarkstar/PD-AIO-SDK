/**
 * Factory Function Unit Tests
 */

import { createExchange, getSupportedExchanges, isExchangeSupported } from '../../src/factory.js';
import { HyperliquidAdapter } from '../../src/adapters/hyperliquid/index.js';

describe('createExchange', () => {
  test('creates Hyperliquid adapter', () => {
    const exchange = createExchange('hyperliquid', { testnet: true });

    expect(exchange).toBeInstanceOf(HyperliquidAdapter);
    expect(exchange.id).toBe('hyperliquid');
    expect(exchange.name).toBe('Hyperliquid');
  });

  test('throws for unimplemented exchanges', () => {
    expect(() => createExchange('lighter')).toThrow('Lighter adapter not yet implemented');
    expect(() => createExchange('grvt')).toThrow('GRVT adapter not yet implemented');
    expect(() => createExchange('paradex')).toThrow('Paradex adapter not yet implemented');
    expect(() => createExchange('edgex')).toThrow('EdgeX adapter not yet implemented');
    expect(() => createExchange('backpack')).toThrow('Backpack adapter not yet implemented');
  });

  test('passes config to adapter', () => {
    const exchange = createExchange('hyperliquid', {
      testnet: true,
      debug: true,
      timeout: 60000,
    });

    expect(exchange.isReady).toBe(false);
  });
});

describe('getSupportedExchanges', () => {
  test('returns all supported exchange identifiers', () => {
    const exchanges = getSupportedExchanges();

    expect(exchanges).toEqual([
      'hyperliquid',
      'lighter',
      'grvt',
      'paradex',
      'edgex',
      'backpack',
    ]);
  });
});

describe('isExchangeSupported', () => {
  test('returns true for supported exchanges', () => {
    expect(isExchangeSupported('hyperliquid')).toBe(true);
    expect(isExchangeSupported('lighter')).toBe(true);
    expect(isExchangeSupported('grvt')).toBe(true);
  });

  test('returns false for unsupported exchanges', () => {
    expect(isExchangeSupported('binance')).toBe(false);
    expect(isExchangeSupported('dydx')).toBe(false);
    expect(isExchangeSupported('invalid')).toBe(false);
  });
});
