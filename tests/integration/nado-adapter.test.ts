/**
 * Integration Tests for NadoAdapter
 *
 * Tests complete workflows and interactions between components.
 * Uses mocked fetch to avoid real API calls.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Wallet, ethers } from 'ethers';
import { NadoAdapter } from '../../src/adapters/nado/NadoAdapter.js';
import type { OrderRequest } from '../../src/types/index.js';
import { InsufficientMarginError } from '../../src/types/errors.js';

// Mock fetch globally
global.fetch = jest.fn() as any;

describe('NadoAdapter Integration', () => {
  let adapter: NadoAdapter;
  const testPrivateKey = '0x' + '1'.repeat(64);
  const testWallet = new Wallet(testPrivateKey);

  beforeEach(() => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockReset();
    adapter = new NadoAdapter({
      privateKey: testPrivateKey,
      testnet: true,
    });
  });

  describe('order lifecycle', () => {
    beforeEach(async () => {
      // Mock initialization
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'success',
            data: {
              endpoint_address: '0x' + '1'.repeat(40),
              chain_id: 763373,
            },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'success', data: { nonce: 0 } }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'success',
            data: [
              {
                product_id: 2,
                symbol: 'BTC-PERP',
                price_increment: ethers.parseUnits('1', 18).toString(),
                size_increment: ethers.parseUnits('0.001', 18).toString(),
                min_size: ethers.parseUnits('0.001', 18).toString(),
                max_size: ethers.parseUnits('1000', 18).toString(),
              },
            ],
          }),
        } as Response);

      await adapter.connect();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockReset();
    });

    it('should create and cancel order successfully', async () => {
      const mockOrderResponse = {
        status: 'success',
        data: {
          order_id: 'test-order-123',
          product_id: 2,
          sender: testWallet.address,
          price: ethers.parseUnits('80000', 18).toString(),
          amount: ethers.parseUnits('0.01', 18).toString(),
          side: 0,
          status: 'open',
          reduce_only: false,
          post_only: true,
          filled: '0',
          timestamp: Date.now(),
          digest: '0x' + '1'.repeat(64),
        },
      };

      // Mock create order
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrderResponse,
      } as Response);

      const orderRequest: OrderRequest = {
        symbol: 'BTC/USDT:USDT',
        side: 'buy',
        type: 'limit',
        amount: 0.01,
        price: 80000,
        postOnly: true,
      };

      const order = await adapter.createOrder(orderRequest);

      expect(order.id).toBe('test-order-123');
      expect(order.symbol).toBe('BTC/USDT:USDT');
      expect(order.side).toBe('buy');

      // Mock fetch order for cancel
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockOrderResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'success', data: {} }),
        } as Response);

      const cancelledOrder = await adapter.cancelOrder('test-order-123');
      expect(cancelledOrder.id).toBe('test-order-123');
    });

    it('should handle insufficient margin error', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'failure',
          error: 'Insufficient margin',
          error_code: 'insufficient_margin',
        }),
      } as Response);

      const orderRequest: OrderRequest = {
        symbol: 'BTC/USDT:USDT',
        side: 'buy',
        type: 'limit',
        amount: 100,
        price: 80000,
      };

      await expect(adapter.createOrder(orderRequest)).rejects.toThrow(InsufficientMarginError);
    });
  });

  describe('market data', () => {
    beforeEach(async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'success',
            data: {
              endpoint_address: '0x1',
              chain_id: 763373,
            },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'success', data: { nonce: 0 } }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'success',
            data: [
              {
                product_id: 2,
                symbol: 'BTC-PERP',
                price_increment: ethers.parseUnits('1', 18).toString(),
                size_increment: ethers.parseUnits('0.001', 18).toString(),
                min_size: ethers.parseUnits('0.001', 18).toString(),
                max_size: ethers.parseUnits('1000', 18).toString(),
              },
            ],
          }),
        } as Response);

      await adapter.connect();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockReset();
    });

    it('should fetch markets', async () => {
      const markets = await adapter.fetchMarkets();
      expect(markets).toHaveLength(1);
      expect(markets[0].symbol).toBe('BTC/USDT:USDT');
    });
  });
});
