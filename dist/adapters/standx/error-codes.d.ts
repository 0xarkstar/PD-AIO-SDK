/**
 * StandX Error Mapping
 *
 * Errors are JSON {code, message} delivered with REAL HTTP statuses (unlike
 * apex's HTTP-200 envelope). Live-verified: keyless GET /api/health →
 * HTTP 401 {"code":401,"message":"missing jwt"}. Malformed query strings can
 * also return PLAIN-TEXT 400 bodies ("Failed to deserialize query string:
 * missing field `start_time`") — mapped by HTTP status when no code parses.
 *
 * 429 = credit bucket exhausted (45 credits/req, ~22 req/s sustained) or the
 * 50 req/s hard cap — a soft throttle, back off and retry.
 */
import { PerpDEXError } from '../../types/errors.js';
export declare const STANDX_ERROR_CODES: Record<number, string>;
/** Map a {code, message} body to a PerpDEXError subclass */
export declare function mapStandxError(code: number, message: string): PerpDEXError;
/** Map an HTTP-level failure (plain-text bodies carry no JSON code) */
export declare function mapStandxHttpError(status: number, message: string): PerpDEXError;
//# sourceMappingURL=error-codes.d.ts.map