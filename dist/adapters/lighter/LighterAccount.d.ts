/**
 * Lighter Account Helper Functions
 *
 * Extracted from LighterAdapter to reduce file size.
 * Contains account data fetching (positions, balance, orders, trades).
 */
import type { Order, Position, Balance, Trade } from '../../types/common.js';
import type { LighterNormalizer } from './LighterNormalizer.js';
/** Dependencies injected from the adapter */
export interface AccountDeps {
    normalizer: LighterNormalizer;
    request: <T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: Record<string, unknown>) => Promise<T>;
}
/**
 * Fetch positions
 */
export declare function fetchPositionsData(deps: AccountDeps, symbols?: string[]): Promise<Position[]>;
/**
 * Fetch balance
 */
export declare function fetchBalanceData(deps: AccountDeps): Promise<Balance[]>;
/**
 * Fetch open orders
 */
export declare function fetchOpenOrdersData(deps: AccountDeps, symbol?: string): Promise<Order[]>;
/**
 * Fetch order history
 */
export declare function fetchOrderHistoryData(deps: AccountDeps, symbol?: string, since?: number, limit?: number): Promise<Order[]>;
/**
 * Fetch user trade history
 */
export declare function fetchMyTradesData(deps: AccountDeps, symbol?: string, since?: number, limit?: number): Promise<Trade[]>;
//# sourceMappingURL=LighterAccount.d.ts.map