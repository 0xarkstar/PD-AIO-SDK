/**
 * Drift Protocol Normalizer Tests
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { DriftNormalizer } from '../../src/adapters/drift/DriftNormalizer.js';
import { DRIFT_PRECISION } from '../../src/adapters/drift/constants.js';
import type {
  DriftPerpMarketAccount,
  DriftPerpPosition,
  DriftOrder,
  DriftL2OrderBook,
  DriftTrade,
  DriftFundingRate,
  DriftFundingRateRecord,
  DriftMarketStats,
  DriftSpotPosition,
  DriftCandle,
} from '../../src/adapters/drift/types.js';

describe('DriftNormalizer', () => {
  let normalizer: DriftNormalizer;

  beforeEach(() => {
    normalizer = new DriftNormalizer();
  });

  describe('normalizeMarket', () => {
    test('should normalize market account data', () => {
      const marketAccount: DriftPerpMarketAccount = {
        marketIndex: 0,
        status: 'active',
        name: 'SOL-PERP',
        marginRatioInitial: 500, // 5% = 500 / 10000
        marginRatioMaintenance: 300,
        imfFactor: 0,
        numberOfUsers: 1000,
        numberOfUsersWithBase: 500,
        unrealizedPnlImfFactor: 0,
        liquidatorFee: 0,
        ifLiquidationFee: 0,
        contractType: 'perpetual',
        contractTier: 'A',
        pausedOperations: 0,
        quoteSpotMarketIndex: 0,
        feeAdjustment: 0,
        expiryTs: '0',
        expiryPrice: '0',
        unrealizedPnlMaxImbalance: '0',
        nextFillRecordId: '1',
        nextFundingRateRecordId: '1',
        nextCurveRecordId: '1',
        pnlPool: { scaledBalance: '0', marketIndex: 0 },
        insuranceClaim: {
          revenueWithdrawSinceLastSettle: '0',
          maxRevenueWithdrawPerPeriod: '0',
          lastRevenueWithdrawTs: '0',
          quoteSettledInsurance: '0',
          quoteMaxInsurance: '0',
        },
        amm: {
          oracleSource: 'pyth',
          baseAssetReserve: '1000000000000',
          quoteAssetReserve: '1000000000000',
          sqrtK: '1000000000000',
          pegMultiplier: '1000000',
          terminalQuoteAssetReserve: '1000000000000',
          baseAssetAmountWithAmm: '0',
          baseAssetAmountLong: '0',
          baseAssetAmountShort: '0',
          quoteAssetAmount: '0',
          quoteEntryAmountLong: '0',
          quoteEntryAmountShort: '0',
          quoteBreakEvenAmountLong: '0',
          quoteBreakEvenAmountShort: '0',
          userLpShares: '0',
          lastFundingRate: '0',
          lastFundingRateLong: '0',
          lastFundingRateShort: '0',
          last24hAvgFundingRate: '0',
          totalFee: '0',
          totalMmFee: '0',
          totalExchangeFee: '0',
          totalFeeMinusDistributions: '0',
          totalFeeWithdrawn: '0',
          totalLiquidationFee: '0',
          cumulativeFundingRateLong: '0',
          cumulativeFundingRateShort: '0',
          totalSocialLoss: '0',
          askBaseAssetReserve: '0',
          askQuoteAssetReserve: '0',
          bidBaseAssetReserve: '0',
          bidQuoteAssetReserve: '0',
          lastOracleNormalisedPrice: '0',
          lastOracleReservePriceSpreadPct: '0',
          lastBidPriceTwap: '0',
          lastAskPriceTwap: '0',
          lastMarkPriceTwap: '0',
          lastMarkPriceTwap5min: '0',
          lastUpdateSlot: '0',
          lastOracleConfPct: '0',
          netRevenueSinceLastFunding: '0',
          lastFundingRateTs: '0',
          fundingPeriod: '3600',
          orderStepSize: '100000000', // 0.1 in BASE_PRECISION
          orderTickSize: '10000', // 0.01 in PRICE_PRECISION
          minOrderSize: '100000000', // 0.1 in BASE_PRECISION
          maxPositionSize: '10000000000000', // 10000 in BASE_PRECISION
          volume24h: '0',
          longIntensityCount: 0,
          longIntensityVolume: '0',
          shortIntensityCount: 0,
          shortIntensityVolume: '0',
          maxSpread: 0,
          maxFillReserveFraction: 0,
          maxSlippageRatio: 0,
          curveUpdateIntensity: 0,
          ammJitIntensity: 0,
          oracle: 'oracles...',
          historicalOracleData: {
            lastOraclePrice: '0',
            lastOracleConf: '0',
            lastOracleDelay: '0',
            lastOraclePriceTwap: '0',
            lastOraclePriceTwap5min: '0',
            lastOraclePriceTwapTs: '0',
          },
          baseSpread: 0,
          maxBaseAssetReserve: '0',
          minBaseAssetReserve: '0',
          totalLpShares: '0',
          perLpBase: 0,
        },
      };

      const market = normalizer.normalizeMarket(marketAccount);

      expect(market.symbol).toBe('SOL/USD:USD');
      expect(market.base).toBe('SOL');
      expect(market.quote).toBe('USD');
      expect(market.settle).toBe('USD');
      expect(market.active).toBe(true);
      expect(market.maxLeverage).toBe(20);
      expect(market.fundingIntervalHours).toBe(1);
      expect(market.info?.marketIndex).toBe(0);
    });
  });

  describe('normalizeMarkets (line 89)', () => {
    test('should normalize array of markets', () => {
      const markets: DriftPerpMarketAccount[] = [
        {
          marketIndex: 0,
          status: 'active',
          name: 'SOL-PERP',
          marginRatioInitial: 500,
          marginRatioMaintenance: 300,
          imfFactor: 0,
          numberOfUsers: 100,
          numberOfUsersWithBase: 50,
          unrealizedPnlImfFactor: 0,
          liquidatorFee: 0,
          ifLiquidationFee: 0,
          contractType: 'perpetual',
          contractTier: 'A',
          pausedOperations: 0,
          quoteSpotMarketIndex: 0,
          feeAdjustment: 0,
          expiryTs: '0',
          expiryPrice: '0',
          unrealizedPnlMaxImbalance: '0',
          nextFillRecordId: '1',
          nextFundingRateRecordId: '1',
          nextCurveRecordId: '1',
          pnlPool: { scaledBalance: '0', marketIndex: 0 },
          insuranceClaim: {
            revenueWithdrawSinceLastSettle: '0',
            maxRevenueWithdrawPerPeriod: '0',
            lastRevenueWithdrawTs: '0',
            quoteSettledInsurance: '0',
            quoteMaxInsurance: '0',
          },
          amm: {
            oracleSource: 'pyth',
            baseAssetReserve: '1000000000000',
            quoteAssetReserve: '1000000000000',
            sqrtK: '1000000000000',
            pegMultiplier: '1000000',
            terminalQuoteAssetReserve: '1000000000000',
            baseAssetAmountWithAmm: '0',
            baseAssetAmountLong: '0',
            baseAssetAmountShort: '0',
            quoteAssetAmount: '0',
            quoteEntryAmountLong: '0',
            quoteEntryAmountShort: '0',
            quoteBreakEvenAmountLong: '0',
            quoteBreakEvenAmountShort: '0',
            userLpShares: '0',
            lastFundingRate: '0',
            lastFundingRateLong: '0',
            lastFundingRateShort: '0',
            last24hAvgFundingRate: '0',
            totalFee: '0',
            totalMmFee: '0',
            totalExchangeFee: '0',
            totalFeeMinusDistributions: '0',
            totalFeeWithdrawn: '0',
            totalLiquidationFee: '0',
            cumulativeFundingRateLong: '0',
            cumulativeFundingRateShort: '0',
            totalSocialLoss: '0',
            orderStepSize: '10000000',
            orderTickSize: '100',
            minOrderSize: '10000000',
            maxPositionSize: '100000000000000',
            volume24h: '0',
            longIntensityVolume: '0',
            shortIntensityVolume: '0',
            lastTradeTs: '0',
            markStd: '0',
            oracleStd: '0',
            lastMarkPriceTwap: '100000000',
            lastMarkPriceTwap5min: '100000000',
            lastMarkPriceTwapTs: '0',
            lastOraclePriceTwap: '100000000',
            lastOraclePriceTwap5min: '100000000',
            lastOracleConfPct: '0',
            lastOracleReservePriceSpreadPct: '0',
            lastOraclePriceTwapTs: '0',
            oracle: 'test-oracle-address',
            baseSpread: 0,
            maxSpread: 0,
            longSpread: 0,
            shortSpread: 0,
            maxFillReserveFraction: 0,
            maxSlippageRatio: 0,
            curveUpdateIntensity: 0,
            concentrationCoef: 0,
            ammJitIntensity: 0,
            historicalOracleData: {
              lastOraclePrice: '100000000',
              lastOracleConf: '0',
              lastOracleDelay: '0',
              lastOraclePriceTwap: '100000000',
              lastOraclePriceTwap5min: '100000000',
              lastOraclePriceTwapTs: '0',
            },
          },
        },
      ];

      const normalized = normalizer.normalizeMarkets(markets);

      expect(normalized).toHaveLength(1);
      expect(normalized[0].symbol).toBe('SOL/USD:USD');
    });
  });

  describe('normalizePosition', () => {
    test('should normalize long position', () => {
      const position: DriftPerpPosition = {
        marketIndex: 0,
        baseAssetAmount: String(10 * DRIFT_PRECISION.BASE), // 10 SOL
        quoteAssetAmount: String(-1000 * DRIFT_PRECISION.QUOTE), // -1000 USD
        quoteEntryAmount: String(-1000 * DRIFT_PRECISION.QUOTE),
        quoteBreakEvenAmount: String(-1000 * DRIFT_PRECISION.QUOTE),
        openOrders: 0,
        openBids: '0',
        openAsks: '0',
        settledPnl: String(50 * DRIFT_PRECISION.QUOTE), // +50 USD settled
        lpShares: '0',
        lastCumulativeFundingRate: '0',
        perLpBase: 0,
      };

      const markPrice = 120; // Current price
      const oraclePrice = 119;

      const normalized = normalizer.normalizePosition(position, markPrice, oraclePrice);

      expect(normalized.symbol).toBe('SOL/USD:USD');
      expect(normalized.side).toBe('long');
      expect(normalized.size).toBe(10);
      expect(normalized.entryPrice).toBe(100); // 1000 / 10
      expect(normalized.markPrice).toBe(120);
      expect(normalized.unrealizedPnl).toBe(200); // 10 * (120 - 100)
      expect(normalized.realizedPnl).toBe(50);
      expect(normalized.marginMode).toBe('cross');
      expect(normalized.info?.marketIndex).toBe(0);
    });

    test('should normalize short position', () => {
      const position: DriftPerpPosition = {
        marketIndex: 1,
        baseAssetAmount: String(-0.1 * DRIFT_PRECISION.BASE), // -0.1 BTC (short)
        quoteAssetAmount: String(5000 * DRIFT_PRECISION.QUOTE), // +5000 USD
        quoteEntryAmount: String(5000 * DRIFT_PRECISION.QUOTE),
        quoteBreakEvenAmount: String(5000 * DRIFT_PRECISION.QUOTE),
        openOrders: 0,
        openBids: '0',
        openAsks: '0',
        settledPnl: '0',
        lpShares: '0',
        lastCumulativeFundingRate: '0',
        perLpBase: 0,
      };

      const markPrice = 48000;
      const oraclePrice = 48000;

      const normalized = normalizer.normalizePosition(position, markPrice, oraclePrice);

      expect(normalized.side).toBe('short');
      expect(normalized.size).toBe(0.1);
      expect(normalized.entryPrice).toBe(50000); // 5000 / 0.1
      expect(normalized.unrealizedPnl).toBe(200); // 0.1 * (50000 - 48000)
    });
  });

  describe('normalizeOrder', () => {
    test('should normalize limit order', () => {
      const order: DriftOrder = {
        orderId: 12345,
        userOrderId: 1,
        marketIndex: 0,
        status: 'open',
        orderType: 'limit',
        marketType: 'perp',
        direction: 'long',
        baseAssetAmount: String(5 * DRIFT_PRECISION.BASE),
        baseAssetAmountFilled: String(2 * DRIFT_PRECISION.BASE),
        quoteAssetAmountFilled: String(200 * DRIFT_PRECISION.QUOTE),
        price: String(100 * DRIFT_PRECISION.PRICE),
        reduceOnly: false,
        triggerPrice: '0',
        triggerCondition: 'above',
        existingPositionDirection: 'long',
        postOnly: 'mustPostOnly',
        immediateOrCancel: false,
        maxTs: '0',
        oraclePriceOffset: 0,
        auctionDuration: 0,
        auctionStartPrice: '0',
        auctionEndPrice: '0',
        slot: 100000000,
      };

      const normalized = normalizer.normalizeOrder(order, 100);

      expect(normalized.id).toBe('12345');
      expect(normalized.symbol).toBe('SOL/USD:USD');
      expect(normalized.type).toBe('limit');
      expect(normalized.side).toBe('buy');
      expect(normalized.amount).toBe(5);
      expect(normalized.price).toBe(100);
      expect(normalized.filled).toBe(2);
      expect(normalized.remaining).toBe(3);
      expect(normalized.averagePrice).toBe(100); // 200 / 2
      expect(normalized.reduceOnly).toBe(false);
      expect(normalized.postOnly).toBe(true);
      expect(normalized.clientOrderId).toBe('1');
      expect(normalized.info?.orderId).toBe(12345);
    });

    test('should normalize market order', () => {
      const order: DriftOrder = {
        orderId: 12346,
        userOrderId: 0,
        marketIndex: 1,
        status: 'filled',
        orderType: 'market',
        marketType: 'perp',
        direction: 'short',
        baseAssetAmount: String(0.01 * DRIFT_PRECISION.BASE),
        baseAssetAmountFilled: String(0.01 * DRIFT_PRECISION.BASE),
        quoteAssetAmountFilled: String(500 * DRIFT_PRECISION.QUOTE),
        price: '0',
        reduceOnly: true,
        triggerPrice: '0',
        triggerCondition: 'above',
        existingPositionDirection: 'long',
        postOnly: 'none',
        immediateOrCancel: false,
        maxTs: '0',
        oraclePriceOffset: 0,
        auctionDuration: 0,
        auctionStartPrice: '0',
        auctionEndPrice: '0',
        slot: 100000001,
      };

      const normalized = normalizer.normalizeOrder(order, 50000);

      expect(normalized.type).toBe('market');
      expect(normalized.side).toBe('sell');
      expect(normalized.status).toBe('filled');
      expect(normalized.reduceOnly).toBe(true);
      expect(normalized.postOnly).toBe(false);
      expect(normalized.clientOrderId).toBeUndefined();
    });

    test('should normalize trigger order', () => {
      const order: DriftOrder = {
        orderId: 12347,
        userOrderId: 0,
        marketIndex: 0,
        status: 'open',
        orderType: 'triggerMarket',
        marketType: 'perp',
        direction: 'short',
        baseAssetAmount: String(1 * DRIFT_PRECISION.BASE),
        baseAssetAmountFilled: '0',
        quoteAssetAmountFilled: '0',
        price: '0',
        reduceOnly: true,
        triggerPrice: String(90 * DRIFT_PRECISION.PRICE),
        triggerCondition: 'below',
        existingPositionDirection: 'long',
        postOnly: 'none',
        immediateOrCancel: false,
        maxTs: '0',
        oraclePriceOffset: 0,
        auctionDuration: 0,
        auctionStartPrice: '0',
        auctionEndPrice: '0',
        slot: 100000002,
      };

      const normalized = normalizer.normalizeOrder(order, 100);

      expect(normalized.type).toBe('stopMarket');
      expect(normalized.stopPrice).toBe(90);
    });
  });

  describe('normalizeOrderBook', () => {
    test('should normalize L2 orderbook', () => {
      const orderbook: DriftL2OrderBook = {
        marketIndex: 0,
        marketType: 'perp',
        bids: [
          { price: String(99.5 * DRIFT_PRECISION.PRICE), size: String(100 * DRIFT_PRECISION.BASE) },
          { price: String(99 * DRIFT_PRECISION.PRICE), size: String(200 * DRIFT_PRECISION.BASE) },
        ],
        asks: [
          { price: String(100.5 * DRIFT_PRECISION.PRICE), size: String(150 * DRIFT_PRECISION.BASE) },
          { price: String(101 * DRIFT_PRECISION.PRICE), size: String(250 * DRIFT_PRECISION.BASE) },
        ],
        oraclePrice: String(100 * DRIFT_PRECISION.PRICE),
        slot: 12345678,
      };

      const normalized = normalizer.normalizeOrderBook(orderbook);

      expect(normalized.symbol).toBe('SOL/USD:USD');
      expect(normalized.exchange).toBe('drift');
      expect(normalized.bids).toHaveLength(2);
      expect(normalized.asks).toHaveLength(2);

      // Check bid prices (should be in descending order)
      expect(normalized.bids[0][0]).toBe(99.5);
      expect(normalized.bids[0][1]).toBe(100);
      expect(normalized.bids[1][0]).toBe(99);
      expect(normalized.bids[1][1]).toBe(200);

      // Check ask prices (should be in ascending order)
      expect(normalized.asks[0][0]).toBe(100.5);
      expect(normalized.asks[0][1]).toBe(150);
      expect(normalized.asks[1][0]).toBe(101);
      expect(normalized.asks[1][1]).toBe(250);

      expect(normalized.sequenceId).toBe(12345678);
    });
  });

  describe('normalizeTrade', () => {
    test('should normalize trade data', () => {
      const trade: DriftTrade = {
        recordId: 'rec_123',
        fillRecordId: 'fill_456',
        marketIndex: 0,
        marketType: 'perp',
        taker: 'taker_pubkey',
        takerOrderId: 1,
        takerOrderDirection: 'long',
        maker: 'maker_pubkey',
        makerOrderId: 2,
        makerOrderDirection: 'short',
        baseAssetAmount: String(5 * DRIFT_PRECISION.BASE),
        quoteAssetAmount: String(500 * DRIFT_PRECISION.QUOTE),
        fillPrice: String(100 * DRIFT_PRECISION.PRICE),
        action: 'fill',
        actionExplanation: 'orderFilledWithAmm',
        txSig: 'tx_signature_123',
        slot: 123456789,
        ts: Math.floor(Date.now() / 1000),
      };

      const normalized = normalizer.normalizeTrade(trade);

      expect(normalized.id).toBe('fill_456');
      expect(normalized.symbol).toBe('SOL/USD:USD');
      expect(normalized.side).toBe('buy'); // taker direction is long
      expect(normalized.price).toBe(100);
      expect(normalized.amount).toBe(5);
      expect(normalized.cost).toBe(500);
      expect(normalized.info?.taker).toBe('taker_pubkey');
      expect(normalized.info?.maker).toBe('maker_pubkey');
      expect(normalized.info?.txSig).toBe('tx_signature_123');
    });
  });

  describe('normalizeFundingRate', () => {
    test('should normalize funding rate from DriftFundingRate', () => {
      const funding: DriftFundingRate = {
        marketIndex: 0,
        fundingRate: String(0.0001 * DRIFT_PRECISION.FUNDING_RATE), // 0.01%
        fundingRateLong: String(0.0001 * DRIFT_PRECISION.FUNDING_RATE),
        fundingRateShort: String(-0.0001 * DRIFT_PRECISION.FUNDING_RATE),
        cumulativeFundingRateLong: String(0.01 * DRIFT_PRECISION.FUNDING_RATE),
        cumulativeFundingRateShort: String(-0.01 * DRIFT_PRECISION.FUNDING_RATE),
        oraclePrice: String(100 * DRIFT_PRECISION.PRICE),
        markPriceTwap: String(100.1 * DRIFT_PRECISION.PRICE),
        ts: Math.floor(Date.now() / 1000),
      };

      const normalized = normalizer.normalizeFundingRate(funding);

      expect(normalized.symbol).toBe('SOL/USD:USD');
      expect(normalized.fundingRate).toBeCloseTo(0.0001, 6);
      expect(normalized.markPrice).toBeCloseTo(100.1, 1);
      expect(normalized.indexPrice).toBeCloseTo(100, 1);
      expect(normalized.fundingIntervalHours).toBe(1);
      expect(normalized.info?.marketIndex).toBe(0);
    });

    test('should normalize funding rate from DriftFundingRateRecord', () => {
      const fundingRecord: DriftFundingRateRecord = {
        recordId: 'record_123',
        marketIndex: 1,
        fundingRate: String(0.0002 * DRIFT_PRECISION.FUNDING_RATE),
        fundingRateLong: String(0.0002 * DRIFT_PRECISION.FUNDING_RATE),
        fundingRateShort: String(-0.0002 * DRIFT_PRECISION.FUNDING_RATE),
        cumulativeFundingRateLong: String(0.02 * DRIFT_PRECISION.FUNDING_RATE),
        cumulativeFundingRateShort: String(-0.02 * DRIFT_PRECISION.FUNDING_RATE),
        oraclePriceTwap: String(50000 * DRIFT_PRECISION.PRICE),
        markPriceTwap: String(50050 * DRIFT_PRECISION.PRICE),
        periodRevenue: '1000000000',
        baseAssetAmountWithAmm: '0',
        baseAssetAmountWithUnsettledLp: '0',
        ts: Math.floor(Date.now() / 1000),
      };

      const normalized = normalizer.normalizeFundingRate(fundingRecord);

      expect(normalized.symbol).toBe('BTC/USD:USD');
      expect(normalized.fundingRate).toBeCloseTo(0.0002, 6);
      expect(normalized.markPrice).toBeCloseTo(50050, 0);
      expect(normalized.indexPrice).toBeCloseTo(50000, 0);
    });
  });

  describe('normalizeTicker', () => {
    test('should normalize market stats to ticker', () => {
      const stats: DriftMarketStats = {
        marketIndex: 0,
        oraclePrice: String(100 * DRIFT_PRECISION.PRICE),
        markPrice: String(100.5 * DRIFT_PRECISION.PRICE),
        bidPrice: String(100.4 * DRIFT_PRECISION.PRICE),
        askPrice: String(100.6 * DRIFT_PRECISION.PRICE),
        lastFillPrice: String(100.5 * DRIFT_PRECISION.PRICE),
        volume24h: String(1000000 * DRIFT_PRECISION.QUOTE),
        openInterest: String(50000 * DRIFT_PRECISION.BASE),
        openInterestLong: String(30000 * DRIFT_PRECISION.BASE),
        openInterestShort: String(20000 * DRIFT_PRECISION.BASE),
        fundingRate: String(0.0001 * DRIFT_PRECISION.FUNDING_RATE),
        fundingRate24h: String(0.0024 * DRIFT_PRECISION.FUNDING_RATE),
        nextFundingRate: String(0.00015 * DRIFT_PRECISION.FUNDING_RATE),
        nextFundingTs: Math.floor(Date.now() / 1000) + 3600,
        ts: Math.floor(Date.now() / 1000),
      };

      const normalized = normalizer.normalizeTicker(stats);

      expect(normalized.symbol).toBe('SOL/USD:USD');
      expect(normalized.last).toBeCloseTo(100.5, 1);
      expect(normalized.bid).toBeCloseTo(100.4, 1);
      expect(normalized.ask).toBeCloseTo(100.6, 1);
      expect(normalized.quoteVolume).toBe(1000000);
      expect(normalized.info?.oraclePrice).toBeCloseTo(100, 1);
      expect(normalized.info?.openInterest).toBe(50000);
      expect(normalized.info?.openInterestLong).toBe(30000);
      expect(normalized.info?.openInterestShort).toBe(20000);
    });
  });

  describe('normalizeBalance', () => {
    test('should normalize deposit balance', () => {
      const spotPosition: DriftSpotPosition = {
        marketIndex: 0,
        scaledBalance: '1000', // 1000 USDC
        balanceType: 'deposit',
        openOrders: 0,
        cumulativeDeposits: '5000',
      };

      const balance = normalizer.normalizeBalance(spotPosition, 1, 'USDC');

      expect(balance.currency).toBe('USDC');
      expect(balance.total).toBe(1000);
      expect(balance.free).toBe(1000);
      expect(balance.used).toBe(0);
      expect(balance.usdValue).toBe(1000);
      expect(balance.info?.balanceType).toBe('deposit');
    });

    test('should normalize borrow balance', () => {
      const spotPosition: DriftSpotPosition = {
        marketIndex: 1,
        scaledBalance: '500',
        balanceType: 'borrow',
        openOrders: 0,
        cumulativeDeposits: '0',
      };

      const balance = normalizer.normalizeBalance(spotPosition, 100, 'SOL');

      expect(balance.currency).toBe('SOL');
      expect(balance.total).toBe(-500); // Negative for borrows
      expect(balance.free).toBe(0);
      expect(balance.used).toBe(500);
      expect(balance.usdValue).toBe(-50000);
      expect(balance.info?.balanceType).toBe('borrow');
    });
  });

  describe('normalizeCandle', () => {
    test('should normalize candle to OHLCV', () => {
      const candle: DriftCandle = {
        start: 1700000000,
        end: 1700003600,
        resolution: 3600,
        open: String(100 * DRIFT_PRECISION.PRICE),
        high: String(105 * DRIFT_PRECISION.PRICE),
        low: String(98 * DRIFT_PRECISION.PRICE),
        close: String(103 * DRIFT_PRECISION.PRICE),
        volume: String(500000 * DRIFT_PRECISION.QUOTE),
        trades: 150,
      };

      const ohlcv = normalizer.normalizeCandle(candle);

      expect(ohlcv).toHaveLength(6);
      expect(ohlcv[0]).toBe(1700000000000); // timestamp in ms
      expect(ohlcv[1]).toBe(100); // open
      expect(ohlcv[2]).toBe(105); // high
      expect(ohlcv[3]).toBe(98); // low
      expect(ohlcv[4]).toBe(103); // close
      expect(ohlcv[5]).toBe(500000); // volume
    });
  });
});
