/**
 * Pacifica Exchange-Specific Types
 */
import type { ExchangeConfig } from '../../types/adapter.js';
export interface PacificaConfig extends ExchangeConfig {
    apiKey?: string;
    apiSecret?: string;
    testnet?: boolean;
    timeout?: number;
    builderCode?: string;
    maxBuilderFeeRate?: number;
}
export interface PacificaMarket {
    symbol: string;
    base_currency: string;
    quote_currency: string;
    status: string;
    price_step: string;
    size_step: string;
    min_size: string;
    max_leverage: number;
    maker_fee: string;
    taker_fee: string;
    funding_interval: number;
}
export interface PacificaTicker {
    symbol: string;
    last_price: string;
    mark_price: string;
    index_price: string;
    bid_price: string;
    ask_price: string;
    high_24h: string;
    low_24h: string;
    volume_24h: string;
    quote_volume_24h: string;
    open_interest: string;
    funding_rate: string;
    next_funding_time: number;
    timestamp: number;
}
export interface PacificaOrderBookLevel {
    price: string;
    size: string;
}
export interface PacificaOrderBook {
    bids: PacificaOrderBookLevel[];
    asks: PacificaOrderBookLevel[];
    timestamp: number;
    sequence: number;
}
export interface PacificaTradeResponse {
    id: string;
    symbol: string;
    price: string;
    size: string;
    side: 'buy' | 'sell';
    timestamp: number;
}
export interface PacificaFundingHistory {
    symbol: string;
    funding_rate: string;
    mark_price: string;
    index_price: string;
    timestamp: number;
}
export interface PacificaOrderResponse {
    order_id: string;
    client_order_id?: string;
    symbol: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    price?: string;
    size: string;
    filled_size: string;
    avg_fill_price?: string;
    status: 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected';
    reduce_only: boolean;
    post_only: boolean;
    created_at: number;
    updated_at: number;
}
export interface PacificaPosition {
    symbol: string;
    side: 'long' | 'short';
    size: string;
    entry_price: string;
    mark_price: string;
    liquidation_price: string;
    unrealized_pnl: string;
    realized_pnl: string;
    leverage: number;
    margin_mode: 'cross' | 'isolated';
    margin: string;
    maintenance_margin: string;
    timestamp: number;
}
export interface PacificaAccountInfo {
    total_equity: string;
    available_balance: string;
    used_margin: string;
    unrealized_pnl: string;
    currency: string;
}
export interface PacificaBuilderCodeRequest {
    type: 'approve_builder_code';
    builder_code: string;
    max_fee_rate: number;
}
//# sourceMappingURL=types.d.ts.map