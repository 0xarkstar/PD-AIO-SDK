/**
 * Variational Normalizer
 *
 * Data transformation layer for Variational exchange
 * Converts Variational-specific formats to unified SDK format
 */
import type { Market, Order, Position, Balance, OrderBook, Trade, Ticker, FundingRate } from '../../types/common.js';
import type { VariationalMarket, VariationalOrder, VariationalPosition, VariationalBalance, VariationalOrderBook, VariationalTrade, VariationalTicker, VariationalFundingRate, VariationalQuote, VariationalListing } from './types.js';
export declare class VariationalNormalizer {
    /**
     * Convert Variational symbol to unified CCXT format
     * "BTC-USDT-PERP" → "BTC/USDT:USDT"
     */
    symbolToCCXT(variationalSymbol: string): string;
    /**
     * Convert unified CCXT symbol to Variational format
     * "BTC/USDT:USDT" → "BTC-USDT-PERP"
     */
    symbolFromCCXT(ccxtSymbol: string): string;
    /**
     * Normalize market data from listing (from /metadata/stats)
     */
    normalizeMarketFromListing(listing: VariationalListing): Market;
    /**
     * Normalize market data
     */
    normalizeMarket(market: VariationalMarket): Market;
    /**
     * Normalize ticker data from listing (from /metadata/stats)
     */
    normalizeTickerFromListing(listing: VariationalListing): Ticker;
    /**
     * Normalize ticker data
     */
    normalizeTicker(ticker: VariationalTicker): Ticker;
    /**
     * Normalize order book data
     */
    normalizeOrderBook(orderbook: VariationalOrderBook): OrderBook;
    /**
     * Normalize trade data
     */
    normalizeTrade(trade: VariationalTrade): Trade;
    /**
     * Normalize funding rate data
     */
    normalizeFundingRate(fundingRate: VariationalFundingRate): FundingRate;
    /**
     * Normalize order data
     */
    normalizeOrder(order: VariationalOrder): Order;
    /**
     * Normalize order status
     */
    private normalizeOrderStatus;
    /**
     * Normalize position data
     */
    normalizePosition(position: VariationalPosition): Position;
    /**
     * Normalize balance data
     */
    normalizeBalance(balance: VariationalBalance): Balance;
    /**
     * Normalize RFQ quote data (Variational-specific)
     * This is not part of the standard unified format, but useful for RFQ trading
     */
    normalizeQuote(quote: VariationalQuote): {
        id: string;
        symbol: string;
        side: 'buy' | 'sell';
        price: number;
        amount: number;
        expiresAt: number;
        marketMaker: string;
        spread?: number;
        timestamp: number;
    };
    /**
     * Batch normalize markets
     */
    normalizeMarkets(markets: VariationalMarket[]): Market[];
    /**
     * Batch normalize orders
     */
    normalizeOrders(orders: VariationalOrder[]): Order[];
    /**
     * Batch normalize positions
     */
    normalizePositions(positions: VariationalPosition[]): Position[];
    /**
     * Batch normalize balances
     */
    normalizeBalances(balances: VariationalBalance[]): Balance[];
    /**
     * Batch normalize trades
     */
    normalizeTrades(trades: VariationalTrade[]): Trade[];
    /**
     * Batch normalize markets from listings (metadata/stats response)
     */
    normalizeMarketsFromListings(listings: VariationalListing[]): Market[];
    /**
     * Batch normalize tickers from listings (metadata/stats response)
     */
    normalizeTickersFromListings(listings: VariationalListing[]): Ticker[];
    /**
     * Normalize funding rate from listing (from /metadata/stats)
     */
    normalizeFundingRateFromListing(listing: VariationalListing): FundingRate;
    /**
     * Normalize order book from listing quotes (from /metadata/stats)
     *
     * Since Variational is an RFQ-based DEX, we construct an order book
     * from the quotes at different notional sizes.
     */
    normalizeOrderBookFromListing(listing: VariationalListing): OrderBook;
}
//# sourceMappingURL=VariationalNormalizer.d.ts.map