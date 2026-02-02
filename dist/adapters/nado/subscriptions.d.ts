/**
 * Nado WebSocket Subscription Builder
 *
 * Provides helper functions to build WebSocket subscription payloads for Nado DEX.
 * Centralizes subscription logic and channel ID generation.
 *
 * @see https://docs.nado.xyz/developer-resources/api/websocket
 */
/**
 * Subscription payload for Nado WebSocket
 */
export interface NadoSubscription {
    type: 'subscribe' | 'unsubscribe';
    channel: string;
    [key: string]: any;
}
/**
 * Nado WebSocket Subscription Builder
 *
 * Provides static methods to build WebSocket subscription payloads
 * and generate channel IDs for Nado DEX.
 *
 * @example
 * ```typescript
 * // Build orderbook subscription
 * const sub = NadoSubscriptionBuilder.orderBook(2);
 * // { type: 'subscribe', channel: 'orderbook', product_id: 2 }
 *
 * // Generate channel ID
 * const channelId = NadoSubscriptionBuilder.channelId('orderbook', 2);
 * // 'orderbook:2'
 * ```
 */
export declare class NadoSubscriptionBuilder {
    /**
     * Subscribe to order book updates for a product
     *
     * @param productId - Nado product ID
     * @returns Subscription payload
     *
     * @example
     * ```typescript
     * const sub = NadoSubscriptionBuilder.orderBook(2);
     * const channelId = NadoSubscriptionBuilder.channelId(NADO_WS_CHANNELS.ORDERBOOK, 2);
     * ```
     */
    static orderBook(productId: number): NadoSubscription;
    /**
     * Subscribe to position updates for a subaccount
     *
     * @param subaccount - Wallet address (0x-prefixed)
     * @returns Subscription payload
     *
     * @example
     * ```typescript
     * const sub = NadoSubscriptionBuilder.positions('0x123...');
     * const channelId = NadoSubscriptionBuilder.channelId(NADO_WS_CHANNELS.POSITIONS, '0x123...');
     * ```
     */
    static positions(subaccount: string): NadoSubscription;
    /**
     * Subscribe to order updates for a subaccount
     *
     * @param subaccount - Wallet address (0x-prefixed)
     * @returns Subscription payload
     *
     * @example
     * ```typescript
     * const sub = NadoSubscriptionBuilder.orders('0x123...');
     * const channelId = NadoSubscriptionBuilder.channelId(NADO_WS_CHANNELS.ORDERS, '0x123...');
     * ```
     */
    static orders(subaccount: string): NadoSubscription;
    /**
     * Subscribe to trade updates for a product
     *
     * @param productId - Nado product ID
     * @returns Subscription payload
     *
     * @example
     * ```typescript
     * const sub = NadoSubscriptionBuilder.trades(2);
     * const channelId = NadoSubscriptionBuilder.channelId(NADO_WS_CHANNELS.TRADES, 2);
     * ```
     */
    static trades(productId: number): NadoSubscription;
    /**
     * Subscribe to balance updates for a subaccount
     *
     * @param subaccount - Wallet address (0x-prefixed)
     * @returns Subscription payload
     *
     * @example
     * ```typescript
     * const sub = NadoSubscriptionBuilder.balance('0x123...');
     * const channelId = NadoSubscriptionBuilder.channelId(NADO_WS_CHANNELS.SUBACCOUNT, '0x123...');
     * ```
     */
    static balance(subaccount: string): NadoSubscription;
    /**
     * Generate a unique channel ID for WebSocket subscription
     *
     * Channel IDs are used to identify specific data streams in the WebSocket manager.
     * Format: `channel:identifier` (e.g., "orderbook:2", "positions:0x123...")
     *
     * @param channel - Channel name (e.g., 'orderbook', 'positions')
     * @param identifier - Product ID (number) or subaccount address (string)
     * @returns Channel ID string
     *
     * @example
     * ```typescript
     * // Product-based channel
     * const obChannelId = NadoSubscriptionBuilder.channelId('orderbook', 2);
     * // 'orderbook:2'
     *
     * // Address-based channel
     * const posChannelId = NadoSubscriptionBuilder.channelId('positions', '0x123...');
     * // 'positions:0x123...'
     * ```
     */
    static channelId(channel: string, identifier: number | string): string;
    /**
     * Build an unsubscribe payload
     *
     * @param channel - Channel name
     * @param params - Additional parameters (e.g., product_id, subaccount)
     * @returns Unsubscribe payload
     *
     * @example
     * ```typescript
     * const unsub = NadoSubscriptionBuilder.unsubscribe('orderbook', { product_id: 2 });
     * // { type: 'unsubscribe', channel: 'orderbook', product_id: 2 }
     * ```
     */
    static unsubscribe(channel: string, params?: Record<string, any>): NadoSubscription;
}
//# sourceMappingURL=subscriptions.d.ts.map