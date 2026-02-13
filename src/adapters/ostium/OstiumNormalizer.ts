/**
 * Ostium Response Normalizer
 */

import type { Balance, Market, Order, Position, Ticker, Trade } from '../../types/common.js';
import type {
  OstiumPairInfo,
  OstiumPriceResponse,
  OstiumSubgraphTrade,
  OstiumSubgraphPosition,
  OstiumOpenTrade,
} from './types.js';
import { toUnifiedSymbolFromName, parseCollateral, parsePrice, toUnifiedSymbol } from './utils.js';

export class OstiumNormalizer {
  normalizeMarket(pair: OstiumPairInfo): Market {
    return {
      id: String(pair.pairIndex),
      symbol: toUnifiedSymbolFromName(pair.name),
      base: pair.from,
      quote: pair.to,
      settle: 'USDC',
      active: true,
      minAmount: parseFloat(pair.minPositionSize),
      maxAmount: parseFloat(pair.maxPositionSize),
      pricePrecision: 2,
      amountPrecision: 2,
      priceTickSize: 0.01,
      amountStepSize: 0.01,
      makerFee: 0,
      takerFee: parseFloat(pair.spreadP) / 100,
      maxLeverage: pair.maxLeverage,
      fundingIntervalHours: 1,
      info: pair as unknown as Record<string, unknown>,
    };
  }

  normalizeTicker(raw: OstiumPriceResponse, pair: OstiumPairInfo): Ticker {
    // API returns {bid, mid, ask, timestampSeconds} instead of {price, timestamp}
    const rawAny = raw as any;
    const price = rawAny.mid != null ? parseFloat(String(rawAny.mid)) : parseFloat(raw.price);
    const bid = rawAny.bid != null ? parseFloat(String(rawAny.bid)) : price;
    const ask = rawAny.ask != null ? parseFloat(String(rawAny.ask)) : price;
    const timestamp =
      rawAny.timestampSeconds != null ? rawAny.timestampSeconds * 1000 : raw.timestamp;

    return {
      symbol: toUnifiedSymbolFromName(pair.name),
      last: price,
      bid,
      ask,
      high: price,
      low: price,
      open: price,
      close: price,
      change: 0,
      percentage: 0,
      baseVolume: 0,
      quoteVolume: 0,
      timestamp,
      info: raw as unknown as Record<string, unknown>,
    };
  }

  normalizeTrade(raw: OstiumSubgraphTrade): Trade {
    const price = parseFloat(raw.price);
    const amount = parseFloat(raw.size);

    return {
      id: raw.id,
      symbol: toUnifiedSymbol(parseInt(raw.pairIndex, 10)),
      side: raw.buy ? 'buy' : 'sell',
      price,
      amount,
      cost: price * amount,
      timestamp: parseInt(raw.timestamp, 10) * 1000,
      info: raw as unknown as Record<string, unknown>,
    };
  }

  normalizePosition(raw: OstiumSubgraphPosition, currentPrice?: number): Position {
    const size = parseCollateral(raw.positionSizeDai);
    const entryPrice = parsePrice(raw.openPrice);
    const leverage = parseInt(raw.leverage, 10);
    const markPrice = currentPrice ?? entryPrice;

    const notional = size * leverage;
    const pnlMultiplier = raw.buy ? 1 : -1;
    const unrealizedPnl = notional * pnlMultiplier * ((markPrice - entryPrice) / entryPrice);

    return {
      symbol: toUnifiedSymbol(parseInt(raw.pairIndex, 10)),
      side: raw.buy ? 'long' : 'short',
      size,
      entryPrice,
      markPrice,
      liquidationPrice: 0,
      unrealizedPnl,
      realizedPnl: 0,
      leverage,
      marginMode: 'isolated',
      margin: size,
      maintenanceMargin: size * 0.05,
      marginRatio: 0,
      timestamp: parseInt(raw.timestamp, 10) * 1000,
      info: raw as unknown as Record<string, unknown>,
    };
  }

  normalizeBalance(rawBalance: string, currency = 'USDC'): Balance {
    const total = parseCollateral(rawBalance);
    return {
      currency,
      total,
      free: total,
      used: 0,
      info: { rawBalance } as unknown as Record<string, unknown>,
    };
  }

  normalizeOrderFromTrade(raw: OstiumOpenTrade): Order {
    return {
      id: `${raw.pairIndex}-${raw.index}`,
      symbol: toUnifiedSymbol(raw.pairIndex),
      type: 'market',
      side: raw.buy ? 'buy' : 'sell',
      amount: parseCollateral(raw.positionSizeDai),
      price: parsePrice(raw.openPrice),
      status: 'filled',
      filled: parseCollateral(raw.positionSizeDai),
      remaining: 0,
      reduceOnly: false,
      postOnly: false,
      timestamp: raw.timestamp,
      info: raw as unknown as Record<string, unknown>,
    };
  }
}
