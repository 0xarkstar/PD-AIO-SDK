/**
 * ApeX Omni Exchange Adapter — PUBLIC MARKET DATA FIRST
 *
 * Implements IExchangeAdapter for ApeX Omni (https://omni.apex.exchange/api/v3),
 * recon-verified live 2026-06-11.
 *
 * SCOPE: public market data ONLY. All trading/auth/account methods
 * (createOrder, cancelOrder, cancelAllOrders, fetchPositions, fetchBalance,
 * setLeverage, editOrder, setMarginMode, fetchOpenOrders, fetchOrderHistory,
 * fetchMyTrades, watchOrders/Positions/Balance) are NOT_IMPLEMENTED throwers
 * with `has` = false — the flags are TRUTHFUL by contract; flip them only
 * when the methods are actually implemented and live-verified.
 *
 * Venue footguns handled here:
 * - Symbol formats are STRICT and PER-ENDPOINT: NO-DASH "BTCUSDT" for
 *   /depth /trades /ticker /klines + ALL WS topics; DASH "BTC-USDT" for
 *   /history-funding (+ /symbols `symbol` field). /depth with a dash returns
 *   HTTP 200 {a:null,b:null,...} (silent empty — schema hard-rejects).
 * - Envelope: success {data,timeCost} / error {code,msg,timeCost} (HTTP 200).
 * - Funding settles HOURLY; rates are FRACTIONAL per-interval (passthrough).
 * - Klines are keyed BY SYMBOL; start/end query params are SECONDS.
 * - Rate limit 600 req/60s/IP; HTTP 403 = IP BAN. The heavy 731KB /symbols
 *   payload is cached (marketCacheTTL).
 * - No dedicated open-interest endpoint → fetchOpenInterest is NOT claimed
 *   (ticker.openInterest base units is the only public OI source, in info).
 */
import { PerpDEXError } from '../../types/errors.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { APEX_API_URLS, APEX_ENDPOINT_WEIGHTS, APEX_KLINE_INTERVALS, APEX_RATE_LIMITS, } from './constants.js';
import { ApexNormalizer } from './ApexNormalizer.js';
import { ApexWebSocketWrapper } from './ApexWebSocketWrapper.js';
import { mapApexError } from './error-codes.js';
import { toApexDashSymbol, toApexNoDashSymbol, toUnifiedSymbol } from './utils.js';
const NOT_IMPLEMENTED_SUFFIX = 'not implemented — apex adapter is PUBLIC-MARKET-DATA-FIRST (has-flag is false)';
export class ApexAdapter extends BaseAdapter {
    id = 'apex';
    name = 'ApeX Omni';
    /**
     * TRUTHFUL feature map. true = implemented against the live API and
     * fixture-tested; false = NOT_IMPLEMENTED thrower (public-data-first scope).
     */
    has = {
        // Public market data — implemented + fixture-tested
        fetchMarkets: true,
        fetchTicker: true,
        fetchOrderBook: true,
        fetchTrades: true,
        fetchOHLCV: true,
        fetchFundingRate: true,
        fetchFundingRateHistory: true,
        watchOrderBook: true,
        watchTrades: true,
        watchTicker: true,
        // Trading/auth/account — OUT OF SCOPE (NOT_IMPLEMENTED throwers)
        createOrder: false,
        cancelOrder: false,
        cancelAllOrders: false,
        editOrder: false,
        setMarginMode: false,
        fetchPositions: false,
        fetchBalance: false,
        setLeverage: false,
        fetchOpenOrders: false,
        fetchOrderHistory: false,
        fetchMyTrades: false,
        watchOrders: false,
        watchPositions: false,
        watchBalance: false,
    };
    baseUrl;
    wsUrl;
    httpClient;
    rateLimiter;
    normalizer;
    wsHandler;
    constructor(config = {}) {
        super(config);
        const urls = config.testnet ? APEX_API_URLS.testnet : APEX_API_URLS.mainnet;
        this.baseUrl = config.apiUrl ?? urls.rest;
        this.wsUrl = config.wsUrl ?? urls.websocket;
        this.normalizer = new ApexNormalizer();
        this.rateLimiter = new RateLimiter({
            maxTokens: config.rateLimit?.maxRequests ?? APEX_RATE_LIMITS.rest.maxRequests,
            windowMs: config.rateLimit?.windowMs ?? APEX_RATE_LIMITS.rest.windowMs,
            refillRate: (config.rateLimit?.maxRequests ?? APEX_RATE_LIMITS.rest.maxRequests) / 60,
            weights: APEX_ENDPOINT_WEIGHTS,
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
    /**
     * Prepares the WS wrapper WITHOUT opening a connection — the socket is
     * opened lazily on the first watch* call (public REST needs no socket).
     */
    async initialize() {
        this.wsHandler = new ApexWebSocketWrapper({
            wsUrl: this.wsUrl,
            normalizer: this.normalizer,
            symbolToExchange: this.symbolToExchange.bind(this),
        });
        this._isReady = true;
    }
    async disconnect() {
        if (this.wsHandler) {
            await this.wsHandler.disconnect();
        }
        this._isReady = false;
    }
    // === Symbol conversion (required by BaseAdapter) ===
    /** Primary exchange form = NO-DASH (depth/trades/ticker/klines/WS topics) */
    symbolToExchange(symbol) {
        return toApexNoDashSymbol(symbol);
    }
    symbolFromExchange(exchangeSymbol) {
        // Best-effort reverse without market data: "BTCUSDT"/"BTC-USDT" → unified
        if (exchangeSymbol.includes('-')) {
            const [base, quote] = exchangeSymbol.split('-');
            return toUnifiedSymbol(base ?? exchangeSymbol, quote ?? 'USDT');
        }
        const quoteAssets = ['USDT', 'USDC'];
        for (const quote of quoteAssets) {
            if (exchangeSymbol.endsWith(quote)) {
                return toUnifiedSymbol(exchangeSymbol.slice(0, -quote.length), quote);
            }
        }
        return exchangeSymbol;
    }
    // === HTTP helpers ===
    async publicGet(path, feature, context) {
        await this.rateLimiter.acquire(feature);
        let response;
        try {
            response = await this.httpClient.get(path);
        }
        catch (error) {
            throw this.handleError(error);
        }
        return this.unwrapEnvelope(response, context);
    }
    /** Success {data,timeCost} / error {code,msg,timeCost} — both HTTP 200 */
    unwrapEnvelope(response, context) {
        if (response && typeof response === 'object') {
            const rec = response;
            if (rec.data === undefined && typeof rec.code === 'number') {
                throw mapApexError(rec.code, typeof rec.msg === 'string' ? rec.msg : 'Unknown apex error');
            }
            if (rec.data !== undefined) {
                return rec.data;
            }
        }
        throw new PerpDEXError(`Invalid ${context} response`, 'INVALID_RESPONSE', 'apex');
    }
    handleError(error) {
        if (error instanceof PerpDEXError)
            return error;
        if (error instanceof Error) {
            const match = error.message.match(/"code"\s*:\s*(\d+)/);
            if (match?.[1]) {
                return mapApexError(parseInt(match[1], 10), error.message);
            }
        }
        return new PerpDEXError(error instanceof Error ? error.message : 'Unknown error', 'UNKNOWN', 'apex');
    }
    // === Public Market Data ===
    /**
     * /v3/symbols → data.contractConfig.perpetualContract[] (the payload also
     * carries spot/prediction/stock/prelaunch configs — perps only here),
     * filtered by enableTrade && !isPrelaunch. The 731KB payload is cached.
     */
    async fetchMarkets(_params) {
        if (this.marketCache && Date.now() < this.marketCacheExpiry) {
            return this.marketCache;
        }
        const data = await this.publicGet('/symbols', 'fetchMarkets', 'symbols');
        const perps = data?.contractConfig?.perpetualContract;
        if (!Array.isArray(perps)) {
            throw new PerpDEXError('Invalid symbols response', 'INVALID_RESPONSE', 'apex');
        }
        const markets = perps
            .filter((c) => c.enableTrade === true && c.isPrelaunch !== true)
            .map((c) => this.normalizer.normalizeMarket(c));
        this.marketCache = markets;
        this.marketCacheExpiry = Date.now() + this.marketCacheTTL;
        return markets;
    }
    /** /v3/ticker?symbol=<NO-DASH> — data is an ARRAY of one object */
    async _fetchTicker(symbol) {
        const apexSymbol = toApexNoDashSymbol(symbol);
        const data = await this.publicGet(`/ticker?symbol=${apexSymbol}`, 'fetchTicker', 'ticker');
        if (!Array.isArray(data) || data.length === 0 || !data[0]) {
            throw new PerpDEXError('Empty ticker response', 'INVALID_RESPONSE', 'apex');
        }
        return this.normalizer.normalizeTicker(data[0], symbol);
    }
    /** /v3/depth?symbol=<NO-DASH>&limit=N — null-book shape hard-rejected */
    async _fetchOrderBook(symbol, params) {
        const apexSymbol = toApexNoDashSymbol(symbol);
        const limit = params?.limit ?? 100;
        const data = await this.publicGet(`/depth?symbol=${apexSymbol}&limit=${limit}`, 'fetchOrderBook', 'depth');
        return this.normalizer.normalizeOrderBook(data, symbol);
    }
    /** /v3/trades?symbol=<NO-DASH>&limit=N */
    async _fetchTrades(symbol, params) {
        const apexSymbol = toApexNoDashSymbol(symbol);
        const limit = params?.limit ?? 100;
        const data = await this.publicGet(`/trades?symbol=${apexSymbol}&limit=${limit}`, 'fetchTrades', 'trades');
        if (!Array.isArray(data)) {
            throw new PerpDEXError('Invalid trades response', 'INVALID_RESPONSE', 'apex');
        }
        return data.map((t) => this.normalizer.normalizeTrade(t, symbol));
    }
    /** Current funding via /v3/ticker (fundingRate + ISO nextFundingTime) */
    async _fetchFundingRate(symbol) {
        const apexSymbol = toApexNoDashSymbol(symbol);
        const data = await this.publicGet(`/ticker?symbol=${apexSymbol}`, 'fetchFundingRate', 'ticker');
        if (!Array.isArray(data) || data.length === 0 || !data[0]) {
            throw new PerpDEXError('Empty ticker response', 'INVALID_RESPONSE', 'apex');
        }
        return this.normalizer.normalizeFundingRateFromTicker(data[0], symbol);
    }
    /**
     * /v3/history-funding?symbol=<DASH>&limit=N — the DASH form is REQUIRED
     * (no-dash errors {code:3}). The venue API has no start param — `since`
     * is filtered client-side.
     */
    async fetchFundingRateHistory(symbol, since, limit) {
        const apexSymbol = toApexDashSymbol(symbol);
        let path = `/history-funding?symbol=${apexSymbol}`;
        if (limit)
            path += `&limit=${limit}`;
        const data = await this.publicGet(path, 'fetchFundingRateHistory', 'history-funding');
        if (!Array.isArray(data?.historyFunds)) {
            throw new PerpDEXError('Invalid history-funding response', 'INVALID_RESPONSE', 'apex');
        }
        return data.historyFunds
            .filter((f) => since === undefined || f.fundingTime >= since)
            .map((f) => this.normalizer.normalizeFundingRateHistoryEntry(f, symbol));
    }
    /** /v3/klines?symbol=<NO-DASH>&interval=<code> — start/end are SECONDS */
    async fetchOHLCV(symbol, timeframe, params) {
        const apexSymbol = toApexNoDashSymbol(symbol);
        const interval = APEX_KLINE_INTERVALS[timeframe];
        if (!interval) {
            throw new PerpDEXError(`Unsupported timeframe for apex: ${timeframe}`, 'INVALID_PARAM', 'apex');
        }
        let path = `/klines?symbol=${apexSymbol}&interval=${interval}`;
        if (params?.limit)
            path += `&limit=${params.limit}`;
        if (params?.since)
            path += `&start=${Math.floor(params.since / 1000)}`;
        if (params?.until)
            path += `&end=${Math.floor(params.until / 1000)}`;
        const data = await this.publicGet(path, 'fetchOHLCV', 'klines');
        const klines = this.normalizer.unwrapKlines(data, apexSymbol);
        return klines.map((k) => this.normalizer.normalizeOHLCV(k));
    }
    // === WebSocket Streams (lazy connect — opened on first watch*) ===
    async ensureWebSocketConnected() {
        this.ensureInitialized();
        if (!this.wsHandler) {
            throw new PerpDEXError('WebSocket handler not initialized', 'NO_WEBSOCKET', 'apex');
        }
        await this.wsHandler.connect();
        return this.wsHandler;
    }
    async *watchOrderBook(symbol, limit) {
        const ws = await this.ensureWebSocketConnected();
        yield* ws.watchOrderBook(symbol, limit);
    }
    async *watchTrades(symbol) {
        const ws = await this.ensureWebSocketConnected();
        yield* ws.watchTrades(symbol);
    }
    async *watchTicker(symbol) {
        const ws = await this.ensureWebSocketConnected();
        yield* ws.watchTicker(symbol);
    }
    // ===========================================================================
    // NOT IMPLEMENTED — PUBLIC-MARKET-DATA-FIRST scope (has-flags are false).
    // BaseAdapter requires these abstract members; they throw rather than lie.
    // ===========================================================================
    async createOrder(_request) {
        throw new PerpDEXError(`createOrder ${NOT_IMPLEMENTED_SUFFIX}`, 'NOT_IMPLEMENTED', 'apex');
    }
    async cancelOrder(_orderId, _symbol) {
        throw new PerpDEXError(`cancelOrder ${NOT_IMPLEMENTED_SUFFIX}`, 'NOT_IMPLEMENTED', 'apex');
    }
    async cancelAllOrders(_symbol) {
        throw new PerpDEXError(`cancelAllOrders ${NOT_IMPLEMENTED_SUFFIX}`, 'NOT_IMPLEMENTED', 'apex');
    }
    async fetchOrderHistory(_symbol, _since, _limit) {
        throw new PerpDEXError(`fetchOrderHistory ${NOT_IMPLEMENTED_SUFFIX}`, 'NOT_IMPLEMENTED', 'apex');
    }
    async fetchMyTrades(_symbol, _since, _limit) {
        throw new PerpDEXError(`fetchMyTrades ${NOT_IMPLEMENTED_SUFFIX}`, 'NOT_IMPLEMENTED', 'apex');
    }
    async fetchPositions(_symbols) {
        throw new PerpDEXError(`fetchPositions ${NOT_IMPLEMENTED_SUFFIX}`, 'NOT_IMPLEMENTED', 'apex');
    }
    async fetchBalance() {
        throw new PerpDEXError(`fetchBalance ${NOT_IMPLEMENTED_SUFFIX}`, 'NOT_IMPLEMENTED', 'apex');
    }
    async _setLeverage(_symbol, _leverage) {
        throw new PerpDEXError(`setLeverage ${NOT_IMPLEMENTED_SUFFIX}`, 'NOT_IMPLEMENTED', 'apex');
    }
}
//# sourceMappingURL=ApexAdapter.js.map