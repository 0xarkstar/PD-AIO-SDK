/**
 * Factory Function Unit Tests
 */

import { createExchange, getSupportedExchanges, isExchangeSupported } from '../../src/factory.js';
import { HyperliquidAdapter } from '../../src/adapters/hyperliquid/index.js';
import { LighterAdapter } from '../../src/adapters/lighter/index.js';
import { GRVTAdapter } from '../../src/adapters/grvt/index.js';
import { ParadexAdapter } from '../../src/adapters/paradex/index.js';
import { EdgeXAdapter } from '../../src/adapters/edgex/index.js';
import { BackpackAdapter } from '../../src/adapters/backpack/index.js';
import { NadoAdapter } from '../../src/adapters/nado/index.js';

describe('createExchange', () => {
  test('creates Hyperliquid adapter', () => {
    const exchange = createExchange('hyperliquid', { testnet: true });

    expect(exchange).toBeInstanceOf(HyperliquidAdapter);
    expect(exchange.id).toBe('hyperliquid');
    expect(exchange.name).toBe('Hyperliquid');
  });

  test('creates all exchange adapters', () => {
    expect(createExchange('lighter', {})).toBeInstanceOf(LighterAdapter);
    expect(createExchange('grvt', { apiKey: 'test-key' })).toBeInstanceOf(GRVTAdapter);
    expect(createExchange('paradex', { apiKey: 'test-key' })).toBeInstanceOf(ParadexAdapter);
    expect(createExchange('edgex', { apiKey: 'test-key' })).toBeInstanceOf(EdgeXAdapter);
    expect(createExchange('backpack', { apiKey: 'test-key' })).toBeInstanceOf(BackpackAdapter);
    expect(
      createExchange('nado', {
        testnet: true,
        privateKey: '0x0000000000000000000000000000000000000000000000000000000000000001',
      })
    ).toBeInstanceOf(NadoAdapter);
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
      'nado',
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
