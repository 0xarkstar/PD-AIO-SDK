/**
 * Hyperliquid Info Method Helpers
 *
 * Extracted from HyperliquidAdapter to reduce file size.
 * Contains fetchUserFees, fetchPortfolio, and fetchRateLimitStatus logic.
 */
import type { UserFees, Portfolio, RateLimitStatus } from '../../types/common.js';
import type { HyperliquidUserFees, HyperliquidPortfolio, HyperliquidUserRateLimit } from './types.js';
/**
 * Parse user fees response into unified format
 */
export declare function parseUserFees(response: HyperliquidUserFees): UserFees;
/**
 * Parse portfolio response into unified format
 */
export declare function parsePortfolio(response: HyperliquidPortfolio): Portfolio;
/**
 * Parse rate limit status response into unified format
 */
export declare function parseRateLimitStatus(response: HyperliquidUserRateLimit): RateLimitStatus;
//# sourceMappingURL=HyperliquidInfoMethods.d.ts.map