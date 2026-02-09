/**
 * Ostium Authentication (EVM Wallet)
 */

import type { IAuthStrategy, RequestParams, AuthenticatedRequest } from '../../types/adapter.js';

export interface OstiumAuthConfig {
  privateKey: string;
  rpcUrl: string;
}

export class OstiumAuth implements IAuthStrategy {
  private readonly privateKey: string;
  private readonly rpcUrl: string;

  constructor(config: OstiumAuthConfig) {
    this.privateKey = config.privateKey;
    this.rpcUrl = config.rpcUrl;
  }

  getPrivateKey(): string {
    return this.privateKey;
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
    return !!(this.privateKey && this.rpcUrl);
  }

  getAddress(): string {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Wallet } = require('ethers') as typeof import('ethers');
    const wallet = new Wallet(this.privateKey);
    return wallet.address;
  }
}
