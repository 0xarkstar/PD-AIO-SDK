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
  VariationalMetadataStats,
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
    const [pair, settle] = ccxtSymbol.split(':');
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
    // Variational uses ticker symbols like "BTC", "ETH", convert to unified format
    const unifiedSymbol = `${listing.ticker}/USDC:USDC`;

    return {
      id: listing.ticker,
      symbol: unifiedSymbol,
      base: listing.ticker,
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
      fundingIntervalHours: listing.funding_interval_s / 3600,
      info: listing as any,
    };
  }

  /**
   * Normalize market data
   */
  normalizeMarket(market: VariationalMarket): Market {
    const unifiedSymbol = this.symbolToCCXT(market.symbol);

    return {
      id: market.symbol,
      symbol: unifiedSymbol,
      base: market.baseAsset,
      quote: market.quoteAsset,
      settle: market.quoteAsset,
      contractSize: safeParseFloat(market.contractSize || '1'),
      active: market.status === 'active',
      minAmount: safeParseFloat(market.minOrderSize),
      maxAmount: market.maxOrderSize ? safeParseFloat(market.maxOrderSize) : undefined,
      pricePrecision: countDecimals(market.tickSize),
      amountPrecision: countDecimals(market.minOrderSize),
      priceTickSize: safeParseFloat(market.tickSize),
      amountStepSize: safeParseFloat(market.minOrderSize),
      makerFee: 0.0002,
      takerFee: 0.0005,
      maxLeverage: market.maxLeverage ? safeParseFloat(market.maxLeverage) : 50,
      fundingIntervalHours: 8,
      info: market as any,
    };
  }

  /**
   * Normalize ticker data from listing (from /metadata/stats)
   */
  normalizeTickerFromListing(listing: VariationalListing): Ticker {
    const unifiedSymbol = `${listing.ticker}/USDC:USDC`;
    const timestamp = Date.now(); // Real timestamp would come from listing.quotes.updated_at
    const markPrice = safeParseFloat(listing.mark_price);

    return {
      symbol: unifiedSymbol,
      timestamp,
      high: markPrice, // Not available from /metadata/stats
      low: markPrice, // Not available from /metadata/stats
      bid: safeParseFloat(listing.quotes.size_100k.bid),
      ask: safeParseFloat(listing.quotes.size_100k.ask),
      last: markPrice,
      open: markPrice, // Not available from /metadata/stats
      close: markPrice,
      baseVolume: safeParseFloat(listing.volume_24h),
      quoteVolume: safeParseFloat(listing.volume_24h),
      change: 0, // Not available from /metadata/stats
      percentage: 0, // Not available from /metadata/stats
      info: listing as any,
    };
  }

  /**
   * Normalize ticker data
   */
  normalizeTicker(ticker: VariationalTicker): Ticker {
    const unifiedSymbol = this.symbolToCCXT(ticker.symbol);

    return {
      symbol: unifiedSymbol,
      timestamp: ticker.timestamp,
      high: safeParseFloat(ticker.high24h),
      low: safeParseFloat(ticker.low24h),
      bid: safeParseFloat(ticker.bidPrice),
      ask: safeParseFloat(ticker.askPrice),
      last: safeParseFloat(ticker.lastPrice),
      open: safeParseFloat(ticker.lastPrice),
      close: safeParseFloat(ticker.lastPrice),
      baseVolume: safeParseFloat(ticker.volume24h),
      quoteVolume: 0,
      change: safeParseFloat(ticker.priceChange24h),
      percentage: safeParseFloat(ticker.priceChangePercent24h),
      info: ticker as any,
    };
  }

  /**
   * Normalize order book data
   */
  normalizeOrderBook(orderbook: VariationalOrderBook): OrderBook {
    const unifiedSymbol = this.symbolToCCXT(orderbook.symbol);

    return {
      exchange: 'variational',
      symbol: unifiedSymbol,
      bids: orderbook.bids.map(([price, amount]) => [
        safeParseFloat(price),
        safeParseFloat(amount),
      ]),
      asks: orderbook.asks.map(([price, amount]) => [
        safeParseFloat(price),
        safeParseFloat(amount),
      ]),
      timestamp: orderbook.timestamp,
    };
  }

  /**
   * Normalize trade data
   */
  normalizeTrade(trade: VariationalTrade): Trade {
    const unifiedSymbol = this.symbolToCCXT(trade.symbol);

    return {
      id: trade.id,
      orderId: undefined,
      symbol: unifiedSymbol,
      side: trade.side,
      price: safeParseFloat(trade.price),
      amount: safeParseFloat(trade.amount),
      cost: safeParseFloat(trade.price) * safeParseFloat(trade.amount),
      timestamp: trade.timestamp,
      info: trade as any,
    };
  }

  /**
   * Normalize funding rate data
   */
  normalizeFundingRate(fundingRate: VariationalFundingRate): FundingRate {
    const unifiedSymbol = this.symbolToCCXT(fundingRate.symbol);

    return {
      symbol: unifiedSymbol,
      fundingRate: safeParseFloat(fundingRate.fundingRate),
      fundingTimestamp: fundingRate.fundingTime,
      nextFundingTimestamp: fundingRate.nextFundingTime || 0,
      markPrice: fundingRate.markPrice ? safeParseFloat(fundingRate.markPrice) : 0,
      indexPrice: fundingRate.indexPrice ? safeParseFloat(fundingRate.indexPrice) : 0,
      fundingIntervalHours: 8,
      info: fundingRate as any,
    };
  }

  /**
   * Normalize order data
   */
  normalizeOrder(order: VariationalOrder): Order {
    const unifiedSymbol = this.symbolToCCXT(order.symbol);
    const filled = safeParseFloat(order.filledAmount || '0');
    const amount = safeParseFloat(order.amount);
    const remaining = safeParseFloat(order.remainingAmount || String(amount - filled));

    return {
      id: order.orderId,
      clientOrderId: order.clientOrderId,
      symbol: unifiedSymbol,
      type: order.type === 'rfq' ? 'market' : order.type,
      side: order.side,
      price: order.price ? safeParseFloat(order.price) : undefined,
      amount: amount,
      filled: filled,
      remaining: remaining,
      reduceOnly: false,
      postOnly: false,
      status: this.normalizeOrderStatus(order.status),
      timestamp: order.timestamp,
      lastUpdateTimestamp: order.updateTime,
      info: order as any,
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
    const unifiedSymbol = this.symbolToCCXT(position.symbol);
    const size = safeParseFloat(position.size);
    const entryPrice = safeParseFloat(position.entryPrice);

    return {
      symbol: unifiedSymbol,
      side: position.side,
      size: size,
      entryPrice: entryPrice,
      markPrice: safeParseFloat(position.markPrice),
      leverage: safeParseFloat(position.leverage),
      liquidationPrice: position.liquidationPrice
        ? safeParseFloat(position.liquidationPrice)
        : 0,
      unrealizedPnl: safeParseFloat(position.unrealizedPnl),
      realizedPnl: 0,
      margin: safeParseFloat(position.margin),
      maintenanceMargin: 0,
      marginRatio: 0,
      marginMode: 'cross',
      timestamp: position.timestamp,
      info: position as any,
    };
  }

  /**
   * Normalize balance data
   */
  normalizeBalance(balance: VariationalBalance): Balance {
    return {
      currency: balance.asset,
      free: safeParseFloat(balance.free),
      used: safeParseFloat(balance.locked),
      total: safeParseFloat(balance.total),
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
    const unifiedSymbol = this.symbolToCCXT(quote.symbol);

    return {
      id: quote.quoteId,
      symbol: unifiedSymbol,
      side: quote.side,
      price: safeParseFloat(quote.price),
      amount: safeParseFloat(quote.amount),
      expiresAt: quote.expiresAt,
      marketMaker: quote.marketMaker,
      spread: quote.spread ? safeParseFloat(quote.spread) : undefined,
      timestamp: quote.timestamp,
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
}
