/**
 * Pacifica Exchange Adapter
 *
 * Implements IExchangeAdapter for Pacifica DEX (Solana, Ed25519 auth)
 */
import { PerpDEXError } from '../../types/errors.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { PACIFICA_API_URLS, PACIFICA_RATE_LIMITS, PACIFICA_ENDPOINT_WEIGHTS } from './constants.js';
import { PacificaAuth } from './PacificaAuth.js';
import { PacificaNormalizer } from './PacificaNormalizer.js';
import { toPacificaSymbol, toUnifiedSymbol, buildOrderBody } from './utils.js';
import { mapPacificaError } from './error-codes.js';
export class PacificaAdapter extends BaseAdapter {
    id = 'pacifica';
    name = 'Pacifica';
    has = {
        fetchMarkets: true,
        fetchTicker: true,
        fetchOrderBook: true,
        fetchTrades: true,
        fetchFundingRate: true,
        createOrder: true,
        cancelOrder: true,
        fetchPositions: true,
        fetchBalance: true,
        setLeverage: true,
    };
    auth;
    baseUrl;
    httpClient;
    rateLimiter;
    normalizer;
    builderCode;
    maxBuilderFeeRate;
    constructor(config = {}) {
        super(config);
        const urls = config.testnet ? PACIFICA_API_URLS.testnet : PACIFICA_API_URLS.mainnet;
        this.baseUrl = config.apiUrl ?? urls.rest;
        this.builderCode = config.builderCode;
        this.maxBuilderFeeRate = config.maxBuilderFeeRate ?? 500;
        if (config.apiKey && config.apiSecret) {
            this.auth = new PacificaAuth({
                apiKey: config.apiKey,
                apiSecret: config.apiSecret,
            });
        }
        this.normalizer = new PacificaNormalizer();
        this.rateLimiter = new RateLimiter({
            maxTokens: config.rateLimit?.maxRequests ?? PACIFICA_RATE_LIMITS.rest.maxRequests,
            windowMs: config.rateLimit?.windowMs ?? PACIFICA_RATE_LIMITS.rest.windowMs,
            refillRate: (config.rateLimit?.maxRequests ?? PACIFICA_RATE_LIMITS.rest.maxRequests) / 60,
            weights: PACIFICA_ENDPOINT_WEIGHTS,
        });
        this.httpClient = new HTTPClient({
            baseUrl: this.baseUrl,
            timeout: config.timeout ?? 30000,
            retry: { maxAttempts: 3, initialDelay: 1000, maxDelay: 10000, multiplier: 2 },
            circuitBreaker: { enabled: true, failureThreshold: 5, resetTimeout: 60000 },
            exchange: this.id,
        });
    }
    async initialize() {
        if (this.auth?.hasCredentials() && this.builderCode) {
            await this.registerBuilderCode(this.builderCode, this.maxBuilderFeeRate);
        }
        this._isReady = true;
    }
    requireAuth() {
        if (!this.auth?.hasCredentials()) {
            throw new PerpDEXError('API key and secret required', 'MISSING_CREDENTIALS', 'pacifica');
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
            const headers = signed.headers ?? {};
            if (method === 'GET') {
                return await this.httpClient.get(path, { headers });
            }
            else {
                return await this.httpClient.post(path, { headers, body });
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
            const codeMatch = error.message.match(/"code"\s*:\s*"([^"]+)"/);
            if (codeMatch?.[1]) {
                return mapPacificaError(codeMatch[1], error.message);
            }
        }
        return new PerpDEXError(error instanceof Error ? error.message : 'Unknown error', 'UNKNOWN', 'pacifica');
    }
    async registerBuilderCode(code, maxFeeRate) {
        await this.signedRequest('POST', '/account/builder_codes/approve', 'registerBuilderCode', {
            type: 'approve_builder_code',
            builder_code: code,
            max_fee_rate: maxFeeRate,
        });
    }
    // === Public Market Data ===
    async fetchMarkets(_params) {
        const response = await this.publicGet('/markets', 'fetchMarkets');
        if (!Array.isArray(response)) {
            throw new PerpDEXError('Invalid markets response', 'INVALID_RESPONSE', 'pacifica');
        }
        return response
            .filter((m) => m.status === 'active')
            .map((m) => this.normalizer.normalizeMarket(m));
    }
    async fetchTicker(symbol) {
        const pacificaSymbol = toPacificaSymbol(symbol);
        const response = await this.publicGet(`/prices?symbol=${pacificaSymbol}`, 'fetchTicker');
        return this.normalizer.normalizeTicker(response, symbol);
    }
    async fetchOrderBook(symbol, params) {
        const pacificaSymbol = toPacificaSymbol(symbol);
        const limit = params?.limit ?? 20;
        const response = await this.publicGet(`/book?symbol=${pacificaSymbol}&limit=${limit}`, 'fetchOrderBook');
        return this.normalizer.normalizeOrderBook(response, symbol);
    }
    async fetchTrades(symbol, params) {
        const pacificaSymbol = toPacificaSymbol(symbol);
        const limit = params?.limit ?? 100;
        const response = await this.publicGet(`/trades?symbol=${pacificaSymbol}&limit=${limit}`, 'fetchTrades');
        if (!Array.isArray(response)) {
            throw new PerpDEXError('Invalid trades response', 'INVALID_RESPONSE', 'pacifica');
        }
        return response.map((t) => this.normalizer.normalizeTrade(t, symbol));
    }
    async fetchFundingRate(symbol) {
        const pacificaSymbol = toPacificaSymbol(symbol);
        const response = await this.publicGet(`/funding/historical?symbol=${pacificaSymbol}&limit=1`, 'fetchFundingRate');
        if (!Array.isArray(response) || response.length === 0) {
            throw new PerpDEXError('No funding rate data', 'INVALID_RESPONSE', 'pacifica');
        }
        return this.normalizer.normalizeFundingRate(response[0], symbol);
    }
    // === Private Trading ===
    async createOrder(request) {
        const pacificaSymbol = toPacificaSymbol(request.symbol);
        const body = buildOrderBody(request, pacificaSymbol, this.builderCode);
        const response = await this.signedRequest('POST', '/orders/create', 'createOrder', body);
        return this.normalizer.normalizeOrder(response, request.symbol);
    }
    async cancelOrder(orderId, _symbol) {
        const response = await this.signedRequest('POST', '/orders/cancel', 'cancelOrder', { order_id: orderId });
        return this.normalizer.normalizeOrder(response);
    }
    // === Private Account ===
    async fetchPositions(_symbols) {
        const response = await this.signedRequest('GET', '/positions', 'fetchPositions');
        if (!Array.isArray(response)) {
            throw new PerpDEXError('Invalid positions response', 'INVALID_RESPONSE', 'pacifica');
        }
        return response
            .filter((p) => parseFloat(p.size) > 0)
            .map((p) => this.normalizer.normalizePosition(p));
    }
    async fetchBalance() {
        const response = await this.signedRequest('GET', '/account', 'fetchBalance');
        return [this.normalizer.normalizeBalance(response)];
    }
    async setLeverage(symbol, leverage) {
        const pacificaSymbol = toPacificaSymbol(symbol);
        await this.signedRequest('POST', '/account/leverage', 'setLeverage', {
            symbol: pacificaSymbol,
            leverage,
        });
    }
    // === Abstract method stubs (not supported by Pacifica) ===
    async fetchFundingRateHistory(_symbol, _since, _limit) {
        return [];
    }
    async cancelAllOrders(_symbol) {
        return [];
    }
    async fetchOrderHistory(_symbol, _since, _limit) {
        return [];
    }
    async fetchMyTrades(_symbol, _since, _limit) {
        return [];
    }
    symbolToExchange(symbol) {
        return toPacificaSymbol(symbol);
    }
    symbolFromExchange(exchangeSymbol) {
        return toUnifiedSymbol(exchangeSymbol);
    }
}
//# sourceMappingURL=PacificaAdapter.js.map