/**
 * dYdX v4 Exchange Adapter
 *
 * Implements IExchangeAdapter for dYdX v4 Perpetual DEX.
 * dYdX v4 is built on a Cosmos SDK L1 blockchain with its own validator set.
 *
 * Features:
 * - 220+ perpetual markets
 * - Hourly funding rates
 * - Cross-margin trading
 * - Full orderbook
 *
 * @see https://docs.dydx.exchange/
 */
import { RateLimiter } from '../../core/RateLimiter.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { DYDX_MAINNET_API, DYDX_TESTNET_API, DYDX_RATE_LIMIT, DYDX_DEFAULT_SUBACCOUNT_NUMBER, unifiedToDydx, dydxToUnified, } from './constants.js';
import { DydxAuth } from './DydxAuth.js';
import { DydxNormalizer } from './DydxNormalizer.js';
import { mapDydxError } from './error-codes.js';
import { mapTimeframeToDydx, getDefaultOHLCVDuration, buildUrl } from './utils.js';
/**
 * dYdX v4 Exchange Adapter
 *
 * Provides access to dYdX v4's perpetual futures markets through the Indexer API.
 *
 * @example
 * ```typescript
 * // Read-only mode (no authentication needed)
 * const dydx = new DydxAdapter({ testnet: true });
 * await dydx.initialize();
 *
 * const markets = await dydx.fetchMarkets();
 * const ticker = await dydx.fetchTicker('BTC/USD:USD');
 *
 * // Trading mode (requires mnemonic)
 * const dydxTrading = new DydxAdapter({
 *   mnemonic: 'your 24 word mnemonic...',
 *   subaccountNumber: 0,
 * });
 * await dydxTrading.initialize();
 *
 * const positions = await dydxTrading.fetchPositions();
 * ```
 */
export class DydxAdapter extends BaseAdapter {
    id = 'dydx';
    name = 'dYdX v4';
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
        createBatchOrders: false,
        cancelBatchOrders: 'emulated',
        editOrder: false,
        // Order Query
        fetchOpenOrders: true,
        fetchOrder: false,
        // Account History
        fetchOrderHistory: true,
        fetchMyTrades: true,
        fetchDeposits: false,
        fetchWithdrawals: false,
        // Positions & Balance
        fetchPositions: true,
        fetchBalance: true,
        setLeverage: false, // dYdX v4 uses cross-margin
        setMarginMode: false,
        // WebSocket
        watchOrderBook: true,
        watchTrades: true,
        watchTicker: true,
        watchPositions: true,
        watchOrders: true,
        watchBalance: true,
        watchFundingRate: false,
        watchOHLCV: true,
        // Advanced
        twapOrders: false,
        vaultTrading: false,
        // Additional Info
        fetchUserFees: false,
        fetchPortfolio: false,
        fetchRateLimitStatus: false,
    };
    apiUrl;
    auth;
    rateLimiter;
    normalizer;
    subaccountNumber;
    // Market cache for oracle prices
    marketDataCache = new Map();
    marketDataCacheTTL = 60000; // 1 minute
    constructor(config = {}) {
        super(config);
        // Set API URLs
        this.apiUrl = config.testnet ? DYDX_TESTNET_API : DYDX_MAINNET_API;
        // Initialize normalizer
        this.normalizer = new DydxNormalizer();
        // Initialize rate limiter
        this.rateLimiter = new RateLimiter({
            maxTokens: config.rateLimit?.maxRequests ?? DYDX_RATE_LIMIT.maxRequests,
            windowMs: config.rateLimit?.windowMs ?? DYDX_RATE_LIMIT.windowMs,
            weights: config.rateLimit?.weights ?? DYDX_RATE_LIMIT.weights,
            exchange: 'dydx',
        });
        // Subaccount number
        this.subaccountNumber = config.subaccountNumber ?? DYDX_DEFAULT_SUBACCOUNT_NUMBER;
        // Initialize auth if credentials provided
        if (config.mnemonic || config.privateKey) {
            this.auth = new DydxAuth({
                mnemonic: config.mnemonic,
                privateKey: config.privateKey,
                subaccountNumber: this.subaccountNumber,
                testnet: config.testnet,
            });
        }
    }
    // ===========================================================================
    // Connection Management
    // ===========================================================================
    async initialize() {
        if (this._isReady) {
            return;
        }
        // Verify auth if provided
        if (this.auth) {
            const isValid = await this.auth.verify();
            if (!isValid) {
                throw new Error('Failed to verify dYdX credentials');
            }
            this.debug('Authentication verified', { subaccountNumber: this.subaccountNumber });
        }
        // Preload markets to validate API connectivity
        try {
            await this.fetchMarkets();
            this.debug('Markets loaded successfully');
        }
        catch (error) {
            throw mapDydxError(error);
        }
        this._isReady = true;
        this.debug('Adapter initialized');
    }
    async disconnect() {
        // Clear caches
        this.marketDataCache.clear();
        await super.disconnect();
        this.debug('Adapter disconnected');
    }
    // ===========================================================================
    // Market Data (Public)
    // ===========================================================================
    async fetchMarkets(params) {
        await this.rateLimiter.acquire('fetchMarkets');
        try {
            const response = await this.request('GET', `${this.apiUrl}/perpetualMarkets`);
            const markets = this.normalizer.normalizeMarkets(response.markets);
            // Update oracle price cache
            for (const [ticker, market] of Object.entries(response.markets)) {
                this.marketDataCache.set(ticker, {
                    oraclePrice: parseFloat(market.oraclePrice),
                    timestamp: Date.now(),
                });
            }
            // Filter by params if provided
            if (params?.active !== undefined) {
                return markets.filter((m) => m.active === params.active);
            }
            return markets;
        }
        catch (error) {
            throw mapDydxError(error);
        }
    }
    async fetchTicker(symbol) {
        await this.rateLimiter.acquire('fetchTicker');
        try {
            const response = await this.request('GET', `${this.apiUrl}/perpetualMarkets`);
            const exchangeSymbol = this.symbolToExchange(symbol);
            const market = response.markets[exchangeSymbol];
            if (!market) {
                throw new Error(`Market not found: ${symbol}`);
            }
            // Update cache
            this.marketDataCache.set(exchangeSymbol, {
                oraclePrice: parseFloat(market.oraclePrice),
                timestamp: Date.now(),
            });
            return this.normalizer.normalizeTicker(market);
        }
        catch (error) {
            throw mapDydxError(error);
        }
    }
    async fetchOrderBook(symbol, _params) {
        await this.rateLimiter.acquire('fetchOrderBook');
        try {
            const exchangeSymbol = this.symbolToExchange(symbol);
            const response = await this.request('GET', `${this.apiUrl}/orderbooks/perpetualMarket/${exchangeSymbol}`);
            return this.normalizer.normalizeOrderBook(response, exchangeSymbol);
        }
        catch (error) {
            throw mapDydxError(error);
        }
    }
    async fetchTrades(symbol, params) {
        await this.rateLimiter.acquire('fetchTrades');
        try {
            const exchangeSymbol = this.symbolToExchange(symbol);
            const queryParams = {
                limit: params?.limit ?? 100,
            };
            if (params?.since) {
                queryParams.createdBeforeOrAtHeight = undefined; // dYdX uses block height, not timestamp directly
            }
            const url = buildUrl(this.apiUrl, `/trades/perpetualMarket/${exchangeSymbol}`, queryParams);
            const response = await this.request('GET', url);
            return this.normalizer.normalizeTrades(response.trades, exchangeSymbol);
        }
        catch (error) {
            throw mapDydxError(error);
        }
    }
    async fetchFundingRate(symbol) {
        await this.rateLimiter.acquire('fetchFundingRate');
        try {
            const exchangeSymbol = this.symbolToExchange(symbol);
            // Fetch market data for oracle price
            const marketsResponse = await this.request('GET', `${this.apiUrl}/perpetualMarkets`);
            const market = marketsResponse.markets[exchangeSymbol];
            if (!market) {
                throw new Error(`Market not found: ${symbol}`);
            }
            const oraclePrice = parseFloat(market.oraclePrice);
            // Return current funding rate from market data
            const fundingTimestamp = new Date(market.nextFundingAt).getTime();
            return {
                symbol,
                fundingRate: parseFloat(market.nextFundingRate),
                fundingTimestamp,
                nextFundingTimestamp: fundingTimestamp + 3600 * 1000, // +1 hour
                markPrice: oraclePrice,
                indexPrice: oraclePrice,
                fundingIntervalHours: 1,
                info: {
                    nextFundingAt: market.nextFundingAt,
                },
            };
        }
        catch (error) {
            throw mapDydxError(error);
        }
    }
    async fetchFundingRateHistory(symbol, since, limit) {
        await this.rateLimiter.acquire('fetchFundingRateHistory');
        try {
            const exchangeSymbol = this.symbolToExchange(symbol);
            const queryParams = {
                limit: limit ?? 100,
            };
            if (since) {
                queryParams.effectiveBeforeOrAt = new Date(since).toISOString();
            }
            const url = buildUrl(this.apiUrl, `/historicalFunding/${exchangeSymbol}`, queryParams);
            const response = await this.request('GET', url);
            // Get current oracle price
            const oraclePrice = await this.getOraclePrice(exchangeSymbol);
            return this.normalizer.normalizeFundingHistory(response.historicalFunding, oraclePrice);
        }
        catch (error) {
            throw mapDydxError(error);
        }
    }
    async fetchOHLCV(symbol, timeframe = '1h', params) {
        await this.rateLimiter.acquire('fetchOHLCV');
        try {
            const exchangeSymbol = this.symbolToExchange(symbol);
            const resolution = mapTimeframeToDydx(timeframe);
            const now = Date.now();
            const defaultDuration = getDefaultOHLCVDuration(timeframe);
            const fromISO = new Date(params?.since ?? now - defaultDuration).toISOString();
            const toISO = params?.until ? new Date(params.until).toISOString() : new Date(now).toISOString();
            const queryParams = {
                resolution,
                fromISO,
                toISO,
                limit: params?.limit ?? 100,
            };
            const url = buildUrl(this.apiUrl, `/candles/perpetualMarkets/${exchangeSymbol}`, queryParams);
            const response = await this.request('GET', url);
            return this.normalizer.normalizeCandles(response.candles);
        }
        catch (error) {
            throw mapDydxError(error);
        }
    }
    // ===========================================================================
    // Trading (Private)
    // ===========================================================================
    async createOrder(_request) {
        this.ensureInitialized();
        if (!this.auth) {
            throw new Error('Authentication required for trading. Provide mnemonic or privateKey.');
        }
        await this.rateLimiter.acquire('createOrder');
        try {
            // Note: dYdX v4 trading requires the official @dydxprotocol/v4-client-js library
            // which handles Cosmos SDK transaction signing. This adapter is designed to work
            // with the Indexer API for read operations.
            //
            // For trading integration, you would:
            // 1. Use the CompositeClient from @dydxprotocol/v4-client-js
            // 2. Configure it with the mnemonic/wallet
            // 3. Call placeOrder, placeShortTermOrder, etc.
            //
            // Example with official SDK:
            // const client = await CompositeClient.connect(Network.mainnet());
            // const subaccount = new SubaccountClient(wallet, 0);
            // await client.placeOrder(subaccount, marketId, type, side, price, size, ...);
            throw new Error('Trading operations require the official @dydxprotocol/v4-client-js SDK. ' +
                'This adapter provides read-only access to the Indexer API. ' +
                'Please integrate the official SDK for order placement.');
        }
        catch (error) {
            throw mapDydxError(error);
        }
    }
    async cancelOrder(_orderId, _symbol) {
        this.ensureInitialized();
        if (!this.auth) {
            throw new Error('Authentication required for trading');
        }
        await this.rateLimiter.acquire('cancelOrder');
        try {
            // Same note as createOrder - requires official SDK for actual cancellation
            throw new Error('Trading operations require the official @dydxprotocol/v4-client-js SDK. ' +
                'This adapter provides read-only access to the Indexer API.');
        }
        catch (error) {
            throw mapDydxError(error);
        }
    }
    async cancelAllOrders(_symbol) {
        this.ensureInitialized();
        if (!this.auth) {
            throw new Error('Authentication required for trading');
        }
        await this.rateLimiter.acquire('cancelAllOrders');
        try {
            throw new Error('Trading operations require the official @dydxprotocol/v4-client-js SDK. ' +
                'This adapter provides read-only access to the Indexer API.');
        }
        catch (error) {
            throw mapDydxError(error);
        }
    }
    // ===========================================================================
    // Account Data (Private)
    // ===========================================================================
    async fetchPositions(symbols) {
        this.ensureInitialized();
        if (!this.auth) {
            throw new Error('Authentication required');
        }
        await this.rateLimiter.acquire('fetchPositions');
        try {
            const address = await this.auth.getAddress();
            const response = await this.request('GET', `${this.apiUrl}/addresses/${address}/subaccountNumber/${this.subaccountNumber}`);
            // Get oracle prices for position valuation
            const oraclePrices = {};
            for (const ticker of Object.keys(response.subaccount.openPerpetualPositions)) {
                oraclePrices[ticker] = await this.getOraclePrice(ticker);
            }
            let positions = this.normalizer.normalizePositions(response.subaccount.openPerpetualPositions, oraclePrices);
            // Filter by symbols if provided
            if (symbols && symbols.length > 0) {
                positions = positions.filter((p) => symbols.includes(p.symbol));
            }
            return positions;
        }
        catch (error) {
            throw mapDydxError(error);
        }
    }
    async fetchBalance() {
        this.ensureInitialized();
        if (!this.auth) {
            throw new Error('Authentication required');
        }
        await this.rateLimiter.acquire('fetchBalance');
        try {
            const address = await this.auth.getAddress();
            const response = await this.request('GET', `${this.apiUrl}/addresses/${address}/subaccountNumber/${this.subaccountNumber}`);
            return this.normalizer.normalizeBalance(response.subaccount);
        }
        catch (error) {
            throw mapDydxError(error);
        }
    }
    async setLeverage(_symbol, _leverage) {
        // dYdX v4 uses cross-margin and doesn't support per-symbol leverage setting
        this.debug('setLeverage: dYdX v4 uses cross-margin mode without per-symbol leverage');
        throw new Error('dYdX v4 uses cross-margin mode. Leverage is automatically calculated based on account equity.');
    }
    // ===========================================================================
    // Order History
    // ===========================================================================
    async fetchOrderHistory(symbol, since, limit) {
        this.ensureInitialized();
        if (!this.auth) {
            throw new Error('Authentication required');
        }
        await this.rateLimiter.acquire('fetchOrderHistory');
        try {
            const address = await this.auth.getAddress();
            const queryParams = {
                limit: limit ?? 100,
                subaccountNumber: this.subaccountNumber,
            };
            if (symbol) {
                queryParams.ticker = this.symbolToExchange(symbol);
            }
            const url = buildUrl(this.apiUrl, `/addresses/${address}/orders`, queryParams);
            const response = await this.request('GET', url);
            let orders = this.normalizer.normalizeOrders(response);
            // Filter by since timestamp if provided
            if (since) {
                orders = orders.filter((order) => order.timestamp >= since);
            }
            // Sort by timestamp descending (newest first)
            orders.sort((a, b) => b.timestamp - a.timestamp);
            return orders;
        }
        catch (error) {
            throw mapDydxError(error);
        }
    }
    async fetchMyTrades(symbol, since, limit) {
        this.ensureInitialized();
        if (!this.auth) {
            throw new Error('Authentication required');
        }
        await this.rateLimiter.acquire('fetchMyTrades');
        try {
            const address = await this.auth.getAddress();
            const queryParams = {
                limit: limit ?? 100,
                subaccountNumber: this.subaccountNumber,
            };
            if (symbol) {
                queryParams.market = this.symbolToExchange(symbol);
            }
            const url = buildUrl(this.apiUrl, `/addresses/${address}/fills`, queryParams);
            const response = await this.request('GET', url);
            let trades = this.normalizer.normalizeFills(response.fills);
            // Filter by since timestamp if provided
            if (since) {
                trades = trades.filter((trade) => trade.timestamp >= since);
            }
            // Sort by timestamp descending (newest first)
            trades.sort((a, b) => b.timestamp - a.timestamp);
            return trades;
        }
        catch (error) {
            throw mapDydxError(error);
        }
    }
    /**
     * Fetch open orders
     *
     * @param symbol - Optional symbol to filter orders
     * @returns Array of open orders
     */
    async fetchOpenOrders(symbol) {
        this.ensureInitialized();
        if (!this.auth) {
            throw new Error('Authentication required');
        }
        await this.rateLimiter.acquire('fetchOpenOrders');
        try {
            const address = await this.auth.getAddress();
            const queryParams = {
                subaccountNumber: this.subaccountNumber,
                status: 'OPEN',
            };
            if (symbol) {
                queryParams.ticker = this.symbolToExchange(symbol);
            }
            const url = buildUrl(this.apiUrl, `/addresses/${address}/orders`, queryParams);
            const response = await this.request('GET', url);
            return this.normalizer.normalizeOrders(response);
        }
        catch (error) {
            throw mapDydxError(error);
        }
    }
    // ===========================================================================
    // WebSocket Streams (Placeholder implementations)
    // ===========================================================================
    async *watchOrderBook(_symbol, _limit) {
        this.ensureInitialized();
        // WebSocket implementation would go here
        // For now, we provide a polling fallback
        throw new Error('WebSocket streams require additional implementation. Use fetchOrderBook for polling.');
        yield {}; // Type system requirement
    }
    async *watchTrades(_symbol) {
        this.ensureInitialized();
        throw new Error('WebSocket streams require additional implementation. Use fetchTrades for polling.');
        yield {};
    }
    async *watchTicker(_symbol) {
        this.ensureInitialized();
        throw new Error('WebSocket streams require additional implementation. Use fetchTicker for polling.');
        yield {};
    }
    async *watchPositions() {
        this.ensureInitialized();
        throw new Error('WebSocket streams require additional implementation. Use fetchPositions for polling.');
        yield [];
    }
    async *watchOrders() {
        this.ensureInitialized();
        throw new Error('WebSocket streams require additional implementation. Use fetchOpenOrders for polling.');
        yield [];
    }
    async *watchBalance() {
        this.ensureInitialized();
        throw new Error('WebSocket streams require additional implementation. Use fetchBalance for polling.');
        yield [];
    }
    // ===========================================================================
    // Helper Methods
    // ===========================================================================
    symbolToExchange(symbol) {
        return unifiedToDydx(symbol);
    }
    symbolFromExchange(exchangeSymbol) {
        return dydxToUnified(exchangeSymbol);
    }
    /**
     * Get oracle price from cache or fetch fresh
     */
    async getOraclePrice(ticker) {
        const cached = this.marketDataCache.get(ticker);
        if (cached && Date.now() - cached.timestamp < this.marketDataCacheTTL) {
            return cached.oraclePrice;
        }
        // Fetch fresh market data
        const response = await this.request('GET', `${this.apiUrl}/perpetualMarkets`);
        const market = response.markets[ticker];
        if (!market) {
            return 0;
        }
        const oraclePrice = parseFloat(market.oraclePrice);
        this.marketDataCache.set(ticker, { oraclePrice, timestamp: Date.now() });
        return oraclePrice;
    }
    /**
     * Get the dYdX address (if authenticated)
     */
    async getAddress() {
        if (!this.auth) {
            return undefined;
        }
        return this.auth.getAddress();
    }
    /**
     * Get the configured subaccount number
     */
    getSubaccountNumber() {
        return this.subaccountNumber;
    }
}
//# sourceMappingURL=DydxAdapter.js.map