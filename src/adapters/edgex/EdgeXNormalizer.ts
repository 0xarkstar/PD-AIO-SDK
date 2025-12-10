/**
 * EdgeX Normalizer
 *
 * Transforms EdgeX-specific data structures to unified SDK format
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
  EdgeXMarket,
  EdgeXOrder,
  EdgeXPosition,
  EdgeXBalance,
  EdgeXOrderBook,
  EdgeXTrade,
  EdgeXTicker,
  EdgeXFundingRate,
} from './types.js';

export class EdgeXNormalizer {
  /**
   * Normalize EdgeX symbol to unified format
   *
   * @example
   * normalizeSymbol('BTC-USDC-PERP') // 'BTC/USDC:USDC'
   * normalizeSymbol('ETH-USDC-PERP') // 'ETH/USDC:USDC'
   */
  normalizeSymbol(edgexSymbol: string): string {
    // EdgeX format: BTC-USDC-PERP, ETH-USDC-PERP
    const parts = edgexSymbol.split('-');

    if (parts.length === 3 && parts[2] === 'PERP') {
      const base = parts[0];
      const quote = parts[1];
      return `${base}/${quote}:${quote}`;
    }

    // Fallback for spot markets
    return edgexSymbol.replace('-', '/');
  }

  /**
   * Convert unified symbol to EdgeX format
   *
   * @example
   * toEdgeXSymbol('BTC/USDC:USDC') // 'BTC-USDC-PERP'
   * toEdgeXSymbol('ETH/USDC:USDC') // 'ETH-USDC-PERP'
   */
  toEdgeXSymbol(symbol: string): string {
    const parts = symbol.split(':');

    if (parts.length === 2) {
      // Perpetual format
      const [pair = ''] = parts;
      const [base = '', quote = ''] = pair.split('/');
      return `${base}-${quote}-PERP`;
    }

    // Spot format
    return symbol.replace('/', '-');
  }

  /**
   * Normalize EdgeX market to unified format
   */
  normalizeMarket(edgexMarket: EdgeXMarket): Market {
    const symbol = this.normalizeSymbol(edgexMarket.symbol);

    return {
      id: edgexMarket.market_id,
      symbol,
      base: edgexMarket.base_asset,
      quote: edgexMarket.quote_asset,
      settle: edgexMarket.settlement_asset,
      active: edgexMarket.is_active,
      minAmount: parseFloat(edgexMarket.min_order_size),
      pricePrecision: this.countDecimals(edgexMarket.tick_size),
      amountPrecision: this.countDecimals(edgexMarket.step_size),
      priceTickSize: parseFloat(edgexMarket.tick_size),
      amountStepSize: parseFloat(edgexMarket.step_size),
      makerFee: parseFloat(edgexMarket.maker_fee),
      takerFee: parseFloat(edgexMarket.taker_fee),
      maxLeverage: parseFloat(edgexMarket.max_leverage),
      fundingIntervalHours: 8,
    };
  }

  /**
   * Normalize EdgeX order to unified format
   */
  normalizeOrder(edgexOrder: EdgeXOrder): Order {
    const symbol = this.normalizeSymbol(edgexOrder.market);

    return {
      id: edgexOrder.order_id,
      clientOrderId: edgexOrder.client_order_id,
      symbol,
      type: this.normalizeOrderType(edgexOrder.type),
      side: this.normalizeOrderSide(edgexOrder.side),
      amount: parseFloat(edgexOrder.size),
      price: edgexOrder.price ? parseFloat(edgexOrder.price) : undefined,
      filled: parseFloat(edgexOrder.filled_size),
      remaining: parseFloat(edgexOrder.size) - parseFloat(edgexOrder.filled_size),
      averagePrice: edgexOrder.average_price
        ? parseFloat(edgexOrder.average_price)
        : undefined,
      status: this.normalizeOrderStatus(edgexOrder.status),
      timeInForce: this.normalizeTimeInForce(edgexOrder.time_in_force),
      postOnly: edgexOrder.post_only,
      reduceOnly: edgexOrder.reduce_only,
      timestamp: edgexOrder.created_at,
      lastUpdateTimestamp: edgexOrder.updated_at,
      info: edgexOrder as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize EdgeX position to unified format
   */
  normalizePosition(edgexPosition: EdgeXPosition): Position {
    const symbol = this.normalizeSymbol(edgexPosition.market);
    const size = parseFloat(edgexPosition.size);
    const side = edgexPosition.side === 'LONG' ? 'long' : 'short';

    return {
      symbol,
      side,
      marginMode: 'cross',
      size: Math.abs(size),
      entryPrice: parseFloat(edgexPosition.entry_price),
      markPrice: parseFloat(edgexPosition.mark_price),
      liquidationPrice: edgexPosition.liquidation_price
        ? parseFloat(edgexPosition.liquidation_price)
        : 0,
      unrealizedPnl: parseFloat(edgexPosition.unrealized_pnl),
      realizedPnl: parseFloat(edgexPosition.realized_pnl),
      margin: parseFloat(edgexPosition.margin),
      leverage: parseFloat(edgexPosition.leverage),
      maintenanceMargin: parseFloat(edgexPosition.margin) * 0.04,
      marginRatio: 0,
      timestamp: edgexPosition.timestamp,
      info: edgexPosition as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize EdgeX balance to unified format
   */
  normalizeBalance(edgexBalance: EdgeXBalance): Balance {
    return {
      currency: edgexBalance.asset,
      total: parseFloat(edgexBalance.total),
      free: parseFloat(edgexBalance.available),
      used: parseFloat(edgexBalance.locked),
      info: edgexBalance as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize EdgeX order book to unified format
   */
  normalizeOrderBook(edgexOrderBook: EdgeXOrderBook): OrderBook {
    return {
      symbol: this.normalizeSymbol(edgexOrderBook.market),
      exchange: 'edgex',
      bids: edgexOrderBook.bids.map(([price, size]) => [
        parseFloat(price),
        parseFloat(size),
      ]),
      asks: edgexOrderBook.asks.map(([price, size]) => [
        parseFloat(price),
        parseFloat(size),
      ]),
      timestamp: edgexOrderBook.timestamp,
    };
  }

  /**
   * Normalize EdgeX trade to unified format
   */
  normalizeTrade(edgexTrade: EdgeXTrade): Trade {
    const price = parseFloat(edgexTrade.price);
    const amount = parseFloat(edgexTrade.size);

    return {
      id: edgexTrade.trade_id,
      symbol: this.normalizeSymbol(edgexTrade.market),
      side: this.normalizeOrderSide(edgexTrade.side),
      price,
      amount,
      cost: price * amount,
      timestamp: edgexTrade.timestamp,
      info: edgexTrade as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize EdgeX ticker to unified format
   */
  normalizeTicker(edgexTicker: EdgeXTicker): Ticker {
    const last = parseFloat(edgexTicker.last_price);
    const change = parseFloat(edgexTicker.price_change_24h);
    const percentage = parseFloat(edgexTicker.price_change_percent_24h);

    return {
      symbol: this.normalizeSymbol(edgexTicker.market),
      last,
      open: last - change,
      close: last,
      bid: parseFloat(edgexTicker.bid),
      ask: parseFloat(edgexTicker.ask),
      high: parseFloat(edgexTicker.high_24h),
      low: parseFloat(edgexTicker.low_24h),
      change,
      percentage,
      baseVolume: parseFloat(edgexTicker.volume_24h),
      quoteVolume: 0,
      timestamp: edgexTicker.timestamp,
      info: edgexTicker as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize EdgeX funding rate to unified format
   */
  normalizeFundingRate(edgexFunding: EdgeXFundingRate): FundingRate {
    return {
      symbol: this.normalizeSymbol(edgexFunding.market),
      fundingRate: parseFloat(edgexFunding.rate),
      fundingTimestamp: edgexFunding.timestamp,
      markPrice: parseFloat(edgexFunding.mark_price),
      indexPrice: parseFloat(edgexFunding.index_price),
      nextFundingTimestamp: edgexFunding.next_funding_time,
      fundingIntervalHours: 8,
      info: edgexFunding as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize EdgeX order type to unified format
   */
  private normalizeOrderType(edgexType: string): OrderType {
    switch (edgexType) {
      case 'MARKET':
        return 'market';
      case 'LIMIT':
        return 'limit';
      default:
        return 'limit';
    }
  }

  /**
   * Normalize EdgeX order side to unified format
   */
  private normalizeOrderSide(edgexSide: string): OrderSide {
    return edgexSide === 'BUY' ? 'buy' : 'sell';
  }

  /**
   * Normalize EdgeX order status to unified format
   */
  private normalizeOrderStatus(edgexStatus: string): OrderStatus {
    const statusMap: Record<string, OrderStatus> = {
      PENDING: 'open',
      OPEN: 'open',
      PARTIALLY_FILLED: 'partiallyFilled',
      FILLED: 'filled',
      CANCELLED: 'canceled',
      REJECTED: 'rejected',
    };

    return statusMap[edgexStatus] ?? 'open';
  }

  /**
   * Normalize EdgeX time in force to unified format
   */
  private normalizeTimeInForce(edgexTif: string): TimeInForce {
    switch (edgexTif) {
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
  private countDecimals(value: string): number {
    const parts = value.split('.');
    return parts.length === 2 && parts[1] ? parts[1].length : 0;
  }
}
