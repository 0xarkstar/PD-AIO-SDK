/**
 * Jupiter Normalizer Unit Tests
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { JupiterNormalizer } from '../../src/adapters/jupiter/JupiterNormalizer.js';
import type {
  JupiterPositionAccount,
  JupiterPoolAccount,
  JupiterCustodyAccount,
  JupiterPriceData,
} from '../../src/adapters/jupiter/types.js';

describe('JupiterNormalizer', () => {
  let normalizer: JupiterNormalizer;

  beforeEach(() => {
    normalizer = new JupiterNormalizer();
  });

  describe('normalizePosition', () => {
    const mockPosition: JupiterPositionAccount = {
      owner: 'owner-address',
      pool: 'pool-address',
      custody: 'custody-address',
      collateralCustody: 'collateral-custody',
      openTime: 1700000000,
      updateTime: 1700001000,
      side: 'Long',
      price: '100.50',
      sizeUsd: '1005.00',
      sizeTokens: '10.0',
      collateralUsd: '100.50',
      unrealizedPnl: '5.00',
      realizedPnl: '0',
      cumulativeInterestSnapshot: '0',
      lockedAmount: '100.50',
      bump: 255,
    };

    test('normalizes long position correctly', () => {
      const position = normalizer.normalizePosition(
        'position-address',
        mockPosition,
        105.00, // current price
        'SOL-PERP'
      );

      expect(position.info?.positionAddress).toBe('position-address');
      expect(position.symbol).toBe('SOL/USD:USD');
      expect(position.side).toBe('long');
      expect(position.size).toBe(10);
      expect(position.info?.notional).toBe(1005);
      expect(position.entryPrice).toBe(100.5);
      expect(position.markPrice).toBe(105);
      expect(position.margin).toBe(100.5);
      expect(position.marginMode).toBe('isolated');
      expect(position.leverage).toBe(10); // 1005 / 100.5 = 10
    });

    test('normalizes short position correctly', () => {
      const shortPosition: JupiterPositionAccount = {
        ...mockPosition,
        side: 'Short',
      };

      const position = normalizer.normalizePosition(
        'position-address',
        shortPosition,
        95.00, // price went down (profit for short)
        'SOL-PERP'
      );

      expect(position.side).toBe('short');
    });

    test('calculates unrealized PnL for long position', () => {
      const position = normalizer.normalizePosition(
        'position-address',
        mockPosition,
        105.00, // price went up by $4.50
        'SOL-PERP'
      );

      // PnL = size * (currentPrice - entryPrice) = 10 * (105 - 100.5) = 45
      expect(position.unrealizedPnl).toBe(45);
    });

    test('calculates liquidation price for long', () => {
      const position = normalizer.normalizePosition(
        'position-address',
        mockPosition,
        100.50,
        'SOL-PERP'
      );

      // With 10x leverage and ~1% maintenance margin
      // Liquidation should be around entryPrice * (1 - 0.99/10) ≈ 90.495
      expect(position.liquidationPrice).toBeGreaterThan(80);
      expect(position.liquidationPrice).toBeLessThan(101);
    });
  });

  describe('normalizeTicker', () => {
    const mockPriceData: JupiterPriceData = {
      id: 'So11111111111111111111111111111111111111112',
      type: 'derivedPrice',
      price: '98.50',
      extraInfo: {
        quotedPrice: {
          buyPrice: '98.48',
          sellPrice: '98.52',
        },
        confidenceLevel: 'high',
      },
    };

    test('normalizes ticker data correctly', () => {
      const ticker = normalizer.normalizeTicker('SOL-PERP', mockPriceData);

      expect(ticker.symbol).toBe('SOL/USD:USD');
      expect(ticker.last).toBe(98.5);
      expect(ticker.bid).toBe(98.48);
      expect(ticker.ask).toBe(98.52);
      expect(ticker.timestamp).toBeGreaterThan(0);
    });

    test('handles ticker without quote prices', () => {
      const simplePrice: JupiterPriceData = {
        id: 'So11111111111111111111111111111111111111112',
        type: 'derivedPrice',
        price: '98.50',
      };

      const ticker = normalizer.normalizeTicker('SOL-PERP', simplePrice);

      expect(ticker.last).toBe(98.5);
      // When no quote prices, bid/ask are approximated with spread
      expect(ticker.bid).toBeCloseTo(98.5 * 0.9995, 2);
      expect(ticker.ask).toBeCloseTo(98.5 * 1.0005, 2);
    });
  });

  describe('normalizeOrderBook', () => {
    test('creates synthetic order book', () => {
      const orderBook = normalizer.normalizeOrderBook('SOL-PERP', 100.0);

      expect(orderBook.symbol).toBe('SOL/USD:USD');
      expect(orderBook.exchange).toBe('jupiter');
      expect(orderBook.bids).toBeInstanceOf(Array);
      expect(orderBook.asks).toBeInstanceOf(Array);
      expect(orderBook.timestamp).toBeGreaterThan(0);
    });

    test('order book has empty arrays without pool stats', () => {
      const orderBook = normalizer.normalizeOrderBook('SOL-PERP', 100.0);

      // Without pool stats, should have no depth
      expect(orderBook.bids).toHaveLength(0);
      expect(orderBook.asks).toHaveLength(0);
    });
  });

  describe('normalizeFundingRate', () => {
    const mockCustody: JupiterCustodyAccount = {
      pool: 'pool-address',
      mint: 'mint-address',
      tokenAccount: 'token-account',
      decimals: 9,
      isStable: false,
      oracle: {
        oracleType: 'Pyth',
        oracleAccount: 'oracle-address',
        maxPriceAge: 60,
        maxPriceDeviation: 100,
      },
      pricing: {
        useEma: true,
        tradeSpread: 10,
        swapSpread: 10,
        minInitialLeverage: 1,
        maxInitialLeverage: 250,
        maxLeverage: 250,
        maxPositionLockedUsd: 10000000,
        maxUtilization: 0.8,
      },
      trading: {
        tradingEnabled: true,
        allowOpenPosition: true,
        allowClosePosition: true,
        allowAddCollateral: true,
        allowRemoveCollateral: true,
        allowIncreaseSize: true,
        allowDecreaseSize: true,
      },
      fundingRateState: {
        cumulativeInterestRate: '1000000',
        lastUpdate: 1700000000,
        hourlyBorrowRate: '0.0001',
      },
      assets: {
        owned: '1000000000',
        locked: '500000000',
        guaranteedUsd: '0',
        globalShortSizes: '0',
        globalShortAveragePrices: '0',
      },
      bump: 255,
    };

    test('normalizes funding rate from borrow fee', () => {
      const fundingRate = normalizer.normalizeFundingRate(
        'SOL-PERP',
        mockCustody,
        100.0
      );

      expect(fundingRate.symbol).toBe('SOL/USD:USD');
      expect(fundingRate.fundingRate).toBe(0.0001);
      expect(fundingRate.fundingIntervalHours).toBe(1);
      expect(fundingRate.markPrice).toBe(100);
      expect(fundingRate.indexPrice).toBe(100);
      expect(fundingRate.info?.isBorrowFee).toBe(true);
    });

    test('includes next funding timestamp', () => {
      const fundingRate = normalizer.normalizeFundingRate(
        'SOL-PERP',
        mockCustody,
        100.0
      );

      expect(fundingRate.nextFundingTimestamp).toBeGreaterThan(fundingRate.fundingTimestamp);
    });
  });

  describe('normalizeBalance', () => {
    test('normalizes balance correctly', () => {
      const balance = normalizer.normalizeBalance('USDC', 1000, 200);

      expect(balance.currency).toBe('USDC');
      expect(balance.total).toBe(1000);
      expect(balance.free).toBe(800);
      expect(balance.used).toBe(200);
    });

    test('handles zero locked amount', () => {
      const balance = normalizer.normalizeBalance('SOL', 10, 0);

      expect(balance.total).toBe(10);
      expect(balance.free).toBe(10);
      expect(balance.used).toBe(0);
    });
  });

  describe('normalizeMarket', () => {
    const mockCustody: JupiterCustodyAccount = {
      pool: 'pool-address',
      mint: 'So11111111111111111111111111111111111111112',
      tokenAccount: 'token-account',
      decimals: 9,
      isStable: false,
      oracle: {
        oracleType: 'Pyth',
        oracleAccount: 'oracle-address',
        maxPriceAge: 60,
        maxPriceDeviation: 100,
      },
      pricing: {
        useEma: true,
        tradeSpread: 10,
        swapSpread: 10,
        minInitialLeverage: 1,
        maxInitialLeverage: 250,
        maxLeverage: 250,
        maxPositionLockedUsd: 10000000,
        maxUtilization: 0.8,
      },
      trading: {
        tradingEnabled: true,
        allowOpenPosition: true,
        allowClosePosition: true,
        allowAddCollateral: true,
        allowRemoveCollateral: true,
        allowIncreaseSize: true,
        allowDecreaseSize: true,
      },
      fundingRateState: {
        cumulativeInterestRate: '0',
        lastUpdate: 1700000000,
        hourlyBorrowRate: '0.0001',
      },
      assets: {
        owned: '0',
        locked: '0',
        guaranteedUsd: '0',
        globalShortSizes: '0',
        globalShortAveragePrices: '0',
      },
      bump: 255,
    };

    const mockPool: JupiterPoolAccount = {
      name: 'JLP Pool',
      admin: 'admin-address',
      lpMint: 'lp-mint-address',
      aumUsd: '100000000',
      totalFees: '1000000',
      custodies: ['custody-address'],
      maxAumUsd: '500000000',
      bump: 255,
      lpTokenBump: 254,
      fees: {
        swapFee: 10,
        addLiquidityFee: 5,
        removeLiquidityFee: 5,
        openPositionFee: 6,
        closePositionFee: 6,
        liquidationFee: 50,
        protocolShare: 10,
      },
    };

    test('normalizes market data correctly', () => {
      const market = normalizer.normalizeMarket(
        'SOL-PERP',
        mockCustody,
        mockPool
      );

      expect(market.id).toBe('SOL-PERP');
      expect(market.symbol).toBe('SOL/USD:USD');
      expect(market.base).toBe('SOL');
      expect(market.quote).toBe('USD');
      expect(market.settle).toBe('USD');
      expect(market.active).toBe(true);
      expect(market.maxLeverage).toBe(250);
      expect(market.info?.marginMode).toBe('isolated');
    });

    test('calculates fees from basis points', () => {
      const market = normalizer.normalizeMarket(
        'SOL-PERP',
        mockCustody,
        mockPool
      );

      // 6 basis points = 0.0006
      expect(market.makerFee).toBe(0.0006);
      expect(market.takerFee).toBe(0.0006);
    });
  });

});
