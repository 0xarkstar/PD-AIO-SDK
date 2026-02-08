/**
 * GMX Order Builder Unit Tests
 *
 * Tests for GmxOrderBuilder class covering order construction logic
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { ethers } from 'ethers';
import { GmxOrderBuilder } from '../../src/adapters/gmx/GmxOrderBuilder.js';
import { GMX_ORDER_TYPES, GMX_PRECISION } from '../../src/adapters/gmx/constants.js';
import type { OrderRequest } from '../../src/types/index.js';
import type { GmxAuth } from '../../src/adapters/gmx/GmxAuth.js';
import type { GmxContracts } from '../../src/adapters/gmx/GmxContracts.js';
import type { GmxPriceData } from '../../src/adapters/gmx/GmxOrderBuilder.js';

describe('GmxOrderBuilder', () => {
  let mockAuth: GmxAuth;
  let mockContracts: GmxContracts;
  let orderBuilder: GmxOrderBuilder;

  const mockWalletAddress = '0x1234567890123456789012345678901234567890';
  const mockGasPrice = 100000000n; // 0.1 gwei

  const mockPrices: GmxPriceData = {
    indexPrice: 50000,
    longTokenPrice: 50000,
    shortTokenPrice: 1,
  };

  beforeEach(() => {
    // Mock GmxAuth
    mockAuth = {
      getWalletAddress: jest.fn(() => mockWalletAddress),
      getGasPrice: jest.fn(async () => mockGasPrice),
      hasCredentials: jest.fn(() => true),
    } as any;

    // Mock GmxContracts
    mockContracts = {} as any;

    // Create order builder with default config
    orderBuilder = new GmxOrderBuilder('arbitrum', mockAuth, mockContracts);
  });

  describe('constructor', () => {
    test('should create builder with default config', () => {
      expect(orderBuilder).toBeDefined();
    });

    test('should create builder with custom slippage', () => {
      const customBuilder = new GmxOrderBuilder('arbitrum', mockAuth, mockContracts, {
        slippageTolerance: 0.01,
      });
      expect(customBuilder).toBeDefined();
    });

    test('should create builder with custom callback gas limit', () => {
      const customBuilder = new GmxOrderBuilder('arbitrum', mockAuth, mockContracts, {
        callbackGasLimit: 100000n,
      });
      expect(customBuilder).toBeDefined();
    });

    test('should create builder with referral code', () => {
      const customBuilder = new GmxOrderBuilder('arbitrum', mockAuth, mockContracts, {
        referralCode: 'MYREF',
      });
      expect(customBuilder).toBeDefined();
    });
  });

  describe('buildCreateOrderParams', () => {
    test('should build market buy order params', () => {
      const request: OrderRequest = {
        symbol: 'ETH/USD:ETH',
        side: 'buy',
        type: 'market',
        amount: 1.0,
      };

      const params = orderBuilder.buildCreateOrderParams(request, mockPrices);

      expect(params).toBeDefined();
      expect(params.receiver).toBe(mockWalletAddress);
      expect(params.orderType).toBe(GMX_ORDER_TYPES.MARKET_INCREASE);
      expect(params.isLong).toBe(true);
      expect(params.sizeDeltaUsd).toBeGreaterThan(0n);
    });

    test('should build market sell order params', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:BTC',
        side: 'sell',
        type: 'market',
        amount: 0.1,
      };

      const params = orderBuilder.buildCreateOrderParams(request, mockPrices);

      expect(params.isLong).toBe(false);
      expect(params.orderType).toBe(GMX_ORDER_TYPES.MARKET_INCREASE);
    });

    test('should build limit buy order params', () => {
      const request: OrderRequest = {
        symbol: 'ETH/USD:ETH',
        side: 'buy',
        type: 'limit',
        amount: 1.0,
        price: 49000,
      };

      const params = orderBuilder.buildCreateOrderParams(request, mockPrices);

      expect(params.orderType).toBe(GMX_ORDER_TYPES.LIMIT_INCREASE);
      expect(params.triggerPrice).toBeGreaterThan(0n);
    });

    test('should build limit sell order params', () => {
      const request: OrderRequest = {
        symbol: 'BTC/USD:BTC',
        side: 'sell',
        type: 'limit',
        amount: 0.1,
        price: 51000,
      };

      const params = orderBuilder.buildCreateOrderParams(request, mockPrices);

      expect(params.orderType).toBe(GMX_ORDER_TYPES.LIMIT_INCREASE);
      expect(params.isLong).toBe(false);
    });

    test('should build reduce-only order params', () => {
      const request: OrderRequest = {
        symbol: 'ETH/USD:ETH',
        side: 'sell',
        type: 'market',
        amount: 1.0,
        reduceOnly: true,
      };

      const params = orderBuilder.buildCreateOrderParams(request, mockPrices);

      expect(params.orderType).toBe(GMX_ORDER_TYPES.MARKET_DECREASE);
      expect(params.initialCollateralDeltaAmount).toBe(0n);
    });

    test('should use custom leverage if provided', () => {
      const request: OrderRequest = {
        symbol: 'ETH/USD:ETH',
        side: 'buy',
        type: 'market',
        amount: 1.0,
        leverage: 5,
      };

      const params = orderBuilder.buildCreateOrderParams(request, mockPrices);

      // Higher leverage = more collateral delta for same size
      expect(params.initialCollateralDeltaAmount).toBeGreaterThan(0n);
    });

    test('should calculate acceptable price with slippage for long increase', () => {
      const request: OrderRequest = {
        symbol: 'ETH/USD:ETH',
        side: 'buy',
        type: 'market',
        amount: 1.0,
      };

      const params = orderBuilder.buildCreateOrderParams(request, mockPrices);

      // Long increase: pay higher price (1 + slippage)
      const expectedPrice = BigInt(Math.floor(mockPrices.indexPrice * 1.003 * GMX_PRECISION.PRICE));
      expect(params.acceptablePrice).toBe(expectedPrice);
    });

    test('should calculate acceptable price with slippage for short increase', () => {
      const request: OrderRequest = {
        symbol: 'ETH/USD:ETH',
        side: 'sell',
        type: 'market',
        amount: 1.0,
      };

      const params = orderBuilder.buildCreateOrderParams(request, mockPrices);

      // Short increase: receive lower price (1 - slippage)
      const expectedPrice = BigInt(Math.floor(mockPrices.indexPrice * 0.997 * GMX_PRECISION.PRICE));
      expect(params.acceptablePrice).toBe(expectedPrice);
    });

    test('should throw on invalid market symbol', () => {
      const request: OrderRequest = {
        symbol: 'INVALID/USD:USD',
        side: 'buy',
        type: 'market',
        amount: 1.0,
      };

      expect(() => orderBuilder.buildCreateOrderParams(request, mockPrices)).toThrow(/Invalid market/);
    });

    test('should throw when wallet address is not available', () => {
      (mockAuth.getWalletAddress as jest.Mock).mockReturnValue(undefined);

      const request: OrderRequest = {
        symbol: 'ETH/USD:ETH',
        side: 'buy',
        type: 'market',
        amount: 1.0,
      };

      expect(() => orderBuilder.buildCreateOrderParams(request, mockPrices)).toThrow(/Wallet address required/);
    });

    test('should set stop loss order type for stopMarket', () => {
      const request: OrderRequest = {
        symbol: 'ETH/USD:ETH',
        side: 'sell',
        type: 'stopMarket',
        amount: 1.0,
        stopPrice: 48000,
        reduceOnly: true,
      };

      const params = orderBuilder.buildCreateOrderParams(request, mockPrices);

      expect(params.orderType).toBe(GMX_ORDER_TYPES.STOP_LOSS);
    });

    test('should set stop loss order type for stopLimit', () => {
      const request: OrderRequest = {
        symbol: 'ETH/USD:ETH',
        side: 'sell',
        type: 'stopLimit',
        amount: 1.0,
        price: 48000,
        stopPrice: 48000,
        reduceOnly: true,
      };

      const params = orderBuilder.buildCreateOrderParams(request, mockPrices);

      expect(params.orderType).toBe(GMX_ORDER_TYPES.STOP_LOSS);
    });

    test('should include referral code when provided', () => {
      const builderWithRef = new GmxOrderBuilder('arbitrum', mockAuth, mockContracts, {
        referralCode: 'MYREF',
      });

      const request: OrderRequest = {
        symbol: 'ETH/USD:ETH',
        side: 'buy',
        type: 'market',
        amount: 1.0,
      };

      const params = builderWithRef.buildCreateOrderParams(request, mockPrices);

      expect(params.referralCode).not.toBe(ethers.ZeroHash);
    });
  });

  describe('buildClosePositionParams', () => {
    test('should build close params for long position', () => {
      const params = orderBuilder.buildClosePositionParams('ETH/USD:ETH', 100000, true, mockPrices);

      expect(params).toBeDefined();
      expect(params.orderType).toBe(GMX_ORDER_TYPES.MARKET_DECREASE);
      expect(params.isLong).toBe(true);
      expect(params.sizeDeltaUsd).toBe(BigInt(Math.floor(100000 * GMX_PRECISION.USD)));
      expect(params.initialCollateralDeltaAmount).toBe(0n);
    });

    test('should build close params for short position', () => {
      const params = orderBuilder.buildClosePositionParams('BTC/USD:BTC', 50000, false, mockPrices);

      expect(params.orderType).toBe(GMX_ORDER_TYPES.MARKET_DECREASE);
      expect(params.isLong).toBe(false);
    });

    test('should calculate acceptable price with slippage for long decrease', () => {
      const params = orderBuilder.buildClosePositionParams('ETH/USD:ETH', 100000, true, mockPrices);

      // Long decrease: receive lower price (1 - slippage)
      const expectedPrice = BigInt(Math.floor(mockPrices.indexPrice * 0.997 * GMX_PRECISION.PRICE));
      expect(params.acceptablePrice).toBe(expectedPrice);
    });

    test('should calculate acceptable price with slippage for short decrease', () => {
      const params = orderBuilder.buildClosePositionParams('ETH/USD:ETH', 100000, false, mockPrices);

      // Short decrease: pay higher price (1 + slippage)
      const expectedPrice = BigInt(Math.floor(mockPrices.indexPrice * 1.003 * GMX_PRECISION.PRICE));
      expect(params.acceptablePrice).toBe(expectedPrice);
    });

    test('should throw on invalid market symbol', () => {
      expect(() =>
        orderBuilder.buildClosePositionParams('INVALID/USD:USD', 100000, true, mockPrices)
      ).toThrow(/Invalid market/);
    });

    test('should throw when wallet address is not available', () => {
      (mockAuth.getWalletAddress as jest.Mock).mockReturnValue(undefined);

      expect(() =>
        orderBuilder.buildClosePositionParams('ETH/USD:ETH', 100000, true, mockPrices)
      ).toThrow(/Wallet address required/);
    });
  });

  describe('calculateExecutionFee', () => {
    test('should calculate execution fee with gas price', async () => {
      const fee = await orderBuilder.calculateExecutionFee();

      expect(fee).toBeGreaterThan(0n);
      expect(mockAuth.getGasPrice).toHaveBeenCalled();
    });

    test('should include 30% buffer in execution fee', async () => {
      const gasLimit = 1500000n;
      const expectedBaseFee = gasLimit * mockGasPrice;
      const expectedFeeWithBuffer = (expectedBaseFee * 130n) / 100n;

      const fee = await orderBuilder.calculateExecutionFee();

      expect(fee).toBe(expectedFeeWithBuffer);
    });
  });

  describe('getMinExecutionFee', () => {
    test('should return minimum execution fee for arbitrum', async () => {
      const minFee = await orderBuilder.getMinExecutionFee();

      // Arbitrum min fee: 0.0003 ETH
      expect(minFee).toBeGreaterThanOrEqual(ethers.parseEther('0.0003'));
    });

    test('should return minimum execution fee for avalanche', async () => {
      const avaxBuilder = new GmxOrderBuilder('avalanche', mockAuth, mockContracts);

      const minFee = await avaxBuilder.getMinExecutionFee();

      // Avalanche min fee: 0.01 AVAX
      expect(minFee).toBeGreaterThanOrEqual(ethers.parseEther('0.01'));
    });

    test('should return calculated fee when higher than minimum', async () => {
      // Mock high gas price
      (mockAuth.getGasPrice as jest.Mock).mockResolvedValue(1000000000000n);

      const minFee = await orderBuilder.getMinExecutionFee();

      expect(minFee).toBeGreaterThan(ethers.parseEther('0.0003'));
    });
  });

  describe('validateOrderParams', () => {
    test('should validate valid market order', () => {
      const request: OrderRequest = {
        symbol: 'ETH/USD:ETH',
        side: 'buy',
        type: 'market',
        amount: 1.0,
      };

      expect(() => orderBuilder.validateOrderParams(request)).not.toThrow();
    });

    test('should throw on invalid market', () => {
      const request: OrderRequest = {
        symbol: 'INVALID/USD:USD',
        side: 'buy',
        type: 'market',
        amount: 1.0,
      };

      expect(() => orderBuilder.validateOrderParams(request)).toThrow(/Invalid market/);
    });

    test('should throw when order size is below minimum', () => {
      const request: OrderRequest = {
        symbol: 'ETH/USD:ETH',
        side: 'buy',
        type: 'market',
        amount: 0.00001, // Way below minimum
      };

      expect(() => orderBuilder.validateOrderParams(request)).toThrow(/below minimum/);
    });

    test('should throw when leverage exceeds maximum', () => {
      const request: OrderRequest = {
        symbol: 'ETH/USD:ETH',
        side: 'buy',
        type: 'market',
        amount: 1.0,
        leverage: 1000, // Exceeds max leverage
      };

      expect(() => orderBuilder.validateOrderParams(request)).toThrow(/exceeds maximum/);
    });

    test('should throw when limit order has no price', () => {
      const request: OrderRequest = {
        symbol: 'ETH/USD:ETH',
        side: 'buy',
        type: 'limit',
        amount: 1.0,
      };

      expect(() => orderBuilder.validateOrderParams(request)).toThrow(/Price required for limit orders/);
    });

    test('should throw when stop order has no stop price', () => {
      const request: OrderRequest = {
        symbol: 'ETH/USD:ETH',
        side: 'sell',
        type: 'stopMarket',
        amount: 1.0,
      };

      expect(() => orderBuilder.validateOrderParams(request)).toThrow(/Stop price required for stop orders/);
    });
  });

  describe('getMarketConfig', () => {
    test('should return market config for valid symbol', () => {
      const config = orderBuilder.getMarketConfig('ETH/USD:ETH');

      expect(config).toBeDefined();
      expect(config.baseAsset).toBe('ETH');
    });

    test('should throw for invalid symbol', () => {
      expect(() => orderBuilder.getMarketConfig('INVALID/USD:USD')).toThrow(/Invalid market/);
    });
  });

  describe('calculateRequiredCollateral', () => {
    test('should calculate required collateral for long position', () => {
      const sizeUsd = 50000;
      const leverage = 10;

      const result = orderBuilder.calculateRequiredCollateral(sizeUsd, leverage, true);

      expect(result.collateralUsd).toBe(5000);
      expect(result.collateralToken).toBe('USDC');
    });

    test('should calculate required collateral for short position', () => {
      const sizeUsd = 50000;
      const leverage = 5;

      const result = orderBuilder.calculateRequiredCollateral(sizeUsd, leverage, false);

      expect(result.collateralUsd).toBe(10000);
      expect(result.collateralToken).toBe('USDC');
    });

    test('should use custom leverage', () => {
      const sizeUsd = 100000;
      const leverage = 20;

      const result = orderBuilder.calculateRequiredCollateral(sizeUsd, leverage, true);

      expect(result.collateralUsd).toBe(5000);
    });
  });

  describe('calculateLiquidationPrice', () => {
    test('should calculate liquidation price for long position', () => {
      const entryPrice = 50000;
      const leverage = 10;

      const liqPrice = orderBuilder.calculateLiquidationPrice(entryPrice, leverage, true);

      // Long: liqPrice = entryPrice * (1 - (1 - 0.01) / 10) = 50000 * (1 - 0.099) = 45050
      expect(liqPrice).toBeCloseTo(45050, 0);
      expect(liqPrice).toBeLessThan(entryPrice);
    });

    test('should calculate liquidation price for short position', () => {
      const entryPrice = 50000;
      const leverage = 10;

      const liqPrice = orderBuilder.calculateLiquidationPrice(entryPrice, leverage, false);

      // Short: liqPrice = entryPrice * (1 + (1 - 0.01) / 10) = 50000 * 1.099 = 54950
      expect(liqPrice).toBeCloseTo(54950, 0);
      expect(liqPrice).toBeGreaterThan(entryPrice);
    });

    test('should use custom maintenance margin rate', () => {
      const entryPrice = 50000;
      const leverage = 10;
      const maintenanceMarginRate = 0.05; // 5%

      const liqPrice = orderBuilder.calculateLiquidationPrice(entryPrice, leverage, true, maintenanceMarginRate);

      // Long: liqPrice = 50000 * (1 - 0.95 / 10) = 50000 * 0.905 = 45250
      expect(liqPrice).toBeCloseTo(45250, 0);
    });

    test('should calculate closer liquidation price with higher leverage', () => {
      const entryPrice = 50000;
      const lowLeverageLiq = orderBuilder.calculateLiquidationPrice(entryPrice, 5, true);
      const highLeverageLiq = orderBuilder.calculateLiquidationPrice(entryPrice, 20, true);

      // Higher leverage = closer to entry price
      expect(highLeverageLiq).toBeGreaterThan(lowLeverageLiq);
    });
  });
});
