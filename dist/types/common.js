/**
 * Common Types for Perp DEX SDK
 *
 * Unified type definitions across all supported exchanges
 */
// =============================================================================
// Order Types
// =============================================================================
export const ORDER_TYPES = ['market', 'limit', 'stopMarket', 'stopLimit', 'takeProfit', 'trailingStop'];
export const ORDER_SIDES = ['buy', 'sell'];
export const ORDER_STATUSES = [
    'open',
    'closed',
    'canceled',
    'expired',
    'rejected',
    'filled',
    'partiallyFilled',
];
export const TIME_IN_FORCE = ['GTC', 'IOC', 'FOK', 'PO'];
// =============================================================================
// Position Types
// =============================================================================
export const POSITION_SIDES = ['long', 'short'];
export const MARGIN_MODES = ['cross', 'isolated'];
// =============================================================================
// Transaction Types (Deposits/Withdrawals)
// =============================================================================
export const TRANSACTION_TYPES = ['deposit', 'withdrawal'];
export const TRANSACTION_STATUSES = ['pending', 'processing', 'completed', 'failed', 'canceled'];
// =============================================================================
// OHLCV (Candlestick) Types
// =============================================================================
/**
 * Timeframe for OHLCV data
 */
export const OHLCV_TIMEFRAMES = [
    '1m', '3m', '5m', '15m', '30m',
    '1h', '2h', '4h', '6h', '8h', '12h',
    '1d', '3d', '1w', '1M'
];
// =============================================================================
// Ledger Types (CCXT-compatible)
// =============================================================================
export const LEDGER_ENTRY_TYPES = [
    'trade',
    'fee',
    'deposit',
    'withdrawal',
    'transfer',
    'funding',
    'margin',
    'rebate',
    'cashback',
    'referral',
    'other',
];
// =============================================================================
// Exchange Status Types (CCXT-compatible)
// =============================================================================
export const EXCHANGE_STATUS_VALUES = ['ok', 'maintenance', 'error', 'unknown'];
//# sourceMappingURL=common.js.map