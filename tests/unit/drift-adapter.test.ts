/**
 * Drift Protocol Adapter Tests
 *
 * These are unit tests for the DriftAdapter class, normalizer, and utilities.
 * Tests that require network calls are in integration tests.
 */

import { describe, test, expect } from '@jest/globals';
import { DriftAdapter } from '../../src/adapters/drift/DriftAdapter.js';
import { DriftNormalizer } from '../../src/adapters/drift/DriftNormalizer.js';
import {
  unifiedToDrift,
  driftToUnified,
  getMarketIndex,
  getSymbolFromIndex,
  getBaseToken,
  DRIFT_PERP_MARKETS,
  DRIFT_PRECISION,
  DRIFT_MARKET_INDEX_MAP,
} from '../../src/adapters/drift/constants.js';
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
import type { DriftConfig } from '../../src/adapters/drift/DriftAdapter.js';

describe('DriftAdapter', () => {
  describe('constructor', () => {
    test('should create adapter with default config', () => {
      const adapter = new DriftAdapter();
      expect(adapter).toBeInstanceOf(DriftAdapter);
      expect(adapter.id).toBe('drift');
      expect(adapter.name).toBe('Drift Protocol');
    });

    test('should create adapter with wallet address', () => {
      const adapter = new DriftAdapter({
        walletAddress: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
      });
      expect(adapter).toBeInstanceOf(DriftAdapter);
      expect(adapter.id).toBe('drift');
    });

    test('should accept testnet configuration', () => {
      const adapter = new DriftAdapter({
        testnet: true,
      });
      expect(adapter).toBeInstanceOf(DriftAdapter);
    });

    test('should accept custom timeout', () => {
      const adapter = new DriftAdapter({
        timeout: 60000,
      });
      expect(adapter).toBeInstanceOf(DriftAdapter);
    });
  });

  describe('capabilities', () => {
    let adapter: DriftAdapter;

    beforeAll(() => {
      adapter = new DriftAdapter();
    });

    test('should support market data features', () => {
      expect(adapter.has.fetchMarkets).toBe(true);
      expect(adapter.has.fetchTicker).toBe(true);
      expect(adapter.has.fetchOrderBook).toBe(true);
      expect(adapter.has.fetchTrades).toBe(true);
    });

    test('should support funding rate features', () => {
      expect(adapter.has.fetchFundingRate).toBe(true);
      expect(adapter.has.fetchFundingRateHistory).toBe(true);
    });

    test('should support account features', () => {
      expect(adapter.has.fetchPositions).toBe(true);
      expect(adapter.has.fetchBalance).toBe(true);
      expect(adapter.has.fetchOpenOrders).toBe(true);
    });

    test('should not support OHLCV (requires historical data API)', () => {
      expect(adapter.has.fetchOHLCV).toBe(false);
    });

    test('should support trading via Drift SDK', () => {
      expect(adapter.has.createOrder).toBe(true);
      expect(adapter.has.cancelOrder).toBe(true);
      expect(adapter.has.cancelAllOrders).toBe(true);
      expect(adapter.has.createBatchOrders).toBe(false); // Batch orders not supported
    });

    test('should not support websocket (not implemented)', () => {
      expect(adapter.has.watchOrderBook).toBe(false);
      expect(adapter.has.watchTrades).toBe(false);
      expect(adapter.has.watchTicker).toBe(false);
      expect(adapter.has.watchPositions).toBe(false);
    });

    test('should not support leverage/margin settings (cross-margin only)', () => {
      expect(adapter.has.setLeverage).toBe(false);
      expect(adapter.has.setMarginMode).toBe(false);
    });
  });

  describe('initialization', () => {
    test('should not be ready before initialization', () => {
      const adapter = new DriftAdapter();
      expect(adapter.isReady).toBe(false);
    });

    test('should require initialization before API calls', async () => {
      const adapter = new DriftAdapter();
      await expect(adapter.fetchTicker('SOL/USD:USD')).rejects.toThrow(/not initialized/);
    });

    test('should require initialization before fetchOrderBook', async () => {
      const adapter = new DriftAdapter();
      await expect(adapter.fetchOrderBook('SOL/USD:USD')).rejects.toThrow(/not initialized/);
    });

    test('should require initialization before fetchTrades', async () => {
      const adapter = new DriftAdapter();
      await expect(adapter.fetchTrades('SOL/USD:USD')).rejects.toThrow(/not initialized/);
    });

    test('should require initialization before fetchFundingRate', async () => {
      const adapter = new DriftAdapter();
      await expect(adapter.fetchFundingRate('SOL/USD:USD')).rejects.toThrow(/not initialized/);
    });
  });

  describe('trading restrictions', () => {
    let adapter: DriftAdapter;

    beforeAll(() => {
      adapter = new DriftAdapter({
        walletAddress: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
      });
    });

    test('should reject createOrder (trading not supported)', async () => {
      await expect(
        adapter.createOrder({
          symbol: 'SOL/USD:USD',
          side: 'buy',
          type: 'limit',
          amount: 1,
          price: 100,
        })
      ).rejects.toThrow();
    });

    test('should reject cancelOrder (trading not supported)', async () => {
      await expect(adapter.cancelOrder('order123', 'SOL/USD:USD')).rejects.toThrow();
    });
  });

  describe('market validation', () => {
    test('fetchMarkets requires initialization', async () => {
      const adapter = new DriftAdapter();
      await expect(adapter.fetchMarkets()).rejects.toThrow(/not initialized/);
    });

    // Note: Full market validation tests are in integration tests
    // since fetchMarkets requires initialization (API call)
  });

  describe('configuration', () => {
    test('should handle different environment configs', () => {
      const mainnetAdapter = new DriftAdapter({ testnet: false });
      const testnetAdapter = new DriftAdapter({ testnet: true });

      expect(mainnetAdapter.id).toBe('drift');
      expect(testnetAdapter.id).toBe('drift');
    });

    test('should accept subaccount configuration', () => {
      const adapter = new DriftAdapter({
        walletAddress: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
        subAccountId: 1,
      });

      expect(adapter).toBeInstanceOf(DriftAdapter);
    });

    test('should accept custom RPC endpoint', () => {
      const adapter = new DriftAdapter({
        walletAddress: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
        rpcEndpoint: 'https://my-custom-rpc.example.com',
      });

      expect(adapter).toBeInstanceOf(DriftAdapter);
    });
  });
});

describe('Drift Constants', () => {
  describe('symbol conversion', () => {
    test('unifiedToDrift converts correctly', () => {
      expect(unifiedToDrift('SOL/USD:USD')).toBe('SOL-PERP');
      expect(unifiedToDrift('BTC/USD:USD')).toBe('BTC-PERP');
      expect(unifiedToDrift('ETH/USD:USD')).toBe('ETH-PERP');
    });

    test('unifiedToDrift throws on invalid format', () => {
      expect(() => unifiedToDrift('')).toThrow();
    });

    test('driftToUnified converts correctly', () => {
      expect(driftToUnified('SOL-PERP')).toBe('SOL/USD:USD');
      expect(driftToUnified('BTC-PERP')).toBe('BTC/USD:USD');
      expect(driftToUnified('ETH-PERP')).toBe('ETH/USD:USD');
    });

    test('getMarketIndex returns correct index', () => {
      expect(getMarketIndex('SOL/USD:USD')).toBe(0);
      expect(getMarketIndex('BTC/USD:USD')).toBe(1);
      expect(getMarketIndex('ETH/USD:USD')).toBe(2);
      expect(getMarketIndex('SOL-PERP')).toBe(0);
    });

    test('getMarketIndex throws on unknown market', () => {
      expect(() => getMarketIndex('UNKNOWN/USD:USD')).toThrow();
    });

    test('getSymbolFromIndex returns correct symbol', () => {
      expect(getSymbolFromIndex(0)).toBe('SOL-PERP');
      expect(getSymbolFromIndex(1)).toBe('BTC-PERP');
      expect(getSymbolFromIndex(2)).toBe('ETH-PERP');
    });

    test('getSymbolFromIndex returns undefined for invalid index', () => {
      expect(getSymbolFromIndex(999)).toBeUndefined();
    });

    test('getBaseToken extracts base token', () => {
      expect(getBaseToken('SOL/USD:USD')).toBe('SOL');
      expect(getBaseToken('BTC/USD:USD')).toBe('BTC');
      expect(getBaseToken('ETH/USD:USD')).toBe('ETH');
    });
  });

  describe('market definitions', () => {
    test('DRIFT_PERP_MARKETS has correct structure', () => {
      expect(DRIFT_PERP_MARKETS['SOL-PERP']).toBeDefined();
      expect(DRIFT_PERP_MARKETS['SOL-PERP'].marketIndex).toBe(0);
      expect(DRIFT_PERP_MARKETS['SOL-PERP'].symbol).toBe('SOL/USD:USD');
      expect(DRIFT_PERP_MARKETS['SOL-PERP'].maxLeverage).toBe(20);
    });

    test('DRIFT_MARKET_INDEX_MAP is correct', () => {
      expect(DRIFT_MARKET_INDEX_MAP[0]).toBe('SOL-PERP');
      expect(DRIFT_MARKET_INDEX_MAP[1]).toBe('BTC-PERP');
      expect(DRIFT_MARKET_INDEX_MAP[2]).toBe('ETH-PERP');
    });
  });

  describe('precision constants', () => {
    test('DRIFT_PRECISION has correct values', () => {
      expect(DRIFT_PRECISION.BASE).toBe(1e9);
      expect(DRIFT_PRECISION.QUOTE).toBe(1e6);
      expect(DRIFT_PRECISION.PRICE).toBe(1e6);
      expect(DRIFT_PRECISION.FUNDING_RATE).toBe(1e9);
      expect(DRIFT_PRECISION.MARGIN).toBe(1e4);
    });
  });
});

describe('Drift Utils', () => {
  describe('market utilities', () => {
    test('getMarketConfig returns config for valid symbol', () => {
      const config = getMarketConfig('SOL/USD:USD');
      expect(config).toBeDefined();
      expect(config?.marketIndex).toBe(0);
      expect(config?.baseAsset).toBe('SOL');
    });

    test('getMarketConfig returns config for Drift symbol', () => {
      const config = getMarketConfig('SOL-PERP');
      expect(config).toBeDefined();
      expect(config?.marketIndex).toBe(0);
    });

    test('getMarketConfig returns undefined for invalid symbol', () => {
      const config = getMarketConfig('INVALID/USD:USD');
      expect(config).toBeUndefined();
    });

    test('getMarketConfigByIndex returns config for valid index', () => {
      const config = getMarketConfigByIndex(0);
      expect(config).toBeDefined();
      expect(config?.symbol).toBe('SOL/USD:USD');
    });

    test('getMarketConfigByIndex returns undefined for invalid index', () => {
      const config = getMarketConfigByIndex(999);
      expect(config).toBeUndefined();
    });

    test('isValidMarket returns true for valid markets', () => {
      expect(isValidMarket('SOL/USD:USD')).toBe(true);
      expect(isValidMarket('BTC/USD:USD')).toBe(true);
      expect(isValidMarket('SOL-PERP')).toBe(true);
    });

    test('isValidMarket returns false for invalid markets', () => {
      expect(isValidMarket('INVALID/USD:USD')).toBe(false);
      expect(isValidMarket('UNKNOWN-PERP')).toBe(false);
    });

    test('getAllMarketIndices returns all indices', () => {
      const indices = getAllMarketIndices();
      expect(indices).toContain(0); // SOL
      expect(indices).toContain(1); // BTC
      expect(indices).toContain(2); // ETH
      expect(indices.length).toBe(Object.keys(DRIFT_PERP_MARKETS).length);
    });
  });

  describe('price utilities', () => {
    test('priceToOnChain converts correctly', () => {
      expect(priceToOnChain(100)).toBe('100000000');
      expect(priceToOnChain(50000.5)).toBe('50000500000');
    });

    test('priceFromOnChain converts correctly', () => {
      expect(priceFromOnChain('100000000')).toBe(100);
      expect(priceFromOnChain(50000500000)).toBe(50000.5);
    });

    test('baseToOnChain converts correctly', () => {
      expect(baseToOnChain(1)).toBe('1000000000');
      expect(baseToOnChain(0.5)).toBe('500000000');
    });

    test('baseFromOnChain converts correctly', () => {
      expect(baseFromOnChain('1000000000')).toBe(1);
      expect(baseFromOnChain(500000000)).toBe(0.5);
    });

    test('quoteToOnChain converts correctly', () => {
      expect(quoteToOnChain(100)).toBe('100000000');
      expect(quoteToOnChain(50.5)).toBe('50500000');
    });

    test('quoteFromOnChain converts correctly', () => {
      expect(quoteFromOnChain('100000000')).toBe(100);
      expect(quoteFromOnChain(50500000)).toBe(50.5);
    });

    test('formatPrice formats with correct precision', () => {
      expect(formatPrice(100.12345, 'SOL/USD:USD')).toBe('100.123');
      expect(formatPrice(50000.123, 'BTC/USD:USD')).toBe('50000.1');
    });

    test('formatSize formats with correct precision', () => {
      expect(formatSize(1.12345, 'SOL/USD:USD')).toBe('1.1');
      expect(formatSize(0.12345, 'BTC/USD:USD')).toBe('0.123');
    });

    test('roundToTickSize rounds correctly', () => {
      expect(roundToTickSize(100.1234, 'SOL/USD:USD')).toBeCloseTo(100.123, 3);
      expect(roundToTickSize(50000.15, 'BTC/USD:USD')).toBeCloseTo(50000.2, 1);
    });

    test('roundToStepSize rounds correctly', () => {
      // SOL step size is 0.1, so 1.15 rounds to 1.1 or 1.2 depending on implementation
      const solRounded = roundToStepSize(1.15, 'SOL/USD:USD');
      expect([1.1, 1.2]).toContain(Math.round(solRounded * 10) / 10);
      expect(roundToStepSize(0.1234, 'BTC/USD:USD')).toBeCloseTo(0.123, 3);
    });
  });

  describe('leverage utilities', () => {
    test('validateLeverage validates correctly', () => {
      expect(validateLeverage(10, 'SOL/USD:USD').valid).toBe(true);
      expect(validateLeverage(20, 'SOL/USD:USD').valid).toBe(true);
      expect(validateLeverage(25, 'SOL/USD:USD').valid).toBe(false);
      expect(validateLeverage(0.5, 'SOL/USD:USD').valid).toBe(false);
    });

    test('validateLeverage returns reason on failure', () => {
      const result = validateLeverage(25, 'SOL/USD:USD');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Maximum leverage');
    });

    test('calculatePositionSize calculates correctly', () => {
      expect(calculatePositionSize(1000, 10, 100)).toBe(100);
      expect(calculatePositionSize(500, 5, 50)).toBe(50);
    });

    test('calculateRequiredCollateral calculates correctly', () => {
      expect(calculateRequiredCollateral(10, 100, 10)).toBe(100);
      expect(calculateRequiredCollateral(5, 50, 5)).toBe(50);
    });
  });

  describe('order utilities', () => {
    test('toDriftOrderType converts correctly', () => {
      expect(toDriftOrderType('market')).toBe('market');
      expect(toDriftOrderType('limit')).toBe('limit');
      expect(toDriftOrderType('stopMarket')).toBe('triggerMarket');
      expect(toDriftOrderType('stopLimit')).toBe('triggerLimit');
    });

    test('toDriftDirection converts correctly', () => {
      expect(toDriftDirection('buy')).toBe('long');
      expect(toDriftDirection('sell')).toBe('short');
    });

    test('fromDriftDirection converts correctly', () => {
      expect(fromDriftDirection('long')).toBe('buy');
      expect(fromDriftDirection('short')).toBe('sell');
    });

    test('getPostOnlyParams returns correct params', () => {
      expect(getPostOnlyParams(false)).toBe('none');
      expect(getPostOnlyParams(true)).toBe('mustPostOnly');
      expect(getPostOnlyParams(true, true)).toBe('slide');
    });

    test('validateOrderParams validates valid order', () => {
      const result = validateOrderParams({
        symbol: 'SOL/USD:USD',
        side: 'buy',
        amount: 1,
        type: 'market',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('validateOrderParams rejects invalid market', () => {
      const result = validateOrderParams({
        symbol: 'INVALID/USD:USD',
        side: 'buy',
        amount: 1,
        type: 'market',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid market: INVALID/USD:USD');
    });

    test('validateOrderParams rejects too small order', () => {
      const result = validateOrderParams({
        symbol: 'SOL/USD:USD',
        side: 'buy',
        amount: 0.01, // Min is 0.1
        type: 'market',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Minimum'))).toBe(true);
    });

    test('validateOrderParams requires price for limit orders', () => {
      const result = validateOrderParams({
        symbol: 'SOL/USD:USD',
        side: 'buy',
        amount: 1,
        type: 'limit',
        // price is missing
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Price is required'))).toBe(true);
    });

    test('validateOrderParams validates leverage', () => {
      const result = validateOrderParams({
        symbol: 'SOL/USD:USD',
        side: 'buy',
        amount: 1,
        type: 'market',
        leverage: 25, // Max is 20
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('leverage'))).toBe(true);
    });
  });

  describe('funding rate utilities', () => {
    test('fundingRateFromOnChain converts correctly', () => {
      expect(fundingRateFromOnChain('1000000')).toBeCloseTo(0.001, 6);
      expect(fundingRateFromOnChain(1000000000)).toBeCloseTo(1, 6);
    });

    test('annualizeFundingRate calculates correctly', () => {
      const hourlyRate = 0.0001; // 0.01%
      const annualized = annualizeFundingRate(hourlyRate);
      expect(annualized).toBeCloseTo(0.876, 3); // 0.01% * 24 * 365
    });

    test('calculateFundingPayment calculates correctly', () => {
      const payment = calculateFundingPayment(10, 0.0001, 100);
      expect(payment).toBe(0.1); // 10 * 100 * 0.0001
    });
  });

  describe('liquidation utilities', () => {
    test('calculateLiquidationPrice for long position', () => {
      const liqPrice = calculateLiquidationPrice('long', 100, 10, 0.05);
      expect(liqPrice).toBeCloseTo(90.5, 1); // Entry * (1 - 0.95/leverage)
    });

    test('calculateLiquidationPrice for short position', () => {
      const liqPrice = calculateLiquidationPrice('short', 100, 10, 0.05);
      expect(liqPrice).toBeCloseTo(109.5, 1); // Entry * (1 + 0.95/leverage)
    });

    test('calculateLiquidationPrice returns 0 for zero leverage', () => {
      expect(calculateLiquidationPrice('long', 100, 0, 0.05)).toBe(0);
    });

    test('isLiquidatable returns true when below liquidation price (long)', () => {
      expect(isLiquidatable('long', 100, 85, 10, 0.05)).toBe(true);
      expect(isLiquidatable('long', 100, 95, 10, 0.05)).toBe(false);
    });

    test('isLiquidatable returns true when above liquidation price (short)', () => {
      expect(isLiquidatable('short', 100, 115, 10, 0.05)).toBe(true);
      expect(isLiquidatable('short', 100, 105, 10, 0.05)).toBe(false);
    });
  });

  describe('URL builders', () => {
    test('buildOrderbookUrl builds correct URL', () => {
      const url = buildOrderbookUrl('https://dlob.drift.trade', 0);
      expect(url).toBe('https://dlob.drift.trade/l2?marketIndex=0&marketType=perp');
    });

    test('buildOrderbookUrl with depth', () => {
      const url = buildOrderbookUrl('https://dlob.drift.trade', 0, 'perp', 10);
      expect(url).toContain('depth=10');
    });

    test('buildTradesUrl builds correct URL', () => {
      const url = buildTradesUrl('https://dlob.drift.trade', 0);
      expect(url).toBe('https://dlob.drift.trade/trades?marketIndex=0&marketType=perp');
    });

    test('buildTradesUrl with limit', () => {
      const url = buildTradesUrl('https://dlob.drift.trade', 0, 'perp', 50);
      expect(url).toContain('limit=50');
    });

    test('buildHistoricalUrl builds correct URL', () => {
      const url = buildHistoricalUrl('SOL-PERP', 'trades', new Date('2024-01-15'));
      expect(url).toContain('SOL-PERP');
      expect(url).toContain('trades');
      expect(url).toContain('2024');
      expect(url).toContain('20240115');
    });
  });

  describe('time utilities', () => {
    test('getNextFundingTimestamp returns future timestamp', () => {
      const next = getNextFundingTimestamp();
      expect(next).toBeGreaterThan(Date.now());
    });

    test('getTimeUntilFunding returns positive value', () => {
      const time = getTimeUntilFunding();
      expect(time).toBeGreaterThan(0);
      expect(time).toBeLessThanOrEqual(3600000); // Max 1 hour
    });

    test('slotToTimestamp converts slot to timestamp', () => {
      const ts = slotToTimestamp(1000000);
      expect(ts).toBeGreaterThan(0);
    });

    test('slotToTimestamp with reference values', () => {
      const referenceSlot = 1000;
      const referenceTime = Date.now();
      const targetSlot = 1100;
      const ts = slotToTimestamp(targetSlot, referenceSlot, referenceTime);
      // 100 slots * 400ms = 40000ms
      expect(ts).toBe(referenceTime + 40000);
    });
  });
});

describe('DriftNormalizer', () => {
  let normalizer: DriftNormalizer;

  beforeEach(() => {
    normalizer = new DriftNormalizer();
  });

  describe('normalizeMarket', () => {
    test('normalizes market account correctly', () => {
      const mockMarketAccount = {
        marketIndex: 0,
        name: 'SOL-PERP',
        status: 'active',
        marginRatioInitial: 1000, // 10%
        marginRatioMaintenance: 500, // 5%
        imfFactor: 0,
        numberOfUsers: 1000,
        contractTier: 'B',
        amm: {
          orderTickSize: '1000', // 0.001 in PRICE_PRECISION
          orderStepSize: '100000000', // 0.1 in BASE_PRECISION
          minOrderSize: '100000000', // 0.1 in BASE_PRECISION
          maxPositionSize: '1000000000000', // 1000 in BASE_PRECISION
        },
      };

      const market = normalizer.normalizeMarket(mockMarketAccount as any);

      expect(market.id).toBe('SOL-PERP');
      expect(market.symbol).toBe('SOL/USD:USD');
      expect(market.base).toBe('SOL');
      expect(market.quote).toBe('USD');
      expect(market.settle).toBe('USD');
      expect(market.active).toBe(true);
      expect(market.maxLeverage).toBe(20);
      expect(market.fundingIntervalHours).toBe(1);
    });

    test('normalizes unknown market index', () => {
      const mockMarketAccount = {
        marketIndex: 999,
        name: 'UNKNOWN-PERP',
        status: 'active',
        marginRatioInitial: 1000,
        marginRatioMaintenance: 500,
        imfFactor: 0,
        numberOfUsers: 0,
        contractTier: 'C',
        amm: {
          orderTickSize: '1000',
          orderStepSize: '100000000',
          minOrderSize: '100000000',
          maxPositionSize: '1000000000000',
        },
      };

      const market = normalizer.normalizeMarket(mockMarketAccount as any);

      expect(market.id).toBe('PERP-999');
      expect(market.symbol).toBe('MARKET-999/USD:USD');
    });
  });

  describe('normalizePosition', () => {
    test('normalizes long position correctly', () => {
      const mockPosition = {
        marketIndex: 0,
        baseAssetAmount: '1000000000', // 1 SOL
        quoteAssetAmount: '100000000', // 100 USDC margin
        quoteEntryAmount: '95000000', // 95 USDC entry
        settledPnl: '5000000', // 5 USDC realized PnL
        lpShares: '0',
        openOrders: 0,
      };

      const position = normalizer.normalizePosition(
        mockPosition as any,
        100, // mark price
        100 // oracle price
      );

      expect(position.symbol).toBe('SOL/USD:USD');
      expect(position.side).toBe('long');
      expect(position.size).toBe(1);
      expect(position.markPrice).toBe(100);
      expect(position.marginMode).toBe('cross');
      expect(position.realizedPnl).toBe(5);
    });

    test('normalizes short position correctly', () => {
      const mockPosition = {
        marketIndex: 0,
        baseAssetAmount: '-1000000000', // -1 SOL (short)
        quoteAssetAmount: '-100000000', // 100 USDC margin
        quoteEntryAmount: '-105000000', // 105 USDC entry
        settledPnl: '0',
        lpShares: '0',
        openOrders: 0,
      };

      const position = normalizer.normalizePosition(
        mockPosition as any,
        100, // mark price
        100 // oracle price
      );

      expect(position.side).toBe('short');
      expect(position.size).toBe(1);
    });
  });

  describe('normalizeOrder', () => {
    test('normalizes limit order correctly', () => {
      const mockOrder = {
        orderId: 12345,
        userOrderId: 1,
        marketIndex: 0,
        orderType: 'limit',
        direction: 'long',
        baseAssetAmount: '1000000000', // 1 SOL
        baseAssetAmountFilled: '0',
        quoteAssetAmountFilled: '0',
        price: '100000000', // 100
        triggerPrice: '0',
        status: 'open',
        reduceOnly: false,
        postOnly: 'mustPostOnly',
        slot: 123456,
      };

      const order = normalizer.normalizeOrder(mockOrder as any);

      expect(order.id).toBe('12345');
      expect(order.symbol).toBe('SOL/USD:USD');
      expect(order.type).toBe('limit');
      expect(order.side).toBe('buy');
      expect(order.amount).toBe(1);
      expect(order.price).toBe(100);
      expect(order.status).toBe('open');
      expect(order.filled).toBe(0);
      expect(order.postOnly).toBe(true);
    });

    test('normalizes market order correctly', () => {
      const mockOrder = {
        orderId: 12346,
        userOrderId: 0,
        marketIndex: 1,
        orderType: 'market',
        direction: 'short',
        baseAssetAmount: '100000000', // 0.1 BTC
        baseAssetAmountFilled: '100000000',
        quoteAssetAmountFilled: '5000000000', // 5000 USDC
        price: '0',
        triggerPrice: '0',
        status: 'filled',
        reduceOnly: true,
        postOnly: 'none',
        slot: 123457,
      };

      const order = normalizer.normalizeOrder(mockOrder as any, 50000);

      expect(order.id).toBe('12346');
      expect(order.symbol).toBe('BTC/USD:USD');
      expect(order.type).toBe('market');
      expect(order.side).toBe('sell');
      expect(order.status).toBe('filled');
      expect(order.reduceOnly).toBe(true);
      expect(order.averagePrice).toBe(50000);
    });

    test('normalizes trigger order correctly', () => {
      const mockOrder = {
        orderId: 12347,
        userOrderId: 0,
        marketIndex: 0,
        orderType: 'triggerMarket',
        direction: 'long',
        baseAssetAmount: '1000000000',
        baseAssetAmountFilled: '0',
        quoteAssetAmountFilled: '0',
        price: '0',
        triggerPrice: '90000000', // 90
        status: 'open',
        reduceOnly: false,
        postOnly: 'none',
        slot: 123458,
      };

      const order = normalizer.normalizeOrder(mockOrder as any);

      expect(order.type).toBe('stopMarket');
      expect(order.stopPrice).toBe(90);
    });
  });

  describe('normalizeOrderBook', () => {
    test('normalizes order book correctly', () => {
      const mockOrderbook = {
        marketIndex: 0,
        slot: 123456,
        bids: [
          { price: '99500000', size: '1000000000' }, // 99.5, 1
          { price: '99000000', size: '2000000000' }, // 99, 2
        ],
        asks: [
          { price: '100500000', size: '1500000000' }, // 100.5, 1.5
          { price: '101000000', size: '3000000000' }, // 101, 3
        ],
      };

      const orderbook = normalizer.normalizeOrderBook(mockOrderbook as any);

      expect(orderbook.symbol).toBe('SOL/USD:USD');
      expect(orderbook.exchange).toBe('drift');
      expect(orderbook.bids).toHaveLength(2);
      expect(orderbook.asks).toHaveLength(2);
      expect(orderbook.bids[0][0]).toBe(99.5);
      expect(orderbook.bids[0][1]).toBe(1);
      expect(orderbook.asks[0][0]).toBe(100.5);
      expect(orderbook.asks[0][1]).toBe(1.5);
      expect(orderbook.sequenceId).toBe(123456);
    });
  });

  describe('normalizeTrade', () => {
    test('normalizes trade correctly', () => {
      const mockTrade = {
        fillRecordId: 'fill-123',
        recordId: 456,
        marketIndex: 0,
        baseAssetAmount: '500000000', // 0.5 SOL
        fillPrice: '100000000', // 100
        takerOrderDirection: 'long',
        taker: 'taker-pubkey',
        maker: 'maker-pubkey',
        txSig: 'tx-signature',
        slot: 123456,
        ts: 1704067200, // Unix timestamp
      };

      const trade = normalizer.normalizeTrade(mockTrade as any);

      expect(trade.id).toBe('fill-123');
      expect(trade.symbol).toBe('SOL/USD:USD');
      expect(trade.side).toBe('buy');
      expect(trade.price).toBe(100);
      expect(trade.amount).toBe(0.5);
      expect(trade.cost).toBe(50);
      expect(trade.timestamp).toBe(1704067200000);
    });
  });

  describe('normalizeFundingRate', () => {
    test('normalizes funding rate correctly', () => {
      const mockFundingRate = {
        marketIndex: 0,
        fundingRate: '100000', // 0.0001 in FUNDING_RATE_PRECISION
        fundingRateLong: '100000',
        fundingRateShort: '-100000',
        cumulativeFundingRateLong: '1000000',
        cumulativeFundingRateShort: '-1000000',
        markPriceTwap: '100000000', // 100
        oraclePrice: '99500000', // 99.5
        ts: 1704067200,
      };

      const fundingRate = normalizer.normalizeFundingRate(mockFundingRate as any);

      expect(fundingRate.symbol).toBe('SOL/USD:USD');
      expect(fundingRate.fundingRate).toBeCloseTo(0.0001, 6);
      expect(fundingRate.markPrice).toBe(100);
      expect(fundingRate.indexPrice).toBe(99.5);
      expect(fundingRate.fundingIntervalHours).toBe(1);
    });

    test('normalizes funding rate record (historical) correctly', () => {
      const mockFundingRateRecord = {
        marketIndex: 0,
        fundingRate: '100000',
        fundingRateLong: '100000',
        fundingRateShort: '-100000',
        cumulativeFundingRateLong: '1000000',
        cumulativeFundingRateShort: '-1000000',
        markPriceTwap: '100000000',
        oraclePriceTwap: '99500000', // Historical uses oraclePriceTwap
        ts: 1704067200,
      };

      const fundingRate = normalizer.normalizeFundingRate(mockFundingRateRecord as any);

      expect(fundingRate.indexPrice).toBe(99.5);
    });
  });

  describe('normalizeTicker', () => {
    test('normalizes ticker correctly', () => {
      const mockStats = {
        marketIndex: 0,
        markPrice: '100500000', // 100.5
        oraclePrice: '100000000', // 100
        bidPrice: '100400000', // 100.4
        askPrice: '100600000', // 100.6
        volume24h: '1000000000', // 1000 USDC
        openInterest: '5000000000', // 5 SOL
        openInterestLong: '3000000000', // 3 SOL
        openInterestShort: '2000000000', // 2 SOL
        fundingRate: '100000',
        nextFundingTs: 1704070800,
        ts: 1704067200,
      };

      const ticker = normalizer.normalizeTicker(mockStats as any);

      expect(ticker.symbol).toBe('SOL/USD:USD');
      expect(ticker.last).toBe(100.5);
      expect(ticker.bid).toBe(100.4);
      expect(ticker.ask).toBe(100.6);
      expect(ticker.open).toBe(100);
      expect(ticker.close).toBe(100.5);
      expect(ticker.change).toBeCloseTo(0.5, 1);
      expect(ticker.percentage).toBeCloseTo(0.5, 1);
      expect(ticker.quoteVolume).toBe(1000);
      expect(ticker.info.openInterest).toBe(5);
    });
  });

  describe('normalizeBalance', () => {
    test('normalizes deposit balance correctly', () => {
      const mockPosition = {
        marketIndex: 0,
        scaledBalance: '1000',
        balanceType: 'deposit',
        cumulativeDeposits: '1000',
      };

      const balance = normalizer.normalizeBalance(mockPosition as any, 100, 'USDC');

      expect(balance.currency).toBe('USDC');
      expect(balance.total).toBe(1000);
      expect(balance.free).toBe(1000);
      expect(balance.used).toBe(0);
      expect(balance.usdValue).toBe(100000);
    });

    test('normalizes borrow balance correctly', () => {
      const mockPosition = {
        marketIndex: 0,
        scaledBalance: '500',
        balanceType: 'borrow',
        cumulativeDeposits: '0',
      };

      const balance = normalizer.normalizeBalance(mockPosition as any, 1, 'SOL');

      expect(balance.currency).toBe('SOL');
      expect(balance.total).toBe(-500);
      expect(balance.free).toBe(0);
      expect(balance.used).toBe(500);
    });
  });

  describe('normalizeCandle', () => {
    test('normalizes candle correctly', () => {
      const mockCandle = {
        start: 1704067200, // Unix timestamp
        open: '100000000', // 100
        high: '105000000', // 105
        low: '98000000', // 98
        close: '103000000', // 103
        volume: '50000000000', // 50000 USDC
      };

      const ohlcv = normalizer.normalizeCandle(mockCandle as any);

      expect(ohlcv[0]).toBe(1704067200000); // ms timestamp
      expect(ohlcv[1]).toBe(100); // open
      expect(ohlcv[2]).toBe(105); // high
      expect(ohlcv[3]).toBe(98); // low
      expect(ohlcv[4]).toBe(103); // close
      expect(ohlcv[5]).toBe(50000); // volume
    });
  });
});

describe('DriftAuth Validation Functions', () => {
  let isValidSolanaAddress: typeof import('../../src/adapters/drift/DriftAuth.js').isValidSolanaAddress;
  let isValidSolanaPrivateKey: typeof import('../../src/adapters/drift/DriftAuth.js').isValidSolanaPrivateKey;

  beforeAll(async () => {
    const authModule = await import('../../src/adapters/drift/DriftAuth.js');
    isValidSolanaAddress = authModule.isValidSolanaAddress;
    isValidSolanaPrivateKey = authModule.isValidSolanaPrivateKey;
  });

  describe('isValidSolanaAddress', () => {
    test('should accept valid base58 address (32 chars)', () => {
      // 32-char address (minimum valid)
      expect(isValidSolanaAddress('11111111111111111111111111111111')).toBe(true);
    });

    test('should accept valid base58 address (44 chars)', () => {
      // Common Solana pubkey length
      expect(isValidSolanaAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')).toBe(true);
    });

    test('should accept valid base58 address (43 chars)', () => {
      expect(isValidSolanaAddress('So11111111111111111111111111111111111111112')).toBe(true);
    });

    test('should reject address with invalid base58 chars (0)', () => {
      expect(isValidSolanaAddress('01111111111111111111111111111111')).toBe(false);
    });

    test('should reject address with invalid base58 chars (O)', () => {
      expect(isValidSolanaAddress('O1111111111111111111111111111111')).toBe(false);
    });

    test('should reject address with invalid base58 chars (I)', () => {
      expect(isValidSolanaAddress('I1111111111111111111111111111111')).toBe(false);
    });

    test('should reject address with invalid base58 chars (l)', () => {
      expect(isValidSolanaAddress('l1111111111111111111111111111111')).toBe(false);
    });

    test('should reject too short address', () => {
      expect(isValidSolanaAddress('1111111111111111111111111111111')).toBe(false); // 31 chars
    });

    test('should reject too long address', () => {
      expect(isValidSolanaAddress('111111111111111111111111111111111111111111111')).toBe(false); // 45 chars
    });

    test('should reject empty string', () => {
      expect(isValidSolanaAddress('')).toBe(false);
    });
  });

  describe('isValidSolanaPrivateKey', () => {
    test('should accept valid Uint8Array (64 bytes)', () => {
      const key = new Uint8Array(64).fill(1);
      expect(isValidSolanaPrivateKey(key)).toBe(true);
    });

    test('should reject Uint8Array with wrong length', () => {
      const shortKey = new Uint8Array(32).fill(1);
      expect(isValidSolanaPrivateKey(shortKey)).toBe(false);

      const longKey = new Uint8Array(128).fill(1);
      expect(isValidSolanaPrivateKey(longKey)).toBe(false);
    });

    test('should accept valid JSON array format (64 bytes)', () => {
      const jsonKey = JSON.stringify(Array(64).fill(1));
      expect(isValidSolanaPrivateKey(jsonKey)).toBe(true);
    });

    test('should reject JSON array with wrong length', () => {
      const shortJson = JSON.stringify(Array(32).fill(1));
      expect(isValidSolanaPrivateKey(shortJson)).toBe(false);

      const longJson = JSON.stringify(Array(128).fill(1));
      expect(isValidSolanaPrivateKey(longJson)).toBe(false);
    });

    test('should reject invalid JSON', () => {
      expect(isValidSolanaPrivateKey('[invalid json')).toBe(false);
    });

    test('should accept valid base58 format (87-88 chars)', () => {
      // 87 char base58 private key
      const base58Key87 = '1'.repeat(87);
      expect(isValidSolanaPrivateKey(base58Key87)).toBe(true);

      // 88 char base58 private key
      const base58Key88 = '1'.repeat(88);
      expect(isValidSolanaPrivateKey(base58Key88)).toBe(true);
    });

    test('should reject invalid base58 length', () => {
      const shortBase58 = '1'.repeat(86);
      expect(isValidSolanaPrivateKey(shortBase58)).toBe(false);

      const longBase58 = '1'.repeat(89);
      expect(isValidSolanaPrivateKey(longBase58)).toBe(false);
    });

    test('should accept valid hex format (128 hex chars)', () => {
      const hexKey = 'a'.repeat(128);
      expect(isValidSolanaPrivateKey(hexKey)).toBe(true);
    });

    test('should accept hex format with 0x prefix', () => {
      const hexKey = '0x' + 'a'.repeat(128);
      expect(isValidSolanaPrivateKey(hexKey)).toBe(true);
    });

    test('should reject invalid hex length', () => {
      const shortHex = 'a'.repeat(64);
      expect(isValidSolanaPrivateKey(shortHex)).toBe(false);
    });

    test('should reject empty string', () => {
      expect(isValidSolanaPrivateKey('')).toBe(false);
    });

    test('should reject random string', () => {
      expect(isValidSolanaPrivateKey('not a valid key')).toBe(false);
    });
  });
});

// =============================================================================
// DriftOrderBuilder Tests (orderBuilder.ts - previously 0% coverage)
// =============================================================================

describe('DriftOrderBuilder', () => {
  let DriftOrderBuilder: typeof import('../../src/adapters/drift/orderBuilder.js').DriftOrderBuilder;
  let createOrderBuilder: typeof import('../../src/adapters/drift/orderBuilder.js').createOrderBuilder;

  beforeAll(async () => {
    const mod = await import('../../src/adapters/drift/orderBuilder.js');
    DriftOrderBuilder = mod.DriftOrderBuilder;
    createOrderBuilder = mod.createOrderBuilder;
  });

  describe('constructor', () => {
    test('should create with default config', () => {
      const builder = new DriftOrderBuilder();
      expect(builder).toBeInstanceOf(DriftOrderBuilder);
    });

    test('should accept custom config', () => {
      const builder = new DriftOrderBuilder({
        subAccountId: 2,
        slippageTolerance: 0.02,
        auctionDuration: 120,
      });
      expect(builder).toBeInstanceOf(DriftOrderBuilder);
    });

    test('should use defaults for omitted config fields', () => {
      const builder = new DriftOrderBuilder({ subAccountId: 1 });
      expect(builder).toBeInstanceOf(DriftOrderBuilder);
    });
  });

  describe('createOrderBuilder factory', () => {
    test('should create an order builder', () => {
      const builder = createOrderBuilder();
      expect(builder).toBeInstanceOf(DriftOrderBuilder);
    });

    test('should pass config through', () => {
      const builder = createOrderBuilder({ slippageTolerance: 0.05 });
      expect(builder).toBeInstanceOf(DriftOrderBuilder);
    });
  });

  describe('getMarketConfig', () => {
    test('should return config for valid unified symbol', () => {
      const builder = new DriftOrderBuilder();
      const config = builder.getMarketConfig('SOL/USD:USD');
      expect(config).toBeDefined();
      expect(config?.marketIndex).toBe(0);
      expect(config?.baseAsset).toBe('SOL');
    });

    test('should return undefined for unknown symbol', () => {
      const builder = new DriftOrderBuilder();
      const config = builder.getMarketConfig('UNKNOWN/USD:USD');
      expect(config).toBeUndefined();
    });
  });

  describe('getMarketIndex', () => {
    test('should return market index', () => {
      const builder = new DriftOrderBuilder();
      expect(builder.getMarketIndex('SOL/USD:USD')).toBe(0);
      expect(builder.getMarketIndex('BTC/USD:USD')).toBe(1);
      expect(builder.getMarketIndex('ETH/USD:USD')).toBe(2);
    });
  });

  describe('roundToStepSize', () => {
    test('should round down to step size for SOL', () => {
      const builder = new DriftOrderBuilder();
      // SOL stepSize = 0.1
      const rounded = builder.roundToStepSize(1.15, 'SOL/USD:USD');
      expect(rounded).toBeCloseTo(1.1, 1);
    });

    test('should round down to step size for BTC', () => {
      const builder = new DriftOrderBuilder();
      // BTC stepSize = 0.001
      const rounded = builder.roundToStepSize(0.1234, 'BTC/USD:USD');
      expect(rounded).toBeCloseTo(0.123, 3);
    });

    test('should return amount unchanged for unknown symbol', () => {
      const builder = new DriftOrderBuilder();
      expect(builder.roundToStepSize(1.5, 'UNKNOWN/USD:USD')).toBe(1.5);
    });
  });

  describe('roundToTickSize', () => {
    test('should round to tick size for SOL', () => {
      const builder = new DriftOrderBuilder();
      // SOL tickSize = 0.001
      const rounded = builder.roundToTickSize(100.1234, 'SOL/USD:USD');
      expect(rounded).toBeCloseTo(100.123, 3);
    });

    test('should round to tick size for BTC', () => {
      const builder = new DriftOrderBuilder();
      // BTC tickSize = 0.1
      const rounded = builder.roundToTickSize(50000.15, 'BTC/USD:USD');
      expect(rounded).toBeCloseTo(50000.2, 1);
    });

    test('should return price unchanged for unknown symbol', () => {
      const builder = new DriftOrderBuilder();
      expect(builder.roundToTickSize(123.456, 'UNKNOWN/USD:USD')).toBe(123.456);
    });
  });

  describe('calculateRequiredMargin', () => {
    test('should calculate margin with explicit leverage', () => {
      const builder = new DriftOrderBuilder();
      // notional = 10 * 100 = 1000, margin = 1000 / 10 = 100
      const result = builder.calculateRequiredMargin('SOL/USD:USD', 10, 100, 10);
      expect(result.margin).toBe(100);
      expect(result.leverage).toBe(10);
    });

    test('should cap leverage at max for market', () => {
      const builder = new DriftOrderBuilder();
      // SOL maxLeverage = 20, requested 25 → capped at 20
      const result = builder.calculateRequiredMargin('SOL/USD:USD', 10, 100, 25);
      expect(result.leverage).toBe(20);
      expect(result.margin).toBe(50); // 1000 / 20
    });

    test('should calculate default leverage from initialMarginRatio', () => {
      const builder = new DriftOrderBuilder();
      // SOL initialMarginRatio = 0.1, so default leverage = 1/0.1 = 10
      const result = builder.calculateRequiredMargin('SOL/USD:USD', 10, 100);
      expect(result.leverage).toBe(10);
      expect(result.margin).toBe(100); // 1000 / 10
    });

    test('should throw for unknown market', () => {
      const builder = new DriftOrderBuilder();
      expect(() =>
        builder.calculateRequiredMargin('UNKNOWN/USD:USD', 10, 100)
      ).toThrow('Unknown market');
    });
  });

  describe('calculateLiquidationPrice', () => {
    test('should calculate liquidation price for long position', () => {
      const builder = new DriftOrderBuilder();
      // SOL maintenanceMarginRatio = 0.05, threshold = 0.95
      // long: entryPrice * (1 - 0.95/leverage)
      // = 100 * (1 - 0.95/10) = 100 * 0.905 = 90.5
      const liqPrice = builder.calculateLiquidationPrice('SOL/USD:USD', 100, 10, true);
      expect(liqPrice).toBeCloseTo(90.5, 1);
    });

    test('should calculate liquidation price for short position', () => {
      const builder = new DriftOrderBuilder();
      // short: entryPrice * (1 + 0.95/leverage)
      // = 100 * (1 + 0.95/10) = 100 * 1.095 = 109.5
      const liqPrice = builder.calculateLiquidationPrice('SOL/USD:USD', 100, 10, false);
      expect(liqPrice).toBeCloseTo(109.5, 1);
    });

    test('should throw for unknown market', () => {
      const builder = new DriftOrderBuilder();
      expect(() =>
        builder.calculateLiquidationPrice('UNKNOWN/USD:USD', 100, 10, true)
      ).toThrow('Unknown market');
    });
  });

  describe('buildOrderParams', () => {
    test('should build market buy order params', () => {
      const builder = new DriftOrderBuilder();
      // BTC: stepSize=0.001, minOrderSize=0.001
      const params = builder.buildOrderParams({
        symbol: 'BTC/USD:USD',
        side: 'buy',
        type: 'market',
        amount: 0.01,
      });

      expect(params.orderType).toBe('market');
      expect(params.marketIndex).toBe(1);
      expect(params.marketType).toBe('perp');
      expect(params.direction).toBe('long');
      expect(params.baseAssetAmount).toBe(BigInt(Math.floor(0.01 * 1e9)));
      expect(params.reduceOnly).toBe(false);
    });

    test('should build limit sell order params', () => {
      const builder = new DriftOrderBuilder();
      // SOL: stepSize=0.1, tickSize=0.001; use 100.123 which passes tick validation
      const params = builder.buildOrderParams({
        symbol: 'SOL/USD:USD',
        side: 'sell',
        type: 'limit',
        amount: 0.1,
        price: 100.123,
      });

      expect(params.orderType).toBe('limit');
      expect(params.direction).toBe('short');
      expect(params.price).toBe(BigInt(Math.floor(100.123 * 1e6)));
      expect(params.marketIndex).toBe(0);
    });

    test('should build stop market order with trigger price', () => {
      const builder = new DriftOrderBuilder();
      // BTC: stepSize=0.001
      const params = builder.buildOrderParams({
        symbol: 'BTC/USD:USD',
        side: 'sell',
        type: 'stopMarket',
        amount: 0.01,
        stopPrice: 45000,
      });

      expect(params.orderType).toBe('triggerMarket');
      expect(params.triggerPrice).toBe(BigInt(Math.floor(45000 * 1e6)));
      expect(params.triggerCondition).toBe('above'); // sell direction = short, trigger above
    });

    test('should build stop limit order', () => {
      const builder = new DriftOrderBuilder();
      // SOL: stepSize=0.1, tickSize=0.001; 110.123 passes tick validation
      const params = builder.buildOrderParams({
        symbol: 'SOL/USD:USD',
        side: 'buy',
        type: 'stopLimit',
        amount: 0.1,
        price: 110.123,
        stopPrice: 105.456,
      });

      expect(params.orderType).toBe('triggerLimit');
      expect(params.triggerPrice).toBe(BigInt(Math.floor(105.456 * 1e6)));
      expect(params.triggerCondition).toBe('below'); // buy direction = long, trigger below
    });

    test('should apply slippage to market order price when oraclePrice given', () => {
      const builder = new DriftOrderBuilder({ slippageTolerance: 0.01 });
      // BTC: stepSize=0.001
      const params = builder.buildOrderParams(
        { symbol: 'BTC/USD:USD', side: 'buy', type: 'market', amount: 0.01 },
        50000 // oraclePrice
      );

      // For long: price = 50000 * 1.01 * 1e6
      expect(params.price).toBe(BigInt(Math.floor(50000 * 1.01 * 1e6)));
    });

    test('should apply negative slippage for sell market order', () => {
      const builder = new DriftOrderBuilder({ slippageTolerance: 0.01 });
      // BTC: stepSize=0.001
      const params = builder.buildOrderParams(
        { symbol: 'BTC/USD:USD', side: 'sell', type: 'market', amount: 0.01 },
        50000
      );

      // For short: price = 50000 * 0.99 * 1e6
      expect(params.price).toBe(BigInt(Math.floor(50000 * 0.99 * 1e6)));
    });

    test('should set reduce only and post only flags', () => {
      const builder = new DriftOrderBuilder();
      // BTC: stepSize=0.001
      const params = builder.buildOrderParams({
        symbol: 'BTC/USD:USD',
        side: 'sell',
        type: 'market',
        amount: 0.01,
        reduceOnly: true,
        postOnly: true,
      });

      expect(params.reduceOnly).toBe(true);
      expect(params.postOnly).toBe(true);
    });

    test('should set IOC flag from timeInForce', () => {
      const builder = new DriftOrderBuilder();
      // SOL: stepSize=0.1, tickSize=0.001; 100.123 passes tick validation
      const params = builder.buildOrderParams({
        symbol: 'SOL/USD:USD',
        side: 'buy',
        type: 'limit',
        amount: 0.1,
        price: 100.123,
        timeInForce: 'IOC',
      });

      expect(params.immediateOrCancel).toBe(true);
    });

    test('should set clientOrderId as userOrderId', () => {
      const builder = new DriftOrderBuilder();
      // BTC: stepSize=0.001
      const params = builder.buildOrderParams({
        symbol: 'BTC/USD:USD',
        side: 'buy',
        type: 'market',
        amount: 0.01,
        clientOrderId: '42',
      });

      expect(params.userOrderId).toBe(42);
    });

    test('should add auction params for limit orders with oraclePrice', () => {
      const builder = new DriftOrderBuilder({ auctionDuration: 60 });
      // SOL: stepSize=0.1, tickSize=0.001; 100.123 passes tick validation
      const params = builder.buildOrderParams(
        {
          symbol: 'SOL/USD:USD',
          side: 'buy',
          type: 'limit',
          amount: 0.1,
          price: 100.123,
        },
        100.123 // oraclePrice
      );

      expect(params.auctionDuration).toBe(60);
      expect(params.auctionStartPrice).toBeDefined();
      expect(params.auctionEndPrice).toBeDefined();
      // For long, auctionStartMultiplier = 0.995
      expect(params.auctionStartPrice).toBe(
        BigInt(Math.floor(100.123 * 0.995 * 1e6))
      );
      expect(params.auctionEndPrice).toBe(
        BigInt(Math.floor(100.123 * 1e6))
      );
    });

    test('should throw for unknown market', () => {
      const builder = new DriftOrderBuilder();
      expect(() =>
        builder.buildOrderParams({
          symbol: 'UNKNOWN/USD:USD',
          side: 'buy',
          type: 'market',
          amount: 1,
        })
      ).toThrow('Unknown market');
    });

    test('should throw for amount below min order size', () => {
      const builder = new DriftOrderBuilder();
      // SOL minOrderSize = 0.1
      expect(() =>
        builder.buildOrderParams({
          symbol: 'SOL/USD:USD',
          side: 'buy',
          type: 'market',
          amount: 0.01,
        })
      ).toThrow(/below minimum/);
    });

    test('should throw for leverage exceeding max', () => {
      const builder = new DriftOrderBuilder();
      // SOL maxLeverage = 20
      expect(() =>
        builder.buildOrderParams({
          symbol: 'SOL/USD:USD',
          side: 'buy',
          type: 'market',
          amount: 1,
          leverage: 25,
        })
      ).toThrow(/exceeds maximum/);
    });

    test('should throw when limit order has no price', () => {
      const builder = new DriftOrderBuilder();
      expect(() =>
        builder.buildOrderParams({
          symbol: 'SOL/USD:USD',
          side: 'buy',
          type: 'limit',
          amount: 1,
        })
      ).toThrow('Price is required');
    });

    test('should throw when stop order has no stop price', () => {
      const builder = new DriftOrderBuilder();
      expect(() =>
        builder.buildOrderParams({
          symbol: 'SOL/USD:USD',
          side: 'buy',
          type: 'stopMarket',
          amount: 1,
        })
      ).toThrow('Stop price is required');
    });
  });

  describe('buildClosePositionParams', () => {
    test('should build close params for long position', () => {
      const builder = new DriftOrderBuilder();
      const params = builder.buildClosePositionParams('SOL/USD:USD', 5, true, 100);

      expect(params.orderType).toBe('market');
      expect(params.direction).toBe('short'); // opposite of long
      expect(params.reduceOnly).toBe(true);
      expect(params.marketIndex).toBe(0);
      expect(params.baseAssetAmount).toBe(BigInt(Math.floor(5 * 1e9)));
    });

    test('should build close params for short position', () => {
      const builder = new DriftOrderBuilder();
      const params = builder.buildClosePositionParams('SOL/USD:USD', 5, false);

      expect(params.direction).toBe('long'); // opposite of short
      expect(params.reduceOnly).toBe(true);
    });

    test('should apply slippage with oraclePrice', () => {
      const builder = new DriftOrderBuilder({ slippageTolerance: 0.01 });
      const params = builder.buildClosePositionParams('SOL/USD:USD', 5, true, 100);

      // Closing long = short direction, slippage = 1 - 0.01 = 0.99
      expect(params.price).toBe(BigInt(Math.floor(100 * 0.99 * 1e6)));
    });

    test('should handle negative size (absolute value)', () => {
      const builder = new DriftOrderBuilder();
      const params = builder.buildClosePositionParams('SOL/USD:USD', -5, true);

      expect(params.baseAssetAmount).toBe(BigInt(Math.floor(5 * 1e9)));
    });

    test('should throw for unknown market', () => {
      const builder = new DriftOrderBuilder();
      expect(() =>
        builder.buildClosePositionParams('UNKNOWN/USD:USD', 5, true)
      ).toThrow('Unknown market');
    });

    test('should not set price when oraclePrice is not provided', () => {
      const builder = new DriftOrderBuilder();
      const params = builder.buildClosePositionParams('SOL/USD:USD', 5, true);

      expect(params.price).toBeUndefined();
    });
  });

  describe('builder code fields', () => {
    test('should pass builderIdx and builderFee in order params', () => {
      const builder = new DriftOrderBuilder({
        builderIdx: 42,
        builderFee: 50,
      });
      const params = builder.buildOrderParams({
        symbol: 'BTC/USD:USD',
        side: 'buy',
        type: 'market',
        amount: 0.01,
      });

      expect(params.builderIdx).toBe(42);
      expect(params.builderFee).toBe(50);
    });

    test('should omit builder fields when not configured', () => {
      const builder = new DriftOrderBuilder();
      const params = builder.buildOrderParams({
        symbol: 'BTC/USD:USD',
        side: 'buy',
        type: 'market',
        amount: 0.01,
      });

      expect(params.builderIdx).toBeUndefined();
      expect(params.builderFee).toBeUndefined();
    });

    test('should allow builderIdx without builderFee', () => {
      const builder = new DriftOrderBuilder({ builderIdx: 10 });
      const params = builder.buildOrderParams({
        symbol: 'BTC/USD:USD',
        side: 'sell',
        type: 'market',
        amount: 0.01,
      });

      expect(params.builderIdx).toBe(10);
      expect(params.builderFee).toBeUndefined();
    });

    test('should allow builderFee without builderIdx', () => {
      const builder = new DriftOrderBuilder({ builderFee: 25 });
      const params = builder.buildOrderParams({
        symbol: 'BTC/USD:USD',
        side: 'buy',
        type: 'market',
        amount: 0.01,
      });

      expect(params.builderIdx).toBeUndefined();
      expect(params.builderFee).toBe(25);
    });

    test('should include builder fields in DriftOrderParams type', () => {
      const params: import('../../src/adapters/drift/DriftClientWrapper.js').DriftOrderParams = {
        orderType: 'market',
        marketIndex: 0,
        marketType: 'perp',
        direction: 'long',
        baseAssetAmount: 1000000000n,
        builderIdx: 5,
        builderFee: 100,
      };

      expect(params.builderIdx).toBe(5);
      expect(params.builderFee).toBe(100);
    });

    test('should accept builder config in DriftOrderBuilderConfig', () => {
      const config: import('../../src/adapters/drift/orderBuilder.js').DriftOrderBuilderConfig = {
        subAccountId: 0,
        slippageTolerance: 0.01,
        auctionDuration: 60,
        builderIdx: 7,
        builderFee: 30,
      };

      const builder = new DriftOrderBuilder(config);
      expect(builder).toBeInstanceOf(DriftOrderBuilder);
    });
  });
});
