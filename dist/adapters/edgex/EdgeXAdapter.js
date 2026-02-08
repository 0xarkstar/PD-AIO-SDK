/**
 * EdgeX Exchange Adapter
 *
 * High-performance perpetual DEX with ECDSA + SHA3 signatures
 * API Docs: https://edgex-1.gitbook.io/edgeX-documentation/api
 */
import { BaseAdapter } from '../base/BaseAdapter.js';
import { PerpDEXError } from '../../types/errors.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import { EDGEX_API_URLS, EDGEX_RATE_LIMITS, EDGEX_ENDPOINT_WEIGHTS, } from './constants.js';
import { EdgeXNormalizer } from './EdgeXNormalizer.js';
import { EdgeXAuth } from './EdgeXAuth.js';
import { toEdgeXOrderType, toEdgeXOrderSide, toEdgeXTimeInForce, mapEdgeXError, } from './utils.js';
/**
 * EdgeX adapter implementation
 */
export class EdgeXAdapter extends BaseAdapter {
    id = 'edgex';
    name = 'EdgeX';
    has = {
        fetchMarkets: true,
        fetchTicker: true,
        fetchOrderBook: true,
        fetchTrades: false, // Not available via REST, use watchTrades for WebSocket
        fetchFundingRate: true,
        fetchFundingRateHistory: false,
        fetchPositions: true,
        fetchBalance: true,
        fetchOpenOrders: true,
        fetchOrder: true,
        fetchOrderHistory: true,
        fetchMyTrades: true,
        createOrder: true,
        createBatchOrders: true,
        editOrder: true,
        cancelOrder: true,
        cancelAllOrders: true,
        setLeverage: true,
        watchOrderBook: true,
        watchTrades: true,
        watchTicker: true,
        watchPositions: true,
        watchOrders: true,
        watchBalance: true,
    };
    auth;
    baseUrl;
    rateLimiter;
    normalizer;
    constructor(config = {}) {
        super(config);
        // Initialize auth if credentials provided
        if (config.starkPrivateKey) {
            this.auth = new EdgeXAuth({ starkPrivateKey: config.starkPrivateKey });
        }
        // Initialize normalizer
        this.normalizer = new EdgeXNormalizer();
        this.rateLimiter = new RateLimiter({
            maxTokens: EDGEX_RATE_LIMITS.rest.maxRequests,
            refillRate: EDGEX_RATE_LIMITS.rest.maxRequests / (EDGEX_RATE_LIMITS.rest.windowMs / 1000),
            windowMs: EDGEX_RATE_LIMITS.rest.windowMs,
            weights: EDGEX_ENDPOINT_WEIGHTS,
        });
        const urls = config.testnet ? EDGEX_API_URLS.testnet : EDGEX_API_URLS.mainnet;
        this.baseUrl = urls.rest;
    }
    /**
     * Initialize the adapter
     * Note: starkPrivateKey is only required for private API operations (trading)
     */
    async initialize() {
        // Public API can be accessed without credentials
        this._isReady = true;
    }
    /**
     * Require authentication for private API operations
     */
    requireAuth() {
        if (!this.auth) {
            throw new PerpDEXError('Authentication required. Provide starkPrivateKey in config.', 'MISSING_CREDENTIALS', 'edgex');
        }
    }
    /**
     * Cleanup resources
     */
    async disconnect() {
        // Cleanup if needed
    }
    /**
     * Fetch all available markets
     */
    async fetchMarkets(_params) {
        const response = await this.makeRequest('GET', '/api/v1/public/meta/getMetaData', 'fetchMarkets');
        // Handle new API format: { code: 'SUCCESS', data: { contractList: [...] } }
        if (response.code === 'SUCCESS' && response.data?.contractList) {
            return response.data.contractList.map((market) => this.normalizer.normalizeMarket(market));
        }
        // Handle legacy test format: { markets: [...] }
        if (Array.isArray(response.markets)) {
            return response.markets.map((market) => this.normalizer.normalizeMarket(market));
        }
        throw new PerpDEXError('Invalid markets response', 'INVALID_RESPONSE', 'edgex');
    }
    /**
     * Fetch ticker for a symbol
     */
    async fetchTicker(symbol) {
        const contractId = this.normalizer.toEdgeXContractId(symbol);
        const response = await this.makeRequest('GET', `/api/v1/public/quote/getTicker?contractId=${contractId}`, 'fetchTicker');
        if (response.code !== 'SUCCESS' || !Array.isArray(response.data) || response.data.length === 0) {
            throw new PerpDEXError('Invalid ticker response', 'INVALID_RESPONSE', 'edgex');
        }
        return this.normalizer.normalizeTicker(response.data[0]);
    }
    /**
     * Fetch order book for a symbol
     * Note: EdgeX only supports level=15 or level=200 for order book depth
     */
    async fetchOrderBook(symbol, params) {
        const contractId = this.normalizer.toEdgeXContractId(symbol);
        // EdgeX only accepts level=15 or level=200
        const level = params?.limit && params.limit > 15 ? 200 : 15;
        const response = await this.makeRequest('GET', `/api/v1/public/quote/getDepth?contractId=${contractId}&level=${level}`, 'fetchOrderBook');
        if (response.code !== 'SUCCESS' || !Array.isArray(response.data) || response.data.length === 0) {
            throw new PerpDEXError('Invalid order book response', 'INVALID_RESPONSE', 'edgex');
        }
        return this.normalizer.normalizeOrderBook(response.data[0], symbol);
    }
    /**
     * Fetch recent trades for a symbol
     * Note: EdgeX does not expose public trades via REST API.
     * Use WebSocket (watchTrades) for real-time trade data.
     */
    async fetchTrades(_symbol, _params) {
        throw new PerpDEXError('EdgeX does not support fetchTrades via REST API. Use watchTrades() for WebSocket streaming.', 'NOT_IMPLEMENTED', 'edgex');
    }
    /**
     * Fetch current funding rate
     */
    async fetchFundingRate(symbol) {
        const contractId = this.normalizer.toEdgeXContractId(symbol);
        const response = await this.makeRequest('GET', `/api/v1/public/funding/getLatestFundingRate?contractId=${contractId}`, 'fetchFundingRate');
        if (response.code !== 'SUCCESS' || !Array.isArray(response.data) || response.data.length === 0) {
            throw new PerpDEXError('Invalid funding rate response', 'INVALID_RESPONSE', 'edgex');
        }
        return this.normalizer.normalizeFundingRate(response.data[0], symbol);
    }
    /**
     * Fetch funding rate history
     */
    async fetchFundingRateHistory(_symbol, _since, _limit) {
        throw new PerpDEXError('EdgeX does not support funding rate history', 'NOT_SUPPORTED', 'edgex');
    }
    /**
     * Fetch all open positions
     */
    async fetchPositions(symbols) {
        this.requireAuth();
        const response = await this.makeRequest('GET', '/api/v1/private/account/getPositionList', 'fetchPositions');
        if (!Array.isArray(response.positions)) {
            throw new PerpDEXError('Invalid positions response', 'INVALID_RESPONSE', 'edgex');
        }
        let positions = response.positions.map((position) => this.normalizer.normalizePosition(position));
        if (symbols && symbols.length > 0) {
            positions = positions.filter((p) => symbols.includes(p.symbol));
        }
        return positions;
    }
    /**
     * Fetch account balance
     */
    async fetchBalance() {
        this.requireAuth();
        const response = await this.makeRequest('GET', '/api/v1/private/account/getCollateralBalance', 'fetchBalance');
        if (!Array.isArray(response.balances)) {
            throw new PerpDEXError('Invalid balance response', 'INVALID_RESPONSE', 'edgex');
        }
        return response.balances.map((balance) => this.normalizer.normalizeBalance(balance));
    }
    /**
     * Create a new order
     */
    async createOrder(request) {
        // Validate order request
        const validatedRequest = this.validateOrder(request);
        this.requireAuth();
        const market = this.normalizer.toEdgeXSymbol(validatedRequest.symbol);
        const orderType = toEdgeXOrderType(validatedRequest.type);
        const side = toEdgeXOrderSide(validatedRequest.side);
        const timeInForce = toEdgeXTimeInForce(validatedRequest.timeInForce);
        const payload = {
            market,
            side,
            type: orderType,
            size: validatedRequest.amount.toString(),
            price: validatedRequest.price?.toString(),
            time_in_force: timeInForce,
            reduce_only: validatedRequest.reduceOnly ?? false,
            post_only: validatedRequest.postOnly ?? false,
            client_order_id: validatedRequest.clientOrderId,
        };
        const response = await this.makeRequest('POST', '/api/v1/private/order/createOrder', 'createOrder', payload);
        return this.normalizer.normalizeOrder(response);
    }
    /**
     * Cancel an existing order
     */
    async cancelOrder(orderId, _symbol) {
        this.requireAuth();
        const response = await this.makeRequest('POST', '/api/v1/private/order/cancelOrder', 'cancelOrder', { orderId });
        return this.normalizer.normalizeOrder(response);
    }
    /**
     * Cancel all orders
     */
    async cancelAllOrders(symbol) {
        this.requireAuth();
        const contractId = symbol ? this.normalizer.toEdgeXContractId(symbol) : undefined;
        const params = contractId ? `?contractId=${contractId}` : '';
        const response = await this.makeRequest('DELETE', `/api/v1/private/order/cancelAllOrder${params}`, 'cancelAllOrders');
        if (!Array.isArray(response.orders)) {
            throw new PerpDEXError('Invalid cancel all orders response', 'INVALID_RESPONSE', 'edgex');
        }
        return response.orders.map((order) => this.normalizer.normalizeOrder(order));
    }
    /**
     * Create multiple orders in a single request
     *
     * @param orders - Array of order requests
     * @returns Array of created orders
     */
    async createBatchOrders(orders) {
        this.requireAuth();
        const batchPayload = orders.map((order) => {
            const market = this.normalizer.toEdgeXSymbol(order.symbol);
            const orderType = toEdgeXOrderType(order.type);
            const side = toEdgeXOrderSide(order.side);
            const timeInForce = toEdgeXTimeInForce(order.timeInForce);
            return {
                market,
                side,
                type: orderType,
                size: order.amount.toString(),
                price: order.price?.toString(),
                time_in_force: timeInForce,
                reduce_only: order.reduceOnly ?? false,
                post_only: order.postOnly ?? false,
                client_order_id: order.clientOrderId,
            };
        });
        const response = await this.makeRequest('POST', '/api/v1/private/order/batchCreateOrder', 'createBatchOrders', { orders: batchPayload });
        if (response.code !== 'SUCCESS' || !Array.isArray(response.data?.orders)) {
            if (response.code === 'NOT_FOUND' || !response.data) {
                throw new PerpDEXError('Batch orders endpoint not available', 'NOT_SUPPORTED', 'edgex');
            }
            throw new PerpDEXError('Invalid batch orders response', 'INVALID_RESPONSE', 'edgex');
        }
        return response.data.orders.map((order) => this.normalizer.normalizeOrder(order));
    }
    /**
     * Modify an existing order
     *
     * @param orderId - Order ID to modify
     * @param symbol - Trading symbol
     * @param type - Order type (market/limit)
     * @param side - Order side (buy/sell)
     * @param amount - New order amount (optional)
     * @param price - New order price (optional)
     * @returns Modified order
     */
    async modifyOrder(orderId, _symbol, _type, _side, amount, price) {
        this.requireAuth();
        const payload = {
            orderId,
        };
        if (amount !== undefined) {
            payload.size = amount.toString();
        }
        if (price !== undefined) {
            payload.price = price.toString();
        }
        const response = await this.makeRequest('POST', '/api/v1/private/order/modifyOrder', 'modifyOrder', payload);
        if (response.code !== 'SUCCESS' || !response.data) {
            if (response.code === 'NOT_FOUND') {
                throw new PerpDEXError('Order not found', 'ORDER_NOT_FOUND', 'edgex');
            }
            throw new PerpDEXError('Invalid modify order response', 'INVALID_RESPONSE', 'edgex');
        }
        return this.normalizer.normalizeOrder(response.data);
    }
    /**
     * Fetch open orders
     */
    async fetchOpenOrders(symbol) {
        this.requireAuth();
        const contractId = symbol ? this.normalizer.toEdgeXContractId(symbol) : undefined;
        const params = contractId ? `?contractId=${contractId}` : '';
        const response = await this.makeRequest('GET', `/api/v1/private/order/getOpenOrderList${params}`, 'fetchOpenOrders');
        if (!Array.isArray(response.orders)) {
            throw new PerpDEXError('Invalid open orders response', 'INVALID_RESPONSE', 'edgex');
        }
        return response.orders.map((order) => this.normalizer.normalizeOrder(order));
    }
    /**
     * Fetch a specific order
     */
    async fetchOrder(orderId, _symbol) {
        this.requireAuth();
        const response = await this.makeRequest('GET', `/api/v1/private/order/getOrder?orderId=${orderId}`, 'fetchOrder');
        return this.normalizer.normalizeOrder(response);
    }
    /**
     * Set leverage for a symbol
     */
    async setLeverage(symbol, leverage) {
        const market = this.normalizer.toEdgeXSymbol(symbol);
        await this.makeRequest('POST', '/account/leverage', 'setLeverage', {
            market,
            leverage: leverage.toString(),
        });
    }
    /**
     * Fetch order history
     *
     * Retrieves closed/filled orders from EdgeX.
     * Uses /api/v1/private/order/getOrderFillTransactionPage endpoint.
     *
     * @param symbol - Optional symbol filter
     * @param since - Optional start timestamp
     * @param limit - Optional limit (default 100, max 500)
     * @returns Array of historical orders
     */
    async fetchOrderHistory(symbol, since, limit) {
        this.requireAuth();
        const params = {};
        if (symbol) {
            params.contractId = this.normalizer.toEdgeXContractId(symbol);
        }
        if (since) {
            params.startTime = since.toString();
        }
        if (limit) {
            params.size = Math.min(limit, 500).toString();
        }
        const queryString = Object.entries(params)
            .map(([k, v]) => `${k}=${v}`)
            .join('&');
        const path = `/api/v1/private/order/getOrderFillTransactionPage${queryString ? `?${queryString}` : ''}`;
        const response = await this.makeRequest('GET', path, 'fetchOrderHistory');
        if (response.code !== 'SUCCESS' || !Array.isArray(response.data?.dataList)) {
            // If endpoint doesn't exist yet, return empty array
            if (response.code === 'NOT_FOUND' || !response.data) {
                return [];
            }
            throw new PerpDEXError('Invalid order history response', 'INVALID_RESPONSE', 'edgex');
        }
        return response.data.dataList.map((order) => this.normalizer.normalizeOrder(order));
    }
    /**
     * Fetch user trade history
     *
     * Retrieves user's executed trades from EdgeX.
     * Uses /api/v1/private/order/getOrderFillTransactionPage endpoint.
     *
     * @param symbol - Optional symbol filter
     * @param since - Optional start timestamp
     * @param limit - Optional limit (default 100, max 500)
     * @returns Array of trades
     */
    async fetchMyTrades(symbol, since, limit) {
        this.requireAuth();
        const params = {};
        if (symbol) {
            params.contractId = this.normalizer.toEdgeXContractId(symbol);
        }
        if (since) {
            params.startTime = since.toString();
        }
        if (limit) {
            params.size = Math.min(limit, 500).toString();
        }
        const queryString = Object.entries(params)
            .map(([k, v]) => `${k}=${v}`)
            .join('&');
        const path = `/api/v1/private/order/getOrderFillTransactionPage${queryString ? `?${queryString}` : ''}`;
        const response = await this.makeRequest('GET', path, 'fetchMyTrades');
        if (response.code !== 'SUCCESS' || !Array.isArray(response.data?.dataList)) {
            // If endpoint doesn't exist yet, return empty array
            if (response.code === 'NOT_FOUND' || !response.data) {
                return [];
            }
            throw new PerpDEXError('Invalid trades response', 'INVALID_RESPONSE', 'edgex');
        }
        return response.data.dataList.map((trade) => this.normalizer.normalizeTrade(trade));
    }
    /**
     * Convert unified symbol to exchange format
     */
    symbolToExchange(symbol) {
        return this.normalizer.toEdgeXSymbol(symbol);
    }
    /**
     * Convert exchange symbol to unified format
     */
    symbolFromExchange(exchangeSymbol) {
        return this.normalizer.normalizeSymbol(exchangeSymbol);
    }
    /**
     * Make HTTP request
     * Authentication headers are added for private endpoints
     */
    async makeRequest(method, path, endpoint, body) {
        await this.rateLimiter.acquire(endpoint);
        const url = `${this.baseUrl}${path}`;
        const headers = {
            'Content-Type': 'application/json',
        };
        // Add authentication headers for private endpoints
        const isPrivateEndpoint = path.includes('/private/');
        if (isPrivateEndpoint && this.auth) {
            const timestamp = Date.now().toString();
            headers['X-edgeX-Api-Timestamp'] = timestamp;
            headers['X-edgeX-Api-Signature'] = await this.auth.signRequest(method, path, timestamp, body);
        }
        try {
            const response = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                const { code } = mapEdgeXError(error);
                throw new PerpDEXError(`EdgeX API error: ${response.statusText}`, code, 'edgex', error);
            }
            return await response.json();
        }
        catch (error) {
            if (error instanceof PerpDEXError) {
                throw error;
            }
            const { code } = mapEdgeXError(error);
            throw new PerpDEXError('Request failed', code, 'edgex', error);
        }
    }
}
//# sourceMappingURL=EdgeXAdapter.js.map