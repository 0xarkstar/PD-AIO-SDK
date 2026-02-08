/**
 * Hyperliquid Account Helper Functions
 *
 * Extracted from HyperliquidAdapter to reduce file size.
 * Contains order history, trade history, and open order parsing.
 */
/**
 * Filter, sort, and limit order history
 */
export function processOrderHistory(response, normalizer, symbol, since, limit) {
    let orders = response.map((order) => normalizer.normalizeHistoricalOrder(order));
    // Filter by symbol if provided
    if (symbol) {
        orders = orders.filter((order) => order.symbol === symbol);
    }
    // Filter by since timestamp if provided
    if (since) {
        orders = orders.filter((order) => order.timestamp >= since);
    }
    // Sort by timestamp descending (newest first)
    orders.sort((a, b) => b.timestamp - a.timestamp);
    // Apply limit if provided
    if (limit) {
        orders = orders.slice(0, limit);
    }
    return orders;
}
/**
 * Filter, sort, and limit user trade history
 */
export function processUserFills(response, normalizer, symbol, since, limit) {
    let trades = response.map((fill) => normalizer.normalizeUserFill(fill));
    // Filter by symbol if provided
    if (symbol) {
        trades = trades.filter((trade) => trade.symbol === symbol);
    }
    // Filter by since timestamp if provided
    if (since) {
        trades = trades.filter((trade) => trade.timestamp >= since);
    }
    // Sort by timestamp descending (newest first)
    trades.sort((a, b) => b.timestamp - a.timestamp);
    // Apply limit if provided
    if (limit) {
        trades = trades.slice(0, limit);
    }
    return trades;
}
/**
 * Process and filter open orders
 */
export function processOpenOrders(response, normalizer, symbol) {
    const orders = response.map((order) => normalizer.normalizeOrder(order, order.coin));
    // Filter by symbol if provided
    if (symbol) {
        return orders.filter((o) => o.symbol === symbol);
    }
    return orders;
}
//# sourceMappingURL=HyperliquidAccount.js.map