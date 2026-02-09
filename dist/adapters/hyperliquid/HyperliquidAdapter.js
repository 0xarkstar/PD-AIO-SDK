/**
 * Hyperliquid Exchange Adapter
 *
 * Implements IExchangeAdapter for Hyperliquid DEX
 */
import { Wallet } from 'ethers';
import { RateLimiter } from '../../core/RateLimiter.js';
import { NotSupportedError } from '../../types/errors.js';
import { WebSocketManager } from '../../websocket/index.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { HYPERLIQUID_MAINNET_API, HYPERLIQUID_MAINNET_WS, HYPERLIQUID_RATE_LIMIT, HYPERLIQUID_TESTNET_API, HYPERLIQUID_TESTNET_WS, HYPERLIQUID_WS_RECONNECT, hyperliquidToUnified, unifiedToHyperliquid, } from './constants.js';
import { HyperliquidAuth } from './HyperliquidAuth.js';
import { HyperliquidNormalizer } from './HyperliquidNormalizer.js';
import { HyperliquidWebSocket } from './HyperliquidWebSocket.js';
import { convertOrderRequest, mapError } from './utils.js';
import { buildOHLCVRequest, parseCandles, parseFundingRates, buildCurrentFundingRate, getDefaultDuration as getDefaultOHLCVDuration, } from './HyperliquidMarketData.js';
import { parseUserFees, parsePortfolio, parseRateLimitStatus, } from './HyperliquidInfoMethods.js';
import { processOrderHistory, processUserFills, processOpenOrders, } from './HyperliquidAccount.js';
export class HyperliquidAdapter extends BaseAdapter {
    id = 'hyperliquid';
    name = 'Hyperliquid';
    has = {
        // Market Data
        fetchMarkets: true,
        fetchTicker: true,
        fetchOrderBook: true,
        fetchTrades: true,
        fetchOHLCV: true,
        fetchFundingRate: true,
        fetchFundingRateHistory: true,
        // Trading
        createOrder: true,
        cancelOrder: true,
        cancelAllOrders: true,
        createBatchOrders: true,
        cancelBatchOrders: true,
        editOrder: false,
        // Account History
        fetchOrderHistory: true,
        fetchMyTrades: true,
        fetchDeposits: false,
        fetchWithdrawals: false,
        // Positions & Balance
        fetchPositions: true,
        fetchBalance: true,
        setLeverage: true,
        setMarginMode: 'emulated',
        // WebSocket
        watchOrderBook: true,
        watchTrades: true,
        watchTicker: true,
        watchPositions: true,
        watchOrders: true,
        watchBalance: false,
        watchFundingRate: false,
        watchMyTrades: true,
        // Advanced
        twapOrders: false,
        vaultTrading: false,
        // Additional Info
        fetchUserFees: true,
        fetchPortfolio: true,
        fetchRateLimitStatus: true,
    };
    apiUrl;
    wsUrl;
    wsManager;
    wsHandler;
    auth;
    rateLimiter;
    normalizer;
    constructor(config = {}) {
        super(config);
        // Set API URLs
        this.apiUrl = config.testnet ? HYPERLIQUID_TESTNET_API : HYPERLIQUID_MAINNET_API;
        this.wsUrl = config.testnet ? HYPERLIQUID_TESTNET_WS : HYPERLIQUID_MAINNET_WS;
        // Initialize normalizer
        this.normalizer = new HyperliquidNormalizer();
        // Initialize rate limiter
        this.rateLimiter = new RateLimiter({
            maxTokens: config.rateLimit?.maxRequests ?? HYPERLIQUID_RATE_LIMIT.maxRequests,
            windowMs: config.rateLimit?.windowMs ?? HYPERLIQUID_RATE_LIMIT.windowMs,
            weights: config.rateLimit?.weights ?? HYPERLIQUID_RATE_LIMIT.weights,
            exchange: 'hyperliquid',
        });
        // Initialize auth if wallet provided
        if (config.wallet) {
            this.auth = new HyperliquidAuth(config.wallet);
        }
        else if (config.privateKey) {
            const wallet = new Wallet(config.privateKey);
            this.auth = new HyperliquidAuth(wallet);
        }
    }
    // ===========================================================================
    // Connection Management
    // ===========================================================================
    async initialize() {
        if (this._isReady) {
            return;
        }
        // Initialize WebSocket manager
        this.wsManager = new WebSocketManager({
            url: this.wsUrl,
            reconnect: HYPERLIQUID_WS_RECONNECT,
        });
        await this.wsManager.connect();
        // Initialize WebSocket handler
        this.wsHandler = new HyperliquidWebSocket({
            wsManager: this.wsManager,
            normalizer: this.normalizer,
            auth: this.auth,
            symbolToExchange: this.symbolToExchange.bind(this),
            fetchOpenOrders: this.fetchOpenOrders.bind(this),
        });
        this._isReady = true;
        this.debug('Adapter initialized');
    }
    async disconnect() {
        if (this.wsManager) {
            await this.wsManager.disconnect();
        }
        this._isReady = false;
        this.debug('Adapter disconnected');
    }
    // ===========================================================================
    // Market Data (Public)
    // ===========================================================================
    async fetchMarkets(params) {
        await this.rateLimiter.acquire('fetchMarkets');
        try {
            const response = await this.request('POST', `${this.apiUrl}/info`, {
                type: 'meta',
            });
            const markets = response.universe.map((asset, index) => this.normalizer.normalizeMarket(asset, index));
            // Filter by params if provided
            if (params?.active !== undefined) {
                return markets.filter((m) => m.active === params.active);
            }
            return markets;
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchTicker(symbol) {
        await this.rateLimiter.acquire('fetchTicker');
        try {
            const allMids = await this.request('POST', `${this.apiUrl}/info`, {
                type: 'allMids',
            });
            const exchangeSymbol = this.symbolToExchange(symbol);
            const mid = allMids[exchangeSymbol];
            if (!mid) {
                throw new Error(`No ticker data for ${symbol}`);
            }
            return this.normalizer.normalizeTicker(exchangeSymbol, { mid });
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchOrderBook(symbol, _params) {
        await this.rateLimiter.acquire('fetchOrderBook');
        try {
            const exchangeSymbol = this.symbolToExchange(symbol);
            const response = await this.request('POST', `${this.apiUrl}/info`, {
                type: 'l2Book',
                coin: exchangeSymbol,
            });
            return this.normalizer.normalizeOrderBook(response);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchTrades(_symbol, _params) {
        throw new NotSupportedError('fetchTrades is not supported via REST API. Use watchTrades (WebSocket) instead.', 'NOT_SUPPORTED', 'hyperliquid');
    }
    /**
     * Fetch OHLCV (candlestick) data
     *
     * @param symbol - Symbol in unified format (e.g., "BTC/USDT:USDT")
     * @param timeframe - Candlestick timeframe
     * @param params - Optional parameters (since, until, limit)
     * @returns Array of OHLCV tuples [timestamp, open, high, low, close, volume]
     */
    async fetchOHLCV(symbol, timeframe = '1h', params) {
        await this.rateLimiter.acquire('fetchOHLCV');
        try {
            const exchangeSymbol = this.symbolToExchange(symbol);
            const req = buildOHLCVRequest(exchangeSymbol, timeframe, params);
            const response = await this.request('POST', `${this.apiUrl}/info`, {
                type: 'candleSnapshot',
                req,
            });
            return parseCandles(response, params?.limit);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchFundingRate(symbol) {
        await this.rateLimiter.acquire('fetchFundingRate');
        try {
            const exchangeSymbol = this.symbolToExchange(symbol);
            // Fetch funding history (last entry is current)
            const response = await this.request('POST', `${this.apiUrl}/info`, {
                type: 'fundingHistory',
                coin: exchangeSymbol,
                startTime: Date.now() - 86400000, // Last 24h
            });
            if (!response || response.length === 0) {
                throw new Error(`No funding rate data for ${symbol}`);
            }
            const latest = response[response.length - 1];
            if (!latest) {
                throw new Error(`No funding rate data for ${symbol}`);
            }
            // Fetch current mark price
            const allMids = await this.request('POST', `${this.apiUrl}/info`, {
                type: 'allMids',
            });
            const markPrice = parseFloat(allMids[exchangeSymbol] ?? '0');
            return buildCurrentFundingRate(latest, symbol, markPrice);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchFundingRateHistory(symbol, since, limit) {
        await this.rateLimiter.acquire('fetchFundingRateHistory');
        try {
            const exchangeSymbol = this.symbolToExchange(symbol);
            // Default to last 7 days if since not provided
            const startTime = since ?? Date.now() - 7 * 24 * 3600 * 1000;
            const response = await this.request('POST', `${this.apiUrl}/info`, {
                type: 'fundingHistory',
                coin: exchangeSymbol,
                startTime,
            });
            if (!response || response.length === 0) {
                return [];
            }
            // Fetch current mark price for all rates
            const allMids = await this.request('POST', `${this.apiUrl}/info`, {
                type: 'allMids',
            });
            const markPrice = parseFloat(allMids[exchangeSymbol] ?? '0');
            return parseFundingRates(response, symbol, markPrice, limit);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    // ===========================================================================
    // Trading (Private)
    // ===========================================================================
    async createOrder(request) {
        const auth = this.ensureAuth();
        // Validate order request
        const validatedRequest = this.validateOrder(request);
        await this.rateLimiter.acquire('createOrder');
        try {
            const exchangeSymbol = this.symbolToExchange(validatedRequest.symbol);
            const orderRequest = convertOrderRequest(validatedRequest, exchangeSymbol);
            // Create action
            const action = {
                type: 'order',
                orders: [orderRequest],
                grouping: 'na',
            };
            // Sign and send
            const signedRequest = await auth.sign({
                method: 'POST',
                path: '/exchange',
                body: action,
            });
            const response = await this.request('POST', `${this.apiUrl}/exchange`, signedRequest.body, signedRequest.headers);
            if (response.status === 'err') {
                throw new Error('Order creation failed');
            }
            const status = response.response.data.statuses[0];
            if (!status) {
                throw new Error('No order status in response');
            }
            if ('error' in status) {
                throw new Error(status.error);
            }
            // Extract order ID
            let orderId;
            if ('resting' in status) {
                orderId = status.resting.oid.toString();
            }
            else if ('filled' in status) {
                orderId = status.filled.oid.toString();
            }
            else {
                throw new Error('Unknown order status');
            }
            return {
                id: orderId,
                symbol: request.symbol,
                type: request.type,
                side: request.side,
                amount: request.amount,
                price: request.price,
                status: 'filled' in status ? 'filled' : 'open',
                filled: 'filled' in status ? parseFloat(status.filled.totalSz) : 0,
                remaining: request.amount,
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
        const auth = this.ensureAuth();
        await this.rateLimiter.acquire('cancelOrder');
        try {
            if (!symbol) {
                throw new Error('Symbol required for order cancellation');
            }
            const exchangeSymbol = this.symbolToExchange(symbol);
            const action = {
                type: 'cancel',
                cancels: [{ coin: exchangeSymbol, oid: parseInt(orderId) }],
            };
            const signedRequest = await auth.sign({
                method: 'POST',
                path: '/exchange',
                body: action,
            });
            await this.request('POST', `${this.apiUrl}/exchange`, signedRequest.body, signedRequest.headers);
            return {
                id: orderId,
                symbol,
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
        this.ensureAuth();
        await this.rateLimiter.acquire('cancelAllOrders');
        try {
            // Fetch open orders
            const openOrders = await this.fetchOpenOrders(symbol);
            // Cancel each order
            const canceledOrders = [];
            for (const order of openOrders) {
                try {
                    const canceled = await this.cancelOrder(order.id, order.symbol);
                    canceledOrders.push(canceled);
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.debug('Failed to cancel order', { orderId: order.id, error: errorMessage });
                }
            }
            return canceledOrders;
        }
        catch (error) {
            throw mapError(error);
        }
    }
    // ===========================================================================
    // Account History
    // ===========================================================================
    async fetchOrderHistory(symbol, since, limit) {
        try {
            const response = await this.authInfoRequest('fetchOrderHistory', 'historicalOrders');
            return processOrderHistory(response, this.normalizer, symbol, since, limit);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchMyTrades(symbol, since, limit) {
        try {
            const response = await this.authInfoRequest('fetchMyTrades', 'userFills');
            return processUserFills(response, this.normalizer, symbol, since, limit);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    // ===========================================================================
    // Positions & Balance
    // ===========================================================================
    async fetchPositions(symbols) {
        try {
            const response = await this.authInfoRequest('fetchPositions', 'clearinghouseState');
            const positions = response.assetPositions
                .filter((p) => parseFloat(p.position.szi) !== 0)
                .map((p) => this.normalizer.normalizePosition(p));
            if (symbols && symbols.length > 0) {
                return positions.filter((p) => symbols.includes(p.symbol));
            }
            return positions;
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchBalance() {
        try {
            const response = await this.authInfoRequest('fetchBalance', 'clearinghouseState');
            return this.normalizer.normalizeBalance(response);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async setLeverage(symbol, leverage) {
        this.ensureAuth();
        await this.rateLimiter.acquire('setLeverage', 5);
        // Hyperliquid leverage is managed per-position in cross-margin mode
        this.debug(`setLeverage: Updating leverage for ${symbol} to ${leverage}x`);
    }
    // ===========================================================================
    // Additional Info Methods
    // ===========================================================================
    /** Ensure authenticated and return auth instance */
    ensureAuth() {
        this.ensureInitialized();
        if (!this.auth) {
            throw new Error('Authentication required');
        }
        return this.auth;
    }
    /** Make authenticated info request */
    async authInfoRequest(rateLimitKey, type) {
        const auth = this.ensureAuth();
        await this.rateLimiter.acquire(rateLimitKey);
        return this.request('POST', `${this.apiUrl}/info`, {
            type,
            user: auth.getAddress(),
        });
    }
    async fetchUserFees() {
        try {
            const response = await this.authInfoRequest('fetchUserFees', 'userFees');
            return parseUserFees(response);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchPortfolio() {
        try {
            const response = await this.authInfoRequest('fetchPortfolio', 'portfolio');
            return parsePortfolio(response);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchRateLimitStatus() {
        try {
            const response = await this.authInfoRequest('fetchRateLimitStatus', 'userRateLimit');
            return parseRateLimitStatus(response);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    // ===========================================================================
    // WebSocket Streams (delegated to HyperliquidWebSocket)
    // ===========================================================================
    ensureWsHandler() {
        this.ensureInitialized();
        if (!this.wsHandler) {
            throw new Error('WebSocket handler not initialized');
        }
        return this.wsHandler;
    }
    async *watchOrderBook(symbol, limit) {
        yield* this.ensureWsHandler().watchOrderBook(symbol, limit);
    }
    async *watchTrades(symbol) {
        yield* this.ensureWsHandler().watchTrades(symbol);
    }
    async *watchTicker(symbol) {
        yield* this.ensureWsHandler().watchTicker(symbol);
    }
    async *watchPositions() {
        yield* this.ensureWsHandler().watchPositions();
    }
    async *watchOrders() {
        yield* this.ensureWsHandler().watchOrders();
    }
    async *watchMyTrades(symbol) {
        yield* this.ensureWsHandler().watchMyTrades(symbol);
    }
    // ===========================================================================
    // Helper Methods
    // ===========================================================================
    /** Get default duration for OHLCV timeframe */
    getDefaultDuration(timeframe) {
        return getDefaultOHLCVDuration(timeframe);
    }
    symbolToExchange(symbol) {
        return unifiedToHyperliquid(symbol);
    }
    symbolFromExchange(exchangeSymbol) {
        return hyperliquidToUnified(exchangeSymbol);
    }
    /**
     * Fetch open orders
     *
     * @param symbol - Optional symbol to filter orders (e.g., "BTC/USDT:USDT")
     * @returns Array of open orders
     */
    async fetchOpenOrders(symbol) {
        if (!this.auth) {
            throw new Error('Authentication required');
        }
        try {
            const response = await this.request('POST', `${this.apiUrl}/info`, {
                type: 'openOrders',
                user: this.auth.getAddress(),
            });
            return processOpenOrders(response, this.normalizer, symbol);
        }
        catch (error) {
            throw mapError(error);
        }
    }
}
//# sourceMappingURL=HyperliquidAdapter.js.map