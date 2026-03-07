/**
 * Ostium Authentication (EVM Wallet)
 *
 * Note: Ostium's on-chain interactions are read-only via RPC.
 * The sign() method is a no-op because Ostium does not require
 * request-level authentication for its REST API.
 *
 * Private key handling is deferred to the caller — this class
 * intentionally does NOT store private keys to minimize exposure.
 */

import type { IAuthStrategy, RequestParams, AuthenticatedRequest } from '../../types/adapter.js';

export interface OstiumAuthConfig {
  rpcUrl: string;
}

export class OstiumAuth implements IAuthStrategy {
  private readonly rpcUrl: string;

  constructor(config: OstiumAuthConfig) {
    this.rpcUrl = config.rpcUrl;
  }

  getRpcUrl(): string {
    return this.rpcUrl;
  }

  async sign(request: RequestParams): Promise<AuthenticatedRequest> {
    return { ...request };
  }

  getHeaders(): Record<string, string> {
    return { 'Content-Type': 'application/json' };
  }

  hasCredentials(): boolean {
    return !!this.rpcUrl;
  }
}
