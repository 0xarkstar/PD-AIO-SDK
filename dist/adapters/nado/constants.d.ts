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
export declare const NADO_API_URLS: {
    readonly mainnet: {
        readonly rest: "https://gateway.prod.nado.xyz/v1";
        readonly ws: "wss://gateway.prod.nado.xyz/v1/ws";
    };
    readonly testnet: {
        readonly rest: "https://gateway.test.nado.xyz/v1";
        readonly ws: "wss://gateway.test.nado.xyz/v1/ws";
    };
};
/**
 * Nado Chain ID (Ink L2)
 */
export declare const NADO_CHAIN_ID: {
    readonly mainnet: 57073;
    readonly testnet: 763373;
};
/**
 * EIP712 Domain Configuration
 */
export declare const NADO_EIP712_DOMAIN: {
    readonly name: "Nado";
    readonly version: "0.0.1";
};
/**
 * Rate Limiting
 * Nado uses a weight-based rate limiting system similar to other DEXs
 */
export declare const NADO_RATE_LIMITS: {
    readonly queriesPerMinute: 1200;
    readonly executesPerMinute: 600;
    readonly wsMessagePerSecond: 10;
    readonly wsPingInterval: 30000;
};
/**
 * WebSocket Configuration
 */
export declare const NADO_WS_CONFIG: {
    readonly pingInterval: 30000;
    readonly pongTimeout: 10000;
    readonly reconnectDelay: 1000;
    readonly maxReconnectDelay: 30000;
    readonly reconnectAttempts: 10;
};
/**
 * API Request Configuration
 */
export declare const NADO_REQUEST_CONFIG: {
    readonly timeout: 10000;
    readonly headers: {
        readonly 'Content-Type': "application/json";
        readonly 'Accept-Encoding': "gzip, br, deflate";
    };
};
/**
 * Nado-specific order types
 */
export declare const NADO_ORDER_TYPES: {
    readonly LIMIT: "limit";
    readonly MARKET: "market";
    readonly POST_ONLY: "post_only";
    readonly IOC: "ioc";
    readonly FOK: "fok";
};
/**
 * Nado order sides
 */
export declare const NADO_ORDER_SIDES: {
    readonly BUY: 0;
    readonly SELL: 1;
};
/**
 * Decimal precision
 * Nado normalizes all amounts to 18 decimal places
 */
export declare const NADO_DECIMALS: {
    readonly amount: 18;
    readonly price: 18;
};
/**
 * API Response Status
 */
export declare const NADO_STATUS: {
    readonly SUCCESS: "success";
    readonly FAILURE: "failure";
};
/**
 * Query endpoint types
 */
export declare const NADO_QUERY_TYPES: {
    readonly STATUS: "status";
    readonly CONTRACTS: "contracts";
    readonly NONCES: "nonces";
    readonly ORDER: "order";
    readonly ORDERS: "orders";
    readonly SUBACCOUNT_INFO: "subaccount_info";
    readonly ISOLATED_POSITIONS: "isolated_positions";
    readonly MARKET_LIQUIDITY: "market_liquidity";
    readonly SYMBOLS: "symbols";
    readonly ALL_PRODUCTS: "all_products";
    readonly MARKET_PRICES: "market_prices";
    readonly MAX_ORDER_SIZE: "max_order_size";
    readonly MAX_WITHDRAWABLE: "max_withdrawable";
    readonly FEE_RATES: "fee_rates";
    readonly HEALTH_GROUPS: "health_groups";
};
/**
 * Execute endpoint types
 */
export declare const NADO_EXECUTE_TYPES: {
    readonly PLACE_ORDER: "place_order";
    readonly CANCEL_ORDERS: "cancel_orders";
    readonly CANCEL_PRODUCT_ORDERS: "cancel_product_orders";
    readonly WITHDRAW_COLLATERAL: "withdraw_collateral";
    readonly LIQUIDATE_SUBACCOUNT: "liquidate_subaccount";
    readonly MINT_NLP: "mint_nlp";
    readonly BURN_NLP: "burn_nlp";
    readonly LINK_SIGNER: "link_signer";
};
/**
 * WebSocket subscription channels
 */
export declare const NADO_WS_CHANNELS: {
    readonly ORDERBOOK: "market_liquidity";
    readonly TRADES: "recent_trades";
    readonly POSITIONS: "isolated_positions";
    readonly ORDERS: "orders";
    readonly SUBACCOUNT: "subaccount_info";
    readonly FILLS: "fills";
};
//# sourceMappingURL=constants.d.ts.map