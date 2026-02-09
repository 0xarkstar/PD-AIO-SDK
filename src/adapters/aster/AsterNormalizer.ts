/**
 * Aster Response Normalizer
 */

import type {
  Balance,
  FundingRate,
  Market,
  OHLCV,
  Order,
  OrderBook,
  Position,
  Ticker,
  Trade,
} from '../../types/common.js';
import type { OrderStatus } from '../../types/common.js';
import { ASTER_ORDER_STATUS } from './constants.js';
import type {
  AsterAccountBalance,
  AsterKlineResponse,
  AsterOrderBookResponse,
  AsterOrderResponse,
  AsterPositionRisk,
  AsterPremiumIndex,
  AsterSymbolInfo,
  AsterTicker24hr,
  AsterTradeResponse,
  AsterFilter,
  AsterPriceFilter,
  AsterLotSizeFilter,
} from './types.js';
import { toUnifiedSymbol } from './utils.js';

export class AsterNormalizer {
  normalizeMarket(info: AsterSymbolInfo): Market {
    const priceFilter = info.filters.find(
      (f: AsterFilter): f is AsterPriceFilter => f.filterType === 'PRICE_FILTER'
    );
    const lotFilter = info.filters.find(
      (f: AsterFilter): f is AsterLotSizeFilter => f.filterType === 'LOT_SIZE'
    );

    const tickSize = priceFilter ? parseFloat(priceFilter.tickSize) : 0.01;
    const stepSize = lotFilter ? parseFloat(lotFilter.stepSize) : 0.001;
    const minQty = lotFilter ? parseFloat(lotFilter.minQty) : 0;

    return {
      id: info.symbol,
      symbol: toUnifiedSymbol(info.symbol, info.baseAsset, info.quoteAsset),
      base: info.baseAsset,
      quote: info.quoteAsset,
      settle: info.marginAsset,
      active: info.status === 'TRADING',
      minAmount: minQty,
      pricePrecision: info.pricePrecision,
      amountPrecision: info.quantityPrecision,
      priceTickSize: tickSize,
      amountStepSize: stepSize,
      makerFee: 0.0002,
      takerFee: 0.0005,
      maxLeverage: 125,
      fundingIntervalHours: 8,
      info: info as unknown as Record<string, unknown>,
    };
  }

  normalizeTicker(raw: AsterTicker24hr, symbol?: string): Ticker {
    const last = parseFloat(raw.lastPrice);

    return {
      symbol: symbol ?? raw.symbol,
      last,
      bid: last,
      ask: last,
      high: parseFloat(raw.highPrice),
      low: parseFloat(raw.lowPrice),
      open: parseFloat(raw.openPrice),
      close: last,
      change: parseFloat(raw.priceChange),
      percentage: parseFloat(raw.priceChangePercent),
      baseVolume: parseFloat(raw.volume),
      quoteVolume: parseFloat(raw.quoteVolume),
      timestamp: raw.closeTime,
      info: raw as unknown as Record<string, unknown>,
    };
  }

  normalizeOrderBook(raw: AsterOrderBookResponse, symbol: string): OrderBook {
    return {
      symbol,
      timestamp: raw.T ?? Date.now(),
      bids: raw.bids.map(([p, s]) => [parseFloat(p), parseFloat(s)] as [number, number]),
      asks: raw.asks.map(([p, s]) => [parseFloat(p), parseFloat(s)] as [number, number]),
      exchange: 'aster',
    };
  }

  normalizeTrade(raw: AsterTradeResponse, symbol: string): Trade {
    return {
      id: String(raw.id),
      symbol,
      side: raw.isBuyerMaker ? 'sell' : 'buy',
      price: parseFloat(raw.price),
      amount: parseFloat(raw.qty),
      cost: parseFloat(raw.quoteQty),
      timestamp: raw.time,
      info: raw as unknown as Record<string, unknown>,
    };
  }

  normalizeFundingRate(raw: AsterPremiumIndex, symbol: string): FundingRate {
    return {
      symbol,
      fundingRate: parseFloat(raw.lastFundingRate),
      fundingTimestamp: raw.time,
      nextFundingTimestamp: raw.nextFundingTime,
      markPrice: parseFloat(raw.markPrice),
      indexPrice: parseFloat(raw.indexPrice),
      fundingIntervalHours: 8,
      info: raw as unknown as Record<string, unknown>,
    };
  }

  normalizeOHLCV(raw: AsterKlineResponse): OHLCV {
    return [
      raw[0],
      parseFloat(raw[1]),
      parseFloat(raw[2]),
      parseFloat(raw[3]),
      parseFloat(raw[4]),
      parseFloat(raw[5]),
    ];
  }

  normalizeOrder(raw: AsterOrderResponse, symbol?: string): Order {
    const filled = parseFloat(raw.executedQty);
    const amount = parseFloat(raw.origQty);
    const price = parseFloat(raw.price);
    const avgPrice = parseFloat(raw.avgPrice);

    return {
      id: String(raw.orderId),
      symbol: symbol ?? raw.symbol,
      type: raw.origType?.toLowerCase() === 'market' ? 'market' : 'limit',
      side: raw.side === 'BUY' ? 'buy' : 'sell',
      amount,
      price: price || undefined,
      status: (ASTER_ORDER_STATUS[raw.status] ?? 'open') as OrderStatus,
      filled,
      remaining: amount - filled,
      averagePrice: avgPrice || undefined,
      cost: filled * (avgPrice || price),
      reduceOnly: raw.reduceOnly ?? false,
      postOnly: raw.timeInForce === 'GTX',
      clientOrderId: raw.clientOrderId,
      timestamp: raw.updateTime,
      info: raw as unknown as Record<string, unknown>,
    };
  }

  normalizePosition(raw: AsterPositionRisk, symbol?: string): Position {
    const size = parseFloat(raw.positionAmt);
    const absSize = Math.abs(size);
    const leverage = parseFloat(raw.leverage);
    const entryPrice = parseFloat(raw.entryPrice);
    const markPrice = parseFloat(raw.markPrice);
    const notional = Math.abs(parseFloat(raw.notional));

    return {
      symbol: symbol ?? raw.symbol,
      side: size >= 0 ? 'long' : 'short',
      size: absSize,
      entryPrice,
      markPrice,
      liquidationPrice: parseFloat(raw.liquidationPrice) || 0,
      unrealizedPnl: parseFloat(raw.unRealizedProfit),
      realizedPnl: 0,
      leverage,
      marginMode: raw.marginType === 'isolated' ? 'isolated' : 'cross',
      margin: notional / leverage,
      maintenanceMargin: 0,
      marginRatio: 0,
      timestamp: raw.updateTime,
      info: raw as unknown as Record<string, unknown>,
    };
  }

  normalizeBalance(raw: AsterAccountBalance): Balance {
    return {
      currency: raw.asset,
      total: parseFloat(raw.balance),
      free: parseFloat(raw.availableBalance),
      used: parseFloat(raw.balance) - parseFloat(raw.availableBalance),
      info: raw as unknown as Record<string, unknown>,
    };
  }
}
