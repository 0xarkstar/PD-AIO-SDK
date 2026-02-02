/**
 * Paradex-specific type definitions
 */
/**
 * Paradex adapter configuration
 */
export interface ParadexConfig {
    apiKey?: string;
    apiSecret?: string;
    privateKey?: string;
    starkPrivateKey?: string;
    testnet?: boolean;
    rateLimitTier?: 'default' | 'premium';
}
/**
 * Paradex authentication configuration (alias for compatibility)
 */
export type ParadexAuthConfig = ParadexConfig;
/**
 * Paradex market response
 */
export interface ParadexMarket {
    symbol: string;
    base_currency: string;
    quote_currency: string;
    settlement_currency: string;
    status: string;
    min_order_size: string;
    max_order_size: string;
    tick_size: string;
    step_size: string;
    maker_fee_rate: string;
    taker_fee_rate: string;
    max_leverage: string;
    is_active: boolean;
}
/**
 * Paradex order response
 */
export interface ParadexOrder {
    id: string;
    client_id?: string;
    market: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT' | 'LIMIT_MAKER';
    size: string;
    price?: string;
    filled_size: string;
    avg_fill_price?: string;
    status: 'PENDING' | 'OPEN' | 'PARTIAL' | 'FILLED' | 'CANCELLED' | 'REJECTED';
    time_in_force: 'GTC' | 'IOC' | 'FOK' | 'POST_ONLY';
    post_only: boolean;
    reduce_only: boolean;
    created_at: number;
    updated_at: number;
}
/**
 * Paradex position response
 */
export interface ParadexPosition {
    market: string;
    side: 'LONG' | 'SHORT';
    size: string;
    entry_price: string;
    mark_price: string;
    liquidation_price?: string;
    unrealized_pnl: string;
    realized_pnl: string;
    margin: string;
    leverage: string;
    last_updated: number;
}
/**
 * Paradex balance response
 */
export interface ParadexBalance {
    asset: string;
    total: string;
    available: string;
    locked: string;
}
/**
 * Paradex order book response
 */
export interface ParadexOrderBook {
    market: string;
    bids: [string, string][];
    asks: [string, string][];
    timestamp: number;
    sequence: number;
}
/**
 * Paradex trade response
 */
export interface ParadexTrade {
    id: string;
    market: string;
    side: 'BUY' | 'SELL';
    price: string;
    size: string;
    timestamp: number;
}
/**
 * Paradex ticker response
 */
export interface ParadexTicker {
    market: string;
    last_price: string;
    bid: string;
    ask: string;
    high_24h: string;
    low_24h: string;
    volume_24h: string;
    price_change_24h: string;
    price_change_percent_24h: string;
    timestamp: number;
}
/**
 * Paradex funding rate response
 */
export interface ParadexFundingRate {
    market: string;
    rate: string;
    timestamp: number;
    next_funding_time: number;
    mark_price: string;
    index_price: string;
}
/**
 * Paradex JWT token response
 */
export interface ParadexJWT {
    access_token: string;
    token_type: string;
    expires_in: number;
}
/**
 * Paradex order sign payload
 */
export interface ParadexOrderSignPayload {
    market: string;
    side: 'BUY' | 'SELL';
    order_type: string;
    size: string;
    price: string;
    time_in_force: string;
    reduce_only: boolean;
    post_only: boolean;
    client_id?: string;
    expiry: number;
}
//# sourceMappingURL=types.d.ts.map