/**
 * ApeX Omni Utility Functions
 *
 * Symbol formats are STRICT and PER-ENDPOINT (live-verified 2026-06-11):
 * - NO-DASH "BTCUSDT": /depth, /trades, /ticker, /klines and ALL WS topics.
 *   Sending the dash form to /depth returns HTTP 200 with a silent-empty
 *   {a:null,b:null,s:"",u:0} body.
 * - DASH "BTC-USDT": /history-funding and the `symbol` field inside /symbols.
 *   Sending the no-dash form errors {code:3}.
 * Unified form: "BTC/USDT:USDT".
 */
/** Unified "BTC/USDT:USDT" → NO-DASH "BTCUSDT" (depth/trades/ticker/klines/WS) */
export function toApexNoDashSymbol(unified) {
    const parts = unified.split(/[/:]/);
    return `${parts[0]}${parts[1]}`;
}
/** Unified "BTC/USDT:USDT" → DASH "BTC-USDT" (history-funding/markets) */
export function toApexDashSymbol(unified) {
    const parts = unified.split(/[/:]/);
    return `${parts[0]}-${parts[1]}`;
}
/** base + settle → unified perp symbol: ("BTC","USDT") → "BTC/USDT:USDT" */
export function toUnifiedSymbol(base, settle) {
    return `${base}/${settle}:${settle}`;
}
/** Venue DASH symbol → unified: "BTC-USDT" → "BTC/USDT:USDT" */
export function dashToUnifiedSymbol(dashSymbol) {
    const [base, quote] = dashSymbol.split('-');
    return `${base}/${quote}:${quote}`;
}
/** Decimal places implied by a tick/step size string: "0.001" → 3, "1" → 0 */
export function parsePrecision(size) {
    if (!size || size === '0')
        return 0;
    const decimal = size.split('.')[1];
    if (!decimal)
        return 0;
    return decimal.replace(/0+$/, '').length || 0;
}
//# sourceMappingURL=utils.js.map