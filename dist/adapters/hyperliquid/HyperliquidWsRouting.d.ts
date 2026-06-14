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
import type { WebSocketMessage } from '../../websocket/types.js';
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
export declare function hyperliquidParseMessage(data: unknown): WebSocketMessage;
export declare function hyperliquidResolveKeys(message: WebSocketMessage): string | string[] | undefined;
//# sourceMappingURL=HyperliquidWsRouting.d.ts.map