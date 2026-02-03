/**
 * Backpack Exchange Adapter
 *
 * Centralized exchange with perpetual futures using ED25519 signatures
 */
import { BaseAdapter } from '../base/BaseAdapter.js';
import { PerpDEXError } from '../../types/errors.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { WebSocketManager } from '../../websocket/WebSocketManager.js';
import { BACKPACK_API_URLS, BACKPACK_RATE_LIMITS, BACKPACK_ENDPOINT_WEIGHTS, } from './constants.js';
import { BackpackNormalizer } from './BackpackNormalizer.js';
import { BackpackAuth } from './BackpackAuth.js';
import { toBackpackOrderType, toBackpackOrderSide, toBackpackTimeInForce, mapBackpackError, } from './utils.js';
/**
 * Backpack adapter implementation
 */
export class BackpackAdapter extends BaseAdapter {
    id = 'backpack';
    name = 'Backpack';
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
        createOrder: true,
        cancelOrder: true,
        cancelAllOrders: true,
        setLeverage: true,
        watchOrderBook: true,
        watchTrades: true,
        watchTicker: true,
        watchPositions: true,
        watchOrders: true,
        watchBalance: true,
    };
    auth;
    baseUrl;
    wsUrl;
    httpClient;
    wsManager;
    rateLimiter;
    normalizer;
    constructor(config = {}) {
        super(config);
        // Initialize auth if credentials provided
        if (config.apiKey && config.apiSecret) {
            this.auth = new BackpackAuth({ apiKey: config.apiKey, apiSecret: config.apiSecret });
        }
        // Initialize normalizer
        this.normalizer = new BackpackNormalizer();
        this.rateLimiter = new RateLimiter({
            maxTokens: BACKPACK_RATE_LIMITS.rest.maxRequests,
            refillRate: BACKPACK_RATE_LIMITS.rest.maxRequests / (BACKPACK_RATE_LIMITS.rest.windowMs / 1000),
            windowMs: BACKPACK_RATE_LIMITS.rest.windowMs,
            weights: BACKPACK_ENDPOINT_WEIGHTS,
        });
        const urls = config.testnet ? BACKPACK_API_URLS.testnet : BACKPACK_API_URLS.mainnet;
        this.baseUrl = urls.rest;
        this.wsUrl = urls.websocket;
        // Initialize HTTP client
        this.httpClient = new HTTPClient({
            baseUrl: this.baseUrl,
            timeout: config.timeout || 30000,
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
        this.wsManager = new WebSocketManager({ url: this.wsUrl });
    }
    /**
     * Initialize the adapter
     * Public API methods work without authentication
     */
    async initialize() {
        // Note: API key is only required for private methods (trading, positions, balance)
        // Public methods (markets, ticker, orderbook, trades) work without auth
        this._isReady = true;
    }
    /**
     * Check if credentials are available for private API methods
     */
    hasCredentials() {
        return !!this.auth?.hasCredentials();
    }
    /**
     * Require credentials for private methods
     */
    requireAuth() {
        if (!this.hasCredentials()) {
            throw new PerpDEXError('API key and secret are required for this operation', 'MISSING_CREDENTIALS', 'backpack');
        }
    }
    /**
     * Cleanup resources
     */
    async disconnect() {
        // Cleanup if needed
    }
    /**
     * Fetch all available markets
     */
    async fetchMarkets() {
        const response = await this.makeRequest('GET', '/markets', 'fetchMarkets');
        // Backpack returns array directly, not { markets: [...] }
        if (!Array.isArray(response)) {
            throw new PerpDEXError('Invalid markets response', 'INVALID_RESPONSE', 'backpack');
        }
        return response.map((market) => this.normalizer.normalizeMarket(market));
    }
    /**
     * Fetch ticker for a symbol
     */
    async fetchTicker(symbol) {
        const market = this.normalizer.toBackpackSymbol(symbol);
        const response = await this.makeRequest('GET', `/ticker?symbol=${market}`, 'fetchTicker');
        return this.normalizer.normalizeTicker(response);
    }
    /**
     * Fetch order book for a symbol
     */
    async fetchOrderBook(symbol, params) {
        const market = this.normalizer.toBackpackSymbol(symbol);
        const queryParts = [`symbol=${market}`];
        if (params?.limit) {
            queryParts.push(`depth=${params.limit}`);
        }
        const response = await this.makeRequest('GET', `/depth?${queryParts.join('&')}`, 'fetchOrderBook');
        return this.normalizer.normalizeOrderBook(response, symbol);
    }
    /**
     * Fetch recent trades for a symbol
     */
    async fetchTrades(symbol, params) {
        const market = this.normalizer.toBackpackSymbol(symbol);
        const limit = params?.limit ?? 100;
        const response = await this.makeRequest('GET', `/trades?symbol=${market}&limit=${limit}`, 'fetchTrades');
        // Backpack returns trades as an array directly
        if (!Array.isArray(response)) {
            throw new PerpDEXError('Invalid trades response', 'INVALID_RESPONSE', 'backpack');
        }
        return response.map((trade) => this.normalizer.normalizeTrade(trade, symbol));
    }
    /**
     * Fetch current funding rate
     * Returns the most recent funding rate from history
     */
    async fetchFundingRate(symbol) {
        const market = this.normalizer.toBackpackSymbol(symbol);
        const response = await this.makeRequest('GET', `/fundingRates?symbol=${market}`, 'fetchFundingRate');
        // Backpack returns an array of funding rates, get the most recent one
        if (!Array.isArray(response) || response.length === 0) {
            throw new PerpDEXError('No funding rate data available', 'INVALID_RESPONSE', 'backpack');
        }
        return this.normalizer.normalizeFundingRate(response[0]);
    }
    /**
     * Fetch funding rate history
     */
    async fetchFundingRateHistory(symbol, since, limit) {
        const market = this.normalizer.toBackpackSymbol(symbol);
        const response = await this.makeRequest('GET', `/fundingRates?symbol=${market}`, 'fetchFundingRate');
        if (!Array.isArray(response)) {
            throw new PerpDEXError('Invalid funding rate response', 'INVALID_RESPONSE', 'backpack');
        }
        let rates = response.map((r) => this.normalizer.normalizeFundingRate(r));
        if (since) {
            rates = rates.filter((r) => r.fundingTimestamp >= since);
        }
        if (limit) {
            rates = rates.slice(0, limit);
        }
        return rates;
    }
    /**
     * Fetch all open positions
     */
    async fetchPositions(symbols) {
        this.requireAuth();
        const response = await this.makeRequest('GET', '/positions', 'fetchPositions');
        if (!Array.isArray(response.positions)) {
            throw new PerpDEXError('Invalid positions response', 'INVALID_RESPONSE', 'backpack');
        }
        let positions = response.positions.map((position) => this.normalizer.normalizePosition(position));
        if (symbols && symbols.length > 0) {
            positions = positions.filter((p) => symbols.includes(p.symbol));
        }
        return positions;
    }
    /**
     * Fetch account balance
     *
     * Backpack balance endpoint: GET /api/v1/capital
     * Response format: { "ASSET": { available: "...", locked: "...", staked: "..." }, ... }
     */
    async fetchBalance() {
        this.requireAuth();
        const response = await this.makeRequest('GET', '/capital', 'fetchBalance');
        // Backpack returns balance object directly with asset keys
        if (!response || typeof response !== 'object') {
            throw new PerpDEXError('Invalid balance response', 'INVALID_RESPONSE', 'backpack');
        }
        // Convert response object to array of balances
        const balances = [];
        for (const [currency, data] of Object.entries(response)) {
            if (data && typeof data === 'object') {
                const balanceData = data;
                const free = parseFloat(balanceData.available || '0');
                const used = parseFloat(balanceData.locked || '0');
                const total = free + used;
                balances.push({
                    currency,
                    total,
                    free,
                    used,
                });
            }
        }
        return balances;
    }
    /**
     * Create a new order
     */
    async createOrder(order) {
        this.requireAuth();
        const market = this.normalizer.toBackpackSymbol(order.symbol);
        const orderType = toBackpackOrderType(order.type, order.postOnly);
        const side = toBackpackOrderSide(order.side);
        const timeInForce = toBackpackTimeInForce(order.timeInForce, order.postOnly);
        const payload = {
            market,
            side,
            type: orderType,
            size: order.amount.toString(),
            price: order.price?.toString(),
            time_in_force: timeInForce,
            reduce_only: order.reduceOnly ?? false,
            post_only: order.postOnly ?? false,
            client_order_id: order.clientOrderId,
        };
        const response = await this.makeRequest('POST', '/orders', 'createOrder', payload);
        return this.normalizer.normalizeOrder(response);
    }
    /**
     * Cancel an existing order
     */
    async cancelOrder(orderId, symbol) {
        this.requireAuth();
        const response = await this.makeRequest('DELETE', `/orders/${orderId}`, 'cancelOrder');
        return this.normalizer.normalizeOrder(response);
    }
    /**
     * Cancel all orders
     */
    async cancelAllOrders(symbol) {
        this.requireAuth();
        const payload = symbol ? { market: this.normalizer.toBackpackSymbol(symbol) } : {};
        const response = await this.makeRequest('DELETE', '/orders', 'cancelAllOrders', payload);
        if (!Array.isArray(response.orders)) {
            throw new PerpDEXError('Invalid cancel all orders response', 'INVALID_RESPONSE', 'backpack');
        }
        return response.orders.map((order) => this.normalizer.normalizeOrder(order));
    }
    /**
     * Fetch open orders
     */
    async fetchOpenOrders(symbol) {
        this.requireAuth();
        const params = symbol ? `?market=${this.normalizer.toBackpackSymbol(symbol)}` : '';
        const response = await this.makeRequest('GET', `/orders${params}`, 'fetchOpenOrders');
        if (!Array.isArray(response.orders)) {
            throw new PerpDEXError('Invalid open orders response', 'INVALID_RESPONSE', 'backpack');
        }
        return response.orders.map((order) => this.normalizer.normalizeOrder(order));
    }
    /**
     * Fetch a specific order
     */
    async fetchOrder(orderId, symbol) {
        this.requireAuth();
        const response = await this.makeRequest('GET', `/orders/${orderId}`, 'fetchOrder');
        return this.normalizer.normalizeOrder(response);
    }
    /**
     * Set leverage for a symbol
     */
    async setLeverage(symbol, leverage) {
        this.requireAuth();
        const market = this.normalizer.toBackpackSymbol(symbol);
        await this.makeRequest('POST', '/account/leverage', 'setLeverage', {
            market,
            leverage: leverage.toString(),
        });
    }
    /**
     * Fetch order history
     */
    async fetchOrderHistory(symbol, since, limit) {
        this.requireAuth();
        const params = new URLSearchParams();
        if (symbol)
            params.append('symbol', this.normalizer.toBackpackSymbol(symbol));
        if (since)
            params.append('startTime', since.toString());
        if (limit)
            params.append('limit', limit.toString());
        const queryString = params.toString();
        const response = await this.makeRequest('GET', `/history/orders${queryString ? `?${queryString}` : ''}`, 'fetchOrderHistory');
        if (!Array.isArray(response)) {
            throw new PerpDEXError('Invalid order history response', 'INVALID_RESPONSE', 'backpack');
        }
        return response.map((order) => this.normalizer.normalizeOrder(order));
    }
    /**
     * Fetch user trade history
     */
    async fetchMyTrades(symbol, since, limit) {
        this.requireAuth();
        const params = new URLSearchParams();
        if (symbol)
            params.append('symbol', this.normalizer.toBackpackSymbol(symbol));
        if (since)
            params.append('startTime', since.toString());
        if (limit)
            params.append('limit', limit.toString());
        const queryString = params.toString();
        const response = await this.makeRequest('GET', `/fills${queryString ? `?${queryString}` : ''}`, 'fetchMyTrades');
        if (!Array.isArray(response)) {
            throw new PerpDEXError('Invalid fills response', 'INVALID_RESPONSE', 'backpack');
        }
        return response.map((trade) => this.normalizer.normalizeTrade(trade, symbol));
    }
    /**
     * Convert unified symbol to exchange format
     */
    symbolToExchange(symbol) {
        return this.normalizer.toBackpackSymbol(symbol);
    }
    /**
     * Convert exchange symbol to unified format
     */
    symbolFromExchange(exchangeSymbol) {
        return this.normalizer.normalizeSymbol(exchangeSymbol);
    }
    /**
     * Make authenticated HTTP request using HTTPClient
     *
     * Backpack API uses /api/v1 prefix for all endpoints.
     */
    async makeRequest(method, path, endpoint, body) {
        await this.rateLimiter.acquire(endpoint);
        // Backpack requires /api/v1 prefix for all endpoints
        const fullPath = `/api/v1${path}`;
        const headers = {};
        if (this.auth) {
            const timestamp = Date.now().toString();
            headers['X-API-KEY'] = this.auth.getApiKey();
            headers['X-Timestamp'] = timestamp;
            headers['X-Signature'] = await this.auth.signRequest(method, fullPath, timestamp, body);
        }
        try {
            switch (method) {
                case 'GET':
                    return await this.httpClient.get(fullPath, { headers });
                case 'POST':
                    return await this.httpClient.post(fullPath, { headers, body });
                case 'PUT':
                    return await this.httpClient.put(fullPath, { headers, body });
                case 'DELETE':
                    return await this.httpClient.delete(fullPath, { headers, body });
                default:
                    throw new Error(`Unsupported HTTP method: ${method}`);
            }
        }
        catch (error) {
            if (error instanceof PerpDEXError) {
                throw error;
            }
            const { code, message } = mapBackpackError(error);
            throw new PerpDEXError('Request failed', code, 'backpack', error);
        }
    }
}
//# sourceMappingURL=BackpackAdapter.js.map