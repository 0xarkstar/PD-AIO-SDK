/**
 * VariationalNormalizer Unit Tests
 *
 * Tests for the Variational normalizer including RFQ order book and funding rate
 */

import { describe, it, expect } from '@jest/globals';
import { VariationalNormalizer } from '../../src/adapters/variational/VariationalNormalizer.js';
import type { VariationalListing } from '../../src/adapters/variational/types.js';

describe('VariationalNormalizer', () => {
  let normalizer: VariationalNormalizer;

  beforeEach(() => {
    normalizer = new VariationalNormalizer();
  });

  describe('symbol conversion', () => {
    it('symbolToCCXT should convert Variational format to CCXT', () => {
      expect(normalizer.symbolToCCXT('BTC-USDC-PERP')).toBe('BTC/USDC:USDC');
      expect(normalizer.symbolToCCXT('ETH-USDC-PERP')).toBe('ETH/USDC:USDC');
    });

    it('symbolFromCCXT should convert CCXT format to Variational', () => {
      expect(normalizer.symbolFromCCXT('BTC/USDC:USDC')).toBe('BTC-USDC-PERP');
      expect(normalizer.symbolFromCCXT('ETH/USDC:USDC')).toBe('ETH-USDC-PERP');
    });

    it('should handle invalid formats gracefully', () => {
      expect(normalizer.symbolToCCXT('BTCUSDC')).toBe('BTCUSDC');
      expect(normalizer.symbolFromCCXT('BTCUSDC')).toBe('BTCUSDC');
    });
  });

  describe('normalizeMarketFromListing', () => {
    const mockListing: VariationalListing = {
      ticker: 'BTC',
      name: 'Bitcoin',
      mark_price: '95000.50',
      volume_24h: '1500000000',
      open_interest: {
        long_open_interest: '50000000',
        short_open_interest: '48000000',
      },
      funding_rate: '0.0001',
      funding_interval_s: 28800,
      base_spread_bps: '5',
      quotes: {
        updated_at: '2025-01-01T00:00:00Z',
        size_1k: { bid: '94990.00', ask: '95010.00' },
        size_100k: { bid: '94950.00', ask: '95050.00' },
        size_1m: { bid: '94800.00', ask: '95200.00' },
      },
    };

    it('should normalize market from listing', () => {
      const market = normalizer.normalizeMarketFromListing(mockListing);

      expect(market.id).toBe('BTC');
      expect(market.symbol).toBe('BTC/USDC:USDC');
      expect(market.base).toBe('BTC');
      expect(market.quote).toBe('USDC');
      expect(market.settle).toBe('USDC');
      expect(market.active).toBe(true);
      expect(market.fundingIntervalHours).toBe(8);
    });
  });

  describe('normalizeTickerFromListing', () => {
    const mockListing: VariationalListing = {
      ticker: 'ETH',
      name: 'Ethereum',
      mark_price: '3500.25',
      volume_24h: '500000000',
      open_interest: {
        long_open_interest: '25000000',
        short_open_interest: '24000000',
      },
      funding_rate: '0.00005',
      funding_interval_s: 28800,
      base_spread_bps: '3',
      quotes: {
        updated_at: '2025-01-01T00:00:00Z',
        size_1k: { bid: '3498.00', ask: '3502.00' },
        size_100k: { bid: '3495.00', ask: '3505.00' },
      },
    };

    it('should normalize ticker from listing', () => {
      const ticker = normalizer.normalizeTickerFromListing(mockListing);

      expect(ticker.symbol).toBe('ETH/USDC:USDC');
      expect(ticker.last).toBe(3500.25);
      expect(ticker.bid).toBe(3495); // Uses 100k size
      expect(ticker.ask).toBe(3505); // Uses 100k size
      expect(ticker.baseVolume).toBe(500000000);
    });
  });

  describe('normalizeFundingRateFromListing', () => {
    const mockListing: VariationalListing = {
      ticker: 'BTC',
      name: 'Bitcoin',
      mark_price: '95000.00',
      volume_24h: '1500000000',
      open_interest: {
        long_open_interest: '50000000',
        short_open_interest: '48000000',
      },
      funding_rate: '0.0001',
      funding_interval_s: 28800,
      base_spread_bps: '5',
      quotes: {
        updated_at: '2025-01-01T00:00:00Z',
        size_1k: { bid: '94990.00', ask: '95010.00' },
        size_100k: { bid: '94950.00', ask: '95050.00' },
      },
    };

    it('should normalize funding rate from listing', () => {
      const fundingRate = normalizer.normalizeFundingRateFromListing(mockListing);

      expect(fundingRate.symbol).toBe('BTC/USDC:USDC');
      expect(fundingRate.fundingRate).toBe(0.0001);
      expect(fundingRate.markPrice).toBe(95000);
      expect(fundingRate.indexPrice).toBe(95000);
      expect(fundingRate.fundingIntervalHours).toBe(8);
      expect(fundingRate.fundingTimestamp).toBeGreaterThan(0);
      expect(fundingRate.nextFundingTimestamp).toBeGreaterThan(fundingRate.fundingTimestamp);
    });
  });

  describe('normalizeOrderBookFromListing', () => {
    const mockListing: VariationalListing = {
      ticker: 'BTC',
      name: 'Bitcoin',
      mark_price: '100000.00',
      volume_24h: '1500000000',
      open_interest: {
        long_open_interest: '50000000',
        short_open_interest: '48000000',
      },
      funding_rate: '0.0001',
      funding_interval_s: 28800,
      base_spread_bps: '5',
      quotes: {
        updated_at: '2025-01-01T00:00:00Z',
        size_1k: { bid: '99950.00', ask: '100050.00' },
        size_100k: { bid: '99900.00', ask: '100100.00' },
        size_1m: { bid: '99800.00', ask: '100200.00' },
      },
    };

    it('should normalize order book from listing quotes', () => {
      const orderbook = normalizer.normalizeOrderBookFromListing(mockListing);

      expect(orderbook.exchange).toBe('variational');
      expect(orderbook.symbol).toBe('BTC/USDC:USDC');
      expect(orderbook.bids.length).toBe(3);
      expect(orderbook.asks.length).toBe(3);
      expect(orderbook.timestamp).toBeGreaterThan(0);
    });

    it('should sort bids descending and asks ascending', () => {
      const orderbook = normalizer.normalizeOrderBookFromListing(mockListing);

      // Bids should be sorted descending (highest first)
      expect(orderbook.bids[0][0]).toBeGreaterThan(orderbook.bids[1][0]);
      expect(orderbook.bids[1][0]).toBeGreaterThan(orderbook.bids[2][0]);

      // Asks should be sorted ascending (lowest first)
      expect(orderbook.asks[0][0]).toBeLessThan(orderbook.asks[1][0]);
      expect(orderbook.asks[1][0]).toBeLessThan(orderbook.asks[2][0]);
    });

    it('should calculate correct sizes based on notional', () => {
      const orderbook = normalizer.normalizeOrderBookFromListing(mockListing);

      // $1k notional at $100k mark price = 0.01 BTC
      const expectedSize1k = 1000 / 100000;
      // Find the bid/ask at $1k size level
      const size1kBid = orderbook.bids.find((b) => Math.abs(b[0] - 99950) < 1);
      expect(size1kBid).toBeDefined();
      expect(size1kBid![1]).toBeCloseTo(expectedSize1k, 4);
    });

    it('should handle listings without 1m size', () => {
      const listingWithout1m: VariationalListing = {
        ...mockListing,
        quotes: {
          updated_at: '2025-01-01T00:00:00Z',
          size_1k: { bid: '99950.00', ask: '100050.00' },
          size_100k: { bid: '99900.00', ask: '100100.00' },
        },
      };

      const orderbook = normalizer.normalizeOrderBookFromListing(listingWithout1m);

      expect(orderbook.bids.length).toBe(2);
      expect(orderbook.asks.length).toBe(2);
    });
  });

  describe('normalizeOrder', () => {
    it('should normalize order with all fields', () => {
      const order = normalizer.normalizeOrder({
        orderId: 'order-123',
        clientOrderId: 'client-456',
        symbol: 'BTC-USDC-PERP',
        type: 'limit',
        side: 'buy',
        status: 'open',
        price: '95000',
        amount: '0.5',
        filledAmount: '0.1',
        remainingAmount: '0.4',
        timestamp: 1704067200000,
        updateTime: 1704067260000,
      });

      expect(order.id).toBe('order-123');
      expect(order.clientOrderId).toBe('client-456');
      expect(order.symbol).toBe('BTC/USDC:USDC');
      expect(order.type).toBe('limit');
      expect(order.side).toBe('buy');
      expect(order.status).toBe('open');
      expect(order.price).toBe(95000);
      expect(order.amount).toBe(0.5);
      expect(order.filled).toBe(0.1);
      expect(order.remaining).toBe(0.4);
    });

    it('should convert rfq type to market', () => {
      const order = normalizer.normalizeOrder({
        orderId: 'order-123',
        symbol: 'BTC-USDC-PERP',
        type: 'rfq',
        side: 'buy',
        status: 'filled',
        amount: '0.5',
        timestamp: Date.now(),
      });

      expect(order.type).toBe('market');
    });

    it('should normalize all status values correctly', () => {
      const statuses = [
        { input: 'pending', expected: 'open' },
        { input: 'open', expected: 'open' },
        { input: 'filled', expected: 'closed' },
        { input: 'partially_filled', expected: 'open' },
        { input: 'cancelled', expected: 'canceled' },
        { input: 'expired', expected: 'expired' },
        { input: 'rejected', expected: 'rejected' },
      ] as const;

      for (const { input, expected } of statuses) {
        const order = normalizer.normalizeOrder({
          orderId: 'test',
          symbol: 'BTC-USDC-PERP',
          type: 'limit',
          side: 'buy',
          status: input,
          amount: '1',
          timestamp: Date.now(),
        });
        expect(order.status).toBe(expected);
      }
    });
  });

  describe('normalizePosition', () => {
    it('should normalize position data', () => {
      const position = normalizer.normalizePosition({
        symbol: 'ETH-USDC-PERP',
        side: 'long',
        size: '10.5',
        entryPrice: '3200',
        markPrice: '3300',
        liquidationPrice: '2800',
        margin: '3360',
        leverage: '10',
        unrealizedPnl: '1050',
        timestamp: Date.now(),
      });

      expect(position.symbol).toBe('ETH/USDC:USDC');
      expect(position.side).toBe('long');
      expect(position.size).toBe(10.5);
      expect(position.entryPrice).toBe(3200);
      expect(position.markPrice).toBe(3300);
      expect(position.liquidationPrice).toBe(2800);
      expect(position.leverage).toBe(10);
      expect(position.unrealizedPnl).toBe(1050);
    });
  });

  describe('normalizeBalance', () => {
    it('should normalize balance data', () => {
      const balance = normalizer.normalizeBalance({
        asset: 'USDC',
        free: '10000',
        locked: '5000',
        total: '15000',
      });

      expect(balance.currency).toBe('USDC');
      expect(balance.free).toBe(10000);
      expect(balance.used).toBe(5000);
      expect(balance.total).toBe(15000);
    });
  });

  // ==========================================================================
  // Additional Symbol Conversion Edge Cases
  // ==========================================================================

  describe('symbolFromCCXT edge cases', () => {
    it('should return as-is for malformed pair without slash', () => {
      expect(normalizer.symbolFromCCXT('BTCUSDC')).toBe('BTCUSDC');
    });

    it('should return as-is for pair missing quote', () => {
      expect(normalizer.symbolFromCCXT('BTC/')).toBe('BTC/');
    });

    it('should return as-is for empty string (line 57)', () => {
      expect(normalizer.symbolFromCCXT('')).toBe('');
    });
  });

  // ==========================================================================
  // normalizeMarket (VariationalMarket format)
  // ==========================================================================

  describe('normalizeMarket', () => {
    it('should normalize market with full data', () => {
      const market = normalizer.normalizeMarket({
        symbol: 'BTC-USDT-PERP',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
        contractSize: '1',
        status: 'active',
        minOrderSize: '0.001',
        maxOrderSize: '100',
        tickSize: '0.01',
        maxLeverage: '50',
      });

      expect(market.id).toBe('BTC-USDT-PERP');
      expect(market.symbol).toBe('BTC/USDT:USDT');
      expect(market.base).toBe('BTC');
      expect(market.quote).toBe('USDT');
      expect(market.settle).toBe('USDT');
      expect(market.contractSize).toBe(1);
      expect(market.active).toBe(true);
      expect(market.minAmount).toBe(0.001);
      expect(market.maxAmount).toBe(100);
      expect(market.priceTickSize).toBe(0.01);
      expect(market.amountStepSize).toBe(0.001);
      expect(market.maxLeverage).toBe(50);
      expect(market.makerFee).toBe(0.0002);
      expect(market.takerFee).toBe(0.0005);
      expect(market.fundingIntervalHours).toBe(8);
    });

    it('should handle inactive market', () => {
      const market = normalizer.normalizeMarket({
        symbol: 'ETH-USDT-PERP',
        baseAsset: 'ETH',
        quoteAsset: 'USDT',
        minOrderSize: '0.01',
        tickSize: '0.1',
        status: 'inactive',
      });

      expect(market.active).toBe(false);
    });

    it('should use defaults for missing optional fields', () => {
      const market = normalizer.normalizeMarket({
        symbol: 'SOL-USDC-PERP',
        baseAsset: 'SOL',
        quoteAsset: 'USDC',
        minOrderSize: '0.1',
        tickSize: '0.01',
        status: 'active',
      });

      expect(market.maxAmount).toBeUndefined();
      expect(market.maxLeverage).toBe(50);
      expect(market.contractSize).toBe(1);
    });
  });

  // ==========================================================================
  // normalizeTicker (VariationalTicker format)
  // ==========================================================================

  describe('normalizeTicker', () => {
    it('should normalize ticker with full data', () => {
      const ticker = normalizer.normalizeTicker({
        symbol: 'BTC-USDC-PERP',
        timestamp: 1704067200000,
        high24h: '96000',
        low24h: '94000',
        bidPrice: '95000',
        askPrice: '95100',
        lastPrice: '95050',
        volume24h: '5000',
        priceChange24h: '1000',
        priceChangePercent24h: '1.06',
      });

      expect(ticker.symbol).toBe('BTC/USDC:USDC');
      expect(ticker.timestamp).toBe(1704067200000);
      expect(ticker.high).toBe(96000);
      expect(ticker.low).toBe(94000);
      expect(ticker.bid).toBe(95000);
      expect(ticker.ask).toBe(95100);
      expect(ticker.last).toBe(95050);
      expect(ticker.open).toBe(95050);
      expect(ticker.close).toBe(95050);
      expect(ticker.baseVolume).toBe(5000);
      expect(ticker.quoteVolume).toBe(0);
      expect(ticker.change).toBe(1000);
      expect(ticker.percentage).toBe(1.06);
    });
  });

  // ==========================================================================
  // normalizeOrderBook (VariationalOrderBook format)
  // ==========================================================================

  describe('normalizeOrderBook', () => {
    it('should normalize order book', () => {
      const orderbook = normalizer.normalizeOrderBook({
        symbol: 'ETH-USDC-PERP',
        bids: [['3500', '10'], ['3495', '20']],
        asks: [['3505', '15'], ['3510', '25']],
        timestamp: 1704067200000,
      });

      expect(orderbook.exchange).toBe('variational');
      expect(orderbook.symbol).toBe('ETH/USDC:USDC');
      expect(orderbook.timestamp).toBe(1704067200000);
      expect(orderbook.bids).toEqual([[3500, 10], [3495, 20]]);
      expect(orderbook.asks).toEqual([[3505, 15], [3510, 25]]);
    });

    it('should handle empty order book', () => {
      const orderbook = normalizer.normalizeOrderBook({
        symbol: 'SOL-USDC-PERP',
        bids: [],
        asks: [],
        timestamp: 1704067200000,
      });

      expect(orderbook.bids).toEqual([]);
      expect(orderbook.asks).toEqual([]);
    });
  });

  // ==========================================================================
  // normalizeTrade
  // ==========================================================================

  describe('normalizeTrade', () => {
    it('should normalize buy trade', () => {
      const trade = normalizer.normalizeTrade({
        id: 'trade-123',
        symbol: 'BTC-USDC-PERP',
        side: 'buy',
        price: '95000',
        amount: '0.5',
        timestamp: 1704067200000,
      });

      expect(trade.id).toBe('trade-123');
      expect(trade.orderId).toBeUndefined();
      expect(trade.symbol).toBe('BTC/USDC:USDC');
      expect(trade.side).toBe('buy');
      expect(trade.price).toBe(95000);
      expect(trade.amount).toBe(0.5);
      expect(trade.cost).toBe(47500);
      expect(trade.timestamp).toBe(1704067200000);
    });

    it('should normalize sell trade', () => {
      const trade = normalizer.normalizeTrade({
        id: 'trade-456',
        symbol: 'ETH-USDC-PERP',
        side: 'sell',
        price: '3500',
        amount: '2.5',
        timestamp: 1704067300000,
      });

      expect(trade.side).toBe('sell');
      expect(trade.cost).toBe(8750);
    });
  });

  // ==========================================================================
  // normalizeFundingRate (VariationalFundingRate format)
  // ==========================================================================

  describe('normalizeFundingRate', () => {
    it('should normalize funding rate with full data', () => {
      const fundingRate = normalizer.normalizeFundingRate({
        symbol: 'BTC-USDC-PERP',
        fundingRate: '0.0001',
        fundingTime: 1704067200000,
        nextFundingTime: 1704096000000,
        markPrice: '95000',
        indexPrice: '95050',
      });

      expect(fundingRate.symbol).toBe('BTC/USDC:USDC');
      expect(fundingRate.fundingRate).toBe(0.0001);
      expect(fundingRate.fundingTimestamp).toBe(1704067200000);
      expect(fundingRate.nextFundingTimestamp).toBe(1704096000000);
      expect(fundingRate.markPrice).toBe(95000);
      expect(fundingRate.indexPrice).toBe(95050);
      expect(fundingRate.fundingIntervalHours).toBe(8);
    });

    it('should use defaults for missing optional fields', () => {
      const fundingRate = normalizer.normalizeFundingRate({
        symbol: 'ETH-USDC-PERP',
        fundingRate: '-0.0002',
        fundingTime: 1704067200000,
      });

      expect(fundingRate.fundingRate).toBe(-0.0002);
      expect(fundingRate.nextFundingTimestamp).toBe(0);
      expect(fundingRate.markPrice).toBe(0);
      expect(fundingRate.indexPrice).toBe(0);
    });
  });

  // ==========================================================================
  // normalizeOrderStatus default case
  // ==========================================================================

  describe('normalizeOrder status edge cases', () => {
    it('should default to open for unknown status', () => {
      const order = normalizer.normalizeOrder({
        orderId: 'order-unknown',
        symbol: 'BTC-USDC-PERP',
        type: 'limit',
        side: 'buy',
        status: 'unknown_status' as any,
        amount: '1',
        timestamp: Date.now(),
      });

      expect(order.status).toBe('open');
    });

    it('should calculate remaining from amount and filled when not provided', () => {
      const order = normalizer.normalizeOrder({
        orderId: 'order-calc',
        symbol: 'BTC-USDC-PERP',
        type: 'limit',
        side: 'buy',
        status: 'open',
        amount: '1.5',
        filledAmount: '0.5',
        timestamp: Date.now(),
      });

      expect(order.amount).toBe(1.5);
      expect(order.filled).toBe(0.5);
      expect(order.remaining).toBe(1);
    });
  });

  // ==========================================================================
  // normalizeQuote (Variational-specific RFQ)
  // ==========================================================================

  describe('normalizeQuote', () => {
    it('should normalize quote with full data', () => {
      const quote = normalizer.normalizeQuote({
        quoteId: 'quote-123',
        symbol: 'BTC-USDC-PERP',
        side: 'buy',
        price: '95000',
        amount: '0.5',
        expiresAt: 1704067260000,
        marketMaker: 'MM1',
        spread: '0.01',
        timestamp: 1704067200000,
      });

      expect(quote.id).toBe('quote-123');
      expect(quote.symbol).toBe('BTC/USDC:USDC');
      expect(quote.side).toBe('buy');
      expect(quote.price).toBe(95000);
      expect(quote.amount).toBe(0.5);
      expect(quote.expiresAt).toBe(1704067260000);
      expect(quote.marketMaker).toBe('MM1');
      expect(quote.spread).toBe(0.01);
      expect(quote.timestamp).toBe(1704067200000);
    });

    it('should handle quote without spread', () => {
      const quote = normalizer.normalizeQuote({
        quoteId: 'quote-456',
        symbol: 'ETH-USDC-PERP',
        side: 'sell',
        price: '3500',
        amount: '2.5',
        expiresAt: 1704067260000,
        marketMaker: 'MM2',
        timestamp: 1704067200000,
      });

      expect(quote.spread).toBeUndefined();
    });
  });

  // ==========================================================================
  // Batch Normalize Methods
  // ==========================================================================

  describe('batch normalize methods', () => {
    const mockMarket1 = {
      symbol: 'BTC-USDC-PERP',
      baseAsset: 'BTC',
      quoteAsset: 'USDC',
      minOrderSize: '0.001',
      tickSize: '0.01',
      status: 'active' as const,
    };

    const mockMarket2 = {
      symbol: 'ETH-USDC-PERP',
      baseAsset: 'ETH',
      quoteAsset: 'USDC',
      minOrderSize: '0.01',
      tickSize: '0.1',
      status: 'active' as const,
    };

    it('normalizeMarkets should batch normalize markets', () => {
      const markets = normalizer.normalizeMarkets([mockMarket1, mockMarket2]);

      expect(markets).toHaveLength(2);
      expect(markets[0].symbol).toBe('BTC/USDC:USDC');
      expect(markets[1].symbol).toBe('ETH/USDC:USDC');
    });

    it('normalizeOrders should batch normalize orders', () => {
      const orders = normalizer.normalizeOrders([
        {
          orderId: 'order-1',
          symbol: 'BTC-USDC-PERP',
          type: 'limit',
          side: 'buy',
          status: 'open',
          amount: '1',
          timestamp: Date.now(),
        },
        {
          orderId: 'order-2',
          symbol: 'ETH-USDC-PERP',
          type: 'market',
          side: 'sell',
          status: 'filled',
          amount: '2',
          timestamp: Date.now(),
        },
      ]);

      expect(orders).toHaveLength(2);
      expect(orders[0].id).toBe('order-1');
      expect(orders[1].id).toBe('order-2');
    });

    it('normalizePositions should batch normalize positions', () => {
      const positions = normalizer.normalizePositions([
        {
          symbol: 'BTC-USDC-PERP',
          side: 'long',
          size: '0.5',
          entryPrice: '95000',
          markPrice: '96000',
          margin: '4750',
          leverage: '10',
          unrealizedPnl: '500',
          timestamp: Date.now(),
        },
        {
          symbol: 'ETH-USDC-PERP',
          side: 'short',
          size: '5',
          entryPrice: '3500',
          markPrice: '3400',
          margin: '1750',
          leverage: '10',
          unrealizedPnl: '500',
          timestamp: Date.now(),
        },
      ]);

      expect(positions).toHaveLength(2);
      expect(positions[0].side).toBe('long');
      expect(positions[1].side).toBe('short');
    });

    it('normalizeBalances should batch normalize balances', () => {
      const balances = normalizer.normalizeBalances([
        { asset: 'USDC', free: '10000', locked: '5000', total: '15000' },
        { asset: 'USDT', free: '5000', locked: '1000', total: '6000' },
      ]);

      expect(balances).toHaveLength(2);
      expect(balances[0].currency).toBe('USDC');
      expect(balances[1].currency).toBe('USDT');
    });

    it('normalizeTrades should batch normalize trades', () => {
      const trades = normalizer.normalizeTrades([
        {
          id: 'trade-1',
          symbol: 'BTC-USDC-PERP',
          side: 'buy',
          price: '95000',
          amount: '0.5',
          timestamp: Date.now(),
        },
        {
          id: 'trade-2',
          symbol: 'ETH-USDC-PERP',
          side: 'sell',
          price: '3500',
          amount: '2.5',
          timestamp: Date.now(),
        },
      ]);

      expect(trades).toHaveLength(2);
      expect(trades[0].id).toBe('trade-1');
      expect(trades[1].id).toBe('trade-2');
    });

    const mockListing1: VariationalListing = {
      ticker: 'BTC',
      name: 'Bitcoin',
      mark_price: '95000',
      volume_24h: '1500000000',
      open_interest: {
        long_open_interest: '50000000',
        short_open_interest: '48000000',
      },
      funding_rate: '0.0001',
      funding_interval_s: 28800,
      base_spread_bps: '5',
      quotes: {
        updated_at: '2025-01-01T00:00:00Z',
        size_1k: { bid: '94990', ask: '95010' },
        size_100k: { bid: '94950', ask: '95050' },
      },
    };

    const mockListing2: VariationalListing = {
      ticker: 'ETH',
      name: 'Ethereum',
      mark_price: '3500',
      volume_24h: '500000000',
      open_interest: {
        long_open_interest: '25000000',
        short_open_interest: '24000000',
      },
      funding_rate: '0.00005',
      funding_interval_s: 28800,
      base_spread_bps: '3',
      quotes: {
        updated_at: '2025-01-01T00:00:00Z',
        size_1k: { bid: '3498', ask: '3502' },
        size_100k: { bid: '3495', ask: '3505' },
      },
    };

    it('normalizeMarketsFromListings should batch normalize markets', () => {
      const markets = normalizer.normalizeMarketsFromListings([mockListing1, mockListing2]);

      expect(markets).toHaveLength(2);
      expect(markets[0].id).toBe('BTC');
      expect(markets[1].id).toBe('ETH');
    });

    it('normalizeTickersFromListings should batch normalize tickers', () => {
      const tickers = normalizer.normalizeTickersFromListings([mockListing1, mockListing2]);

      expect(tickers).toHaveLength(2);
      expect(tickers[0].symbol).toBe('BTC/USDC:USDC');
      expect(tickers[1].symbol).toBe('ETH/USDC:USDC');
    });
  });
});
