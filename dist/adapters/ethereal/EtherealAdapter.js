/**
 * Ethereal Exchange Adapter
 *
 * Implements IExchangeAdapter for Ethereal DEX.
 * Ethereal is a perpetual DEX with REST API and EIP-712 authentication.
 */
import { Wallet } from 'ethers';
import { PerpDEXError, NotSupportedError } from '../../types/errors.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { ETHEREAL_API_URLS, ETHEREAL_RATE_LIMITS, ETHEREAL_ENDPOINT_WEIGHTS, unifiedToEthereal, etherealToUnified, } from './constants.js';
import { EtherealAuth } from './EtherealAuth.js';
import { EtherealNormalizer } from './EtherealNormalizer.js';
import { buildOrderRequest } from './utils.js';
import { mapError } from './error-codes.js';
export class EtherealAdapter extends BaseAdapter {
    id = 'ethereal';
    name = 'Ethereal';
    has = {
        // Market Data
        fetchMarkets: true,
        fetchTicker: true,
        fetchOrderBook: true,
        fetchTrades: true,
        fetchOHLCV: false,
        fetchFundingRate: true,
        fetchFundingRateHistory: false,
        // Trading
        createOrder: true,
        cancelOrder: true,
        cancelAllOrders: true,
        editOrder: false,
        // Account
        fetchOpenOrders: true,
        fetchOrderHistory: false,
        fetchMyTrades: true,
        fetchDeposits: false,
        fetchWithdrawals: false,
        // Positions & Balance
        fetchPositions: true,
        fetchBalance: true,
        setLeverage: false,
        setMarginMode: false,
        // WebSocket
        watchOrderBook: false,
        watchTrades: false,
        watchTicker: false,
        watchOrders: false,
        watchPositions: false,
        watchBalance: false,
    };
    auth;
    baseUrl;
    httpClient;
    rateLimiter;
    normalizer;
    accountId;
    /** Maps unified symbol (e.g. "ETH/USD:USD") to product UUID */
    productMap = new Map();
    /** Maps product UUID to cached product info */
    productCache = new Map();
    constructor(config = {}) {
        super(config);
        const urls = config.testnet ? ETHEREAL_API_URLS.testnet : ETHEREAL_API_URLS.mainnet;
        this.baseUrl = config.apiUrl ?? urls.rest;
        this.accountId = config.accountId ?? '';
        if (config.privateKey) {
            const wallet = new Wallet(config.privateKey);
            this.auth = new EtherealAuth(wallet);
        }
        this.normalizer = new EtherealNormalizer();
        this.rateLimiter = new RateLimiter({
            maxTokens: config.rateLimit?.maxRequests ?? ETHEREAL_RATE_LIMITS.rest.maxRequests,
            windowMs: config.rateLimit?.windowMs ?? ETHEREAL_RATE_LIMITS.rest.windowMs,
            refillRate: (config.rateLimit?.maxRequests ?? ETHEREAL_RATE_LIMITS.rest.maxRequests) / 60,
            weights: ETHEREAL_ENDPOINT_WEIGHTS,
        });
        this.httpClient = new HTTPClient({
            baseUrl: this.baseUrl,
            timeout: config.timeout ?? 30000,
            retry: {
                maxAttempts: 3,
                initialDelay: 1000,
                maxDelay: 10000,
                multiplier: 2,
            },
            circuitBreaker: {
                enabled: true,
                failureThreshold: 5,
                resetTimeout: 60000,
            },
            exchange: this.id,
        });
    }
    async initialize() {
        this._isReady = true;
    }
    // === Symbol conversion (required by BaseAdapter) ===
    symbolToExchange(symbol) {
        return unifiedToEthereal(symbol);
    }
    symbolFromExchange(exchangeSymbol) {
        return etherealToUnified(exchangeSymbol);
    }
    // === Auth helpers ===
    requireAuth() {
        if (!this.auth) {
            throw new PerpDEXError('Private key required for authenticated operations', 'MISSING_CREDENTIALS', 'ethereal');
        }
        return this.auth;
    }
    async publicGet(path, feature) {
        await this.rateLimiter.acquire(feature);
        try {
            return await this.httpClient.get(path);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async authenticatedRequest(method, path, feature, body) {
        this.requireAuth();
        await this.rateLimiter.acquire(feature);
        try {
            const headers = this.auth.getHeaders();
            if (method === 'GET') {
                return await this.httpClient.get(path, { headers });
            }
            else if (method === 'DELETE') {
                return await this.httpClient.delete(path, { headers });
            }
            else {
                return await this.httpClient.post(path, { body, headers });
            }
        }
        catch (error) {
            throw mapError(error);
        }
    }
    // === Product UUID helpers ===
    async ensureProductMap() {
        if (this.productMap.size > 0)
            return;
        await this.fetchMarkets();
    }
    async getProductId(symbol) {
        await this.ensureProductMap();
        const productId = this.productMap.get(symbol);
        if (!productId) {
            throw new PerpDEXError(`Unknown symbol: ${symbol}. Call fetchMarkets() first.`, 'INVALID_SYMBOL', 'ethereal');
        }
        return productId;
    }
    getProductInfo(productId) {
        return this.productCache.get(productId);
    }
    // === Public Market Data ===
    async fetchMarkets(_params) {
        const response = await this.publicGet('/product', 'fetchMarkets');
        const products = response.data;
        if (!Array.isArray(products)) {
            throw new PerpDEXError('Invalid markets response', 'INVALID_RESPONSE', 'ethereal');
        }
        // Build product UUID cache
        for (const p of products) {
            const unifiedSymbol = etherealToUnified(p.displayTicker);
            this.productMap.set(unifiedSymbol, p.id);
            this.productCache.set(p.id, p);
        }
        return products
            .filter((m) => m.status === 'ACTIVE')
            .map((m) => this.normalizer.normalizeMarket(m));
    }
    async _fetchTicker(symbol) {
        const productId = await this.getProductId(symbol);
        const response = await this.publicGet(`/product/market-price?productIds=${productId}`, 'fetchTicker');
        const prices = response.data;
        if (!Array.isArray(prices) || prices.length === 0) {
            throw new PerpDEXError('Invalid ticker response', 'INVALID_RESPONSE', 'ethereal');
        }
        const product = this.getProductInfo(productId);
        return this.normalizer.normalizeTicker(prices[0], symbol, product);
    }
    async _fetchOrderBook(symbol, _params) {
        const productId = await this.getProductId(symbol);
        const response = await this.publicGet(`/product/market-liquidity?productId=${productId}`, 'fetchOrderBook');
        return this.normalizer.normalizeOrderBook(response, symbol);
    }
    async _fetchTrades(symbol, params) {
        const productId = await this.getProductId(symbol);
        let path = `/order/trade?productId=${productId}`;
        if (params?.limit) {
            path += `&limit=${params.limit}`;
        }
        if (params?.since) {
            path += `&since=${params.since}`;
        }
        const response = await this.publicGet(path, 'fetchTrades');
        const trades = response.data;
        if (!Array.isArray(trades)) {
            throw new PerpDEXError('Invalid trades response', 'INVALID_RESPONSE', 'ethereal');
        }
        return trades.map((t) => this.normalizer.normalizeTrade(t, symbol));
    }
    async _fetchFundingRate(symbol) {
        const productId = await this.getProductId(symbol);
        const response = await this.publicGet(`/funding/projected?productId=${productId}`, 'fetchFundingRate');
        return this.normalizer.normalizeFundingRate(response, symbol);
    }
    async fetchFundingRateHistory(_symbol, _since, _limit) {
        throw new NotSupportedError('Ethereal does not support funding rate history via REST API', 'NOT_SUPPORTED', 'ethereal');
    }
    async fetchOHLCV(_symbol, _timeframe = '1h', _params) {
        throw new NotSupportedError('Ethereal does not support OHLCV/candles via REST API', 'NOT_SUPPORTED', 'ethereal');
    }
    // === Private Trading ===
    async createOrder(request) {
        const auth = this.requireAuth();
        await this.rateLimiter.acquire('createOrder');
        try {
            const { signature, nonce } = await auth.signOrderAction({
                accountId: this.accountId,
            });
            const orderReq = buildOrderRequest(request, this.accountId, signature, nonce);
            const response = await this.httpClient.post('/order', {
                body: orderReq,
                headers: auth.getHeaders(),
            });
            return this.normalizer.normalizeOrder(response, request.symbol);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async cancelOrder(orderId, symbol) {
        const auth = this.requireAuth();
        await this.rateLimiter.acquire('cancelOrder');
        try {
            const { signature, nonce } = await auth.signCancelAction(this.accountId, orderId);
            const response = await this.httpClient.post('/order/cancel', {
                body: { orderId },
                headers: {
                    ...auth.getHeaders(),
                    'X-Signature': signature,
                    'X-Nonce': nonce,
                    'X-Account-Id': this.accountId,
                },
            });
            return this.normalizer.normalizeOrder(response, symbol);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async cancelAllOrders(symbol) {
        const auth = this.requireAuth();
        await this.rateLimiter.acquire('cancelAllOrders');
        try {
            const { signature, nonce } = await auth.signCancelAction(this.accountId);
            const body = {};
            if (symbol) {
                const productId = await this.getProductId(symbol);
                body.productId = productId;
            }
            await this.httpClient.post('/order/cancel', {
                body,
                headers: {
                    ...auth.getHeaders(),
                    'X-Signature': signature,
                    'X-Nonce': nonce,
                    'X-Account-Id': this.accountId,
                },
            });
            return [];
        }
        catch (error) {
            throw mapError(error);
        }
    }
    // === Account History ===
    async fetchOpenOrders(symbol) {
        this.requireAuth();
        const response = await this.authenticatedRequest('GET', '/order?status=OPEN', 'fetchOpenOrders');
        if (!Array.isArray(response)) {
            throw new PerpDEXError('Invalid orders response', 'INVALID_RESPONSE', 'ethereal');
        }
        let orders = response.map((o) => this.normalizer.normalizeOrder(o));
        if (symbol) {
            orders = orders.filter((o) => o.symbol === symbol);
        }
        return orders;
    }
    async fetchOrderHistory(_symbol, _since, _limit) {
        throw new NotSupportedError('Ethereal does not provide order history via REST API', 'NOT_SUPPORTED', 'ethereal');
    }
    async fetchMyTrades(symbol, since, limit) {
        this.requireAuth();
        let path = '/order/trade';
        const queryParts = [];
        if (symbol) {
            const productId = await this.getProductId(symbol);
            queryParts.push(`productId=${productId}`);
        }
        if (since) {
            queryParts.push(`since=${since}`);
        }
        if (limit) {
            queryParts.push(`limit=${limit}`);
        }
        if (queryParts.length > 0) {
            path += `?${queryParts.join('&')}`;
        }
        const response = await this.authenticatedRequest('GET', path, 'fetchMyTrades');
        if (!Array.isArray(response)) {
            throw new PerpDEXError('Invalid trades response', 'INVALID_RESPONSE', 'ethereal');
        }
        return response.map((t) => {
            const price = parseFloat(t.price);
            const amount = parseFloat(t.filled);
            // takerSide: 0 = buy, 1 = sell
            const side = t.takerSide === 0 ? 'buy' : 'sell';
            const tradeSymbol = symbol ?? 'UNKNOWN';
            return {
                id: t.id,
                symbol: tradeSymbol,
                side,
                price,
                amount,
                cost: price * amount,
                timestamp: t.createdAt,
                info: t,
            };
        });
    }
    // === Positions & Balance ===
    async fetchPositions(symbols) {
        this.requireAuth();
        const response = await this.authenticatedRequest('GET', '/position/active', 'fetchPositions');
        if (!Array.isArray(response)) {
            throw new PerpDEXError('Invalid positions response', 'INVALID_RESPONSE', 'ethereal');
        }
        let positions = response
            .filter((p) => parseFloat(p.size) !== 0)
            .map((p) => this.normalizer.normalizePosition(p));
        if (symbols && symbols.length > 0) {
            positions = positions.filter((p) => symbols.includes(p.symbol));
        }
        return positions;
    }
    async fetchBalance() {
        this.requireAuth();
        const response = await this.authenticatedRequest('GET', '/subaccount/balance', 'fetchBalance');
        if (!Array.isArray(response)) {
            throw new PerpDEXError('Invalid balance response', 'INVALID_RESPONSE', 'ethereal');
        }
        return response
            .filter((b) => parseFloat(b.total) > 0)
            .map((b) => this.normalizer.normalizeBalance(b));
    }
    async _setLeverage(_symbol, _leverage) {
        throw new NotSupportedError('Ethereal does not support per-symbol leverage setting via REST API', 'NOT_SUPPORTED', 'ethereal');
    }
}
//# sourceMappingURL=EtherealAdapter.js.map