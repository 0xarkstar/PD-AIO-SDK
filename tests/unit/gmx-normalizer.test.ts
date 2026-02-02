/**
 * GMX v2 Normalizer Unit Tests
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { GmxNormalizer } from '../../src/adapters/gmx/GmxNormalizer.js';
import { GMX_PRECISION, GMX_MARKETS } from '../../src/adapters/gmx/constants.js';
import type {
  GmxMarketInfo,
  GmxPosition,
  GmxOrder,
  GmxTrade,
  GmxFundingRate,
  GmxCandlestick,
} from '../../src/adapters/gmx/types.js';

describe('GmxNormalizer', () => {
  let normalizer: GmxNormalizer;

  beforeEach(() => {
    normalizer = new GmxNormalizer();
  });

  describe('normalizeMarket', () => {
    const mockMarketInfo: GmxMarketInfo = {
      marketTokenAddress: GMX_MARKETS['ETH/USD:ETH'].marketAddress,
      indexTokenAddress: GMX_MARKETS['ETH/USD:ETH'].indexToken,
      longTokenAddress: GMX_MARKETS['ETH/USD:ETH'].longToken,
      shortTokenAddress: GMX_MARKETS['ETH/USD:ETH'].shortToken,
      indexToken: {
        address: GMX_MARKETS['ETH/USD:ETH'].indexToken,
        symbol: 'ETH',
        decimals: 18,
        prices: {
          minPrice: (3000 * GMX_PRECISION.PRICE).toString(),
          maxPrice: (3001 * GMX_PRECISION.PRICE).toString(),
        },
      },
      longToken: {
        address: GMX_MARKETS['ETH/USD:ETH'].longToken,
        symbol: 'WETH',
        decimals: 18,
        prices: {
          minPrice: (3000 * GMX_PRECISION.PRICE).toString(),
          maxPrice: (3001 * GMX_PRECISION.PRICE).toString(),
        },
      },
      shortToken: {
        address: GMX_MARKETS['ETH/USD:ETH'].shortToken,
        symbol: 'USDC',
        decimals: 6,
        prices: {
          minPrice: (1 * GMX_PRECISION.PRICE).toString(),
          maxPrice: (1 * GMX_PRECISION.PRICE).toString(),
        },
      },
      longPoolAmount: '1000000000000000000000',
      shortPoolAmount: '3000000000000',
      maxLongPoolAmount: '5000000000000000000000',
      maxShortPoolAmount: '15000000000000',
      maxLongPoolUsdForDeposit: '0',
      maxShortPoolUsdForDeposit: '0',
      longPoolAmountAdjustment: '0',
      shortPoolAmountAdjustment: '0',
      poolValueMin: '0',
      poolValueMax: '0',
      reserveFactorLong: '0',
      reserveFactorShort: '0',
      openInterestReserveFactorLong: '0',
      openInterestReserveFactorShort: '0',
      maxOpenInterestLong: (5000000 * GMX_PRECISION.USD).toString(),
      maxOpenInterestShort: (5000000 * GMX_PRECISION.USD).toString(),
      totalBorrowingFees: '0',
      positionImpactPoolAmount: '0',
      minPositionImpactPoolAmount: '0',
      positionImpactPoolDistributionRate: '0',
      swapImpactPoolAmountLong: '0',
      swapImpactPoolAmountShort: '0',
      borrowingFactorLong: '100000000000000000000000',
      borrowingFactorShort: '100000000000000000000000',
      borrowingExponentFactorLong: '0',
      borrowingExponentFactorShort: '0',
      fundingFactor: '1000000000000000000000000',
      fundingExponentFactor: '0',
      fundingIncreaseFactorPerSecond: '0',
      fundingDecreaseFactorPerSecond: '0',
      thresholdForStableFunding: '0',
      thresholdForDecreaseFunding: '0',
      minFundingFactorPerSecond: '0',
      maxFundingFactorPerSecond: '0',
      pnlLongMax: '0',
      pnlLongMin: '0',
      pnlShortMax: '0',
      pnlShortMin: '0',
      netPnlMax: '0',
      netPnlMin: '0',
      maxPnlFactorForTradersLong: '0',
      maxPnlFactorForTradersShort: '0',
      minCollateralFactor: '0',
      minCollateralFactorForOpenInterestLong: '0',
      minCollateralFactorForOpenInterestShort: '0',
      claimableFundingAmountLong: '0',
      claimableFundingAmountShort: '0',
      positionFeeFactorForPositiveImpact: '500000000000000000000000000',
      positionFeeFactorForNegativeImpact: '700000000000000000000000000',
      positionImpactFactorPositive: '0',
      positionImpactFactorNegative: '0',
      maxPositionImpactFactorPositive: '0',
      maxPositionImpactFactorNegativePrice: '0',
      positionImpactExponentFactor: '0',
      swapFeeFactorForPositiveImpact: '0',
      swapFeeFactorForNegativeImpact: '0',
      swapImpactFactorPositive: '0',
      swapImpactFactorNegative: '0',
      swapImpactExponentFactor: '0',
      longInterestInTokens: '100000000000000000000',
      shortInterestInTokens: '50000000000000000000',
      longInterestUsd: (300000 * GMX_PRECISION.USD).toString(),
      shortInterestUsd: (150000 * GMX_PRECISION.USD).toString(),
      longInterestInTokensUsingLongToken: '0',
      longInterestInTokensUsingShortToken: '0',
      shortInterestInTokensUsingLongToken: '0',
      shortInterestInTokensUsingShortToken: '0',
      isDisabled: false,
      virtualPoolAmountForLongToken: '0',
      virtualPoolAmountForShortToken: '0',
      virtualInventoryForPositions: '0',
      virtualMarketId: '0x',
      virtualLongTokenId: '0x',
      virtualShortTokenId: '0x',
    };

    test('should normalize market to unified format', () => {
      const market = normalizer.normalizeMarket(mockMarketInfo, 'arbitrum');

      expect(market.id).toBe(mockMarketInfo.marketTokenAddress);
      expect(market.symbol).toBe('ETH/USD:ETH');
      expect(market.base).toBe('ETH');
      expect(market.quote).toBe('USD');
      expect(market.settle).toBe('ETH');
      expect(market.active).toBe(true);
    });

    test('should calculate max leverage from market config', () => {
      const market = normalizer.normalizeMarket(mockMarketInfo, 'arbitrum');
      expect(market.maxLeverage).toBe(100);
    });

    test('should set market as inactive when disabled', () => {
      const disabledMarket = { ...mockMarketInfo, isDisabled: true };
      const market = normalizer.normalizeMarket(disabledMarket, 'arbitrum');
      expect(market.active).toBe(false);
    });

    test('should include chain info in market info', () => {
      const market = normalizer.normalizeMarket(mockMarketInfo, 'arbitrum');
      expect(market.info.chain).toBe('arbitrum');
    });
  });

  describe('normalizeMarkets', () => {
    test('should normalize array of markets', () => {
      const mockMarkets: GmxMarketInfo[] = [
        {
          marketTokenAddress: GMX_MARKETS['ETH/USD:ETH'].marketAddress,
          indexTokenAddress: GMX_MARKETS['ETH/USD:ETH'].indexToken,
          longTokenAddress: GMX_MARKETS['ETH/USD:ETH'].longToken,
          shortTokenAddress: GMX_MARKETS['ETH/USD:ETH'].shortToken,
          indexToken: {
            address: GMX_MARKETS['ETH/USD:ETH'].indexToken,
            symbol: 'ETH',
            decimals: 18,
            prices: {
              minPrice: (3000 * GMX_PRECISION.PRICE).toString(),
              maxPrice: (3001 * GMX_PRECISION.PRICE).toString(),
            },
          },
          longToken: {
            address: GMX_MARKETS['ETH/USD:ETH'].longToken,
            symbol: 'WETH',
            decimals: 18,
            prices: { minPrice: '0', maxPrice: '0' },
          },
          shortToken: {
            address: GMX_MARKETS['ETH/USD:ETH'].shortToken,
            symbol: 'USDC',
            decimals: 6,
            prices: { minPrice: '0', maxPrice: '0' },
          },
          longPoolAmount: '0',
          shortPoolAmount: '0',
          maxLongPoolAmount: '0',
          maxShortPoolAmount: '0',
          maxLongPoolUsdForDeposit: '0',
          maxShortPoolUsdForDeposit: '0',
          longPoolAmountAdjustment: '0',
          shortPoolAmountAdjustment: '0',
          poolValueMin: '0',
          poolValueMax: '0',
          reserveFactorLong: '0',
          reserveFactorShort: '0',
          openInterestReserveFactorLong: '0',
          openInterestReserveFactorShort: '0',
          maxOpenInterestLong: (1000000 * GMX_PRECISION.USD).toString(),
          maxOpenInterestShort: (1000000 * GMX_PRECISION.USD).toString(),
          totalBorrowingFees: '0',
          positionImpactPoolAmount: '0',
          minPositionImpactPoolAmount: '0',
          positionImpactPoolDistributionRate: '0',
          swapImpactPoolAmountLong: '0',
          swapImpactPoolAmountShort: '0',
          borrowingFactorLong: '0',
          borrowingFactorShort: '0',
          borrowingExponentFactorLong: '0',
          borrowingExponentFactorShort: '0',
          fundingFactor: '0',
          fundingExponentFactor: '0',
          fundingIncreaseFactorPerSecond: '0',
          fundingDecreaseFactorPerSecond: '0',
          thresholdForStableFunding: '0',
          thresholdForDecreaseFunding: '0',
          minFundingFactorPerSecond: '0',
          maxFundingFactorPerSecond: '0',
          pnlLongMax: '0',
          pnlLongMin: '0',
          pnlShortMax: '0',
          pnlShortMin: '0',
          netPnlMax: '0',
          netPnlMin: '0',
          maxPnlFactorForTradersLong: '0',
          maxPnlFactorForTradersShort: '0',
          minCollateralFactor: '0',
          minCollateralFactorForOpenInterestLong: '0',
          minCollateralFactorForOpenInterestShort: '0',
          claimableFundingAmountLong: '0',
          claimableFundingAmountShort: '0',
          positionFeeFactorForPositiveImpact: '0',
          positionFeeFactorForNegativeImpact: '0',
          positionImpactFactorPositive: '0',
          positionImpactFactorNegative: '0',
          maxPositionImpactFactorPositive: '0',
          maxPositionImpactFactorNegativePrice: '0',
          positionImpactExponentFactor: '0',
          swapFeeFactorForPositiveImpact: '0',
          swapFeeFactorForNegativeImpact: '0',
          swapImpactFactorPositive: '0',
          swapImpactFactorNegative: '0',
          swapImpactExponentFactor: '0',
          longInterestInTokens: '0',
          shortInterestInTokens: '0',
          longInterestUsd: '0',
          shortInterestUsd: '0',
          longInterestInTokensUsingLongToken: '0',
          longInterestInTokensUsingShortToken: '0',
          shortInterestInTokensUsingLongToken: '0',
          shortInterestInTokensUsingShortToken: '0',
          isDisabled: false,
          virtualPoolAmountForLongToken: '0',
          virtualPoolAmountForShortToken: '0',
          virtualInventoryForPositions: '0',
          virtualMarketId: '0x',
          virtualLongTokenId: '0x',
          virtualShortTokenId: '0x',
        },
      ];

      const markets = normalizer.normalizeMarkets(mockMarkets, 'arbitrum');
      expect(markets).toHaveLength(1);
      expect(markets[0].symbol).toBe('ETH/USD:ETH');
    });
  });

  describe('normalizeTicker', () => {
    const mockMarketInfo: GmxMarketInfo = {
      marketTokenAddress: GMX_MARKETS['ETH/USD:ETH'].marketAddress,
      indexTokenAddress: GMX_MARKETS['ETH/USD:ETH'].indexToken,
      longTokenAddress: GMX_MARKETS['ETH/USD:ETH'].longToken,
      shortTokenAddress: GMX_MARKETS['ETH/USD:ETH'].shortToken,
      indexToken: {
        address: GMX_MARKETS['ETH/USD:ETH'].indexToken,
        symbol: 'ETH',
        decimals: 18,
        prices: {
          minPrice: (2999 * GMX_PRECISION.PRICE).toString(),
          maxPrice: (3001 * GMX_PRECISION.PRICE).toString(),
        },
      },
      longToken: {
        address: GMX_MARKETS['ETH/USD:ETH'].longToken,
        symbol: 'WETH',
        decimals: 18,
        prices: { minPrice: '0', maxPrice: '0' },
      },
      shortToken: {
        address: GMX_MARKETS['ETH/USD:ETH'].shortToken,
        symbol: 'USDC',
        decimals: 6,
        prices: { minPrice: '0', maxPrice: '0' },
      },
      longPoolAmount: '0',
      shortPoolAmount: '0',
      maxLongPoolAmount: '0',
      maxShortPoolAmount: '0',
      maxLongPoolUsdForDeposit: '0',
      maxShortPoolUsdForDeposit: '0',
      longPoolAmountAdjustment: '0',
      shortPoolAmountAdjustment: '0',
      poolValueMin: '0',
      poolValueMax: '0',
      reserveFactorLong: '0',
      reserveFactorShort: '0',
      openInterestReserveFactorLong: '0',
      openInterestReserveFactorShort: '0',
      maxOpenInterestLong: '0',
      maxOpenInterestShort: '0',
      totalBorrowingFees: '0',
      positionImpactPoolAmount: '0',
      minPositionImpactPoolAmount: '0',
      positionImpactPoolDistributionRate: '0',
      swapImpactPoolAmountLong: '0',
      swapImpactPoolAmountShort: '0',
      borrowingFactorLong: '0',
      borrowingFactorShort: '0',
      borrowingExponentFactorLong: '0',
      borrowingExponentFactorShort: '0',
      fundingFactor: '0',
      fundingExponentFactor: '0',
      fundingIncreaseFactorPerSecond: '0',
      fundingDecreaseFactorPerSecond: '0',
      thresholdForStableFunding: '0',
      thresholdForDecreaseFunding: '0',
      minFundingFactorPerSecond: '0',
      maxFundingFactorPerSecond: '0',
      pnlLongMax: '0',
      pnlLongMin: '0',
      pnlShortMax: '0',
      pnlShortMin: '0',
      netPnlMax: '0',
      netPnlMin: '0',
      maxPnlFactorForTradersLong: '0',
      maxPnlFactorForTradersShort: '0',
      minCollateralFactor: '0',
      minCollateralFactorForOpenInterestLong: '0',
      minCollateralFactorForOpenInterestShort: '0',
      claimableFundingAmountLong: '0',
      claimableFundingAmountShort: '0',
      positionFeeFactorForPositiveImpact: '0',
      positionFeeFactorForNegativeImpact: '0',
      positionImpactFactorPositive: '0',
      positionImpactFactorNegative: '0',
      maxPositionImpactFactorPositive: '0',
      maxPositionImpactFactorNegativePrice: '0',
      positionImpactExponentFactor: '0',
      swapFeeFactorForPositiveImpact: '0',
      swapFeeFactorForNegativeImpact: '0',
      swapImpactFactorPositive: '0',
      swapImpactFactorNegative: '0',
      swapImpactExponentFactor: '0',
      longInterestInTokens: '0',
      shortInterestInTokens: '0',
      longInterestUsd: (500000 * GMX_PRECISION.USD).toString(),
      shortInterestUsd: (300000 * GMX_PRECISION.USD).toString(),
      longInterestInTokensUsingLongToken: '0',
      longInterestInTokensUsingShortToken: '0',
      shortInterestInTokensUsingLongToken: '0',
      shortInterestInTokensUsingShortToken: '0',
      isDisabled: false,
      virtualPoolAmountForLongToken: '0',
      virtualPoolAmountForShortToken: '0',
      virtualInventoryForPositions: '0',
      virtualMarketId: '0x',
      virtualLongTokenId: '0x',
      virtualShortTokenId: '0x',
    };

    test('should normalize to ticker format', () => {
      const ticker = normalizer.normalizeTicker(mockMarketInfo);

      expect(ticker.symbol).toBe('ETH/USD:ETH');
      expect(ticker.bid).toBeCloseTo(2999, 5);
      expect(ticker.ask).toBeCloseTo(3001, 5);
      expect(ticker.last).toBeCloseTo(3000, 5); // midpoint
      expect(ticker.timestamp).toBeDefined();
    });

    test('should calculate spread info', () => {
      const ticker = normalizer.normalizeTicker(mockMarketInfo);

      expect(ticker.info.spread).toBeCloseTo(2, 5);
      expect(ticker.info.spreadPercent).toBeCloseTo(0.0667, 2);
    });

    test('should include open interest info', () => {
      const ticker = normalizer.normalizeTicker(mockMarketInfo);

      expect(ticker.info.longOpenInterestUsd).toBe(500000);
      expect(ticker.info.shortOpenInterestUsd).toBe(300000);
      expect(ticker.info.totalOpenInterestUsd).toBe(800000);
      expect(ticker.info.imbalance).toBe(200000);
    });
  });

  describe('normalizeCandle', () => {
    const mockCandle: GmxCandlestick = {
      timestamp: 1700000000,
      open: 3000,
      high: 3050,
      low: 2950,
      close: 3025,
    };

    test('should normalize candle to OHLCV format', () => {
      const ohlcv = normalizer.normalizeCandle(mockCandle);

      expect(ohlcv).toHaveLength(6);
      expect(ohlcv[0]).toBe(1700000000000); // timestamp in ms
      expect(ohlcv[1]).toBe(3000); // open
      expect(ohlcv[2]).toBe(3050); // high
      expect(ohlcv[3]).toBe(2950); // low
      expect(ohlcv[4]).toBe(3025); // close
      expect(ohlcv[5]).toBe(0); // volume (GMX doesn't provide)
    });
  });

  describe('normalizeCandles', () => {
    test('should normalize array of candles', () => {
      const candles: GmxCandlestick[] = [
        { timestamp: 1700000000, open: 3000, high: 3050, low: 2950, close: 3025 },
        { timestamp: 1700003600, open: 3025, high: 3100, low: 3000, close: 3075 },
      ];

      const ohlcv = normalizer.normalizeCandles(candles);

      expect(ohlcv).toHaveLength(2);
      expect(ohlcv[0][0]).toBe(1700000000000);
      expect(ohlcv[1][0]).toBe(1700003600000);
    });
  });

  describe('normalizeOrder', () => {
    const mockOrder: GmxOrder = {
      key: '0x123abc',
      account: '0xuser123',
      receiver: '0xuser123',
      callbackContract: '0x0',
      uiFeeReceiver: '0x0',
      market: GMX_MARKETS['ETH/USD:ETH'].marketAddress,
      initialCollateralToken: GMX_MARKETS['ETH/USD:ETH'].shortToken,
      swapPath: [],
      orderType: 2, // LIMIT_INCREASE
      decreasePositionSwapType: 0,
      sizeDeltaUsd: (10000 * GMX_PRECISION.USD).toString(),
      initialCollateralDeltaAmount: '1000000000', // 1000 USDC
      triggerPrice: (3000 * GMX_PRECISION.PRICE).toString(),
      acceptablePrice: (3100 * GMX_PRECISION.PRICE).toString(),
      executionFee: '100000000000000',
      callbackGasLimit: '0',
      minOutputAmount: '0',
      updatedAtBlock: '12345678',
      isLong: true,
      isFrozen: false,
      status: 'Pending',
      createdTxn: '0xtxn123',
    };

    test('should normalize order to unified format', () => {
      const order = normalizer.normalizeOrder(mockOrder, 3000);

      expect(order.id).toBe('0x123abc');
      expect(order.symbol).toBe('ETH/USD:ETH');
      expect(order.type).toBe('limit');
      expect(order.side).toBe('buy');
      expect(order.price).toBe(3000);
      expect(order.status).toBe('open');
    });

    test('should detect market order type', () => {
      const marketOrder = { ...mockOrder, orderType: 0 };
      const order = normalizer.normalizeOrder(marketOrder, 3000);
      expect(order.type).toBe('market');
    });

    test('should detect stop loss order type', () => {
      const stopOrder = { ...mockOrder, orderType: 4 };
      const order = normalizer.normalizeOrder(stopOrder, 3000);
      expect(order.type).toBe('stopMarket');
    });

    test('should set status correctly for filled orders', () => {
      const filledOrder = { ...mockOrder, status: 'Executed' };
      const order = normalizer.normalizeOrder(filledOrder, 3000);
      expect(order.status).toBe('filled');
    });

    test('should set status correctly for cancelled orders', () => {
      const cancelledOrder = { ...mockOrder, status: 'Cancelled' };
      const order = normalizer.normalizeOrder(cancelledOrder, 3000);
      expect(order.status).toBe('canceled');
    });
  });

  describe('normalizeTrade', () => {
    const mockTrade: GmxTrade = {
      id: 'trade123',
      account: '0xuser123',
      market: GMX_MARKETS['ETH/USD:ETH'].marketAddress,
      collateralToken: GMX_MARKETS['ETH/USD:ETH'].shortToken,
      sizeDeltaUsd: (5000 * GMX_PRECISION.USD).toString(),
      sizeDeltaInTokens: '1500000000000000000', // 1.5 ETH
      collateralDeltaAmount: '500000000', // 500 USDC
      borrowingFactor: '0',
      fundingFeeAmountPerSize: '0',
      pnlUsd: (100 * GMX_PRECISION.USD).toString(),
      priceImpactUsd: (-5 * GMX_PRECISION.USD).toString(),
      orderType: 0, // MARKET_INCREASE
      isLong: true,
      executionPrice: (3333 * GMX_PRECISION.PRICE).toString(),
      timestamp: 1700000000,
      transactionHash: '0xtxn456',
    };

    test('should normalize trade to unified format', () => {
      const trade = normalizer.normalizeTrade(mockTrade);

      expect(trade.id).toBe('trade123');
      expect(trade.symbol).toBe('ETH/USD:ETH');
      expect(trade.side).toBe('buy');
      expect(trade.price).toBe(3333);
      expect(trade.amount).toBeCloseTo(1.5, 10);
      expect(trade.cost).toBe(5000);
      expect(trade.timestamp).toBe(1700000000000);
    });

    test('should include trade info', () => {
      const trade = normalizer.normalizeTrade(mockTrade);

      expect(trade.info.isLong).toBe(true);
      expect(trade.info.transactionHash).toBe('0xtxn456');
    });
  });
});
