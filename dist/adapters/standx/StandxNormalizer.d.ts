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
import type { FundingRate, Market, OHLCV, OrderBook, Ticker, Trade } from '../../types/common.js';
import type { StandxDepthBook, StandxFundingEntry, StandxKlineHistory, StandxRestTrade, StandxSymbolInfo, StandxSymbolMarket, StandxWSPrice, StandxWSTrade } from './types.js';
export declare class StandxNormalizer {
    /** query_symbol_info entry → unified Market */
    normalizeMarket(raw: StandxSymbolInfo): Market;
    /**
     * query_depth_book payload OR a WS depth_book frame `data` (one live-verified
     * shape). Levels are UNSORTED by venue contract → sorted here. `time` is
     * epoch ms (present on every live capture; synthesized if absent).
     * For WS frames, pass the connection-global frame `seq` as sequenceId.
     */
    normalizeOrderBook(raw: StandxDepthBook, symbol: string, sequenceId?: number): OrderBook;
    /**
     * query_recent_trades entry. The wire carries NO trade id — a deterministic
     * one is synthesized from (time, price, qty, taker side) and tagged in info.
     * Unified side = the TAKER side: is_buyer_taker true → buy.
     */
    normalizeRestTrade(raw: StandxRestTrade, symbol: string): Trade;
    /** WS public_trade frame data — side + epoch ms time + int id on the wire */
    normalizeWSTrade(raw: StandxWSTrade, symbol: string): Trade;
    /**
     * query_symbol_market → unified Ticker. Real bid/ask from bid1/ask1
     * (strings); 24h stats are NUMBERS on the wire; price_change_pct is
     * ALREADY percent units (1.076 = +1.076%) — passthrough.
     */
    normalizeTicker(raw: StandxSymbolMarket, symbol: string): Ticker;
    /**
     * WS price channel → unified Ticker. The channel carries NO 24h stats —
     * high/low/open/close fall back to last with change/percentage/volumes 0,
     * explicitly TAGGED in info (never silently fabricated). bid/ask are real
     * (spread tuple = [bid, ask]); `time` is NANOSECOND-precision ISO → ms.
     */
    normalizeWSTicker(raw: StandxWSPrice, symbol: string): Ticker;
    /**
     * Current funding from query_symbol_market (venue-authoritative:
     * funding_rate + ISO next_funding_time + mark/index). FRACTIONAL hourly
     * rate — passthrough, no conversion.
     */
    normalizeFundingRate(raw: StandxSymbolMarket, symbol: string): FundingRate;
    /** query_funding_rates entry — fractional hourly rate, ISO settlement time */
    normalizeFundingRateHistoryEntry(raw: StandxFundingEntry, symbol: string): FundingRate;
    /**
     * kline/history TradingView-UDF columns → unified OHLCV rows.
     * s:"ok" → zip columns ([t*1000, o, h, l, c, v]); s:"no_data" → [];
     * any other status → throw (UDF error payload).
     */
    normalizeOHLCV(raw: StandxKlineHistory): OHLCV[];
}
//# sourceMappingURL=StandxNormalizer.d.ts.map