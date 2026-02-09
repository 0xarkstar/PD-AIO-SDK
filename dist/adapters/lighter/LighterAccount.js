/**
 * Lighter Account Helper Functions
 *
 * Extracted from LighterAdapter to reduce file size.
 * Contains account data fetching (positions, balance, orders, trades).
 */
import { PerpDEXError } from '../../types/errors.js';
import { mapError } from './utils.js';
/**
 * Fetch positions
 */
export async function fetchPositionsData(deps, symbols) {
    try {
        const response = await deps.request('GET', '/api/v1/account');
        if (!Array.isArray(response)) {
            throw new PerpDEXError('Invalid positions response', 'INVALID_RESPONSE', 'lighter');
        }
        let positions = response.map((position) => deps.normalizer.normalizePosition(position));
        // Filter by symbols if provided
        if (symbols && symbols.length > 0) {
            positions = positions.filter(p => symbols.includes(p.symbol));
        }
        return positions;
    }
    catch (error) {
        throw mapError(error);
    }
}
/**
 * Fetch balance
 */
export async function fetchBalanceData(deps) {
    try {
        const response = await deps.request('GET', '/api/v1/account');
        if (!Array.isArray(response)) {
            throw new PerpDEXError('Invalid balance response', 'INVALID_RESPONSE', 'lighter');
        }
        return response.map((balance) => deps.normalizer.normalizeBalance(balance));
    }
    catch (error) {
        throw mapError(error);
    }
}
/**
 * Fetch open orders
 */
export async function fetchOpenOrdersData(deps, symbol) {
    try {
        const path = symbol ? `/api/v1/accountActiveOrders?symbol=${deps.normalizer.toLighterSymbol(symbol)}` : '/api/v1/accountActiveOrders';
        const response = await deps.request('GET', path);
        if (!Array.isArray(response)) {
            throw new PerpDEXError('Invalid open orders response', 'INVALID_RESPONSE', 'lighter');
        }
        return response.map((order) => deps.normalizer.normalizeOrder(order));
    }
    catch (error) {
        throw mapError(error);
    }
}
/**
 * Fetch order history
 */
export async function fetchOrderHistoryData(deps, symbol, since, limit) {
    try {
        const params = new URLSearchParams();
        if (symbol)
            params.append('symbol', deps.normalizer.toLighterSymbol(symbol));
        if (since)
            params.append('startTime', since.toString());
        if (limit)
            params.append('limit', limit.toString());
        const queryString = params.toString();
        const response = await deps.request('GET', `/api/v1/accountInactiveOrders${queryString ? `?${queryString}` : ''}`);
        if (!Array.isArray(response)) {
            throw new PerpDEXError('Invalid order history response', 'INVALID_RESPONSE', 'lighter');
        }
        return response.map((order) => deps.normalizer.normalizeOrder(order));
    }
    catch (error) {
        throw mapError(error);
    }
}
/**
 * Fetch user trade history
 */
export async function fetchMyTradesData(deps, symbol, since, limit) {
    try {
        const params = new URLSearchParams();
        if (symbol)
            params.append('symbol', deps.normalizer.toLighterSymbol(symbol));
        if (since)
            params.append('startTime', since.toString());
        if (limit)
            params.append('limit', limit.toString());
        const queryString = params.toString();
        const response = await deps.request('GET', `/api/v1/accountFills${queryString ? `?${queryString}` : ''}`);
        if (!Array.isArray(response)) {
            throw new PerpDEXError('Invalid trade history response', 'INVALID_RESPONSE', 'lighter');
        }
        return response.map((trade) => deps.normalizer.normalizeTrade(trade));
    }
    catch (error) {
        throw mapError(error);
    }
}
//# sourceMappingURL=LighterAccount.js.map