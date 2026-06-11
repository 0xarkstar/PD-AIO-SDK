/**
 * StandX Response Normalizer
 *
 * Wire-unit rules (all live-verified 2026-06-11):
 * - Depth levels are UNSORTED by venue contract (documented) → ALWAYS sorted
 *   here (bids DESC, asks ASC). REST query_depth_book and the WS depth_book
 *   frame `data` share ONE live-verified shape, so one decoder serves both
 *   (the WS path passes the frame `seq` through as sequenceId).
 * - Timestamps are MIXED: REST trades/funding/symbol_market `time` is
 *   ISO-8601; the WS price channel is NANOSECOND-precision ISO; WS
 *   public_trade / depth_book `time` is epoch ms int. All emerge as 13-digit ms.
 * - REST trades expose is_buyer_taker (no side); WS trades expose side (no
 *   is_buyer_taker) — unified side derives from whichever is present.
 *   REST trades carry NO id → a deterministic id is synthesized and tagged.
 * - Funding is FRACTIONAL per HOURLY interval (passthrough; 23/23 captured
 *   gaps exactly 1.0h) — fundingIntervalHours = 1, NO unit conversion.
 * - Klines are TradingView-UDF COLUMN arrays with `t` in SECONDS.
 * - Markets: symbols are spelled "BTC-USD" while margin/settlement is the
 *   DUSD stablecoin (quote_asset field) — the unified symbol follows the
 *   venue spelling ("BTC/USD:USD"); raw DUSD fields stay in info.
 */

import type {
  FundingRate,
  Market,
  OHLCV,
  OrderBook,
  Ticker,
  Trade,
} from '../../types/common.js';
import { PerpDEXError } from '../../types/errors.js';
import { STANDX_FUNDING_INTERVAL_HOURS } from './constants.js';
import { decimalsToTickSize, isoToMs, toUnifiedSymbol } from './utils.js';
import type {
  StandxDepthBook,
  StandxFundingEntry,
  StandxKlineHistory,
  StandxRestTrade,
  StandxSymbolInfo,
  StandxSymbolMarket,
  StandxWSPrice,
  StandxWSTrade,
} from './types.js';
import {
  StandxDepthBookSchema,
  StandxFundingEntrySchema,
  StandxKlineHistorySchema,
  StandxRestTradeSchema,
  StandxSymbolInfoSchema,
  StandxSymbolMarketSchema,
  StandxWSPriceSchema,
  StandxWSTradeSchema,
} from './types.js';

export class StandxNormalizer {
  /** query_symbol_info entry → unified Market */
  normalizeMarket(raw: StandxSymbolInfo): Market {
    const validated = StandxSymbolInfoSchema.parse(raw);
    const unified = toUnifiedSymbol(validated.symbol);
    const [base, quote] = unified.split(/[/:]/);

    return {
      id: validated.symbol,
      symbol: unified,
      base: validated.base_asset || base || '',
      // Venue spelling is "-USD"; the actual margin/settlement asset is DUSD
      // (validated.quote_asset, kept in info) — unified fields follow the
      // venue symbol spelling so symbol === `${base}/${quote}:${settle}` holds.
      quote: quote ?? 'USD',
      settle: quote ?? 'USD',
      active: validated.status === 'trading',
      minAmount: parseFloat(validated.min_order_qty),
      maxAmount: parseFloat(validated.max_order_qty),
      pricePrecision: validated.price_tick_decimals,
      amountPrecision: validated.qty_tick_decimals,
      priceTickSize: decimalsToTickSize(validated.price_tick_decimals),
      amountStepSize: decimalsToTickSize(validated.qty_tick_decimals),
      makerFee: parseFloat(validated.maker_fee),
      takerFee: parseFloat(validated.taker_fee),
      maxLeverage: parseFloat(validated.max_leverage),
      fundingIntervalHours: STANDX_FUNDING_INTERVAL_HOURS,
      info: validated as unknown as Record<string, unknown>,
    };
  }

  /**
   * query_depth_book payload OR a WS depth_book frame `data` (one live-verified
   * shape). Levels are UNSORTED by venue contract → sorted here. `time` is
   * epoch ms (present on every live capture; synthesized if absent).
   * For WS frames, pass the connection-global frame `seq` as sequenceId.
   */
  normalizeOrderBook(raw: StandxDepthBook, symbol: string, sequenceId?: number): OrderBook {
    const validated = StandxDepthBookSchema.parse(raw);

    const bids = validated.bids
      .map(([p, q]) => [parseFloat(p), parseFloat(q)] as [number, number])
      .sort((a, b) => b[0] - a[0]);
    const asks = validated.asks
      .map(([p, q]) => [parseFloat(p), parseFloat(q)] as [number, number])
      .sort((a, b) => a[0] - b[0]);

    return {
      symbol,
      timestamp: validated.time ?? Date.now(),
      bids,
      asks,
      sequenceId,
      exchange: 'standx',
    };
  }

  /**
   * query_recent_trades entry. The wire carries NO trade id — a deterministic
   * one is synthesized from (time, price, qty, taker side) and tagged in info.
   * Unified side = the TAKER side: is_buyer_taker true → buy.
   */
  normalizeRestTrade(raw: StandxRestTrade, symbol: string): Trade {
    const validated = StandxRestTradeSchema.parse(raw);
    const price = parseFloat(validated.price);
    const amount = parseFloat(validated.qty);
    const timestamp = isoToMs(validated.time);
    const side = validated.is_buyer_taker ? 'buy' : 'sell';

    return {
      id: `${timestamp}-${validated.price}-${validated.qty}-${side}`,
      symbol,
      side,
      price,
      amount,
      cost: price * amount,
      timestamp,
      info: {
        ...(validated as unknown as Record<string, unknown>),
        _idSource: 'synthesized',
      },
    };
  }

  /** WS public_trade frame data — side + epoch ms time + int id on the wire */
  normalizeWSTrade(raw: StandxWSTrade, symbol: string): Trade {
    const validated = StandxWSTradeSchema.parse(raw);
    const price = parseFloat(validated.price);
    const amount = parseFloat(validated.qty);

    return {
      id: String(validated.id),
      symbol,
      side: validated.side,
      price,
      amount,
      cost: price * amount,
      timestamp: validated.time,
      info: validated as unknown as Record<string, unknown>,
    };
  }

  /**
   * query_symbol_market → unified Ticker. Real bid/ask from bid1/ask1
   * (strings); 24h stats are NUMBERS on the wire; price_change_pct is
   * ALREADY percent units (1.076 = +1.076%) — passthrough.
   */
  normalizeTicker(raw: StandxSymbolMarket, symbol: string): Ticker {
    const validated = StandxSymbolMarketSchema.parse(raw);
    const last = parseFloat(validated.last_price);

    return {
      symbol,
      last,
      bid: parseFloat(validated.bid1),
      ask: parseFloat(validated.ask1),
      high: validated.high_price_24h,
      low: validated.low_price_24h,
      open: validated.open_price_24h,
      close: last,
      change: validated.price_change,
      percentage: validated.price_change_pct,
      baseVolume: validated.volume_24h,
      quoteVolume: validated.volume_quote_24h,
      timestamp: isoToMs(validated.time),
      info: validated as unknown as Record<string, unknown>,
    };
  }

  /**
   * WS price channel → unified Ticker. The channel carries NO 24h stats —
   * high/low/open/close fall back to last with change/percentage/volumes 0,
   * explicitly TAGGED in info (never silently fabricated). bid/ask are real
   * (spread tuple = [bid, ask]); `time` is NANOSECOND-precision ISO → ms.
   */
  normalizeWSTicker(raw: StandxWSPrice, symbol: string): Ticker {
    const validated = StandxWSPriceSchema.parse(raw);
    const last = parseFloat(validated.last_price);

    return {
      symbol,
      last,
      bid: parseFloat(validated.spread[0]),
      ask: parseFloat(validated.spread[1]),
      high: last,
      low: last,
      open: last,
      close: last,
      change: 0,
      percentage: 0,
      baseVolume: 0,
      quoteVolume: 0,
      timestamp: isoToMs(validated.time),
      info: {
        ...(validated as unknown as Record<string, unknown>),
        _24hStatsSource: 'unavailable_on_ws_price_channel',
      },
    };
  }

  /**
   * Current funding from query_symbol_market (venue-authoritative:
   * funding_rate + ISO next_funding_time + mark/index). FRACTIONAL hourly
   * rate — passthrough, no conversion.
   */
  normalizeFundingRate(raw: StandxSymbolMarket, symbol: string): FundingRate {
    const validated = StandxSymbolMarketSchema.parse(raw);
    const nextFundingTimestamp = isoToMs(validated.next_funding_time);

    return {
      symbol,
      fundingRate: parseFloat(validated.funding_rate),
      // Hourly cadence: the current interval opened one interval before next
      fundingTimestamp: nextFundingTimestamp - STANDX_FUNDING_INTERVAL_HOURS * 3_600_000,
      nextFundingTimestamp,
      markPrice: parseFloat(validated.mark_price),
      indexPrice: parseFloat(validated.index_price),
      fundingIntervalHours: STANDX_FUNDING_INTERVAL_HOURS,
      info: validated as unknown as Record<string, unknown>,
    };
  }

  /** query_funding_rates entry — fractional hourly rate, ISO settlement time */
  normalizeFundingRateHistoryEntry(raw: StandxFundingEntry, symbol: string): FundingRate {
    const validated = StandxFundingEntrySchema.parse(raw);
    const fundingTimestamp = isoToMs(validated.time);

    return {
      symbol,
      fundingRate: parseFloat(validated.funding_rate),
      fundingTimestamp,
      nextFundingTimestamp: fundingTimestamp + STANDX_FUNDING_INTERVAL_HOURS * 3_600_000,
      markPrice: parseFloat(validated.mark_price),
      indexPrice: parseFloat(validated.index_price),
      fundingIntervalHours: STANDX_FUNDING_INTERVAL_HOURS,
      info: validated as unknown as Record<string, unknown>,
    };
  }

  /**
   * kline/history TradingView-UDF columns → unified OHLCV rows.
   * s:"ok" → zip columns ([t*1000, o, h, l, c, v]); s:"no_data" → [];
   * any other status → throw (UDF error payload).
   */
  normalizeOHLCV(raw: StandxKlineHistory): OHLCV[] {
    const validated = StandxKlineHistorySchema.parse(raw);

    if (validated.s === 'no_data') {
      return [];
    }
    if (validated.s !== 'ok') {
      throw new PerpDEXError(
        `Kline history error status: ${validated.s}${validated.errmsg ? ` (${validated.errmsg})` : ''}`,
        'INVALID_RESPONSE',
        'standx'
      );
    }

    const { t, o, h, l, c, v } = validated;
    if (!t || !o || !h || !l || !c || !v) {
      throw new PerpDEXError(
        'Kline history s:"ok" but column arrays missing',
        'INVALID_RESPONSE',
        'standx'
      );
    }

    return t.map(
      (seconds, i) => [seconds * 1000, o[i]!, h[i]!, l[i]!, c[i]!, v[i]!] as OHLCV
    );
  }
}
