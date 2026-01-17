/**
 * Variational Normalizer Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import { VariationalNormalizer } from '../../src/adapters/variational/VariationalNormalizer.js';
import type {
  VariationalListing,
  VariationalMarket,
  VariationalTicker,
  VariationalOrderBook,
  VariationalTrade,
  VariationalFundingRate,
  VariationalOrder,
  VariationalPosition,
  VariationalBalance,
} from '../../src/adapters/variational/types.js';

describe('VariationalNormalizer', () => {
  let normalizer: VariationalNormalizer;

  beforeEach(() => {
    normalizer = new VariationalNormalizer();
  });

  describe('Symbol Conversion', () => {
    it('should convert Variational symbol to CCXT format', () => {
      expect(normalizer.symbolToCCXT('BTC-USDT-PERP')).toBe('BTC/USDT:USDT');
      expect(normalizer.symbolToCCXT('ETH-USDT-PERP')).toBe('ETH/USDT:USDT');
      expect(normalizer.symbolToCCXT('SOL-USDT-PERP')).toBe('SOL/USDT:USDT');
    });

    it('should return symbol as-is if format does not match', () => {
      expect(normalizer.symbolToCCXT('INVALID')).toBe('INVALID');
      expect(normalizer.symbolToCCXT('BTC-USD')).toBe('BTC-USD');
    });

    it('should convert CCXT symbol to Variational format', () => {
      expect(normalizer.symbolFromCCXT('BTC/USDT:USDT')).toBe('BTC-USDT-PERP');
      expect(normalizer.symbolFromCCXT('ETH/USDT:USDT')).toBe('ETH-USDT-PERP');
      expect(normalizer.symbolFromCCXT('SOL/USDT:USDT')).toBe('SOL-USDT-PERP');
    });

    it('should return symbol as-is for invalid CCXT format', () => {
      expect(normalizer.symbolFromCCXT('INVALID')).toBe('INVALID');
      expect(normalizer.symbolFromCCXT('BTC')).toBe('BTC');
    });
  });

  describe('normalizeMarketFromListing', () => {
    it('should normalize market data from listing', () => {
      const listing: VariationalListing = {
        ticker: 'BTC',
        name: 'Bitcoin',
        mark_price: '50000.00',
        volume_24h: '1000000.00',
        open_interest: {
          long_open_interest: '500000.00',
          short_open_interest: '500000.00',
        },
        funding_rate: '0.0001',
        funding_interval_s: 28800, // 8 hours
        base_spread_bps: '5',
        quotes: {
          updated_at: '2024-01-01T00:00:00Z',
          size_1k: { bid: '49990.00', ask: '50010.00' },
          size_100k: { bid: '49995.00', ask: '50005.00' },
          size_1m: { bid: '49998.00', ask: '50002.00' },
        },
      };

      const result = normalizer.normalizeMarketFromListing(listing);

      expect(result.symbol).toBe('BTC/USDC:USDC');
      expect(result.base).toBe('BTC');
      expect(result.quote).toBe('USDC');
      expect(result.settle).toBe('USDC');
      expect(result.active).toBe(true);
      expect(result.contractSize).toBe(1);
      expect(result.fundingIntervalHours).toBe(8);
      expect(result.makerFee).toBe(0);
      expect(result.takerFee).toBe(0);
    });

    it('should handle listing without size_1m quotes', () => {
      const listing: VariationalListing = {
        ticker: 'ETH',
        name: 'Ethereum',
        mark_price: '3000.00',
        volume_24h: '500000.00',
        open_interest: {
          long_open_interest: '250000.00',
          short_open_interest: '250000.00',
        },
        funding_rate: '0.00015',
        funding_interval_s: 28800,
        base_spread_bps: '10',
        quotes: {
          updated_at: '2024-01-01T00:00:00Z',
          size_1k: { bid: '2995.00', ask: '3005.00' },
          size_100k: { bid: '2998.00', ask: '3002.00' },
        },
      };

      const result = normalizer.normalizeMarketFromListing(listing);

      expect(result.symbol).toBe('ETH/USDC:USDC');
      expect(result.base).toBe('ETH');
    });
  });

  describe('normalizeTickerFromListing', () => {
    it('should normalize ticker data from listing', () => {
      const listing: VariationalListing = {
        ticker: 'BTC',
        name: 'Bitcoin',
        mark_price: '50000.00',
        volume_24h: '1000000.00',
        open_interest: {
          long_open_interest: '500000.00',
          short_open_interest: '500000.00',
        },
        funding_rate: '0.0001',
        funding_interval_s: 28800,
        base_spread_bps: '5',
        quotes: {
          updated_at: '2024-01-01T00:00:00Z',
          size_1k: { bid: '49990.00', ask: '50010.00' },
          size_100k: { bid: '49995.00', ask: '50005.00' },
        },
      };

      const result = normalizer.normalizeTickerFromListing(listing);

      expect(result.symbol).toBe('BTC/USDC:USDC');
      expect(result.last).toBe(50000);
      expect(result.bid).toBe(49995);
      expect(result.ask).toBe(50005);
      expect(result.baseVolume).toBe(1000000);
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should use mark price for high/low/open/close when not available', () => {
      const listing: VariationalListing = {
        ticker: 'ETH',
        name: 'Ethereum',
        mark_price: '3000.00',
        volume_24h: '500000.00',
        open_interest: {
          long_open_interest: '250000.00',
          short_open_interest: '250000.00',
        },
        funding_rate: '0.00015',
        funding_interval_s: 28800,
        base_spread_bps: '10',
        quotes: {
          updated_at: '2024-01-01T00:00:00Z',
          size_1k: { bid: '2995.00', ask: '3005.00' },
          size_100k: { bid: '2998.00', ask: '3002.00' },
        },
      };

      const result = normalizer.normalizeTickerFromListing(listing);

      expect(result.high).toBe(3000);
      expect(result.low).toBe(3000);
      expect(result.open).toBe(3000);
      expect(result.close).toBe(3000);
      expect(result.change).toBe(0);
      expect(result.percentage).toBe(0);
    });
  });

  describe('normalizeMarket', () => {
    it('should normalize market data', () => {
      const market: VariationalMarket = {
        symbol: 'BTC-USDT-PERP',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
        status: 'active',
        minOrderSize: '0.001',
        maxOrderSize: '100',
        tickSize: '0.5',
        contractSize: '1',
        maxLeverage: '50',
        fundingInterval: 28800,
      };

      const result = normalizer.normalizeMarket(market);

      expect(result.symbol).toBe('BTC/USDT:USDT');
      expect(result.base).toBe('BTC');
      expect(result.quote).toBe('USDT');
      expect(result.settle).toBe('USDT');
      expect(result.active).toBe(true);
      expect(result.minAmount).toBe(0.001);
      expect(result.maxAmount).toBe(100);
      expect(result.maxLeverage).toBe(50);
    });

    it('should handle inactive markets', () => {
      const market: VariationalMarket = {
        symbol: 'SOL-USDT-PERP',
        baseAsset: 'SOL',
        quoteAsset: 'USDT',
        status: 'inactive',
        minOrderSize: '0.01',
        tickSize: '0.01',
      };

      const result = normalizer.normalizeMarket(market);

      expect(result.active).toBe(false);
    });

    it('should use default values for optional fields', () => {
      const market: VariationalMarket = {
        symbol: 'ETH-USDT-PERP',
        baseAsset: 'ETH',
        quoteAsset: 'USDT',
        status: 'active',
        minOrderSize: '0.01',
        tickSize: '0.1',
      };

      const result = normalizer.normalizeMarket(market);

      expect(result.contractSize).toBe(1);
      expect(result.maxLeverage).toBe(50);
      expect(result.maxAmount).toBeUndefined();
    });
  });

  describe('normalizeTicker', () => {
    it('should normalize ticker data', () => {
      const ticker: VariationalTicker = {
        symbol: 'BTC-USDT-PERP',
        lastPrice: '50000',
        bidPrice: '49990',
        askPrice: '50010',
        volume24h: '1000000',
        high24h: '51000',
        low24h: '49000',
        priceChange24h: '1000',
        priceChangePercent24h: '2',
        timestamp: 1234567890,
      };

      const result = normalizer.normalizeTicker(ticker);

      expect(result.symbol).toBe('BTC/USDT:USDT');
      expect(result.last).toBe(50000);
      expect(result.bid).toBe(49990);
      expect(result.ask).toBe(50010);
      expect(result.high).toBe(51000);
      expect(result.low).toBe(49000);
      expect(result.baseVolume).toBe(1000000);
      expect(result.change).toBe(1000);
      expect(result.percentage).toBe(2);
    });
  });

  describe('normalizeOrderBook', () => {
    it('should normalize order book data', () => {
      const orderbook: VariationalOrderBook = {
        symbol: 'BTC-USDT-PERP',
        bids: [
          ['49900', '1.5'],
          ['49800', '2.0'],
        ],
        asks: [
          ['50100', '1.2'],
          ['50200', '1.8'],
        ],
        timestamp: 1234567890,
        sequence: 123,
      };

      const result = normalizer.normalizeOrderBook(orderbook);

      expect(result.exchange).toBe('variational');
      expect(result.symbol).toBe('BTC/USDT:USDT');
      expect(result.bids).toHaveLength(2);
      expect(result.asks).toHaveLength(2);
      expect(result.bids[0]).toEqual([49900, 1.5]);
      expect(result.asks[0]).toEqual([50100, 1.2]);
    });
  });

  describe('normalizeTrade', () => {
    it('should normalize trade data', () => {
      const trade: VariationalTrade = {
        id: 'trade123',
        symbol: 'BTC-USDT-PERP',
        price: '50000',
        amount: '1.5',
        side: 'buy',
        timestamp: 1234567890,
        isMaker: true,
      };

      const result = normalizer.normalizeTrade(trade);

      expect(result.id).toBe('trade123');
      expect(result.symbol).toBe('BTC/USDT:USDT');
      expect(result.price).toBe(50000);
      expect(result.amount).toBe(1.5);
      expect(result.side).toBe('buy');
      expect(result.cost).toBe(75000);
    });
  });

  describe('normalizeFundingRate', () => {
    it('should normalize funding rate data', () => {
      const fundingRate: VariationalFundingRate = {
        symbol: 'BTC-USDT-PERP',
        fundingRate: '0.0001',
        fundingTime: 1234567890,
        nextFundingTime: 1234597890,
        indexPrice: '49990',
        markPrice: '50000',
      };

      const result = normalizer.normalizeFundingRate(fundingRate);

      expect(result.symbol).toBe('BTC/USDT:USDT');
      expect(result.fundingRate).toBe(0.0001);
      expect(result.fundingTimestamp).toBe(1234567890);
      expect(result.nextFundingTimestamp).toBe(1234597890);
      expect(result.indexPrice).toBe(49990);
      expect(result.markPrice).toBe(50000);
    });

    it('should handle funding rate without optional fields', () => {
      const fundingRate: VariationalFundingRate = {
        symbol: 'ETH-USDT-PERP',
        fundingRate: '0.00015',
        fundingTime: 1234567890,
      };

      const result = normalizer.normalizeFundingRate(fundingRate);

      expect(result.nextFundingTimestamp).toBe(0);
      expect(result.indexPrice).toBe(0);
      expect(result.markPrice).toBe(0);
    });
  });

  describe('normalizeOrder', () => {
    it('should normalize order data', () => {
      const order: VariationalOrder = {
        orderId: 'order123',
        clientOrderId: 'client123',
        symbol: 'BTC-USDT-PERP',
        type: 'limit',
        side: 'buy',
        price: '50000',
        amount: '1.5',
        filledAmount: '0.5',
        remainingAmount: '1.0',
        status: 'open',
        timestamp: 1234567890,
        updateTime: 1234567891,
      };

      const result = normalizer.normalizeOrder(order);

      expect(result.id).toBe('order123');
      expect(result.clientOrderId).toBe('client123');
      expect(result.symbol).toBe('BTC/USDT:USDT');
      expect(result.type).toBe('limit');
      expect(result.side).toBe('buy');
      expect(result.price).toBe(50000);
      expect(result.amount).toBe(1.5);
      expect(result.filled).toBe(0.5);
      expect(result.remaining).toBe(1.0);
      expect(result.status).toBe('open');
    });

    it('should normalize RFQ order type', () => {
      const order: VariationalOrder = {
        orderId: 'order456',
        symbol: 'ETH-USDT-PERP',
        type: 'rfq',
        side: 'sell',
        price: '3000',
        amount: '10',
        status: 'filled',
        timestamp: 1234567890,
        updateTime: 1234567891,
      };

      const result = normalizer.normalizeOrder(order);

      expect(result.type).toBe('market'); // RFQ maps to market
      expect(result.status).toBe('closed'); // filled maps to closed
    });
  });

  describe('normalizePosition', () => {
    it('should normalize position data', () => {
      const position: VariationalPosition = {
        symbol: 'BTC-USDT-PERP',
        side: 'long',
        size: '2.5',
        entryPrice: '48000',
        markPrice: '50000',
        liquidationPrice: '45000',
        unrealizedPnl: '5000',
        leverage: '10',
        margin: '12000',
        timestamp: 1234567890,
      };

      const result = normalizer.normalizePosition(position);

      expect(result.symbol).toBe('BTC/USDT:USDT');
      expect(result.side).toBe('long');
      expect(result.size).toBe(2.5);
      expect(result.entryPrice).toBe(48000);
      expect(result.markPrice).toBe(50000);
      expect(result.unrealizedPnl).toBe(5000);
      expect(result.leverage).toBe(10);
    });
  });

  describe('normalizeBalance', () => {
    it('should normalize balance data', () => {
      const balance: VariationalBalance = {
        asset: 'USDT',
        free: '10000',
        locked: '2000',
        total: '12000',
      };

      const result = normalizer.normalizeBalance(balance);

      expect(result.currency).toBe('USDT');
      expect(result.free).toBe(10000);
      expect(result.used).toBe(2000);
      expect(result.total).toBe(12000);
    });
  });

  describe('Batch Normalization', () => {
    it('should normalize markets from listings', () => {
      const listings: VariationalListing[] = [
        {
          ticker: 'BTC',
          name: 'Bitcoin',
          mark_price: '50000',
          volume_24h: '1000000',
          open_interest: { long_open_interest: '500000', short_open_interest: '500000' },
          funding_rate: '0.0001',
          funding_interval_s: 28800,
          base_spread_bps: '5',
          quotes: {
            updated_at: '2024-01-01T00:00:00Z',
            size_1k: { bid: '49990', ask: '50010' },
            size_100k: { bid: '49995', ask: '50005' },
          },
        },
        {
          ticker: 'ETH',
          name: 'Ethereum',
          mark_price: '3000',
          volume_24h: '500000',
          open_interest: { long_open_interest: '250000', short_open_interest: '250000' },
          funding_rate: '0.00015',
          funding_interval_s: 28800,
          base_spread_bps: '10',
          quotes: {
            updated_at: '2024-01-01T00:00:00Z',
            size_1k: { bid: '2995', ask: '3005' },
            size_100k: { bid: '2998', ask: '3002' },
          },
        },
      ];

      const result = normalizer.normalizeMarketsFromListings(listings);

      expect(result).toHaveLength(2);
      expect(result[0].symbol).toBe('BTC/USDC:USDC');
      expect(result[1].symbol).toBe('ETH/USDC:USDC');
    });

    it('should normalize tickers from listings', () => {
      const listings: VariationalListing[] = [
        {
          ticker: 'BTC',
          name: 'Bitcoin',
          mark_price: '50000',
          volume_24h: '1000000',
          open_interest: { long_open_interest: '500000', short_open_interest: '500000' },
          funding_rate: '0.0001',
          funding_interval_s: 28800,
          base_spread_bps: '5',
          quotes: {
            updated_at: '2024-01-01T00:00:00Z',
            size_1k: { bid: '49990', ask: '50010' },
            size_100k: { bid: '49995', ask: '50005' },
          },
        },
      ];

      const result = normalizer.normalizeTickersFromListings(listings);

      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('BTC/USDC:USDC');
      expect(result[0].last).toBe(50000);
    });
  });
});
