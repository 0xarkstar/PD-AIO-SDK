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

import { BadRequestError, PerpDEXError, RateLimitError } from '../../types/errors.js';

export const APEX_ERROR_CODES: Record<number, string> = {
  3: 'INVALID_SYMBOL', // live-verified
};

/** Map an {code,msg} error envelope to a PerpDEXError subclass */
export function mapApexError(code: number, message: string): PerpDEXError {
  if (code === 3) {
    return new BadRequestError(message, String(code), 'apex');
  }
  return new PerpDEXError(message, String(code), 'apex');
}

/**
 * Map an HTTP-level failure. 403 means the IP was banned by the venue
 * (600 req/60s/IP public limit) — surfaced as a rate-limit error so callers
 * back off hard instead of retrying.
 */
export function mapApexHttpError(status: number, message: string): PerpDEXError {
  if (status === 403) {
    return new RateLimitError(
      `${message} (HTTP 403 = ApeX IP ban — back off, do not retry)`,
      'IP_BANNED',
      'apex'
    );
  }
  return new PerpDEXError(message, `HTTP_${status}`, 'apex');
}
