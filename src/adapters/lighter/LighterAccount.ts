/**
 * Lighter Account Helper Functions
 *
 * Extracted from LighterAdapter to reduce file size.
 * Contains account data fetching (positions, balance, orders, trades).
 */

import type { Order, Position, Balance, Trade } from '../../types/common.js';
import { PerpDEXError } from '../../types/errors.js';
import type { LighterNormalizer } from './LighterNormalizer.js';
import type { LighterOrder, LighterPosition, LighterBalance, LighterTrade } from './types.js';
import { mapError } from './utils.js';

/** Dependencies injected from the adapter */
export interface AccountDeps {
  normalizer: LighterNormalizer;
  request: <T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: Record<string, unknown>) => Promise<T>;
}

/**
 * Fetch positions
 */
export async function fetchPositionsData(
  deps: AccountDeps,
  symbols?: string[]
): Promise<Position[]> {
  try {
    const response = await deps.request<LighterPosition[]>('GET', '/account/positions');

    if (!Array.isArray(response)) {
      throw new PerpDEXError('Invalid positions response', 'INVALID_RESPONSE', 'lighter');
    }

    let positions = response.map((position: any) => deps.normalizer.normalizePosition(position));

    // Filter by symbols if provided
    if (symbols && symbols.length > 0) {
      positions = positions.filter(p => symbols.includes(p.symbol));
    }

    return positions;
  } catch (error) {
    throw mapError(error);
  }
}

/**
 * Fetch balance
 */
export async function fetchBalanceData(deps: AccountDeps): Promise<Balance[]> {
  try {
    const response = await deps.request<LighterBalance[]>('GET', '/account/balance');

    if (!Array.isArray(response)) {
      throw new PerpDEXError('Invalid balance response', 'INVALID_RESPONSE', 'lighter');
    }

    return response.map((balance: any) => deps.normalizer.normalizeBalance(balance));
  } catch (error) {
    throw mapError(error);
  }
}

/**
 * Fetch open orders
 */
export async function fetchOpenOrdersData(
  deps: AccountDeps,
  symbol?: string
): Promise<Order[]> {
  try {
    const path = symbol ? `/orders?symbol=${deps.normalizer.toLighterSymbol(symbol)}` : '/orders';
    const response = await deps.request<LighterOrder[]>('GET', path);

    if (!Array.isArray(response)) {
      throw new PerpDEXError('Invalid open orders response', 'INVALID_RESPONSE', 'lighter');
    }

    return response.map((order: any) => deps.normalizer.normalizeOrder(order));
  } catch (error) {
    throw mapError(error);
  }
}

/**
 * Fetch order history
 */
export async function fetchOrderHistoryData(
  deps: AccountDeps,
  symbol?: string,
  since?: number,
  limit?: number
): Promise<Order[]> {
  try {
    const params = new URLSearchParams();
    if (symbol) params.append('symbol', deps.normalizer.toLighterSymbol(symbol));
    if (since) params.append('startTime', since.toString());
    if (limit) params.append('limit', limit.toString());

    const queryString = params.toString();
    const response = await deps.request<LighterOrder[]>(
      'GET',
      `/account/inactiveOrders${queryString ? `?${queryString}` : ''}`
    );

    if (!Array.isArray(response)) {
      throw new PerpDEXError('Invalid order history response', 'INVALID_RESPONSE', 'lighter');
    }

    return response.map((order: any) => deps.normalizer.normalizeOrder(order));
  } catch (error) {
    throw mapError(error);
  }
}

/**
 * Fetch user trade history
 */
export async function fetchMyTradesData(
  deps: AccountDeps,
  symbol?: string,
  since?: number,
  limit?: number
): Promise<Trade[]> {
  try {
    const params = new URLSearchParams();
    if (symbol) params.append('symbol', deps.normalizer.toLighterSymbol(symbol));
    if (since) params.append('startTime', since.toString());
    if (limit) params.append('limit', limit.toString());

    const queryString = params.toString();
    const response = await deps.request<LighterTrade[]>(
      'GET',
      `/account/fills${queryString ? `?${queryString}` : ''}`
    );

    if (!Array.isArray(response)) {
      throw new PerpDEXError('Invalid trade history response', 'INVALID_RESPONSE', 'lighter');
    }

    return response.map((trade: any) => deps.normalizer.normalizeTrade(trade));
  } catch (error) {
    throw mapError(error);
  }
}
