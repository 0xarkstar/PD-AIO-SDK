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
export function processOrderHistory(
  response: HyperliquidHistoricalOrder[],
  normalizer: HyperliquidNormalizer,
  symbol?: string,
  since?: number,
  limit?: number
): Order[] {
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
export function processUserFills(
  response: HyperliquidUserFill[],
  normalizer: HyperliquidNormalizer,
  symbol?: string,
  since?: number,
  limit?: number
): Trade[] {
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
export function processOpenOrders(
  response: HyperliquidOpenOrder[],
  normalizer: HyperliquidNormalizer,
  symbol?: string
): Order[] {
  const orders = response.map((order) => normalizer.normalizeOrder(order, order.coin));

  // Filter by symbol if provided
  if (symbol) {
    return orders.filter((o) => o.symbol === symbol);
  }

  return orders;
}
