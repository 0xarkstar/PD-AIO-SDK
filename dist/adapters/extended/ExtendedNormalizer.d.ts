/**
 * Extended Normalizer
 *
 * Data transformation layer for Extended exchange
 * Converts Extended-specific formats to unified SDK format
 */
import type { Market, Order, Position, Balance, OrderBook, Trade, Ticker, FundingRate } from '../../types/common.js';
import type { ExtendedMarketRaw, ExtendedOrder, ExtendedPosition, ExtendedBalance, ExtendedOrderBook, ExtendedTrade, ExtendedTicker, ExtendedFundingRate } from './types.js';
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
     * "BTC/USD:USD" → "BTC-USD"
     */
    symbolFromCCXT(ccxtSymbol: string): string;
    /**
     * Normalize market data
     *
     * Handles both legacy SDK type format and actual API response format:
     * - API returns: {name, assetName, collateralAssetName, tradingConfig, active, ...}
     * - Legacy type: {symbol, marketId, baseAsset, quoteAsset, ...}
     */
    normalizeMarket(market: ExtendedMarketRaw): Market;
    /**
     * Normalize ticker data
     *
     * Handles both legacy SDK type and actual API response format:
     * - API returns: {lastPrice, bidPrice, askPrice, dailyHigh, dailyLow, dailyVolume, dailyPriceChange, ...}
     * - Legacy type: {lastPrice, bidPrice, askPrice, high24h, low24h, volume24h, priceChange24h, ...}
     */
    normalizeTicker(ticker: ExtendedTicker): Ticker;
    /**
     * Normalize order book data
     *
     * Handles both legacy SDK type and actual API response format:
     * - API returns: {market, bid: [{qty, price}], ask: [{qty, price}]}
     * - Legacy type: {symbol, bids: [[price, size]], asks: [[price, size]]}
     */
    normalizeOrderBook(orderbook: ExtendedOrderBook): OrderBook;
    /**
     * Normalize trade data
     *
     * Handles both legacy SDK type and actual API response format:
     * - API returns: {i (id), m (market), S (side), tT (tradeType), T (timestamp), p (price), q (qty)}
     * - Legacy type: {id, symbol, side, price, quantity, timestamp}
     */
    normalizeTrade(trade: ExtendedTrade): Trade;
    /**
     * Normalize funding rate data
     *
     * Handles both legacy SDK type and actual API response format:
     * - API returns: {m (market), f (fundingRate), T (timestamp)}
     * - Legacy type: {symbol, fundingRate, fundingTime, markPrice, indexPrice}
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
    normalizeMarkets(markets: ExtendedMarketRaw[]): Market[];
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