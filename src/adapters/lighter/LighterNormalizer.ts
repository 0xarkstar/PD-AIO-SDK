/**
 * Lighter Normalizer
 *
 * Transforms Lighter-specific data structures to unified SDK format
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
  LighterMarket,
  LighterOrder,
  LighterPosition,
  LighterBalance,
  LighterOrderBook,
  LighterTrade,
  LighterTicker,
  LighterFundingRate,
} from './types.js';

export class LighterNormalizer {
  /**
   * Convert unified symbol to Lighter format
   * BTC/USDT:USDT -> BTC-USDT-PERP
   */
  toLighterSymbol(symbol: string): string {
    const [baseQuote] = symbol.split(':');
    const [base, quote] = (baseQuote || '').split('/');
    return `${base}-${quote}-PERP`;
  }

  /**
   * Convert Lighter symbol to unified format
   * BTC-USDT-PERP -> BTC/USDT:USDT
   */
  normalizeSymbol(lighterSymbol: string): string {
    const parts = lighterSymbol.split('-');
    if (parts.length >= 2) {
      const base = parts[0];
      const quote = parts[1];
      return `${base}/${quote}:${quote}`;
    }
    return lighterSymbol;
  }

  /**
   * Normalize Lighter market to unified format
   */
  normalizeMarket(lighterMarket: LighterMarket): Market {
    const symbol = this.normalizeSymbol(lighterMarket.symbol);
    const [baseQuote, settle] = symbol.split(':');
    const [base, quote] = (baseQuote || '').split('/');

    // Calculate precision from tick/step sizes
    const pricePrecision = Math.abs(Math.log10(lighterMarket.tickSize));
    const amountPrecision = Math.abs(Math.log10(lighterMarket.stepSize));

    return {
      id: lighterMarket.symbol,
      symbol,
      base: base || '',
      quote: quote || '',
      settle: settle || '',
      active: lighterMarket.active,
      minAmount: lighterMarket.minOrderSize,
      maxAmount: lighterMarket.maxOrderSize,
      pricePrecision,
      amountPrecision,
      priceTickSize: lighterMarket.tickSize,
      amountStepSize: lighterMarket.stepSize,
      makerFee: lighterMarket.makerFee,
      takerFee: lighterMarket.takerFee,
      maxLeverage: lighterMarket.maxLeverage,
      fundingIntervalHours: 8,
      info: lighterMarket as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize Lighter order to unified format
   */
  normalizeOrder(lighterOrder: LighterOrder): Order {
    return {
      id: lighterOrder.orderId,
      clientOrderId: lighterOrder.clientOrderId,
      symbol: this.normalizeSymbol(lighterOrder.symbol),
      type: lighterOrder.type,
      side: lighterOrder.side,
      price: lighterOrder.price,
      amount: lighterOrder.size,
      filled: lighterOrder.filledSize,
      remaining: lighterOrder.size - lighterOrder.filledSize,
      status: this.mapOrderStatus(lighterOrder.status),
      timestamp: lighterOrder.timestamp,
      reduceOnly: lighterOrder.reduceOnly,
      postOnly: false,
      info: lighterOrder as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize Lighter position to unified format
   */
  normalizePosition(lighterPosition: LighterPosition): Position {
    return {
      symbol: this.normalizeSymbol(lighterPosition.symbol),
      side: lighterPosition.side,
      size: lighterPosition.size,
      entryPrice: lighterPosition.entryPrice,
      markPrice: lighterPosition.markPrice,
      liquidationPrice: lighterPosition.liquidationPrice,
      unrealizedPnl: lighterPosition.unrealizedPnl,
      realizedPnl: 0, // Not provided by Lighter
      margin: lighterPosition.margin,
      leverage: lighterPosition.leverage,
      marginMode: 'cross', // Not provided by Lighter, default to cross
      maintenanceMargin: lighterPosition.margin * 0.5, // Estimate as 50% of margin
      marginRatio: lighterPosition.unrealizedPnl / lighterPosition.margin, // Calculate from available data
      timestamp: Date.now(),
      info: lighterPosition as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize Lighter balance to unified format
   */
  normalizeBalance(lighterBalance: LighterBalance): Balance {
    return {
      currency: lighterBalance.currency,
      total: lighterBalance.total,
      free: lighterBalance.available,
      used: lighterBalance.reserved,
      info: lighterBalance as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize Lighter order book to unified format
   */
  normalizeOrderBook(lighterOrderBook: LighterOrderBook): OrderBook {
    return {
      symbol: this.normalizeSymbol(lighterOrderBook.symbol),
      exchange: 'lighter',
      bids: lighterOrderBook.bids,
      asks: lighterOrderBook.asks,
      timestamp: lighterOrderBook.timestamp,
    };
  }

  /**
   * Normalize Lighter trade to unified format
   */
  normalizeTrade(lighterTrade: LighterTrade): Trade {
    return {
      id: lighterTrade.id,
      symbol: this.normalizeSymbol(lighterTrade.symbol),
      side: lighterTrade.side,
      price: lighterTrade.price,
      amount: lighterTrade.amount,
      cost: lighterTrade.price * lighterTrade.amount,
      timestamp: lighterTrade.timestamp,
      info: lighterTrade as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize Lighter ticker to unified format
   */
  normalizeTicker(lighterTicker: LighterTicker): Ticker {
    return {
      symbol: this.normalizeSymbol(lighterTicker.symbol),
      last: lighterTicker.last,
      bid: lighterTicker.bid,
      ask: lighterTicker.ask,
      high: lighterTicker.high,
      low: lighterTicker.low,
      open: lighterTicker.low, // Not provided by Lighter, use low as fallback
      close: lighterTicker.last,
      change: 0, // Not provided by Lighter
      percentage: 0, // Not provided by Lighter
      baseVolume: lighterTicker.volume,
      quoteVolume: lighterTicker.volume * lighterTicker.last, // Estimate from base volume
      timestamp: lighterTicker.timestamp,
      info: lighterTicker as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize Lighter funding rate to unified format
   */
  normalizeFundingRate(lighterFundingRate: LighterFundingRate): FundingRate {
    return {
      symbol: this.normalizeSymbol(lighterFundingRate.symbol),
      fundingRate: lighterFundingRate.fundingRate,
      fundingTimestamp: lighterFundingRate.nextFundingTime,
      nextFundingTimestamp: lighterFundingRate.nextFundingTime,
      markPrice: lighterFundingRate.markPrice,
      indexPrice: lighterFundingRate.markPrice, // Not provided by Lighter, use mark price as fallback
      fundingIntervalHours: 8,
      info: lighterFundingRate as unknown as Record<string, unknown>,
    };
  }

  /**
   * Map Lighter order status to unified status
   */
  private mapOrderStatus(
    status: 'open' | 'filled' | 'cancelled' | 'partially_filled'
  ): 'open' | 'closed' | 'canceled' {
    switch (status) {
      case 'open':
      case 'partially_filled':
        return 'open';
      case 'filled':
        return 'closed';
      case 'cancelled':
        return 'canceled';
      default:
        return 'open';
    }
  }
}
