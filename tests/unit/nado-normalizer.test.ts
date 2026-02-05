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

  // ===========================================================================
  // Symbol Normalization (from /query?type=symbols endpoint)
  // ===========================================================================

  describe('normalizeSymbol', () => {
    it('should normalize perpetual symbol', () => {
      const nadoSymbol = {
        product_id: 2,
        symbol: 'BTC-PERP',
        type: 'perp' as const,
        price_increment_x18: ethers.parseUnits('0.01', 18).toString(),
        size_increment: ethers.parseUnits('0.001', 18).toString(),
        min_size: ethers.parseUnits('0.001', 18).toString(),
        maker_fee_rate_x18: ethers.parseUnits('0.0002', 18).toString(),
        taker_fee_rate_x18: ethers.parseUnits('0.0005', 18).toString(),
        long_weight_initial_x18: ethers.parseUnits('0.1', 18).toString(),
        long_weight_maintenance_x18: ethers.parseUnits('0.05', 18).toString(),
        max_open_interest_x18: ethers.parseUnits('1000000', 18).toString(),
      };

      const market = normalizer.normalizeSymbol(nadoSymbol);

      expect(market.id).toBe('2');
      expect(market.symbol).toBe('BTC/USDC:USDC');
      expect(market.base).toBe('BTC');
      expect(market.quote).toBe('USDC');
      expect(market.settle).toBe('USDC');
      expect(market.active).toBe(true);
      expect(market.minAmount).toBeCloseTo(0.001, 5);
      expect(market.priceTickSize).toBeCloseTo(0.01, 5);
      expect(market.amountStepSize).toBeCloseTo(0.001, 5);
      expect(market.makerFee).toBeCloseTo(0.0002, 6);
      expect(market.takerFee).toBeCloseTo(0.0005, 6);
    });

    it('should normalize spot symbol', () => {
      const nadoSymbol = {
        product_id: 1,
        symbol: 'WETH',
        type: 'spot' as const,
        price_increment_x18: ethers.parseUnits('0.1', 18).toString(),
        size_increment: ethers.parseUnits('0.01', 18).toString(),
        min_size: ethers.parseUnits('0.01', 18).toString(),
        maker_fee_rate_x18: ethers.parseUnits('0.001', 18).toString(),
        taker_fee_rate_x18: ethers.parseUnits('0.002', 18).toString(),
        long_weight_initial_x18: ethers.parseUnits('0.2', 18).toString(),
        long_weight_maintenance_x18: ethers.parseUnits('0.1', 18).toString(),
      };

      const market = normalizer.normalizeSymbol(nadoSymbol);

      expect(market.id).toBe('1');
      expect(market.symbol).toBe('WETH/USDC');
      expect(market.base).toBe('WETH');
      expect(market.quote).toBe('USDC');
    });

    it('should calculate precision from increment', () => {
      const nadoSymbol = {
        product_id: 3,
        symbol: 'ETH-PERP',
        type: 'perp' as const,
        price_increment_x18: ethers.parseUnits('0.001', 18).toString(), // 3 decimals
        size_increment: ethers.parseUnits('0.0001', 18).toString(), // 4 decimals
        min_size: ethers.parseUnits('0.0001', 18).toString(),
        maker_fee_rate_x18: ethers.parseUnits('0.0002', 18).toString(),
        taker_fee_rate_x18: ethers.parseUnits('0.0005', 18).toString(),
        long_weight_initial_x18: ethers.parseUnits('0.1', 18).toString(),
        long_weight_maintenance_x18: ethers.parseUnits('0.05', 18).toString(),
      };

      const market = normalizer.normalizeSymbol(nadoSymbol);

      expect(market.pricePrecision).toBe(3);
      expect(market.amountPrecision).toBe(4);
    });

    it('should handle integer increment', () => {
      const nadoSymbol = {
        product_id: 4,
        symbol: 'DOGE-PERP',
        type: 'perp' as const,
        price_increment_x18: ethers.parseUnits('1', 18).toString(), // integer, 0 decimals
        size_increment: ethers.parseUnits('10', 18).toString(),
        min_size: ethers.parseUnits('10', 18).toString(),
        maker_fee_rate_x18: ethers.parseUnits('0.0002', 18).toString(),
        taker_fee_rate_x18: ethers.parseUnits('0.0005', 18).toString(),
        long_weight_initial_x18: ethers.parseUnits('0.1', 18).toString(),
        long_weight_maintenance_x18: ethers.parseUnits('0.05', 18).toString(),
      };

      const market = normalizer.normalizeSymbol(nadoSymbol);

      expect(market.pricePrecision).toBe(0);
      expect(market.amountPrecision).toBe(0);
    });
  });

  // ===========================================================================
  // Balance Normalization
  // ===========================================================================

  describe('normalizeBalance', () => {
    it('should normalize balance data', () => {
      const nadoBalance = {
        subaccount: '0x123',
        quote_balance: ethers.parseUnits('20000', 18).toString(),
        free_margin: ethers.parseUnits('10000', 18).toString(),
        used_margin: ethers.parseUnits('5000', 18).toString(),
        total_equity: ethers.parseUnits('15000', 18).toString(),
        unrealized_pnl: ethers.parseUnits('1000', 18).toString(),
        health: '0.95',
        timestamp: 1700000000000,
      };

      const balances = normalizer.normalizeBalance(nadoBalance);

      expect(balances).toHaveLength(1);
      expect(balances[0].currency).toBe('USDT');
      expect(balances[0].free).toBeCloseTo(10000, 2);
      expect(balances[0].used).toBeCloseTo(5000, 2);
      expect(balances[0].total).toBeCloseTo(15000, 2);
    });

    it('should handle zero balance', () => {
      const nadoBalance = {
        subaccount: '0x123',
        quote_balance: '0',
        free_margin: '0',
        used_margin: '0',
        total_equity: '0',
        unrealized_pnl: '0',
        health: '1',
        timestamp: 1700000000000,
      };

      const balances = normalizer.normalizeBalance(nadoBalance);

      expect(balances).toHaveLength(1);
      expect(balances[0].free).toBe(0);
      expect(balances[0].used).toBe(0);
      expect(balances[0].total).toBe(0);
    });

    it('should include original info', () => {
      const nadoBalance = {
        subaccount: '0x456',
        quote_balance: ethers.parseUnits('2000', 18).toString(),
        free_margin: ethers.parseUnits('1000', 18).toString(),
        used_margin: ethers.parseUnits('500', 18).toString(),
        total_equity: ethers.parseUnits('1500', 18).toString(),
        unrealized_pnl: ethers.parseUnits('200', 18).toString(),
        health: '0.9',
        timestamp: 1700000001000,
      };

      const balances = normalizer.normalizeBalance(nadoBalance);

      expect(balances[0].info).toBeDefined();
    });
  });

  // ===========================================================================
  // Trade Normalization
  // ===========================================================================

  describe('normalizeTrade', () => {
    const mockMapping: ProductMapping = {
      productId: 2,
      symbol: 'BTC-PERP',
      ccxtSymbol: 'BTC/USDT:USDT',
    };

    it('should normalize buy trade', () => {
      const nadoTrade = {
        trade_id: 'trade-123',
        product_id: 2,
        price: ethers.parseUnits('80000', 18).toString(),
        size: ethers.parseUnits('0.1', 18).toString(),
        side: 0 as const, // buy
        timestamp: 1700000000000,
        is_maker: true,
      };

      const trade = normalizer.normalizeTrade(nadoTrade, mockMapping);

      expect(trade.id).toBe('trade-123');
      expect(trade.symbol).toBe('BTC/USDT:USDT');
      expect(trade.side).toBe('buy');
      expect(trade.price).toBeCloseTo(80000, 2);
      expect(trade.amount).toBeCloseTo(0.1, 5);
      expect(trade.cost).toBeCloseTo(8000, 2);
      expect(trade.timestamp).toBe(1700000000000);
    });

    it('should normalize sell trade', () => {
      const nadoTrade = {
        trade_id: 'trade-456',
        product_id: 2,
        price: ethers.parseUnits('81000', 18).toString(),
        size: ethers.parseUnits('0.5', 18).toString(),
        side: 1 as const, // sell
        timestamp: 1700000001000,
        is_maker: false,
      };

      const trade = normalizer.normalizeTrade(nadoTrade, mockMapping);

      expect(trade.side).toBe('sell');
      expect(trade.price).toBeCloseTo(81000, 2);
      expect(trade.amount).toBeCloseTo(0.5, 5);
      expect(trade.cost).toBeCloseTo(40500, 2);
    });

    it('should include original info', () => {
      const nadoTrade = {
        trade_id: 'trade-789',
        product_id: 2,
        price: ethers.parseUnits('82000', 18).toString(),
        size: ethers.parseUnits('0.2', 18).toString(),
        side: 0 as const,
        timestamp: 1700000002000,
        is_maker: true,
      };

      const trade = normalizer.normalizeTrade(nadoTrade, mockMapping);

      expect(trade.info).toBeDefined();
    });
  });

  describe('normalizeTrades', () => {
    const mockMappings = new Map<string, ProductMapping>([
      ['2', { productId: 2, symbol: 'BTC-PERP', ccxtSymbol: 'BTC/USDT:USDT' }],
      ['3', { productId: 3, symbol: 'ETH-PERP', ccxtSymbol: 'ETH/USDT:USDT' }],
    ]);

    it('should normalize multiple trades', () => {
      const nadoTrades = [
        {
          trade_id: 't1',
          product_id: 2,
          price: ethers.parseUnits('80000', 18).toString(),
          size: ethers.parseUnits('0.1', 18).toString(),
          side: 0 as const,
          timestamp: 1700000000000,
          is_maker: true,
        },
        {
          trade_id: 't2',
          product_id: 3,
          price: ethers.parseUnits('4000', 18).toString(),
          size: ethers.parseUnits('1', 18).toString(),
          side: 1 as const,
          timestamp: 1700000001000,
          is_maker: false,
        },
      ];

      const trades = normalizer.normalizeTrades(nadoTrades, mockMappings);

      expect(trades).toHaveLength(2);
      expect(trades[0].id).toBe('t1');
      expect(trades[0].symbol).toBe('BTC/USDT:USDT');
      expect(trades[1].id).toBe('t2');
      expect(trades[1].symbol).toBe('ETH/USDT:USDT');
    });

    it('should filter out trades with unmapped products', () => {
      const nadoTrades = [
        {
          trade_id: 't1',
          product_id: 2,
          price: ethers.parseUnits('80000', 18).toString(),
          size: ethers.parseUnits('0.1', 18).toString(),
          side: 0 as const,
          timestamp: 1700000000000,
          is_maker: true,
        },
        {
          trade_id: 't2',
          product_id: 999, // Unknown product
          price: ethers.parseUnits('1000', 18).toString(),
          size: ethers.parseUnits('1', 18).toString(),
          side: 1 as const,
          timestamp: 1700000001000,
          is_maker: false,
        },
      ];

      const trades = normalizer.normalizeTrades(nadoTrades, mockMappings);

      expect(trades).toHaveLength(1);
      expect(trades[0].id).toBe('t1');
    });

    it('should handle empty trades array', () => {
      const trades = normalizer.normalizeTrades([], mockMappings);
      expect(trades).toEqual([]);
    });
  });

  // ===========================================================================
  // Ticker Normalization
  // ===========================================================================

  describe('normalizeTicker', () => {
    it('should normalize ticker data', () => {
      const nadoTicker = {
        product_id: 2,
        bid_x18: ethers.parseUnits('79990', 18).toString(),
        ask_x18: ethers.parseUnits('80010', 18).toString(),
      };

      const ticker = normalizer.normalizeTicker(nadoTicker, 'BTC/USDT:USDT');

      expect(ticker.symbol).toBe('BTC/USDT:USDT');
      expect(ticker.bid).toBeCloseTo(79990, 2);
      expect(ticker.ask).toBeCloseTo(80010, 2);
      expect(ticker.last).toBeCloseTo(80000, 2); // Midpoint
      expect(ticker.close).toBeCloseTo(80000, 2);
      expect(ticker.timestamp).toBeGreaterThan(0);
    });

    it('should set defaults for unavailable data', () => {
      const nadoTicker = {
        product_id: 3,
        bid_x18: ethers.parseUnits('4000', 18).toString(),
        ask_x18: ethers.parseUnits('4002', 18).toString(),
      };

      const ticker = normalizer.normalizeTicker(nadoTicker, 'ETH/USDT:USDT');

      expect(ticker.high).toBe(0);
      expect(ticker.low).toBe(0);
      expect(ticker.open).toBe(0);
      expect(ticker.change).toBe(0);
      expect(ticker.percentage).toBe(0);
      expect(ticker.baseVolume).toBe(0);
      expect(ticker.quoteVolume).toBe(0);
      expect(ticker.bidVolume).toBe(0);
      expect(ticker.askVolume).toBe(0);
    });

    it('should include original info', () => {
      const nadoTicker = {
        product_id: 4,
        bid_x18: ethers.parseUnits('100', 18).toString(),
        ask_x18: ethers.parseUnits('101', 18).toString(),
      };

      const ticker = normalizer.normalizeTicker(nadoTicker, 'SOL/USDT:USDT');

      expect(ticker.info).toBeDefined();
    });
  });

  // ===========================================================================
  // OrderBook Normalization
  // ===========================================================================

  describe('normalizeOrderBook', () => {
    it('should normalize order book with bids and asks', () => {
      const nadoOrderBook = {
        bids: [
          [ethers.parseUnits('79990', 18).toString(), ethers.parseUnits('1.5', 18).toString()],
          [ethers.parseUnits('79980', 18).toString(), ethers.parseUnits('2.0', 18).toString()],
        ],
        asks: [
          [ethers.parseUnits('80010', 18).toString(), ethers.parseUnits('1.0', 18).toString()],
          [ethers.parseUnits('80020', 18).toString(), ethers.parseUnits('3.0', 18).toString()],
        ],
      };

      const orderBook = normalizer.normalizeOrderBook(nadoOrderBook, 'BTC/USDT:USDT');

      expect(orderBook.symbol).toBe('BTC/USDT:USDT');
      expect(orderBook.exchange).toBe('nado');
      expect(orderBook.timestamp).toBeGreaterThan(0);

      expect(orderBook.bids).toHaveLength(2);
      expect(orderBook.bids[0][0]).toBeCloseTo(79990, 2);
      expect(orderBook.bids[0][1]).toBeCloseTo(1.5, 5);
      expect(orderBook.bids[1][0]).toBeCloseTo(79980, 2);
      expect(orderBook.bids[1][1]).toBeCloseTo(2.0, 5);

      expect(orderBook.asks).toHaveLength(2);
      expect(orderBook.asks[0][0]).toBeCloseTo(80010, 2);
      expect(orderBook.asks[0][1]).toBeCloseTo(1.0, 5);
      expect(orderBook.asks[1][0]).toBeCloseTo(80020, 2);
      expect(orderBook.asks[1][1]).toBeCloseTo(3.0, 5);
    });

    it('should handle empty order book', () => {
      const nadoOrderBook = {
        bids: [],
        asks: [],
      };

      const orderBook = normalizer.normalizeOrderBook(nadoOrderBook, 'ETH/USDT:USDT');

      expect(orderBook.bids).toEqual([]);
      expect(orderBook.asks).toEqual([]);
    });
  });

  // ===========================================================================
  // Order Status Mapping
  // ===========================================================================

  describe('order status mapping', () => {
    const mockMapping: ProductMapping = {
      productId: 2,
      symbol: 'BTC-PERP',
      ccxtSymbol: 'BTC/USDT:USDT',
    };

    const createOrderWithStatus = (status: 'open' | 'filled' | 'cancelled' | 'expired' | 'rejected') => ({
      order_id: 'test-order',
      digest: '0xtest',
      product_id: 2,
      sender: '0x123',
      price_x18: ethers.parseUnits('80000', 18).toString(),
      amount: ethers.parseUnits('0.1', 18).toString(),
      side: 0,
      expiration: Date.now() + 3600000,
      nonce: 1,
      status,
      filled_amount: status === 'filled' ? ethers.parseUnits('0.1', 18).toString() : '0',
      remaining_amount: status === 'filled' ? '0' : ethers.parseUnits('0.1', 18).toString(),
      timestamp: 1234567890,
      is_reduce_only: false,
      post_only: false,
    });

    it('should map open status', () => {
      const order = normalizer.normalizeOrder(createOrderWithStatus('open'), mockMapping);
      expect(order.status).toBe('open');
    });

    it('should map filled status to closed', () => {
      const order = normalizer.normalizeOrder(createOrderWithStatus('filled'), mockMapping);
      expect(order.status).toBe('closed');
    });

    it('should map cancelled status to canceled', () => {
      const order = normalizer.normalizeOrder(createOrderWithStatus('cancelled'), mockMapping);
      expect(order.status).toBe('canceled');
    });

    it('should map expired status', () => {
      const order = normalizer.normalizeOrder(createOrderWithStatus('expired'), mockMapping);
      expect(order.status).toBe('expired');
    });

    it('should map rejected status', () => {
      const order = normalizer.normalizeOrder(createOrderWithStatus('rejected'), mockMapping);
      expect(order.status).toBe('rejected');
    });
  });

  // ===========================================================================
  // Spot Symbol Conversion
  // ===========================================================================

  describe('spot symbol conversion', () => {
    it('should convert spot symbol BTC-USDT to BTC/USDT', () => {
      const result = normalizer.symbolToCCXT('BTC-USDT');
      expect(result).toBe('BTC/USDT');
    });

    it('should convert CCXT spot BTC/USDT to BTC-USDT', () => {
      const result = normalizer.symbolFromCCXT('BTC/USDT');
      expect(result).toBe('BTC-USDT');
    });

    it('should convert spot symbol ETH-USDC to ETH/USDC', () => {
      const result = normalizer.symbolToCCXT('ETH-USDC');
      expect(result).toBe('ETH/USDC');
    });

    it('should handle symbol without separator as perpetual', () => {
      const result = normalizer.symbolToCCXT('BTCUSD');
      expect(result).toBe('BTCUSD/USDT:USDT');
    });
  });

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

  describe('fromX18Safe error handling', () => {
    it('should handle zero x18 values', () => {
      const nadoOrder = {
        order_id: 'ord-zero',
        digest: 'digest-zero',
        product_id: 1,
        sender: '0x1234567890abcdef',
        side: 0,
        price_x18: '0', // Zero value
        amount: '0',
        filled_amount: '0',
        remaining_amount: '0',
        status: 'open' as const,
        expiration: Date.now() + 86400000,
        nonce: 1,
        timestamp: Date.now(),
      };

      const mapping: ProductMapping = {
        productId: 1,
        symbol: 'BTC-PERP',
        ccxtSymbol: 'BTC/USDT:USDT',
      };

      const order = normalizer.normalizeOrder(nadoOrder, mapping);

      expect(order.price).toBe(0);
      expect(order.amount).toBe(0);
    });

    it('should handle negative x18 values in position size', () => {
      const nadoPosition = {
        product_id: 1,
        subaccount: 'main',
        size: '-5000000000000000000', // -5 (negative for short)
        entry_price: '100000000000000000000', // 100
        mark_price: '95000000000000000000', // 95
        unrealized_pnl: '25000000000000000000', // 25
        realized_pnl: '0',
        margin: '500000000000000000000', // 500
        leverage: '10',
        timestamp: Date.now(),
      };

      const mapping: ProductMapping = {
        productId: 1,
        symbol: 'SOL-PERP',
        ccxtSymbol: 'SOL/USDT:USDT',
      };

      const position = normalizer.normalizePosition(nadoPosition, mapping);

      expect(position?.size).toBe(5); // Absolute value
      expect(position?.side).toBe('short'); // Negative size means short
    });
  });

  describe('edge cases for symbol mapping lookup', () => {
    it('should normalize order with proper ProductMapping', () => {
      const nadoOrder = {
        order_id: 'ord-456',
        digest: 'digest-456',
        product_id: 1,
        sender: '0x1234567890abcdef',
        side: 1, // 1 = short/sell
        price_x18: '3000000000000000000000', // 3000 * 10^18
        amount: '2000000000000000000', // 2 * 10^18
        filled_amount: '2000000000000000000',
        remaining_amount: '0',
        status: 'filled' as const,
        expiration: Date.now() + 86400000,
        nonce: 2,
        timestamp: Date.now(),
        time_in_force: 'ioc' as const,
        post_only: false,
        is_reduce_only: true,
      };

      const mapping: ProductMapping = {
        productId: 1,
        symbol: 'ETH-PERP',
        ccxtSymbol: 'ETH/USDT:USDT',
      };

      const order = normalizer.normalizeOrder(nadoOrder, mapping);

      expect(order.symbol).toBe('ETH/USDT:USDT');
      expect(order.side).toBe('sell');
      expect(order.status).toBe('closed'); // 'filled' maps to 'closed' in CCXT
    });

    it('should handle buy side order', () => {
      const nadoOrder = {
        order_id: 'ord-789',
        digest: 'digest-789',
        product_id: 2,
        sender: '0xabcdef1234567890',
        side: 0, // 0 = long/buy
        price_x18: '50000000000000000000000', // 50000 * 10^18
        amount: '1000000000000000000', // 1 * 10^18
        filled_amount: '500000000000000000', // 0.5
        remaining_amount: '500000000000000000', // 0.5
        status: 'open' as const,
        expiration: Date.now() + 86400000,
        nonce: 1,
        timestamp: Date.now(),
        time_in_force: 'gtc' as const,
        post_only: true,
        is_reduce_only: false,
      };

      const mapping: ProductMapping = {
        productId: 2,
        symbol: 'BTC-PERP',
        ccxtSymbol: 'BTC/USDT:USDT',
      };

      const order = normalizer.normalizeOrder(nadoOrder, mapping);

      expect(order.symbol).toBe('BTC/USDT:USDT');
      expect(order.side).toBe('buy');
      expect(order.status).toBe('open');
      expect(order.postOnly).toBe(true);
      expect(order.timeInForce).toBe('GTC');
    });
  });

  describe('position normalization edge cases', () => {
    it('should handle position without liquidation price', () => {
      const nadoPosition = {
        product_id: 1,
        subaccount: 'main',
        size: '1000000000000000000', // 1
        entry_price: '50000000000000000000000', // 50000
        mark_price: '51000000000000000000000', // 51000
        unrealized_pnl: '1000000000000000000000', // 1000
        realized_pnl: '0',
        margin: '5000000000000000000000', // 5000
        leverage: '10',
        // No liquidation_price field
        timestamp: Date.now(),
      };

      const mapping: ProductMapping = {
        productId: 1,
        symbol: 'BTC-PERP',
        ccxtSymbol: 'BTC/USDT:USDT',
      };

      const position = normalizer.normalizePosition(nadoPosition, mapping);

      expect(position?.liquidationPrice).toBe(0);
    });

    it('should handle position with liquidation price', () => {
      const nadoPosition = {
        product_id: 1,
        subaccount: 'main',
        size: '-2000000000000000000', // -2 (negative indicates short)
        entry_price: '50000000000000000000000', // 50000
        mark_price: '49000000000000000000000', // 49000
        unrealized_pnl: '2000000000000000000000', // 2000
        realized_pnl: '500000000000000000000', // 500
        margin: '10000000000000000000000', // 10000
        leverage: '5',
        liquidation_price: '55000000000000000000000', // 55000
        timestamp: Date.now(),
      };

      const mapping: ProductMapping = {
        productId: 1,
        symbol: 'BTC-PERP',
        ccxtSymbol: 'BTC/USDT:USDT',
      };

      const position = normalizer.normalizePosition(nadoPosition, mapping);

      expect(position?.liquidationPrice).toBe(55000);
      expect(position?.side).toBe('short');
    });
  });

  describe('batch normalization error handling', () => {
    // Note: These tests verify that invalid items are filtered out.
    // The normalizer uses internal Logger (not console) for logging errors.

    it('should filter out orders with missing product mapping (line 540-541)', () => {
      const orders = [
        {
          order_id: 'ord-1',
          digest: 'digest-1',
          product_id: 999, // Non-existent product
          sender: '0xtest',
          side: 1,
          price_x18: '50000000000000000000000',
          amount: '1000000000000000000',
          filled_amount: '0',
          remaining_amount: '1000000000000000000',
          status: 'open' as const,
          expiration: Date.now() + 86400000,
          nonce: 1,
          timestamp: Date.now(),
          time_in_force: 'gtc' as const,
          post_only: false,
          is_reduce_only: false,
        },
      ];

      const mappings = new Map<string, ProductMapping>();
      mappings.set('1', { productId: 1, symbol: 'BTC-PERP', ccxtSymbol: 'BTC/USDT:USDT' });

      const result = normalizer.normalizeOrders(orders, mappings);

      expect(result).toHaveLength(0);
    });

    it('should filter out orders that fail normalization (lines 540-541)', () => {
      const orders = [
        {
          order_id: 'ord-1',
          digest: 'digest-1',
          product_id: 1,
          sender: '0xtest',
          side: 1,
          price_x18: 'invalid', // Invalid x18 value
          amount: '1000000000000000000',
          filled_amount: '0',
          remaining_amount: '1000000000000000000',
          status: 'open' as const,
          expiration: Date.now() + 86400000,
          nonce: 1,
          timestamp: Date.now(),
          time_in_force: 'gtc' as const,
          post_only: false,
          is_reduce_only: false,
        },
      ];

      const mappings = new Map<string, ProductMapping>();
      mappings.set('1', { productId: 1, symbol: 'BTC-PERP', ccxtSymbol: 'BTC/USDT:USDT' });

      const result = normalizer.normalizeOrders(orders, mappings);

      expect(result).toHaveLength(0);
    });

    it('should filter out positions with missing mapping (lines 571-572)', () => {
      const positions = [
        {
          product_id: 999, // Non-existent product
          subaccount: 'main',
          size: '1000000000000000000',
          entry_price: '50000000000000000000000',
          mark_price: '51000000000000000000000',
          unrealized_pnl: '1000000000000000000000',
          realized_pnl: '0',
          margin: '5000000000000000000000',
          leverage: '10',
          timestamp: Date.now(),
        },
      ];

      const mappings = new Map<string, ProductMapping>();
      mappings.set('1', { productId: 1, symbol: 'BTC-PERP', ccxtSymbol: 'BTC/USDT:USDT' });

      const result = normalizer.normalizePositions(positions, mappings);

      expect(result).toHaveLength(0);
    });

    it('should filter out positions that fail normalization (lines 577-578)', () => {
      const positions = [
        {
          product_id: 1,
          subaccount: 'main',
          size: 'invalid', // Invalid x18 value
          entry_price: '50000000000000000000000',
          mark_price: '51000000000000000000000',
          unrealized_pnl: '1000000000000000000000',
          realized_pnl: '0',
          margin: '5000000000000000000000',
          leverage: '10',
          timestamp: Date.now(),
        },
      ];

      const mappings = new Map<string, ProductMapping>();
      mappings.set('1', { productId: 1, symbol: 'BTC-PERP', ccxtSymbol: 'BTC/USDT:USDT' });

      const result = normalizer.normalizePositions(positions, mappings);

      expect(result).toHaveLength(0);
    });

    it('should filter out trades with missing mapping (lines 605-606)', () => {
      const trades = [
        {
          trade_id: 'trade-1',
          order_id: 'ord-1',
          product_id: 999, // Non-existent product
          maker: '0xmaker',
          taker: '0xtaker',
          side: 1,
          price_x18: '50000000000000000000000',
          amount: '1000000000000000000',
          fee: '1000000000000000',
          is_maker: true,
          timestamp: Date.now(),
        },
      ];

      const mappings = new Map<string, ProductMapping>();
      mappings.set('1', { productId: 1, symbol: 'BTC-PERP', ccxtSymbol: 'BTC/USDT:USDT' });

      const result = normalizer.normalizeTrades(trades, mappings);

      expect(result).toHaveLength(0);
    });

    it('should filter out trades that fail normalization (lines 605-606)', () => {
      const trades = [
        {
          trade_id: 'trade-1',
          order_id: 'ord-1',
          product_id: 1,
          maker: '0xmaker',
          taker: '0xtaker',
          side: 1,
          price_x18: 'invalid', // Invalid x18 value
          amount: '1000000000000000000',
          fee: '1000000000000000',
          is_maker: true,
          timestamp: Date.now(),
        },
      ];

      const mappings = new Map<string, ProductMapping>();
      mappings.set('1', { productId: 1, symbol: 'BTC-PERP', ccxtSymbol: 'BTC/USDT:USDT' });

      const result = normalizer.normalizeTrades(trades, mappings);

      expect(result).toHaveLength(0);
    });
  });

});
