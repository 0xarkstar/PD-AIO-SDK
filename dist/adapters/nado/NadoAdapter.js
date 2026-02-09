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
import { Wallet, ethers } from 'ethers';
import { PerpDEXError, ExchangeUnavailableError, InvalidOrderError } from '../../types/errors.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { WebSocketManager } from '../../websocket/index.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { NADO_API_URLS, NADO_CHAIN_ID, NADO_RATE_LIMITS, NADO_WS_CONFIG, NADO_REQUEST_CONFIG, NADO_ORDER_SIDES, NADO_QUERY_TYPES, NADO_EXECUTE_TYPES, NADO_WS_CHANNELS, } from './constants.js';
import { NadoOrderBookSchema, NadoOrderSchema, NadoPositionSchema, NadoBalanceSchema, NadoTickerSchema, NadoContractsSchema, } from './types.js';
import { NadoAuth } from './NadoAuth.js';
import { NadoAPIClient } from './NadoAPIClient.js';
import { NadoNormalizer } from './NadoNormalizer.js';
import { NadoSubscriptionBuilder } from './subscriptions.js';
export class NadoAdapter extends BaseAdapter {
    id = 'nado';
    name = 'Nado';
    has = {
        // Market Data
        fetchMarkets: true,
        fetchTicker: true,
        fetchOrderBook: true,
        fetchTrades: false, // REST API not available, use watchTrades for WebSocket
        fetchFundingRate: true,
        fetchFundingRateHistory: false,
        // Trading
        createOrder: true,
        cancelOrder: true,
        cancelAllOrders: true,
        createBatchOrders: false,
        cancelBatchOrders: true,
        editOrder: false,
        // Account History
        fetchOrderHistory: true,
        fetchMyTrades: false,
        fetchDeposits: false,
        fetchWithdrawals: false,
        // Positions & Balance
        fetchPositions: true,
        fetchBalance: true,
        setLeverage: false, // Unified margin system
        setMarginMode: false,
        // WebSocket
        watchOrderBook: true,
        watchTrades: true,
        watchTicker: false,
        watchPositions: true,
        watchOrders: true,
        watchBalance: true,
        watchFundingRate: false,
        // Advanced
        twapOrders: false,
        vaultTrading: false,
        // Additional Info
        fetchUserFees: true,
        fetchPortfolio: false,
        fetchRateLimitStatus: false,
    };
    apiUrl;
    wsUrl;
    wsManager;
    rateLimiter;
    // New component instances
    auth;
    apiClient;
    normalizer;
    // Nado-specific state
    chainId;
    contractsInfo;
    productMappings = new Map();
    constructor(config = {}) {
        super(config);
        // Set API URLs
        const urls = config.testnet ? NADO_API_URLS.testnet : NADO_API_URLS.mainnet;
        this.apiUrl = urls.rest;
        this.wsUrl = urls.ws;
        // Set chain ID
        this.chainId = config.testnet ? NADO_CHAIN_ID.testnet : NADO_CHAIN_ID.mainnet;
        // Initialize rate limiter
        this.rateLimiter = new RateLimiter({
            maxTokens: NADO_RATE_LIMITS.queriesPerMinute,
            windowMs: 60000, // 1 minute
            weights: {
                query: 1,
                execute: 2,
            },
            exchange: 'nado',
        });
        // Initialize wallet and auth if credentials provided
        // (optional for public API access)
        if (config.wallet || config.privateKey) {
            const wallet = config.wallet || new Wallet(config.privateKey);
            this.auth = new NadoAuth(wallet, this.chainId);
        }
        this.apiClient = new NadoAPIClient({
            apiUrl: this.apiUrl,
            rateLimiter: this.rateLimiter,
            timeout: NADO_REQUEST_CONFIG.timeout,
        });
        this.normalizer = new NadoNormalizer();
    }
    // ===========================================================================
    // Connection Management
    // ===========================================================================
    async initialize() {
        if (this._isReady) {
            this.debug('Already initialized');
            return;
        }
        try {
            this.debug('Initializing Nado adapter...');
            // 1. Fetch contracts info (contains chain ID and endpoint addresses)
            this.contractsInfo = await this.fetchContracts();
            this.debug('Contracts info fetched', {
                chainId: this.contractsInfo.chain_id,
                endpoint: this.contractsInfo.endpoint_addr,
            });
            // 2. Fetch current nonce (only if auth is available)
            if (this.auth) {
                await this.fetchCurrentNonce();
                this.debug('Current nonce fetched', { nonce: this.auth.getCurrentNonce() });
            }
            else {
                this.debug('Skipping nonce fetch (no auth credentials)');
            }
            // 3. Preload markets and build product mappings
            await this.preloadMarkets();
            this.debug('Markets preloaded', { count: this.productMappings.size });
            // 4. Initialize WebSocket manager
            this.wsManager = new WebSocketManager({
                url: this.wsUrl,
                reconnect: {
                    enabled: true,
                    initialDelay: NADO_WS_CONFIG.reconnectDelay,
                    maxDelay: NADO_WS_CONFIG.maxReconnectDelay,
                    maxAttempts: NADO_WS_CONFIG.reconnectAttempts,
                    multiplier: 2,
                    jitter: 0.1,
                },
                heartbeat: {
                    enabled: true,
                    interval: NADO_WS_CONFIG.pingInterval,
                    timeout: NADO_WS_CONFIG.pongTimeout,
                },
            });
            this._isReady = true;
            this.debug('Nado adapter initialized successfully');
        }
        catch (error) {
            this.error('Failed to initialize Nado adapter', error);
            throw new ExchangeUnavailableError(`Nado initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'INIT_FAILED', this.id, error);
        }
    }
    async disconnect() {
        this.debug('Disconnecting from Nado...');
        // Close WebSocket
        if (this.wsManager) {
            await this.wsManager.disconnect();
            this.wsManager = undefined;
        }
        // Clear product mappings
        this.productMappings.clear();
        // Call parent disconnect for resource cleanup
        await super.disconnect();
        this.debug('Disconnected from Nado');
    }
    /**
     * Connect to Nado exchange
     * Alias for initialize() to maintain consistency with other adapters
     */
    async connect() {
        return this.initialize();
    }
    // ===========================================================================
    // Private Helper Methods
    // ===========================================================================
    /**
     * Fetch contracts information
     */
    async fetchContracts() {
        const data = await this.apiClient.query(NADO_QUERY_TYPES.CONTRACTS);
        return NadoContractsSchema.parse(data);
    }
    /**
     * Fetch current nonce for the wallet
     *
     * Nado returns two nonce types as strings (64-bit integers):
     * - tx_nonce: For non-order executions (withdraw, liquidate, etc.)
     * - order_nonce: For place_order executions
     */
    async fetchCurrentNonce() {
        // This method is only called from initialize() when this.auth exists
        if (!this.auth)
            return;
        const data = await this.apiClient.query(NADO_QUERY_TYPES.NONCES, {
            address: this.auth.getAddress(),
        });
        // Use order_nonce for order operations (parse string to handle 64-bit values)
        this.auth.setNonce(data.order_nonce);
    }
    /**
     * Get product mapping by symbol
     */
    getProductMapping(symbol) {
        const mapping = this.productMappings.get(symbol);
        if (!mapping) {
            throw new InvalidOrderError(`Product mapping not found for ${symbol}`, 'MAPPING_NOT_FOUND', this.id);
        }
        return mapping;
    }
    /**
     * Require authentication for private methods
     * @throws {PerpDEXError} if auth is not configured
     */
    requireAuth() {
        if (!this.auth) {
            throw new PerpDEXError('Authentication required. Provide wallet or privateKey in config.', 'MISSING_CREDENTIALS', this.id);
        }
        return this.auth;
    }
    // ===========================================================================
    // Market Data - Public Methods
    // ===========================================================================
    async fetchMarkets(params) {
        // Check cache first
        const cached = this.getPreloadedMarkets();
        if (cached) {
            this.debug('Returning cached markets', { count: cached.length });
            return cached;
        }
        return this.fetchMarketsFromAPI(params);
    }
    /**
     * Internal method to fetch markets from API (bypasses cache)
     *
     * Uses the /query?type=symbols endpoint which returns market metadata
     */
    async fetchMarketsFromAPI(_params) {
        this.debug('Fetching markets from API...');
        // Nado returns { symbols: { "BTC-PERP": {...}, "ETH-PERP": {...}, ... } }
        const response = await this.apiClient.query(NADO_QUERY_TYPES.SYMBOLS);
        // Build product mappings
        this.productMappings.clear();
        const markets = [];
        for (const [, symbolData] of Object.entries(response.symbols || {})) {
            const market = this.normalizer.normalizeSymbol(symbolData);
            markets.push(market);
            // Store mappings (key: ccxtSymbol for direct lookup)
            const mapping = {
                productId: symbolData.product_id,
                symbol: symbolData.symbol,
                ccxtSymbol: market.symbol,
            };
            this.productMappings.set(market.symbol, mapping);
        }
        this.debug('Markets fetched', { count: markets.length });
        return markets;
    }
    async fetchTicker(symbol) {
        const mapping = this.getProductMapping(symbol);
        // Nado API expects product_ids as an array
        const response = await this.apiClient.query(NADO_QUERY_TYPES.MARKET_PRICES, {
            product_ids: [mapping.productId],
        });
        const ticker = response.market_prices?.[0];
        if (!ticker) {
            throw new PerpDEXError(`No ticker data for ${symbol}`, 'NO_DATA', this.id);
        }
        return this.normalizer.normalizeTicker(NadoTickerSchema.parse(ticker), symbol);
    }
    async fetchOrderBook(symbol, params) {
        const mapping = this.getProductMapping(symbol);
        const depth = params?.limit || 20;
        // Nado API requires depth parameter
        const orderBook = await this.apiClient.query(NADO_QUERY_TYPES.MARKET_LIQUIDITY, {
            product_id: mapping.productId,
            depth,
        });
        return this.normalizer.normalizeOrderBook(NadoOrderBookSchema.parse(orderBook), symbol);
    }
    async fetchTrades(_symbol, _params) {
        // Nado provides trades via WebSocket only, not REST API
        // Use watchTrades() for real-time trade streaming
        throw new PerpDEXError('fetchTrades not supported via REST API on Nado. Use watchTrades() for WebSocket streaming.', 'NOT_SUPPORTED', this.id);
    }
    async fetchFundingRate(symbol) {
        const ticker = await this.fetchTicker(symbol);
        if (!ticker.info?.fundingRate) {
            throw new PerpDEXError('Funding rate not available for this symbol', 'NO_FUNDING_RATE', this.id);
        }
        const info = ticker.info;
        return {
            symbol,
            fundingRate: parseFloat(String(info.fundingRate)),
            fundingTimestamp: Date.now(),
            nextFundingTimestamp: info.nextFundingTime || Date.now() + 8 * 3600 * 1000,
            markPrice: parseFloat(String(info.markPrice)),
            indexPrice: parseFloat(String(info.indexPrice)),
            fundingIntervalHours: 8,
        };
    }
    // ===========================================================================
    // Trading - Private Methods (Require Authentication)
    // ===========================================================================
    async createOrder(request) {
        const auth = this.requireAuth();
        if (!this.contractsInfo) {
            throw new PerpDEXError('Contracts info not loaded', 'NO_CONTRACTS', this.id);
        }
        const mapping = this.getProductMapping(request.symbol);
        // Convert order to Nado format
        const priceX18 = ethers.parseUnits((request.price || 0).toString(), 18).toString();
        const amount = ethers.parseUnits(request.amount.toString(), 18).toString();
        const expiration = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
        const nonce = auth.getNextNonce();
        const orderData = {
            sender: auth.getAddress(),
            priceX18,
            amount,
            expiration,
            nonce,
            appendix: {
                productId: mapping.productId,
                side: request.side === 'buy' ? NADO_ORDER_SIDES.BUY : NADO_ORDER_SIDES.SELL,
                reduceOnly: request.reduceOnly || false,
                postOnly: request.postOnly || false,
            },
        };
        // Sign and execute the order
        const signature = await auth.signOrder(orderData, mapping.productId);
        const response = await this.apiClient.execute(NADO_EXECUTE_TYPES.PLACE_ORDER, orderData, signature);
        return this.normalizer.normalizeOrder(NadoOrderSchema.parse(response), mapping);
    }
    async cancelOrder(orderId, _symbol) {
        const auth = this.requireAuth();
        if (!this.contractsInfo) {
            throw new PerpDEXError('Contracts info not loaded', 'NO_CONTRACTS', this.id);
        }
        // Fetch the order to get its digest
        const order = await this.apiClient.query(NADO_QUERY_TYPES.ORDER, {
            order_id: orderId,
        });
        // Find product mapping by productId
        const mapping = Array.from(this.productMappings.values()).find((m) => m.productId === order.product_id);
        if (!mapping) {
            throw new InvalidOrderError('Product mapping not found', 'MAPPING_NOT_FOUND', this.id);
        }
        const cancellationData = {
            sender: auth.getAddress(),
            productIds: [order.product_id],
            digests: [order.digest],
            nonce: auth.getNextNonce(),
        };
        const signature = await auth.signCancellation(cancellationData, this.contractsInfo.endpoint_addr);
        await this.apiClient.execute(NADO_EXECUTE_TYPES.CANCEL_ORDERS, cancellationData, signature);
        // Return updated order
        return this.normalizer.normalizeOrder(NadoOrderSchema.parse(order), mapping);
    }
    async cancelAllOrders(symbol) {
        const auth = this.requireAuth();
        if (!this.contractsInfo) {
            throw new PerpDEXError('Contracts info not loaded', 'NO_CONTRACTS', this.id);
        }
        // Fetch all open orders
        const orders = await this.apiClient.query(NADO_QUERY_TYPES.ORDERS, {
            subaccount: auth.getAddress(),
            status: 'open',
        });
        if (orders.length === 0) {
            return [];
        }
        // Filter by symbol if provided
        let ordersToCancel = orders;
        if (symbol) {
            const mapping = this.getProductMapping(symbol);
            ordersToCancel = orders.filter((o) => o.product_id === mapping.productId);
        }
        // Build cancellation data
        const cancellationData = {
            sender: auth.getAddress(),
            productIds: ordersToCancel.map((o) => o.product_id),
            digests: ordersToCancel.map((o) => o.digest),
            nonce: auth.getNextNonce(),
        };
        const signature = await auth.signCancellation(cancellationData, this.contractsInfo.endpoint_addr);
        await this.apiClient.execute(NADO_EXECUTE_TYPES.CANCEL_ORDERS, cancellationData, signature);
        // Return cancelled orders
        const mappingsArray = Array.from(this.productMappings.values());
        return ordersToCancel.map((order) => {
            const mapping = mappingsArray.find((m) => m.productId === order.product_id);
            return this.normalizer.normalizeOrder(order, mapping);
        });
    }
    async fetchPositions(_symbols) {
        const auth = this.requireAuth();
        const positions = await this.apiClient.query(NADO_QUERY_TYPES.ISOLATED_POSITIONS, {
            subaccount: auth.getAddress(),
        });
        const mappingsArray = Array.from(this.productMappings.values());
        const normalized = [];
        for (const position of positions) {
            const mapping = mappingsArray.find((m) => m.productId === position.product_id);
            if (!mapping) {
                this.warn(`Product mapping not found for product ID ${position.product_id}`);
                continue;
            }
            const normalizedPosition = this.normalizer.normalizePosition(NadoPositionSchema.parse(position), mapping);
            if (normalizedPosition) {
                normalized.push(normalizedPosition);
            }
        }
        return normalized;
    }
    async fetchBalance() {
        const auth = this.requireAuth();
        const balance = await this.apiClient.query(NADO_QUERY_TYPES.SUBACCOUNT_INFO, {
            subaccount: auth.getAddress(),
        });
        return this.normalizer.normalizeBalance(NadoBalanceSchema.parse(balance));
    }
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
    async fetchOpenOrders(symbol) {
        const auth = this.requireAuth();
        const orders = await this.apiClient.query(NADO_QUERY_TYPES.ORDERS, {
            subaccount: auth.getAddress(),
            status: 'open',
        });
        if (orders.length === 0) {
            return [];
        }
        // Filter by symbol if provided
        let filteredOrders = orders;
        if (symbol) {
            const mapping = this.getProductMapping(symbol);
            filteredOrders = orders.filter((o) => o.product_id === mapping.productId);
        }
        // Normalize and return
        const mappingsArray = Array.from(this.productMappings.values());
        return filteredOrders
            .map((order) => {
            const mapping = mappingsArray.find((m) => m.productId === order.product_id);
            if (!mapping)
                return null;
            return this.normalizer.normalizeOrder(order, mapping);
        })
            .filter((o) => o !== null);
    }
    // ===========================================================================
    // WebSocket Streaming
    // ===========================================================================
    async *watchOrderBook(symbol) {
        if (!this.wsManager) {
            throw new PerpDEXError('WebSocket not initialized', 'NO_WEBSOCKET', this.id);
        }
        const mapping = this.getProductMapping(symbol);
        const subscription = NadoSubscriptionBuilder.orderBook(mapping.productId);
        const channelId = NadoSubscriptionBuilder.channelId(NADO_WS_CHANNELS.ORDERBOOK, mapping.productId);
        for await (const update of this.wsManager.watch(channelId, subscription)) {
            yield this.normalizer.normalizeOrderBook(update, symbol);
        }
    }
    async *watchPositions() {
        const auth = this.requireAuth();
        if (!this.wsManager) {
            throw new PerpDEXError('WebSocket not initialized', 'NO_WEBSOCKET', this.id);
        }
        const walletAddress = auth.getAddress();
        const subscription = NadoSubscriptionBuilder.positions(walletAddress);
        const channelId = NadoSubscriptionBuilder.channelId(NADO_WS_CHANNELS.POSITIONS, walletAddress);
        for await (const positions of this.wsManager.watch(channelId, subscription)) {
            const mappingsArray = Array.from(this.productMappings.values());
            const normalized = [];
            for (const position of positions) {
                const mapping = mappingsArray.find((m) => m.productId === position.product_id);
                if (!mapping)
                    continue;
                const normalizedPos = this.normalizer.normalizePosition(position, mapping);
                if (normalizedPos)
                    normalized.push(normalizedPos);
            }
            yield normalized;
        }
    }
    async *watchOrders() {
        const auth = this.requireAuth();
        if (!this.wsManager) {
            throw new PerpDEXError('WebSocket not initialized', 'NO_WEBSOCKET', this.id);
        }
        const walletAddress = auth.getAddress();
        const subscription = NadoSubscriptionBuilder.orders(walletAddress);
        const channelId = NadoSubscriptionBuilder.channelId(NADO_WS_CHANNELS.ORDERS, walletAddress);
        for await (const orders of this.wsManager.watch(channelId, subscription)) {
            const mappingsArray = Array.from(this.productMappings.values());
            const normalized = [];
            for (const order of orders) {
                const mapping = mappingsArray.find((m) => m.productId === order.product_id);
                if (!mapping)
                    continue;
                normalized.push(this.normalizer.normalizeOrder(order, mapping));
            }
            yield normalized;
        }
    }
    async *watchTrades(symbol) {
        if (!this.wsManager) {
            throw new PerpDEXError('WebSocket not initialized', 'NO_WEBSOCKET', this.id);
        }
        const mapping = this.getProductMapping(symbol);
        const subscription = NadoSubscriptionBuilder.trades(mapping.productId);
        const channelId = NadoSubscriptionBuilder.channelId(NADO_WS_CHANNELS.TRADES, mapping.productId);
        for await (const trade of this.wsManager.watch(channelId, subscription)) {
            yield this.normalizer.normalizeTrade(trade, mapping);
        }
    }
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
    async *watchBalance() {
        const auth = this.requireAuth();
        if (!this.wsManager) {
            throw new PerpDEXError('WebSocket not initialized', 'NO_WEBSOCKET', this.id);
        }
        const walletAddress = auth.getAddress();
        const subscription = NadoSubscriptionBuilder.balance(walletAddress);
        const channelId = NadoSubscriptionBuilder.channelId(NADO_WS_CHANNELS.SUBACCOUNT, walletAddress);
        for await (const balance of this.wsManager.watch(channelId, subscription)) {
            yield this.normalizer.normalizeBalance(balance);
        }
    }
    // ===========================================================================
    // Symbol Conversion (Required by BaseAdapter)
    // ===========================================================================
    symbolToExchange(symbol) {
        return this.normalizer.symbolFromCCXT(symbol);
    }
    symbolFromExchange(exchangeSymbol) {
        return this.normalizer.symbolToCCXT(exchangeSymbol);
    }
    // ===========================================================================
    // Not Implemented Methods (Return empty/throw)
    // ===========================================================================
    async fetchFundingRateHistory(_symbol, _since, _limit) {
        throw new PerpDEXError('fetchFundingRateHistory not supported on Nado', 'NOT_SUPPORTED', this.id);
    }
    async fetchOrderHistory(_symbol, _since, _limit) {
        const auth = this.requireAuth();
        const orders = await this.apiClient.query(NADO_QUERY_TYPES.ORDERS, {
            subaccount: auth.getAddress(),
        });
        const mappingsArray = Array.from(this.productMappings.values());
        return orders
            .map((order) => {
            const mapping = mappingsArray.find((m) => m.productId === order.product_id);
            if (!mapping)
                return null;
            return this.normalizer.normalizeOrder(order, mapping);
        })
            .filter((o) => o !== null);
    }
    async fetchMyTrades(_symbol, _since, _limit) {
        throw new PerpDEXError('fetchMyTrades not supported on Nado (use WebSocket fills channel)', 'NOT_SUPPORTED', this.id);
    }
    async setLeverage(_symbol, _leverage) {
        throw new PerpDEXError('setLeverage not supported on Nado (unified cross-margin system)', 'NOT_SUPPORTED', this.id);
    }
}
//# sourceMappingURL=NadoAdapter.js.map