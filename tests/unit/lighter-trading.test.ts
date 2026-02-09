/**
 * LighterTrading Unit Tests
 *
 * Tests for WASM and HMAC order creation, cancellation, and collateral withdrawal.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  createOrderWasm,
  createOrderHMAC,
  cancelOrderWasm,
  cancelOrderHMAC,
  cancelAllOrdersWasm,
  cancelAllOrdersHMAC,
  withdrawCollateral,
} from '../../src/adapters/lighter/LighterTrading.js';
import type { TradingDeps } from '../../src/adapters/lighter/LighterTrading.js';
import { InvalidOrderError, PerpDEXError } from '../../src/types/errors.js';

function createMockDeps(overrides: Partial<TradingDeps> = {}): TradingDeps {
  return {
    normalizer: {
      toLighterSymbol: jest.fn((s: string) => s.replace('/USDC:USDC', 'USDC')),
      normalizeOrder: jest.fn((order: any) => ({
        id: order.order_id || '123',
        symbol: 'BTC/USDC:USDC',
        type: 'limit',
        side: 'buy',
        price: 36000,
        amount: 0.1,
        filled: 0,
        remaining: 0.1,
        status: 'open',
        timestamp: Date.now(),
        info: order,
      })),
    } as any,
    signer: {
      isInitialized: true,
      signCreateOrder: jest.fn(async () => ({ txType: 1, txInfo: '{}', txHash: '0xabc' })),
      signCancelOrder: jest.fn(async () => ({ txType: 2, txInfo: '{}', txHash: '0xdef' })),
      signCancelAllOrders: jest.fn(async () => ({ txType: 3, txInfo: '{}', txHash: '0xghi' })),
      signWithdrawCollateral: jest.fn(async () => ({ txType: 4, txInfo: '{}', txHash: '0xjkl' })),
      createAuthToken: jest.fn(async () => 'mock-token'),
    } as any,
    nonceManager: {
      getNextNonce: jest.fn(async () => BigInt(1)),
      rollback: jest.fn(),
    } as any,
    apiKey: 'test-key',
    apiSecret: 'test-secret',
    marketIdCache: new Map([['BTCUSDC', 0], ['ETHUSDC', 1]]),
    marketMetadataCache: new Map([
      ['BTCUSDC', { baseDecimals: 8, quoteDecimals: 6, tickSize: 0.01, stepSize: 0.001 }],
      ['ETHUSDC', { baseDecimals: 8, quoteDecimals: 6, tickSize: 0.01, stepSize: 0.01 }],
    ]),
    fetchMarkets: jest.fn(async () => {}),
    request: jest.fn(async () => ({ code: 0, order: { order_id: '123' } })),
    handleTransactionError: jest.fn(async () => {}),
    ...overrides,
  };
}

describe('LighterTrading', () => {
  let deps: TradingDeps;

  beforeEach(() => {
    deps = createMockDeps();
  });

  // =========================================================================
  // createOrderWasm
  // =========================================================================
  describe('createOrderWasm', () => {
    const orderRequest = {
      symbol: 'BTC/USDC:USDC',
      type: 'limit' as const,
      side: 'buy' as const,
      amount: 0.1,
      price: 36000,
    };

    it('should create order successfully', async () => {
      const result = await createOrderWasm(deps, orderRequest);
      expect(result).toBeDefined();
      expect(result.id).toBe('123');
      expect(deps.signer!.signCreateOrder).toHaveBeenCalled();
      expect(deps.request).toHaveBeenCalledWith('POST', '/api/v1/sendTx', expect.any(Object));
    });

    it('should fetch markets if market not in cache', async () => {
      deps.marketIdCache.clear();
      // After fetchMarkets, the market should be in cache
      (deps.fetchMarkets as jest.Mock).mockImplementation(async () => {
        deps.marketIdCache.set('BTCUSDC', 0);
        deps.marketMetadataCache.set('BTCUSDC', { baseDecimals: 8, quoteDecimals: 6, tickSize: 0.01, stepSize: 0.001 });
      });

      const result = await createOrderWasm(deps, orderRequest);
      expect(deps.fetchMarkets).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw InvalidOrderError if market not found after fetch', async () => {
      deps.marketIdCache.clear();
      (deps.fetchMarkets as jest.Mock).mockImplementation(async () => {});

      await expect(createOrderWasm(deps, orderRequest)).rejects.toThrow('Market not found');
    });

    it('should throw InvalidOrderError if metadata not found', async () => {
      deps.marketMetadataCache.clear();

      await expect(createOrderWasm(deps, orderRequest)).rejects.toThrow('Market metadata not found');
    });

    it('should throw on non-zero response code', async () => {
      (deps.request as jest.Mock).mockResolvedValue({ code: 1, order: null });

      await expect(createOrderWasm(deps, orderRequest)).rejects.toThrow('Order creation failed');
    });

    it('should call handleTransactionError on non-zero code', async () => {
      (deps.request as jest.Mock).mockResolvedValue({ code: 5, order: null });

      await expect(createOrderWasm(deps, orderRequest)).rejects.toThrow();
      expect(deps.handleTransactionError).toHaveBeenCalledWith(5);
    });

    it('should rollback nonce on signing error', async () => {
      (deps.signer!.signCreateOrder as jest.Mock).mockRejectedValue(new Error('signing failed'));

      await expect(createOrderWasm(deps, orderRequest)).rejects.toThrow();
      expect(deps.nonceManager!.rollback).toHaveBeenCalled();
    });

    it('should not rollback nonce on server error with code', async () => {
      (deps.request as jest.Mock).mockResolvedValue({ code: 3, order: null });

      await expect(createOrderWasm(deps, orderRequest)).rejects.toThrow();
      // Nonce should not be rolled back for server errors (error message includes 'code')
      expect(deps.nonceManager!.rollback).not.toHaveBeenCalled();
    });

    it('should handle sell side order', async () => {
      const sellOrder = { ...orderRequest, side: 'sell' as const };
      await createOrderWasm(deps, sellOrder);

      expect(deps.signer!.signCreateOrder).toHaveBeenCalledWith(
        expect.objectContaining({ isAsk: true })
      );
    });

    it('should handle order with clientOrderId', async () => {
      const orderWithId = { ...orderRequest, clientOrderId: '123456789' };
      await createOrderWasm(deps, orderWithId);
      expect(deps.signer!.signCreateOrder).toHaveBeenCalled();
    });

    it('should handle order with stopPrice', async () => {
      const stopOrder = { ...orderRequest, stopPrice: 35000 };
      await createOrderWasm(deps, stopOrder);
      expect(deps.signer!.signCreateOrder).toHaveBeenCalledWith(
        expect.objectContaining({ triggerPrice: expect.any(Number) })
      );
    });
  });

  // =========================================================================
  // createOrderHMAC
  // =========================================================================
  describe('createOrderHMAC', () => {
    it('should create order via HMAC path', async () => {
      (deps.request as jest.Mock).mockResolvedValue({ order_id: '456' });
      const orderRequest = {
        symbol: 'BTC/USDC:USDC',
        type: 'limit' as const,
        side: 'buy' as const,
        amount: 0.1,
        price: 36000,
      };

      const result = await createOrderHMAC(deps, orderRequest);
      expect(result).toBeDefined();
      expect(deps.request).toHaveBeenCalledWith('POST', '/orders', expect.any(Object));
    });
  });

  // =========================================================================
  // cancelOrderWasm
  // =========================================================================
  describe('cancelOrderWasm', () => {
    it('should cancel order successfully', async () => {
      const result = await cancelOrderWasm(deps, '123', 'BTC/USDC:USDC');
      expect(result).toBeDefined();
      expect(deps.signer!.signCancelOrder).toHaveBeenCalled();
    });

    it('should cancel order without symbol', async () => {
      const result = await cancelOrderWasm(deps, '123');
      expect(result).toBeDefined();
      expect(deps.signer!.signCancelOrder).toHaveBeenCalledWith(
        expect.objectContaining({ marketIndex: 0 })
      );
    });

    it('should throw on non-zero response code', async () => {
      (deps.request as jest.Mock).mockResolvedValue({ code: 2, order: null });

      await expect(cancelOrderWasm(deps, '123')).rejects.toThrow('Cancel failed');
    });

    it('should fetch markets if symbol not in cache', async () => {
      deps.marketIdCache.clear();
      (deps.fetchMarkets as jest.Mock).mockImplementation(async () => {
        deps.marketIdCache.set('BTCUSDC', 0);
      });

      await cancelOrderWasm(deps, '123', 'BTC/USDC:USDC');
      expect(deps.fetchMarkets).toHaveBeenCalled();
    });

    it('should rollback nonce on signing error', async () => {
      (deps.signer!.signCancelOrder as jest.Mock).mockRejectedValue(new Error('sign fail'));

      await expect(cancelOrderWasm(deps, '123')).rejects.toThrow();
      expect(deps.nonceManager!.rollback).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // cancelOrderHMAC
  // =========================================================================
  describe('cancelOrderHMAC', () => {
    it('should cancel via DELETE endpoint', async () => {
      (deps.request as jest.Mock).mockResolvedValue({ order_id: '123' });

      const result = await cancelOrderHMAC(deps, '123');
      expect(result).toBeDefined();
      expect(deps.request).toHaveBeenCalledWith('DELETE', '/orders/123');
    });
  });

  // =========================================================================
  // cancelAllOrdersWasm
  // =========================================================================
  describe('cancelAllOrdersWasm', () => {
    it('should cancel all orders without symbol', async () => {
      (deps.request as jest.Mock).mockResolvedValue({ code: 0, orders: [{ order_id: '1' }] });

      const result = await cancelAllOrdersWasm(deps);
      expect(result).toHaveLength(1);
      expect(deps.signer!.signCancelAllOrders).toHaveBeenCalledWith(
        expect.objectContaining({ marketIndex: undefined })
      );
    });

    it('should cancel all for specific symbol', async () => {
      (deps.request as jest.Mock).mockResolvedValue({ code: 0, orders: [] });

      await cancelAllOrdersWasm(deps, 'BTC/USDC:USDC');
      expect(deps.signer!.signCancelAllOrders).toHaveBeenCalled();
    });

    it('should return empty array when no orders', async () => {
      (deps.request as jest.Mock).mockResolvedValue({ code: 0, orders: undefined });

      const result = await cancelAllOrdersWasm(deps);
      expect(result).toEqual([]);
    });

    it('should throw on non-zero code', async () => {
      (deps.request as jest.Mock).mockResolvedValue({ code: 4, orders: [] });

      await expect(cancelAllOrdersWasm(deps)).rejects.toThrow('Cancel all failed');
    });

    it('should fetch markets if symbol not cached', async () => {
      deps.marketIdCache.clear();
      (deps.fetchMarkets as jest.Mock).mockImplementation(async () => {
        deps.marketIdCache.set('BTCUSDC', 0);
      });
      (deps.request as jest.Mock).mockResolvedValue({ code: 0, orders: [] });

      await cancelAllOrdersWasm(deps, 'BTC/USDC:USDC');
      expect(deps.fetchMarkets).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // cancelAllOrdersHMAC
  // =========================================================================
  describe('cancelAllOrdersHMAC', () => {
    it('should cancel all via DELETE', async () => {
      (deps.request as jest.Mock).mockResolvedValue([{ order_id: '1' }]);

      const result = await cancelAllOrdersHMAC(deps);
      expect(result).toHaveLength(1);
      expect(deps.request).toHaveBeenCalledWith('DELETE', '/orders');
    });

    it('should pass symbol query param', async () => {
      (deps.request as jest.Mock).mockResolvedValue([]);

      await cancelAllOrdersHMAC(deps, 'BTC/USDC:USDC');
      expect(deps.request).toHaveBeenCalledWith('DELETE', expect.stringContaining('symbol='));
    });

    it('should return empty array for non-array response', async () => {
      (deps.request as jest.Mock).mockResolvedValue({});

      const result = await cancelAllOrdersHMAC(deps);
      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // withdrawCollateral
  // =========================================================================
  describe('withdrawCollateral', () => {
    it('should withdraw collateral successfully', async () => {
      (deps.request as jest.Mock).mockResolvedValue({ code: 0, tx_hash: '0xhash123' });

      const result = await withdrawCollateral(deps, 0, BigInt(1000000), '0x' + 'a'.repeat(40));
      expect(result).toBe('0xhash123');
    });

    it('should throw if signer not initialized', async () => {
      const noDeps = createMockDeps({ signer: { isInitialized: false } as any });

      await expect(
        withdrawCollateral(noDeps, 0, BigInt(1000000), '0x' + 'a'.repeat(40))
      ).rejects.toThrow('Withdrawals require WASM signing');
    });

    it('should throw if nonceManager is null', async () => {
      const noDeps = createMockDeps({ nonceManager: null });

      await expect(
        withdrawCollateral(noDeps, 0, BigInt(1000000), '0x' + 'a'.repeat(40))
      ).rejects.toThrow();
    });

    it('should validate address format', async () => {
      await expect(
        withdrawCollateral(deps, 0, BigInt(1000000), 'invalid-address')
      ).rejects.toThrow('Invalid destination address');
    });

    it('should throw on non-zero response code', async () => {
      (deps.request as jest.Mock).mockResolvedValue({ code: 7, tx_hash: '' });

      await expect(
        withdrawCollateral(deps, 0, BigInt(1000000), '0x' + 'a'.repeat(40))
      ).rejects.toThrow('Withdrawal failed');
    });

    it('should rollback nonce on error', async () => {
      (deps.signer!.signWithdrawCollateral as jest.Mock).mockRejectedValue(new Error('sign fail'));

      await expect(
        withdrawCollateral(deps, 0, BigInt(1000000), '0x' + 'a'.repeat(40))
      ).rejects.toThrow();
      expect(deps.nonceManager!.rollback).toHaveBeenCalled();
    });

    it('should use txHash from signed tx as fallback', async () => {
      (deps.request as jest.Mock).mockResolvedValue({ code: 0, tx_hash: '' });

      const result = await withdrawCollateral(deps, 0, BigInt(1000000), '0x' + 'a'.repeat(40));
      expect(result).toBe('0xjkl'); // From mock signer
    });
  });
});
