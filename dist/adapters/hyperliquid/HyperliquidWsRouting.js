/**
 * Hyperliquid WebSocket routing resolver
 *
 * Maps a parsed Hyperliquid frame to the composite subscription key(s) the
 * adapter subscribes under (e.g. "l2Book:BTC", "trades:BTC", bare "allMids").
 *
 * Wired into WebSocketManager via `resolveMessageKeys`. Pure function — no state.
 *
 * Ground truth (live capture):
 *  - l2Book   : { channel:"l2Book",   data:{ coin, time, levels } }      → l2Book:<coin>
 *  - trades   : { channel:"trades",   data:[ { coin, ... }, ... ] }      → trades:<coin>
 *  - allMids  : { channel:"allMids",  data:{ mids:{...} } }              → allMids (bare)
 *  - user     : { channel:"user",     data:{ user, ... } }              → user:<address>
 *  - subscriptionResponse (ack)                                          → undefined (control)
 */
import { HYPERLIQUID_WS_CHANNELS } from './constants.js';
/**
 * Parse a raw Hyperliquid frame.
 *
 * HL frames are NOT flat — they nest the payload under `.data`
 * (e.g. `{ channel:"l2Book", data:{ coin, time, levels } }`). The default
 * WebSocketManager parser would set `message.data` to the WHOLE frame, but every
 * HL `watch()` consumer (and the normalizers) expect the INNER payload. So this
 * hook unwraps: `message.channel = frame.channel`, `message.data = frame.data`.
 *
 * `subscriptionResponse` ack frames are passed through with their channel so the
 * resolver can drop them (returns undefined → no routing).
 */
export function hyperliquidParseMessage(data) {
    const frame = (typeof data === 'string' ? JSON.parse(data) : data);
    return {
        type: frame?.channel ?? 'unknown',
        channel: frame?.channel,
        data: frame?.data,
        timestamp: Date.now(),
    };
}
export function hyperliquidResolveKeys(message) {
    const channel = message.channel;
    // After hyperliquidParseMessage, message.data is the INNER frame payload.
    const data = message.data;
    switch (channel) {
        case HYPERLIQUID_WS_CHANNELS.L2_BOOK: {
            const coin = data?.coin;
            return coin ? [`${HYPERLIQUID_WS_CHANNELS.L2_BOOK}:${coin}`] : undefined;
        }
        case HYPERLIQUID_WS_CHANNELS.TRADES: {
            // data is an array of trades; all elements share a coin per subscription,
            // but map unique coins defensively in case a frame ever mixes coins.
            if (Array.isArray(data) && data.length > 0) {
                const coins = Array.from(new Set(data
                    .map((t) => t.coin)
                    .filter((c) => Boolean(c))));
                return coins.length > 0
                    ? coins.map((c) => `${HYPERLIQUID_WS_CHANNELS.TRADES}:${c}`)
                    : undefined;
            }
            return undefined;
        }
        case HYPERLIQUID_WS_CHANNELS.ALL_MIDS:
            // Bare key — watchTicker subscribes under the bare channel and filters
            // by symbol from data.mids[symbol].
            return [HYPERLIQUID_WS_CHANNELS.ALL_MIDS];
        case HYPERLIQUID_WS_CHANNELS.USER: {
            const user = data?.user;
            return user ? [`${HYPERLIQUID_WS_CHANNELS.USER}:${user}`] : undefined;
        }
        case HYPERLIQUID_WS_CHANNELS.USER_FILLS: {
            const user = data?.user;
            return user ? [`${HYPERLIQUID_WS_CHANNELS.USER_FILLS}:${user}`] : undefined;
        }
        case 'subscriptionResponse':
            // Control/ack frame — never route to a data subscription.
            return undefined;
        default:
            // Preserve any other HL channel that already worked (e.g. candles, bbo).
            return channel ? [channel] : undefined;
    }
}
//# sourceMappingURL=HyperliquidWsRouting.js.map