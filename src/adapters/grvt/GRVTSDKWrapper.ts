/**
 * GRVT SDK Wrapper
 *
 * Thin wrapper around official @grvt/client SDK
 * Provides consistent error handling and session management
 */

import { MDG, TDG } from '@grvt/client';
import type { IConfig } from '@grvt/client/interfaces';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * GRVT SDK Wrapper configuration
 */
export interface GRVTSDKWrapperConfig {
  host: string;
  apiKey?: string;
  apiSecret?: string;
  timeout?: number;
}

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
  private mdg: MDG;
  private tdg: TDG;
  private sessionCookie?: string;

  constructor(config: GRVTSDKWrapperConfig) {

    const sdkConfig: IConfig = {
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
  async getInstrument(instrumentId: string, config?: AxiosRequestConfig) {
    return this.mdg.instrument({ instrument: instrumentId }, config);
  }

  /**
   * Get filtered instruments
   */
  async getInstruments(params?: any, config?: AxiosRequestConfig) {
    return this.mdg.instruments(params || {}, config);
  }

  /**
   * Get all instruments
   */
  async getAllInstruments(config?: AxiosRequestConfig) {
    return this.mdg.allInstruments({}, config);
  }

  /**
   * Get mini ticker (lightweight)
   */
  async getMiniTicker(instrumentId?: string, config?: AxiosRequestConfig) {
    return this.mdg.miniTicker({ instrument: instrumentId }, config);
  }

  /**
   * Get full ticker
   */
  async getTicker(instrumentId?: string, config?: AxiosRequestConfig) {
    return this.mdg.ticker({ instrument: instrumentId }, config);
  }

  /**
   * Get order book
   */
  async getOrderBook(instrumentId: string, depth?: number, config?: AxiosRequestConfig) {
    return this.mdg.orderBook({ instrument: instrumentId, depth }, config);
  }

  /**
   * Get latest trade for instrument
   */
  async getTrade(instrumentId: string, config?: AxiosRequestConfig) {
    return this.mdg.trade({ instrument: instrumentId }, config);
  }

  /**
   * Get trade history
   */
  async getTradeHistory(params?: any, config?: AxiosRequestConfig) {
    return this.mdg.tradesHistory(params || {}, config);
  }

  /**
   * Get settlement price
   */
  async getSettlement(params?: any, config?: AxiosRequestConfig) {
    return this.mdg.settlement(params || {}, config);
  }

  /**
   * Get funding rate
   */
  async getFunding(instrumentId?: string, config?: AxiosRequestConfig) {
    return this.mdg.funding({ instrument: instrumentId }, config);
  }

  /**
   * Get candlestick data
   */
  async getCandlestick(params: any, config?: AxiosRequestConfig) {
    return this.mdg.candlestick(params, config);
  }

  /**
   * Get margin rules
   */
  async getMarginRules(config?: AxiosRequestConfig) {
    return this.mdg.marginRules({}, config);
  }

  // ==================== Trading Methods ====================

  /**
   * Create new order
   */
  async createOrder(order: any, config?: AxiosRequestConfig) {
    const response = await this.tdg.createOrder(order, config);
    this.extractSessionCookieFromResponse(response);
    return response;
  }

  /**
   * Create bulk orders
   */
  async createBulkOrders(orders: any, config?: AxiosRequestConfig) {
    const response = await this.tdg.createBulkOrders(orders, config);
    this.extractSessionCookieFromResponse(response);
    return response;
  }

  /**
   * Cancel single order
   */
  async cancelOrder(params: {
    order_id?: string;
    client_order_id?: string;
  }, config?: AxiosRequestConfig) {
    const response = await this.tdg.cancelOrder(params, config);
    this.extractSessionCookieFromResponse(response);
    return response;
  }

  /**
   * Cancel all orders
   */
  async cancelAllOrders(params?: any, config?: AxiosRequestConfig) {
    const response = await this.tdg.cancelAllOrders(params || {}, config);
    this.extractSessionCookieFromResponse(response);
    return response;
  }

  /**
   * Get single order
   */
  async getOrder(params: {
    order_id?: string;
    client_order_id?: string;
  }, config?: AxiosRequestConfig) {
    return this.tdg.order(params, config);
  }

  /**
   * Get open orders
   */
  async getOpenOrders(params?: any, config?: AxiosRequestConfig) {
    return this.tdg.openOrders(params || {}, config);
  }

  /**
   * Get order history (CRITICAL: fixes unimplemented method)
   */
  async getOrderHistory(params?: any, config?: AxiosRequestConfig) {
    return this.tdg.orderHistory(params || {}, config);
  }

  /**
   * Get order group
   */
  async getOrderGroup(params: any, config?: AxiosRequestConfig) {
    return this.tdg.orderGroup(params, config);
  }

  /**
   * Replace orders (TP/SL)
   */
  async replaceOrders(params: any, config?: AxiosRequestConfig) {
    const response = await this.tdg.replaceOrders(params, config);
    this.extractSessionCookieFromResponse(response);
    return response;
  }

  /**
   * Pre-order check
   */
  async preOrderCheck(order: any, config?: AxiosRequestConfig) {
    return this.tdg.preOrderCheck(order, config);
  }

  /**
   * Get price protection bands
   */
  async getPriceProtectionBands(config?: AxiosRequestConfig) {
    return this.tdg.getPriceProtectionBands(config);
  }

  // ==================== Account Methods ====================

  /**
   * Get positions
   */
  async getPositions(params?: any, config?: AxiosRequestConfig) {
    return this.tdg.positions(params || {}, config);
  }

  /**
   * Get sub-account summary (balance)
   */
  async getSubAccountSummary(params?: any, config?: AxiosRequestConfig) {
    return this.tdg.subAccountSummary(params || {}, config);
  }

  /**
   * Get sub-account history
   */
  async getSubAccountHistory(params?: any, config?: AxiosRequestConfig) {
    return this.tdg.subAccountHistory(params || {}, config);
  }

  /**
   * Get fill history (my trades) (CRITICAL: fixes unimplemented method)
   */
  async getFillHistory(params?: any, config?: AxiosRequestConfig) {
    return this.tdg.fillHistory(params || {}, config);
  }

  /**
   * Get aggregated account summary
   */
  async getAggregatedAccountSummary(config?: AxiosRequestConfig) {
    return this.tdg.aggregatedAccountSummary(config);
  }

  /**
   * Get funding account summary
   */
  async getFundingAccountSummary(config?: AxiosRequestConfig) {
    return this.tdg.fundingAccountSummary(config);
  }

  /**
   * Get funding payment history
   */
  async getFundingPaymentHistory(params?: any, config?: AxiosRequestConfig) {
    return this.tdg.fundingPaymentHistory(params || {}, config);
  }

  // ==================== Transfer Methods ====================

  /**
   * Pre-deposit check
   */
  async preDepositCheck(params: any, config?: AxiosRequestConfig) {
    return this.tdg.preDepositCheck(params, config);
  }

  /**
   * Get deposit history
   */
  async getDepositHistory(params?: any, config?: AxiosRequestConfig) {
    return this.tdg.depositHistory(params || {}, config);
  }

  /**
   * Transfer funds
   */
  async transfer(params: any, config?: AxiosRequestConfig) {
    const response = await this.tdg.transfer(params, config);
    this.extractSessionCookieFromResponse(response);
    return response;
  }

  /**
   * Get transfer history
   */
  async getTransferHistory(params?: any, config?: AxiosRequestConfig) {
    return this.tdg.transferHistory(params || {}, config);
  }

  /**
   * Request withdrawal
   */
  async withdrawal(params: any, config?: AxiosRequestConfig) {
    const response = await this.tdg.withdrawal(params, config);
    this.extractSessionCookieFromResponse(response);
    return response;
  }

  /**
   * Get withdrawal history
   */
  async getWithdrawalHistory(params?: any, config?: AxiosRequestConfig) {
    return this.tdg.withdrawalHistory(params || {}, config);
  }

  // ==================== Leverage Methods ====================

  /**
   * Get all initial leverage
   */
  async getAllInitialLeverage(params?: any, config?: AxiosRequestConfig) {
    return this.tdg.getAllInitialLeverage(params || {}, config);
  }

  /**
   * Set initial leverage
   */
  async setInitialLeverage(params: any, config?: AxiosRequestConfig) {
    const response = await this.tdg.setInitialLeverage(params, config);
    this.extractSessionCookieFromResponse(response);
    return response;
  }

  /**
   * Get margin tiers
   */
  async getMarginTiers(config?: AxiosRequestConfig) {
    return this.tdg.getMarginTiers(config);
  }

  // ==================== Session Management ====================

  /**
   * Extract session cookie from axios response
   */
  private extractSessionCookieFromResponse(response: AxiosResponse | any): void {
    if (!response) return;

    // Check if it's an axios response with headers
    const headers = response.headers || response.config?.headers;
    if (!headers) return;

    // Look for Set-Cookie header
    const setCookie = headers['set-cookie'] || headers['Set-Cookie'];
    if (!setCookie) return;

    // Extract session cookie
    const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
    const sessionCookie = cookies.find((cookie: string) =>
      cookie.toLowerCase().includes('session')
    );

    if (sessionCookie) {
      // Extract just the cookie value before the first semicolon
      const cookieValue = sessionCookie.split(';')[0];
      this.sessionCookie = cookieValue;
    }
  }

  /**
   * Get current session cookie
   */
  getSessionCookie(): string | undefined {
    return this.sessionCookie;
  }

  /**
   * Set session cookie manually
   */
  setSessionCookie(cookie: string): void {
    this.sessionCookie = cookie;
  }

  /**
   * Check if we have a valid session
   */
  hasSession(): boolean {
    return !!this.sessionCookie;
  }

  /**
   * Clear session cookie
   */
  clearSession(): void {
    this.sessionCookie = undefined;
  }
}
