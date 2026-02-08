/**
 * Multi-Adapter Operations Tests
 *
 * Tests operations across multiple adapters simultaneously
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { HyperliquidAdapter } from '../../src/adapters/hyperliquid/index.js';
import { BackpackAdapter } from '../../src/adapters/backpack/index.js';
import { LighterAdapter } from '../../src/adapters/lighter/index.js';
import type { IExchangeAdapter } from '../../src/types/index.js';

// Store original fetch
const originalFetch = global.fetch;

// Mock WebSocketManager
jest.mock('../../src/websocket/WebSocketManager.js', () => ({
  WebSocketManager: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    send: jest.fn(),
    isConnected: false,
  })),
}));

describe('Multi-Adapter Operations', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('should fetch markets from all adapters in parallel', async () => {
    // Mock responses for each adapter
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ universe: [{ name: 'BTC' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ order_book_details: [{ symbol: 'BTC-USD', market_type: 'perp' }] }),
      });

    const adapter1 = new HyperliquidAdapter({
      testnet: true,
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });
    const adapter2 = new LighterAdapter({
      testnet: true,
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });

    await adapter1.initialize();
    await adapter2.initialize();

    const adapters = [adapter1, adapter2];

    // Fetch markets in parallel
    const results = await Promise.all(adapters.map((a) => a.fetchMarkets()));

    expect(results).toHaveLength(2);
    results.forEach((markets) => {
      expect(Array.isArray(markets)).toBe(true);
    });

    // Cleanup
    await Promise.all(adapters.map((a) => a.disconnect()));
  });

  test('should handle mixed success/failure scenarios', async () => {
    // First succeeds, second fails
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ universe: [] }),
      })
      .mockRejectedValueOnce(new Error('Network error'));

    const adapter1 = new HyperliquidAdapter({
      testnet: true,
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });
    const adapter2 = new LighterAdapter({
      testnet: true,
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });

    await adapter1.initialize();
    await adapter2.initialize();

    const results = await Promise.allSettled([
      adapter1.fetchMarkets(),
      adapter2.fetchMarkets(),
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('rejected');

    // Cleanup
    await adapter1.disconnect();
    await adapter2.disconnect();
  });

  test('should compare normalized data across adapters', async () => {
    // Mock BTC market from 2 adapters
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          universe: [{ name: 'BTC', szDecimals: 5, maxLeverage: 50 }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ order_book_details: [{ symbol: 'BTC-USD', market_type: 'perp' }] }),
      });

    const adapter1 = new HyperliquidAdapter({
      testnet: true,
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });
    const adapter2 = new LighterAdapter({
      testnet: true,
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });

    await adapter1.initialize();
    await adapter2.initialize();

    const results = await Promise.all([
      adapter1.fetchMarkets(),
      adapter2.fetchMarkets(),
    ]);

    // All adapters should return markets array
    results.forEach((markets) => {
      expect(Array.isArray(markets)).toBe(true);
    });

    // If markets exist, verify unified format includes required fields
    results.forEach((markets) => {
      if (markets.length > 0) {
        expect(markets[0]).toHaveProperty('symbol');
        expect(markets[0]).toHaveProperty('base');
        expect(markets[0]).toHaveProperty('quote');
      }
    });

    // Cleanup
    await adapter1.disconnect();
    await adapter2.disconnect();
  });

  test('should handle rate limits across multiple adapters', async () => {
    // First adapter hits rate limit, second succeeds
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Rate limit exceeded' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ universe: [] }),
      });

    const adapter1 = new LighterAdapter({
      testnet: true,
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });
    const adapter2 = new HyperliquidAdapter({
      testnet: true,
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });

    await adapter1.initialize();
    await adapter2.initialize();

    const results = await Promise.allSettled([
      adapter1.fetchMarkets(),
      adapter2.fetchMarkets(),
    ]);

    // First should fail with rate limit, second succeeds
    expect(results[0].status).toBe('rejected');
    expect(results[1].status).toBe('fulfilled');

    // Cleanup
    await adapter1.disconnect();
    await adapter2.disconnect();
  });

  test('should isolate errors per adapter', async () => {
    // One adapter errors shouldn't affect others
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ order_book_details: [] }),
      })
      .mockRejectedValueOnce(new Error('Fatal error in adapter 2'));

    const adapter1 = new LighterAdapter({
      testnet: true,
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });
    const adapter2 = new HyperliquidAdapter({
      testnet: true,
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });

    await adapter1.initialize();
    await adapter2.initialize();

    // Adapter 1 succeeds
    const markets = await adapter1.fetchMarkets();
    expect(Array.isArray(markets)).toBe(true);

    // Adapter 2 fails
    await expect(adapter2.fetchMarkets()).rejects.toThrow();

    await adapter1.disconnect();
    await adapter2.disconnect();
  });

  test('should handle concurrent market data fetches', async () => {
    // Mock successful responses from different exchanges
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ universe: [{ name: 'ETH', szDecimals: 4 }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ order_book_details: [{ symbol: 'ETH-USD', market_type: 'perp' }] }),
      });

    const adapter1 = new HyperliquidAdapter({
      testnet: true,
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });
    const adapter2 = new LighterAdapter({
      testnet: true,
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });

    await adapter1.initialize();
    await adapter2.initialize();

    // Fetch markets in parallel
    const results = await Promise.all([
      adapter1.fetchMarkets(),
      adapter2.fetchMarkets(),
    ]);

    expect(results).toHaveLength(2);
    results.forEach((markets) => {
      expect(Array.isArray(markets)).toBe(true);
    });

    await adapter1.disconnect();
    await adapter2.disconnect();
  });

  test('should handle errors independently per adapter', async () => {
    // First adapter succeeds, second fails
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ universe: [] }),
      })
      .mockRejectedValueOnce(new Error('Timeout'));

    const adapter1 = new HyperliquidAdapter({
      testnet: true,
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });
    const adapter2 = new LighterAdapter({
      testnet: true,
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });

    await adapter1.initialize();
    await adapter2.initialize();

    const results = await Promise.allSettled([
      adapter1.fetchMarkets(),
      adapter2.fetchMarkets(),
    ]);

    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('rejected');

    await adapter1.disconnect();
    await adapter2.disconnect();
  });

  test('should handle partial failures gracefully', async () => {
    // First succeeds, second fails
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ universe: [{ name: 'SOL' }] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

    const adapter1 = new HyperliquidAdapter({
      testnet: true,
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });
    const adapter2 = new LighterAdapter({
      testnet: true,
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });

    await adapter1.initialize();
    await adapter2.initialize();

    const results = await Promise.allSettled([
      adapter1.fetchMarkets(),
      adapter2.fetchMarkets(),
    ]);

    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('rejected');

    await adapter1.disconnect();
    await adapter2.disconnect();
  });

  test('should support WebSocket capabilities across adapters', async () => {
    // This test verifies that WebSocket capabilities are properly initialized
    const adapter1 = new HyperliquidAdapter({
      testnet: true,
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });
    const adapter2 = new LighterAdapter({
      testnet: true,
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });

    await adapter1.initialize();
    await adapter2.initialize();

    // Verify both adapters support watchOrderBook
    expect(adapter1.has.watchOrderBook).toBe(true);
    expect(adapter2.has.watchOrderBook).toBe(true);

    // Note: Full WS testing requires more complex mocking
    // This test just verifies the capability exists

    await adapter1.disconnect();
    await adapter2.disconnect();
  });

  test('should maintain adapter independence', async () => {
    // Verify adapters work independently without interfering
    const adapter1 = new HyperliquidAdapter({
      testnet: true,
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });
    const adapter2 = new LighterAdapter({
      testnet: true,
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });

    await adapter1.initialize();
    await adapter2.initialize();

    // Both should be ready
    expect(adapter1.isReady).toBe(true);
    expect(adapter2.isReady).toBe(true);

    // Both should be distinct instances
    expect(adapter1).not.toBe(adapter2);

    await adapter1.disconnect();
    await adapter2.disconnect();
  });
});
