/**
 * Hyperliquid Account Helper Functions
 *
 * Extracted from HyperliquidAdapter to reduce file size.
 * Contains order history, trade history, and open order parsing.
 */
import type { Order, Trade } from '../../types/index.js';
import type { HyperliquidNormalizer } from './HyperliquidNormalizer.js';
import type { HyperliquidHistoricalOrder, HyperliquidOpenOrder, HyperliquidUserFill } from './types.js';
/**
 * Filter, sort, and limit order history
 */
export declare function processOrderHistory(response: HyperliquidHistoricalOrder[], normalizer: HyperliquidNormalizer, symbol?: string, since?: number, limit?: number): Order[];
/**
 * Filter, sort, and limit user trade history
 */
export declare function processUserFills(response: HyperliquidUserFill[], normalizer: HyperliquidNormalizer, symbol?: string, since?: number, limit?: number): Trade[];
/**
 * Process and filter open orders
 */
export declare function processOpenOrders(response: HyperliquidOpenOrder[], normalizer: HyperliquidNormalizer, symbol?: string): Order[];
//# sourceMappingURL=HyperliquidAccount.d.ts.map