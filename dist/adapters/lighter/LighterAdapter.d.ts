/**
 * Lighter exchange adapter implementation
 *
 * Supports two authentication modes:
 * 1. HMAC mode (legacy): Uses apiKey + apiSecret for HMAC-SHA256 signing
 * 2. WASM mode (recommended): Uses apiPrivateKey for WASM-based signing
 *
 * WASM signing is cross-platform and requires no native dependencies.
 * Install @oraichain/lighter-ts-sdk for full trading functionality.
 */
import { BaseAdapter } from '../base/BaseAdapter.js';
import type { Market, Order, Position, Balance, OrderBook, Trade, Ticker, FundingRate, OrderRequest, MarketParams, OrderBookParams, TradeParams } from '../../types/common.js';
import type { FeatureMap } from '../../types/adapter.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import type { LighterConfig } from './types.js';
export type { LighterConfig } from './types.js';
/**
 * Lighter exchange adapter
 *
 * High-performance order book DEX on zkProof L2
 *
 * @example
 * ```typescript
 * // WASM mode (recommended - full trading, cross-platform)
 * const lighter = new LighterAdapter({
 *   apiPrivateKey: '0x...',
 *   testnet: true,
 * });
 *
 * // HMAC mode (legacy)
 * const lighterLegacy = new LighterAdapter({
 *   apiKey: 'your-api-key',
 *   apiSecret: 'your-api-secret',
 * });
 * ```
 */
export declare class LighterAdapter extends BaseAdapter {
    readonly id = "lighter";
    readonly name = "Lighter";
    readonly has: Partial<FeatureMap>;
    private readonly apiUrl;
    private readonly wsUrl;
    private readonly testnet;
    private readonly chainId;
    private readonly apiKey?;
    private readonly apiSecret?;
    private readonly apiPrivateKey?;
    private signer;
    private nonceManager;
    private readonly accountIndex;
    private readonly apiKeyIndex;
    protected readonly rateLimiter: RateLimiter;
    protected readonly httpClient: HTTPClient;
    private normalizer;
    private wsManager;
    private marketIdCache;
    private marketMetadataCache;
    constructor(config?: LighterConfig);
    /**
     * Check if WASM signing is available and initialized
     * @deprecated Use hasWasmSigning instead
     */
    get hasFFISigning(): boolean;
    /**
     * Check if WASM signing is available and initialized
     */
    get hasWasmSigning(): boolean;
    /**
     * Check if any authentication is configured
     */
    get hasAuthentication(): boolean;
    initialize(): Promise<void>;
    disconnect(): Promise<void>;
    fetchMarkets(params?: MarketParams): Promise<Market[]>;
    fetchTicker(symbol: string): Promise<Ticker>;
    fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook>;
    fetchTrades(symbol: string, params?: TradeParams): Promise<Trade[]>;
    fetchFundingRate(symbol: string): Promise<FundingRate>;
    fetchFundingRateHistory(symbol: string, since?: number, limit?: number): Promise<FundingRate[]>;
    createOrder(request: OrderRequest): Promise<Order>;
    /**
     * Create order using WASM signing
     */
    private createOrderWasm;
    /**
     * Create order using HMAC signing (legacy)
     */
    private createOrderHMAC;
    cancelOrder(orderId: string, symbol?: string): Promise<Order>;
    /**
     * Cancel order using WASM signing
     */
    private cancelOrderWasm;
    /**
     * Cancel order using HMAC signing (legacy)
     */
    private cancelOrderHMAC;
    cancelAllOrders(symbol?: string): Promise<Order[]>;
    /**
     * Cancel all orders using WASM signing
     */
    private cancelAllOrdersWasm;
    /**
     * Cancel all orders using HMAC signing (legacy)
     */
    private cancelAllOrdersHMAC;
    /**
     * Withdraw collateral from trading account
     *
     * Requires WASM signing - HMAC mode does not support withdrawals.
     *
     * @param collateralIndex - Collateral type index (0 = USDC)
     * @param amount - Amount to withdraw in base units
     * @param destinationAddress - Ethereum address to withdraw to
     * @returns Transaction hash
     *
     * @example
     * ```typescript
     * // Withdraw 100 USDC
     * const txHash = await lighter.withdrawCollateral(
     *   0,          // USDC collateral index
     *   100000000n, // 100 USDC (6 decimals)
     *   '0x...'     // Your wallet address
     * );
     * ```
     */
    withdrawCollateral(collateralIndex: number, amount: bigint, destinationAddress: string): Promise<string>;
    /**
     * Handle transaction errors and auto-resync nonce if needed
     */
    private handleTransactionError;
    fetchPositions(symbols?: string[]): Promise<Position[]>;
    fetchBalance(): Promise<Balance[]>;
    fetchOpenOrders(symbol?: string): Promise<Order[]>;
    setLeverage(symbol: string, leverage: number): Promise<void>;
    /**
     * Fetch order history
     */
    fetchOrderHistory(symbol?: string, since?: number, limit?: number): Promise<Order[]>;
    /**
     * Fetch user trade history
     */
    fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<Trade[]>;
    symbolToExchange(symbol: string): string;
    symbolFromExchange(exchangeSymbol: string): string;
    /**
     * Convert amount to base units
     */
    private toBaseUnits;
    /**
     * Convert price to price units
     */
    private toPriceUnits;
    /**
     * Map unified order type to Lighter order type
     */
    private mapOrderType;
    /**
     * Map unified time in force to Lighter time in force
     */
    private mapTimeInForce;
    /**
     * Convert unified order request to Lighter format (for HMAC mode)
     */
    private convertOrderRequest;
    /**
     * Make HTTP request to Lighter API using HTTPClient
     */
    protected request<T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: Record<string, unknown>): Promise<T>;
    /**
     * Add HMAC authentication headers
     * Note: This is now async to support browser Web Crypto API
     */
    private addHMACHeaders;
    watchOrderBook(symbol: string, limit?: number): AsyncGenerator<OrderBook>;
    watchTrades(symbol: string): AsyncGenerator<Trade>;
    watchPositions(): AsyncGenerator<Position[]>;
    watchOrders(): AsyncGenerator<Order[]>;
    watchTicker(symbol: string): AsyncGenerator<Ticker>;
    watchBalance(): AsyncGenerator<Balance[]>;
    /**
     * Watch user trades (fills) in real-time
     *
     * @param symbol - Optional symbol filter
     * @returns AsyncGenerator yielding Trade updates
     *
     * @example
     * ```typescript
     * for await (const trade of adapter.watchMyTrades('BTC/USDT:USDT')) {
     *   console.log('Fill:', trade.symbol, trade.side, trade.amount, '@', trade.price);
     * }
     * ```
     */
    watchMyTrades(symbol?: string): AsyncGenerator<Trade>;
    /**
     * Build authenticated subscription object for WebSocket
     */
    private buildAuthenticatedSubscription;
    /**
     * Get authentication identifier for channel naming
     */
    private getAuthIdentifier;
    /**
     * Generate HMAC signature for authenticated requests
     * Note: This is now async to support browser Web Crypto API
     */
    private generateSignature;
    /**
     * Resync nonce with server (useful after errors)
     */
    resyncNonce(): Promise<void>;
    /**
     * Ping the server to check connectivity
     *
     * @returns Response time in milliseconds
     */
    ping(): Promise<number>;
    /**
     * Get adapter status including connection health
     */
    getStatus(): Promise<{
        ready: boolean;
        authenticated: boolean;
        authMode: 'wasm' | 'hmac' | 'none';
        wsConnected: boolean;
        network: 'mainnet' | 'testnet';
        latencyMs?: number;
        rateLimiter: {
            availableTokens: number;
            queueLength: number;
        };
    }>;
    /**
     * Check if the adapter is healthy and ready for trading
     */
    isHealthy(): Promise<boolean>;
}
//# sourceMappingURL=LighterAdapter.d.ts.map