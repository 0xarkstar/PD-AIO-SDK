/**
 * Ethereal Data Normalizer
 *
 * Transforms Ethereal API responses to unified SDK format.
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
  OHLCV,
} from '../../types/common.js';
import type { OrderStatus } from '../../types/common.js';
import {
  ETHEREAL_DEFAULT_PRECISION,
  ETHEREAL_FUNDING_INTERVAL_HOURS,
  etherealToUnified,
  unifiedToEthereal,
} from './constants.js';
import { ETHEREAL_ORDER_STATUS } from './constants.js';
// parseEtherealSymbol no longer needed — real API provides baseTokenName/quoteTokenName
import type {
  EtherealMarketInfo,
  EtherealTicker,
  EtherealOrderBookResponse,
  EtherealTradeResponse,
  EtherealOrderResponse,
  EtherealPositionResponse,
  EtherealBalanceResponse,
  EtherealCandleResponse,
  EtherealFundingRateResponse,
} from './types.js';
import {
  EtherealMarketInfoSchema,
  EtherealTickerSchema,
  EtherealOrderBookResponseSchema,
  EtherealTradeResponseSchema,
  EtherealOrderResponseSchema,
  EtherealPositionResponseSchema,
  EtherealBalanceResponseSchema,
  EtherealCandleResponseSchema,
  EtherealFundingRateResponseSchema,
} from './types.js';


export class EtherealNormalizer {
  // ===========================================================================
  // Symbol Conversion
  // ===========================================================================

  symbolToCCXT(etherealSymbol: string): string {
    return etherealToUnified(etherealSymbol);
  }

  symbolFromCCXT(ccxtSymbol: string): string {
    return unifiedToEthereal(ccxtSymbol);
  }

  // ===========================================================================
  // Market Normalization
  // ===========================================================================

  normalizeMarket(info: EtherealMarketInfo): Market {
    EtherealMarketInfoSchema.parse(info);

    const unifiedSymbol = etherealToUnified(info.displayTicker);
    const base = info.baseTokenName;
    const quote = info.quoteTokenName;

    const tickSize = parseFloat(info.tickSize);
    const stepSize = parseFloat(info.lotSize);
    const minAmount = parseFloat(info.minQuantity);

    const pricePrecision =
      tickSize > 0
        ? Math.max(0, -Math.floor(Math.log10(tickSize)))
        : ETHEREAL_DEFAULT_PRECISION.price;
    const amountPrecision =
      stepSize > 0
        ? Math.max(0, -Math.floor(Math.log10(stepSize)))
        : ETHEREAL_DEFAULT_PRECISION.amount;

    return {
      id: info.id,
      symbol: unifiedSymbol,
      base,
      quote,
      settle: quote,
      active: info.status === 'ACTIVE',
      minAmount,
      pricePrecision,
      amountPrecision,
      priceTickSize: tickSize,
      amountStepSize: stepSize,
      makerFee: parseFloat(info.makerFee),
      takerFee: parseFloat(info.takerFee),
      maxLeverage: info.maxLeverage,
      fundingIntervalHours: ETHEREAL_FUNDING_INTERVAL_HOURS,
      info: info as unknown as Record<string, unknown>,
    };
  }

  // ===========================================================================
  // Ticker Normalization
  // ===========================================================================

  normalizeTicker(
    raw: EtherealTicker,
    symbol: string,
    product?: EtherealMarketInfo
  ): Ticker {
    EtherealTickerSchema.parse(raw);

    const bid = parseFloat(raw.bestBidPrice);
    const ask = parseFloat(raw.bestAskPrice);
    const last = (bid + ask) / 2; // mid price as best approximation
    const oraclePrice = parseFloat(raw.oraclePrice);
    const price24hAgo = parseFloat(raw.price24hAgo);
    const change = oraclePrice - price24hAgo;
    const percentage = price24hAgo !== 0 ? (change / price24hAgo) * 100 : 0;

    const volume24h = product ? parseFloat(product.volume24h) : 0;

    return {
      symbol,
      last,
      bid,
      ask,
      high: 0, // not available from market-price endpoint
      low: 0,
      open: price24hAgo,
      close: last,
      change,
      percentage,
      baseVolume: volume24h,
      quoteVolume: volume24h * last,
      timestamp: Date.now(),
      info: raw as unknown as Record<string, unknown>,
    };
  }

  // ===========================================================================
  // Order Book Normalization
  // ===========================================================================

  normalizeOrderBook(raw: EtherealOrderBookResponse, symbol: string): OrderBook {
    EtherealOrderBookResponseSchema.parse(raw);

    return {
      symbol,
      timestamp: raw.timestamp,
      bids: (raw.bids ?? []).map(([p, s]) => [parseFloat(p), parseFloat(s)] as [number, number]),
      asks: (raw.asks ?? []).map(([p, s]) => [parseFloat(p), parseFloat(s)] as [number, number]),
      exchange: 'ethereal',
    };
  }

  // ===========================================================================
  // Trade Normalization
  // ===========================================================================

  normalizeTrade(raw: EtherealTradeResponse, symbol: string): Trade {
    EtherealTradeResponseSchema.parse(raw);

    const price = parseFloat(raw.price);
    const amount = parseFloat(raw.filled);
    // takerSide: 0 = buy, 1 = sell
    const side = raw.takerSide === 0 ? 'buy' : 'sell';

    return {
      id: raw.id,
      symbol,
      side,
      price,
      amount,
      cost: price * amount,
      timestamp: raw.createdAt,
      info: raw as unknown as Record<string, unknown>,
    };
  }

  // ===========================================================================
  // Order Normalization
  // ===========================================================================

  normalizeOrder(raw: EtherealOrderResponse, symbol?: string): Order {
    EtherealOrderResponseSchema.parse(raw);

    const filled = parseFloat(raw.filledQuantity);
    const amount = parseFloat(raw.quantity);
    const price = parseFloat(raw.price);
    const avgPrice = parseFloat(raw.avgPrice);

    return {
      id: raw.orderId,
      symbol: symbol ?? etherealToUnified(raw.symbol),
      type: raw.type.toLowerCase() === 'market' ? 'market' : 'limit',
      side: raw.side === 'BUY' ? 'buy' : 'sell',
      amount,
      price: price || undefined,
      status: (ETHEREAL_ORDER_STATUS[raw.status] ?? 'open') as OrderStatus,
      filled,
      remaining: amount - filled,
      averagePrice: avgPrice || undefined,
      cost: filled * (avgPrice || price),
      reduceOnly: raw.reduceOnly,
      postOnly: raw.postOnly,
      clientOrderId: raw.clientOrderId,
      timestamp: raw.updatedAt,
      info: raw as unknown as Record<string, unknown>,
    };
  }

  // ===========================================================================
  // Position Normalization
  // ===========================================================================

  normalizePosition(raw: EtherealPositionResponse, symbol?: string): Position {
    EtherealPositionResponseSchema.parse(raw);

    const size = parseFloat(raw.size);
    const leverage = parseFloat(raw.leverage);

    return {
      symbol: symbol ?? etherealToUnified(raw.symbol),
      side: raw.side === 'LONG' ? 'long' : 'short',
      size,
      entryPrice: parseFloat(raw.entryPrice),
      markPrice: parseFloat(raw.markPrice),
      liquidationPrice: parseFloat(raw.liquidationPrice),
      unrealizedPnl: parseFloat(raw.unrealizedPnl),
      realizedPnl: parseFloat(raw.realizedPnl),
      leverage,
      marginMode: raw.marginMode === 'isolated' ? 'isolated' : 'cross',
      margin: parseFloat(raw.margin),
      maintenanceMargin: 0,
      marginRatio: 0,
      timestamp: raw.updatedAt,
      info: {
        ...(raw as unknown as Record<string, unknown>),
        _marginRatioSource: 'not_available',
      },
    };
  }

  // ===========================================================================
  // Balance Normalization
  // ===========================================================================

  normalizeBalance(raw: EtherealBalanceResponse): Balance {
    EtherealBalanceResponseSchema.parse(raw);

    return {
      currency: raw.asset,
      total: parseFloat(raw.total),
      free: parseFloat(raw.available),
      used: parseFloat(raw.locked),
      info: raw as unknown as Record<string, unknown>,
    };
  }

  // ===========================================================================
  // Funding Rate Normalization
  // ===========================================================================

  normalizeFundingRate(raw: EtherealFundingRateResponse, symbol: string): FundingRate {
    EtherealFundingRateResponseSchema.parse(raw);

    const now = Date.now();
    // Funding settles every hour on the hour
    const nextHour = Math.ceil(now / 3600000) * 3600000;

    return {
      symbol,
      fundingRate: parseFloat(raw.fundingRate1h),
      fundingTimestamp: now,
      nextFundingTimestamp: nextHour,
      markPrice: 0, // not available from projected endpoint
      indexPrice: 0,
      fundingIntervalHours: ETHEREAL_FUNDING_INTERVAL_HOURS,
    };
  }

  // ===========================================================================
  // OHLCV Normalization
  // ===========================================================================

  normalizeCandles(candles: EtherealCandleResponse[]): OHLCV[] {
    return candles.map((c) => {
      EtherealCandleResponseSchema.parse(c);

      return [
        c.timestamp,
        parseFloat(c.open),
        parseFloat(c.high),
        parseFloat(c.low),
        parseFloat(c.close),
        parseFloat(c.volume),
      ] as OHLCV;
    });
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  normalizeSymbol(exchangeSymbol: string): string {
    return this.symbolToCCXT(exchangeSymbol);
  }

  toExchangeSymbol(symbol: string): string {
    return this.symbolFromCCXT(symbol);
  }
}
