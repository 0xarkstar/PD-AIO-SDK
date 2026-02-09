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
import { toUnifiedSymbol } from './utils.js';

export class PacificaNormalizer {
  normalizeMarket(raw: PacificaMarket): Market {
    const symbol = toUnifiedSymbol(raw.symbol);

    return {
      id: raw.symbol,
      symbol,
      base: raw.base_currency,
      quote: raw.quote_currency,
      settle: raw.quote_currency,
      active: raw.status === 'active',
      minAmount: parseFloat(raw.min_size),
      pricePrecision: this.countDecimals(raw.price_step),
      amountPrecision: this.countDecimals(raw.size_step),
      priceTickSize: parseFloat(raw.price_step),
      amountStepSize: parseFloat(raw.size_step),
      makerFee: parseFloat(raw.maker_fee),
      takerFee: parseFloat(raw.taker_fee),
      maxLeverage: raw.max_leverage,
      fundingIntervalHours: raw.funding_interval / 3600,
      info: raw as unknown as Record<string, unknown>,
    };
  }

  normalizeTicker(raw: PacificaTicker, symbol?: string): Ticker {
    const last = parseFloat(raw.last_price);
    const high = parseFloat(raw.high_24h);
    const low = parseFloat(raw.low_24h);

    return {
      symbol: symbol ?? toUnifiedSymbol(raw.symbol),
      last,
      bid: parseFloat(raw.bid_price),
      ask: parseFloat(raw.ask_price),
      high,
      low,
      open: last,
      close: last,
      change: 0,
      percentage: 0,
      baseVolume: parseFloat(raw.volume_24h),
      quoteVolume: parseFloat(raw.quote_volume_24h),
      timestamp: raw.timestamp,
      info: raw as unknown as Record<string, unknown>,
    };
  }

  normalizeOrderBook(raw: PacificaOrderBookType, symbol: string): OrderBook {
    return {
      symbol,
      timestamp: raw.timestamp,
      bids: raw.bids.map((b) => [parseFloat(b.price), parseFloat(b.size)] as [number, number]),
      asks: raw.asks.map((a) => [parseFloat(a.price), parseFloat(a.size)] as [number, number]),
      sequenceId: raw.sequence,
      exchange: 'pacifica',
    };
  }

  normalizeTrade(raw: PacificaTradeResponse, symbol?: string): Trade {
    const price = parseFloat(raw.price);
    const amount = parseFloat(raw.size);

    return {
      id: raw.id,
      symbol: symbol ?? toUnifiedSymbol(raw.symbol),
      side: raw.side,
      price,
      amount,
      cost: price * amount,
      timestamp: raw.timestamp,
      info: raw as unknown as Record<string, unknown>,
    };
  }

  normalizeFundingRate(raw: PacificaFundingHistory, symbol: string): FundingRate {
    return {
      symbol,
      fundingRate: parseFloat(raw.funding_rate),
      fundingTimestamp: raw.timestamp,
      nextFundingTimestamp: raw.timestamp + 3600000,
      markPrice: parseFloat(raw.mark_price),
      indexPrice: parseFloat(raw.index_price),
      fundingIntervalHours: 1,
      info: raw as unknown as Record<string, unknown>,
    };
  }

  normalizeOrder(raw: PacificaOrderResponse, symbol?: string): Order {
    const filled = parseFloat(raw.filled_size);
    const amount = parseFloat(raw.size);

    return {
      id: raw.order_id,
      symbol: symbol ?? toUnifiedSymbol(raw.symbol),
      type: raw.type === 'market' ? 'market' : 'limit',
      side: raw.side,
      amount,
      price: raw.price ? parseFloat(raw.price) : undefined,
      status: (PACIFICA_ORDER_STATUS[raw.status] ?? 'open') as OrderStatus,
      filled,
      remaining: amount - filled,
      averagePrice: raw.avg_fill_price ? parseFloat(raw.avg_fill_price) : undefined,
      reduceOnly: raw.reduce_only,
      postOnly: raw.post_only,
      clientOrderId: raw.client_order_id,
      timestamp: raw.created_at,
      lastUpdateTimestamp: raw.updated_at,
      info: raw as unknown as Record<string, unknown>,
    };
  }

  normalizePosition(raw: PacificaPositionType, symbol?: string): Position {
    return {
      symbol: symbol ?? toUnifiedSymbol(raw.symbol),
      side: raw.side,
      size: parseFloat(raw.size),
      entryPrice: parseFloat(raw.entry_price),
      markPrice: parseFloat(raw.mark_price),
      liquidationPrice: parseFloat(raw.liquidation_price),
      unrealizedPnl: parseFloat(raw.unrealized_pnl),
      realizedPnl: parseFloat(raw.realized_pnl),
      leverage: raw.leverage,
      marginMode: raw.margin_mode,
      margin: parseFloat(raw.margin),
      maintenanceMargin: parseFloat(raw.maintenance_margin),
      marginRatio: 0,
      timestamp: raw.timestamp,
      info: raw as unknown as Record<string, unknown>,
    };
  }

  normalizeBalance(raw: PacificaAccountInfo): Balance {
    const total = parseFloat(raw.total_equity);
    const free = parseFloat(raw.available_balance);

    return {
      currency: raw.currency,
      total,
      free,
      used: total - free,
      info: raw as unknown as Record<string, unknown>,
    };
  }

  private countDecimals(value: string): number {
    if (!value || !value.includes('.')) return 0;
    const decimals = value.split('.')[1];
    if (!decimals) return 0;
    return decimals.replace(/0+$/, '').length || 0;
  }
}
