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
import {
  BackpackMarketSchema,
  BackpackOrderSchema,
  BackpackPositionSchema,
  BackpackBalanceSchema,
  BackpackOrderBookSchema,
  BackpackTradeSchema,
  BackpackTickerSchema,
  BackpackFundingRateSchema,
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
    const validated = BackpackMarketSchema.parse(backpackMarket);
    const symbol = this.normalizeSymbol(validated.symbol);
    const isPerpetual = validated.marketType === 'PERP' || validated.symbol.endsWith('_PERP');

    // Extract base/quote from validated fields or parse raw exchange symbol
    let base = validated.baseSymbol || '';
    let quote = validated.quoteSymbol || '';

    // Fallback: parse raw exchange symbol (BTC_USDC_PERP → base=BTC, quote=USDC)
    if (!base || !quote) {
      const rawSymbol = validated.symbol.replace('_PERP', '');
      const parts = rawSymbol.split('_');

      if (parts.length >= 2) {
        // New format: BTC_USDC(_PERP) → base=BTC, quote=USDC
        base = base || parts[0] || '';
        quote = quote || parts[1] || '';
      } else if (parts.length === 1) {
        // Legacy format: BTCUSDT → try to extract quote
        const pair = parts[0] || '';
        const quoteMatch = pair.match(/(USDT|USDC|USD)$/);
        if (quoteMatch && quoteMatch[1]) {
          const extractedQuote = quoteMatch[1];
          const extractedBase = pair.replace(extractedQuote, '');
          base = base || extractedBase;
          quote = quote || extractedQuote;
        }
      }
    }

    // Handle potentially missing filter fields
    const priceFilters = validated.filters?.price ?? { tickSize: '0.01' };
    const quantityFilters = validated.filters?.quantity ?? {
      stepSize: '0.001',
      minQuantity: '0.001',
    };

    return {
      id: validated.symbol,
      symbol,
      base,
      quote,
      settle: quote,
      active: validated.visible !== false && validated.orderBookState !== 'Closed',
      minAmount: parseFloat(quantityFilters.minQuantity || '0'),
      pricePrecision: this.countDecimals(priceFilters.tickSize || '0.01'),
      amountPrecision: this.countDecimals(quantityFilters.stepSize || '0.001'),
      priceTickSize: parseFloat(priceFilters.tickSize || '0.01'),
      amountStepSize: parseFloat(quantityFilters.stepSize || '0.001'),
      makerFee: 0, // Not provided in market endpoint
      takerFee: 0, // Not provided in market endpoint
      maxLeverage: isPerpetual ? 20 : 1, // Perpetuals support leverage
      fundingIntervalHours: validated.fundingInterval ? validated.fundingInterval / 3600000 : 1,
    };
  }

  /**
   * Normalize Backpack order to unified format
   */
  normalizeOrder(backpackOrder: BackpackOrder): Order {
    const validated = BackpackOrderSchema.parse(backpackOrder);
    const symbol = this.normalizeSymbol(validated.market);

    return {
      id: validated.order_id,
      clientOrderId: validated.client_order_id,
      symbol,
      type: this.normalizeOrderType(validated.type),
      side: this.normalizeOrderSide(validated.side),
      amount: parseFloat(validated.size),
      price: validated.price ? parseFloat(validated.price) : undefined,
      filled: parseFloat(validated.filled_size),
      remaining: parseFloat(validated.size) - parseFloat(validated.filled_size),
      averagePrice: validated.avg_price ? parseFloat(validated.avg_price) : undefined,
      status: this.normalizeOrderStatus(validated.status),
      timeInForce: validated.time_in_force
        ? this.normalizeTimeInForce(validated.time_in_force)
        : undefined,
      postOnly: validated.post_only ?? false,
      reduceOnly: validated.reduce_only ?? false,
      timestamp: validated.created_at ?? Date.now(),
      lastUpdateTimestamp: validated.updated_at,
      info: validated as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize Backpack position to unified format
   */
  normalizePosition(backpackPosition: BackpackPosition): Position {
    const validated = BackpackPositionSchema.parse(backpackPosition);
    const symbol = this.normalizeSymbol(validated.market);
    const size = Math.abs(parseFloat(validated.size ?? '0'));
    const markPrice = parseFloat(validated.mark_price ?? '0');
    const margin = validated.margin ? parseFloat(validated.margin) : 0;
    const maintenanceMargin = margin * 0.05;
    const side = validated.side === 'LONG' ? 'long' : 'short';
    const notional = size * markPrice;

    return {
      symbol,
      side,
      marginMode: 'cross',
      size,
      entryPrice: parseFloat(validated.entry_price ?? '0'),
      markPrice,
      liquidationPrice: validated.liquidation_price ? parseFloat(validated.liquidation_price) : 0,
      unrealizedPnl: parseFloat(validated.unrealized_pnl ?? '0'),
      realizedPnl: validated.realized_pnl ? parseFloat(validated.realized_pnl) : 0,
      margin,
      leverage: validated.leverage ? parseFloat(validated.leverage) : 1,
      maintenanceMargin,
      marginRatio: notional > 0 ? maintenanceMargin / notional : 0,
      timestamp: validated.timestamp ?? Date.now(),
      info: validated as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize Backpack balance to unified format
   */
  normalizeBalance(backpackBalance: BackpackBalance): Balance {
    const validated = BackpackBalanceSchema.parse(backpackBalance);
    return {
      currency: validated.asset,
      total: parseFloat(validated.total),
      free: parseFloat(validated.available),
      used: parseFloat(validated.locked),
      info: validated as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize Backpack order book to unified format
   */
  normalizeOrderBook(backpackOrderBook: BackpackOrderBook, symbol?: string): OrderBook {
    const validated = BackpackOrderBookSchema.parse(backpackOrderBook);
    return {
      symbol: symbol || '',
      exchange: 'backpack',
      bids: validated.bids.map(([price, size]) => [parseFloat(price), parseFloat(size)]),
      asks: validated.asks.map(([price, size]) => [parseFloat(price), parseFloat(size)]),
      timestamp: Date.now(),
    };
  }

  /**
   * Normalize Backpack trade to unified format
   */
  normalizeTrade(backpackTrade: BackpackTrade, symbol?: string): Trade {
    const validated = BackpackTradeSchema.parse(backpackTrade);
    const price = parseFloat(validated.price);
    const amount = parseFloat(validated.quantity);

    return {
      id: validated.id.toString(),
      symbol: symbol || '',
      // isBuyerMaker = true means the maker was a buyer, so the taker (aggressor) was selling
      side: validated.isBuyerMaker ? 'sell' : 'buy',
      price,
      amount,
      cost: validated.quoteQuantity ? parseFloat(validated.quoteQuantity) : price * amount,
      timestamp: validated.timestamp ?? Date.now(),
      info: validated as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize Backpack ticker to unified format
   */
  normalizeTicker(backpackTicker: BackpackTicker): Ticker {
    const validated = BackpackTickerSchema.parse(backpackTicker);
    const last = parseFloat(validated.lastPrice || '0');
    const first = parseFloat(validated.firstPrice || '0');
    const change = parseFloat(validated.priceChange || '0');
    const percentage = parseFloat(validated.priceChangePercent || '0') * 100; // Convert to percentage

    // Backpack ticker doesn't provide bid/ask; use last price as fallback
    // Ensure bid/ask are valid numbers (not NaN or 0 when last has a valid value)
    const bidAsk = !isNaN(last) && last > 0 ? last : 0;

    return {
      symbol: this.normalizeSymbol(validated.symbol),
      last: !isNaN(last) ? last : 0,
      open: !isNaN(first) ? first : 0,
      close: !isNaN(last) ? last : 0,
      bid: bidAsk,
      ask: bidAsk,
      high: parseFloat(validated.high || '0'),
      low: parseFloat(validated.low || '0'),
      change: !isNaN(change) ? change : 0,
      percentage: !isNaN(percentage) ? percentage : 0,
      baseVolume: parseFloat(validated.volume || '0'),
      quoteVolume: parseFloat(validated.quoteVolume || '0'),
      timestamp: Date.now(),
      info: {
        ...(validated as unknown as Record<string, unknown>),
        _bidAskSource: 'last_price',
      },
    };
  }

  /**
   * Normalize Backpack funding rate to unified format
   */
  normalizeFundingRate(backpackFunding: BackpackFundingRate): FundingRate {
    const validated = BackpackFundingRateSchema.parse(backpackFunding);
    // Parse the ISO timestamp to milliseconds, with fallback to current time
    const fundingTimestamp = validated.intervalEndTimestamp
      ? new Date(validated.intervalEndTimestamp).getTime()
      : Date.now();

    // Ensure fundingRate is a valid number
    const fundingRate = parseFloat(validated.fundingRate || '0');

    return {
      symbol: this.normalizeSymbol(validated.symbol),
      fundingRate: !isNaN(fundingRate) ? fundingRate : 0,
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
