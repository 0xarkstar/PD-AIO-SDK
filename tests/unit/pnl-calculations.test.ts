/**
 * PnL Calculation Unit Tests
 */

import {
  calculateUnrealizedPnl,
  calculateLiquidationPrice,
  calculateRequiredMargin,
  calculatePositionValue,
  calculateROE,
  calculateMarginRatio,
  calculateEffectiveLeverage,
  calculateFundingPayment,
  calculateBreakEvenPrice,
  calculateMaxPositionSize,
  calculateAverageEntryPrice,
  calculateMarkToMarket,
} from '../../src/core/calculations/pnl.js';

describe('PnL Calculations', () => {
  describe('calculateUnrealizedPnl', () => {
    test('calculates profit for long position', () => {
      // Bought at $50,000, now $51,000, size 1 BTC
      const pnl = calculateUnrealizedPnl('long', 50000, 51000, 1);
      expect(pnl).toBe(1000);
    });

    test('calculates loss for long position', () => {
      // Bought at $50,000, now $49,000, size 1 BTC
      const pnl = calculateUnrealizedPnl('long', 50000, 49000, 1);
      expect(pnl).toBe(-1000);
    });

    test('calculates profit for short position', () => {
      // Sold at $50,000, now $49,000, size 1 BTC
      const pnl = calculateUnrealizedPnl('short', 50000, 49000, 1);
      expect(pnl).toBe(1000);
    });

    test('calculates loss for short position', () => {
      // Sold at $50,000, now $51,000, size 1 BTC
      const pnl = calculateUnrealizedPnl('short', 50000, 51000, 1);
      expect(pnl).toBe(-1000);
    });

    test('handles fractional sizes', () => {
      const pnl = calculateUnrealizedPnl('long', 3000, 3100, 0.5);
      expect(pnl).toBe(50);
    });
  });

  describe('calculateLiquidationPrice', () => {
    test('calculates long liquidation price', () => {
      // Entry at $50,000, 10x leverage, 0.5% maintenance margin
      const liqPrice = calculateLiquidationPrice('long', 50000, 10, 0.005);
      expect(liqPrice).toBeCloseTo(45250, 0);
    });

    test('calculates short liquidation price', () => {
      // Entry at $50,000, 10x leverage, 0.5% maintenance margin
      const liqPrice = calculateLiquidationPrice('short', 50000, 10, 0.005);
      expect(liqPrice).toBeCloseTo(54750, 0);
    });

    test('higher leverage means closer liquidation', () => {
      const liq10x = calculateLiquidationPrice('long', 50000, 10, 0.005);
      const liq20x = calculateLiquidationPrice('long', 50000, 20, 0.005);

      expect(liq20x).toBeGreaterThan(liq10x);
    });
  });

  describe('calculateRequiredMargin', () => {
    test('calculates margin for 10x leverage', () => {
      const margin = calculateRequiredMargin(50000, 10);
      expect(margin).toBe(5000);
    });

    test('calculates margin for 1x leverage', () => {
      const margin = calculateRequiredMargin(50000, 1);
      expect(margin).toBe(50000);
    });
  });

  describe('calculatePositionValue', () => {
    test('calculates position value', () => {
      const value = calculatePositionValue(50000, 1);
      expect(value).toBe(50000);
    });

    test('handles fractional sizes', () => {
      const value = calculatePositionValue(3000, 0.5);
      expect(value).toBe(1500);
    });
  });

  describe('calculateROE', () => {
    test('calculates positive ROE', () => {
      const roe = calculateROE(1000, 5000);
      expect(roe).toBe(0.2); // 20%
    });

    test('calculates negative ROE', () => {
      const roe = calculateROE(-500, 5000);
      expect(roe).toBe(-0.1); // -10%
    });

    test('handles zero margin', () => {
      const roe = calculateROE(1000, 0);
      expect(roe).toBe(0);
    });
  });

  describe('calculateMarginRatio', () => {
    test('calculates margin ratio', () => {
      const ratio = calculateMarginRatio(3000, 10000);
      expect(ratio).toBe(0.3);
    });

    test('caps at 1.0', () => {
      const ratio = calculateMarginRatio(12000, 10000);
      expect(ratio).toBe(1);
    });

    test('handles zero total margin', () => {
      const ratio = calculateMarginRatio(3000, 0);
      expect(ratio).toBe(1);
    });
  });

  describe('calculateEffectiveLeverage', () => {
    test('calculates effective leverage', () => {
      const leverage = calculateEffectiveLeverage(50000, 5000);
      expect(leverage).toBe(10);
    });

    test('handles zero margin', () => {
      const leverage = calculateEffectiveLeverage(50000, 0);
      expect(leverage).toBe(0);
    });
  });

  describe('calculateFundingPayment', () => {
    test('long pays positive funding', () => {
      const payment = calculateFundingPayment(50000, 0.0001, true);
      expect(payment).toBe(-5);
    });

    test('short receives positive funding', () => {
      const payment = calculateFundingPayment(50000, 0.0001, false);
      expect(payment).toBe(5);
    });

    test('handles negative funding rate', () => {
      const payment = calculateFundingPayment(50000, -0.0001, true);
      expect(payment).toBe(5); // Long receives
    });
  });

  describe('calculateBreakEvenPrice', () => {
    test('calculates break-even for long with fees', () => {
      const bePrice = calculateBreakEvenPrice(50000, 'long', 0.0005, 0.0002);
      expect(bePrice).toBe(50035);
    });

    test('calculates break-even for short with fees', () => {
      const bePrice = calculateBreakEvenPrice(50000, 'short', 0.0005, 0.0002);
      expect(bePrice).toBe(49965);
    });
  });

  describe('calculateMaxPositionSize', () => {
    test('calculates max size with leverage', () => {
      const maxSize = calculateMaxPositionSize(5000, 10, 50000);
      expect(maxSize).toBe(1);
    });

    test('higher leverage allows larger position', () => {
      const size10x = calculateMaxPositionSize(5000, 10, 50000);
      const size20x = calculateMaxPositionSize(5000, 20, 50000);
      expect(size20x).toBe(size10x * 2);
    });
  });

  describe('calculateAverageEntryPrice', () => {
    test('calculates average entry price', () => {
      // Have 1 BTC at $50,000, buy 1 more at $51,000
      const avgPrice = calculateAverageEntryPrice(1, 50000, 1, 51000);
      expect(avgPrice).toBe(50500);
    });

    test('handles different sizes', () => {
      // Have 2 BTC at $50,000, buy 1 at $53,000
      const avgPrice = calculateAverageEntryPrice(2, 50000, 1, 53000);
      expect(avgPrice).toBeCloseTo(51000, 0);
    });

    test('handles zero total size', () => {
      const avgPrice = calculateAverageEntryPrice(0, 50000, 0, 51000);
      expect(avgPrice).toBe(0);
    });
  });

  describe('calculateMarkToMarket', () => {
    test('calculates mark-to-market value for profitable long', () => {
      const mtm = calculateMarkToMarket(1, 50000, 51000, 'long');
      expect(mtm).toBe(51000); // 50000 initial + 1000 profit
    });

    test('calculates mark-to-market value for losing short', () => {
      const mtm = calculateMarkToMarket(1, 50000, 51000, 'short');
      expect(mtm).toBe(49000); // 50000 initial - 1000 loss
    });
  });
});
