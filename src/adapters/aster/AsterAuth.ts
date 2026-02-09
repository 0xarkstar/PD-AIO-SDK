/**
 * Aster Authentication (HMAC-SHA256)
 */

import type { IAuthStrategy, RequestParams, AuthenticatedRequest } from '../../types/adapter.js';
import { createHmacSha256 } from '../../utils/crypto.js';
import { ASTER_DEFAULT_RECV_WINDOW } from './constants.js';

export interface AsterAuthConfig {
  apiKey: string;
  apiSecret: string;
  recvWindow?: number;
}

export class AsterAuth implements IAuthStrategy {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly recvWindow: number;

  constructor(config: AsterAuthConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.recvWindow = config.recvWindow ?? ASTER_DEFAULT_RECV_WINDOW;
  }

  async sign(request: RequestParams): Promise<AuthenticatedRequest> {
    const timestamp = request.timestamp ?? Date.now();
    const queryParams = this.buildQueryString(request, timestamp);
    const signature = await createHmacSha256(queryParams, this.apiSecret);

    return {
      ...request,
      params: {
        ...(request.params ?? {}),
        timestamp,
        recvWindow: this.recvWindow,
        signature,
      },
      headers: {
        'X-MBX-APIKEY': this.apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };
  }

  private buildQueryString(request: RequestParams, timestamp: number): string {
    const allParams: Record<string, string | number | boolean> = {
      ...(request.params ?? {}),
      timestamp,
      recvWindow: this.recvWindow,
    };

    // If body is an object, merge its params
    if (request.body && typeof request.body === 'object') {
      const bodyObj = request.body as Record<string, string | number | boolean>;
      for (const [key, value] of Object.entries(bodyObj)) {
        allParams[key] = value;
      }
    }

    return Object.entries(allParams)
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join('&');
  }

  getHeaders(): Record<string, string> {
    return {
      'X-MBX-APIKEY': this.apiKey,
    };
  }

  hasCredentials(): boolean {
    return !!(this.apiKey && this.apiSecret);
  }
}
