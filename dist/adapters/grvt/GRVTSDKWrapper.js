/**
 * GRVT SDK Wrapper
 *
 * Thin wrapper around official @grvt/client SDK
 * Provides consistent error handling and session management
 */
import { MDG, TDG } from '@grvt/client';
/**
 * Wrapper around official GRVT TypeScript SDK
 *
 * Responsibilities:
 * - Initialize MDG (Market Data Gateway) and TDG (Trading Data Gateway)
 * - Provide unified error handling
 * - Extract and manage session cookies
 * - Expose SDK methods with consistent interface
 */
export class GRVTSDKWrapper {
    mdg;
    tdg;
    sessionCookie;
    constructor(config) {
        const sdkConfig = {
            host: config.host,
        };
        this.mdg = new MDG(sdkConfig);
        this.tdg = new TDG(sdkConfig);
    }
    /**
     * Get axios instance from MDG for direct access if needed
     */
    get mdgAxios() {
        return this.mdg.axios;
    }
    /**
     * Get axios instance from TDG for direct access if needed
     */
    get tdgAxios() {
        return this.tdg.axios;
    }
    // ==================== Market Data Methods ====================
    /**
     * Get single instrument details
     */
    async getInstrument(instrumentId, config) {
        return this.mdg.instrument({ instrument: instrumentId }, config);
    }
    /**
     * Get filtered instruments
     */
    async getInstruments(params, config) {
        return this.mdg.instruments(params || {}, config);
    }
    /**
     * Get all instruments
     */
    async getAllInstruments(config) {
        return this.mdg.allInstruments({}, config);
    }
    /**
     * Get mini ticker (lightweight)
     */
    async getMiniTicker(instrumentId, config) {
        return this.mdg.miniTicker({ instrument: instrumentId }, config);
    }
    /**
     * Get full ticker
     */
    async getTicker(instrumentId, config) {
        return this.mdg.ticker({ instrument: instrumentId }, config);
    }
    /**
     * Get order book
     */
    async getOrderBook(instrumentId, depth, config) {
        return this.mdg.orderBook({ instrument: instrumentId, depth }, config);
    }
    /**
     * Get latest trade for instrument
     */
    async getTrade(instrumentId, config) {
        return this.mdg.trade({ instrument: instrumentId }, config);
    }
    /**
     * Get trade history
     */
    async getTradeHistory(params, config) {
        return this.mdg.tradesHistory(params || {}, config);
    }
    /**
     * Get settlement price
     */
    async getSettlement(params, config) {
        return this.mdg.settlement(params || {}, config);
    }
    /**
     * Get funding rate
     */
    async getFunding(instrumentId, config) {
        return this.mdg.funding({ instrument: instrumentId }, config);
    }
    /**
     * Get candlestick data
     */
    async getCandlestick(params, config) {
        return this.mdg.candlestick(params, config);
    }
    /**
     * Get margin rules
     */
    async getMarginRules(config) {
        return this.mdg.marginRules({}, config);
    }
    // ==================== Trading Methods ====================
    /**
     * Create new order
     */
    async createOrder(order, config) {
        const response = await this.tdg.createOrder(order, config);
        this.extractSessionCookieFromResponse(response);
        return response;
    }
    /**
     * Create bulk orders
     */
    async createBulkOrders(orders, config) {
        const response = await this.tdg.createBulkOrders(orders, config);
        this.extractSessionCookieFromResponse(response);
        return response;
    }
    /**
     * Cancel single order
     */
    async cancelOrder(params, config) {
        const response = await this.tdg.cancelOrder(params, config);
        this.extractSessionCookieFromResponse(response);
        return response;
    }
    /**
     * Cancel all orders
     */
    async cancelAllOrders(params, config) {
        const response = await this.tdg.cancelAllOrders(params || {}, config);
        this.extractSessionCookieFromResponse(response);
        return response;
    }
    /**
     * Get single order
     */
    async getOrder(params, config) {
        return this.tdg.order(params, config);
    }
    /**
     * Get open orders
     */
    async getOpenOrders(params, config) {
        return this.tdg.openOrders(params || {}, config);
    }
    /**
     * Get order history (CRITICAL: fixes unimplemented method)
     */
    async getOrderHistory(params, config) {
        return this.tdg.orderHistory(params || {}, config);
    }
    /**
     * Get order group
     */
    async getOrderGroup(params, config) {
        return this.tdg.orderGroup(params, config);
    }
    /**
     * Replace orders (TP/SL)
     */
    async replaceOrders(params, config) {
        const response = await this.tdg.replaceOrders(params, config);
        this.extractSessionCookieFromResponse(response);
        return response;
    }
    /**
     * Pre-order check
     */
    async preOrderCheck(order, config) {
        return this.tdg.preOrderCheck(order, config);
    }
    /**
     * Get price protection bands
     */
    async getPriceProtectionBands(config) {
        return this.tdg.getPriceProtectionBands(config);
    }
    // ==================== Account Methods ====================
    /**
     * Get positions
     */
    async getPositions(params, config) {
        return this.tdg.positions(params || {}, config);
    }
    /**
     * Get sub-account summary (balance)
     */
    async getSubAccountSummary(params, config) {
        return this.tdg.subAccountSummary(params || {}, config);
    }
    /**
     * Get sub-account history
     */
    async getSubAccountHistory(params, config) {
        return this.tdg.subAccountHistory(params || {}, config);
    }
    /**
     * Get fill history (my trades) (CRITICAL: fixes unimplemented method)
     */
    async getFillHistory(params, config) {
        return this.tdg.fillHistory(params || {}, config);
    }
    /**
     * Get aggregated account summary
     */
    async getAggregatedAccountSummary(config) {
        return this.tdg.aggregatedAccountSummary(config);
    }
    /**
     * Get funding account summary
     */
    async getFundingAccountSummary(config) {
        return this.tdg.fundingAccountSummary(config);
    }
    /**
     * Get funding payment history
     */
    async getFundingPaymentHistory(params, config) {
        return this.tdg.fundingPaymentHistory(params || {}, config);
    }
    // ==================== Transfer Methods ====================
    /**
     * Pre-deposit check
     */
    async preDepositCheck(params, config) {
        return this.tdg.preDepositCheck(params, config);
    }
    /**
     * Get deposit history
     */
    async getDepositHistory(params, config) {
        return this.tdg.depositHistory(params || {}, config);
    }
    /**
     * Transfer funds
     */
    async transfer(params, config) {
        const response = await this.tdg.transfer(params, config);
        this.extractSessionCookieFromResponse(response);
        return response;
    }
    /**
     * Get transfer history
     */
    async getTransferHistory(params, config) {
        return this.tdg.transferHistory(params || {}, config);
    }
    /**
     * Request withdrawal
     */
    async withdrawal(params, config) {
        const response = await this.tdg.withdrawal(params, config);
        this.extractSessionCookieFromResponse(response);
        return response;
    }
    /**
     * Get withdrawal history
     */
    async getWithdrawalHistory(params, config) {
        return this.tdg.withdrawalHistory(params || {}, config);
    }
    // ==================== Leverage Methods ====================
    /**
     * Get all initial leverage
     */
    async getAllInitialLeverage(params, config) {
        return this.tdg.getAllInitialLeverage(params || {}, config);
    }
    /**
     * Set initial leverage
     */
    async setInitialLeverage(params, config) {
        const response = await this.tdg.setInitialLeverage(params, config);
        this.extractSessionCookieFromResponse(response);
        return response;
    }
    /**
     * Get margin tiers
     */
    async getMarginTiers(config) {
        return this.tdg.getMarginTiers(config);
    }
    // ==================== Session Management ====================
    /**
     * Extract session cookie from axios response
     */
    extractSessionCookieFromResponse(response) {
        if (!response || typeof response !== 'object')
            return;
        // Check if it's an axios response with headers
        const resp = response;
        const config = resp.config;
        const headers = resp.headers || config?.headers;
        if (!headers)
            return;
        // Look for Set-Cookie header
        const setCookie = headers['set-cookie'] || headers['Set-Cookie'];
        if (!setCookie)
            return;
        // Extract session cookie
        const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
        const sessionCookie = cookies.find((cookie) => cookie.toLowerCase().includes('session'));
        if (sessionCookie) {
            // Extract just the cookie value before the first semicolon
            const cookieValue = sessionCookie.split(';')[0];
            this.sessionCookie = cookieValue;
        }
    }
    /**
     * Get current session cookie
     */
    getSessionCookie() {
        return this.sessionCookie;
    }
    /**
     * Set session cookie manually
     */
    setSessionCookie(cookie) {
        this.sessionCookie = cookie;
    }
    /**
     * Check if we have a valid session
     */
    hasSession() {
        return !!this.sessionCookie;
    }
    /**
     * Clear session cookie
     */
    clearSession() {
        this.sessionCookie = undefined;
    }
}
//# sourceMappingURL=GRVTSDKWrapper.js.map