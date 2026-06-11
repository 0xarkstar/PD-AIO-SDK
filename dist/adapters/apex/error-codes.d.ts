/**
 * ApeX Omni Error Mapping
 *
 * Error envelope: {code, msg, timeCost} delivered with HTTP 200.
 * Live-verified: code 3 = invalid symbol (e.g. no-dash form sent to
 * /history-funding). Other codes are mapped generically — only byte-verified
 * codes get specific classes.
 *
 * HTTP 403 = IP BAN (temporary or permanent), NOT a soft throttle.
 */
import { PerpDEXError } from '../../types/errors.js';
export declare const APEX_ERROR_CODES: Record<number, string>;
/** Map an {code,msg} error envelope to a PerpDEXError subclass */
export declare function mapApexError(code: number, message: string): PerpDEXError;
/**
 * Map an HTTP-level failure. 403 means the IP was banned by the venue
 * (600 req/60s/IP public limit) — surfaced as a rate-limit error so callers
 * back off hard instead of retrying.
 */
export declare function mapApexHttpError(status: number, message: string): PerpDEXError;
//# sourceMappingURL=error-codes.d.ts.map