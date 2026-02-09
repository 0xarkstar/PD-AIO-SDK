/**
 * Pacifica Utility Functions
 */
export function toPacificaSymbol(unified) {
    const parts = unified.split(/[/:]/);
    return `${parts[0]}-PERP`;
}
export function toUnifiedSymbol(pacificaSymbol) {
    const base = pacificaSymbol.replace('-PERP', '');
    return `${base}/USDC:USDC`;
}
export function buildOrderBody(request, pacificaSymbol, builderCode) {
    const body = {
        symbol: pacificaSymbol,
        side: request.side,
        type: request.type,
        size: String(request.amount),
    };
    if (request.price !== undefined) {
        body.price = String(request.price);
    }
    if (request.reduceOnly) {
        body.reduce_only = true;
    }
    if (request.postOnly) {
        body.post_only = true;
    }
    if (request.clientOrderId) {
        body.client_order_id = request.clientOrderId;
    }
    if (request.timeInForce) {
        body.time_in_force = request.timeInForce;
    }
    const code = request.builderCode ?? builderCode;
    if (code) {
        body.builder_code = code;
    }
    return body;
}
//# sourceMappingURL=utils.js.map