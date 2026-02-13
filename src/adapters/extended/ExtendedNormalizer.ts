/**
 * Extended Normalizer
 *
 * Data transformation layer for Extended exchange
 * Converts Extended-specific formats to unified SDK format
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
  ExtendedMarket,
  ExtendedOrder,
  ExtendedPosition,
  ExtendedBalance,
  ExtendedOrderBook,
  ExtendedTrade,
  ExtendedTicker,
  ExtendedFundingRate,
} from './types.js';
import { safeParseFloat } from './utils.js';

export class ExtendedNormalizer {
  /**
   * Convert Extended symbol to unified CCXT format
   * Handles multiple Extended formats:
   * "BTC-USD-PERP" → "BTC/USD:USD"
   * "BTCUSD" → "BTC/USD:USD"
   */
  symbolToCCXT(extendedSymbol: string): string {
    // Guard: return as-is if symbol is null/undefined/empty
    if (!extendedSymbol) {
      return extendedSymbol ?? '';
    }

    // Handle "BTC-USD-PERP" format
    if (extendedSymbol.includes('-')) {
      const parts = extendedSymbol.split('-');
      if (parts.length >= 2) {
        const [base, quote] = parts;
        return `${base}/${quote}:${quote}`;
      }
    }

    // Handle "BTCUSD" format
    const match = extendedSymbol.match(/^([A-Z]+)(USD|USDT|USDC)$/);
    if (match) {
      const [, base, quote] = match;
      return `${base}/${quote}:${quote}`;
    }

    // Fallback: return as-is
    return extendedSymbol;
  }

  /**
   * Convert unified CCXT symbol to Extended format
   * "BTC/USD:USD" → "BTC-USD"
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

    // Extended uses "BTC-USD" format (no -PERP suffix)
    return `${base}-${quote}`;
  }

  /**
   * Normalize market data
   *
   * Handles both legacy SDK type format and actual API response format:
   * - API returns: {name, assetName, collateralAssetName, tradingConfig, active, ...}
   * - Legacy type: {symbol, marketId, baseAsset, quoteAsset, ...}
   */
  normalizeMarket(market: ExtendedMarket): Market {
    // Handle actual API format: name field like "BTC-USD"
    const rawSymbol = (market as any).name || market.symbol;
    const unifiedSymbol = this.symbolToCCXT(rawSymbol);

    // Extract base/quote from API or legacy format
    const base = (market as any).assetName || market.baseAsset;
    const quote = (market as any).collateralAssetName || market.quoteAsset || 'USD';
    const settle = market.settleAsset || quote;

    // Handle active flag from API or legacy
    const isActive = (market as any).active ?? market.isActive ?? true;

    // Extract trading config from actual API response
    const tradingConfig = (market as any).tradingConfig;
    const minOrderSize = tradingConfig?.minOrderSize || market.minOrderQuantity || '0';
    const maxLeverage = tradingConfig?.maxLeverage || market.maxLeverage || '1';
    const minPriceChange = tradingConfig?.minPriceChange || market.minPrice || '0.01';

    // Extract precision from API or legacy
    const pricePrecision = (market as any).collateralAssetPrecision ?? market.pricePrecision ?? 2;
    const amountPrecision = (market as any).assetPrecision ?? market.quantityPrecision ?? 0;

    return {
      id: (market as any).name || market.marketId || rawSymbol,
      symbol: unifiedSymbol,
      base,
      quote,
      settle,
      contractSize: safeParseFloat(market.contractMultiplier) || 1,
      active: isActive,
      minAmount: safeParseFloat(minOrderSize),
      maxAmount: tradingConfig
        ? safeParseFloat(tradingConfig.maxPositionValue)
        : safeParseFloat(market.maxOrderQuantity),
      pricePrecision,
      amountPrecision,
      priceTickSize: safeParseFloat(minPriceChange),
      amountStepSize: safeParseFloat(tradingConfig?.minOrderSizeChange || minOrderSize),
      makerFee: 0.0002,
      takerFee: 0.0005,
      maxLeverage: safeParseFloat(maxLeverage),
      fundingIntervalHours: 8,
      info: market as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize ticker data
   *
   * Handles both legacy SDK type and actual API response format:
   * - API returns: {lastPrice, bidPrice, askPrice, dailyHigh, dailyLow, dailyVolume, dailyPriceChange, ...}
   * - Legacy type: {lastPrice, bidPrice, askPrice, high24h, low24h, volume24h, priceChange24h, ...}
   */
  normalizeTicker(ticker: ExtendedTicker): Ticker {
    const raw = ticker as unknown as Record<string, any>;
    const unifiedSymbol = this.symbolToCCXT(raw.symbol || raw.market || '');

    return {
      symbol: unifiedSymbol,
      timestamp: raw.timestamp || Date.now(),
      high: safeParseFloat(raw.dailyHigh || raw.high24h),
      low: safeParseFloat(raw.dailyLow || raw.low24h),
      bid: safeParseFloat(raw.bidPrice),
      ask: safeParseFloat(raw.askPrice),
      last: safeParseFloat(raw.lastPrice),
      open: safeParseFloat(raw.lastPrice),
      close: safeParseFloat(raw.lastPrice),
      baseVolume: safeParseFloat(raw.dailyVolumeBase || raw.volume24h),
      quoteVolume: safeParseFloat(raw.dailyVolume || raw.quoteVolume24h),
      change: safeParseFloat(raw.dailyPriceChange || raw.priceChange24h),
      percentage: safeParseFloat(raw.dailyPriceChangePercentage || raw.priceChangePercent24h),
      info: ticker as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize order book data
   *
   * Handles both legacy SDK type and actual API response format:
   * - API returns: {market, bid: [{qty, price}], ask: [{qty, price}]}
   * - Legacy type: {symbol, bids: [[price, size]], asks: [[price, size]]}
   */
  normalizeOrderBook(orderbook: ExtendedOrderBook): OrderBook {
    const raw = orderbook as unknown as Record<string, any>;
    const unifiedSymbol = this.symbolToCCXT(raw.symbol || raw.market || '');

    // API uses "bid"/"ask" with object arrays; legacy uses "bids"/"asks" with tuples
    const rawBids = raw.bid || raw.bids || [];
    const rawAsks = raw.ask || raw.asks || [];

    const parseSide = (entries: any[]): [number, number][] =>
      entries.map((entry: any) => {
        if (Array.isArray(entry)) {
          return [safeParseFloat(entry[0]), safeParseFloat(entry[1])];
        }
        return [safeParseFloat(entry.price), safeParseFloat(entry.qty)];
      });

    return {
      exchange: 'extended',
      symbol: unifiedSymbol,
      bids: parseSide(rawBids),
      asks: parseSide(rawAsks),
      timestamp: raw.timestamp || Date.now(),
    };
  }

  /**
   * Normalize trade data
   *
   * Handles both legacy SDK type and actual API response format:
   * - API returns: {i (id), m (market), S (side), tT (tradeType), T (timestamp), p (price), q (qty)}
   * - Legacy type: {id, symbol, side, price, quantity, timestamp}
   */
  normalizeTrade(trade: ExtendedTrade): Trade {
    const raw = trade as unknown as Record<string, any>;
    const symbol = raw.symbol || raw.m || '';
    const unifiedSymbol = this.symbolToCCXT(symbol);
    const side = (raw.side || (raw.S === 'BUY' ? 'buy' : raw.S === 'SELL' ? 'sell' : raw.S?.toLowerCase())) as 'buy' | 'sell';
    const price = safeParseFloat(raw.price || raw.p);
    const amount = safeParseFloat(raw.quantity || raw.q);

    return {
      id: String(raw.id || raw.i || ''),
      orderId: undefined,
      symbol: unifiedSymbol,
      side,
      price,
      amount,
      cost: price * amount,
      timestamp: raw.timestamp || raw.T,
      info: trade as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize funding rate data
   *
   * Handles both legacy SDK type and actual API response format:
   * - API returns: {m (market), f (fundingRate), T (timestamp)}
   * - Legacy type: {symbol, fundingRate, fundingTime, markPrice, indexPrice}
   */
  normalizeFundingRate(fundingRate: ExtendedFundingRate): FundingRate {
    const raw = fundingRate as unknown as Record<string, any>;
    const symbol = raw.symbol || raw.m || '';
    const unifiedSymbol = this.symbolToCCXT(symbol);

    return {
      symbol: unifiedSymbol,
      fundingRate: safeParseFloat(raw.fundingRate || raw.f),
      fundingTimestamp: raw.fundingTime || raw.T || 0,
      nextFundingTimestamp: raw.nextFundingTime || 0,
      markPrice: safeParseFloat(raw.markPrice),
      indexPrice: safeParseFloat(raw.indexPrice),
      fundingIntervalHours: 1,
      info: fundingRate as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize order data
   */
  normalizeOrder(order: ExtendedOrder): Order {
    const unifiedSymbol = this.symbolToCCXT(order.symbol);
    const filled = safeParseFloat(order.filledQuantity || '0');
    const amount = safeParseFloat(order.quantity);
    const remaining = safeParseFloat(order.remainingQuantity || String(amount - filled));

    return {
      id: order.orderId,
      clientOrderId: order.clientOrderId,
      symbol: unifiedSymbol,
      type: this.normalizeOrderType(order.type),
      side: order.side,
      price: order.price ? safeParseFloat(order.price) : undefined,
      stopPrice: order.stopPrice ? safeParseFloat(order.stopPrice) : undefined,
      amount: amount,
      filled: filled,
      remaining: remaining,
      reduceOnly: false,
      postOnly: false,
      status: this.normalizeOrderStatus(order.status),
      timestamp: order.timestamp,
      lastUpdateTimestamp: order.updateTime,
      info: order as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize order type
   */
  private normalizeOrderType(type: ExtendedOrder['type']): 'market' | 'limit' {
    switch (type) {
      case 'market':
        return 'market';
      case 'limit':
      case 'stop':
      case 'stop_limit':
        return 'limit';
      default:
        return 'limit';
    }
  }

  /**
   * Normalize order status
   */
  private normalizeOrderStatus(
    status: ExtendedOrder['status']
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
  normalizePosition(position: ExtendedPosition): Position {
    const unifiedSymbol = this.symbolToCCXT(position.symbol);
    const size = safeParseFloat(position.size);
    const markPrice = safeParseFloat(position.markPrice);

    return {
      symbol: unifiedSymbol,
      side: position.side,
      size: size,
      entryPrice: safeParseFloat(position.entryPrice),
      markPrice: markPrice,
      leverage: safeParseFloat(position.leverage),
      liquidationPrice: safeParseFloat(position.liquidationPrice),
      unrealizedPnl: safeParseFloat(position.unrealizedPnl),
      realizedPnl: 0,
      margin: safeParseFloat(position.initialMargin),
      maintenanceMargin: safeParseFloat(position.maintenanceMargin),
      marginRatio: safeParseFloat(position.maintenanceMargin) / (size * markPrice),
      marginMode: position.marginMode,
      timestamp: position.timestamp,
      info: position as unknown as Record<string, unknown>,
    };
  }

  /**
   * Normalize balance data
   */
  normalizeBalance(balance: ExtendedBalance): Balance {
    return {
      currency: balance.asset,
      free: safeParseFloat(balance.free),
      used: safeParseFloat(balance.locked),
      total: safeParseFloat(balance.total),
    };
  }

  /**
   * Batch normalize markets
   */
  normalizeMarkets(markets: ExtendedMarket[]): Market[] {
    return markets.map((market) => this.normalizeMarket(market));
  }

  /**
   * Batch normalize orders
   */
  normalizeOrders(orders: ExtendedOrder[]): Order[] {
    return orders.map((order) => this.normalizeOrder(order));
  }

  /**
   * Batch normalize positions
   */
  normalizePositions(positions: ExtendedPosition[]): Position[] {
    return positions.map((position) => this.normalizePosition(position));
  }

  /**
   * Batch normalize balances
   */
  normalizeBalances(balances: ExtendedBalance[]): Balance[] {
    return balances.map((balance) => this.normalizeBalance(balance));
  }

  /**
   * Batch normalize trades
   */
  normalizeTrades(trades: ExtendedTrade[]): Trade[] {
    return trades.map((trade) => this.normalizeTrade(trade));
  }

  /**
   * Batch normalize funding rates
   */
  normalizeFundingRates(rates: ExtendedFundingRate[]): FundingRate[] {
    return rates.map((rate) => this.normalizeFundingRate(rate));
  }
}
