/**
 * Factory Function Unit Tests
 */

import {
  createExchange,
  getSupportedExchanges,
  isExchangeSupported,
  registerExchange,
  unregisterExchange,
  getBuiltInExchanges,
  isBuiltInExchange,
} from '../../src/factory.js';
import { HyperliquidAdapter } from '../../src/adapters/hyperliquid/index.js';
import { LighterAdapter } from '../../src/adapters/lighter/index.js';
import { GRVTAdapter } from '../../src/adapters/grvt/index.js';
import { ParadexAdapter } from '../../src/adapters/paradex/index.js';
import { EdgeXAdapter } from '../../src/adapters/edgex/index.js';
import { BackpackAdapter } from '../../src/adapters/backpack/index.js';
import { NadoAdapter } from '../../src/adapters/nado/index.js';
import { BaseAdapter } from '../../src/adapters/base/BaseAdapter.js';
import type { IExchangeAdapter, FeatureMap, Market, Ticker, OrderBook, Trade, FundingRate, Position, Balance, Order, OrderRequest } from '../../src/types/index.js';

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
      'variational',
      'extended',
      'dydx',
      'jupiter',
      'drift',
      'gmx',
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
    expect(isExchangeSupported('ftx')).toBe(false);
    expect(isExchangeSupported('invalid')).toBe(false);
  });

  test('returns true for new adapters', () => {
    expect(isExchangeSupported('dydx')).toBe(true);
    expect(isExchangeSupported('jupiter')).toBe(true);
    expect(isExchangeSupported('drift')).toBe(true);
    expect(isExchangeSupported('gmx')).toBe(true);
  });
});

describe('getBuiltInExchanges', () => {
  test('returns all built-in exchange identifiers', () => {
    const exchanges = getBuiltInExchanges();

    expect(exchanges).toContain('hyperliquid');
    expect(exchanges).toContain('lighter');
    expect(exchanges).toContain('grvt');
    expect(exchanges).toContain('paradex');
    expect(exchanges).toContain('edgex');
    expect(exchanges).toContain('backpack');
    expect(exchanges).toContain('nado');
    expect(exchanges.length).toBe(13);
  });
});

describe('isBuiltInExchange', () => {
  test('returns true for built-in exchanges', () => {
    expect(isBuiltInExchange('hyperliquid')).toBe(true);
    expect(isBuiltInExchange('lighter')).toBe(true);
  });

  test('returns false for non-built-in exchanges', () => {
    expect(isBuiltInExchange('custom')).toBe(false);
    expect(isBuiltInExchange('binance')).toBe(false);
  });
});

describe('registerExchange / unregisterExchange', () => {
  // Create a mock adapter for testing
  class MockAdapter extends BaseAdapter {
    readonly id = 'mock';
    readonly name = 'Mock Exchange';
    readonly has: Partial<FeatureMap> = {
      fetchMarkets: true,
      fetchTicker: true,
    };

    async initialize(): Promise<void> {
      this._isReady = true;
    }

    async fetchMarkets(): Promise<Market[]> {
      return [];
    }

    async fetchTicker(symbol: string): Promise<Ticker> {
      return {
        symbol,
        timestamp: Date.now(),
        datetime: new Date().toISOString(),
        high: 0,
        low: 0,
        bid: 0,
        ask: 0,
        last: 0,
        close: 0,
        baseVolume: 0,
        quoteVolume: 0,
        info: {},
      };
    }

    async fetchOrderBook(symbol: string): Promise<OrderBook> {
      return { symbol, bids: [], asks: [], timestamp: Date.now() };
    }

    async fetchTrades(symbol: string): Promise<Trade[]> {
      return [];
    }

    async fetchFundingRate(symbol: string): Promise<FundingRate> {
      return {
        symbol,
        fundingRate: 0,
        fundingTimestamp: Date.now(),
        nextFundingTimestamp: Date.now() + 3600000,
        info: {},
      };
    }

    async fetchFundingRateHistory(): Promise<FundingRate[]> {
      return [];
    }

    async fetchPositions(): Promise<Position[]> {
      return [];
    }

    async fetchBalance(): Promise<Balance[]> {
      return [];
    }

    async createOrder(request: OrderRequest): Promise<Order> {
      throw new Error('Not implemented');
    }

    async cancelOrder(orderId: string): Promise<Order> {
      throw new Error('Not implemented');
    }

    async cancelAllOrders(): Promise<Order[]> {
      return [];
    }

    async fetchOrderHistory(): Promise<Order[]> {
      return [];
    }

    async fetchMyTrades(): Promise<Trade[]> {
      return [];
    }

    async setLeverage(): Promise<void> {
      // No-op
    }

    protected symbolToExchange(symbol: string): string {
      return symbol;
    }

    protected symbolFromExchange(exchangeSymbol: string): string {
      return exchangeSymbol;
    }
  }

  afterEach(() => {
    // Clean up any registered test adapters
    unregisterExchange('mock');
    unregisterExchange('testexchange');
  });

  test('registers a custom adapter', () => {
    expect(isExchangeSupported('mock')).toBe(false);

    registerExchange('mock', MockAdapter);

    expect(isExchangeSupported('mock')).toBe(true);
    expect(getSupportedExchanges()).toContain('mock');
  });

  test('creates instance of registered adapter', () => {
    registerExchange('mock', MockAdapter);

    const adapter = createExchange('mock' as any);

    expect(adapter).toBeInstanceOf(MockAdapter);
    expect(adapter.id).toBe('mock');
    expect(adapter.name).toBe('Mock Exchange');
  });

  test('unregisters an adapter', () => {
    registerExchange('testexchange', MockAdapter);
    expect(isExchangeSupported('testexchange')).toBe(true);

    const result = unregisterExchange('testexchange');

    expect(result).toBe(true);
    expect(isExchangeSupported('testexchange')).toBe(false);
  });

  test('unregister returns false for non-existent adapter', () => {
    const result = unregisterExchange('nonexistent');
    expect(result).toBe(false);
  });

  test('registration is case-insensitive', () => {
    registerExchange('MOCK', MockAdapter);

    expect(isExchangeSupported('mock')).toBe(true);
    expect(isExchangeSupported('MOCK')).toBe(true);
  });

  test('throws error for unknown exchange', () => {
    expect(() => createExchange('unknown' as any)).toThrow(/Unknown exchange: unknown/);
  });

  test('error message includes supported exchanges', () => {
    expect(() => createExchange('unknown' as any)).toThrow(/Supported exchanges:/);
  });
});
