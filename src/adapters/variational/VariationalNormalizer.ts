/**
 * Variational Normalizer
 *
 * Data transformation layer for Variational exchange
 * Converts Variational-specific formats to unified SDK format
 */

import type {
  Market,
  Order,
  Position,
  Balance,
  OrderBook,
  Trade,
  Ticker,
  FundingRate,
} from '../../types/common.js';
import type {
  VariationalMarket,
  VariationalOrder,
  VariationalPosition,
  VariationalBalance,
  VariationalOrderBook,
  VariationalTrade,
  VariationalTicker,
  VariationalFundingRate,
  VariationalQuote,
  VariationalListing,
} from './types.js';
import {
  VariationalMarketSchema,
  VariationalOrderSchema,
  VariationalPositionSchema,
  VariationalBalanceSchema,
  VariationalOrderBookSchema,
  VariationalTradeSchema,
  VariationalTickerSchema,
  VariationalFundingRateSchema,
  VariationalQuoteSchema,
  VariationalListingSchema,
} from './types.js';
import { countDecimals, safeParseFloat } from './utils.js';

export class VariationalNormalizer {
  /**
   * Convert Variational symbol to unified CCXT format
   * "BTC-USDT-PERP" → "BTC/USDT:USDT"
   */
  symbolToCCXT(variationalSymbol: string): string {
    const parts = variationalSymbol.split('-');

    if (parts.length === 3 && parts[2] === 'PERP') {
      const [base, quote] = parts;
      return `${base}/${quote}:${quote}`;
    }

    // Fallback: return as-is if format doesn't match
    return variationalSymbol;
  }

  /**
   * Convert unified CCXT symbol to Variational format
   * "BTC/USDT:USDT" → "BTC-USDT-PERP"
   */
  symbolFromCCXT(ccxtSymbol: string): string {
    const [pair] = ccxtSymbol.split(':');
    if (!pair) {
      return ccxtSymbol;
    }

    const [base, quote] = pair.split('/');
    if (!base || !quote) {
      return ccxtSymbol;
    }

    return `${base}-${quote}-PERP`;
  }

  /**
   * Normalize market data from listing (from /metadata/stats)
   */
  normalizeMarketFromListing(listing: VariationalListing): Market {
    const validated = VariationalListingSchema.parse(listing);
    // Variational uses ticker symbols like "BTC", "ETH", convert to unified format
    const unifiedSymbol = `${validated.ticker}/USDC:USDC`;

    return {
      id: validated.ticker,
      symbol: unifiedSymbol,
      base: validated.ticker,
      quote: 'USDC',
      settle: 'USDC',
      contractSize: 1,
      active: true, // Listed markets are active
      minAmount: 0.001, // Default, actual value from RFQ
      maxAmount: undefined,
      pricePrecision: 2,
      amountPrecision: 3,
      priceTickSize: 0.01,
      amountStepSize: 0.001,
      makerFee: 0, // RFQ model, spreads included in quotes
      takerFee: 0,
      maxLeverage: 50, // Default leverage
      fundingIntervalHours: validated.funding_interval_s / 3600,
      info: validated as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize market data
   */
  normalizeMarket(market: VariationalMarket): Market {
    const validated = VariationalMarketSchema.parse(market);
    const unifiedSymbol = this.symbolToCCXT(validated.symbol);

    return {
      id: validated.symbol,
      symbol: unifiedSymbol,
      base: validated.baseAsset,
      quote: validated.quoteAsset,
      settle: validated.quoteAsset,
      contractSize: safeParseFloat(validated.contractSize || '1'),
      active: validated.status === 'active',
      minAmount: safeParseFloat(
        typeof validated.minOrderSize === 'number'
          ? String(validated.minOrderSize)
          : validated.minOrderSize
      ),
      maxAmount: validated.maxOrderSize
        ? safeParseFloat(
            typeof validated.maxOrderSize === 'number'
              ? String(validated.maxOrderSize)
              : validated.maxOrderSize
          )
        : undefined,
      pricePrecision: countDecimals(
        typeof validated.tickSize === 'number' ? String(validated.tickSize) : validated.tickSize
      ),
      amountPrecision: countDecimals(
        typeof validated.minOrderSize === 'number'
          ? String(validated.minOrderSize)
          : validated.minOrderSize
      ),
      priceTickSize: safeParseFloat(
        typeof validated.tickSize === 'number' ? String(validated.tickSize) : validated.tickSize
      ),
      amountStepSize: safeParseFloat(
        typeof validated.minOrderSize === 'number'
          ? String(validated.minOrderSize)
          : validated.minOrderSize
      ),
      makerFee: 0.0002,
      takerFee: 0.0005,
      maxLeverage: validated.maxLeverage ? safeParseFloat(validated.maxLeverage) : 50,
      fundingIntervalHours: 8,
      info: validated as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize ticker data from listing (from /metadata/stats)
   */
  normalizeTickerFromListing(listing: VariationalListing): Ticker {
    const validated = VariationalListingSchema.parse(listing);
    const unifiedSymbol = `${validated.ticker}/USDC:USDC`;
    const timestamp = Date.now(); // Real timestamp would come from listing.quotes.updated_at
    const markPrice = safeParseFloat(validated.mark_price);

    return {
      symbol: unifiedSymbol,
      timestamp,
      high: markPrice, // Not available from /metadata/stats
      low: markPrice, // Not available from /metadata/stats
      bid: safeParseFloat(validated.quotes.size_100k.bid),
      ask: safeParseFloat(validated.quotes.size_100k.ask),
      last: markPrice,
      open: markPrice, // Not available from /metadata/stats
      close: markPrice,
      baseVolume: safeParseFloat(validated.volume_24h),
      quoteVolume: safeParseFloat(validated.volume_24h),
      change: 0, // Not available from /metadata/stats
      percentage: 0, // Not available from /metadata/stats
      info: {
        ...(validated as unknown as Record<string, unknown>),
        _bidAskSource: 'orderbook',
      },
    };
  }

  /**
   * Normalize ticker data
   */
  normalizeTicker(ticker: VariationalTicker): Ticker {
    const validated = VariationalTickerSchema.parse(ticker);
    const unifiedSymbol = this.symbolToCCXT(validated.symbol);

    return {
      symbol: unifiedSymbol,
      timestamp: validated.timestamp,
      high: safeParseFloat(validated.high24h),
      low: safeParseFloat(validated.low24h),
      bid: safeParseFloat(validated.bidPrice),
      ask: safeParseFloat(validated.askPrice),
      last: safeParseFloat(validated.lastPrice),
      open: safeParseFloat(validated.lastPrice),
      close: safeParseFloat(validated.lastPrice),
      baseVolume: safeParseFloat(validated.volume24h),
      quoteVolume: 0,
      change: safeParseFloat(validated.priceChange24h),
      percentage: safeParseFloat(validated.priceChangePercent24h),
      info: {
        ...(validated as unknown as Record<string, unknown>),
        _bidAskSource: 'orderbook',
      },
    };
  }

  /**
   * Normalize order book data
   */
  normalizeOrderBook(orderbook: VariationalOrderBook): OrderBook {
    const validated = VariationalOrderBookSchema.parse(orderbook);
    const unifiedSymbol = this.symbolToCCXT(validated.symbol);

    return {
      exchange: 'variational',
      symbol: unifiedSymbol,
      bids: validated.bids.map(([price, amount]) => [
        safeParseFloat(price),
        safeParseFloat(amount),
      ]),
      asks: validated.asks.map(([price, amount]) => [
        safeParseFloat(price),
        safeParseFloat(amount),
      ]),
      timestamp: validated.timestamp,
    };
  }

  /**
   * Normalize trade data
   */
  normalizeTrade(trade: VariationalTrade): Trade {
    const validated = VariationalTradeSchema.parse(trade);
    const unifiedSymbol = this.symbolToCCXT(validated.symbol);

    return {
      id: validated.id,
      orderId: undefined,
      symbol: unifiedSymbol,
      side: validated.side as 'buy' | 'sell',
      price: safeParseFloat(
        typeof validated.price === 'number' ? String(validated.price) : validated.price
      ),
      amount: safeParseFloat(
        typeof validated.amount === 'number' ? String(validated.amount) : validated.amount
      ),
      cost:
        safeParseFloat(
          typeof validated.price === 'number' ? String(validated.price) : validated.price
        ) *
        safeParseFloat(
          typeof validated.amount === 'number' ? String(validated.amount) : validated.amount
        ),
      timestamp: validated.timestamp,
      info: validated as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize funding rate data
   */
  normalizeFundingRate(fundingRate: VariationalFundingRate): FundingRate {
    const validated = VariationalFundingRateSchema.parse(fundingRate);
    const unifiedSymbol = this.symbolToCCXT(validated.symbol);

    return {
      symbol: unifiedSymbol,
      fundingRate: safeParseFloat(validated.fundingRate),
      fundingTimestamp: validated.fundingTime,
      nextFundingTimestamp: validated.nextFundingTime || 0,
      markPrice: validated.markPrice ? safeParseFloat(validated.markPrice) : 0,
      indexPrice: validated.indexPrice ? safeParseFloat(validated.indexPrice) : 0,
      fundingIntervalHours: 8,
      info: validated as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize order data
   */
  normalizeOrder(order: VariationalOrder): Order {
    const validated = VariationalOrderSchema.parse(order);
    const unifiedSymbol = this.symbolToCCXT(validated.symbol);
    const filledAmount =
      typeof validated.filledAmount === 'number'
        ? String(validated.filledAmount)
        : validated.filledAmount || '0';
    const filled = safeParseFloat(filledAmount);
    const amountValue =
      typeof validated.amount === 'number' ? String(validated.amount) : validated.amount;
    const amount = safeParseFloat(amountValue);
    const remainingAmount = validated.remainingAmount
      ? typeof validated.remainingAmount === 'number'
        ? String(validated.remainingAmount)
        : validated.remainingAmount
      : String(amount - filled);
    const remaining = safeParseFloat(remainingAmount);

    return {
      id: validated.orderId,
      clientOrderId: validated.clientOrderId,
      symbol: unifiedSymbol,
      type: (validated.type === 'rfq' ? 'market' : validated.type) as 'market' | 'limit',
      side: validated.side as 'buy' | 'sell',
      price: validated.price ? safeParseFloat(validated.price) : undefined,
      amount: amount,
      filled: filled,
      remaining: remaining,
      reduceOnly: false,
      postOnly: false,
      status: this.normalizeOrderStatus(validated.status as VariationalOrder['status']),
      timestamp: validated.timestamp,
      lastUpdateTimestamp: validated.updateTime,
      info: validated as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize order status
   */
  private normalizeOrderStatus(
    status: VariationalOrder['status']
  ): 'open' | 'closed' | 'canceled' | 'expired' | 'rejected' {
    switch (status) {
      case 'pending':
      case 'open':
        return 'open';
      case 'filled':
        return 'closed';
      case 'cancelled':
        return 'canceled';
      case 'expired':
        return 'expired';
      case 'rejected':
        return 'rejected';
      case 'partially_filled':
        return 'open';
      default:
        return 'open';
    }
  }

  /**
   * Normalize position data
   */
  normalizePosition(position: VariationalPosition): Position {
    const validated = VariationalPositionSchema.parse(position);
    const unifiedSymbol = this.symbolToCCXT(validated.symbol);
    const sizeValue = typeof validated.size === 'number' ? String(validated.size) : validated.size;
    const size = safeParseFloat(sizeValue);
    const entryPriceValue =
      typeof validated.entryPrice === 'number'
        ? String(validated.entryPrice)
        : validated.entryPrice;
    const entryPrice = safeParseFloat(entryPriceValue);

    return {
      symbol: unifiedSymbol,
      side: validated.side as 'long' | 'short',
      size: size,
      entryPrice: entryPrice,
      markPrice: safeParseFloat(
        typeof validated.markPrice === 'number' ? String(validated.markPrice) : validated.markPrice
      ),
      leverage: safeParseFloat(
        typeof validated.leverage === 'number' ? String(validated.leverage) : validated.leverage
      ),
      liquidationPrice: validated.liquidationPrice
        ? safeParseFloat(
            typeof validated.liquidationPrice === 'number'
              ? String(validated.liquidationPrice)
              : validated.liquidationPrice
          )
        : 0,
      unrealizedPnl: safeParseFloat(
        typeof validated.unrealizedPnl === 'number'
          ? String(validated.unrealizedPnl)
          : validated.unrealizedPnl
      ),
      realizedPnl: 0,
      margin: safeParseFloat(
        typeof validated.margin === 'number' ? String(validated.margin) : validated.margin
      ),
      maintenanceMargin: 0,
      marginRatio: 0,
      marginMode: 'cross',
      timestamp: validated.timestamp,
      info: {
        ...(validated as unknown as Record<string, unknown>),
        _realizedPnlSource: 'not_available',
        _marginRatioSource: 'not_available',
      },
    };
  }

  /**
   * Normalize balance data
   */
  normalizeBalance(balance: VariationalBalance): Balance {
    const validated = VariationalBalanceSchema.parse(balance);
    return {
      currency: validated.asset,
      free: safeParseFloat(validated.free),
      used: safeParseFloat(validated.locked),
      total: safeParseFloat(validated.total),
    };
  }

  /**
   * Normalize RFQ quote data (Variational-specific)
   * This is not part of the standard unified format, but useful for RFQ trading
   */
  normalizeQuote(quote: VariationalQuote): {
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    price: number;
    amount: number;
    expiresAt: number;
    marketMaker: string;
    spread?: number;
    timestamp: number;
  } {
    const validated = VariationalQuoteSchema.parse(quote);
    const unifiedSymbol = this.symbolToCCXT(validated.symbol);

    return {
      id: validated.quoteId,
      symbol: unifiedSymbol,
      side: validated.side as 'buy' | 'sell',
      price: safeParseFloat(
        typeof validated.price === 'number' ? String(validated.price) : validated.price
      ),
      amount: safeParseFloat(
        typeof validated.amount === 'number' ? String(validated.amount) : validated.amount
      ),
      expiresAt: validated.expiresAt,
      marketMaker: validated.marketMaker,
      spread: validated.spread
        ? safeParseFloat(
            typeof validated.spread === 'number' ? String(validated.spread) : validated.spread
          )
        : undefined,
      timestamp: validated.timestamp,
    };
  }

  /**
   * Batch normalize markets
   */
  normalizeMarkets(markets: VariationalMarket[]): Market[] {
    return markets.map((market) => this.normalizeMarket(market));
  }

  /**
   * Batch normalize orders
   */
  normalizeOrders(orders: VariationalOrder[]): Order[] {
    return orders.map((order) => this.normalizeOrder(order));
  }

  /**
   * Batch normalize positions
   */
  normalizePositions(positions: VariationalPosition[]): Position[] {
    return positions.map((position) => this.normalizePosition(position));
  }

  /**
   * Batch normalize balances
   */
  normalizeBalances(balances: VariationalBalance[]): Balance[] {
    return balances.map((balance) => this.normalizeBalance(balance));
  }

  /**
   * Batch normalize trades
   */
  normalizeTrades(trades: VariationalTrade[]): Trade[] {
    return trades.map((trade) => this.normalizeTrade(trade));
  }

  /**
   * Batch normalize markets from listings (metadata/stats response)
   */
  normalizeMarketsFromListings(listings: VariationalListing[]): Market[] {
    return listings.map((listing) => this.normalizeMarketFromListing(listing));
  }

  /**
   * Batch normalize tickers from listings (metadata/stats response)
   */
  normalizeTickersFromListings(listings: VariationalListing[]): Ticker[] {
    return listings.map((listing) => this.normalizeTickerFromListing(listing));
  }

  /**
   * Normalize funding rate from listing (from /metadata/stats)
   */
  normalizeFundingRateFromListing(listing: VariationalListing): FundingRate {
    const validated = VariationalListingSchema.parse(listing);
    const unifiedSymbol = `${validated.ticker}/USDC:USDC`;
    const markPrice = safeParseFloat(validated.mark_price);
    const fundingIntervalSeconds = validated.funding_interval_s;
    const fundingIntervalHours = fundingIntervalSeconds / 3600;

    // Calculate next funding time based on interval
    const now = Date.now();
    const intervalMs = fundingIntervalSeconds * 1000;
    const nextFundingTimestamp = Math.ceil(now / intervalMs) * intervalMs;

    return {
      symbol: unifiedSymbol,
      fundingRate: safeParseFloat(validated.funding_rate),
      fundingTimestamp: now,
      nextFundingTimestamp,
      markPrice,
      indexPrice: markPrice, // Variational uses mark price as index
      fundingIntervalHours,
      info: validated as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize order book from listing quotes (from /metadata/stats)
   *
   * Since Variational is an RFQ-based DEX, we construct an order book
   * from the quotes at different notional sizes.
   */
  normalizeOrderBookFromListing(listing: VariationalListing): OrderBook {
    const validated = VariationalListingSchema.parse(listing);
    const unifiedSymbol = `${validated.ticker}/USDC:USDC`;
    const quotes = validated.quotes;
    const markPrice = safeParseFloat(validated.mark_price);

    // Build order book from quotes at different sizes
    // Size represents notional value in USD
    const bids: [number, number][] = [];
    const asks: [number, number][] = [];

    // $1k notional size
    const bid1k = safeParseFloat(quotes.size_1k.bid);
    const ask1k = safeParseFloat(quotes.size_1k.ask);
    const size1k = 1000 / markPrice; // Convert notional to base amount
    if (bid1k > 0) bids.push([bid1k, size1k]);
    if (ask1k > 0) asks.push([ask1k, size1k]);

    // $100k notional size
    const bid100k = safeParseFloat(quotes.size_100k.bid);
    const ask100k = safeParseFloat(quotes.size_100k.ask);
    const size100k = 100000 / markPrice;
    if (bid100k > 0) bids.push([bid100k, size100k]);
    if (ask100k > 0) asks.push([ask100k, size100k]);

    // $1m notional size (only available for major assets)
    if (quotes.size_1m) {
      const bid1m = safeParseFloat(quotes.size_1m.bid);
      const ask1m = safeParseFloat(quotes.size_1m.ask);
      const size1m = 1000000 / markPrice;
      if (bid1m > 0) bids.push([bid1m, size1m]);
      if (ask1m > 0) asks.push([ask1m, size1m]);
    }

    // Sort bids descending by price, asks ascending by price
    bids.sort((a, b) => b[0] - a[0]);
    asks.sort((a, b) => a[0] - b[0]);

    return {
      exchange: 'variational',
      symbol: unifiedSymbol,
      bids,
      asks,
      timestamp: new Date(quotes.updated_at).getTime() || Date.now(),
    };
  }
}
