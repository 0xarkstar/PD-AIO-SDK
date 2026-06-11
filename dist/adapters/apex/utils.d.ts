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
export declare function toApexNoDashSymbol(unified: string): string;
/** Unified "BTC/USDT:USDT" → DASH "BTC-USDT" (history-funding/markets) */
export declare function toApexDashSymbol(unified: string): string;
/** base + settle → unified perp symbol: ("BTC","USDT") → "BTC/USDT:USDT" */
export declare function toUnifiedSymbol(base: string, settle: string): string;
/** Venue DASH symbol → unified: "BTC-USDT" → "BTC/USDT:USDT" */
export declare function dashToUnifiedSymbol(dashSymbol: string): string;
/** Decimal places implied by a tick/step size string: "0.001" → 3, "1" → 0 */
export declare function parsePrecision(size: string): number;
//# sourceMappingURL=utils.d.ts.map