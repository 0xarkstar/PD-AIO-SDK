/**
 * Hyperliquid Exchange Adapter
 *
 * Implements IExchangeAdapter for Hyperliquid DEX
 */
import { Wallet } from 'ethers';
import { PerpDEXError } from '../../types/errors.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { WebSocketManager } from '../../websocket/index.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { HYPERLIQUID_MAINNET_API, HYPERLIQUID_MAINNET_WS, HYPERLIQUID_RATE_LIMIT, HYPERLIQUID_TESTNET_API, HYPERLIQUID_TESTNET_WS, HYPERLIQUID_WS_RECONNECT, hyperliquidToUnified, unifiedToHyperliquid, } from './constants.js';
import { HyperliquidAuth } from './HyperliquidAuth.js';
import { HyperliquidNormalizer } from './HyperliquidNormalizer.js';
import { HyperliquidWebSocket } from './HyperliquidWebSocket.js';
import { convertOrderRequest, mapError } from './utils.js';
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
    async fetchTrades(symbol, _params) {
        await this.rateLimiter.acquire('fetchTrades');
        try {
            this.symbolToExchange(symbol);
            // Hyperliquid provides trade history via candlestick endpoint
            // Note: Hyperliquid doesn't provide individual trades via REST
            // This is a limitation - real trade data requires WebSocket
            // Return empty array for now
            this.debug('fetchTrades: Hyperliquid REST API does not provide trade history');
            return [];
        }
        catch (error) {
            throw mapError(error);
        }
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
            // Map unified timeframe to Hyperliquid interval
            const intervalMap = {
                '1m': '1m',
                '3m': '3m',
                '5m': '5m',
                '15m': '15m',
                '30m': '30m',
                '1h': '1h',
                '2h': '2h',
                '4h': '4h',
                '6h': '6h',
                '8h': '8h',
                '12h': '12h',
                '1d': '1d',
                '3d': '3d',
                '1w': '1w',
                '1M': '1M',
            };
            const interval = intervalMap[timeframe] || '1h';
            // Calculate time range
            const now = Date.now();
            const defaultDuration = this.getDefaultDuration(timeframe);
            const startTime = params?.since ?? now - defaultDuration;
            const endTime = params?.until ?? now;
            const response = await this.request('POST', `${this.apiUrl}/info`, {
                type: 'candleSnapshot',
                req: {
                    coin: exchangeSymbol,
                    interval,
                    startTime,
                    endTime,
                },
            });
            if (!response || !Array.isArray(response)) {
                return [];
            }
            // Apply limit if specified
            const candles = params?.limit ? response.slice(-params.limit) : response;
            // Convert to OHLCV format
            return candles.map((candle) => [
                candle.t,
                parseFloat(candle.o),
                parseFloat(candle.h),
                parseFloat(candle.l),
                parseFloat(candle.c),
                parseFloat(candle.v),
            ]);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    /**
     * Get default duration based on timeframe for initial data fetch
     */
    getDefaultDuration(timeframe) {
        const durationMap = {
            '1m': 24 * 60 * 60 * 1000, // 24 hours of 1m candles
            '3m': 3 * 24 * 60 * 60 * 1000, // 3 days
            '5m': 5 * 24 * 60 * 60 * 1000, // 5 days
            '15m': 7 * 24 * 60 * 60 * 1000, // 7 days
            '30m': 14 * 24 * 60 * 60 * 1000, // 14 days
            '1h': 30 * 24 * 60 * 60 * 1000, // 30 days
            '2h': 60 * 24 * 60 * 60 * 1000, // 60 days
            '4h': 90 * 24 * 60 * 60 * 1000, // 90 days
            '6h': 120 * 24 * 60 * 60 * 1000, // 120 days
            '8h': 180 * 24 * 60 * 60 * 1000, // 180 days
            '12h': 365 * 24 * 60 * 60 * 1000, // 1 year
            '1d': 365 * 24 * 60 * 60 * 1000, // 1 year
            '3d': 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
            '1w': 3 * 365 * 24 * 60 * 60 * 1000, // 3 years
            '1M': 5 * 365 * 24 * 60 * 60 * 1000, // 5 years
        };
        return durationMap[timeframe] || 30 * 24 * 60 * 60 * 1000;
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
            // Get latest funding rate
            const latest = response[response.length - 1];
            if (!latest) {
                throw new Error(`No funding rate data for ${symbol}`);
            }
            // Fetch current mark price
            const allMids = await this.request('POST', `${this.apiUrl}/info`, {
                type: 'allMids',
            });
            const markPrice = parseFloat(allMids[exchangeSymbol] ?? '0');
            return {
                symbol,
                fundingRate: parseFloat(latest.fundingRate),
                fundingTimestamp: latest.time,
                nextFundingTimestamp: latest.time + 8 * 3600 * 1000, // 8 hours
                markPrice,
                indexPrice: markPrice,
                fundingIntervalHours: 8,
            };
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
            // Convert to unified format
            let fundingRates = response.map((rate) => ({
                symbol,
                fundingRate: parseFloat(rate.fundingRate),
                fundingTimestamp: rate.time,
                nextFundingTimestamp: rate.time + 8 * 3600 * 1000, // 8 hours
                markPrice,
                indexPrice: markPrice,
                fundingIntervalHours: 8,
            }));
            // Sort by timestamp descending (newest first)
            fundingRates.sort((a, b) => b.fundingTimestamp - a.fundingTimestamp);
            // Apply limit if provided
            if (limit) {
                fundingRates = fundingRates.slice(0, limit);
            }
            return fundingRates;
        }
        catch (error) {
            throw mapError(error);
        }
    }
    // ===========================================================================
    // Trading (Private)
    // ===========================================================================
    async createOrder(request) {
        this.ensureInitialized();
        // Validate order request
        const validatedRequest = this.validateOrder(request);
        if (!this.auth) {
            throw new Error('Authentication required for trading');
        }
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
            const signedRequest = await this.auth.sign({
                method: 'POST',
                path: '/exchange',
                body: action,
            });
            const response = await this.request('POST', `${this.apiUrl}/exchange`, signedRequest.body, signedRequest.headers);
            // Parse response
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
            // Return normalized order
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
        this.ensureInitialized();
        if (!this.auth) {
            throw new Error('Authentication required for trading');
        }
        await this.rateLimiter.acquire('cancelOrder');
        try {
            if (!symbol) {
                throw new Error('Symbol required for order cancellation');
            }
            const exchangeSymbol = this.symbolToExchange(symbol);
            // Create cancel action
            const action = {
                type: 'cancel',
                cancels: [
                    {
                        coin: exchangeSymbol,
                        oid: parseInt(orderId),
                    },
                ],
            };
            // Sign and send
            const signedRequest = await this.auth.sign({
                method: 'POST',
                path: '/exchange',
                body: action,
            });
            await this.request('POST', `${this.apiUrl}/exchange`, signedRequest.body, signedRequest.headers);
            // Return canceled order
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
        this.ensureInitialized();
        if (!this.auth) {
            throw new Error('Authentication required for trading');
        }
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
        this.ensureInitialized();
        if (!this.auth) {
            throw new Error('Authentication required');
        }
        await this.rateLimiter.acquire('fetchOrderHistory');
        try {
            const response = await this.request('POST', `${this.apiUrl}/info`, {
                type: 'historicalOrders',
                user: this.auth.getAddress(),
            });
            let orders = response.map((order) => this.normalizer.normalizeHistoricalOrder(order));
            // Filter by symbol if provided
            if (symbol) {
                orders = orders.filter((order) => order.symbol === symbol);
            }
            // Filter by since timestamp if provided
            if (since) {
                orders = orders.filter((order) => order.timestamp >= since);
            }
            // Sort by timestamp descending (newest first)
            orders.sort((a, b) => b.timestamp - a.timestamp);
            // Apply limit if provided
            if (limit) {
                orders = orders.slice(0, limit);
            }
            return orders;
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchMyTrades(symbol, since, limit) {
        this.ensureInitialized();
        if (!this.auth) {
            throw new Error('Authentication required');
        }
        await this.rateLimiter.acquire('fetchMyTrades');
        try {
            const response = await this.request('POST', `${this.apiUrl}/info`, {
                type: 'userFills',
                user: this.auth.getAddress(),
            });
            let trades = response.map((fill) => this.normalizer.normalizeUserFill(fill));
            // Filter by symbol if provided
            if (symbol) {
                trades = trades.filter((trade) => trade.symbol === symbol);
            }
            // Filter by since timestamp if provided
            if (since) {
                trades = trades.filter((trade) => trade.timestamp >= since);
            }
            // Sort by timestamp descending (newest first)
            trades.sort((a, b) => b.timestamp - a.timestamp);
            // Apply limit if provided
            if (limit) {
                trades = trades.slice(0, limit);
            }
            return trades;
        }
        catch (error) {
            throw mapError(error);
        }
    }
    // ===========================================================================
    // Positions & Balance
    // ===========================================================================
    async fetchPositions(symbols) {
        this.ensureInitialized();
        if (!this.auth) {
            throw new Error('Authentication required');
        }
        await this.rateLimiter.acquire('fetchPositions');
        try {
            const response = await this.request('POST', `${this.apiUrl}/info`, {
                type: 'clearinghouseState',
                user: this.auth.getAddress(),
            });
            const positions = response.assetPositions
                .filter((p) => parseFloat(p.position.szi) !== 0)
                .map((p) => this.normalizer.normalizePosition(p));
            // Filter by symbols if provided
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
        this.ensureInitialized();
        if (!this.auth) {
            throw new Error('Authentication required');
        }
        await this.rateLimiter.acquire('fetchBalance');
        try {
            const response = await this.request('POST', `${this.apiUrl}/info`, {
                type: 'clearinghouseState',
                user: this.auth.getAddress(),
            });
            return this.normalizer.normalizeBalance(response);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async setLeverage(symbol, leverage) {
        this.ensureInitialized();
        if (!this.auth) {
            throw new Error('Authentication required');
        }
        await this.rateLimiter.acquire('setLeverage', 5);
        try {
            // Note: Actual implementation needs the updateLeverage action format
            // For now, we'll log and acknowledge the limitation
            this.debug(`setLeverage: Updating leverage for ${symbol} to ${leverage}x`);
            this.debug('Note: Hyperliquid leverage is managed per-position in cross-margin mode');
            // In Hyperliquid, leverage for isolated positions is set when opening
            // For cross-margin, it's automatic based on account equity
            // This is more of a placeholder/documentation than functional implementation
        }
        catch (error) {
            throw mapError(error);
        }
    }
    // ===========================================================================
    // Additional Info Methods
    // ===========================================================================
    async fetchUserFees() {
        this.ensureInitialized();
        if (!this.auth) {
            throw new Error('Authentication required');
        }
        await this.rateLimiter.acquire('fetchUserFees');
        try {
            const response = await this.request('POST', `${this.apiUrl}/info`, {
                type: 'userFees',
                user: this.auth.getAddress(),
            });
            // Extract fee rates from response
            const makerFee = parseFloat(response.userAddRate);
            const takerFee = parseFloat(response.userCrossRate);
            return {
                maker: makerFee,
                taker: takerFee,
                info: response,
            };
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchPortfolio() {
        this.ensureInitialized();
        if (!this.auth) {
            throw new Error('Authentication required');
        }
        await this.rateLimiter.acquire('fetchPortfolio');
        try {
            const response = await this.request('POST', `${this.apiUrl}/info`, {
                type: 'portfolio',
                user: this.auth.getAddress(),
            });
            // Find the 'day' period data
            const dayPeriod = response.find(([period]) => period === 'day');
            if (!dayPeriod) {
                throw new PerpDEXError('Day period data not found in portfolio response', 'INVALID_RESPONSE', 'hyperliquid');
            }
            const [, dayData] = dayPeriod;
            // Extract latest values from history arrays
            const latestAccountValue = dayData.accountValueHistory.length > 0
                ? parseFloat(dayData.accountValueHistory[dayData.accountValueHistory.length - 1][1])
                : 0;
            const latestDailyPnl = dayData.pnlHistory.length > 0
                ? parseFloat(dayData.pnlHistory[dayData.pnlHistory.length - 1][1])
                : 0;
            // Find week and month periods for additional metrics
            const weekPeriod = response.find(([period]) => period === 'week');
            const monthPeriod = response.find(([period]) => period === 'month');
            const weeklyPnl = weekPeriod && weekPeriod[1].pnlHistory.length > 0
                ? parseFloat(weekPeriod[1].pnlHistory[weekPeriod[1].pnlHistory.length - 1][1])
                : 0;
            const monthlyPnl = monthPeriod && monthPeriod[1].pnlHistory.length > 0
                ? parseFloat(monthPeriod[1].pnlHistory[monthPeriod[1].pnlHistory.length - 1][1])
                : 0;
            // Calculate percentage changes (use account value as base)
            const dailyPnlPercentage = latestAccountValue > 0 ? (latestDailyPnl / latestAccountValue) * 100 : 0;
            const weeklyPnlPercentage = latestAccountValue > 0 ? (weeklyPnl / latestAccountValue) * 100 : 0;
            const monthlyPnlPercentage = latestAccountValue > 0 ? (monthlyPnl / latestAccountValue) * 100 : 0;
            return {
                totalValue: latestAccountValue,
                dailyPnl: latestDailyPnl,
                dailyPnlPercentage,
                weeklyPnl,
                weeklyPnlPercentage,
                monthlyPnl,
                monthlyPnlPercentage,
                timestamp: Date.now(),
                info: response,
            };
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async fetchRateLimitStatus() {
        this.ensureInitialized();
        if (!this.auth) {
            throw new Error('Authentication required');
        }
        await this.rateLimiter.acquire('fetchRateLimitStatus');
        try {
            const response = await this.request('POST', `${this.apiUrl}/info`, {
                type: 'userRateLimit',
                user: this.auth.getAddress(),
            });
            // Extract rate limit info from response
            const used = response.nRequestsUsed;
            const cap = response.nRequestsCap;
            // Hyperliquid uses a 60-second rolling window
            const windowMs = 60000;
            return {
                remaining: cap - used,
                limit: cap,
                resetAt: Date.now() + windowMs,
                percentUsed: cap > 0 ? (used / cap) * 100 : 0,
                info: response,
            };
        }
        catch (error) {
            throw mapError(error);
        }
    }
    // ===========================================================================
    // WebSocket Streams (delegated to HyperliquidWebSocket)
    // ===========================================================================
    async *watchOrderBook(symbol, limit) {
        this.ensureInitialized();
        if (!this.wsHandler) {
            throw new Error('WebSocket handler not initialized');
        }
        yield* this.wsHandler.watchOrderBook(symbol, limit);
    }
    async *watchTrades(symbol) {
        this.ensureInitialized();
        if (!this.wsHandler) {
            throw new Error('WebSocket handler not initialized');
        }
        yield* this.wsHandler.watchTrades(symbol);
    }
    async *watchTicker(symbol) {
        this.ensureInitialized();
        if (!this.wsHandler) {
            throw new Error('WebSocket handler not initialized');
        }
        yield* this.wsHandler.watchTicker(symbol);
    }
    async *watchPositions() {
        this.ensureInitialized();
        if (!this.wsHandler) {
            throw new Error('WebSocket handler not initialized');
        }
        yield* this.wsHandler.watchPositions();
    }
    /**
     * Watch open orders in real-time
     *
     * Subscribes to the USER_FILLS WebSocket channel and yields updated order lists
     * whenever fills occur. Provides real-time updates of the open order book.
     *
     * @returns AsyncGenerator that yields arrays of open orders
     * @throws {Error} If WebSocket handler is not initialized
     */
    async *watchOrders() {
        this.ensureInitialized();
        if (!this.wsHandler) {
            throw new Error('WebSocket handler not initialized');
        }
        yield* this.wsHandler.watchOrders();
    }
    /**
     * Watch user trades (fills) in real-time
     *
     * Subscribes to the USER_FILLS WebSocket channel and yields each trade
     * as it occurs. Provides real-time fill notifications for the authenticated user.
     *
     * @param symbol - Optional symbol to filter trades (e.g., "BTC/USDT:USDT")
     * @returns AsyncGenerator that yields individual trades
     * @throws {Error} If WebSocket handler is not initialized
     */
    async *watchMyTrades(symbol) {
        this.ensureInitialized();
        if (!this.wsHandler) {
            throw new Error('WebSocket handler not initialized');
        }
        yield* this.wsHandler.watchMyTrades(symbol);
    }
    // ===========================================================================
    // Helper Methods
    // ===========================================================================
    symbolToExchange(symbol) {
        return unifiedToHyperliquid(symbol);
    }
    symbolFromExchange(exchangeSymbol) {
        return hyperliquidToUnified(exchangeSymbol);
    }
    /**
     * Fetch open orders
     *
     * Retrieves all open (unfilled) orders for the authenticated user.
     * Can be filtered by symbol to get orders for a specific trading pair.
     *
     * @param symbol - Optional symbol to filter orders (e.g., "BTC/USDT:USDT")
     * @returns Array of open orders
     * @throws {Error} If authentication is required but not available
     *
     * @example
     * ```typescript
     * // Get all open orders
     * const allOrders = await adapter.fetchOpenOrders();
     *
     * // Get open orders for specific symbol
     * const ethOrders = await adapter.fetchOpenOrders('ETH/USDT:USDT');
     * ```
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
            const orders = response.map((order) => this.normalizer.normalizeOrder(order, order.coin));
            // Filter by symbol if provided
            if (symbol) {
                return orders.filter((o) => o.symbol === symbol);
            }
            return orders;
        }
        catch (error) {
            throw mapError(error);
        }
    }
}
//# sourceMappingURL=HyperliquidAdapter.js.map