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
import { RateLimiter } from '../../core/RateLimiter.js';
import { PerpDEXError } from '../../types/errors.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { KatanaAuth } from './KatanaAuth.js';
import { KATANA_API_URLS, KATANA_RATE_LIMITS, KATANA_ENDPOINT_WEIGHTS, KATANA_TIMEFRAMES, } from './constants.js';
import { toKatanaSymbol, normalizeMarket, normalizeOrder, normalizePosition, normalizeBalance, normalizeOrderBook, normalizeTrade, normalizeFill, normalizeTicker, normalizeFundingRate, convertOrderRequest, formatDecimal, mapError, normalizeSymbol, } from './utils.js';
/**
 * Katana Exchange Adapter
 */
export class KatanaAdapter extends BaseAdapter {
    id = 'katana';
    name = 'Katana';
    has = {
        // Market Data (Public)
        fetchMarkets: true,
        fetchTicker: true,
        fetchOrderBook: true,
        fetchTrades: true,
        fetchOHLCV: true,
        fetchFundingRate: true,
        fetchFundingRateHistory: true,
        // Trading (Private)
        createOrder: true,
        cancelOrder: true,
        cancelAllOrders: true,
        createBatchOrders: false,
        cancelBatchOrders: false,
        editOrder: false,
        // Order Query
        fetchOpenOrders: true,
        fetchOrderHistory: true,
        fetchMyTrades: true,
        // Positions & Balance
        fetchPositions: true,
        fetchBalance: true,
        setLeverage: true,
        setMarginMode: false, // cross-margin only
        // WebSocket (Phase 2)
        watchOrderBook: false,
        watchTrades: false,
        watchTicker: false,
        watchPositions: false,
        watchOrders: false,
        watchBalance: false,
        watchMyTrades: false,
    };
    auth;
    rateLimiter;
    http;
    testnet;
    baseUrl;
    constructor(config = {}) {
        super(config);
        this.testnet = config.testnet ?? false;
        this.baseUrl = this.testnet
            ? KATANA_API_URLS.sandbox.rest
            : KATANA_API_URLS.mainnet.rest;
        this.auth = new KatanaAuth(config);
        this.rateLimiter = new RateLimiter({
            maxTokens: KATANA_RATE_LIMITS.private.maxRequests,
            windowMs: KATANA_RATE_LIMITS.private.windowMs,
            weights: KATANA_ENDPOINT_WEIGHTS,
        });
        this.http = new HTTPClient({
            baseUrl: this.baseUrl,
            timeout: config.timeout ?? 30000,
            exchange: 'katana',
            retry: {
                maxAttempts: 3,
                initialDelay: 1000,
                maxDelay: 10000,
                multiplier: 2,
                retryableStatuses: [408, 429, 500, 502, 503, 504],
            },
        });
    }
    // -- Abstract method implementations --
    symbolToExchange(symbol) {
        return toKatanaSymbol(symbol);
    }
    symbolFromExchange(exchangeSymbol) {
        return normalizeSymbol(exchangeSymbol);
    }
    // -- Lifecycle --
    async initialize() {
        // Calculate server time offset for nonce accuracy
        try {
            const serverTime = await this.publicGet('/time');
            const localTime = Date.now();
            this.auth.setServerTimeOffset(serverTime.serverTime - localTime);
        }
        catch {
            this.warn('Failed to sync server time, using local clock');
        }
        // Load markets
        await this.fetchMarkets();
        this._isReady = true;
    }
    // -- Public Market Data --
    async fetchMarkets(_params) {
        await this.rateLimiter.acquire('fetchMarkets');
        const raw = await this.publicGet('/markets');
        const markets = raw.map(normalizeMarket);
        this.marketCache = markets;
        this.marketCacheExpiry = Date.now() + this.marketCacheTTL;
        return markets;
    }
    async _fetchTicker(symbol) {
        await this.rateLimiter.acquire('fetchTicker');
        const katanaSymbol = toKatanaSymbol(symbol);
        const raw = await this.publicGet('/tickers', { market: katanaSymbol });
        if (!raw.length) {
            throw new PerpDEXError(`No ticker data for ${symbol}`, 'NOT_FOUND', 'katana');
        }
        return normalizeTicker(raw[0]);
    }
    async _fetchOrderBook(symbol, params) {
        await this.rateLimiter.acquire('fetchOrderBook');
        const katanaSymbol = toKatanaSymbol(symbol);
        const limit = params?.limit ?? 100;
        const raw = await this.publicGet('/orderbook', {
            market: katanaSymbol,
            level: 2,
            limit,
        });
        return normalizeOrderBook(raw, katanaSymbol);
    }
    async _fetchTrades(symbol, params) {
        await this.rateLimiter.acquire('fetchTrades');
        const katanaSymbol = toKatanaSymbol(symbol);
        const raw = await this.publicGet('/trades', {
            market: katanaSymbol,
            limit: params?.limit ?? 50,
        });
        return raw.map(normalizeTrade);
    }
    async fetchOHLCV(symbol, timeframe, params) {
        await this.rateLimiter.acquire('fetchOHLCV');
        const katanaSymbol = toKatanaSymbol(symbol);
        const interval = KATANA_TIMEFRAMES[timeframe ?? '1h'] ?? '1h';
        const query = {
            market: katanaSymbol,
            interval,
            limit: params?.limit ?? 100,
        };
        if (params?.since)
            query.start = params.since;
        const raw = await this.publicGet('/candles', query);
        return raw.map((c) => [
            c.start,
            parseFloat(c.open),
            parseFloat(c.high),
            parseFloat(c.low),
            parseFloat(c.close),
            parseFloat(c.baseVolume),
        ]);
    }
    async _fetchFundingRate(symbol) {
        await this.rateLimiter.acquire('fetchFundingRate');
        const katanaSymbol = toKatanaSymbol(symbol);
        const raw = await this.publicGet('/fundingRates', {
            market: katanaSymbol,
            limit: 1,
        });
        if (!raw.length) {
            throw new PerpDEXError(`No funding rate for ${symbol}`, 'NOT_FOUND', 'katana');
        }
        return normalizeFundingRate(raw[0]);
    }
    async fetchFundingRateHistory(symbol, since, limit) {
        await this.rateLimiter.acquire('fetchFundingRateHistory');
        const katanaSymbol = toKatanaSymbol(symbol);
        const query = {
            market: katanaSymbol,
            limit: limit ?? 100,
        };
        if (since)
            query.start = since;
        const raw = await this.publicGet('/fundingRates', query);
        return raw.map(normalizeFundingRate);
    }
    // -- Private Trading --
    async createOrder(request) {
        this.auth.requireAuth();
        this.auth.requireWallet();
        await this.rateLimiter.acquire('createOrder');
        const walletAddress = this.auth.getAddress();
        const nonce = this.auth.generateNonce();
        const payload = convertOrderRequest(request, walletAddress, nonce);
        const signature = await this.auth.signOrder(payload);
        const body = { ...payload, signature };
        const raw = await this.privatePost('/orders', body);
        return normalizeOrder(raw);
    }
    async cancelOrder(orderId, symbol) {
        this.auth.requireAuth();
        this.auth.requireWallet();
        await this.rateLimiter.acquire('cancelOrder');
        const walletAddress = this.auth.getAddress();
        const nonce = this.auth.generateNonce();
        const market = symbol ? toKatanaSymbol(symbol) : '';
        const cancelPayload = { nonce, wallet: walletAddress, orderId, market };
        const signature = await this.auth.signCancel(cancelPayload);
        const body = { ...cancelPayload, signature };
        const raw = await this.privateDelete('/orders', body);
        return normalizeOrder(raw);
    }
    async cancelAllOrders(symbol) {
        this.auth.requireAuth();
        this.auth.requireWallet();
        await this.rateLimiter.acquire('cancelAllOrders');
        const walletAddress = this.auth.getAddress();
        const nonce = this.auth.generateNonce();
        const market = symbol ? toKatanaSymbol(symbol) : '';
        const cancelPayload = { nonce, wallet: walletAddress, orderId: '', market };
        const signature = await this.auth.signCancel(cancelPayload);
        const body = { ...cancelPayload, signature };
        const raw = await this.privateDelete('/orders', body);
        return (Array.isArray(raw) ? raw : []).map(normalizeOrder);
    }
    // -- Order Query --
    async fetchOpenOrders(symbol) {
        this.auth.requireAuth();
        await this.rateLimiter.acquire('fetchOpenOrders');
        const query = {
            wallet: this.auth.getAddress(),
            status: 'open',
        };
        if (symbol)
            query.market = toKatanaSymbol(symbol);
        const raw = await this.privateGet('/orders', query);
        return raw.map(normalizeOrder);
    }
    async fetchOrderHistory(symbol, since, limit) {
        this.auth.requireAuth();
        await this.rateLimiter.acquire('fetchOrderHistory');
        const query = {
            wallet: this.auth.getAddress(),
            limit: limit ?? 50,
        };
        if (symbol)
            query.market = toKatanaSymbol(symbol);
        if (since)
            query.start = since;
        const raw = await this.privateGet('/orders', query);
        return raw.map(normalizeOrder);
    }
    async fetchMyTrades(symbol, since, limit) {
        this.auth.requireAuth();
        await this.rateLimiter.acquire('fetchMyTrades');
        const query = {
            wallet: this.auth.getAddress(),
            limit: limit ?? 50,
        };
        if (symbol)
            query.market = toKatanaSymbol(symbol);
        if (since)
            query.start = since;
        const raw = await this.privateGet('/fills', query);
        return raw.map(normalizeFill);
    }
    // -- Positions & Balance --
    async fetchPositions(symbols) {
        this.auth.requireAuth();
        await this.rateLimiter.acquire('fetchPositions');
        const query = {
            wallet: this.auth.getAddress(),
        };
        const raw = await this.privateGet('/positions', query);
        let positions = raw.map(normalizePosition);
        if (symbols?.length) {
            const symbolSet = new Set(symbols);
            positions = positions.filter((p) => symbolSet.has(p.symbol));
        }
        return positions;
    }
    async fetchBalance() {
        this.auth.requireAuth();
        await this.rateLimiter.acquire('fetchBalance');
        const raw = await this.privateGet('/wallets', {
            wallet: this.auth.getAddress(),
        });
        return [normalizeBalance(raw)];
    }
    async _setLeverage(symbol, leverage) {
        this.auth.requireAuth();
        await this.rateLimiter.acquire('setLeverage');
        const initialMarginFraction = formatDecimal(1 / leverage);
        const katanaSymbol = toKatanaSymbol(symbol);
        await this.privatePost('/initialMarginFractionOverride', {
            wallet: this.auth.getAddress(),
            market: katanaSymbol,
            initialMarginFraction,
        });
    }
    // -- Katana-specific: Emergency close all --
    /**
     * Emergency close all positions and withdraw
     *
     * Maps to DELETE /v1/wallets/{wallet}
     * Atomically: cancels all orders, closes all positions, initiates full withdrawal
     */
    async emergencyCloseAll() {
        this.auth.requireAuth();
        this.auth.requireWallet();
        const walletAddress = this.auth.getAddress();
        const nonce = this.auth.generateNonce();
        const payload = { nonce, wallet: walletAddress, orderId: '', market: '' };
        const signature = await this.auth.signCancel(payload);
        await this.privateDelete(`/wallets/${walletAddress}`, {
            nonce,
            wallet: walletAddress,
            signature,
        });
    }
    // -- HTTP helpers --
    async publicGet(path, query) {
        try {
            const fullPath = this.buildPath(path, query);
            return await this.http.get(fullPath);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async privateGet(path, query) {
        try {
            const fullPath = this.buildPath(path, query);
            const request = { method: 'GET', path, query: query };
            const signed = await this.auth.sign(request);
            return await this.http.get(fullPath, { headers: signed.headers });
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async privatePost(path, body) {
        try {
            const request = { method: 'POST', path, body };
            const signed = await this.auth.sign(request);
            return await this.http.post(path, { headers: signed.headers, body });
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async privateDelete(path, body) {
        try {
            const request = { method: 'DELETE', path, body };
            const signed = await this.auth.sign(request);
            return await this.http.delete(path, { headers: signed.headers, body });
        }
        catch (error) {
            throw mapError(error);
        }
    }
    buildPath(path, query) {
        if (!query)
            return path;
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(query)) {
            if (value != null)
                params.append(key, String(value));
        }
        const qs = params.toString();
        return qs ? `${path}?${qs}` : path;
    }
}
//# sourceMappingURL=KatanaAdapter.js.map