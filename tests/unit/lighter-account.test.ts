/**
 * LighterAccount Unit Tests
 *
 * Tests for account data fetching: positions, balance, open orders, order history, trades.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  fetchPositionsData,
  fetchBalanceData,
  fetchOpenOrdersData,
  fetchOrderHistoryData,
  fetchMyTradesData,
} from '../../src/adapters/lighter/LighterAccount.js';
import type { AccountDeps } from '../../src/adapters/lighter/LighterAccount.js';

function createMockDeps(overrides: Partial<AccountDeps> = {}): AccountDeps {
  return {
    normalizer: {
      toLighterSymbol: jest.fn((s: string) => s.replace('/USDC:USDC', 'USDC')),
      normalizePosition: jest.fn((p: any) => ({
        symbol: 'BTC/USDC:USDC',
        side: 'long',
        size: parseFloat(p.size || '0'),
        entryPrice: parseFloat(p.entry_price || '0'),
        markPrice: parseFloat(p.mark_price || '0'),
        unrealizedPnl: 0,
        leverage: 10,
        info: p,
      })),
      normalizeBalance: jest.fn((b: any) => ({
        currency: b.currency || 'USDC',
        total: parseFloat(b.total || '0'),
        free: parseFloat(b.available || '0'),
        used: parseFloat(b.locked || '0'),
      })),
      normalizeOrder: jest.fn((o: any) => ({
        id: o.order_id || '1',
        symbol: 'BTC/USDC:USDC',
        type: 'limit',
        side: o.side || 'buy',
        price: parseFloat(o.price || '0'),
        amount: parseFloat(o.size || '0'),
        filled: 0,
        remaining: parseFloat(o.size || '0'),
        status: o.status || 'open',
        timestamp: o.timestamp || Date.now(),
        info: o,
      })),
      normalizeTrade: jest.fn((t: any) => ({
        id: t.trade_id || '1',
        symbol: 'BTC/USDC:USDC',
        side: t.side || 'buy',
        price: parseFloat(t.price || '0'),
        amount: parseFloat(t.size || '0'),
        cost: 0,
        timestamp: t.timestamp || Date.now(),
        info: t,
      })),
    } as any,
    request: jest.fn(),
    ...overrides,
  };
}

describe('LighterAccount', () => {
  let deps: AccountDeps;

  beforeEach(() => {
    deps = createMockDeps();
  });

  // =========================================================================
  // fetchPositionsData
  // =========================================================================
  describe('fetchPositionsData', () => {
    it('should fetch and normalize positions', async () => {
      (deps.request as jest.Mock).mockResolvedValue([
        { symbol: 'BTCUSDC', size: '0.5', entry_price: '36000', mark_price: '36500' },
      ]);

      const result = await fetchPositionsData(deps);
      expect(result).toHaveLength(1);
      expect(deps.normalizer.normalizePosition).toHaveBeenCalled();
    });

    it('should filter positions by symbols', async () => {
      // normalizePosition returns 'BTC/USDC:USDC' for all mocked items,
      // so filter should match all normalized positions
      (deps.request as jest.Mock).mockResolvedValue([
        { symbol: 'BTCUSDC', size: '0.5' },
        { symbol: 'ETHUSDC', size: '2.0' },
      ]);

      const result = await fetchPositionsData(deps, ['BTC/USDC:USDC']);
      // Mock always normalizes to BTC/USDC:USDC so both match
      expect(result).toHaveLength(2);
    });

    it('should exclude positions not matching filter', async () => {
      (deps.request as jest.Mock).mockResolvedValue([
        { symbol: 'BTCUSDC', size: '0.5' },
      ]);

      const result = await fetchPositionsData(deps, ['ETH/USDC:USDC']);
      // Mock normalizes to BTC/USDC:USDC which doesn't match ETH
      expect(result).toHaveLength(0);
    });

    it('should throw on invalid response', async () => {
      (deps.request as jest.Mock).mockResolvedValue({ invalid: true });

      await expect(fetchPositionsData(deps)).rejects.toThrow('Invalid positions response');
    });

    it('should handle request error', async () => {
      (deps.request as jest.Mock).mockRejectedValue(new Error('network error'));

      await expect(fetchPositionsData(deps)).rejects.toThrow();
    });

    it('should return empty for empty array response', async () => {
      (deps.request as jest.Mock).mockResolvedValue([]);

      const result = await fetchPositionsData(deps);
      expect(result).toHaveLength(0);
    });
  });

  // =========================================================================
  // fetchBalanceData
  // =========================================================================
  describe('fetchBalanceData', () => {
    it('should fetch and normalize balances', async () => {
      (deps.request as jest.Mock).mockResolvedValue([
        { currency: 'USDC', total: '10000', available: '8000', locked: '2000' },
      ]);

      const result = await fetchBalanceData(deps);
      expect(result).toHaveLength(1);
      expect(deps.normalizer.normalizeBalance).toHaveBeenCalled();
    });

    it('should throw on non-array response', async () => {
      (deps.request as jest.Mock).mockResolvedValue('not an array');

      await expect(fetchBalanceData(deps)).rejects.toThrow('Invalid balance response');
    });

    it('should handle request error', async () => {
      (deps.request as jest.Mock).mockRejectedValue(new Error('timeout'));

      await expect(fetchBalanceData(deps)).rejects.toThrow();
    });
  });

  // =========================================================================
  // fetchOpenOrdersData
  // =========================================================================
  describe('fetchOpenOrdersData', () => {
    it('should fetch open orders without symbol', async () => {
      (deps.request as jest.Mock).mockResolvedValue([{ order_id: '1', side: 'buy', size: '0.1' }]);

      const result = await fetchOpenOrdersData(deps);
      expect(result).toHaveLength(1);
      expect(deps.request).toHaveBeenCalledWith('GET', '/api/v1/accountActiveOrders');
    });

    it('should fetch open orders with symbol filter', async () => {
      (deps.request as jest.Mock).mockResolvedValue([]);

      await fetchOpenOrdersData(deps, 'BTC/USDC:USDC');
      expect(deps.request).toHaveBeenCalledWith(
        'GET',
        expect.stringContaining('symbol=BTCUSDC')
      );
    });

    it('should throw on non-array response', async () => {
      (deps.request as jest.Mock).mockResolvedValue({});

      await expect(fetchOpenOrdersData(deps)).rejects.toThrow('Invalid open orders response');
    });
  });

  // =========================================================================
  // fetchOrderHistoryData
  // =========================================================================
  describe('fetchOrderHistoryData', () => {
    it('should fetch order history without params', async () => {
      (deps.request as jest.Mock).mockResolvedValue([{ order_id: '1' }]);

      const result = await fetchOrderHistoryData(deps);
      expect(result).toHaveLength(1);
      expect(deps.request).toHaveBeenCalledWith('GET', '/api/v1/accountInactiveOrders');
    });

    it('should include symbol param', async () => {
      (deps.request as jest.Mock).mockResolvedValue([]);

      await fetchOrderHistoryData(deps, 'BTC/USDC:USDC');
      expect(deps.request).toHaveBeenCalledWith(
        'GET',
        expect.stringContaining('symbol=BTCUSDC')
      );
    });

    it('should include since param', async () => {
      (deps.request as jest.Mock).mockResolvedValue([]);

      await fetchOrderHistoryData(deps, undefined, 1700000000000);
      expect(deps.request).toHaveBeenCalledWith(
        'GET',
        expect.stringContaining('startTime=1700000000000')
      );
    });

    it('should include limit param', async () => {
      (deps.request as jest.Mock).mockResolvedValue([]);

      await fetchOrderHistoryData(deps, undefined, undefined, 50);
      expect(deps.request).toHaveBeenCalledWith(
        'GET',
        expect.stringContaining('limit=50')
      );
    });

    it('should include all params combined', async () => {
      (deps.request as jest.Mock).mockResolvedValue([]);

      await fetchOrderHistoryData(deps, 'BTC/USDC:USDC', 1700000000000, 10);
      const calledUrl = (deps.request as jest.Mock).mock.calls[0][1] as string;
      expect(calledUrl).toContain('symbol=');
      expect(calledUrl).toContain('startTime=');
      expect(calledUrl).toContain('limit=');
    });

    it('should throw on non-array response', async () => {
      (deps.request as jest.Mock).mockResolvedValue(null);

      await expect(fetchOrderHistoryData(deps)).rejects.toThrow('Invalid order history response');
    });
  });

  // =========================================================================
  // fetchMyTradesData
  // =========================================================================
  describe('fetchMyTradesData', () => {
    it('should fetch trades without params', async () => {
      (deps.request as jest.Mock).mockResolvedValue([{ trade_id: '1', side: 'buy' }]);

      const result = await fetchMyTradesData(deps);
      expect(result).toHaveLength(1);
      expect(deps.request).toHaveBeenCalledWith('GET', '/api/v1/accountFills');
    });

    it('should include symbol param', async () => {
      (deps.request as jest.Mock).mockResolvedValue([]);

      await fetchMyTradesData(deps, 'BTC/USDC:USDC');
      expect(deps.request).toHaveBeenCalledWith(
        'GET',
        expect.stringContaining('symbol=BTCUSDC')
      );
    });

    it('should include all params', async () => {
      (deps.request as jest.Mock).mockResolvedValue([]);

      await fetchMyTradesData(deps, 'ETH/USDC:USDC', 1700000000000, 25);
      const calledUrl = (deps.request as jest.Mock).mock.calls[0][1] as string;
      expect(calledUrl).toContain('symbol=');
      expect(calledUrl).toContain('startTime=');
      expect(calledUrl).toContain('limit=');
    });

    it('should throw on non-array response', async () => {
      (deps.request as jest.Mock).mockResolvedValue('string');

      await expect(fetchMyTradesData(deps)).rejects.toThrow('Invalid trade history response');
    });
  });
});
