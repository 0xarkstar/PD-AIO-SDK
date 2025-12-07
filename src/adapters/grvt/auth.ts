/**
 * GRVT authentication strategy
 */

import type { Wallet } from 'ethers';
import type { IAuthStrategy, AuthenticatedRequest, RequestParams } from '../../types/adapter.js';
import { GRVT_EIP712_DOMAIN, GRVT_EIP712_ORDER_TYPE, GRVT_SESSION_DURATION } from './constants.js';
import type { GRVTOrderSignPayload } from './types.js';

/**
 * GRVT authentication configuration
 */
export interface GRVTAuthConfig {
  apiKey?: string;
  wallet?: Wallet;
  testnet?: boolean;
}

/**
 * Session cookie for GRVT authentication
 */
interface SessionCookie {
  token: string;
  expiresAt: number;
}

/**
 * GRVT authentication strategy implementation
 *
 * Uses API key + session cookie + EIP-712 signatures
 */
export class GRVTAuth implements IAuthStrategy {
  private readonly apiKey?: string;
  private readonly wallet?: Wallet;
  private readonly testnet: boolean;
  private sessionCookie?: SessionCookie;
  private nonce: number = 0;

  constructor(config: GRVTAuthConfig) {
    this.apiKey = config.apiKey;
    this.wallet = config.wallet;
    this.testnet = config.testnet ?? false;

    if (!this.apiKey && !this.wallet) {
      throw new Error('Either apiKey or wallet must be provided for GRVT authentication');
    }
  }

  /**
   * Sign a request with authentication headers
   */
  async sign(request: RequestParams): Promise<AuthenticatedRequest> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add API key if available
    if (this.apiKey) {
      headers['X-API-KEY'] = this.apiKey;
    }

    // Add session cookie if available
    if (this.sessionCookie && this.isSessionValid()) {
      headers['Cookie'] = `session=${this.sessionCookie.token}`;
    }

    // Add signature for trading operations
    if (this.requiresSignature(request.method, request.path)) {
      const signature = await this.signRequest(request);
      headers['X-Signature'] = signature;
      headers['X-Timestamp'] = Date.now().toString();

      if (this.wallet) {
        headers['X-Address'] = this.wallet.address;
      }
    }

    return {
      ...request,
      headers,
    };
  }

  /**
   * Get authentication headers
   */
  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['X-API-KEY'] = this.apiKey;
    }

    if (this.sessionCookie && this.isSessionValid()) {
      headers['Cookie'] = `session=${this.sessionCookie.token}`;
    }

    return headers;
  }

  /**
   * Verify authentication credentials
   */
  async verify(): Promise<boolean> {
    try {
      // If using API key, verify it's not empty
      if (this.apiKey && this.apiKey.length > 0) {
        return true;
      }

      // If using wallet, verify it's connected
      if (this.wallet) {
        const address = await this.wallet.getAddress();
        return address.length > 0;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get current session cookie
   */
  getSessionCookie(): string | undefined {
    if (this.sessionCookie && this.isSessionValid()) {
      return this.sessionCookie.token;
    }
    return undefined;
  }

  /**
   * Set session cookie from authentication response
   */
  setSessionCookie(token: string, expiresIn?: number): void {
    const duration = expiresIn ?? GRVT_SESSION_DURATION;
    this.sessionCookie = {
      token,
      expiresAt: Date.now() + duration,
    };
  }

  /**
   * Clear session cookie
   */
  clearSessionCookie(): void {
    this.sessionCookie = undefined;
  }

  /**
   * Check if current session is valid
   */
  private isSessionValid(): boolean {
    if (!this.sessionCookie) {
      return false;
    }

    // Add 60-second buffer before expiry
    return Date.now() < this.sessionCookie.expiresAt - 60000;
  }

  /**
   * Check if request requires signature
   */
  private requiresSignature(method: string, path: string): boolean {
    // Trading operations require signatures
    const tradingPaths = [
      '/orders',
      '/orders/batch',
      '/orders/cancel',
      '/positions',
      '/transfer',
      '/withdraw',
    ];

    return tradingPaths.some((tradingPath) => path.includes(tradingPath));
  }

  /**
   * Sign request data with wallet
   */
  private async signRequest(request: RequestParams): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet required for signing requests');
    }

    // Create signature payload
    const timestamp = Date.now();
    const message = this.createSignatureMessage(request, timestamp);

    // Sign with wallet
    const signature = await this.wallet.signMessage(message);

    return signature;
  }

  /**
   * Create message for signing
   */
  private createSignatureMessage(request: RequestParams, timestamp: number): string {
    const method = request.method.toUpperCase();
    const path = request.path;
    const body = request.body ? JSON.stringify(request.body) : '';

    return `${method}${path}${timestamp}${body}`;
  }

  /**
   * Sign order using EIP-712
   */
  async signOrder(payload: GRVTOrderSignPayload): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet required for signing orders');
    }

    const domain = {
      ...GRVT_EIP712_DOMAIN,
      chainId: this.testnet ? 5 : 1, // Goerli for testnet, mainnet otherwise
    };

    const types = GRVT_EIP712_ORDER_TYPE;

    const value = {
      instrument: payload.instrument,
      orderType: payload.order_type,
      side: payload.side,
      size: payload.size,
      price: payload.price,
      timeInForce: payload.time_in_force,
      reduceOnly: payload.reduce_only,
      postOnly: payload.post_only,
      nonce: payload.nonce,
      expiry: payload.expiry,
    };

    const signature = await this.wallet.signTypedData(domain, types, value);

    return signature;
  }

  /**
   * Get next nonce for order signing
   */
  getNextNonce(): number {
    return ++this.nonce;
  }

  /**
   * Reset nonce (useful after session refresh)
   */
  resetNonce(): void {
    this.nonce = 0;
  }

  /**
   * Get wallet address
   */
  getAddress(): string | undefined {
    return this.wallet?.address;
  }

  /**
   * Convert ethers signature to GRVT ISignature format
   */
  parseSignature(signature: string): {
    r: string;
    s: string;
    v: number;
  } {
    // Remove '0x' prefix if present
    const sig = signature.startsWith('0x') ? signature.slice(2) : signature;

    // Ethereum signature format: 65 bytes (r: 32, s: 32, v: 1)
    if (sig.length !== 130) {
      throw new Error(`Invalid signature length: ${sig.length}, expected 130`);
    }

    const r = '0x' + sig.slice(0, 64);
    const s = '0x' + sig.slice(64, 128);
    const v = parseInt(sig.slice(128, 130), 16);

    return { r, s, v };
  }

  /**
   * Create ISignature object for API requests
   */
  async createSignature(
    payload: GRVTOrderSignPayload
  ): Promise<{
    signer: string;
    r: string;
    s: string;
    v: number;
    expiration: string;
    nonce: number;
  }> {
    if (!this.wallet) {
      throw new Error('Wallet required for creating signatures');
    }

    // Sign order with EIP-712
    const signature = await this.signOrder(payload);

    // Parse signature
    const { r, s, v } = this.parseSignature(signature);

    return {
      signer: this.wallet.address,
      r,
      s,
      v,
      expiration: payload.expiry.toString(),
      nonce: payload.nonce,
    };
  }
}
