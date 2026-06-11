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

import {
  AuthenticationError,
  BadRequestError,
  PerpDEXError,
  RateLimitError,
} from '../../types/errors.js';

export const STANDX_ERROR_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED', // live-verified (missing jwt)
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  408: 'PONG_TIMEOUT', // WS: "disconnecting due to not receive Pong within 5 minute period"
  429: 'RATE_LIMIT_EXCEEDED',
  500: 'INTERNAL_SERVER_ERROR',
};

/** Map a {code, message} body to a PerpDEXError subclass */
export function mapStandxError(code: number, message: string): PerpDEXError {
  if (code === 429) {
    return new RateLimitError(message, String(code), 'standx');
  }
  if (code === 401 || code === 403) {
    return new AuthenticationError(message, String(code), 'standx');
  }
  if (code === 400) {
    return new BadRequestError(message, String(code), 'standx');
  }
  return new PerpDEXError(message, String(code), 'standx');
}

/** Map an HTTP-level failure (plain-text bodies carry no JSON code) */
export function mapStandxHttpError(status: number, message: string): PerpDEXError {
  return mapStandxError(status, message);
}
