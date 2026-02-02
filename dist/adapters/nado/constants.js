/**
 * Nado Exchange Constants
 *
 * API endpoints, rate limits, and configuration constants for Nado DEX.
 * Nado is built on Ink L2 by Kraken team with 5-15ms latency.
 *
 * @see https://docs.nado.xyz
 */
/**
 * API Base URLs for Nado
 */
export const NADO_API_URLS = {
    mainnet: {
        rest: 'https://gateway.prod.nado.xyz/v1',
        ws: 'wss://gateway.prod.nado.xyz/v1/ws',
    },
    testnet: {
        rest: 'https://gateway.test.nado.xyz/v1',
        ws: 'wss://gateway.test.nado.xyz/v1/ws',
    },
};
/**
 * Nado Chain ID (Ink L2)
 */
export const NADO_CHAIN_ID = {
    mainnet: 57073, // Ink L2 mainnet
    testnet: 763373, // Ink L2 testnet (Sepolia)
};
/**
 * EIP712 Domain Configuration
 */
export const NADO_EIP712_DOMAIN = {
    name: 'Nado',
    version: '0.0.1',
};
/**
 * Rate Limiting
 * Nado uses a weight-based rate limiting system similar to other DEXs
 */
export const NADO_RATE_LIMITS = {
    // Requests per minute
    queriesPerMinute: 1200,
    executesPerMinute: 600,
    // WebSocket
    wsMessagePerSecond: 10,
    wsPingInterval: 30000, // 30 seconds - required for keep-alive
};
/**
 * WebSocket Configuration
 */
export const NADO_WS_CONFIG = {
    pingInterval: 30000, // Required: send ping every 30 seconds
    pongTimeout: 10000, // Timeout for pong response
    reconnectDelay: 1000, // Initial reconnect delay
    maxReconnectDelay: 30000, // Max reconnect delay
    reconnectAttempts: 10,
};
/**
 * API Request Configuration
 */
export const NADO_REQUEST_CONFIG = {
    timeout: 10000, // 10 seconds
    headers: {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip, br, deflate', // Required by Nado API
    },
};
/**
 * Nado-specific order types
 */
export const NADO_ORDER_TYPES = {
    LIMIT: 'limit',
    MARKET: 'market',
    POST_ONLY: 'post_only',
    IOC: 'ioc', // Immediate or Cancel
    FOK: 'fok', // Fill or Kill
};
/**
 * Nado order sides
 */
export const NADO_ORDER_SIDES = {
    BUY: 0, // Nado uses 0 for buy
    SELL: 1, // Nado uses 1 for sell
};
/**
 * Decimal precision
 * Nado normalizes all amounts to 18 decimal places
 */
export const NADO_DECIMALS = {
    amount: 18,
    price: 18,
};
/**
 * API Response Status
 */
export const NADO_STATUS = {
    SUCCESS: 'success',
    FAILURE: 'failure',
};
/**
 * Query endpoint types
 */
export const NADO_QUERY_TYPES = {
    STATUS: 'status',
    CONTRACTS: 'contracts',
    NONCES: 'nonces',
    ORDER: 'order',
    ORDERS: 'orders',
    SUBACCOUNT_INFO: 'subaccount_info',
    ISOLATED_POSITIONS: 'isolated_positions',
    MARKET_LIQUIDITY: 'market_liquidity',
    SYMBOLS: 'symbols',
    ALL_PRODUCTS: 'all_products',
    MARKET_PRICES: 'market_prices',
    MAX_ORDER_SIZE: 'max_order_size',
    MAX_WITHDRAWABLE: 'max_withdrawable',
    FEE_RATES: 'fee_rates',
    HEALTH_GROUPS: 'health_groups',
};
/**
 * Execute endpoint types
 */
export const NADO_EXECUTE_TYPES = {
    PLACE_ORDER: 'place_order',
    CANCEL_ORDERS: 'cancel_orders',
    CANCEL_PRODUCT_ORDERS: 'cancel_product_orders',
    WITHDRAW_COLLATERAL: 'withdraw_collateral',
    LIQUIDATE_SUBACCOUNT: 'liquidate_subaccount',
    MINT_NLP: 'mint_nlp',
    BURN_NLP: 'burn_nlp',
    LINK_SIGNER: 'link_signer',
};
/**
 * WebSocket subscription channels
 */
export const NADO_WS_CHANNELS = {
    ORDERBOOK: 'market_liquidity',
    TRADES: 'recent_trades',
    POSITIONS: 'isolated_positions',
    ORDERS: 'orders',
    SUBACCOUNT: 'subaccount_info',
    FILLS: 'fills',
};
//# sourceMappingURL=constants.js.map