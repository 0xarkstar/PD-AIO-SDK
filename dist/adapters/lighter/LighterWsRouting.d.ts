/**
 * Lighter WebSocket routing + parse hooks
 *
 * Lighter has two coupled defects fixed here:
 *  1. Routing — the server echoes the channel in COLON form ("order_book:1",
 *     "trade:1"), while the WIRE subscribe uses SLASH form ("order_book/1").
 *     The subscription key is the colon form; the resolver maps frames to it.
 *  2. Error surfacing — an {error:{code,message}} frame (e.g. 30005 "Invalid
 *     Channel") must surface via the error event, not hang silently with 0 yields.
 *
 * Ground truth (live capture):
 *  - { session_id, type:"connected" }                         → control, no route
 *  - { error:{ code, message } }                              → error, surface
 *  - { channel:"order_book:1", type:"subscribed/order_book", order_book:{...} }
 *  - { channel:"order_book:1", type:"update/order_book",     order_book:{...} }
 *  - { channel:"trade:1",      type:"subscribed/trade",      trades:[...] }
 */
import type { WebSocketMessage } from '../../websocket/types.js';
/**
 * Parse a raw Lighter frame. Surfaces {error:...} frames as type "error" with no
 * channel (so they do not route to a data subscription), and the {type:"connected"}
 * session frame as a control frame with no channel.
 */
export declare function lighterParseMessage(data: unknown): WebSocketMessage;
/**
 * Resolve the colon-form routing key for a Lighter data frame.
 * Returns undefined for control frames (connected/error), which prevents a
 * silent 0-yield hang because the error is surfaced separately via the
 * 'error' event (see LighterAdapter wiring).
 */
export declare function lighterResolveKeys(message: WebSocketMessage): string | string[] | undefined;
//# sourceMappingURL=LighterWsRouting.d.ts.map