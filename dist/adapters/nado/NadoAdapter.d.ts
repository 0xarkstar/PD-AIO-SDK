/**
 * Nado Exchange Adapter
 *
 * Implements IExchangeAdapter for Nado DEX on Ink L2
 * Built by Kraken team with 5-15ms latency
 *
 * ## ⚠️ IMPORTANT: Initialization Required
 *
 * The Nado adapter **MUST** be initialized before using trading methods.
 * The `initialize()` method performs critical setup:
 *
 * 1. **Fetches contract addresses** - Required for order signing
 * 2. **Fetches current nonce** - Required for EIP-712 signature sequencing
 * 3. **Preloads markets** - Builds product ID → symbol mappings
 * 4. **Initializes WebSocket** - Sets up real-time streaming
 *
 * ### Required Initialization Flow
 *
 * ```typescript
 * import { createExchange } from 'pd-aio-sdk';
 * import { Wallet } from 'ethers';
 *
 * const wallet = new Wallet(process.env.NADO_PRIVATE_KEY);
 * const adapter = createExchange('nado', {
 *   wallet,       // or privateKey: '0x...'
 *   testnet: true // Use Ink testnet
 * });
 *
 * // CRITICAL: Must call initialize() before trading!
 * await adapter.initialize();
 *
 * // Now trading methods work:
 * const order = await adapter.createOrder({
 *   symbol: 'BTC/USDT:USDT',
 *   type: 'limit',
 *   side: 'buy',
 *   amount: 0.01,
 *   price: 50000
 * });
 *
 * // Cleanup when done
 * await adapter.disconnect();
 * ```
 *
 * ### What Happens Without Initialization?
 *
 * If you call trading methods without initializing:
 * - `createOrder()` → Throws "Contracts info not loaded" (NO_CONTRACTS)
 * - `cancelOrder()` → Throws "Contracts info not loaded" (NO_CONTRACTS)
 * - `cancelAllOrders()` → Throws "Contracts info not loaded" (NO_CONTRACTS)
 *
 * Market data methods (fetchMarkets, fetchTicker, etc.) may work without
 * initialization, but it's recommended to always initialize first.
 *
 * ### Configuration Options
 *
 * ```typescript
 * interface NadoConfig {
 *   wallet?: Wallet;           // ethers.js Wallet instance
 *   privateKey?: string;       // Alternative: hex private key (0x...)
 *   testnet?: boolean;         // true = Ink testnet, false = mainnet
 * }
 * ```
 *
 * @see https://docs.nado.xyz - Nado official documentation
 */
import type { Balance, FeatureMap, FundingRate, Market, MarketParams, Order, OrderBook, OrderBookParams, OrderRequest, Position, Ticker, Trade, TradeParams } from '../../types/index.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import type { NadoConfig } from './types.js';
export declare class NadoAdapter extends BaseAdapter {
    readonly id = "nado";
    readonly name = "Nado";
    readonly has: Partial<FeatureMap>;
    private apiUrl;
    private wsUrl;
    private wsManager?;
    protected rateLimiter: RateLimiter;
    private auth?;
    private apiClient;
    private normalizer;
    private chainId;
    private contractsInfo?;
    private productMappings;
    constructor(config?: NadoConfig);
    initialize(): Promise<void>;
    disconnect(): Promise<void>;
    /**
     * Connect to Nado exchange
     * Alias for initialize() to maintain consistency with other adapters
     */
    connect(): Promise<void>;
    /**
     * Fetch contracts information
     */
    private fetchContracts;
    /**
     * Fetch current nonce for the wallet
     *
     * Nado returns two nonce types as strings (64-bit integers):
     * - tx_nonce: For non-order executions (withdraw, liquidate, etc.)
     * - order_nonce: For place_order executions
     */
    private fetchCurrentNonce;
    /**
     * Get product mapping by symbol
     */
    private getProductMapping;
    /**
     * Require authentication for private methods
     * @throws {PerpDEXError} if auth is not configured
     */
    private requireAuth;
    fetchMarkets(params?: MarketParams): Promise<Market[]>;
    /**
     * Internal method to fetch markets from API (bypasses cache)
     *
     * Uses the /query?type=symbols endpoint which returns market metadata
     */
    protected fetchMarketsFromAPI(_params?: MarketParams): Promise<Market[]>;
    fetchTicker(symbol: string): Promise<Ticker>;
    fetchOrderBook(symbol: string, params?: OrderBookParams): Promise<OrderBook>;
    fetchTrades(_symbol: string, _params?: TradeParams): Promise<Trade[]>;
    fetchFundingRate(symbol: string): Promise<FundingRate>;
    createOrder(request: OrderRequest): Promise<Order>;
    cancelOrder(orderId: string, _symbol?: string): Promise<Order>;
    cancelAllOrders(symbol?: string): Promise<Order[]>;
    fetchPositions(_symbols?: string[]): Promise<Position[]>;
    fetchBalance(): Promise<Balance[]>;
    /**
     * Fetch open orders
     *
     * Retrieves all open (unfilled) orders for the authenticated wallet.
     * Can be filtered by symbol to get orders for a specific trading pair.
     *
     * @param symbol - Optional symbol to filter orders (e.g., "BTC/USDT:USDT")
     * @returns Array of open orders
     * @throws {PerpDEXError} If wallet is not initialized
     *
     * @example
     * ```typescript
     * // Get all open orders
     * const allOrders = await adapter.fetchOpenOrders();
     *
     * // Get open orders for specific symbol
     * const btcOrders = await adapter.fetchOpenOrders('BTC/USDT:USDT');
     * ```
     */
    fetchOpenOrders(symbol?: string): Promise<Order[]>;
    watchOrderBook(symbol: string): AsyncGenerator<OrderBook>;
    watchPositions(): AsyncGenerator<Position[]>;
    watchOrders(): AsyncGenerator<Order[]>;
    watchTrades(symbol: string): AsyncGenerator<Trade>;
    /**
     * Watch balance updates in real-time via WebSocket
     *
     * Streams balance changes for the authenticated wallet's subaccount.
     * Updates are pushed whenever deposits, withdrawals, or P&L changes occur.
     *
     * @returns Async generator yielding balance arrays
     * @throws {PerpDEXError} If WebSocket is not initialized
     *
     * @example
     * ```typescript
     * for await (const balances of adapter.watchBalance()) {
     *   console.log('Balances updated:', balances);
     *   // [{ asset: 'USDT', free: 1000, used: 200, total: 1200 }]
     * }
     * ```
     */
    watchBalance(): AsyncGenerator<Balance[]>;
    protected symbolToExchange(symbol: string): string;
    protected symbolFromExchange(exchangeSymbol: string): string;
    fetchFundingRateHistory(_symbol: string, _since?: number, _limit?: number): Promise<FundingRate[]>;
    fetchOrderHistory(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]>;
    fetchMyTrades(_symbol?: string, _since?: number, _limit?: number): Promise<Trade[]>;
    setLeverage(_symbol: string, _leverage: number): Promise<void>;
}
//# sourceMappingURL=NadoAdapter.d.ts.map