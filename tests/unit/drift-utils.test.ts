/**
 * Drift Protocol Utilities Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  getMarketConfig,
  getMarketConfigByIndex,
  isValidMarket,
  getAllMarketIndices,
  priceToOnChain,
  priceFromOnChain,
  baseToOnChain,
  baseFromOnChain,
  quoteToOnChain,
  quoteFromOnChain,
  formatPrice,
  formatSize,
  roundToTickSize,
  roundToStepSize,
  validateLeverage,
  calculatePositionSize,
  calculateRequiredCollateral,
  toDriftOrderType,
  toDriftDirection,
  fromDriftDirection,
  getPostOnlyParams,
  validateOrderParams,
  fundingRateFromOnChain,
  annualizeFundingRate,
  calculateFundingPayment,
  calculateLiquidationPrice,
  isLiquidatable,
  buildOrderbookUrl,
  buildTradesUrl,
  buildHistoricalUrl,
  getNextFundingTimestamp,
  getTimeUntilFunding,
  slotToTimestamp,
} from '../../src/adapters/drift/utils.js';
import {
  unifiedToDrift,
  driftToUnified,
  getMarketIndex,
  getSymbolFromIndex,
  getBaseToken,
  DRIFT_PRECISION,
} from '../../src/adapters/drift/constants.js';

describe('Drift Utils', () => {
  // =============================================================================
  // Symbol Conversion Tests
  // =============================================================================

  describe('Symbol Conversion', () => {
    describe('unifiedToDrift', () => {
      it('should convert unified perpetual symbol to Drift format', () => {
        expect(unifiedToDrift('BTC/USD:USD')).toBe('BTC-PERP');
        expect(unifiedToDrift('ETH/USD:USD')).toBe('ETH-PERP');
        expect(unifiedToDrift('SOL/USD:USD')).toBe('SOL-PERP');
      });

      it('should handle simple symbols', () => {
        expect(unifiedToDrift('DOGE/USD:USD')).toBe('DOGE-PERP');
        expect(unifiedToDrift('ARB/USD:USD')).toBe('ARB-PERP');
      });

      it('should throw for invalid symbol format', () => {
        expect(() => unifiedToDrift('')).toThrow('Invalid symbol format');
      });
    });

    describe('driftToUnified', () => {
      it('should convert Drift symbol to unified format', () => {
        expect(driftToUnified('BTC-PERP')).toBe('BTC/USD:USD');
        expect(driftToUnified('ETH-PERP')).toBe('ETH/USD:USD');
        expect(driftToUnified('SOL-PERP')).toBe('SOL/USD:USD');
      });

      it('should handle all market symbols', () => {
        expect(driftToUnified('DOGE-PERP')).toBe('DOGE/USD:USD');
        expect(driftToUnified('ARB-PERP')).toBe('ARB/USD:USD');
        expect(driftToUnified('SUI-PERP')).toBe('SUI/USD:USD');
      });
    });

    describe('getMarketIndex', () => {
      it('should return market index for valid unified symbol', () => {
        expect(getMarketIndex('SOL/USD:USD')).toBe(0);
        expect(getMarketIndex('BTC/USD:USD')).toBe(1);
        expect(getMarketIndex('ETH/USD:USD')).toBe(2);
      });

      it('should return market index for Drift format symbol', () => {
        expect(getMarketIndex('SOL-PERP')).toBe(0);
        expect(getMarketIndex('BTC-PERP')).toBe(1);
        expect(getMarketIndex('ETH-PERP')).toBe(2);
      });

      it('should throw for unknown market', () => {
        expect(() => getMarketIndex('INVALID/USD:USD')).toThrow('Unknown market');
      });
    });

    describe('getSymbolFromIndex', () => {
      it('should return symbol for valid market index', () => {
        expect(getSymbolFromIndex(0)).toBe('SOL-PERP');
        expect(getSymbolFromIndex(1)).toBe('BTC-PERP');
        expect(getSymbolFromIndex(2)).toBe('ETH-PERP');
      });

      it('should return undefined for invalid market index', () => {
        expect(getSymbolFromIndex(999)).toBeUndefined();
        expect(getSymbolFromIndex(-1)).toBeUndefined();
      });
    });

    describe('getBaseToken', () => {
      it('should extract base token from unified symbol', () => {
        expect(getBaseToken('BTC/USD:USD')).toBe('BTC');
        expect(getBaseToken('ETH/USD:USD')).toBe('ETH');
        expect(getBaseToken('SOL/USD:USD')).toBe('SOL');
      });

      it('should return empty string for invalid format', () => {
        expect(getBaseToken('')).toBe('');
      });
    });
  });

  // =============================================================================
  // Market Utilities Tests
  // =============================================================================

  describe('Market Utilities', () => {
    describe('getMarketConfig', () => {
      it('should return config for valid unified symbol', () => {
        const config = getMarketConfig('BTC/USD:USD');
        expect(config).toBeDefined();
        expect(config?.marketIndex).toBe(1);
        expect(config?.maxLeverage).toBe(20);
      });

      it('should return config for Drift format symbol', () => {
        const config = getMarketConfig('BTC-PERP');
        expect(config).toBeDefined();
        expect(config?.marketIndex).toBe(1);
      });

      it('should return undefined for invalid symbol', () => {
        expect(getMarketConfig('INVALID-PERP')).toBeUndefined();
      });
    });

    describe('getMarketConfigByIndex', () => {
      it('should return config for valid market index', () => {
        const config = getMarketConfigByIndex(0);
        expect(config).toBeDefined();
        expect(config?.baseAsset).toBe('SOL');
      });

      it('should return undefined for invalid index', () => {
        expect(getMarketConfigByIndex(999)).toBeUndefined();
      });
    });

    describe('isValidMarket', () => {
      it('should return true for valid markets', () => {
        expect(isValidMarket('BTC/USD:USD')).toBe(true);
        expect(isValidMarket('BTC-PERP')).toBe(true);
        expect(isValidMarket('SOL-PERP')).toBe(true);
      });

      it('should return false for invalid markets', () => {
        expect(isValidMarket('INVALID-PERP')).toBe(false);
        expect(isValidMarket('XYZ/USD:USD')).toBe(false);
      });
    });

    describe('getAllMarketIndices', () => {
      it('should return array of market indices', () => {
        const indices = getAllMarketIndices();
        expect(Array.isArray(indices)).toBe(true);
        expect(indices).toContain(0); // SOL
        expect(indices).toContain(1); // BTC
        expect(indices).toContain(2); // ETH
      });
    });
  });

  // =============================================================================
  // Price Utilities Tests
  // =============================================================================

  describe('Price Utilities', () => {
    describe('priceToOnChain / priceFromOnChain', () => {
      it('should convert price to on-chain format', () => {
        expect(priceToOnChain(50000)).toBe('50000000000');
        expect(priceToOnChain(100.5)).toBe('100500000');
        expect(priceToOnChain(0.001)).toBe('1000');
      });

      it('should convert on-chain price back to number', () => {
        expect(priceFromOnChain('50000000000')).toBe(50000);
        expect(priceFromOnChain(100500000)).toBe(100.5);
        expect(priceFromOnChain('1000')).toBe(0.001);
      });

      it('should round-trip correctly', () => {
        const price = 42567.89;
        const onChain = priceToOnChain(price);
        expect(priceFromOnChain(onChain)).toBeCloseTo(price, 2);
      });
    });

    describe('baseToOnChain / baseFromOnChain', () => {
      it('should convert base amount to on-chain format', () => {
        expect(baseToOnChain(1)).toBe('1000000000');
        expect(baseToOnChain(0.5)).toBe('500000000');
      });

      it('should convert on-chain base amount back', () => {
        expect(baseFromOnChain('1000000000')).toBe(1);
        expect(baseFromOnChain(500000000)).toBe(0.5);
      });
    });

    describe('quoteToOnChain / quoteFromOnChain', () => {
      it('should convert quote amount to on-chain format', () => {
        expect(quoteToOnChain(1000)).toBe('1000000000');
        expect(quoteToOnChain(50.5)).toBe('50500000');
      });

      it('should convert on-chain quote amount back', () => {
        expect(quoteFromOnChain('1000000000')).toBe(1000);
        expect(quoteFromOnChain(50500000)).toBe(50.5);
      });
    });

    describe('formatPrice', () => {
      it('should format price with market precision', () => {
        // BTC has tickSize 0.1, so 1 decimal
        const btcPrice = formatPrice(50000.123, 'BTC-PERP');
        expect(btcPrice).toBe('50000.1');

        // ETH has tickSize 0.01, so 2 decimals
        const ethPrice = formatPrice(3000.456, 'ETH-PERP');
        expect(ethPrice).toBe('3000.46');
      });

      it('should use default precision for unknown markets', () => {
        const price = formatPrice(100.123, 'UNKNOWN-PERP');
        expect(price).toBe('100.12');
      });
    });

    describe('formatSize', () => {
      it('should format size with market precision', () => {
        // BTC has stepSize 0.001
        const btcSize = formatSize(1.12345, 'BTC-PERP');
        expect(btcSize).toBe('1.123');

        // ETH has stepSize 0.01
        const ethSize = formatSize(10.567, 'ETH-PERP');
        expect(ethSize).toBe('10.57');
      });
    });

    describe('roundToTickSize', () => {
      it('should round price to tick size', () => {
        // BTC has tickSize 0.1
        expect(roundToTickSize(50000.05, 'BTC-PERP')).toBeCloseTo(50000.1, 2);
        expect(roundToTickSize(50000.04, 'BTC-PERP')).toBeCloseTo(50000.0, 2);
      });
    });

    describe('roundToStepSize', () => {
      it('should round size to step size', () => {
        // BTC has stepSize 0.001
        // Use values not on exact .5 boundary to avoid banker's rounding
        expect(roundToStepSize(1.0006, 'BTC-PERP')).toBeCloseTo(1.001, 4);
        expect(roundToStepSize(1.0003, 'BTC-PERP')).toBeCloseTo(1.000, 4);
      });
    });
  });

  // =============================================================================
  // Leverage Utilities Tests
  // =============================================================================

  describe('Leverage Utilities', () => {
    describe('validateLeverage', () => {
      it('should validate valid leverage', () => {
        const result = validateLeverage(10, 'BTC-PERP');
        expect(result.valid).toBe(true);
        expect(result.reason).toBeUndefined();
      });

      it('should reject leverage below 1', () => {
        const result = validateLeverage(0.5, 'BTC-PERP');
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('Leverage must be at least 1x');
      });

      it('should reject leverage above max', () => {
        // BTC has maxLeverage 20
        const result = validateLeverage(25, 'BTC-PERP');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Maximum leverage');
        expect(result.reason).toContain('20x');
      });

      it('should use default max leverage for unknown markets', () => {
        const result = validateLeverage(15, 'UNKNOWN-PERP');
        expect(result.valid).toBe(true);
      });
    });

    describe('calculatePositionSize', () => {
      it('should calculate position size from collateral and leverage', () => {
        // $1000 collateral, 10x leverage, $50000 price = 0.2 BTC
        const size = calculatePositionSize(1000, 10, 50000);
        expect(size).toBeCloseTo(0.2, 4);
      });

      it('should handle different leverage values', () => {
        // $1000 collateral, 5x leverage, $50000 price = 0.1 BTC
        const size = calculatePositionSize(1000, 5, 50000);
        expect(size).toBeCloseTo(0.1, 4);
      });
    });

    describe('calculateRequiredCollateral', () => {
      it('should calculate required collateral', () => {
        // 0.2 BTC position, $50000 price, 10x leverage = $1000 collateral
        const collateral = calculateRequiredCollateral(0.2, 50000, 10);
        expect(collateral).toBeCloseTo(1000, 2);
      });
    });
  });

  // =============================================================================
  // Order Utilities Tests
  // =============================================================================

  describe('Order Utilities', () => {
    describe('toDriftOrderType', () => {
      it('should convert order types', () => {
        expect(toDriftOrderType('market')).toBe('market');
        expect(toDriftOrderType('limit')).toBe('limit');
        expect(toDriftOrderType('stopMarket')).toBe('triggerMarket');
        expect(toDriftOrderType('stopLimit')).toBe('triggerLimit');
      });

      it('should default to limit for unknown types', () => {
        expect(toDriftOrderType('unknown' as any)).toBe('limit');
      });
    });

    describe('toDriftDirection', () => {
      it('should convert buy/sell to long/short', () => {
        expect(toDriftDirection('buy')).toBe('long');
        expect(toDriftDirection('sell')).toBe('short');
      });
    });

    describe('fromDriftDirection', () => {
      it('should convert long/short to buy/sell', () => {
        expect(fromDriftDirection('long')).toBe('buy');
        expect(fromDriftDirection('short')).toBe('sell');
      });
    });

    describe('getPostOnlyParams', () => {
      it('should return none when not post only', () => {
        expect(getPostOnlyParams(false)).toBe('none');
      });

      it('should return mustPostOnly when post only without slide', () => {
        expect(getPostOnlyParams(true)).toBe('mustPostOnly');
        expect(getPostOnlyParams(true, false)).toBe('mustPostOnly');
      });

      it('should return slide when post only with slide', () => {
        expect(getPostOnlyParams(true, true)).toBe('slide');
      });
    });

    describe('validateOrderParams', () => {
      it('should validate valid order params', () => {
        const result = validateOrderParams({
          symbol: 'BTC-PERP',
          side: 'buy',
          amount: 0.1,
          price: 50000,
          type: 'limit',
        });
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject invalid market', () => {
        const result = validateOrderParams({
          symbol: 'INVALID-PERP',
          side: 'buy',
          amount: 0.1,
          price: 50000,
          type: 'limit',
        });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Invalid market: INVALID-PERP');
      });

      it('should reject size below minimum', () => {
        const result = validateOrderParams({
          symbol: 'BTC-PERP',
          side: 'buy',
          amount: 0.0001, // min is 0.001
          type: 'limit',
          price: 50000,
        });
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Minimum order size'))).toBe(true);
      });

      it('should require price for limit orders', () => {
        const result = validateOrderParams({
          symbol: 'BTC-PERP',
          side: 'buy',
          amount: 0.1,
          type: 'limit',
        });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Price is required for limit orders');
      });

      it('should validate leverage if provided', () => {
        const result = validateOrderParams({
          symbol: 'BTC-PERP',
          side: 'buy',
          amount: 0.1,
          price: 50000,
          type: 'limit',
          leverage: 30, // max is 20
        });
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Maximum leverage'))).toBe(true);
      });
    });
  });

  // =============================================================================
  // Funding Rate Utilities Tests
  // =============================================================================

  describe('Funding Rate Utilities', () => {
    describe('fundingRateFromOnChain', () => {
      it('should convert on-chain funding rate', () => {
        // 0.01% = 0.0001
        const rate = fundingRateFromOnChain('100000'); // 100000 / 1e9 = 0.0001
        expect(rate).toBeCloseTo(0.0001, 6);
      });

      it('should handle number input', () => {
        const rate = fundingRateFromOnChain(100000);
        expect(rate).toBeCloseTo(0.0001, 6);
      });
    });

    describe('annualizeFundingRate', () => {
      it('should annualize hourly funding rate', () => {
        const hourlyRate = 0.0001; // 0.01% per hour
        const annualRate = annualizeFundingRate(hourlyRate);
        // 0.0001 * 24 * 365 = 0.876
        expect(annualRate).toBeCloseTo(0.876, 3);
      });
    });

    describe('calculateFundingPayment', () => {
      it('should calculate funding payment', () => {
        // 1 BTC position, 0.01% rate, $50000 mark price
        const payment = calculateFundingPayment(1, 0.0001, 50000);
        // 1 * 50000 * 0.0001 = 5
        expect(payment).toBeCloseTo(5, 2);
      });

      it('should handle negative funding rates', () => {
        const payment = calculateFundingPayment(1, -0.0001, 50000);
        expect(payment).toBeCloseTo(-5, 2);
      });
    });
  });

  // =============================================================================
  // Liquidation Utilities Tests
  // =============================================================================

  describe('Liquidation Utilities', () => {
    describe('calculateLiquidationPrice', () => {
      it('should calculate liquidation price for long position', () => {
        // 10x leverage, 5% maintenance margin
        const liqPrice = calculateLiquidationPrice('long', 50000, 10, 0.05);
        // entry * (1 - (1 - 0.05) / 10) = 50000 * (1 - 0.095) = 45250
        expect(liqPrice).toBeCloseTo(45250, 0);
      });

      it('should calculate liquidation price for short position', () => {
        const liqPrice = calculateLiquidationPrice('short', 50000, 10, 0.05);
        // entry * (1 + (1 - 0.05) / 10) = 50000 * (1 + 0.095) = 54750
        expect(liqPrice).toBeCloseTo(54750, 0);
      });

      it('should return 0 for invalid leverage', () => {
        expect(calculateLiquidationPrice('long', 50000, 0)).toBe(0);
        expect(calculateLiquidationPrice('long', 50000, -1)).toBe(0);
      });
    });

    describe('isLiquidatable', () => {
      it('should detect liquidatable long position', () => {
        // Long at 50000, 10x leverage, price dropped to 44000
        expect(isLiquidatable('long', 50000, 44000, 10, 0.05)).toBe(true);
      });

      it('should detect safe long position', () => {
        // Long at 50000, 10x leverage, price at 48000
        expect(isLiquidatable('long', 50000, 48000, 10, 0.05)).toBe(false);
      });

      it('should detect liquidatable short position', () => {
        // Short at 50000, 10x leverage, price rose to 56000
        expect(isLiquidatable('short', 50000, 56000, 10, 0.05)).toBe(true);
      });

      it('should detect safe short position', () => {
        // Short at 50000, 10x leverage, price at 52000
        expect(isLiquidatable('short', 50000, 52000, 10, 0.05)).toBe(false);
      });
    });
  });

  // =============================================================================
  // URL Builder Tests
  // =============================================================================

  describe('URL Builders', () => {
    describe('buildOrderbookUrl', () => {
      it('should build orderbook URL', () => {
        const url = buildOrderbookUrl('https://dlob.drift.trade', 1, 'perp');
        expect(url).toContain('https://dlob.drift.trade/l2');
        expect(url).toContain('marketIndex=1');
        expect(url).toContain('marketType=perp');
      });

      it('should include depth parameter if provided', () => {
        const url = buildOrderbookUrl('https://dlob.drift.trade', 1, 'perp', 20);
        expect(url).toContain('depth=20');
      });
    });

    describe('buildTradesUrl', () => {
      it('should build trades URL', () => {
        const url = buildTradesUrl('https://dlob.drift.trade', 1, 'perp');
        expect(url).toContain('https://dlob.drift.trade/trades');
        expect(url).toContain('marketIndex=1');
      });

      it('should include limit parameter if provided', () => {
        const url = buildTradesUrl('https://dlob.drift.trade', 1, 'perp', 50);
        expect(url).toContain('limit=50');
      });
    });

    describe('buildHistoricalUrl', () => {
      it('should build historical data URL', () => {
        const date = new Date('2024-01-15');
        const url = buildHistoricalUrl('SOL-PERP', 'trades', date);
        expect(url).toContain('drift-historical-data-v2');
        expect(url).toContain('SOL-PERP');
        expect(url).toContain('trades');
        expect(url).toContain('2024');
        expect(url).toContain('20240115');
      });

      it('should handle different data types', () => {
        const date = new Date('2024-02-20');
        const fundingUrl = buildHistoricalUrl('BTC-PERP', 'funding', date);
        expect(fundingUrl).toContain('funding');
        expect(fundingUrl).toContain('20240220');
      });
    });
  });

  // =============================================================================
  // Time Utilities Tests
  // =============================================================================

  describe('Time Utilities', () => {
    describe('getNextFundingTimestamp', () => {
      it('should return timestamp in the future', () => {
        const nextFunding = getNextFundingTimestamp();
        expect(nextFunding).toBeGreaterThan(Date.now());
      });

      it('should return timestamp on the hour', () => {
        const nextFunding = getNextFundingTimestamp();
        const date = new Date(nextFunding);
        expect(date.getMinutes()).toBe(0);
        expect(date.getSeconds()).toBe(0);
        expect(date.getMilliseconds()).toBe(0);
      });
    });

    describe('getTimeUntilFunding', () => {
      it('should return positive number', () => {
        const timeUntil = getTimeUntilFunding();
        expect(timeUntil).toBeGreaterThan(0);
        expect(timeUntil).toBeLessThanOrEqual(3600000); // Max 1 hour
      });
    });

    describe('slotToTimestamp', () => {
      it('should convert slot to timestamp with reference', () => {
        const referenceSlot = 100000;
        const referenceTime = 1700000000000;
        const targetSlot = 100010; // 10 slots later

        const timestamp = slotToTimestamp(targetSlot, referenceSlot, referenceTime);
        // 10 slots * 400ms = 4000ms
        expect(timestamp).toBe(referenceTime + 4000);
      });

      it('should calculate from genesis without reference', () => {
        const slot = 1000;
        const timestamp = slotToTimestamp(slot);
        // Should be some time after March 2020
        expect(timestamp).toBeGreaterThan(1584282000000);
      });
    });
  });
});
