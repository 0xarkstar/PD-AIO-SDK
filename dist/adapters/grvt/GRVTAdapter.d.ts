/**
 * GRVT Exchange Adapter.
 *
 * High-performance hybrid perp DEX (ZKsync hyperchain). This adapter talks to
 * the REAL GRVT API directly (cookie-session auth + POST `full/v1/*` + leg-based
 * EIP-712 order signing delegated to `signing.ts`). It builds + sends correctly
 * signed orders; it does NOT run any auto-execution/trading loop.
 *
 * Auth: `GRVTSDKWrapper.login()` exchanges the API key for a `gravity` session
 * cookie + `X-Grvt-Account-Id` + `sub_account_id`; that sub-account id and the
 * cached instrument meta (instrument_hash + base_decimals) feed `createOrder`.
 *
 * WS verification status (2026-06-11 `/ws/full` repair, truthful-flags rule):
 * - PUBLIC watch* (`watchOrderBook`/`watchTrades`/`watchTicker`) are
 *   live-verified on `wss://market-data.grvt.io/ws/full` (fixtures
 *   tests/fixtures/grvt/ws-capture-B.jsonl) — `has` true.
 * - PRIVATE watch* (`watchPositions`/`watchOrders`/`watchBalance`/
 *   `watchMyTrades`) are implemented (JSON-RPC on the trades host) but NOT
 *   live-verifiable without an API key (`wss://trades.grvt.io/ws/full` per
 *   docs trading_streams.md, unverified keyless) — `has` false until proven.
 */
import { BaseAdapter } from '../base/BaseAdapter.js';
import type { Market, OHLCV, OHLCVParams, OHLCVTimeframe, Order, Position, Balance, OrderBook, Trade, Ticker, FundingRate, OrderRequest, MarketParams, OrderBookParams, TradeParams } from '../../types/common.js';
import type { FeatureMap, IExchangeAdapter } from '../../types/adapter.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { type GRVTAuthConfig } from './GRVTAuth.js';
/**
 * GRVT adapter configuration.
 */
export interface GRVTConfig extends GRVTAuthConfig {
    testnet?: boolean;
    timeout?: number;
    debug?: boolean;
    /** Builder address for fee attribution (enables OrderWithBuilderFee signing). */
    builderCode?: string;
    /** Builder fee (human units) when a builder address is set. */
    builderFee?: string;
    /** Enable/disable builder code (default: true when builderCode is set). */
    builderCodeEnabled?: boolean;
}
/**
 * @deprecated Use GRVTConfig instead
 */
export type GRVTAdapterConfig = GRVTConfig;
/**
 * GRVT Exchange Adapter.
 */
export declare class GRVTAdapter extends BaseAdapter implements IExchangeAdapter {
    readonly id = "grvt";
    readonly name = "GRVT";
    readonly has: Partial<FeatureMap>;
    private readonly sdk;
    private readonly auth;
    private readonly normalizer;
    private ws?;
    protected readonly rateLimiter: RateLimiter;
    private readonly testnet;
    private readonly builderCode?;
    private readonly builderFee?;
    private readonly builderCodeEnabled;
    /** instrument -> { instrument_hash, base_decimals }, cached from fetchMarkets. */
    private instrumentMeta;
    constructor(config?: GRVTAdapterConfig);
    initialize(): Promise<void>;
    fetchMarkets(params?: MarketParams): Promise<Market[]>;
    _fetchTicker(symbol: string): Promise<Ticker>;
    _fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook>;
    _fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]>;
    fetchOHLCV(symbol: string, timeframe?: OHLCVTimeframe, params?: OHLCVParams): Promise<OHLCV[]>;
    private getDefaultDuration;
    _fetchFundingRate(symbol: string): Promise<FundingRate>;
    createOrder(request: OrderRequest): Promise<Order>;
    cancelOrder(orderId: string, _symbol?: string): Promise<Order>;
    cancelAllOrders(_symbol?: string): Promise<Order[]>;
    fetchOpenOrders(symbol?: string): Promise<Order[]>;
    fetchOrderHistory(symbol?: string, _since?: number, limit?: number): Promise<Order[]>;
    fetchMyTrades(symbol?: string, _since?: number, limit?: number): Promise<Trade[]>;
    fetchPositions(symbols?: string[]): Promise<Position[]>;
    fetchBalance(): Promise<Balance[]>;
    /**
     * Resolve a requested book depth to the nearest valid GRVT depth.
     */
    private resolveDepth;
    /**
     * Map the unified TIF + market/post-only intent to the SIGN-enum TIF key.
     * Maker quotes (post_only, non-market) use GOOD_TILL_TIME.
     */
    private resolveSignTimeInForce;
    /**
     * Get cached instrument meta (hash + base_decimals), fetching markets if the
     * cache is cold.
     *
     * @throws {PerpDEXError} if the instrument is unknown after fetching markets.
     */
    private getInstrumentMeta;
    /**
     * The trading sub-account id from the active session.
     *
     * @throws {PerpDEXError} if no session/sub-account id is available.
     */
    private requireSubAccountId;
    /**
     * Generate a GRVT client_order_id: a random integer in [2^63, 2^64-1].
     */
    private generateClientOrderId;
    fetchFundingRateHistory(_symbol: string, _since?: number, _limit?: number): Promise<FundingRate[]>;
    _setLeverage(_symbol: string, _leverage: number): Promise<void>;
    symbolToExchange(symbol: string): string;
    symbolFromExchange(exchangeSymbol: string): string;
    private ensureWebSocket;
    watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook>;
    watchTrades(symbol: string): AsyncGenerator<Trade>;
    watchTicker(symbol: string): AsyncGenerator<Ticker>;
    watchPositions(): AsyncGenerator<Position[]>;
    watchOrders(): AsyncGenerator<Order[]>;
    watchBalance(): AsyncGenerator<Balance[]>;
    watchMyTrades(symbol?: string): AsyncGenerator<Trade>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=GRVTAdapter.d.ts.map