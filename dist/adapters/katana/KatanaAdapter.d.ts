/**
 * Katana Network Exchange Adapter
 *
 * Perpetual futures DEX on Katana L2 (chainId 747474)
 *
 * Features:
 * - Dual auth: HMAC-SHA256 + EIP-712
 * - Cross-margin only
 * - 8-decimal zero-padded precision
 * - UUID v1 nonces
 * - Per-market leverage via initialMarginFractionOverride
 *
 * @see https://api-docs-v1-perps.katana.network/#introduction
 */
import { BaseAdapter } from '../base/BaseAdapter.js';
import type { Market, OHLCV, OHLCVParams, Order, Position, Balance, OrderBook, Trade, Ticker, FundingRate, OrderRequest, MarketParams, OrderBookParams, TradeParams } from '../../types/common.js';
import type { FeatureMap } from '../../types/adapter.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { type KatanaAuthConfig } from './KatanaAuth.js';
/**
 * Katana adapter configuration
 */
export interface KatanaConfig extends KatanaAuthConfig {
    testnet?: boolean;
    timeout?: number;
    debug?: boolean;
}
/**
 * Katana Exchange Adapter
 */
export declare class KatanaAdapter extends BaseAdapter {
    readonly id = "katana";
    readonly name = "Katana";
    readonly has: Partial<FeatureMap>;
    private readonly auth;
    protected readonly rateLimiter: RateLimiter;
    private readonly http;
    private readonly testnet;
    private readonly baseUrl;
    constructor(config?: KatanaConfig);
    protected symbolToExchange(symbol: string): string;
    protected symbolFromExchange(exchangeSymbol: string): string;
    initialize(): Promise<void>;
    fetchMarkets(_params?: MarketParams): Promise<Market[]>;
    _fetchTicker(symbol: string): Promise<Ticker>;
    _fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook>;
    _fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]>;
    fetchOHLCV(symbol: string, timeframe?: string, params?: OHLCVParams): Promise<OHLCV[]>;
    _fetchFundingRate(symbol: string): Promise<FundingRate>;
    fetchFundingRateHistory(symbol: string, since?: number, limit?: number): Promise<FundingRate[]>;
    createOrder(request: OrderRequest): Promise<Order>;
    cancelOrder(orderId: string, symbol?: string): Promise<Order>;
    cancelAllOrders(symbol?: string): Promise<Order[]>;
    fetchOpenOrders(symbol?: string): Promise<Order[]>;
    fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]>;
    fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]>;
    fetchPositions(symbols?: string[]): Promise<Position[]>;
    fetchBalance(): Promise<Balance[]>;
    _setLeverage(symbol: string, leverage: number): Promise<void>;
    /**
     * Emergency close all positions and withdraw
     *
     * Maps to DELETE /v1/wallets/{wallet}
     * Atomically: cancels all orders, closes all positions, initiates full withdrawal
     */
    emergencyCloseAll(): Promise<void>;
    private publicGet;
    private privateGet;
    private privatePost;
    private privateDelete;
    private buildPath;
}
//# sourceMappingURL=KatanaAdapter.d.ts.map