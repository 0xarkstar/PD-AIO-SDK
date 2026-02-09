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
   * Backpack uses underscore-separated format:
   * - New format: SOL_USDC_PERP, BTC_USDC_PERP (base_quote_perp)
   * - Legacy format: BTCUSDT_PERP, SOLUSDT_PERP (basequote_perp - for test compatibility)
   * - Spot: SOL_USDC, BTC_USDC
   *
   * @example
   * normalizeSymbol('SOL_USDC_PERP') // 'SOL/USDC:USDC'
   * normalizeSymbol('BTCUSDT_PERP') // 'BTC/USDT:USDT' (legacy)
   * normalizeSymbol('SOL_USDC') // 'SOL/USDC'
   */
  normalizeSymbol(backpackSymbol: string): string {
    // Perpetual format: BASE_QUOTE_PERP or BASEQUOTE_PERP
    if (backpackSymbol.endsWith('_PERP')) {
      const withoutPerp = backpackSymbol.replace('_PERP', '');
      const parts = withoutPerp.split('_');

      if (parts.length >= 2) {
        // New format: SOL_USDC_PERP -> SOL/USDC:USDC
        const base = parts[0];
        const quote = parts[1];
        return `${base}/${quote}:${quote}`;
      } else {
        // Legacy format: BTCUSDT_PERP -> BTC/USDT:USDT
        // Try to extract quote (USDT, USDC, USD)
        const pair = parts[0] || '';
        const quoteMatch = pair.match(/(USDT|USDC|USD)$/);
        if (quoteMatch && quoteMatch[1]) {
          const quote = quoteMatch[1];
          const base = pair.replace(quote, '');
          return `${base}/${quote}:${quote}`;
        }
      }
    }

    // Spot format: BASE_QUOTE or BASEQUOTE
    const parts = backpackSymbol.split('_');
    if (parts.length >= 2) {
      // New format: SOL_USDC -> SOL/USDC
      const base = parts[0];
      const quote = parts[1];
      return `${base}/${quote}`;
    } else {
      // Legacy format: BTCUSDT -> BTC/USDT
      const quoteMatch = backpackSymbol.match(/(USDT|USDC|USD)$/);
      if (quoteMatch && quoteMatch[1]) {
        const quote = quoteMatch[1];
        const base = backpackSymbol.replace(quote, '');
        return `${base}/${quote}`;
      }
    }

    // Fallback
    return backpackSymbol;
  }

  /**
   * Convert unified symbol to Backpack format
   *
   * @example
   * toBackpackSymbol('SOL/USDC:USDC') // 'SOL_USDC_PERP'
   * toBackpackSymbol('BTC/USDC:USDC') // 'BTC_USDC_PERP'
   * toBackpackSymbol('SOL/USDC') // 'SOL_USDC'
   */
  toBackpackSymbol(symbol: string): string {
    const parts = symbol.split(':');

    if (parts.length === 2) {
      // Perpetual format: BASE/QUOTE:SETTLE -> BASE_QUOTE_PERP
      const [pair = ''] = parts;
      const [base = '', quote = ''] = pair.split('/');
      return `${base}_${quote}_PERP`;
    }

    // Spot format: BASE/QUOTE -> BASE_QUOTE
    const [base = '', quote = ''] = symbol.split('/');
    if (base && quote) {
      return `${base}_${quote}`;
    }

    return symbol;
  }

  /**
   * Normalize Backpack market to unified format
   */
  normalizeMarket(backpackMarket: BackpackMarket): Market {
    const symbol = this.normalizeSymbol(backpackMarket.symbol);
    const isPerpetual =
      backpackMarket.marketType === 'PERP' || backpackMarket.symbol.endsWith('_PERP');

    // Handle potentially missing filter fields
    const priceFilters = backpackMarket.filters?.price ?? { tickSize: '0.01' };
    const quantityFilters = backpackMarket.filters?.quantity ?? {
      stepSize: '0.001',
      minQuantity: '0.001',
    };

    return {
      id: backpackMarket.symbol,
      symbol,
      base: backpackMarket.baseSymbol || symbol.split('/')[0] || '',
      quote: backpackMarket.quoteSymbol || symbol.split('/')[1]?.split(':')[0] || '',
      settle: backpackMarket.quoteSymbol || symbol.split('/')[1]?.split(':')[0] || '',
      active: backpackMarket.visible !== false && backpackMarket.orderBookState !== 'Closed',
      minAmount: parseFloat(quantityFilters.minQuantity || '0'),
      pricePrecision: this.countDecimals(priceFilters.tickSize || '0.01'),
      amountPrecision: this.countDecimals(quantityFilters.stepSize || '0.001'),
      priceTickSize: parseFloat(priceFilters.tickSize || '0.01'),
      amountStepSize: parseFloat(quantityFilters.stepSize || '0.001'),
      makerFee: 0, // Not provided in market endpoint
      takerFee: 0, // Not provided in market endpoint
      maxLeverage: isPerpetual ? 20 : 1, // Perpetuals support leverage
      fundingIntervalHours: backpackMarket.fundingInterval
        ? backpackMarket.fundingInterval / 3600000
        : 1,
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
      averagePrice: backpackOrder.avg_price ? parseFloat(backpackOrder.avg_price) : undefined,
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
  normalizeOrderBook(backpackOrderBook: BackpackOrderBook, symbol?: string): OrderBook {
    return {
      symbol: symbol || '',
      exchange: 'backpack',
      bids: backpackOrderBook.bids.map(([price, size]) => [parseFloat(price), parseFloat(size)]),
      asks: backpackOrderBook.asks.map(([price, size]) => [parseFloat(price), parseFloat(size)]),
      timestamp: Date.now(),
    };
  }

  /**
   * Normalize Backpack trade to unified format
   */
  normalizeTrade(backpackTrade: BackpackTrade, symbol?: string): Trade {
    const price = parseFloat(backpackTrade.price);
    const amount = parseFloat(backpackTrade.quantity);

    return {
      id: backpackTrade.id.toString(),
      symbol: symbol || '',
      // isBuyerMaker = true means the maker was a buyer, so the taker (aggressor) was selling
      side: backpackTrade.isBuyerMaker ? 'sell' : 'buy',
      price,
      amount,
      cost: parseFloat(backpackTrade.quoteQuantity),
      timestamp: backpackTrade.timestamp,
      info: backpackTrade as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize Backpack ticker to unified format
   */
  normalizeTicker(backpackTicker: BackpackTicker): Ticker {
    const last = parseFloat(backpackTicker.lastPrice);
    const first = parseFloat(backpackTicker.firstPrice);
    const change = parseFloat(backpackTicker.priceChange);
    const percentage = parseFloat(backpackTicker.priceChangePercent) * 100; // Convert to percentage

    return {
      symbol: this.normalizeSymbol(backpackTicker.symbol),
      last,
      open: first,
      close: last,
      bid: 0, // Not provided in ticker endpoint
      ask: 0, // Not provided in ticker endpoint
      high: parseFloat(backpackTicker.high),
      low: parseFloat(backpackTicker.low),
      change,
      percentage,
      baseVolume: parseFloat(backpackTicker.volume),
      quoteVolume: parseFloat(backpackTicker.quoteVolume),
      timestamp: Date.now(),
      info: backpackTicker as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize Backpack funding rate to unified format
   */
  normalizeFundingRate(backpackFunding: BackpackFundingRate): FundingRate {
    // Parse the ISO timestamp to milliseconds
    const fundingTimestamp = new Date(backpackFunding.intervalEndTimestamp).getTime();

    return {
      symbol: this.normalizeSymbol(backpackFunding.symbol),
      fundingRate: parseFloat(backpackFunding.fundingRate),
      fundingTimestamp,
      nextFundingTimestamp: fundingTimestamp + 3600000, // Hourly funding
      // Backpack funding rate endpoint doesn't include mark/index price
      markPrice: 0,
      indexPrice: 0,
      // Hourly funding
      fundingIntervalHours: 1,
      info: backpackFunding as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize Backpack order type to unified format
   * Backpack API returns PascalCase: 'Market', 'Limit', 'PostOnly'
   */
  private normalizeOrderType(backpackType: string): OrderType {
    switch (backpackType) {
      case 'Market':
      case 'MARKET':
        return 'market';
      case 'Limit':
      case 'LIMIT':
      case 'PostOnly':
      case 'POST_ONLY':
        return 'limit';
      default:
        return 'limit';
    }
  }

  /**
   * Normalize Backpack order side to unified format
   * Backpack API returns 'Bid' (buy) / 'Ask' (sell)
   */
  private normalizeOrderSide(backpackSide: string): OrderSide {
    return backpackSide === 'Bid' || backpackSide === 'BUY' ? 'buy' : 'sell';
  }

  /**
   * Normalize Backpack order status to unified format
   * Backpack API returns PascalCase: 'New', 'Open', 'PartiallyFilled', 'Filled', 'Cancelled'
   */
  private normalizeOrderStatus(backpackStatus: string): OrderStatus {
    const statusMap: Record<string, OrderStatus> = {
      // PascalCase (actual API format)
      New: 'open',
      Open: 'open',
      PartiallyFilled: 'partiallyFilled',
      Filled: 'filled',
      Cancelled: 'canceled',
      Rejected: 'rejected',
      // UPPER_CASE (legacy/backward compat)
      PENDING: 'open',
      NEW: 'open',
      OPEN: 'open',
      PARTIAL: 'partiallyFilled',
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
