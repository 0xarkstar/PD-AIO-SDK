/**
 * Unit Tests for NadoNormalizer
 *
 * Tests data normalization, precision safety, batch processing, and symbol conversion.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ethers } from 'ethers';
import { NadoNormalizer } from '../../src/adapters/nado/NadoNormalizer.js';
import { PerpDEXError } from '../../src/types/errors.js';
import type { ProductMapping } from '../../src/adapters/nado/types.js';

describe('NadoNormalizer', () => {
  let normalizer: NadoNormalizer;

  beforeEach(() => {
    normalizer = new NadoNormalizer();
  });

  // ===========================================================================
  // Symbol Conversion
  // ===========================================================================

  describe('symbolToCCXT', () => {
    it('should convert BTC-PERP to BTC/USDT:USDT', () => {
      const result = normalizer.symbolToCCXT('BTC-PERP');
      expect(result).toBe('BTC/USDT:USDT');
    });

    it('should convert ETH-PERP to ETH/USDT:USDT', () => {
      const result = normalizer.symbolToCCXT('ETH-PERP');
      expect(result).toBe('ETH/USDT:USDT');
    });

    it('should use custom quote asset', () => {
      const result = normalizer.symbolToCCXT('BTC-PERP', 'USDC');
      expect(result).toBe('BTC/USDC:USDC');
    });

    it('should handle uppercase symbols', () => {
      const result = normalizer.symbolToCCXT('AVAX-PERP');
      expect(result).toBe('AVAX/USDT:USDT');
    });

    it('should handle lowercase symbols', () => {
      const result = normalizer.symbolToCCXT('btc-perp');
      expect(result).toBe('btc/perp');
    });

    it('should handle symbols with numbers', () => {
      const result = normalizer.symbolToCCXT('1INCH-PERP');
      expect(result).toBe('1INCH/USDT:USDT');
    });
  });

  describe('symbolFromCCXT', () => {
    it('should convert BTC/USDT:USDT to BTC-PERP', () => {
      const result = normalizer.symbolFromCCXT('BTC/USDT:USDT');
      expect(result).toBe('BTC-PERP');
    });

    it('should convert ETH/USDT:USDT to ETH-PERP', () => {
      const result = normalizer.symbolFromCCXT('ETH/USDT:USDT');
      expect(result).toBe('ETH-PERP');
    });

    it('should handle different quote assets', () => {
      const result = normalizer.symbolFromCCXT('BTC/USDC:USDC');
      expect(result).toBe('BTC-PERP');
    });

    it('should handle symbols with numbers', () => {
      const result = normalizer.symbolFromCCXT('1INCH/USDT:USDT');
      expect(result).toBe('1INCH-PERP');
    });

    it('should handle lowercase base', () => {
      const result = normalizer.symbolFromCCXT('btc/USDT:USDT');
      expect(result).toBe('btc-PERP');
    });
  });

  describe('symbol conversion round-trip', () => {
    const testSymbols = ['BTC-PERP', 'ETH-PERP', 'SOL-PERP', 'AVAX-PERP'];

    testSymbols.forEach((nadoSymbol) => {
      it(`should round-trip ${nadoSymbol}`, () => {
        const ccxtSymbol = normalizer.symbolToCCXT(nadoSymbol);
        const backToNado = normalizer.symbolFromCCXT(ccxtSymbol);
        expect(backToNado).toBe(nadoSymbol);
      });
    });
  });

  // ===========================================================================
  // Product Normalization
  // ===========================================================================

  describe('normalizeProduct', () => {
    it('should normalize basic product', () => {
      const nadoProduct = {
        product_id: 2,
        symbol: 'BTC-PERP',
        base_currency: 'BTC',
        quote_currency: 'USDT',
        contract_size: '1',
        tick_size: '0.01',  // Plain decimal, not x18
        min_size: '0.001',  // Plain decimal, not x18
        max_position_size: '1000',  // Plain decimal, not x18
        maker_fee: '0.0002',
        taker_fee: '0.0005',
        is_active: true,
        product_type: 'perpetual' as const,
      };

      const market = normalizer.normalizeProduct(nadoProduct);

      expect(market.id).toBe('2');
      expect(market.symbol).toBe('BTC/USDT:USDT');
      expect(market.base).toBe('BTC');
      expect(market.quote).toBe('USDT');
      expect(market.settle).toBe('USDT');
      expect(market.active).toBe(true);
      expect(market.makerFee).toBe(0.0002);
      expect(market.takerFee).toBe(0.0005);
    });

    it('should normalize precision correctly', () => {
      const nadoProduct = {
        product_id: 2,
        symbol: 'BTC-PERP',
        base_currency: 'BTC',
        quote_currency: 'USDT',
        contract_size: '1',
        tick_size: '0.01',  // Plain decimal, not x18
        min_size: '0.001',  // Plain decimal, not x18
        max_position_size: '1000',  // Plain decimal, not x18
        maker_fee: '0.0002',
        taker_fee: '0.0005',
        is_active: true,
        product_type: 'perpetual' as const,
      };

      const market = normalizer.normalizeProduct(nadoProduct);

      expect(market.priceTickSize).toBeCloseTo(0.01, 5);
      expect(market.pricePrecision).toBe(8);
      expect(market.amountPrecision).toBe(8);
    });

    it('should normalize limits correctly', () => {
      const nadoProduct = {
        product_id: 2,
        symbol: 'BTC-PERP',
        base_currency: 'BTC',
        quote_currency: 'USDT',
        contract_size: '1',
        tick_size: '1',  // Plain decimal, not x18
        min_size: '0.01',  // Plain decimal, not x18
        max_position_size: '500',  // Plain decimal, not x18
        maker_fee: '0.0002',
        taker_fee: '0.0005',
        is_active: true,
        product_type: 'perpetual' as const,
      };

      const market = normalizer.normalizeProduct(nadoProduct);

      expect(market.minAmount).toBeCloseTo(0.01, 5);
      expect(market.maxAmount).toBeCloseTo(500, 5);
    });
  });

  // ===========================================================================
  // Order Normalization
  // ===========================================================================

  describe('normalizeOrder', () => {
    const mockMapping: ProductMapping = {
      productId: 2,
      symbol: 'BTC-PERP',
      ccxtSymbol: 'BTC/USDT:USDT',
    };

    it('should normalize basic order', () => {
      const nadoOrder = {
        order_id: '123',
        digest: '0xabc123',
        product_id: 2,
        sender: '0x123',
        price_x18: ethers.parseUnits('80000', 18).toString(),
        amount: ethers.parseUnits('0.1', 18).toString(),
        side: 0, // buy
        expiration: Date.now() + 3600000,
        nonce: 1,
        status: 'open' as const,
        filled_amount: '0',
        remaining_amount: ethers.parseUnits('0.1', 18).toString(),
        timestamp: 1234567890,
        is_reduce_only: false,
        post_only: true,
      };

      const order = normalizer.normalizeOrder(nadoOrder, mockMapping);

      expect(order.id).toBe('123');
      expect(order.symbol).toBe('BTC/USDT:USDT');
      expect(order.type).toBe('limit');
      expect(order.side).toBe('buy');
      expect(order.price).toBeCloseTo(80000, 2);
      expect(order.amount).toBeCloseTo(0.1, 5);
      expect(order.filled).toBe(0);
      expect(order.status).toBe('open');
      expect(order.reduceOnly).toBe(false);
      expect(order.postOnly).toBe(true);
    });

    it('should handle sell orders', () => {
      const nadoOrder = {
        order_id: '456',
        digest: '0xdef456',
        product_id: 2,
        sender: '0x123',
        price_x18: ethers.parseUnits('80000', 18).toString(),
        amount: ethers.parseUnits('0.1', 18).toString(),
        side: 1, // sell
        expiration: Date.now() + 3600000,
        nonce: 2,
        status: 'open' as const,
        filled_amount: '0',
        remaining_amount: ethers.parseUnits('0.1', 18).toString(),
        timestamp: 1234567890,
        is_reduce_only: false,
        post_only: false,
      };

      const order = normalizer.normalizeOrder(nadoOrder, mockMapping);

      expect(order.side).toBe('sell');
    });

    it('should handle reduce-only orders', () => {
      const nadoOrder = {
        order_id: '789',
        digest: '0xghi789',
        product_id: 2,
        sender: '0x123',
        price_x18: ethers.parseUnits('80000', 18).toString(),
        amount: ethers.parseUnits('0.1', 18).toString(),
        side: 1,
        expiration: Date.now() + 3600000,
        nonce: 3,
        status: 'open' as const,
        filled_amount: '0',
        remaining_amount: ethers.parseUnits('0.1', 18).toString(),
        timestamp: 1234567890,
        is_reduce_only: true,
        post_only: false,
      };

      const order = normalizer.normalizeOrder(nadoOrder, mockMapping);

      expect(order.reduceOnly).toBe(true);
    });
  });

  // ===========================================================================
  // Position Normalization
  // ===========================================================================

  describe('normalizePosition', () => {
    const mockMapping: ProductMapping = {
      productId: 2,
      symbol: 'BTC-PERP',
      ccxtSymbol: 'BTC/USDT:USDT',
    };

    it('should normalize long position', () => {
      const nadoPosition = {
        product_id: 2,
        subaccount: '0x123',
        size: ethers.parseUnits('0.5', 18).toString(),
        entry_price: ethers.parseUnits('80000', 18).toString(),
        mark_price: ethers.parseUnits('81000', 18).toString(),
        liquidation_price: ethers.parseUnits('70000', 18).toString(),
        unrealized_pnl: ethers.parseUnits('500', 18).toString(),
        realized_pnl: ethers.parseUnits('100', 18).toString(),
        leverage: '10',
        margin: ethers.parseUnits('8000', 18).toString(),
        timestamp: Date.now(),
      };

      const position = normalizer.normalizePosition(nadoPosition, mockMapping);

      expect(position).not.toBeNull();
      expect(position!.symbol).toBe('BTC/USDT:USDT');
      expect(position!.side).toBe('long');
      expect(position!.size).toBeCloseTo(0.5, 5);  // 'size' not 'contracts'
      expect(position!.entryPrice).toBeCloseTo(80000, 2);
      expect(position!.markPrice).toBeCloseTo(81000, 2);
      expect(position!.liquidationPrice).toBeCloseTo(70000, 2);
      expect(position!.unrealizedPnl).toBeCloseTo(500, 2);
      expect(position!.margin).toBeCloseTo(8000, 2);  // 'margin' not 'collateral'
    });

    it('should normalize short position', () => {
      const nadoPosition = {
        product_id: 2,
        subaccount: '0x123',
        size: ethers.parseUnits('-0.3', 18).toString(),
        entry_price: ethers.parseUnits('80000', 18).toString(),
        mark_price: ethers.parseUnits('79000', 18).toString(),
        liquidation_price: ethers.parseUnits('90000', 18).toString(),
        unrealized_pnl: ethers.parseUnits('300', 18).toString(),
        realized_pnl: ethers.parseUnits('50', 18).toString(),
        leverage: '10',
        margin: ethers.parseUnits('8000', 18).toString(),
        timestamp: Date.now(),
      };

      const position = normalizer.normalizePosition(nadoPosition, mockMapping);

      expect(position).not.toBeNull();
      expect(position!.side).toBe('short');
      expect(position!.size).toBeCloseTo(0.3, 5); // 'size' not 'contracts', Absolute value
    });

    it('should return null for zero position', () => {
      const nadoPosition = {
        product_id: 2,
        subaccount: '0x123',
        size: '0',
        entry_price: '0',
        mark_price: ethers.parseUnits('80000', 18).toString(),
        liquidation_price: '0',
        unrealized_pnl: '0',
        realized_pnl: '0',
        leverage: '0',
        margin: '0',
        timestamp: Date.now(),
      };

      const position = normalizer.normalizePosition(nadoPosition, mockMapping);

      expect(position).toBeNull();
    });
  });

  // ===========================================================================
  // Batch Processing
  // ===========================================================================

  describe('normalizeOrders', () => {
    const mockMappings = new Map<string, ProductMapping>([
      [
        '2',
        {
          productId: 2,
          symbol: 'BTC-PERP',
          ccxtSymbol: 'BTC/USDT:USDT',
        },
      ],
      [
        '3',
        {
          productId: 3,
          symbol: 'ETH-PERP',
          ccxtSymbol: 'ETH/USDT:USDT',
        },
      ],
    ]);

    it('should normalize multiple orders', () => {
      const nadoOrders = [
        {
          order_id: '1',
          digest: '0x111',
          product_id: 2,
          sender: '0x123',
          price_x18: ethers.parseUnits('80000', 18).toString(),
          amount: ethers.parseUnits('0.1', 18).toString(),
          side: 0,
          expiration: Date.now() + 3600000,
          nonce: 1,
          status: 'open' as const,
          filled_amount: '0',
          remaining_amount: ethers.parseUnits('0.1', 18).toString(),
          timestamp: 123,
          is_reduce_only: false,
          post_only: false,
        },
        {
          order_id: '2',
          digest: '0x222',
          product_id: 3,
          sender: '0x123',
          price_x18: ethers.parseUnits('4000', 18).toString(),
          amount: ethers.parseUnits('1', 18).toString(),
          side: 1,
          expiration: Date.now() + 3600000,
          nonce: 2,
          status: 'open' as const,
          filled_amount: '0',
          remaining_amount: ethers.parseUnits('1', 18).toString(),
          timestamp: 124,
          is_reduce_only: false,
          post_only: false,
        },
      ];

      const orders = normalizer.normalizeOrders(nadoOrders, mockMappings);

      expect(orders).toHaveLength(2);
      expect(orders[0].id).toBe('1');
      expect(orders[0].symbol).toBe('BTC/USDT:USDT');
      expect(orders[1].id).toBe('2');
      expect(orders[1].symbol).toBe('ETH/USDT:USDT');
    });

    it('should filter out orders with unmapped products', () => {
      const nadoOrders = [
        {
          order_id: '1',
          digest: '0x333',
          product_id: 2,
          sender: '0x123',
          price_x18: ethers.parseUnits('80000', 18).toString(),
          amount: ethers.parseUnits('0.1', 18).toString(),
          side: 0,
          expiration: Date.now() + 3600000,
          nonce: 1,
          status: 'open' as const,
          filled_amount: '0',
          remaining_amount: ethers.parseUnits('0.1', 18).toString(),
          timestamp: 123,
          is_reduce_only: false,
          post_only: false,
        },
        {
          order_id: '2',
          digest: '0x444',
          product_id: 999, // Unknown product
          sender: '0x123',
          price_x18: ethers.parseUnits('1000', 18).toString(),
          amount: ethers.parseUnits('1', 18).toString(),
          side: 1,
          expiration: Date.now() + 3600000,
          nonce: 2,
          status: 'open' as const,
          filled_amount: '0',
          remaining_amount: ethers.parseUnits('1', 18).toString(),
          timestamp: 124,
          is_reduce_only: false,
          post_only: false,
        },
      ];

      const orders = normalizer.normalizeOrders(nadoOrders, mockMappings);

      expect(orders).toHaveLength(1);
      expect(orders[0].id).toBe('1');
    });

    it('should handle empty orders array', () => {
      const orders = normalizer.normalizeOrders([], mockMappings);

      expect(orders).toEqual([]);
    });
  });

  describe('normalizePositions', () => {
    const mockMappings = new Map<string, ProductMapping>([
      [
        '2',
        {
          productId: 2,
          symbol: 'BTC-PERP',
          ccxtSymbol: 'BTC/USDT:USDT',
        },
      ],
      [
        '3',
        {
          productId: 3,
          symbol: 'ETH-PERP',
          ccxtSymbol: 'ETH/USDT:USDT',
        },
      ],
    ]);

    it('should normalize multiple positions', () => {
      const nadoPositions = [
        {
          product_id: 2,
          subaccount: '0x123',
          size: ethers.parseUnits('0.5', 18).toString(),
          entry_price: ethers.parseUnits('80000', 18).toString(),
          mark_price: ethers.parseUnits('81000', 18).toString(),
          liquidation_price: ethers.parseUnits('70000', 18).toString(),
          unrealized_pnl: ethers.parseUnits('500', 18).toString(),
          realized_pnl: ethers.parseUnits('100', 18).toString(),
          leverage: '10',
          margin: ethers.parseUnits('8000', 18).toString(),
          timestamp: Date.now(),
        },
        {
          product_id: 3,
          subaccount: '0x123',
          size: ethers.parseUnits('-2', 18).toString(),
          entry_price: ethers.parseUnits('4000', 18).toString(),
          mark_price: ethers.parseUnits('3900', 18).toString(),
          liquidation_price: ethers.parseUnits('4500', 18).toString(),
          unrealized_pnl: ethers.parseUnits('200', 18).toString(),
          realized_pnl: ethers.parseUnits('50', 18).toString(),
          leverage: '5',
          margin: ethers.parseUnits('1000', 18).toString(),
          timestamp: Date.now(),
        },
      ];

      const positions = normalizer.normalizePositions(nadoPositions, mockMappings);

      expect(positions).toHaveLength(2);
      expect(positions[0].symbol).toBe('BTC/USDT:USDT');
      expect(positions[0].side).toBe('long');
      expect(positions[1].symbol).toBe('ETH/USDT:USDT');
      expect(positions[1].side).toBe('short');
    });

    it('should filter out zero positions', () => {
      const nadoPositions = [
        {
          product_id: 2,
          subaccount: '0x123',
          size: ethers.parseUnits('0.5', 18).toString(),
          entry_price: ethers.parseUnits('80000', 18).toString(),
          mark_price: ethers.parseUnits('81000', 18).toString(),
          liquidation_price: ethers.parseUnits('70000', 18).toString(),
          unrealized_pnl: ethers.parseUnits('500', 18).toString(),
          realized_pnl: ethers.parseUnits('100', 18).toString(),
          leverage: '10',
          margin: ethers.parseUnits('8000', 18).toString(),
          timestamp: Date.now(),
        },
        {
          product_id: 3,
          subaccount: '0x123',
          size: '0', // Zero position
          entry_price: '0',
          mark_price: ethers.parseUnits('4000', 18).toString(),
          liquidation_price: '0',
          unrealized_pnl: '0',
          realized_pnl: '0',
          leverage: '0',
          margin: '0',
          timestamp: Date.now(),
        },
      ];

      const positions = normalizer.normalizePositions(nadoPositions, mockMappings);

      expect(positions).toHaveLength(1);
      expect(positions[0].symbol).toBe('BTC/USDT:USDT');
    });
  });

  // ===========================================================================
  // Edge Cases & Error Handling
  // ===========================================================================

  describe('precision safety', () => {
    it('should handle very large numbers', () => {
      const largeValue = '999999999';  // Plain decimal, not x18
      const nadoProduct = {
        product_id: 1,
        symbol: 'TEST-PERP',
        base_currency: 'TEST',
        quote_currency: 'USDT',
        contract_size: '1',
        tick_size: largeValue,
        min_size: '1',
        max_position_size: largeValue,
        maker_fee: '0.0002',
        taker_fee: '0.0005',
        is_active: true,
        product_type: 'perpetual' as const,
      };

      // Should not throw
      expect(() => normalizer.normalizeProduct(nadoProduct)).not.toThrow();
    });

    it('should handle very small numbers', () => {
      const smallValue = '0.00000001';  // Plain decimal, not x18
      const nadoProduct = {
        product_id: 1,
        symbol: 'TEST-PERP',
        base_currency: 'TEST',
        quote_currency: 'USDT',
        contract_size: '1',
        tick_size: smallValue,
        min_size: smallValue,
        max_position_size: '1000',  // Plain decimal, not x18
        maker_fee: '0.0002',
        taker_fee: '0.0005',
        is_active: true,
        product_type: 'perpetual' as const,
      };

      // Should not throw
      expect(() => normalizer.normalizeProduct(nadoProduct)).not.toThrow();
    });
  });
});
