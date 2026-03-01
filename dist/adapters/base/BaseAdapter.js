/**
 * Base Exchange Adapter
 *
 * Abstract base class providing API surface methods for all adapters.
 * Extends BaseAdapterCore to inherit infrastructure functionality.
 */
import { BadRequestError, InvalidOrderError, NotSupportedError, PerpDEXError, } from '../../types/errors.js';
import { BaseAdapterCore } from './BaseAdapterCore.js';
export class BaseAdapter extends BaseAdapterCore {
    // ===========================================================================
    // Input Validation Methods
    // ===========================================================================
    /**
     * Validate symbol format at SDK boundary
     *
     * @param symbol - Symbol to validate
     * @throws {BadRequestError} If symbol is invalid
     */
    validateSymbol(symbol) {
        if (!symbol || typeof symbol !== 'string') {
            throw new BadRequestError('Symbol is required', 'INVALID_SYMBOL', this.id);
        }
        // Allow formats: BTC/USD, BTC/USD:USD, BTC/USDT, 1000PEPE/USDT:USDT
        if (!/^[A-Z0-9]{1,20}\/[A-Z0-9]{1,20}(:[A-Z0-9]{1,20})?$/i.test(symbol)) {
            throw new BadRequestError(`Invalid symbol format: ${symbol}`, 'INVALID_SYMBOL', this.id);
        }
    }
    /**
     * Validate leverage value at SDK boundary
     *
     * @param leverage - Leverage value to validate
     * @throws {InvalidOrderError} If leverage is invalid
     */
    validateLeverage(leverage) {
        if (typeof leverage !== 'number' || isNaN(leverage) || leverage <= 0 || leverage > 200) {
            throw new InvalidOrderError(`Invalid leverage: ${leverage}. Must be between 0 and 200`, 'INVALID_LEVERAGE', this.id);
        }
    }
    /**
     * Fetch ticker with validation
     */
    async fetchTicker(symbol) {
        this.validateSymbol(symbol);
        return this._fetchTicker(symbol);
    }
    /**
     * Fetch order book with validation
     */
    async fetchOrderBook(symbol, params) {
        this.validateSymbol(symbol);
        return this._fetchOrderBook(symbol, params);
    }
    /**
     * Fetch trades with validation
     */
    async fetchTrades(symbol, params) {
        this.validateSymbol(symbol);
        return this._fetchTrades(symbol, params);
    }
    /**
     * Fetch funding rate with validation
     */
    async fetchFundingRate(symbol) {
        this.validateSymbol(symbol);
        return this._fetchFundingRate(symbol);
    }
    /**
     * Set leverage with validation
     */
    async setLeverage(symbol, leverage) {
        this.validateSymbol(symbol);
        this.validateLeverage(leverage);
        return this._setLeverage(symbol, leverage);
    }
    // ===========================================================================
    // Market Data (Public) - Optional implementations
    // ===========================================================================
    async fetchOHLCV(_symbol, _timeframe, _params) {
        if (!this.has.fetchOHLCV) {
            throw new NotSupportedError(`${this.name} does not support OHLCV data`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchOHLCV must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchTickers(symbols) {
        if (!this.has.fetchTickers) {
            const result = {};
            const symbolsToFetch = symbols ?? (await this.fetchMarkets()).map((m) => m.symbol);
            for (const symbol of symbolsToFetch) {
                try {
                    result[symbol] = await this.fetchTicker(symbol);
                }
                catch (error) {
                    this.debug(`Failed to fetch ticker for ${symbol}`, { error });
                }
            }
            return result;
        }
        throw new NotSupportedError('fetchTickers must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchCurrencies() {
        if (!this.has.fetchCurrencies) {
            throw new NotSupportedError(`${this.name} does not support fetching currencies`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchCurrencies must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchStatus() {
        if (!this.has.fetchStatus) {
            try {
                await this.fetchMarkets();
                return { status: 'ok', updated: Date.now() };
            }
            catch (error) {
                return {
                    status: 'error',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    updated: Date.now(),
                };
            }
        }
        throw new NotSupportedError('fetchStatus must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchTime() {
        if (!this.has.fetchTime) {
            throw new NotSupportedError(`${this.name} does not support fetching server time`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchTime must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    // ===========================================================================
    // Trading & Account History (implemented by concrete adapters)
    // ===========================================================================
    async fetchDeposits(_currency, _since, _limit) {
        if (!this.has.fetchDeposits) {
            throw new NotSupportedError(`${this.name} does not support fetching deposit history`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchDeposits must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchWithdrawals(_currency, _since, _limit) {
        if (!this.has.fetchWithdrawals) {
            throw new NotSupportedError(`${this.name} does not support fetching withdrawal history`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchWithdrawals must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchLedger(_currency, _since, _limit, _params) {
        if (!this.has.fetchLedger) {
            throw new NotSupportedError(`${this.name} does not support fetching ledger`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchLedger must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchFundingHistory(_symbol, _since, _limit) {
        if (!this.has.fetchFundingHistory) {
            throw new NotSupportedError(`${this.name} does not support fetching funding history`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchFundingHistory must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    // ===========================================================================
    // Batch Operations (from OrderHelpersMixin)
    // ===========================================================================
    async createBatchOrders(requests) {
        if (this.has.createBatchOrders === true) {
            throw new NotSupportedError('createBatchOrders must be implemented by subclass when has.createBatchOrders is true', 'NOT_IMPLEMENTED', this.id);
        }
        this.debug('No native batch support, creating orders sequentially', { count: requests.length });
        const orders = [];
        const errors = [];
        for (let i = 0; i < requests.length; i++) {
            const request = requests[i];
            if (!request)
                continue;
            try {
                const order = await this.createOrder(request);
                orders.push(order);
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                errors.push({ index: i, error: err });
                this.debug('Failed to create order', {
                    index: i + 1,
                    total: requests.length,
                    error: err.message,
                });
            }
        }
        if (orders.length === 0 && errors.length > 0) {
            const firstError = errors[0];
            if (firstError) {
                throw new PerpDEXError(`All batch order creations failed. First error: ${firstError.error.message}`, 'BATCH_FAILED', this.id, firstError.error);
            }
        }
        if (errors.length > 0) {
            this.debug('Batch order creation completed', {
                succeeded: orders.length,
                failed: errors.length,
            });
        }
        return orders;
    }
    async cancelBatchOrders(orderIds, symbol) {
        if (this.has.cancelBatchOrders === true) {
            throw new NotSupportedError('cancelBatchOrders must be implemented by subclass when has.cancelBatchOrders is true', 'NOT_IMPLEMENTED', this.id);
        }
        this.debug('No native batch support, canceling orders sequentially', {
            count: orderIds.length,
        });
        const orders = [];
        const errors = [];
        for (let i = 0; i < orderIds.length; i++) {
            const orderId = orderIds[i];
            if (!orderId)
                continue;
            try {
                const order = await this.cancelOrder(orderId, symbol);
                orders.push(order);
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                errors.push({ index: i, orderId, error: err });
                this.debug('Failed to cancel order', { orderId, error: err.message });
            }
        }
        if (orders.length === 0 && errors.length > 0) {
            const firstError = errors[0];
            if (firstError) {
                throw new PerpDEXError(`All batch order cancellations failed. First error: ${firstError.error.message}`, 'BATCH_FAILED', this.id, firstError.error);
            }
        }
        if (errors.length > 0) {
            this.debug('Batch order cancellation completed', {
                succeeded: orders.length,
                failed: errors.length,
            });
        }
        return orders;
    }
    async editOrder(_orderId, _symbol, _type, _side, _amount, _price, _params) {
        if (!this.has.editOrder) {
            throw new NotSupportedError(`${this.name} does not support editing orders`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('editOrder must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    // ===========================================================================
    // Order Query
    // ===========================================================================
    async fetchOrder(_orderId, _symbol) {
        if (!this.has.fetchOrder) {
            throw new NotSupportedError(`${this.name} does not support fetching single orders`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchOrder must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchOpenOrders(_symbol, _since, _limit) {
        if (!this.has.fetchOpenOrders) {
            throw new NotSupportedError(`${this.name} does not support fetching open orders`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchOpenOrders must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchClosedOrders(_symbol, _since, _limit) {
        if (!this.has.fetchClosedOrders) {
            throw new NotSupportedError(`${this.name} does not support fetching closed orders`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchClosedOrders must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    // ===========================================================================
    // Convenience Order Methods (CCXT-compatible)
    // ===========================================================================
    async createLimitBuyOrder(symbol, amount, price, params) {
        return this.createOrder({ symbol, type: 'limit', side: 'buy', amount, price, ...params });
    }
    async createLimitSellOrder(symbol, amount, price, params) {
        return this.createOrder({ symbol, type: 'limit', side: 'sell', amount, price, ...params });
    }
    async createMarketBuyOrder(symbol, amount, params) {
        return this.createOrder({ symbol, type: 'market', side: 'buy', amount, ...params });
    }
    async createMarketSellOrder(symbol, amount, params) {
        return this.createOrder({ symbol, type: 'market', side: 'sell', amount, ...params });
    }
    async createStopLossOrder(symbol, amount, stopPrice, params) {
        return this.createOrder({
            symbol,
            type: 'stopMarket',
            side: 'sell',
            amount,
            stopPrice,
            reduceOnly: true,
            ...params,
        });
    }
    async createTakeProfitOrder(symbol, amount, takeProfitPrice, params) {
        return this.createOrder({
            symbol,
            type: 'limit',
            side: 'sell',
            amount,
            price: takeProfitPrice,
            reduceOnly: true,
            ...params,
        });
    }
    // ===========================================================================
    // Positions & Balance
    // ===========================================================================
    async setMarginMode(_symbol, _marginMode) {
        if (!this.has.setMarginMode || this.has.setMarginMode === 'emulated') {
            throw new NotSupportedError(`${this.name} does not support setting margin mode directly`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('setMarginMode must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    // ===========================================================================
    // WebSocket Streams - default implementation throws if not supported
    // ===========================================================================
    async *watchOrderBook(_symbol, _limit) {
        if (!this.has.watchOrderBook) {
            throw new NotSupportedError(`${this.name} does not support order book streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('watchOrderBook must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
        yield {};
    }
    async *watchTrades(_symbol) {
        if (!this.has.watchTrades) {
            throw new NotSupportedError(`${this.name} does not support trade streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('watchTrades must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
        yield {};
    }
    async *watchTicker(_symbol) {
        if (!this.has.watchTicker) {
            throw new NotSupportedError(`${this.name} does not support ticker streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('watchTicker must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
        yield {};
    }
    async *watchTickers(_symbols) {
        if (!this.has.watchTickers) {
            throw new NotSupportedError(`${this.name} does not support multiple ticker streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('watchTickers must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
        yield {};
    }
    async *watchPositions() {
        if (!this.has.watchPositions) {
            throw new NotSupportedError(`${this.name} does not support position streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('watchPositions must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
        yield [];
    }
    async *watchOrders() {
        if (!this.has.watchOrders) {
            throw new NotSupportedError(`${this.name} does not support order streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('watchOrders must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
        yield [];
    }
    async *watchBalance() {
        if (!this.has.watchBalance) {
            throw new NotSupportedError(`${this.name} does not support balance streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('watchBalance must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
        yield [];
    }
    async *watchFundingRate(_symbol) {
        if (!this.has.watchFundingRate) {
            throw new NotSupportedError(`${this.name} does not support funding rate streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('watchFundingRate must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
        yield {};
    }
    async *watchOHLCV(_symbol, _timeframe) {
        if (!this.has.watchOHLCV) {
            throw new NotSupportedError(`${this.name} does not support OHLCV streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('watchOHLCV must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
        yield [0, 0, 0, 0, 0, 0];
    }
    async *watchMyTrades(_symbol) {
        if (!this.has.watchMyTrades) {
            throw new NotSupportedError(`${this.name} does not support user trade streaming`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('watchMyTrades must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
        yield {};
    }
    // ===========================================================================
    // Additional Info Methods
    // ===========================================================================
    async fetchUserFees() {
        if (!this.has.fetchUserFees) {
            throw new NotSupportedError(`${this.name} does not support fetching user fees`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchUserFees must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchPortfolio() {
        if (!this.has.fetchPortfolio) {
            throw new NotSupportedError(`${this.name} does not support fetching portfolio metrics`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchPortfolio must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    async fetchRateLimitStatus() {
        if (!this.has.fetchRateLimitStatus) {
            throw new NotSupportedError(`${this.name} does not support fetching rate limit status`, 'NOT_SUPPORTED', this.id);
        }
        throw new NotSupportedError('fetchRateLimitStatus must be implemented by subclass', 'NOT_IMPLEMENTED', this.id);
    }
    // ===========================================================================
    // Python-style Method Aliases
    // ===========================================================================
    fetch_markets = this.fetchMarkets.bind(this);
    fetch_ticker = this.fetchTicker.bind(this);
    fetch_order_book = this.fetchOrderBook.bind(this);
    fetch_trades = this.fetchTrades.bind(this);
    fetch_funding_rate = this.fetchFundingRate.bind(this);
    fetch_funding_rate_history = this.fetchFundingRateHistory.bind(this);
    fetch_ohlcv = this.fetchOHLCV.bind(this);
    create_order = this.createOrder.bind(this);
    cancel_order = this.cancelOrder.bind(this);
    cancel_all_orders = this.cancelAllOrders.bind(this);
    create_batch_orders = this.createBatchOrders.bind(this);
    cancel_batch_orders = this.cancelBatchOrders.bind(this);
    fetch_positions = this.fetchPositions.bind(this);
    fetch_balance = this.fetchBalance.bind(this);
    set_leverage = this.setLeverage.bind(this);
    set_margin_mode = this.setMarginMode.bind(this);
    fetch_open_orders = this.fetchOpenOrders.bind(this);
    health_check = this.healthCheck.bind(this);
    get_metrics = this.getMetrics.bind(this);
    reset_metrics = this.resetMetrics.bind(this);
    preload_markets = this.preloadMarkets.bind(this);
    get_preloaded_markets = this.getPreloadedMarkets.bind(this);
    clear_cache = this.clearCache.bind(this);
    fetch_deposits = this.fetchDeposits.bind(this);
    fetch_withdrawals = this.fetchWithdrawals.bind(this);
    get fetch_order_history() {
        return this.fetchOrderHistory.bind(this);
    }
    get fetch_my_trades() {
        return this.fetchMyTrades.bind(this);
    }
}
//# sourceMappingURL=BaseAdapter.js.map