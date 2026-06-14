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
/**
 * Parse a raw Lighter frame. Surfaces {error:...} frames as type "error" with no
 * channel (so they do not route to a data subscription), and the {type:"connected"}
 * session frame as a control frame with no channel.
 */
export function lighterParseMessage(data) {
    const parsed = (typeof data === 'string' ? JSON.parse(data) : data);
    if (parsed && parsed.error) {
        return {
            type: 'error',
            channel: undefined,
            data: parsed,
            timestamp: Date.now(),
        };
    }
    return {
        type: parsed?.type ?? 'unknown',
        channel: parsed?.channel,
        data: parsed,
        timestamp: Date.now(),
    };
}
/**
 * Resolve the colon-form routing key for a Lighter data frame.
 * Returns undefined for control frames (connected/error), which prevents a
 * silent 0-yield hang because the error is surfaced separately via the
 * 'error' event (see LighterAdapter wiring).
 */
export function lighterResolveKeys(message) {
    // Error / connected / any frame without a channel is a control frame.
    if (!message.channel) {
        return undefined;
    }
    return [message.channel];
}
//# sourceMappingURL=LighterWsRouting.js.map