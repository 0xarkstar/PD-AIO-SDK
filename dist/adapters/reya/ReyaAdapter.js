/**
 * Reya Exchange Adapter
 *
 * Implements IExchangeAdapter for Reya DEX.
 * Reya is an L2 perpetual DEX with REST + WebSocket APIs,
 * EIP-712 signing, and continuous funding rates.
 */
import { Wallet } from 'ethers';
import { PerpDEXError, NotSupportedError } from '../../types/errors.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { HTTPClient } from '../../core/http/HTTPClient.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { REYA_MAINNET_API, REYA_TESTNET_API, REYA_RATE_LIMIT, REYA_EXCHANGE_ID, unifiedToReya, reyaToUnified, } from './constants.js';
import { ReyaAuth } from './ReyaAuth.js';
import { ReyaNormalizer } from './ReyaNormalizer.js';
import { buildOrderRequest, mapTimeframeToResolution } from './utils.js';
import { mapError } from './error-codes.js';
export class ReyaAdapter extends BaseAdapter {
    id = 'reya';
    name = 'Reya';
    has = {
        // Market Data
        fetchMarkets: true,
        fetchTicker: true,
        fetchOrderBook: false,
        fetchTrades: true,
        fetchOHLCV: true,
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
    exchangeId;
    constructor(config = {}) {
        super(config);
        this.baseUrl = config.testnet ? REYA_TESTNET_API : REYA_MAINNET_API;
        this.accountId = config.accountId ?? 0;
        this.exchangeId = config.exchangeId ?? REYA_EXCHANGE_ID;
        if (config.privateKey) {
            const wallet = new Wallet(config.privateKey);
            this.auth = new ReyaAuth(wallet);
        }
        this.normalizer = new ReyaNormalizer();
        this.rateLimiter = new RateLimiter({
            maxTokens: config.rateLimit?.maxRequests ?? REYA_RATE_LIMIT.maxRequests,
            windowMs: config.rateLimit?.windowMs ?? REYA_RATE_LIMIT.windowMs,
            weights: REYA_RATE_LIMIT.weights,
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
        if (this._isReady) {
            return;
        }
        // Optionally discover account ID
        if (this.auth && this.accountId === 0) {
            try {
                const accounts = await this.httpClient.get(`/wallet/${this.auth.getAddress()}/accounts`);
                const perpAccount = accounts.find((a) => a.type === 'MAINPERP');
                if (perpAccount) {
                    this.accountId = perpAccount.accountId;
                }
            }
            catch {
                this.debug('Could not auto-discover account ID');
            }
        }
        this._isReady = true;
        this.debug('Adapter initialized');
    }
    // === Symbol conversion ===
    symbolToExchange(symbol) {
        return unifiedToReya(symbol);
    }
    symbolFromExchange(exchangeSymbol) {
        return reyaToUnified(exchangeSymbol);
    }
    // === Auth helpers ===
    requireAuth() {
        if (!this.auth) {
            throw new PerpDEXError('Private key required for authenticated operations', 'MISSING_CREDENTIALS', 'reya');
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
    // === Public Market Data ===
    async fetchMarkets(_params) {
        const [definitions, summaries] = await Promise.all([
            this.publicGet('/marketDefinitions', 'fetchMarkets'),
            this.publicGet('/markets/summary', 'fetchMarkets'),
        ]);
        const summaryMap = new Map();
        for (const s of summaries) {
            summaryMap.set(s.symbol, s);
        }
        return definitions
            .filter((d) => d.symbol.endsWith('PERP'))
            .map((d) => this.normalizer.normalizeMarket(d, summaryMap.get(d.symbol)));
    }
    async _fetchTicker(symbol) {
        const reyaSymbol = this.symbolToExchange(symbol);
        const [summary, price] = await Promise.all([
            this.publicGet(`/market/${reyaSymbol}/summary`, 'fetchTicker'),
            this.publicGet(`/prices/${reyaSymbol}`, 'fetchTicker'),
        ]);
        return this.normalizer.normalizeTicker(summary, price);
    }
    async _fetchOrderBook(symbol, _params) {
        const reyaSymbol = this.symbolToExchange(symbol);
        const depth = await this.publicGet(`/market/${reyaSymbol}/depth`, 'fetchOrderBook');
        return this.normalizer.normalizeOrderBook(depth);
    }
    async _fetchTrades(symbol, params) {
        const reyaSymbol = this.symbolToExchange(symbol);
        let path = `/market/${reyaSymbol}/perpExecutions`;
        if (params?.since) {
            path += `?startTime=${params.since}`;
        }
        const response = await this.publicGet(path, 'fetchTrades');
        return response.data.map((exec) => this.normalizer.normalizeTrade(exec));
    }
    async _fetchFundingRate(symbol) {
        const reyaSymbol = this.symbolToExchange(symbol);
        const [summary, price] = await Promise.all([
            this.publicGet(`/market/${reyaSymbol}/summary`, 'fetchFundingRate'),
            this.publicGet(`/prices/${reyaSymbol}`, 'fetchFundingRate'),
        ]);
        const markPrice = parseFloat(price.oraclePrice);
        return this.normalizer.normalizeFundingRate(summary, markPrice);
    }
    async fetchFundingRateHistory(_symbol, _since, _limit) {
        throw new NotSupportedError('Reya uses continuous funding rates; historical snapshots are not available via REST API', 'NOT_SUPPORTED', 'reya');
    }
    async fetchOHLCV(symbol, timeframe = '1h', params) {
        const reyaSymbol = this.symbolToExchange(symbol);
        const resolution = mapTimeframeToResolution(timeframe);
        let path = `/market/${reyaSymbol}/candles?resolution=${resolution}`;
        if (params?.until) {
            path += `&endTime=${Math.floor(params.until / 1000)}`; // Convert to seconds
        }
        const response = await this.publicGet(path, 'fetchOHLCV');
        return this.normalizer.normalizeCandles(response, params?.limit);
    }
    // === Private Trading ===
    async createOrder(request) {
        const auth = this.requireAuth();
        await this.rateLimiter.acquire('createOrder');
        try {
            const { signature, nonce } = await auth.signOrderAction({
                accountId: this.accountId,
            });
            const orderReq = buildOrderRequest(request, this.accountId, this.exchangeId, signature, nonce, auth.getAddress());
            const response = await this.httpClient.post('/order-entry/order', {
                body: orderReq,
                headers: auth.getHeaders(),
            });
            if (response.status === 'REJECTED') {
                throw new PerpDEXError('Order rejected', 'ORDER_REJECTED', 'reya');
            }
            return {
                id: response.orderId ?? '',
                symbol: request.symbol,
                type: request.type,
                side: request.side,
                amount: request.amount,
                price: request.price,
                status: response.status === 'FILLED' ? 'filled' : 'open',
                filled: response.cumQty ? parseFloat(response.cumQty) : 0,
                remaining: request.amount - (response.cumQty ? parseFloat(response.cumQty) : 0),
                reduceOnly: request.reduceOnly ?? false,
                postOnly: request.postOnly ?? false,
                clientOrderId: request.clientOrderId,
                timestamp: Date.now(),
            };
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
            const response = await this.httpClient.post('/order-entry/cancel', {
                body: {
                    orderId,
                    accountId: this.accountId,
                    signature,
                    nonce,
                },
                headers: auth.getHeaders(),
            });
            return {
                id: response.orderId,
                symbol: symbol ?? '',
                type: 'limit',
                side: 'buy',
                amount: 0,
                status: 'canceled',
                filled: 0,
                remaining: 0,
                reduceOnly: false,
                postOnly: false,
                timestamp: Date.now(),
            };
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
            const body = {
                accountId: this.accountId,
                signature,
                nonce,
                expiresAfter: Math.floor(Date.now() / 1000) + 300,
            };
            if (symbol) {
                body.symbol = this.symbolToExchange(symbol);
            }
            const response = await this.httpClient.post('/order-entry/cancel-all', {
                body,
                headers: auth.getHeaders(),
            });
            this.debug(`Cancelled ${response.cancelledCount} orders`);
            return [];
        }
        catch (error) {
            throw mapError(error);
        }
    }
    // === Account History ===
    async fetchOpenOrders(symbol) {
        const auth = this.requireAuth();
        await this.rateLimiter.acquire('fetchOpenOrders');
        try {
            const address = auth.getAddress();
            const orders = await this.httpClient.get(`/wallet-data/wallet/${address}/open-orders`);
            let normalized = orders.map((o) => this.normalizer.normalizeOrder(o));
            if (symbol) {
                normalized = normalized.filter((o) => o.symbol === symbol);
            }
            return normalized;
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchOrderHistory(_symbol, _since, _limit) {
        throw new NotSupportedError('Reya does not provide order history via REST API', 'NOT_SUPPORTED', 'reya');
    }
    async fetchMyTrades(symbol, since, limit) {
        const auth = this.requireAuth();
        await this.rateLimiter.acquire('fetchMyTrades');
        try {
            const address = auth.getAddress();
            let path = `/wallet-data/wallet/${address}/perp-executions`;
            const params = [];
            if (since) {
                params.push(`startTime=${since}`);
            }
            if (params.length > 0) {
                path += `?${params.join('&')}`;
            }
            const response = await this.httpClient.get(path);
            let trades = response.data.map((exec) => this.normalizer.normalizeTrade(exec));
            if (symbol) {
                trades = trades.filter((t) => t.symbol === symbol);
            }
            if (limit && trades.length > limit) {
                trades = trades.slice(0, limit);
            }
            return trades;
        }
        catch (error) {
            throw mapError(error);
        }
    }
    // === Positions & Balance ===
    async fetchPositions(symbols) {
        const auth = this.requireAuth();
        await this.rateLimiter.acquire('fetchPositions');
        try {
            const address = auth.getAddress();
            const positions = await this.httpClient.get(`/wallet-data/wallet/${address}/positions`);
            let normalized = positions
                .filter((p) => parseFloat(p.qty) !== 0)
                .map((p) => this.normalizer.normalizePosition(p));
            if (symbols && symbols.length > 0) {
                normalized = normalized.filter((p) => symbols.includes(p.symbol));
            }
            return normalized;
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchBalance() {
        const auth = this.requireAuth();
        await this.rateLimiter.acquire('fetchBalance');
        try {
            const address = auth.getAddress();
            const balances = await this.httpClient.get(`/wallet-data/wallet/${address}/account-balances`);
            return balances
                .filter((b) => parseFloat(b.realBalance) !== 0)
                .map((b) => this.normalizer.normalizeBalance(b));
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async _setLeverage(_symbol, _leverage) {
        throw new NotSupportedError('Reya uses account-level margin; per-symbol leverage is not supported', 'NOT_SUPPORTED', 'reya');
    }
}
//# sourceMappingURL=ReyaAdapter.js.map