/**
 * Variational Exchange Adapter
 *
 * Arbitrum-based RFQ perpetual DEX adapter
 *
 * ## Implementation Status: FULLY FUNCTIONAL 🟢
 *
 * Variational is an RFQ (Request For Quote) based perpetual DEX on Arbitrum.
 * This adapter supports public market data, trading, and account operations.
 *
 * ### Currently Implemented
 *
 * **Public API:**
 * - ✅ `fetchMarkets()` - Get available trading pairs
 * - ✅ `fetchTicker(symbol)` - Get price information for a symbol
 * - ✅ `fetchOrderBook(symbol)` - Get RFQ quotes as order book
 * - ✅ `fetchFundingRate(symbol)` - Get current funding rate
 *
 * **Trading API (requires API credentials):**
 * - ✅ `createOrder(request)` - Create a new order
 * - ✅ `cancelOrder(orderId)` - Cancel an order
 * - ✅ `cancelAllOrders(symbol?)` - Cancel all orders
 *
 * **Account API (requires API credentials):**
 * - ✅ `fetchPositions(symbols?)` - Get open positions
 * - ✅ `fetchBalance()` - Get account balances
 * - ✅ `fetchOrderHistory(symbol?, since?, limit?)` - Get order history
 * - ✅ `fetchMyTrades(symbol?, since?, limit?)` - Get user trades
 *
 * **RFQ-Specific Methods:**
 * - ✅ `requestQuote(symbol, side, amount)` - Request quotes from market makers
 * - ✅ `acceptQuote(quoteId)` - Accept a quote and execute trade
 *
 * ### Not Yet Implemented
 * - ❌ Public API: fetchTrades, fetchFundingRateHistory
 * - ❌ WebSocket: All streaming methods
 *
 * ### RFQ Order Book Note
 * Unlike traditional order book exchanges, Variational uses an RFQ model.
 * The "order book" is constructed from quotes at different notional sizes
 * ($1k, $100k, $1M), representing available liquidity at each price level.
 *
 * ### Usage
 * ```typescript
 * const adapter = createExchange('variational', {
 *   apiKey: 'your-api-key',
 *   apiSecret: 'your-api-secret',
 *   testnet: true,
 * });
 * await adapter.initialize();
 *
 * // Public API:
 * const markets = await adapter.fetchMarkets();
 * const ticker = await adapter.fetchTicker('BTC/USDC:USDC');
 * const orderbook = await adapter.fetchOrderBook('BTC/USDC:USDC');
 *
 * // Account API:
 * const positions = await adapter.fetchPositions();
 * const balance = await adapter.fetchBalance();
 * const history = await adapter.fetchOrderHistory();
 *
 * // RFQ Trading:
 * const quotes = await adapter.requestQuote('BTC/USDC:USDC', 'buy', 0.1);
 * const order = await adapter.acceptQuote(quotes[0].quoteId);
 *
 * // Standard Trading:
 * const order = await adapter.createOrder({
 *   symbol: 'BTC/USDC:USDC',
 *   type: 'limit',
 *   side: 'buy',
 *   amount: 0.1,
 *   price: 95000,
 * });
 * ```
 *
 * @see https://variational.io/ - Variational official website
 */
import { createHmacSha256 } from '../../utils/crypto.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { PerpDEXError } from '../../types/errors.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { VARIATIONAL_API_URLS, VARIATIONAL_ENDPOINTS, VARIATIONAL_RATE_LIMITS, VARIATIONAL_ENDPOINT_WEIGHTS, VARIATIONAL_DEFAULTS, } from './constants.js';
import { VariationalNormalizer } from './VariationalNormalizer.js';
import { convertOrderRequest, mapError, validateOrderRequest, generateClientOrderId } from './utils.js';
/**
 * Variational exchange adapter
 *
 * RFQ-based perpetual DEX on Arbitrum with HMAC-SHA256 authentication
 */
export class VariationalAdapter extends BaseAdapter {
    id = 'variational';
    name = 'Variational';
    has = {
        // Public API (Available)
        fetchMarkets: true,
        fetchTicker: true,
        fetchOrderBook: true, // RFQ-based order book from quotes
        fetchFundingRate: true, // From metadata/stats
        // Public API (Not yet implemented/documented)
        fetchTrades: false, // No trades endpoint for RFQ DEX
        fetchFundingRateHistory: false,
        // Trading API (Implemented - requires API endpoint availability)
        createOrder: true,
        cancelOrder: true,
        cancelAllOrders: true,
        createBatchOrders: false, // Not supported natively
        cancelBatchOrders: false, // Not supported natively
        editOrder: false, // Not supported
        // Account API (Implemented)
        fetchPositions: true,
        fetchBalance: true,
        fetchOrderHistory: true,
        fetchMyTrades: true,
        fetchOpenOrders: false, // Not yet implemented
        fetchUserFees: false,
        fetchPortfolio: false,
        setLeverage: false, // Not supported
        setMarginMode: false, // Not supported
        fetchDeposits: false, // Not supported
        fetchWithdrawals: false, // Not supported
        // WebSocket (Not yet available)
        watchOrderBook: false,
        watchTrades: false,
        watchTicker: false,
        watchPositions: false,
        watchOrders: false,
        watchBalance: false,
    };
    apiUrl;
    apiKey;
    apiSecret;
    rateLimiter;
    httpClient;
    normalizer;
    wsManager = null;
    constructor(config = {}) {
        super(config);
        const testnet = config.testnet ?? false;
        const urls = testnet ? VARIATIONAL_API_URLS.testnet : VARIATIONAL_API_URLS.mainnet;
        this.apiUrl = urls.rest;
        this.apiKey = config.apiKey;
        this.apiSecret = config.apiSecret;
        this.normalizer = new VariationalNormalizer();
        const tier = config.rateLimitTier ?? VARIATIONAL_DEFAULTS.rateLimitTier;
        const limits = VARIATIONAL_RATE_LIMITS[tier];
        this.rateLimiter = new RateLimiter({
            maxTokens: limits.maxRequests,
            refillRate: limits.maxRequests / (limits.windowMs / 1000),
            windowMs: limits.windowMs,
            weights: VARIATIONAL_ENDPOINT_WEIGHTS,
        });
        this.httpClient = new HTTPClient({
            baseUrl: this.apiUrl,
            timeout: config.timeout || VARIATIONAL_DEFAULTS.timeout,
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
        this._isDisconnected = false;
        this.info('Variational adapter initialized');
    }
    async disconnect() {
        if (this.wsManager) {
            await this.wsManager.disconnect();
            this.wsManager = null;
        }
        this._isReady = false;
        this._isDisconnected = true;
        this.info('Variational adapter disconnected');
    }
    // ==================== Symbol Conversion Methods ====================
    /**
     * Convert unified symbol to Variational format
     */
    symbolToExchange(symbol) {
        return this.normalizer.symbolFromCCXT(symbol);
    }
    /**
     * Convert Variational symbol to unified format
     */
    symbolFromExchange(exchangeSymbol) {
        return this.normalizer.symbolToCCXT(exchangeSymbol);
    }
    // ==================== Market Data Methods ====================
    async fetchMarkets(_params) {
        await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.METADATA_STATS);
        try {
            const response = await this.httpClient.get(VARIATIONAL_ENDPOINTS.METADATA_STATS, {});
            const listings = response.listings || [];
            return this.normalizer.normalizeMarketsFromListings(listings);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchTicker(symbol) {
        await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.METADATA_STATS);
        if (!symbol) {
            throw new PerpDEXError('Symbol is required', 'INVALID_SYMBOL', this.id);
        }
        try {
            // Extract ticker from unified symbol format (e.g., "BTC/USDC:USDC" -> "BTC")
            const ticker = symbol.split('/')[0];
            const response = await this.httpClient.get(VARIATIONAL_ENDPOINTS.METADATA_STATS, {});
            const listings = response.listings || [];
            const listing = listings.find((l) => l.ticker === ticker);
            if (!listing) {
                throw new PerpDEXError(`Market not found: ${symbol}`, 'NOT_FOUND', this.id);
            }
            return this.normalizer.normalizeTickerFromListing(listing);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchOrderBook(symbol, _params) {
        await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.METADATA_STATS);
        if (!symbol) {
            throw new PerpDEXError('Symbol is required', 'INVALID_SYMBOL', this.id);
        }
        try {
            // Extract ticker from unified symbol format (e.g., "BTC/USDC:USDC" -> "BTC")
            const ticker = symbol.split('/')[0];
            const response = await this.httpClient.get(VARIATIONAL_ENDPOINTS.METADATA_STATS, {});
            const listings = response.listings || [];
            const listing = listings.find((l) => l.ticker === ticker);
            if (!listing) {
                throw new PerpDEXError(`Market not found: ${symbol}`, 'NOT_FOUND', this.id);
            }
            // Variational is an RFQ DEX - order book is constructed from quotes at different sizes
            return this.normalizer.normalizeOrderBookFromListing(listing);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchTrades(_symbol, _params) {
        await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.TRADES);
        throw new PerpDEXError('fetchTrades not implemented', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchFundingRate(symbol) {
        await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.METADATA_STATS);
        if (!symbol) {
            throw new PerpDEXError('Symbol is required', 'INVALID_SYMBOL', this.id);
        }
        try {
            // Extract ticker from unified symbol format (e.g., "BTC/USDC:USDC" -> "BTC")
            const ticker = symbol.split('/')[0];
            const response = await this.httpClient.get(VARIATIONAL_ENDPOINTS.METADATA_STATS, {});
            const listings = response.listings || [];
            const listing = listings.find((l) => l.ticker === ticker);
            if (!listing) {
                throw new PerpDEXError(`Market not found: ${symbol}`, 'NOT_FOUND', this.id);
            }
            return this.normalizer.normalizeFundingRateFromListing(listing);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchFundingRateHistory(_symbol, _since, _limit) {
        await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.FUNDING_HISTORY);
        throw new PerpDEXError('fetchFundingRateHistory not implemented', 'NOT_IMPLEMENTED', this.id);
    }
    // ==================== Trading Methods ====================
    async createOrder(request) {
        this.ensureAuthenticated();
        await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.CREATE_ORDER);
        validateOrderRequest(request);
        try {
            const orderRequest = convertOrderRequest(request);
            orderRequest.clientOrderId = orderRequest.clientOrderId || generateClientOrderId();
            // Convert symbol to Variational format
            orderRequest.symbol = this.symbolToExchange(request.symbol);
            const response = await this.authenticatedRequest('POST', VARIATIONAL_ENDPOINTS.CREATE_ORDER, orderRequest);
            return this.normalizer.normalizeOrder(response);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async cancelOrder(orderId, _symbol) {
        this.ensureAuthenticated();
        await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.CANCEL_ORDER);
        if (!orderId) {
            throw new PerpDEXError('Order ID is required', 'INVALID_ORDER_ID', this.id);
        }
        try {
            const endpoint = VARIATIONAL_ENDPOINTS.CANCEL_ORDER.replace('{orderId}', orderId);
            const response = await this.authenticatedRequest('DELETE', endpoint);
            return this.normalizer.normalizeOrder(response);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async cancelAllOrders(symbol) {
        this.ensureAuthenticated();
        await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.CANCEL_ALL_ORDERS);
        try {
            const body = symbol ? { symbol: this.symbolToExchange(symbol) } : undefined;
            const response = await this.authenticatedRequest('DELETE', VARIATIONAL_ENDPOINTS.CANCEL_ALL_ORDERS, body);
            return this.normalizer.normalizeOrders(response.orders || []);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async createBatchOrders(_requests) {
        // Variational doesn't support batch orders natively
        // Use sequential execution through BaseAdapter
        throw new PerpDEXError('createBatchOrders not supported', 'NOT_SUPPORTED', this.id);
    }
    async cancelBatchOrders(_orderIds, _symbol) {
        // Variational doesn't support batch cancellations natively
        throw new PerpDEXError('cancelBatchOrders not supported', 'NOT_SUPPORTED', this.id);
    }
    // ==================== Account Methods ====================
    async fetchPositions(symbols) {
        this.ensureAuthenticated();
        await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.POSITIONS);
        try {
            const response = await this.authenticatedRequest('GET', VARIATIONAL_ENDPOINTS.POSITIONS);
            let positions = this.normalizer.normalizePositions(response.positions || []);
            // Filter by symbols if provided
            if (symbols && symbols.length > 0) {
                positions = positions.filter((p) => symbols.includes(p.symbol));
            }
            return positions;
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchBalance() {
        this.ensureAuthenticated();
        await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.BALANCE);
        try {
            const response = await this.authenticatedRequest('GET', VARIATIONAL_ENDPOINTS.BALANCE);
            return this.normalizer.normalizeBalances(response.balances || []);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async setLeverage(_symbol, _leverage) {
        throw new PerpDEXError('setLeverage not supported', 'NOT_SUPPORTED', this.id);
    }
    async setMarginMode(_symbol, _marginMode) {
        throw new PerpDEXError('setMarginMode not supported', 'NOT_SUPPORTED', this.id);
    }
    async fetchOrderHistory(symbol, since, limit) {
        this.ensureAuthenticated();
        await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.ORDER_HISTORY);
        try {
            const params = {};
            if (symbol) {
                params.symbol = this.symbolToExchange(symbol);
            }
            if (since) {
                params.since = since.toString();
            }
            if (limit) {
                params.limit = limit.toString();
            }
            // Build query string
            const queryString = Object.entries(params)
                .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                .join('&');
            const endpoint = queryString
                ? `${VARIATIONAL_ENDPOINTS.ORDER_HISTORY}?${queryString}`
                : VARIATIONAL_ENDPOINTS.ORDER_HISTORY;
            const response = await this.authenticatedRequest('GET', endpoint);
            return this.normalizer.normalizeOrders(response.orders || []);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchMyTrades(symbol, since, limit) {
        this.ensureAuthenticated();
        await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.USER_TRADES);
        try {
            const params = {};
            if (symbol) {
                params.symbol = this.symbolToExchange(symbol);
            }
            if (since) {
                params.since = since.toString();
            }
            if (limit) {
                params.limit = limit.toString();
            }
            // Build query string
            const queryString = Object.entries(params)
                .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                .join('&');
            const endpoint = queryString
                ? `${VARIATIONAL_ENDPOINTS.USER_TRADES}?${queryString}`
                : VARIATIONAL_ENDPOINTS.USER_TRADES;
            const response = await this.authenticatedRequest('GET', endpoint);
            return this.normalizer.normalizeTrades(response.trades || []);
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
        await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.USER_FEES);
        throw new PerpDEXError('fetchUserFees not implemented', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchPortfolio() {
        await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.PORTFOLIO);
        throw new PerpDEXError('fetchPortfolio not implemented', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchRateLimitStatus() {
        throw new PerpDEXError('fetchRateLimitStatus not implemented', 'NOT_IMPLEMENTED', this.id);
    }
    // ==================== WebSocket Methods ====================
    async *watchOrderBook(_symbol, _limit) {
        throw new PerpDEXError('watchOrderBook not implemented', 'NOT_IMPLEMENTED', this.id);
    }
    async *watchTrades(_symbol) {
        throw new PerpDEXError('watchTrades not implemented', 'NOT_IMPLEMENTED', this.id);
    }
    async *watchTicker(_symbol) {
        throw new PerpDEXError('watchTicker not implemented', 'NOT_IMPLEMENTED', this.id);
    }
    async *watchPositions() {
        throw new PerpDEXError('watchPositions not implemented', 'NOT_IMPLEMENTED', this.id);
    }
    async *watchOrders() {
        throw new PerpDEXError('watchOrders not implemented', 'NOT_IMPLEMENTED', this.id);
    }
    async *watchBalance() {
        throw new PerpDEXError('watchBalance not implemented', 'NOT_IMPLEMENTED', this.id);
    }
    async *watchFundingRate(_symbol) {
        throw new PerpDEXError('watchFundingRate not implemented', 'NOT_IMPLEMENTED', this.id);
    }
    // ==================== RFQ-Specific Methods ====================
    /**
     * Request quotes from market makers (RFQ-specific)
     *
     * This method requests quotes from Variational's market makers for a specific
     * trade size. The quotes will expire after a short period (typically 10 seconds).
     *
     * @param symbol - Trading pair in unified format (e.g., "BTC/USDC:USDC")
     * @param side - Trade direction ('buy' or 'sell')
     * @param amount - Trade size in base currency
     * @returns Array of quotes from market makers
     */
    async requestQuote(symbol, side, amount) {
        this.ensureAuthenticated();
        await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.REQUEST_QUOTE);
        if (!symbol) {
            throw new PerpDEXError('Symbol is required', 'INVALID_SYMBOL', this.id);
        }
        if (!['buy', 'sell'].includes(side)) {
            throw new PerpDEXError('Invalid order side', 'INVALID_ORDER_SIDE', this.id);
        }
        if (!amount || amount <= 0) {
            throw new PerpDEXError('Amount must be greater than 0', 'INVALID_AMOUNT', this.id);
        }
        try {
            const request = {
                symbol: this.symbolToExchange(symbol),
                side,
                amount: amount.toString(),
            };
            const response = await this.authenticatedRequest('POST', VARIATIONAL_ENDPOINTS.REQUEST_QUOTE, request);
            return response.quotes || [];
        }
        catch (error) {
            throw mapError(error);
        }
    }
    /**
     * Accept a quote and execute trade (RFQ-specific)
     *
     * After receiving quotes from requestQuote(), use this method to accept
     * a specific quote and execute the trade. The quote must not be expired.
     *
     * @param quoteId - The ID of the quote to accept
     * @returns The resulting order from accepting the quote
     */
    async acceptQuote(quoteId) {
        this.ensureAuthenticated();
        await this.rateLimiter.acquire(VARIATIONAL_ENDPOINTS.ACCEPT_QUOTE);
        if (!quoteId) {
            throw new PerpDEXError('Quote ID is required', 'INVALID_QUOTE_ID', this.id);
        }
        try {
            const endpoint = VARIATIONAL_ENDPOINTS.ACCEPT_QUOTE.replace('{quoteId}', quoteId);
            const response = await this.authenticatedRequest('POST', endpoint);
            return this.normalizer.normalizeOrder(response);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    // ==================== Private Helper Methods ====================
    /**
     * Ensure API credentials are configured
     */
    ensureAuthenticated() {
        if (!this.apiKey || !this.apiSecret) {
            throw new PerpDEXError('API credentials required for this operation', 'AUTHENTICATION_REQUIRED', this.id);
        }
    }
    /**
     * Generate HMAC-SHA256 signature for authenticated requests
     * Note: This is now async to support browser Web Crypto API
     */
    async generateSignature(method, path, timestamp, body) {
        if (!this.apiSecret) {
            throw new PerpDEXError('API secret required for authentication', 'MISSING_API_SECRET', this.id);
        }
        const message = `${timestamp}${method}${path}${body ? JSON.stringify(body) : ''}`;
        return createHmacSha256(this.apiSecret, message);
    }
    /**
     * Make an authenticated request to the Variational API
     *
     * All authenticated requests include:
     * - X-API-Key: The API key
     * - X-Timestamp: Unix timestamp in milliseconds
     * - X-Signature: HMAC-SHA256 signature
     */
    async authenticatedRequest(method, path, body) {
        const timestamp = Date.now().toString();
        const signature = await this.generateSignature(method, path, timestamp, body);
        const headers = {
            'X-API-Key': this.apiKey,
            'X-Timestamp': timestamp,
            'X-Signature': signature,
        };
        const options = {
            headers,
            body,
        };
        try {
            let response;
            switch (method) {
                case 'GET':
                    response = await this.httpClient.get(path, { headers });
                    break;
                case 'POST':
                    response = await this.httpClient.post(path, options);
                    break;
                case 'DELETE':
                    response = await this.httpClient.delete(path, options);
                    break;
                case 'PUT':
                    response = await this.httpClient.put(path, options);
                    break;
                default:
                    throw new PerpDEXError(`Unsupported HTTP method: ${method}`, 'INVALID_REQUEST', this.id);
            }
            return response;
        }
        catch (error) {
            throw mapError(error);
        }
    }
}
//# sourceMappingURL=VariationalAdapter.js.map