/**
 * Pacifica Response Normalizer
 */

import type {
  Balance,
  FundingRate,
  Market,
  Order,
  OrderBook,
  Position,
  Ticker,
  Trade,
} from '../../types/common.js';
import type { OrderStatus } from '../../types/common.js';
import { PACIFICA_ORDER_STATUS } from './constants.js';
import type {
  PacificaAccountInfo,
  PacificaFundingHistory,
  PacificaMarket,
  PacificaOrderBook as PacificaOrderBookType,
  PacificaOrderResponse,
  PacificaPosition as PacificaPositionType,
  PacificaTicker,
  PacificaTradeResponse,
} from './types.js';
import {
  PacificaAccountInfoSchema,
  PacificaFundingHistorySchema,
  PacificaMarketSchema,
  PacificaOrderBookSchema,
  PacificaOrderResponseSchema,
  PacificaPositionSchema,
  PacificaTickerSchema,
  PacificaTradeResponseSchema,
} from './types.js';
import { toUnifiedSymbol } from './utils.js';

export class PacificaNormalizer {
  normalizeMarket(raw: PacificaMarket): Market {
    const validated = PacificaMarketSchema.parse(raw);
    const symbol = toUnifiedSymbol(validated.symbol);

    return {
      id: validated.symbol,
      symbol,
      base: validated.base_currency,
      quote: validated.quote_currency,
      settle: validated.quote_currency,
      active: validated.status === 'active',
      minAmount: parseFloat(validated.min_size),
      pricePrecision: this.countDecimals(validated.price_step),
      amountPrecision: this.countDecimals(validated.size_step),
      priceTickSize: parseFloat(validated.price_step),
      amountStepSize: parseFloat(validated.size_step),
      makerFee: parseFloat(validated.maker_fee),
      takerFee: parseFloat(validated.taker_fee),
      maxLeverage: validated.max_leverage,
      fundingIntervalHours: validated.funding_interval / 3600,
      info: validated as unknown as Record<string, unknown>,
    };
  }

  normalizeTicker(raw: PacificaTicker, symbol?: string): Ticker {
    const validated = PacificaTickerSchema.parse(raw);
    const last = parseFloat(validated.last_price);
    const high = parseFloat(validated.high_24h);
    const low = parseFloat(validated.low_24h);

    return {
      symbol: symbol ?? toUnifiedSymbol(validated.symbol),
      last,
      bid: parseFloat(validated.bid_price),
      ask: parseFloat(validated.ask_price),
      high,
      low,
      open: last,
      close: last,
      change: 0,
      percentage: 0,
      baseVolume: parseFloat(validated.volume_24h),
      quoteVolume: parseFloat(validated.quote_volume_24h),
      timestamp: validated.timestamp,
      info: {
        ...(validated as unknown as Record<string, unknown>),
        _bidAskSource: 'orderbook',
      },
    };
  }

  normalizeOrderBook(raw: PacificaOrderBookType, symbol: string): OrderBook {
    const validated = PacificaOrderBookSchema.parse(raw);
    return {
      symbol,
      timestamp: validated.timestamp,
      bids: validated.bids.map((b) => [parseFloat(b.price), parseFloat(b.size)] as [number, number]),
      asks: validated.asks.map((a) => [parseFloat(a.price), parseFloat(a.size)] as [number, number]),
      sequenceId: validated.sequence,
      exchange: 'pacifica',
    };
  }

  normalizeTrade(raw: PacificaTradeResponse, symbol?: string): Trade {
    const validated = PacificaTradeResponseSchema.parse(raw);
    const price = parseFloat(typeof validated.price === 'number' ? String(validated.price) : validated.price);
    const amount = parseFloat(typeof validated.size === 'number' ? String(validated.size) : validated.size);

    return {
      id: validated.id,
      symbol: symbol ?? toUnifiedSymbol(validated.symbol),
      side: validated.side as 'buy' | 'sell',
      price,
      amount,
      cost: price * amount,
      timestamp: validated.timestamp,
      info: validated as unknown as Record<string, unknown>,
    };
  }

  normalizeFundingRate(raw: PacificaFundingHistory, symbol: string): FundingRate {
    const validated = PacificaFundingHistorySchema.parse(raw);
    return {
      symbol,
      fundingRate: parseFloat(validated.funding_rate),
      fundingTimestamp: validated.timestamp,
      nextFundingTimestamp: validated.timestamp + 3600000,
      markPrice: parseFloat(validated.mark_price),
      indexPrice: parseFloat(validated.index_price),
      fundingIntervalHours: 1,
      info: validated as unknown as Record<string, unknown>,
    };
  }

  normalizeOrder(raw: PacificaOrderResponse, symbol?: string): Order {
    const validated = PacificaOrderResponseSchema.parse(raw);
    const filled = parseFloat(typeof validated.filled_size === 'number' ? String(validated.filled_size) : validated.filled_size);
    const amount = parseFloat(typeof validated.size === 'number' ? String(validated.size) : validated.size);

    return {
      id: validated.order_id,
      symbol: symbol ?? toUnifiedSymbol(validated.symbol),
      type: validated.type === 'market' ? 'market' : 'limit',
      side: validated.side as 'buy' | 'sell',
      amount,
      price: validated.price ? parseFloat(typeof validated.price === 'number' ? String(validated.price) : validated.price) : undefined,
      status: (PACIFICA_ORDER_STATUS[validated.status] ?? 'open') as OrderStatus,
      filled,
      remaining: amount - filled,
      averagePrice: validated.avg_fill_price ? parseFloat(typeof validated.avg_fill_price === 'number' ? String(validated.avg_fill_price) : validated.avg_fill_price) : undefined,
      reduceOnly: validated.reduce_only,
      postOnly: validated.post_only,
      clientOrderId: validated.client_order_id,
      timestamp: validated.created_at,
      lastUpdateTimestamp: validated.updated_at,
      info: validated as unknown as Record<string, unknown>,
    };
  }

  normalizePosition(raw: PacificaPositionType, symbol?: string): Position {
    const validated = PacificaPositionSchema.parse(raw);
    const size = parseFloat(typeof validated.size === 'number' ? String(validated.size) : validated.size);
    const markPrice = parseFloat(typeof validated.mark_price === 'number' ? String(validated.mark_price) : validated.mark_price);
    const maintenanceMargin = parseFloat(typeof validated.maintenance_margin === 'number' ? String(validated.maintenance_margin) : validated.maintenance_margin);
    const notional = size * markPrice;

    return {
      symbol: symbol ?? toUnifiedSymbol(validated.symbol),
      side: validated.side as 'long' | 'short',
      size,
      entryPrice: parseFloat(typeof validated.entry_price === 'number' ? String(validated.entry_price) : validated.entry_price),
      markPrice,
      liquidationPrice: parseFloat(typeof validated.liquidation_price === 'number' ? String(validated.liquidation_price) : validated.liquidation_price),
      unrealizedPnl: parseFloat(typeof validated.unrealized_pnl === 'number' ? String(validated.unrealized_pnl) : validated.unrealized_pnl),
      realizedPnl: parseFloat(typeof validated.realized_pnl === 'number' ? String(validated.realized_pnl) : validated.realized_pnl),
      leverage: validated.leverage,
      marginMode: validated.margin_mode as 'cross' | 'isolated',
      margin: parseFloat(typeof validated.margin === 'number' ? String(validated.margin) : validated.margin),
      maintenanceMargin,
      marginRatio: notional > 0 ? maintenanceMargin / notional : 0,
      timestamp: validated.timestamp,
      info: validated as unknown as Record<string, unknown>,
    };
  }

  normalizeBalance(raw: PacificaAccountInfo): Balance {
    const validated = PacificaAccountInfoSchema.parse(raw);
    const total = parseFloat(validated.total_equity);
    const free = parseFloat(validated.available_balance);

    return {
      currency: validated.currency,
      total,
      free,
      used: total - free,
      info: validated as unknown as Record<string, unknown>,
    };
  }

  private countDecimals(value: string): number {
    if (!value || !value.includes('.')) return 0;
    const decimals = value.split('.')[1];
    if (!decimals) return 0;
    return decimals.replace(/0+$/, '').length || 0;
  }
}
