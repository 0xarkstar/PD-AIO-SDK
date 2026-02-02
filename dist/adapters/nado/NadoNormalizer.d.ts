/**
 * Nado Data Normalizer
 *
 * Transforms Nado API responses to unified SDK format with precision safety,
 * batch processing optimization, and comprehensive validation.
 *
 * @see https://docs.nado.xyz
 */
import type { NadoProduct, NadoSymbol, NadoOrder, NadoPosition, NadoBalance, NadoTrade, NadoTicker, NadoOrderBook, ProductMapping } from './types.js';
import type { Market, Order, Position, Balance, Trade, Ticker, OrderBook } from '../../types/common.js';
/**
 * Nado Data Normalizer
 *
 * Provides data transformation between Nado and unified formats with:
 * - Precision-safe numeric conversions
 * - Batch processing optimization
 * - Runtime validation with Zod
 * - Symbol format conversions
 *
 * @example
 * ```typescript
 * const normalizer = new NadoNormalizer();
 *
 * // Single entity
 * const market = normalizer.normalizeProduct(nadoProduct);
 *
 * // Batch processing
 * const orders = normalizer.normalizeOrders(nadoOrders, mappings);
 * ```
 */
export declare class NadoNormalizer {
    /**
     * Convert Nado symbol to CCXT format
     *
     * @param nadoSymbol - Nado symbol (e.g., "BTC-PERP", "BTC-USDT")
     * @param quoteAsset - Quote asset (default: USDT)
     * @returns CCXT formatted symbol (e.g., "BTC/USDT:USDT")
     *
     * @example
     * ```typescript
     * normalizer.symbolToCCXT('BTC-PERP');        // "BTC/USDT:USDT"
     * normalizer.symbolToCCXT('ETH-PERP');        // "ETH/USDT:USDT"
     * normalizer.symbolToCCXT('BTC-USDC', 'USDC'); // "BTC/USDC"
     * ```
     */
    symbolToCCXT(nadoSymbol: string, quoteAsset?: string): string;
    /**
     * Convert CCXT symbol to Nado format
     *
     * @param ccxtSymbol - CCXT formatted symbol (e.g., "BTC/USDT:USDT")
     * @returns Nado symbol (e.g., "BTC-PERP")
     *
     * @example
     * ```typescript
     * normalizer.symbolFromCCXT('BTC/USDT:USDT'); // "BTC-PERP"
     * normalizer.symbolFromCCXT('ETH/USDT:USDT'); // "ETH-PERP"
     * normalizer.symbolFromCCXT('BTC/USDC');      // "BTC-USDC"
     * ```
     */
    symbolFromCCXT(ccxtSymbol: string): string;
    /**
     * Convert number to x18 format (18 decimals) with validation
     *
     * @param value - Number or string to convert
     * @returns x18 formatted string
     *
     * @throws {PerpDEXError} If value is not finite
     */
    private toX18Safe;
    /**
     * Convert from x18 format to number with precision safety
     *
     * @param value - x18 formatted string
     * @returns Parsed number
     *
     * @throws {PerpDEXError} If value is invalid or results in NaN
     */
    private fromX18Safe;
    /**
     * Normalize Nado symbol (from /query?type=symbols) to unified Market format
     *
     * @param symbolData - Nado symbol data from symbols endpoint
     * @returns Normalized market
     */
    normalizeSymbol(symbolData: NadoSymbol): Market;
    /**
     * Calculate decimal precision from increment value
     */
    private getPrecisionFromIncrement;
    /**
     * Normalize Nado product to unified Market format
     *
     * @deprecated Use normalizeSymbol instead
     * @param product - Nado product data
     * @returns Normalized market
     */
    normalizeProduct(product: NadoProduct): Market;
    /**
     * Normalize Nado order to unified Order format
     *
     * @param order - Nado order data
     * @param productMapping - Product mapping for symbol resolution
     * @returns Normalized order
     */
    normalizeOrder(order: NadoOrder, productMapping: ProductMapping): Order;
    /**
     * Normalize Nado position to unified Position format
     *
     * @param position - Nado position data
     * @param productMapping - Product mapping for symbol resolution
     * @returns Normalized position or null if size is zero
     */
    normalizePosition(position: NadoPosition, productMapping: ProductMapping): Position | null;
    /**
     * Normalize Nado balance to unified Balance format
     *
     * @param balance - Nado balance data
     * @returns Array of normalized balances
     */
    normalizeBalance(balance: NadoBalance): Balance[];
    /**
     * Normalize Nado trade to unified Trade format
     *
     * @param trade - Nado trade data
     * @param productMapping - Product mapping for symbol resolution
     * @returns Normalized trade
     */
    normalizeTrade(trade: NadoTrade, productMapping: ProductMapping): Trade;
    /**
     * Normalize Nado ticker to unified Ticker format
     *
     * @param ticker - Nado ticker data (bid/ask from market_prices endpoint)
     * @param symbol - CCXT symbol (required since API doesn't return symbol)
     * @returns Normalized ticker
     */
    normalizeTicker(ticker: NadoTicker, symbol: string): Ticker;
    /**
     * Normalize Nado order book to unified OrderBook format
     *
     * @param orderBook - Nado order book data
     * @param symbol - CCXT formatted symbol
     * @returns Normalized order book
     */
    normalizeOrderBook(orderBook: NadoOrderBook, symbol: string): OrderBook;
    /**
     * Normalize multiple orders in batch
     *
     * More efficient than calling normalizeOrder() multiple times.
     * Filters out orders without valid product mappings.
     *
     * @param orders - Array of Nado orders
     * @param mappings - Map of product ID to ProductMapping
     * @returns Array of normalized orders
     *
     * @example
     * ```typescript
     * const orders = await apiClient.query('orders', {...});
     * const normalized = normalizer.normalizeOrders(orders, productMappings);
     * ```
     */
    normalizeOrders(orders: NadoOrder[], mappings: Map<string, ProductMapping>): Order[];
    /**
     * Normalize multiple positions in batch
     *
     * More efficient than calling normalizePosition() multiple times.
     * Filters out positions with zero size and invalid mappings.
     *
     * @param positions - Array of Nado positions
     * @param mappings - Map of product ID to ProductMapping
     * @returns Array of normalized positions
     *
     * @example
     * ```typescript
     * const positions = await apiClient.query('isolated_positions', {...});
     * const normalized = normalizer.normalizePositions(positions, productMappings);
     * ```
     */
    normalizePositions(positions: NadoPosition[], mappings: Map<string, ProductMapping>): Position[];
    /**
     * Normalize multiple trades in batch
     *
     * @param trades - Array of Nado trades
     * @param mappings - Map of product ID to ProductMapping
     * @returns Array of normalized trades
     */
    normalizeTrades(trades: NadoTrade[], mappings: Map<string, ProductMapping>): Trade[];
    /**
     * Map Nado order status to unified format
     *
     * @param status - Nado order status
     * @returns Unified order status
     */
    private mapOrderStatus;
}
//# sourceMappingURL=NadoNormalizer.d.ts.map