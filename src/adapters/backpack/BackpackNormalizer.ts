/**
 * Backpack Normalizer
 *
 * Transforms Backpack-specific data structures to unified SDK format
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
  OrderSide,
  OrderType,
  OrderStatus,
  TimeInForce,
} from '../../types/common.js';
import type {
  BackpackMarket,
  BackpackOrder,
  BackpackPosition,
  BackpackBalance,
  BackpackOrderBook,
  BackpackTrade,
  BackpackTicker,
  BackpackFundingRate,
} from './types.js';

export class BackpackNormalizer {
  /**
   * Normalize Backpack symbol to unified format
   *
   * @example
   * normalizeSymbol('BTCUSDT_PERP') // 'BTC/USDT:USDT'
   * normalizeSymbol('ETHUSDT_PERP') // 'ETH/USDT:USDT'
   */
  normalizeSymbol(backpackSymbol: string): string {
    // Backpack format: BTCUSDT_PERP, ETHUSDT_PERP
    if (backpackSymbol.endsWith('_PERP')) {
      const pair = backpackSymbol.replace('_PERP', '');
      // Extract base and quote - usually quote is USDT
      const quote = 'USDT';
      const base = pair.replace(quote, '');
      return `${base}/${quote}:${quote}`;
    }

    // Fallback for spot markets
    return backpackSymbol;
  }

  /**
   * Convert unified symbol to Backpack format
   *
   * @example
   * toBackpackSymbol('BTC/USDT:USDT') // 'BTCUSDT_PERP'
   * toBackpackSymbol('ETH/USDT:USDT') // 'ETHUSDT_PERP'
   */
  toBackpackSymbol(symbol: string): string {
    const parts = symbol.split(':');

    if (parts.length === 2) {
      // Perpetual format
      const [pair = ''] = parts;
      const [base = '', quote = ''] = pair.split('/');
      return `${base}${quote}_PERP`;
    }

    // Spot format
    return symbol;
  }

  /**
   * Normalize Backpack market to unified format
   */
  normalizeMarket(backpackMarket: BackpackMarket): Market {
    const symbol = this.normalizeSymbol(backpackMarket.symbol);

    return {
      id: backpackMarket.symbol,
      symbol,
      base: backpackMarket.base_currency,
      quote: backpackMarket.quote_currency,
      settle: backpackMarket.settlement_currency,
      active: backpackMarket.is_active,
      minAmount: parseFloat(backpackMarket.min_order_size),
      pricePrecision: this.countDecimals(backpackMarket.tick_size),
      amountPrecision: this.countDecimals(backpackMarket.step_size),
      priceTickSize: parseFloat(backpackMarket.tick_size),
      amountStepSize: parseFloat(backpackMarket.step_size),
      makerFee: parseFloat(backpackMarket.maker_fee),
      takerFee: parseFloat(backpackMarket.taker_fee),
      maxLeverage: parseFloat(backpackMarket.max_leverage),
      fundingIntervalHours: 8,
    };
  }

  /**
   * Normalize Backpack order to unified format
   */
  normalizeOrder(backpackOrder: BackpackOrder): Order {
    const symbol = this.normalizeSymbol(backpackOrder.market);

    return {
      id: backpackOrder.order_id,
      clientOrderId: backpackOrder.client_order_id,
      symbol,
      type: this.normalizeOrderType(backpackOrder.type),
      side: this.normalizeOrderSide(backpackOrder.side),
      amount: parseFloat(backpackOrder.size),
      price: backpackOrder.price ? parseFloat(backpackOrder.price) : undefined,
      filled: parseFloat(backpackOrder.filled_size),
      remaining: parseFloat(backpackOrder.size) - parseFloat(backpackOrder.filled_size),
      averagePrice: backpackOrder.avg_price
        ? parseFloat(backpackOrder.avg_price)
        : undefined,
      status: this.normalizeOrderStatus(backpackOrder.status),
      timeInForce: this.normalizeTimeInForce(backpackOrder.time_in_force),
      postOnly: backpackOrder.post_only,
      reduceOnly: backpackOrder.reduce_only,
      timestamp: backpackOrder.created_at,
      lastUpdateTimestamp: backpackOrder.updated_at,
      info: backpackOrder as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize Backpack position to unified format
   */
  normalizePosition(backpackPosition: BackpackPosition): Position {
    const symbol = this.normalizeSymbol(backpackPosition.market);
    const size = parseFloat(backpackPosition.size);
    const side = backpackPosition.side === 'LONG' ? 'long' : 'short';

    return {
      symbol,
      side,
      marginMode: 'cross',
      size: Math.abs(size),
      entryPrice: parseFloat(backpackPosition.entry_price),
      markPrice: parseFloat(backpackPosition.mark_price),
      liquidationPrice: backpackPosition.liquidation_price
        ? parseFloat(backpackPosition.liquidation_price)
        : 0,
      unrealizedPnl: parseFloat(backpackPosition.unrealized_pnl),
      realizedPnl: parseFloat(backpackPosition.realized_pnl),
      margin: parseFloat(backpackPosition.margin),
      leverage: parseFloat(backpackPosition.leverage),
      maintenanceMargin: parseFloat(backpackPosition.margin) * 0.05,
      marginRatio: 0,
      timestamp: backpackPosition.timestamp,
      info: backpackPosition as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize Backpack balance to unified format
   */
  normalizeBalance(backpackBalance: BackpackBalance): Balance {
    return {
      currency: backpackBalance.asset,
      total: parseFloat(backpackBalance.total),
      free: parseFloat(backpackBalance.available),
      used: parseFloat(backpackBalance.locked),
      info: backpackBalance as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize Backpack order book to unified format
   */
  normalizeOrderBook(backpackOrderBook: BackpackOrderBook): OrderBook {
    return {
      symbol: this.normalizeSymbol(backpackOrderBook.market),
      exchange: 'backpack',
      bids: backpackOrderBook.bids.map(([price, size]) => [
        parseFloat(price),
        parseFloat(size),
      ]),
      asks: backpackOrderBook.asks.map(([price, size]) => [
        parseFloat(price),
        parseFloat(size),
      ]),
      timestamp: backpackOrderBook.timestamp,
    };
  }

  /**
   * Normalize Backpack trade to unified format
   */
  normalizeTrade(backpackTrade: BackpackTrade): Trade {
    const price = parseFloat(backpackTrade.price);
    const amount = parseFloat(backpackTrade.size);

    return {
      id: backpackTrade.id,
      symbol: this.normalizeSymbol(backpackTrade.market),
      side: this.normalizeOrderSide(backpackTrade.side),
      price,
      amount,
      cost: price * amount,
      timestamp: backpackTrade.timestamp,
      info: backpackTrade as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize Backpack ticker to unified format
   */
  normalizeTicker(backpackTicker: BackpackTicker): Ticker {
    const last = parseFloat(backpackTicker.last_price);
    const change = parseFloat(backpackTicker.price_change_24h);
    const percentage = parseFloat(backpackTicker.price_change_percent_24h);

    return {
      symbol: this.normalizeSymbol(backpackTicker.market),
      last,
      open: last - change,
      close: last,
      bid: parseFloat(backpackTicker.bid),
      ask: parseFloat(backpackTicker.ask),
      high: parseFloat(backpackTicker.high_24h),
      low: parseFloat(backpackTicker.low_24h),
      change,
      percentage,
      baseVolume: parseFloat(backpackTicker.volume_24h),
      quoteVolume: 0,
      timestamp: backpackTicker.timestamp,
      info: backpackTicker as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize Backpack funding rate to unified format
   */
  normalizeFundingRate(backpackFunding: BackpackFundingRate): FundingRate {
    return {
      symbol: this.normalizeSymbol(backpackFunding.market),
      fundingRate: parseFloat(backpackFunding.rate),
      fundingTimestamp: backpackFunding.timestamp,
      markPrice: parseFloat(backpackFunding.mark_price),
      indexPrice: parseFloat(backpackFunding.index_price),
      nextFundingTimestamp: backpackFunding.next_funding_time,
      fundingIntervalHours: 8,
      info: backpackFunding as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize Backpack order type to unified format
   */
  private normalizeOrderType(backpackType: string): OrderType {
    switch (backpackType) {
      case 'MARKET':
        return 'market';
      case 'LIMIT':
        return 'limit';
      default:
        return 'limit';
    }
  }

  /**
   * Normalize Backpack order side to unified format
   */
  private normalizeOrderSide(backpackSide: string): OrderSide {
    return backpackSide === 'BUY' ? 'buy' : 'sell';
  }

  /**
   * Normalize Backpack order status to unified format
   */
  private normalizeOrderStatus(backpackStatus: string): OrderStatus {
    const statusMap: Record<string, OrderStatus> = {
      PENDING: 'open',
      OPEN: 'open',
      PARTIALLY_FILLED: 'partiallyFilled',
      FILLED: 'filled',
      CANCELLED: 'canceled',
      REJECTED: 'rejected',
    };

    return statusMap[backpackStatus] ?? 'open';
  }

  /**
   * Normalize Backpack time in force to unified format
   */
  private normalizeTimeInForce(backpackTif: string): TimeInForce {
    switch (backpackTif) {
      case 'GTC':
        return 'GTC';
      case 'IOC':
        return 'IOC';
      case 'FOK':
        return 'FOK';
      default:
        return 'GTC';
    }
  }

  /**
   * Count decimal places in a string number
   */
  private countDecimals(value: string | undefined): number {
    if (!value) return 0;
    const parts = value.split('.');
    return parts.length === 2 && parts[1] ? parts[1].length : 0;
  }
}
