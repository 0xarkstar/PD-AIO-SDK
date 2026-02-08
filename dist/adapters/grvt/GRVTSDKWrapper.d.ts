/**
 * GRVT SDK Wrapper
 *
 * Thin wrapper around official @grvt/client SDK
 * Provides consistent error handling and session management
 */
import type { AxiosRequestConfig } from 'axios';
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
export declare class GRVTSDKWrapper {
    private mdg;
    private tdg;
    private sessionCookie?;
    constructor(config: GRVTSDKWrapperConfig);
    /**
     * Get axios instance from MDG for direct access if needed
     */
    get mdgAxios(): import("axios").AxiosInstance;
    /**
     * Get axios instance from TDG for direct access if needed
     */
    get tdgAxios(): import("axios").AxiosInstance;
    /**
     * Get single instrument details
     */
    getInstrument(instrumentId: string, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiGetInstrumentResponse>;
    /**
     * Get filtered instruments
     */
    getInstruments(params?: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiGetFilteredInstrumentsResponse>;
    /**
     * Get all instruments
     */
    getAllInstruments(config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiGetAllInstrumentsResponse>;
    /**
     * Get mini ticker (lightweight)
     */
    getMiniTicker(instrumentId?: string, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiMiniTickerResponse>;
    /**
     * Get full ticker
     */
    getTicker(instrumentId?: string, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiTickerResponse>;
    /**
     * Get order book
     */
    getOrderBook(instrumentId: string, depth?: number, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiOrderbookLevelsResponse>;
    /**
     * Get latest trade for instrument
     */
    getTrade(instrumentId: string, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiTradeResponse>;
    /**
     * Get trade history
     */
    getTradeHistory(params?: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiTradeHistoryResponse>;
    /**
     * Get settlement price
     */
    getSettlement(params?: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiSettlementPriceResponse>;
    /**
     * Get funding rate
     */
    getFunding(instrumentId?: string, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiFundingRateResponse>;
    /**
     * Get candlestick data
     */
    getCandlestick(params: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiCandlestickResponse>;
    /**
     * Get margin rules
     */
    getMarginRules(config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiGetMarginRulesResponse>;
    /**
     * Create new order
     */
    createOrder(order: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiCreateOrderResponse>;
    /**
     * Create bulk orders
     */
    createBulkOrders(orders: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiCreateBulkOrdersResponse>;
    /**
     * Cancel single order
     */
    cancelOrder(params: {
        order_id?: string;
        client_order_id?: string;
    }, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiCancelOrderResponse>;
    /**
     * Cancel all orders
     */
    cancelAllOrders(params?: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiCancelAllOrdersResponse>;
    /**
     * Get single order
     */
    getOrder(params: {
        order_id?: string;
        client_order_id?: string;
    }, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiGetOrderResponse>;
    /**
     * Get open orders
     */
    getOpenOrders(params?: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiOpenOrdersResponse>;
    /**
     * Get order history (CRITICAL: fixes unimplemented method)
     */
    getOrderHistory(params?: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiOrderHistoryResponse>;
    /**
     * Get order group
     */
    getOrderGroup(params: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiGetOrderGroupResponse>;
    /**
     * Replace orders (TP/SL)
     */
    replaceOrders(params: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiReplaceOrdersResponse>;
    /**
     * Pre-order check
     */
    preOrderCheck(order: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiPreOrderCheckResponse>;
    /**
     * Get price protection bands
     */
    getPriceProtectionBands(config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiGetPriceProtectionBandsResponse>;
    /**
     * Get positions
     */
    getPositions(params?: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiPositionsResponse>;
    /**
     * Get sub-account summary (balance)
     */
    getSubAccountSummary(params?: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiSubAccountSummaryResponse>;
    /**
     * Get sub-account history
     */
    getSubAccountHistory(params?: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiSubAccountHistoryResponse>;
    /**
     * Get fill history (my trades) (CRITICAL: fixes unimplemented method)
     */
    getFillHistory(params?: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiFillHistoryResponse>;
    /**
     * Get aggregated account summary
     */
    getAggregatedAccountSummary(config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiAggregatedAccountSummaryResponse>;
    /**
     * Get funding account summary
     */
    getFundingAccountSummary(config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiFundingAccountSummaryResponse>;
    /**
     * Get funding payment history
     */
    getFundingPaymentHistory(params?: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiFundingPaymentHistoryResponse>;
    /**
     * Pre-deposit check
     */
    preDepositCheck(params: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiPreDepositCheckResponse>;
    /**
     * Get deposit history
     */
    getDepositHistory(params?: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiDepositHistoryResponse>;
    /**
     * Transfer funds
     */
    transfer(params: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiTransferResponse>;
    /**
     * Get transfer history
     */
    getTransferHistory(params?: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiTransferHistoryResponse>;
    /**
     * Request withdrawal
     */
    withdrawal(params: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IAckResponse>;
    /**
     * Get withdrawal history
     */
    getWithdrawalHistory(params?: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiWithdrawalHistoryResponse>;
    /**
     * Get all initial leverage
     */
    getAllInitialLeverage(params?: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiGetAllInitialLeverageResponse>;
    /**
     * Set initial leverage
     */
    setInitialLeverage(params: any, config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiSetInitialLeverageResponse>;
    /**
     * Get margin tiers
     */
    getMarginTiers(config?: AxiosRequestConfig): Promise<import("@grvt/client/interfaces").IApiGetMarginTiersResponse>;
    /**
     * Extract session cookie from axios response
     */
    private extractSessionCookieFromResponse;
    /**
     * Get current session cookie
     */
    getSessionCookie(): string | undefined;
    /**
     * Set session cookie manually
     */
    setSessionCookie(cookie: string): void;
    /**
     * Check if we have a valid session
     */
    hasSession(): boolean;
    /**
     * Clear session cookie
     */
    clearSession(): void;
}
//# sourceMappingURL=GRVTSDKWrapper.d.ts.map