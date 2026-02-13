/**
 * Aster Exchange Adapter
 *
 * Implements IExchangeAdapter for Aster DEX (Binance-style API)
 */
import { PerpDEXError } from '../../types/errors.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { ASTER_API_URLS, ASTER_RATE_LIMITS, ASTER_ENDPOINT_WEIGHTS, ASTER_KLINE_INTERVALS, } from './constants.js';
import { AsterAuth } from './AsterAuth.js';
import { AsterNormalizer } from './AsterNormalizer.js';
import { toAsterSymbol, buildOrderParams, toUnifiedSymbol } from './utils.js';
import { mapAsterError } from './error-codes.js';
export class AsterAdapter extends BaseAdapter {
    id = 'aster';
    name = 'Aster';
    has = {
        fetchMarkets: true,
        fetchTicker: true,
        fetchOrderBook: true,
        fetchTrades: true,
        fetchOHLCV: true,
        fetchFundingRate: true,
        createOrder: true,
        cancelOrder: true,
        cancelAllOrders: true,
        fetchPositions: true,
        fetchBalance: true,
        setLeverage: true,
        fetchFundingRateHistory: true,
    };
    auth;
    baseUrl;
    httpClient;
    rateLimiter;
    normalizer;
    referralCode;
    builderCodeEnabled;
    constructor(config = {}) {
        super(config);
        const urls = config.testnet ? ASTER_API_URLS.testnet : ASTER_API_URLS.mainnet;
        this.baseUrl = config.apiUrl ?? urls.rest;
        this.referralCode = config.referralCode ?? config.builderCode;
        this.builderCodeEnabled = config.builderCodeEnabled ?? true;
        if (config.apiKey && config.apiSecret) {
            this.auth = new AsterAuth({
                apiKey: config.apiKey,
                apiSecret: config.apiSecret,
            });
        }
        this.normalizer = new AsterNormalizer();
        this.rateLimiter = new RateLimiter({
            maxTokens: config.rateLimit?.maxRequests ?? ASTER_RATE_LIMITS.rest.maxRequests,
            windowMs: config.rateLimit?.windowMs ?? ASTER_RATE_LIMITS.rest.windowMs,
            refillRate: (config.rateLimit?.maxRequests ?? ASTER_RATE_LIMITS.rest.maxRequests) / 60,
            weights: ASTER_ENDPOINT_WEIGHTS,
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
        return toAsterSymbol(symbol);
    }
    symbolFromExchange(exchangeSymbol) {
        // Best-effort reverse mapping without market data
        // "BTCUSDT" -> "BTC/USDT:USDT" (assumes USDT settle for perps)
        const quoteAssets = ['USDT', 'USDC', 'BUSD'];
        for (const quote of quoteAssets) {
            if (exchangeSymbol.endsWith(quote)) {
                const base = exchangeSymbol.slice(0, -quote.length);
                return toUnifiedSymbol(exchangeSymbol, base, quote);
            }
        }
        return exchangeSymbol;
    }
    // === Auth helpers ===
    requireAuth() {
        if (!this.auth?.hasCredentials()) {
            throw new PerpDEXError('API key and secret required', 'MISSING_CREDENTIALS', 'aster');
        }
    }
    async publicGet(path, feature) {
        await this.rateLimiter.acquire(feature);
        try {
            return await this.httpClient.get(path);
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    async signedRequest(method, path, feature, body) {
        this.requireAuth();
        await this.rateLimiter.acquire(feature);
        try {
            const signed = await this.auth.sign({
                method,
                path,
                body,
            });
            const queryString = Object.entries(signed.params ?? {})
                .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
                .join('&');
            const fullPath = queryString ? `${path}?${queryString}` : path;
            const headers = signed.headers ?? {};
            if (method === 'GET') {
                return await this.httpClient.get(fullPath, { headers });
            }
            else if (method === 'DELETE') {
                return await this.httpClient.delete(fullPath, { headers });
            }
            else {
                return await this.httpClient.post(fullPath, { headers });
            }
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    handleError(error) {
        if (error instanceof PerpDEXError)
            return error;
        if (error instanceof Error) {
            const match = error.message.match(/code["\s:]+(-?\d+)/);
            if (match?.[1]) {
                return mapAsterError(parseInt(match[1], 10), error.message);
            }
        }
        return new PerpDEXError(error instanceof Error ? error.message : 'Unknown error', 'UNKNOWN', 'aster');
    }
    // === Public Market Data ===
    async fetchMarkets(_params) {
        const response = await this.publicGet('/fapi/v1/exchangeInfo', 'fetchMarkets');
        if (!response?.symbols || !Array.isArray(response.symbols)) {
            throw new PerpDEXError('Invalid exchangeInfo response', 'INVALID_RESPONSE', 'aster');
        }
        return response.symbols
            .filter((s) => s.contractType === 'PERPETUAL' && s.status === 'TRADING')
            .map((s) => this.normalizer.normalizeMarket(s));
    }
    async fetchTicker(symbol) {
        const asterSymbol = toAsterSymbol(symbol);
        const response = await this.publicGet(`/fapi/v1/ticker/24hr?symbol=${asterSymbol}`, 'fetchTicker');
        return this.normalizer.normalizeTicker(response, symbol);
    }
    async fetchOrderBook(symbol, params) {
        const asterSymbol = toAsterSymbol(symbol);
        const limit = params?.limit ?? 20;
        const response = await this.publicGet(`/fapi/v1/depth?symbol=${asterSymbol}&limit=${limit}`, 'fetchOrderBook');
        return this.normalizer.normalizeOrderBook(response, symbol);
    }
    async fetchTrades(symbol, params) {
        const asterSymbol = toAsterSymbol(symbol);
        const limit = params?.limit ?? 100;
        const response = await this.publicGet(`/fapi/v1/trades?symbol=${asterSymbol}&limit=${limit}`, 'fetchTrades');
        if (!Array.isArray(response)) {
            throw new PerpDEXError('Invalid trades response', 'INVALID_RESPONSE', 'aster');
        }
        return response.map((t) => this.normalizer.normalizeTrade(t, symbol));
    }
    async fetchFundingRate(symbol) {
        const asterSymbol = toAsterSymbol(symbol);
        const response = await this.publicGet(`/fapi/v1/premiumIndex?symbol=${asterSymbol}`, 'fetchFundingRate');
        return this.normalizer.normalizeFundingRate(response, symbol);
    }
    async fetchFundingRateHistory(symbol, since, limit) {
        const asterSymbol = toAsterSymbol(symbol);
        let path = `/fapi/v1/fundingRate?symbol=${asterSymbol}`;
        if (since)
            path += `&startTime=${since}`;
        if (limit)
            path += `&limit=${limit}`;
        const response = await this.publicGet(path, 'fetchFundingRate');
        if (!Array.isArray(response)) {
            throw new PerpDEXError('Invalid funding rate history response', 'INVALID_RESPONSE', 'aster');
        }
        return response.map((r) => this.normalizer.normalizeFundingRate(r, symbol));
    }
    async fetchOHLCV(symbol, timeframe, params) {
        const asterSymbol = toAsterSymbol(symbol);
        const interval = ASTER_KLINE_INTERVALS[timeframe] ?? '1h';
        let path = `/fapi/v1/klines?symbol=${asterSymbol}&interval=${interval}`;
        if (params?.limit)
            path += `&limit=${params.limit}`;
        if (params?.since)
            path += `&startTime=${params.since}`;
        if (params?.until)
            path += `&endTime=${params.until}`;
        const response = await this.publicGet(path, 'fetchOHLCV');
        if (!Array.isArray(response)) {
            throw new PerpDEXError('Invalid klines response', 'INVALID_RESPONSE', 'aster');
        }
        return response.map((k) => this.normalizer.normalizeOHLCV(k));
    }
    // === Private Trading ===
    async createOrder(request) {
        const asterSymbol = toAsterSymbol(request.symbol);
        const effectiveReferralCode = this.builderCodeEnabled ? this.referralCode : undefined;
        const orderParams = buildOrderParams(request, asterSymbol, effectiveReferralCode);
        const response = await this.signedRequest('POST', '/fapi/v1/order', 'createOrder', orderParams);
        return this.normalizer.normalizeOrder(response, request.symbol);
    }
    async cancelOrder(orderId, symbol) {
        if (!symbol) {
            throw new PerpDEXError('Symbol required to cancel order', 'MISSING_PARAM', 'aster');
        }
        const asterSymbol = toAsterSymbol(symbol);
        const response = await this.signedRequest('DELETE', '/fapi/v1/order', 'cancelOrder', { symbol: asterSymbol, orderId: parseInt(orderId, 10) });
        return this.normalizer.normalizeOrder(response, symbol);
    }
    async cancelAllOrders(symbol) {
        if (!symbol) {
            throw new PerpDEXError('Symbol required to cancel all orders', 'MISSING_PARAM', 'aster');
        }
        const asterSymbol = toAsterSymbol(symbol);
        await this.signedRequest('DELETE', '/fapi/v1/allOpenOrders', 'cancelAllOrders', { symbol: asterSymbol });
        return [];
    }
    // === Private Account ===
    async fetchPositions(_symbols) {
        const response = await this.signedRequest('GET', '/fapi/v1/positionRisk', 'fetchPositions');
        if (!Array.isArray(response)) {
            throw new PerpDEXError('Invalid positions response', 'INVALID_RESPONSE', 'aster');
        }
        return response
            .filter((p) => parseFloat(p.positionAmt) !== 0)
            .map((p) => this.normalizer.normalizePosition(p));
    }
    async fetchBalance() {
        const response = await this.signedRequest('GET', '/fapi/v2/balance', 'fetchBalance');
        if (!Array.isArray(response)) {
            throw new PerpDEXError('Invalid balance response', 'INVALID_RESPONSE', 'aster');
        }
        return response
            .filter((b) => parseFloat(b.balance) > 0)
            .map((b) => this.normalizer.normalizeBalance(b));
    }
    async setLeverage(symbol, leverage) {
        const asterSymbol = toAsterSymbol(symbol);
        await this.signedRequest('POST', '/fapi/v1/leverage', 'setLeverage', { symbol: asterSymbol, leverage });
    }
    // === Account History (required abstract methods) ===
    async fetchOrderHistory(_symbol, _since, _limit) {
        throw new PerpDEXError('fetchOrderHistory not yet implemented', 'NOT_IMPLEMENTED', 'aster');
    }
    async fetchMyTrades(_symbol, _since, _limit) {
        throw new PerpDEXError('fetchMyTrades not yet implemented', 'NOT_IMPLEMENTED', 'aster');
    }
}
//# sourceMappingURL=AsterAdapter.js.map