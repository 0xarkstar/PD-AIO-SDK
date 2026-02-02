/**
 * Extended Normalizer
 *
 * Data transformation layer for Extended exchange
 * Converts Extended-specific formats to unified SDK format
 */
import type { Market, Order, Position, Balance, OrderBook, Trade, Ticker, FundingRate } from '../../types/common.js';
import type { ExtendedMarket, ExtendedOrder, ExtendedPosition, ExtendedBalance, ExtendedOrderBook, ExtendedTrade, ExtendedTicker, ExtendedFundingRate } from './types.js';
export declare class ExtendedNormalizer {
    /**
     * Convert Extended symbol to unified CCXT format
     * Handles multiple Extended formats:
     * "BTC-USD-PERP" → "BTC/USD:USD"
     * "BTCUSD" → "BTC/USD:USD"
     */
    symbolToCCXT(extendedSymbol: string): string;
    /**
     * Convert unified CCXT symbol to Extended format
     * "BTC/USD:USD" → "BTC-USD-PERP"
     */
    symbolFromCCXT(ccxtSymbol: string): string;
    /**
     * Normalize market data
     */
    normalizeMarket(market: ExtendedMarket): Market;
    /**
     * Normalize ticker data
     */
    normalizeTicker(ticker: ExtendedTicker): Ticker;
    /**
     * Normalize order book data
     */
    normalizeOrderBook(orderbook: ExtendedOrderBook): OrderBook;
    /**
     * Normalize trade data
     */
    normalizeTrade(trade: ExtendedTrade): Trade;
    /**
     * Normalize funding rate data
     */
    normalizeFundingRate(fundingRate: ExtendedFundingRate): FundingRate;
    /**
     * Normalize order data
     */
    normalizeOrder(order: ExtendedOrder): Order;
    /**
     * Normalize order type
     */
    private normalizeOrderType;
    /**
     * Normalize order status
     */
    private normalizeOrderStatus;
    /**
     * Normalize position data
     */
    normalizePosition(position: ExtendedPosition): Position;
    /**
     * Normalize balance data
     */
    normalizeBalance(balance: ExtendedBalance): Balance;
    /**
     * Batch normalize markets
     */
    normalizeMarkets(markets: ExtendedMarket[]): Market[];
    /**
     * Batch normalize orders
     */
    normalizeOrders(orders: ExtendedOrder[]): Order[];
    /**
     * Batch normalize positions
     */
    normalizePositions(positions: ExtendedPosition[]): Position[];
    /**
     * Batch normalize balances
     */
    normalizeBalances(balances: ExtendedBalance[]): Balance[];
    /**
     * Batch normalize trades
     */
    normalizeTrades(trades: ExtendedTrade[]): Trade[];
    /**
     * Batch normalize funding rates
     */
    normalizeFundingRates(rates: ExtendedFundingRate[]): FundingRate[];
}
//# sourceMappingURL=ExtendedNormalizer.d.ts.map