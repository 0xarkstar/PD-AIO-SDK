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

  // Helper to create mock market info with new API format
  const createMockMarketInfo = (overrides?: Partial<GmxMarketInfo>): GmxMarketInfo => ({
    marketToken: GMX_MARKETS['ETH/USD:ETH'].marketAddress,
    indexToken: GMX_MARKETS['ETH/USD:ETH'].indexToken,
    longToken: GMX_MARKETS['ETH/USD:ETH'].longToken,
    shortToken: GMX_MARKETS['ETH/USD:ETH'].shortToken,
    name: 'ETH/USD [WETH-USDC]',
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
    ...overrides,
  });

  describe('normalizeMarket', () => {
    test('should normalize market to unified format', () => {
      const mockMarketInfo = createMockMarketInfo();
      const market = normalizer.normalizeMarket(mockMarketInfo, 'arbitrum');

      expect(market.id).toBe(mockMarketInfo.marketToken);
      expect(market.symbol).toBe('ETH/USD:ETH');
      expect(market.base).toBe('ETH');
      expect(market.quote).toBe('USD');
      expect(market.settle).toBe('ETH');
      expect(market.active).toBe(true);
    });

    test('should calculate max leverage from market config', () => {
      const mockMarketInfo = createMockMarketInfo();
      const market = normalizer.normalizeMarket(mockMarketInfo, 'arbitrum');
      expect(market.maxLeverage).toBe(100);
    });

    test('should set market as inactive when disabled', () => {
      const disabledMarket = createMockMarketInfo({ isDisabled: true });
      const market = normalizer.normalizeMarket(disabledMarket, 'arbitrum');
      expect(market.active).toBe(false);
    });

    test('should include chain info in market info', () => {
      const mockMarketInfo = createMockMarketInfo();
      const market = normalizer.normalizeMarket(mockMarketInfo, 'arbitrum');
      expect(market.info.chain).toBe('arbitrum');
    });
  });

  describe('normalizeMarkets', () => {
    test('should normalize array of markets', () => {
      const mockMarkets: GmxMarketInfo[] = [
        createMockMarketInfo({
          maxOpenInterestLong: (1000000 * GMX_PRECISION.USD).toString(),
          maxOpenInterestShort: (1000000 * GMX_PRECISION.USD).toString(),
        }),
      ];

      const markets = normalizer.normalizeMarkets(mockMarkets, 'arbitrum');
      expect(markets).toHaveLength(1);
      expect(markets[0].symbol).toBe('ETH/USD:ETH');
    });
  });

  describe('normalizeTicker', () => {
    test('should normalize to ticker format', () => {
      const mockMarketInfo = createMockMarketInfo({
        longInterestUsd: (500000 * GMX_PRECISION.USD).toString(),
        shortInterestUsd: (300000 * GMX_PRECISION.USD).toString(),
      });

      // Provide price data since it's no longer in the market info
      const priceData = { minPrice: 2999, maxPrice: 3001 };
      const ticker = normalizer.normalizeTicker(mockMarketInfo, priceData);

      expect(ticker.symbol).toBe('ETH/USD:ETH');
      expect(ticker.bid).toBeCloseTo(2999, 5);
      expect(ticker.ask).toBeCloseTo(3001, 5);
      expect(ticker.last).toBeCloseTo(3000, 5); // midpoint
      expect(ticker.timestamp).toBeDefined();
    });

    test('should calculate spread info', () => {
      const mockMarketInfo = createMockMarketInfo({
        longInterestUsd: (500000 * GMX_PRECISION.USD).toString(),
        shortInterestUsd: (300000 * GMX_PRECISION.USD).toString(),
      });

      const priceData = { minPrice: 2999, maxPrice: 3001 };
      const ticker = normalizer.normalizeTicker(mockMarketInfo, priceData);

      expect(ticker.info.spread).toBeCloseTo(2, 5);
      expect(ticker.info.spreadPercent).toBeCloseTo(0.0667, 2);
    });

    test('should include open interest info', () => {
      const mockMarketInfo = createMockMarketInfo({
        longInterestUsd: (500000 * GMX_PRECISION.USD).toString(),
        shortInterestUsd: (300000 * GMX_PRECISION.USD).toString(),
      });

      const priceData = { minPrice: 2999, maxPrice: 3001 };
      const ticker = normalizer.normalizeTicker(mockMarketInfo, priceData);

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

    test('should detect sell trade for decrease long', () => {
      const sellTrade = { ...mockTrade, orderType: 1 }; // MARKET_DECREASE
      const trade = normalizer.normalizeTrade(sellTrade);
      expect(trade.side).toBe('sell');
    });

    test('should detect buy trade for decrease short', () => {
      const closeShortTrade = { ...mockTrade, orderType: 1, isLong: false };
      const trade = normalizer.normalizeTrade(closeShortTrade);
      expect(trade.side).toBe('buy');
    });
  });

  describe('normalizePosition', () => {
    const mockPosition: GmxPosition = {
      account: '0xuser123',
      market: GMX_MARKETS['ETH/USD:ETH'].marketAddress,
      collateralToken: GMX_MARKETS['ETH/USD:ETH'].shortToken,
      sizeInUsd: (10000 * GMX_PRECISION.USD).toString(),
      sizeInTokens: (5 * 1e18).toString(), // 5 ETH
      collateralAmount: (0.5 * 1e18).toString(), // 0.5 ETH equivalent collateral
      borrowingFactor: '0',
      fundingFeeAmountPerSize: '0',
      longTokenClaimableFundingAmountPerSize: '0',
      shortTokenClaimableFundingAmountPerSize: '0',
      increasedAtBlock: '100000',
      decreasedAtBlock: '0',
      isLong: true,
    };

    test('should normalize long position', () => {
      const position = normalizer.normalizePosition(mockPosition, 2000, 'arbitrum');

      expect(position.symbol).toBe('ETH/USD:ETH');
      expect(position.side).toBe('long');
      expect(position.size).toBe(5);
      expect(position.markPrice).toBe(2000);
      expect(position.marginMode).toBe('cross');
    });

    test('should normalize short position', () => {
      const shortPosition = { ...mockPosition, isLong: false };
      const position = normalizer.normalizePosition(shortPosition, 2000, 'arbitrum');

      expect(position.side).toBe('short');
    });

    test('should calculate entry price from size', () => {
      // $10000 position / 5 ETH = $2000 entry
      const position = normalizer.normalizePosition(mockPosition, 2000, 'arbitrum');
      expect(position.entryPrice).toBe(2000);
    });

    test('should calculate unrealized PnL for profitable long', () => {
      // Entry at $2000 (10000/5), mark at $2200, 5 ETH
      // PnL = 5 * (2200 - 2000) = $1000
      const position = normalizer.normalizePosition(mockPosition, 2200, 'arbitrum');
      expect(position.unrealizedPnl).toBeCloseTo(1000, 0);
    });

    test('should calculate unrealized PnL for losing long', () => {
      // Entry at $2000, mark at $1800, 5 ETH
      // PnL = 5 * (1800 - 2000) = -$1000
      const position = normalizer.normalizePosition(mockPosition, 1800, 'arbitrum');
      expect(position.unrealizedPnl).toBeCloseTo(-1000, 0);
    });

    test('should calculate unrealized PnL for profitable short', () => {
      const shortPosition = { ...mockPosition, isLong: false };
      // Short entry at $2000, mark at $1800
      // PnL = 5 * (2000 - 1800) = $1000
      const position = normalizer.normalizePosition(shortPosition, 1800, 'arbitrum');
      expect(position.unrealizedPnl).toBeCloseTo(1000, 0);
    });

    test('should include position info with market address', () => {
      const position = normalizer.normalizePosition(mockPosition, 2000, 'arbitrum');
      expect(position.info.marketAddress).toBe(mockPosition.market);
      expect(position.info.chain).toBe('arbitrum');
    });
  });

  describe('normalizeFundingRate', () => {
    const mockFundingRate: GmxFundingRate = {
      market: GMX_MARKETS['ETH/USD:ETH'].marketAddress,
      fundingFactorPerSecond: (0.000000001 * GMX_PRECISION.FACTOR).toString(),
      longsPayShorts: true,
      fundingFeeAmountPerSizeLong: '100000000000000000000',
      fundingFeeAmountPerSizeShort: '0',
      timestamp: 1700000000,
    };

    test('should normalize funding rate when longs pay', () => {
      const funding = normalizer.normalizeFundingRate(mockFundingRate, 2000);

      expect(funding.symbol).toBe('ETH/USD:ETH');
      expect(funding.fundingRate).toBeGreaterThan(0); // Positive when longs pay
      expect(funding.markPrice).toBe(2000);
      expect(funding.indexPrice).toBe(2000);
      expect(funding.fundingIntervalHours).toBe(1);
    });

    test('should normalize funding rate when shorts pay', () => {
      const shortPaysFunding = { ...mockFundingRate, longsPayShorts: false };
      const funding = normalizer.normalizeFundingRate(shortPaysFunding, 2000);

      expect(funding.fundingRate).toBeLessThan(0); // Negative when shorts pay
    });

    test('should include funding info', () => {
      const funding = normalizer.normalizeFundingRate(mockFundingRate, 2000);

      expect(funding.info.marketAddress).toBe(mockFundingRate.market);
      expect(funding.info.longsPayShorts).toBe(true);
    });

    test('should calculate next funding timestamp', () => {
      const funding = normalizer.normalizeFundingRate(mockFundingRate, 2000);

      expect(funding.fundingTimestamp).toBe(1700000000000);
      expect(funding.nextFundingTimestamp).toBe(1700003600000); // 1 hour later
    });
  });

  describe('edge cases', () => {
    test('should handle unknown market address gracefully', () => {
      const unknownMarket = createMockMarketInfo({
        marketToken: '0xunknownmarketaddress',
        name: 'UNKNOWN/USD',
      });

      const market = normalizer.normalizeMarket(unknownMarket, 'arbitrum');

      expect(market.base).toBe('UNKNOWN');
      expect(market.symbol).toBe('UNKNOWN/USD');
    });

    test('should extract base from complex market name', () => {
      const complexNameMarket = createMockMarketInfo({
        marketToken: '0xunknown',
        name: 'LINK/USD [ETH-USDC]',
      });

      const market = normalizer.normalizeMarket(complexNameMarket, 'arbitrum');
      expect(market.base).toBe('LINK');
    });

    test('should handle expired order status', () => {
      const expiredOrder: GmxOrder = {
        key: '0xexpired',
        account: '0xuser',
        receiver: '0xuser',
        callbackContract: '0x0',
        uiFeeReceiver: '0x0',
        market: GMX_MARKETS['ETH/USD:ETH'].marketAddress,
        initialCollateralToken: GMX_MARKETS['ETH/USD:ETH'].shortToken,
        swapPath: [],
        orderType: 2,
        decreasePositionSwapType: 0,
        sizeDeltaUsd: (1000 * GMX_PRECISION.USD).toString(),
        initialCollateralDeltaAmount: '100000000',
        triggerPrice: (3000 * GMX_PRECISION.PRICE).toString(),
        acceptablePrice: (3100 * GMX_PRECISION.PRICE).toString(),
        executionFee: '100000000000000',
        callbackGasLimit: '0',
        minOutputAmount: '0',
        updatedAtBlock: '12345678',
        isLong: true,
        isFrozen: false,
        status: 'Expired',
        createdTxn: '0xtxn',
      };

      const order = normalizer.normalizeOrder(expiredOrder);
      expect(order.status).toBe('expired');
    });

    test('should handle frozen order as rejected', () => {
      const frozenOrder: GmxOrder = {
        key: '0xfrozen',
        account: '0xuser',
        receiver: '0xuser',
        callbackContract: '0x0',
        uiFeeReceiver: '0x0',
        market: GMX_MARKETS['ETH/USD:ETH'].marketAddress,
        initialCollateralToken: GMX_MARKETS['ETH/USD:ETH'].shortToken,
        swapPath: [],
        orderType: 0,
        decreasePositionSwapType: 0,
        sizeDeltaUsd: (1000 * GMX_PRECISION.USD).toString(),
        initialCollateralDeltaAmount: '100000000',
        triggerPrice: '0',
        acceptablePrice: (3100 * GMX_PRECISION.PRICE).toString(),
        executionFee: '100000000000000',
        callbackGasLimit: '0',
        minOutputAmount: '0',
        updatedAtBlock: '12345678',
        isLong: true,
        isFrozen: true,
        status: 'Open',
        createdTxn: '0xtxn',
      };

      const order = normalizer.normalizeOrder(frozenOrder, 3000);
      expect(order.status).toBe('rejected');
    });

    test('should handle ticker without price data', () => {
      const market = createMockMarketInfo();
      const ticker = normalizer.normalizeTicker(market);

      expect(ticker.last).toBe(0);
      expect(ticker.bid).toBe(0);
      expect(ticker.ask).toBe(0);
    });

    test('should handle position with zero size', () => {
      const zeroPosition: GmxPosition = {
        account: '0xuser',
        market: GMX_MARKETS['ETH/USD:ETH'].marketAddress,
        collateralToken: GMX_MARKETS['ETH/USD:ETH'].shortToken,
        sizeInUsd: '0',
        sizeInTokens: '0',
        collateralAmount: (0.1 * 1e18).toString(),
        borrowingFactor: '0',
        fundingFeeAmountPerSize: '0',
        longTokenClaimableFundingAmountPerSize: '0',
        shortTokenClaimableFundingAmountPerSize: '0',
        increasedAtBlock: '100000',
        decreasedAtBlock: '100001',
        isLong: true,
      };

      const position = normalizer.normalizePosition(zeroPosition, 2000, 'arbitrum');
      expect(position.size).toBe(0);
      expect(position.entryPrice).toBe(2000); // Falls back to mark price
    });
  });
});
