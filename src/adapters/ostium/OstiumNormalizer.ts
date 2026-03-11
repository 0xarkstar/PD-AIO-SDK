/**
 * Ostium Response Normalizer
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
import { NotSupportedError } from '../../types/errors.js';
import type {
  OstiumPairInfo,
  OstiumPriceResponse,
  OstiumSubgraphTrade,
  OstiumSubgraphPosition,
  OstiumOpenTrade,
} from './types.js';
import {
  OstiumPairInfoSchema,
  OstiumPriceResponseSchema,
  OstiumSubgraphTradeSchema,
  OstiumSubgraphPositionSchema,
  OstiumOpenTradeSchema,
} from './types.js';
import {
  toUnifiedSymbolFromName,
  parseCollateral,
  parsePrice,
  toUnifiedSymbol,
  toOstiumPairIndex,
} from './utils.js';

export class OstiumNormalizer {
  normalizeMarket(pair: OstiumPairInfo): Market {
    const validated = OstiumPairInfoSchema.parse(pair);
    return {
      id: String(validated.pairIndex),
      symbol: toUnifiedSymbolFromName(validated.name),
      base: validated.from,
      quote: validated.to,
      settle: 'USDC',
      active: true,
      minAmount: parseFloat(validated.minPositionSize),
      maxAmount: parseFloat(validated.maxPositionSize),
      pricePrecision: 2,
      amountPrecision: 2,
      priceTickSize: 0.01,
      amountStepSize: 0.01,
      makerFee: 0,
      takerFee: parseFloat(validated.spreadP) / 100,
      maxLeverage: validated.maxLeverage,
      fundingIntervalHours: 1,
      info: validated as unknown as Record<string, unknown>,
    };
  }

  normalizeTicker(raw: OstiumPriceResponse, pair: OstiumPairInfo): Ticker {
    const validatedRaw = OstiumPriceResponseSchema.parse(raw);
    const validatedPair = OstiumPairInfoSchema.parse(pair);
    // API returns {bid, mid, ask, timestampSeconds} instead of {price, timestamp}
    const price =
      validatedRaw.mid != null
        ? parseFloat(String(validatedRaw.mid))
        : parseFloat(validatedRaw.price ?? '0');
    const bid = validatedRaw.bid != null ? parseFloat(String(validatedRaw.bid)) : price;
    const ask = validatedRaw.ask != null ? parseFloat(String(validatedRaw.ask)) : price;
    const timestamp =
      validatedRaw.timestampSeconds != null
        ? validatedRaw.timestampSeconds * 1000
        : (validatedRaw.timestamp ?? Date.now());

    return {
      symbol: toUnifiedSymbolFromName(validatedPair.name),
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
      info: {
        ...(validatedRaw as unknown as Record<string, unknown>),
        _bidAskSource: 'orderbook',
      },
    };
  }

  normalizeTrade(raw: OstiumSubgraphTrade): Trade {
    const validated = OstiumSubgraphTradeSchema.parse(raw);
    const price = parseFloat(validated.price);
    const amount = parseFloat(validated.size);

    return {
      id: validated.id,
      symbol: toUnifiedSymbol(parseInt(validated.pairIndex, 10)),
      side: validated.buy ? 'buy' : 'sell',
      price,
      amount,
      cost: price * amount,
      timestamp: parseInt(validated.timestamp, 10) * 1000,
      info: validated as unknown as Record<string, unknown>,
    };
  }

  normalizePosition(raw: OstiumSubgraphPosition, currentPrice?: number): Position {
    const validated = OstiumSubgraphPositionSchema.parse(raw);
    const size = parseCollateral(validated.positionSizeDai);
    const entryPrice = parsePrice(validated.openPrice);
    const leverage = parseInt(validated.leverage, 10);
    const markPrice = currentPrice ?? entryPrice;

    const notional = size * leverage;
    const pnlMultiplier = validated.buy ? 1 : -1;
    const unrealizedPnl = notional * pnlMultiplier * ((markPrice - entryPrice) / entryPrice);

    return {
      symbol: toUnifiedSymbol(parseInt(validated.pairIndex, 10)),
      side: validated.buy ? 'long' : 'short',
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
      marginRatio: size * markPrice > 0 ? (size * 0.05) / (size * markPrice) : 0,
      timestamp: parseInt(validated.timestamp, 10) * 1000,
      info: {
        ...(validated as unknown as Record<string, unknown>),
        _realizedPnlSource: 'not_available',
      },
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
    const validated = OstiumOpenTradeSchema.parse(raw);
    return {
      id: `${validated.pairIndex}-${validated.index}`,
      symbol: toUnifiedSymbol(validated.pairIndex),
      type: 'market',
      side: validated.buy ? 'buy' : 'sell',
      amount: parseCollateral(validated.positionSizeDai),
      price: parsePrice(validated.openPrice),
      status: 'filled',
      filled: parseCollateral(validated.positionSizeDai),
      remaining: 0,
      reduceOnly: false,
      postOnly: false,
      timestamp: validated.timestamp,
      info: validated as unknown as Record<string, unknown>,
    };
  }

  normalizeOrderBook(_data: unknown): OrderBook {
    throw new NotSupportedError(
      'Ostium is an AMM-based DEX and does not have a traditional order book',
      'NOT_SUPPORTED',
      'ostium'
    );
  }

  normalizeFundingRate(_data: unknown): FundingRate {
    throw new NotSupportedError(
      'Ostium uses rollover fees, not funding rates',
      'NOT_SUPPORTED',
      'ostium'
    );
  }

  normalizeSymbol(exchangeSymbol: string): string {
    const pairIndex = parseInt(exchangeSymbol, 10);
    return toUnifiedSymbol(pairIndex);
  }

  toExchangeSymbol(symbol: string): string {
    return String(toOstiumPairIndex(symbol));
  }
}
