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
              endpoint_addr: '0x' + '1'.repeat(40),
              chain_id: '763373',
              products: {
                '2': {
                  address: '0x' + '2'.repeat(40),
                  symbol: 'BTC-PERP',
                },
              },
            },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'success', data: { tx_nonce: '0', order_nonce: '0' } }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'success',
            data: {
              symbols: {
                'BTC-PERP': {
                  type: 'perp',
                  product_id: 2,
                  symbol: 'BTC-PERP',
                  price_increment_x18: '1000000000000000000',
                  size_increment: '50000000000000',
                  min_size: '100000000000000000000',
                  maker_fee_rate_x18: '-300000000000000',
                  taker_fee_rate_x18: '0',
                  long_weight_initial_x18: '975000000000000000',
                  long_weight_maintenance_x18: '987500000000000000',
                  max_open_interest_x18: '100000000000000000000000000',
                },
              },
            },
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
          price_x18: ethers.parseUnits('80000', 18).toString(),
          amount: ethers.parseUnits('0.01', 18).toString(),
          side: 0,
          status: 'open' as const,
          is_reduce_only: false,
          post_only: true,
          filled_amount: '0',
          remaining_amount: ethers.parseUnits('0.01', 18).toString(),
          timestamp: Date.now(),
          digest: '0x' + '1'.repeat(64),
          expiration: Date.now() + 3600000,
          nonce: 1,
        },
      };

      // Mock create order
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrderResponse,
      } as Response);

      const orderRequest: OrderRequest = {
        symbol: 'BTC/USDC:USDC',
        side: 'buy',
        type: 'limit',
        amount: 0.01,
        price: 80000,
        postOnly: true,
      };

      const order = await adapter.createOrder(orderRequest);

      expect(order.id).toBe('test-order-123');
      expect(order.symbol).toBe('BTC/USDC:USDC');
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
        symbol: 'BTC/USDC:USDC',
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
              endpoint_addr: '0x1',
              chain_id: '763373',
              products: {
                '2': {
                  address: '0x' + '2'.repeat(40),
                  symbol: 'BTC-PERP',
                },
              },
            },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'success', data: { tx_nonce: '0', order_nonce: '0' } }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'success',
            data: {
              symbols: {
                'BTC-PERP': {
                  type: 'perp',
                  product_id: 2,
                  symbol: 'BTC-PERP',
                  price_increment_x18: '1000000000000000000',
                  size_increment: '50000000000000',
                  min_size: '100000000000000000000',
                  maker_fee_rate_x18: '-300000000000000',
                  taker_fee_rate_x18: '0',
                  long_weight_initial_x18: '975000000000000000',
                  long_weight_maintenance_x18: '987500000000000000',
                  max_open_interest_x18: '100000000000000000000000000',
                },
              },
            },
          }),
        } as Response);

      await adapter.connect();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockReset();
    });

    it('should fetch markets', async () => {
      const markets = await adapter.fetchMarkets();
      expect(markets).toHaveLength(1);
      expect(markets[0].symbol).toBe('BTC/USDC:USDC');
    });
  });

  describe('edge cases', () => {
    beforeEach(async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'success',
            data: {
              endpoint_addr: '0x' + '1'.repeat(40),
              chain_id: '763373',
              products: {
                '2': {
                  address: '0x' + '2'.repeat(40),
                  symbol: 'BTC-PERP',
                },
                '3': {
                  address: '0x' + '3'.repeat(40),
                  symbol: 'ETH-PERP',
                },
              },
            },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'success', data: { tx_nonce: '0', order_nonce: '0' } }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'success',
            data: {
              symbols: {
                'BTC-PERP': {
                  type: 'perp',
                  product_id: 2,
                  symbol: 'BTC-PERP',
                  price_increment_x18: '1000000000000000000',
                  size_increment: '50000000000000',
                  min_size: '100000000000000000000',
                  maker_fee_rate_x18: '-300000000000000',
                  taker_fee_rate_x18: '0',
                  long_weight_initial_x18: '975000000000000000',
                  long_weight_maintenance_x18: '987500000000000000',
                  max_open_interest_x18: '100000000000000000000000000',
                },
                'ETH-PERP': {
                  type: 'perp',
                  product_id: 3,
                  symbol: 'ETH-PERP',
                  price_increment_x18: '100000000000000000',
                  size_increment: '1000000000000000',
                  min_size: '100000000000000000000',
                  maker_fee_rate_x18: '-300000000000000',
                  taker_fee_rate_x18: '0',
                  long_weight_initial_x18: '975000000000000000',
                  long_weight_maintenance_x18: '987500000000000000',
                  max_open_interest_x18: '100000000000000000000000000',
                },
              },
            },
          }),
        } as Response);

      await adapter.connect();
      (global.fetch as jest.MockedFunction<typeof fetch>).mockReset();
    });

    describe('order types', () => {
      it('should create market order', async () => {
        const mockMarketOrder = {
          status: 'success',
          data: {
            order_id: 'market-order-123',
            product_id: 2,
            sender: testWallet.address,
            price_x18: '0', // Market orders have 0 price
            amount: ethers.parseUnits('0.1', 18).toString(),
            side: 0,
            status: 'filled' as const,
            is_reduce_only: false,
            post_only: false,
            filled_amount: ethers.parseUnits('0.1', 18).toString(),
            remaining_amount: '0',
            timestamp: Date.now(),
            digest: '0x' + '2'.repeat(64),
            expiration: Date.now() + 3600000,
            nonce: 1,
          },
        };

        (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockMarketOrder,
        } as Response);

        const orderRequest: OrderRequest = {
          symbol: 'BTC/USDC:USDC',
          side: 'buy',
          type: 'market',
          amount: 0.1,
        };

        const order = await adapter.createOrder(orderRequest);

        expect(order.type).toBe('market');
        expect(order.status).toBe('closed'); // Filled = closed
      });

      it('should create sell limit order', async () => {
        const mockSellOrder = {
          status: 'success',
          data: {
            order_id: 'sell-order-123',
            product_id: 2,
            sender: testWallet.address,
            price_x18: ethers.parseUnits('85000', 18).toString(),
            amount: ethers.parseUnits('0.05', 18).toString(),
            side: 1, // Sell
            status: 'open' as const,
            is_reduce_only: false,
            post_only: true,
            filled_amount: '0',
            remaining_amount: ethers.parseUnits('0.05', 18).toString(),
            timestamp: Date.now(),
            digest: '0x' + '3'.repeat(64),
            expiration: Date.now() + 3600000,
            nonce: 2,
          },
        };

        (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockSellOrder,
        } as Response);

        const orderRequest: OrderRequest = {
          symbol: 'BTC/USDC:USDC',
          side: 'sell',
          type: 'limit',
          amount: 0.05,
          price: 85000,
          postOnly: true,
        };

        const order = await adapter.createOrder(orderRequest);

        expect(order.side).toBe('sell');
        expect(order.price).toBe(85000);
      });

      it('should create reduce-only order', async () => {
        const mockReduceOnlyOrder = {
          status: 'success',
          data: {
            order_id: 'reduce-order-123',
            product_id: 2,
            sender: testWallet.address,
            price_x18: ethers.parseUnits('79000', 18).toString(),
            amount: ethers.parseUnits('0.02', 18).toString(),
            side: 1,
            status: 'open' as const,
            is_reduce_only: true,
            post_only: false,
            filled_amount: '0',
            remaining_amount: ethers.parseUnits('0.02', 18).toString(),
            timestamp: Date.now(),
            digest: '0x' + '4'.repeat(64),
            expiration: Date.now() + 3600000,
            nonce: 3,
          },
        };

        (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockReduceOnlyOrder,
        } as Response);

        const orderRequest: OrderRequest = {
          symbol: 'BTC/USDC:USDC',
          side: 'sell',
          type: 'limit',
          amount: 0.02,
          price: 79000,
          reduceOnly: true,
        };

        const order = await adapter.createOrder(orderRequest);

        expect(order.reduceOnly).toBe(true);
      });
    });

    describe('invalid parameters', () => {
      it('should handle invalid symbol', async () => {
        const orderRequest: OrderRequest = {
          symbol: 'INVALID/USDC:USDC',
          side: 'buy',
          type: 'limit',
          amount: 0.01,
          price: 80000,
        };

        await expect(adapter.createOrder(orderRequest)).rejects.toThrow();
      });

      it('should handle zero amount', async () => {
        const orderRequest: OrderRequest = {
          symbol: 'BTC/USDC:USDC',
          side: 'buy',
          type: 'limit',
          amount: 0,
          price: 80000,
        };

        await expect(adapter.createOrder(orderRequest)).rejects.toThrow();
      });

      it('should handle negative price', async () => {
        const orderRequest: OrderRequest = {
          symbol: 'BTC/USDC:USDC',
          side: 'buy',
          type: 'limit',
          amount: 0.01,
          price: -100,
        };

        await expect(adapter.createOrder(orderRequest)).rejects.toThrow();
      });

      it('should handle missing price for limit order', async () => {
        const orderRequest: OrderRequest = {
          symbol: 'BTC/USDC:USDC',
          side: 'buy',
          type: 'limit',
          amount: 0.01,
          // Missing price
        };

        await expect(adapter.createOrder(orderRequest)).rejects.toThrow();
      });
    });

    describe('order status variations', () => {
      it('should handle partially filled order', async () => {
        const mockPartialOrder = {
          status: 'success',
          data: {
            order_id: 'partial-order-123',
            product_id: 2,
            sender: testWallet.address,
            price_x18: ethers.parseUnits('80000', 18).toString(),
            amount: ethers.parseUnits('1.0', 18).toString(),
            side: 0,
            status: 'open' as const,
            is_reduce_only: false,
            post_only: false,
            filled_amount: ethers.parseUnits('0.3', 18).toString(), // 30% filled
            remaining_amount: ethers.parseUnits('0.7', 18).toString(),
            timestamp: Date.now(),
            digest: '0x' + '5'.repeat(64),
            expiration: Date.now() + 3600000,
            nonce: 4,
          },
        };

        (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockPartialOrder,
        } as Response);

        const orderRequest: OrderRequest = {
          symbol: 'BTC/USDC:USDC',
          side: 'buy',
          type: 'limit',
          amount: 1.0,
          price: 80000,
        };

        const order = await adapter.createOrder(orderRequest);

        expect(order.filled).toBe(0.3);
        expect(order.remaining).toBe(0.7);
        expect(order.status).toBe('open');
      });

      it('should handle cancelled order', async () => {
        const mockCancelledOrder = {
          status: 'success',
          data: {
            order_id: 'cancelled-order-123',
            product_id: 2,
            sender: testWallet.address,
            price_x18: ethers.parseUnits('80000', 18).toString(),
            amount: ethers.parseUnits('0.01', 18).toString(),
            side: 0,
            status: 'cancelled' as const,
            is_reduce_only: false,
            post_only: true,
            filled_amount: '0',
            remaining_amount: '0',
            timestamp: Date.now(),
            digest: '0x' + '6'.repeat(64),
            expiration: Date.now() + 3600000,
            nonce: 5,
          },
        };

        (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockCancelledOrder,
        } as Response);

        const orderRequest: OrderRequest = {
          symbol: 'BTC/USDC:USDC',
          side: 'buy',
          type: 'limit',
          amount: 0.01,
          price: 80000,
          postOnly: true,
        };

        const order = await adapter.createOrder(orderRequest);

        expect(order.status).toBe('canceled');
      });
    });

    describe('network errors', () => {
      it('should handle network timeout', async () => {
        (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
          new Error('ETIMEDOUT')
        );

        const orderRequest: OrderRequest = {
          symbol: 'BTC/USDC:USDC',
          side: 'buy',
          type: 'limit',
          amount: 0.01,
          price: 80000,
        };

        await expect(adapter.createOrder(orderRequest)).rejects.toThrow();
      });

      it('should handle connection refused', async () => {
        (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
          new Error('ECONNREFUSED')
        );

        const orderRequest: OrderRequest = {
          symbol: 'BTC/USDC:USDC',
          side: 'buy',
          type: 'limit',
          amount: 0.01,
          price: 80000,
        };

        await expect(adapter.createOrder(orderRequest)).rejects.toThrow();
      });

      it('should handle API error responses', async () => {
        (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({
            status: 'failure',
            error: 'Internal server error',
          }),
        } as Response);

        const orderRequest: OrderRequest = {
          symbol: 'BTC/USDC:USDC',
          side: 'buy',
          type: 'limit',
          amount: 0.01,
          price: 80000,
        };

        await expect(adapter.createOrder(orderRequest)).rejects.toThrow();
      });
    });

    describe('multiple markets', () => {
      it('should handle orders on different markets', async () => {
        const mockBTCOrder = {
          status: 'success',
          data: {
            order_id: 'btc-order-123',
            product_id: 2,
            sender: testWallet.address,
            price_x18: ethers.parseUnits('80000', 18).toString(),
            amount: ethers.parseUnits('0.01', 18).toString(),
            side: 0,
            status: 'open' as const,
            is_reduce_only: false,
            post_only: true,
            filled_amount: '0',
            remaining_amount: ethers.parseUnits('0.01', 18).toString(),
            timestamp: Date.now(),
            digest: '0x' + '7'.repeat(64),
            expiration: Date.now() + 3600000,
            nonce: 6,
          },
        };

        const mockETHOrder = {
          status: 'success',
          data: {
            order_id: 'eth-order-456',
            product_id: 3,
            sender: testWallet.address,
            price_x18: ethers.parseUnits('3000', 18).toString(),
            amount: ethers.parseUnits('0.5', 18).toString(),
            side: 0,
            status: 'open' as const,
            is_reduce_only: false,
            post_only: true,
            filled_amount: '0',
            remaining_amount: ethers.parseUnits('0.5', 18).toString(),
            timestamp: Date.now(),
            digest: '0x' + '8'.repeat(64),
            expiration: Date.now() + 3600000,
            nonce: 7,
          },
        };

        // Create BTC order
        (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockBTCOrder,
        } as Response);

        const btcOrder = await adapter.createOrder({
          symbol: 'BTC/USDC:USDC',
          side: 'buy',
          type: 'limit',
          amount: 0.01,
          price: 80000,
          postOnly: true,
        });

        expect(btcOrder.symbol).toBe('BTC/USDC:USDC');

        // Create ETH order
        (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: true,
          json: async () => mockETHOrder,
        } as Response);

        const ethOrder = await adapter.createOrder({
          symbol: 'ETH/USDC:USDC',
          side: 'buy',
          type: 'limit',
          amount: 0.5,
          price: 3000,
          postOnly: true,
        });

        expect(ethOrder.symbol).toBe('ETH/USDC:USDC');
      });
    });

    describe('cancel operations', () => {
      it('should handle cancel non-existent order', async () => {
        (global.fetch as jest.MockedFunction<typeof fetch>)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              status: 'failure',
              error: 'Order not found',
              error_code: 'order_not_found',
            }),
          } as Response);

        await expect(adapter.cancelOrder('non-existent')).rejects.toThrow();
      });

      it('should handle cancel already filled order', async () => {
        const mockFilledOrder = {
          status: 'success',
          data: {
            order_id: 'filled-order-123',
            product_id: 2,
            sender: testWallet.address,
            price_x18: ethers.parseUnits('80000', 18).toString(),
            amount: ethers.parseUnits('0.01', 18).toString(),
            side: 0,
            status: 'filled' as const,
            is_reduce_only: false,
            post_only: false,
            filled_amount: ethers.parseUnits('0.01', 18).toString(),
            remaining_amount: '0',
            timestamp: Date.now(),
            digest: '0x' + '9'.repeat(64),
            expiration: Date.now() + 3600000,
            nonce: 8,
          },
        };

        (global.fetch as jest.MockedFunction<typeof fetch>)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockFilledOrder,
          } as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              status: 'failure',
              error: 'Order already filled',
              error_code: 'order_already_filled',
            }),
          } as Response);

        await expect(adapter.cancelOrder('filled-order-123')).rejects.toThrow();
      });
    });
  });
});
