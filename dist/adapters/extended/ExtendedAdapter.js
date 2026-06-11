/**
 * Extended Exchange Adapter
 *
 * StarkNet-based hybrid CLOB perpetual DEX adapter
 *
 * ## Implementation Status
 *
 * ### Fully Implemented ✅
 * - **Market Data**: fetchMarkets, fetchTicker, fetchOrderBook, fetchTrades, fetchFundingRate
 * - **Trading**: createOrder, cancelOrder, cancelAllOrders, createBatchOrders, cancelBatchOrders
 * - **Account**: fetchPositions, fetchBalance, fetchOrderHistory, fetchMyTrades, fetchUserFees
 * - **Leverage**: setLeverage (up to 100x), setMarginMode (cross/isolated)
 * - **WebSocket** (live per-stream protocol, capture 2026-06-11):
 *   watchOrderBook, watchTrades — public keyless streams
 *   (`{base}/orderbooks/{market}`, `{base}/publicTrades/{market}`; the HTTP
 *   upgrade IS the subscription)
 *
 * ### NOT Implemented (has=false, BaseAdapter NOT_SUPPORTED throwers) ❌
 * - **WebSocket**: watchTicker, watchPositions, watchOrders, watchBalance,
 *   watchFundingRate — the previous all-true flags described a fictional
 *   multiplexed protocol on a dead host (NXDOMAIN). The venue funding stream
 *   exists but is explicitly out of scope for this repair; private/account
 *   streams were never verified.
 *
 * ### Example Usage
 * ```typescript
 * const adapter = createExchange('extended', {
 *   apiKey: 'your-api-key',
 *   starknetPrivateKey: '0x...',
 *   starknetAccountAddress: '0x...',
 *   testnet: true
 * });
 * await adapter.initialize();
 *
 * // REST API
 * const markets = await adapter.fetchMarkets();
 * const order = await adapter.createOrder({ ... });
 *
 * // WebSocket streaming (public, keyless)
 * for await (const orderbook of adapter.watchOrderBook('BTC/USD:USD')) {
 *   console.log('Order book update:', orderbook);
 * }
 * ```
 */
import { BaseAdapter } from '../base/BaseAdapter.js';
import { PerpDEXError } from '../../types/errors.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { EXTENDED_API_URLS, EXTENDED_ENDPOINTS, EXTENDED_RATE_LIMITS, EXTENDED_ENDPOINT_WEIGHTS, EXTENDED_WS_CONFIG, EXTENDED_DEFAULTS, } from './constants.js';
import { ExtendedNormalizer } from './ExtendedNormalizer.js';
import { ExtendedStarkNetClient } from './ExtendedStarkNetClient.js';
import { convertOrderRequest, mapError, validateOrderRequest, validateLeverage } from './utils.js';
import { ExtendedWebSocketWrapper } from './ExtendedWebSocketWrapper.js';
/**
 * Extended exchange adapter
 *
 * Hybrid CLOB perpetual DEX on StarkNet with up to 100x leverage
 */
export class ExtendedAdapter extends BaseAdapter {
    id = 'extended';
    name = 'Extended';
    has = {
        fetchMarkets: true,
        fetchTicker: true,
        fetchOrderBook: true,
        fetchTrades: true,
        fetchFundingRate: true,
        fetchFundingRateHistory: true,
        fetchPositions: true,
        fetchBalance: true,
        fetchOrderHistory: true,
        fetchMyTrades: true,
        fetchUserFees: true,
        fetchPortfolio: true,
        fetchRateLimitStatus: false,
        createOrder: true,
        createBatchOrders: true,
        cancelOrder: true,
        cancelAllOrders: true,
        cancelBatchOrders: true,
        editOrder: true,
        setLeverage: true,
        setMarginMode: true,
        fetchDeposits: false,
        fetchWithdrawals: false,
        // WS flags are TRUTHFUL (live-verified 2026-06-11): the venue exposes
        // public per-stream WS for orderbooks + publicTrades only. The other
        // five were lies against a fictional protocol on a dead host — flipped
        // false (edgex precedent c41a3e1). Funding stream exists at the venue
        // but is out of scope for this repair.
        watchOrderBook: true,
        watchTrades: true,
        watchTicker: false,
        watchPositions: false,
        watchOrders: false,
        watchBalance: false,
        watchFundingRate: false,
    };
    apiUrl;
    wsUrl;
    apiKey;
    rateLimiter;
    httpClient;
    normalizer;
    starkNetClient;
    wsManager = null;
    wsWrapper;
    constructor(config = {}) {
        super(config);
        // Note: Extended testnet (Sepolia) is not currently operational
        // Always use mainnet URLs - testnet flag is ignored with a warning
        const testnet = config.testnet ?? false;
        if (testnet) {
            this.logger.warn('Extended testnet (Sepolia) is not operational. Using mainnet instead.');
        }
        // Always use mainnet URLs since testnet returns 404
        const urls = EXTENDED_API_URLS.mainnet;
        this.apiUrl = urls.rest;
        this.wsUrl = urls.websocket;
        this.apiKey = config.apiKey;
        this.normalizer = new ExtendedNormalizer();
        // Initialize StarkNet client if credentials provided
        // Always use mainnet network since testnet is not operational
        if (config.starknetPrivateKey && config.starknetAccountAddress) {
            this.starkNetClient = new ExtendedStarkNetClient({
                network: 'mainnet',
                privateKey: config.starknetPrivateKey,
                accountAddress: config.starknetAccountAddress,
                rpcUrl: config.starknetRpcUrl || urls.starknet,
            });
        }
        const limits = EXTENDED_RATE_LIMITS.default;
        this.rateLimiter = new RateLimiter({
            maxTokens: limits.maxRequests,
            refillRate: limits.maxRequests / (limits.windowMs / 1000),
            windowMs: limits.windowMs,
            weights: EXTENDED_ENDPOINT_WEIGHTS,
        });
        this.httpClient = new HTTPClient({
            baseUrl: this.apiUrl,
            timeout: config.timeout || EXTENDED_DEFAULTS.timeout,
            retry: {
                maxAttempts: 3,
                initialDelay: 1000,
                maxDelay: 10000,
                multiplier: 2,
                retryableStatuses: [408, 429, 500, 502, 503, 504],
            },
            circuitBreaker: {
                enabled: true,
                failureThreshold: 5,
                successThreshold: 2,
                resetTimeout: 60000,
            },
            exchange: this.id,
        });
    }
    async initialize() {
        this._isReady = true;
        this.info('Extended adapter initialized', {
            starkNetEnabled: !!this.starkNetClient,
        });
    }
    async disconnect() {
        if (this.wsWrapper) {
            this.wsWrapper.disconnect();
            this.wsWrapper = undefined;
        }
        if (this.wsManager) {
            await this.wsManager.disconnect();
            this.wsManager = null;
        }
        if (this.starkNetClient) {
            await this.starkNetClient.disconnect();
        }
        this._isReady = false;
        this.info('Extended adapter disconnected');
    }
    // ==================== Symbol Conversion Methods ====================
    /**
     * Convert unified symbol to Extended format
     */
    symbolToExchange(symbol) {
        return this.normalizer.symbolFromCCXT(symbol);
    }
    /**
     * Convert Extended symbol to unified format
     */
    symbolFromExchange(exchangeSymbol) {
        return this.normalizer.symbolToCCXT(exchangeSymbol);
    }
    // ==================== Market Data Methods ====================
    async fetchMarkets(_params) {
        await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.MARKETS);
        try {
            const response = await this.httpClient.get(EXTENDED_ENDPOINTS.MARKETS, {});
            // API returns {status: "OK", data: [...]} or legacy {markets: [...]}
            const markets = response.data || response.markets || [];
            return this.normalizer.normalizeMarkets(markets);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async _fetchTicker(symbol) {
        await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.TICKER_SYMBOL);
        try {
            const market = this.symbolToExchange(symbol);
            const endpoint = EXTENDED_ENDPOINTS.TICKER_SYMBOL.replace('{market}', market);
            const response = await this.httpClient.get(endpoint, {});
            const ticker = (response.data || response);
            return this.normalizer.normalizeTicker(ticker);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async _fetchOrderBook(symbol, params) {
        await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.ORDERBOOK);
        try {
            const market = this.symbolToExchange(symbol);
            let endpoint = EXTENDED_ENDPOINTS.ORDERBOOK.replace('{market}', market);
            const queryParams = {};
            if (params?.limit) {
                queryParams.depth = params.limit;
            }
            endpoint += this.buildQueryString(queryParams);
            const response = await this.httpClient.get(endpoint, {});
            const orderbook = (response.data || response);
            return this.normalizer.normalizeOrderBook(orderbook);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async _fetchTrades(symbol, params) {
        await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.TRADES);
        try {
            const market = this.symbolToExchange(symbol);
            let endpoint = EXTENDED_ENDPOINTS.TRADES.replace('{market}', market);
            const queryParams = {};
            if (params?.since) {
                queryParams.startTime = params.since;
            }
            if (params?.limit) {
                queryParams.limit = params.limit;
            }
            endpoint += this.buildQueryString(queryParams);
            const response = await this.httpClient.get(endpoint, {});
            const trades = response.data || [];
            return this.normalizer.normalizeTrades(trades);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async _fetchFundingRate(symbol) {
        await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.TICKER_SYMBOL);
        try {
            const market = this.symbolToExchange(symbol);
            // Use the stats endpoint which includes fundingRate, markPrice, indexPrice
            const endpoint = EXTENDED_ENDPOINTS.TICKER_SYMBOL.replace('{market}', market);
            const response = await this.httpClient.get(endpoint, {});
            const stats = response.data ?? {};
            return this.normalizer.normalizeFundingRate({
                symbol: market,
                fundingRate: String(stats.fundingRate ?? '0'),
                fundingTime: Date.now(),
                nextFundingTime: stats.nextFundingRate || 0,
                markPrice: String(stats.markPrice ?? '0'),
                indexPrice: String(stats.indexPrice ?? '0'),
            });
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchFundingRateHistory(symbol, since, limit) {
        await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.FUNDING_RATE);
        try {
            const market = this.symbolToExchange(symbol);
            const endpoint = EXTENDED_ENDPOINTS.FUNDING_RATE.replace('{market}', market);
            // API requires both startTime and endTime
            const now = Date.now();
            const queryParams = {
                startTime: since || now - 7 * 24 * 60 * 60 * 1000, // default: 7 days ago
                endTime: now,
            };
            if (limit) {
                queryParams.limit = limit;
            }
            const fullEndpoint = endpoint + this.buildQueryString(queryParams);
            const response = await this.httpClient.get(fullEndpoint, {});
            const rates = (response.data || []).map((r) => ({
                symbol: r.m || market,
                fundingRate: r.f || r.fundingRate || '0',
                fundingTime: r.T || r.fundingTime || 0,
                markPrice: r.markPrice || '0',
                indexPrice: r.indexPrice || '0',
            }));
            return this.normalizer.normalizeFundingRates(rates);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    // ==================== Trading Methods ====================
    async createOrder(request) {
        await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.CREATE_ORDER);
        validateOrderRequest(request);
        if (!this.apiKey) {
            throw new PerpDEXError('API key required for trading', 'AUTHENTICATION_ERROR', this.id);
        }
        try {
            const extendedOrder = convertOrderRequest(request);
            const order = await this.httpClient.post(EXTENDED_ENDPOINTS.CREATE_ORDER, {
                headers: {
                    'X-Api-Key': this.apiKey,
                    'Content-Type': 'application/json',
                },
                body: extendedOrder,
            });
            return this.normalizer.normalizeOrder(order);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async cancelOrder(orderId, _symbol) {
        await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.CANCEL_ORDER);
        if (!this.apiKey) {
            throw new PerpDEXError('API key required for trading', 'AUTHENTICATION_ERROR', this.id);
        }
        try {
            const endpoint = EXTENDED_ENDPOINTS.CANCEL_ORDER.replace('{orderId}', orderId);
            const order = await this.httpClient.delete(endpoint, {
                headers: {
                    'X-Api-Key': this.apiKey,
                },
            });
            return this.normalizer.normalizeOrder(order);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async cancelAllOrders(symbol) {
        await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.CANCEL_ALL_ORDERS);
        if (!this.apiKey) {
            throw new PerpDEXError('API key required for trading', 'AUTHENTICATION_ERROR', this.id);
        }
        try {
            const queryParams = {};
            if (symbol) {
                queryParams.market = this.symbolToExchange(symbol);
            }
            let endpoint = EXTENDED_ENDPOINTS.CANCEL_ALL_ORDERS;
            endpoint += this.buildQueryString(queryParams);
            const response = await this.httpClient.delete(endpoint, {
                headers: {
                    'X-Api-Key': this.apiKey,
                },
            });
            const orders = response.orders || [];
            return this.normalizer.normalizeOrders(orders);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async createBatchOrders(requests) {
        await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.BATCH_ORDERS);
        if (!this.apiKey) {
            throw new PerpDEXError('API key required for trading', 'AUTHENTICATION_ERROR', this.id);
        }
        try {
            requests.forEach((req) => validateOrderRequest(req));
            const extendedOrders = requests.map((req) => convertOrderRequest(req));
            const response = await this.httpClient.post(EXTENDED_ENDPOINTS.BATCH_ORDERS, {
                headers: {
                    'X-Api-Key': this.apiKey,
                    'Content-Type': 'application/json',
                },
                body: { orders: extendedOrders },
            });
            const orders = response.orders || [];
            return this.normalizer.normalizeOrders(orders);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async cancelBatchOrders(orderIds, _symbol) {
        await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.CANCEL_ALL_ORDERS);
        if (!this.apiKey) {
            throw new PerpDEXError('API key required for trading', 'AUTHENTICATION_ERROR', this.id);
        }
        try {
            const response = await this.httpClient.delete(EXTENDED_ENDPOINTS.CANCEL_ALL_ORDERS, {
                headers: {
                    'X-Api-Key': this.apiKey,
                    'Content-Type': 'application/json',
                },
                body: { orderIds },
            });
            const orders = response.orders || [];
            return this.normalizer.normalizeOrders(orders);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async editOrder(orderId, symbol, type, side, amount, price) {
        await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.EDIT_ORDER);
        if (!this.apiKey) {
            throw new PerpDEXError('API key required for trading', 'AUTHENTICATION_ERROR', this.id);
        }
        try {
            const endpoint = EXTENDED_ENDPOINTS.EDIT_ORDER.replace('{orderId}', orderId);
            const market = this.symbolToExchange(symbol);
            const body = {
                symbol: market,
                type,
                side,
            };
            if (amount !== undefined) {
                body.quantity = amount.toString();
            }
            if (price !== undefined) {
                body.price = price.toString();
            }
            const order = await this.httpClient.put(endpoint, {
                headers: {
                    'X-Api-Key': this.apiKey,
                    'Content-Type': 'application/json',
                },
                body,
            });
            return this.normalizer.normalizeOrder(order);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    // ==================== Account Methods ====================
    async fetchPositions(symbols) {
        await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.POSITIONS);
        if (!this.apiKey) {
            throw new PerpDEXError('API key required for account data', 'AUTHENTICATION_ERROR', this.id);
        }
        try {
            const queryParams = {};
            if (symbols && symbols.length > 0) {
                queryParams.markets = symbols.map((s) => this.symbolToExchange(s)).join(',');
            }
            let endpoint = EXTENDED_ENDPOINTS.POSITIONS;
            endpoint += this.buildQueryString(queryParams);
            const response = await this.httpClient.get(endpoint, {
                headers: {
                    'X-Api-Key': this.apiKey,
                },
            });
            const positions = response.positions || [];
            return this.normalizer.normalizePositions(positions);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchBalance() {
        await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.BALANCE);
        if (!this.apiKey) {
            throw new PerpDEXError('API key required for account data', 'AUTHENTICATION_ERROR', this.id);
        }
        try {
            const response = await this.httpClient.get(EXTENDED_ENDPOINTS.BALANCE, {
                headers: {
                    'X-Api-Key': this.apiKey,
                },
            });
            const balances = response.balances || [];
            return this.normalizer.normalizeBalances(balances);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async _setLeverage(symbol, leverage) {
        await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.LEVERAGE);
        validateLeverage(leverage);
        if (!this.apiKey) {
            throw new PerpDEXError('API key required for leverage changes', 'AUTHENTICATION_ERROR', this.id);
        }
        try {
            const market = this.symbolToExchange(symbol);
            await this.httpClient.post(EXTENDED_ENDPOINTS.LEVERAGE, {
                headers: {
                    'X-Api-Key': this.apiKey,
                    'Content-Type': 'application/json',
                },
                body: {
                    market,
                    leverage,
                },
            });
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async setMarginMode(symbol, marginMode) {
        await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.MARGIN_MODE);
        if (!this.apiKey) {
            throw new PerpDEXError('API key required for margin mode changes', 'AUTHENTICATION_ERROR', this.id);
        }
        try {
            const market = this.symbolToExchange(symbol);
            await this.httpClient.post(EXTENDED_ENDPOINTS.MARGIN_MODE, {
                headers: {
                    'X-Api-Key': this.apiKey,
                    'Content-Type': 'application/json',
                },
                body: {
                    market,
                    marginMode,
                },
            });
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchOrderHistory(symbol, since, limit) {
        await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.ORDER_HISTORY);
        if (!this.apiKey) {
            throw new PerpDEXError('API key required for order history', 'AUTHENTICATION_ERROR', this.id);
        }
        try {
            const queryParams = {};
            if (symbol) {
                queryParams.market = this.symbolToExchange(symbol);
            }
            if (since) {
                queryParams.startTime = since;
            }
            if (limit) {
                queryParams.limit = limit;
            }
            let endpoint = EXTENDED_ENDPOINTS.ORDER_HISTORY;
            endpoint += this.buildQueryString(queryParams);
            const response = await this.httpClient.get(endpoint, {
                headers: {
                    'X-Api-Key': this.apiKey,
                },
            });
            const orders = response.orders || [];
            return this.normalizer.normalizeOrders(orders);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchMyTrades(symbol, since, limit) {
        await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.USER_TRADES);
        if (!this.apiKey) {
            throw new PerpDEXError('API key required for trade history', 'AUTHENTICATION_ERROR', this.id);
        }
        try {
            const queryParams = {};
            if (symbol) {
                queryParams.market = this.symbolToExchange(symbol);
            }
            if (since) {
                queryParams.startTime = since;
            }
            if (limit) {
                queryParams.limit = limit;
            }
            let endpoint = EXTENDED_ENDPOINTS.USER_TRADES;
            endpoint += this.buildQueryString(queryParams);
            const response = await this.httpClient.get(endpoint, {
                headers: {
                    'X-Api-Key': this.apiKey,
                },
            });
            const trades = response.trades || [];
            return this.normalizer.normalizeTrades(trades);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchDeposits(_currency, _since, _limit) {
        throw new PerpDEXError('fetchDeposits not supported', 'NOT_SUPPORTED', this.id);
    }
    async fetchWithdrawals(_currency, _since, _limit) {
        throw new PerpDEXError('fetchWithdrawals not supported', 'NOT_SUPPORTED', this.id);
    }
    async fetchUserFees() {
        await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.USER_FEES);
        if (!this.apiKey) {
            throw new PerpDEXError('API key required for fee information', 'AUTHENTICATION_ERROR', this.id);
        }
        try {
            const response = await this.httpClient.get(EXTENDED_ENDPOINTS.USER_FEES, {
                headers: {
                    'X-Api-Key': this.apiKey,
                },
            });
            return {
                maker: parseFloat(response.maker),
                taker: parseFloat(response.taker),
                volume30d: response.volume30d ? parseFloat(response.volume30d) : undefined,
            };
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchPortfolio() {
        await this.rateLimiter.acquire(EXTENDED_ENDPOINTS.PORTFOLIO);
        if (!this.apiKey) {
            throw new PerpDEXError('API key required for portfolio data', 'AUTHENTICATION_ERROR', this.id);
        }
        try {
            const response = await this.httpClient.get(EXTENDED_ENDPOINTS.PORTFOLIO, {
                headers: {
                    'X-Api-Key': this.apiKey,
                },
            });
            return {
                totalValue: parseFloat(response.totalValue),
                dailyPnl: parseFloat(response.dailyPnl),
                dailyPnlPercentage: parseFloat(response.dailyPnlPercentage),
                timestamp: Date.now(),
            };
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchRateLimitStatus() {
        throw new PerpDEXError('fetchRateLimitStatus not supported', 'NOT_SUPPORTED', this.id);
    }
    // ==================== WebSocket Methods ====================
    //
    // Only the public orderbooks + publicTrades streams exist (live protocol
    // 2026-06-11). watchTicker/watchPositions/watchOrders/watchBalance/
    // watchFundingRate intentionally have NO overrides here: their has-flags
    // are false and they fall through to the BaseAdapter NOT_SUPPORTED
    // throwers.
    /**
     * Ensure the WebSocket wrapper exists and return it
     *
     * Passes the STREAM BASE (`{base}` = EXTENDED_API_URLS.*.websocket); the
     * wrapper composes the per-stream URL `{base}/{stream}/{market}` and the
     * HTTP upgrade itself is the subscription — there is no upfront connect,
     * no auth frame and no JSON heartbeat on this venue.
     */
    ensureWebSocketConnected() {
        if (!this.wsWrapper) {
            this.wsWrapper = new ExtendedWebSocketWrapper({
                wsUrl: this.wsUrl,
                reconnect: true,
                maxReconnectAttempts: EXTENDED_WS_CONFIG.reconnectAttempts,
            });
        }
        return this.wsWrapper;
    }
    /**
     * Watch real-time order book updates (public, keyless)
     *
     * Full unified book per frame (SNAPSHOT seed + DELTA apply); `limit` is
     * served by slicing the maintained book.
     */
    async *watchOrderBook(symbol, limit) {
        yield* this.ensureWebSocketConnected().watchOrderBook(symbol, limit);
    }
    /**
     * Watch real-time trade updates (public, keyless)
     *
     * The first frame per connection (historical backfill) is skipped;
     * LIQUIDATION/DELEVERAGE flow is kept, tagged via `info.tT`.
     */
    async *watchTrades(symbol) {
        yield* this.ensureWebSocketConnected().watchTrades(symbol);
    }
    // ==================== Private Helper Methods ====================
    /**
     * Build query string from parameters
     */
    buildQueryString(params) {
        const filtered = Object.entries(params)
            .filter(([_, value]) => value !== undefined && value !== null)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        return filtered.length > 0 ? `?${filtered.join('&')}` : '';
    }
}
//# sourceMappingURL=ExtendedAdapter.js.map