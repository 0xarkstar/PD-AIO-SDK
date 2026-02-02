/**
 * EdgeX Normalizer
 *
 * Transforms EdgeX-specific data structures to unified SDK format
 */
import type { Market, Order, Position, Balance, OrderBook, Trade, Ticker, FundingRate } from '../../types/common.js';
import type { EdgeXOrder, EdgeXPosition, EdgeXBalance, EdgeXTrade } from './types.js';
export declare class EdgeXNormalizer {
    private symbolToContractId;
    private contractIdToSymbol;
    /**
     * Initialize mapping from market data
     */
    initializeMappings(contracts: any[]): void;
    /**
     * Normalize EdgeX symbol to unified format
     *
     * Handles multiple formats:
     * - New API format: 'BTCUSD', 'ETHUSD' → 'BTC/USD:USD'
     * - Legacy format: 'BTC-USDC-PERP' → 'BTC/USDC:USDC'
     */
    normalizeSymbol(edgexSymbol: string): string;
    /**
     * Convert unified symbol to EdgeX format
     *
     * Supports both formats:
     * - New API: 'BTC/USD:USD' → 'BTCUSD'
     * - Legacy: 'BTC/USDC:USDC' → 'BTC-USDC-PERP'
     */
    toEdgeXSymbol(symbol: string): string;
    /**
     * Convert unified symbol to EdgeX contractId
     *
     * @example
     * toEdgeXContractId('BTC/USD:USD') // '10000001'
     */
    toEdgeXContractId(symbol: string): string;
    /**
     * Normalize EdgeX market to unified format
     * Handles both old test format and new API format
     */
    normalizeMarket(contract: any): Market;
    /**
     * Normalize EdgeX order to unified format
     */
    normalizeOrder(edgexOrder: EdgeXOrder): Order;
    /**
     * Normalize EdgeX position to unified format
     */
    normalizePosition(edgexPosition: EdgeXPosition): Position;
    /**
     * Normalize EdgeX balance to unified format
     */
    normalizeBalance(edgexBalance: EdgeXBalance): Balance;
    /**
     * Normalize EdgeX order book to unified format
     * Handles new API format from /api/v1/public/quote/getDepth
     */
    normalizeOrderBook(depthData: any, symbol: string): OrderBook;
    /**
     * Normalize EdgeX trade to unified format
     */
    normalizeTrade(edgexTrade: EdgeXTrade): Trade;
    /**
     * Normalize EdgeX ticker to unified format
     * Handles new API format from /api/v1/public/quote/getTicker
     */
    normalizeTicker(tickerData: any): Ticker;
    /**
     * Normalize EdgeX funding rate to unified format
     * Handles new API format from /api/v1/public/funding/getLatestFundingRate
     */
    normalizeFundingRate(fundingData: any, symbol: string): FundingRate;
    /**
     * Normalize EdgeX order type to unified format
     */
    private normalizeOrderType;
    /**
     * Normalize EdgeX order side to unified format
     */
    private normalizeOrderSide;
    /**
     * Normalize EdgeX order status to unified format
     */
    private normalizeOrderStatus;
    /**
     * Normalize EdgeX time in force to unified format
     */
    private normalizeTimeInForce;
    /**
     * Count decimal places in a string number
     */
    private countDecimals;
}
//# sourceMappingURL=EdgeXNormalizer.d.ts.map