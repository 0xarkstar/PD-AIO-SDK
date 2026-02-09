/**
 * Hyperliquid Info Method Helpers
 *
 * Extracted from HyperliquidAdapter to reduce file size.
 * Contains fetchUserFees, fetchPortfolio, and fetchRateLimitStatus logic.
 */

import { PerpDEXError } from '../../types/errors.js';
import type { UserFees, Portfolio, RateLimitStatus } from '../../types/common.js';
import type {
  HyperliquidUserFees,
  HyperliquidPortfolio,
  HyperliquidUserRateLimit,
} from './types.js';

/**
 * Parse user fees response into unified format
 */
export function parseUserFees(response: HyperliquidUserFees): UserFees {
  const makerFee = parseFloat(response.userAddRate);
  const takerFee = parseFloat(response.userCrossRate);

  return {
    maker: makerFee,
    taker: takerFee,
    info: response as unknown as Record<string, unknown>,
  };
}

/**
 * Parse portfolio response into unified format
 */
export function parsePortfolio(response: HyperliquidPortfolio): Portfolio {
  // Find the 'day' period data
  const dayPeriod = response.find(([period]) => period === 'day');
  if (!dayPeriod) {
    throw new PerpDEXError(
      'Day period data not found in portfolio response',
      'INVALID_RESPONSE',
      'hyperliquid'
    );
  }

  const [, dayData] = dayPeriod;

  // Extract latest values from history arrays
  const latestAccountValue =
    dayData.accountValueHistory.length > 0
      ? parseFloat(dayData.accountValueHistory[dayData.accountValueHistory.length - 1]![1])
      : 0;

  const latestDailyPnl =
    dayData.pnlHistory.length > 0
      ? parseFloat(dayData.pnlHistory[dayData.pnlHistory.length - 1]![1])
      : 0;

  // Find week and month periods for additional metrics
  const weekPeriod = response.find(([period]) => period === 'week');
  const monthPeriod = response.find(([period]) => period === 'month');

  const weeklyPnl =
    weekPeriod && weekPeriod[1].pnlHistory.length > 0
      ? parseFloat(weekPeriod[1].pnlHistory[weekPeriod[1].pnlHistory.length - 1]![1])
      : 0;

  const monthlyPnl =
    monthPeriod && monthPeriod[1].pnlHistory.length > 0
      ? parseFloat(monthPeriod[1].pnlHistory[monthPeriod[1].pnlHistory.length - 1]![1])
      : 0;

  // Calculate percentage changes (use account value as base)
  const dailyPnlPercentage =
    latestAccountValue > 0 ? (latestDailyPnl / latestAccountValue) * 100 : 0;
  const weeklyPnlPercentage = latestAccountValue > 0 ? (weeklyPnl / latestAccountValue) * 100 : 0;
  const monthlyPnlPercentage = latestAccountValue > 0 ? (monthlyPnl / latestAccountValue) * 100 : 0;

  return {
    totalValue: latestAccountValue,
    dailyPnl: latestDailyPnl,
    dailyPnlPercentage,
    weeklyPnl,
    weeklyPnlPercentage,
    monthlyPnl,
    monthlyPnlPercentage,
    timestamp: Date.now(),
    info: response as unknown as Record<string, unknown>,
  };
}

/**
 * Parse rate limit status response into unified format
 */
export function parseRateLimitStatus(response: HyperliquidUserRateLimit): RateLimitStatus {
  const used = response.nRequestsUsed;
  const cap = response.nRequestsCap;

  // Hyperliquid uses a 60-second rolling window
  const windowMs = 60000;

  return {
    remaining: cap - used,
    limit: cap,
    resetAt: Date.now() + windowMs,
    percentUsed: cap > 0 ? (used / cap) * 100 : 0,
    info: response as unknown as Record<string, unknown>,
  };
}
