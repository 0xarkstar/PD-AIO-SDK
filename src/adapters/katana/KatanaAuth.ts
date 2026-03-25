/**
 * Katana dual authentication strategy
 *
 * Combines HMAC-SHA256 for all private requests with EIP-712 signatures for writes.
 * Uses UUID v1 nonces with 60-second freshness window.
 */

import { v1 as uuidv1 } from 'uuid';
import type { Wallet } from 'ethers';
import type { IAuthStrategy, AuthenticatedRequest, RequestParams } from '../../types/adapter.js';
import { createHmacSha256 } from '../../utils/crypto.js';
import {
  KATANA_EIP712_DOMAIN,
  KATANA_EIP712_ORDER_TYPE,
  KATANA_EIP712_CANCEL_TYPE,
  KATANA_AUTH_HEADERS,
} from './constants.js';
import type { KatanaOrderSignPayload, KatanaCancelSignPayload } from './types.js';

/**
 * Katana authentication configuration
 */
export interface KatanaAuthConfig {
  apiKey?: string;
  apiSecret?: string;
  wallet?: Wallet;
  testnet?: boolean;
}

/**
 * Katana authentication strategy
 *
 * - HMAC-SHA256: Applied to all private requests via KP-API-KEY + KP-HMAC-SIGNATURE headers
 * - EIP-712: Applied to write operations (orders, cancels, withdrawals)
 */
export class KatanaAuth implements IAuthStrategy {
  private readonly apiKey?: string;
  private readonly apiSecret?: string;
  private readonly wallet?: Wallet;
  private readonly testnet: boolean;
  private _serverTimeOffset: number = 0;

  constructor(config: KatanaAuthConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.wallet = config.wallet;
    this.testnet = config.testnet ?? false;
  }

  /**
   * Check if HMAC credentials are available
   */
  hasCredentials(): boolean {
    return !!(this.apiKey && this.apiSecret);
  }

  /**
   * Check if wallet is available for EIP-712 signing
   */
  hasWallet(): boolean {
    return !!this.wallet;
  }

  /**
   * Require HMAC authentication for private methods
   */
  requireAuth(): void {
    if (!this.hasCredentials()) {
      throw new Error('Authentication required. Provide apiKey and apiSecret in config.');
    }
  }

  /**
   * Require wallet for write operations
   */
  requireWallet(): void {
    if (!this.wallet) {
      throw new Error('Wallet required for trading operations. Provide wallet in config.');
    }
  }

  /**
   * Set server time offset for nonce accuracy
   */
  setServerTimeOffset(offset: number): void {
    this._serverTimeOffset = offset;
  }

  /**
   * Generate fresh UUID v1 nonce
   *
   * UUID v1 embeds a timestamp — server time offset is tracked
   * to detect clock skew (logged as warning during initialize).
   */
  generateNonce(): string {
    // UUID v1 uses system clock; _serverTimeOffset is available
    // for future clock-skew-aware nonce generation if needed
    return uuidv1();
  }

  /**
   * Get server time offset (ms). Positive = server ahead of local clock.
   */
  getServerTimeOffset(): number {
    return this._serverTimeOffset;
  }

  /**
   * Get wallet address
   */
  getAddress(): string | undefined {
    return this.wallet?.address;
  }

  /**
   * Sign a request with HMAC-SHA256 headers
   *
   * GET: HMAC of URL-encoded query string
   * POST/DELETE: HMAC of JSON request body
   */
  async sign(request: RequestParams): Promise<AuthenticatedRequest> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey && this.apiSecret) {
      headers[KATANA_AUTH_HEADERS.apiKey] = this.apiKey;

      const method = request.method.toUpperCase();
      let payload: string;

      if (method === 'GET') {
        payload = request.params
          ? new URLSearchParams(request.params as Record<string, string>).toString()
          : '';
      } else {
        payload = request.body ? JSON.stringify(request.body) : '';
      }

      const signature = await createHmacSha256(this.apiSecret, payload);
      headers[KATANA_AUTH_HEADERS.hmacSignature] = signature;
    }

    return {
      ...request,
      headers,
    };
  }

  /**
   * Verify authentication credentials
   */
  async verify(): Promise<boolean> {
    try {
      if (this.apiKey && this.apiSecret) {
        return true;
      }
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
   * Sign an order using EIP-712 typed data
   */
  async signOrder(payload: KatanaOrderSignPayload): Promise<string> {
    this.requireWallet();

    const domain = this.testnet
      ? KATANA_EIP712_DOMAIN.sandbox
      : KATANA_EIP712_DOMAIN.mainnet;

    const signature = await this.wallet!.signTypedData(
      domain,
      KATANA_EIP712_ORDER_TYPE,
      payload
    );

    return signature;
  }

  /**
   * Sign a cancel request using EIP-712 typed data
   */
  async signCancel(payload: KatanaCancelSignPayload): Promise<string> {
    this.requireWallet();

    const domain = this.testnet
      ? KATANA_EIP712_DOMAIN.sandbox
      : KATANA_EIP712_DOMAIN.mainnet;

    const signature = await this.wallet!.signTypedData(
      domain,
      KATANA_EIP712_CANCEL_TYPE,
      payload
    );

    return signature;
  }

  /**
   * Get authentication headers (for simple GET requests)
   */
  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers[KATANA_AUTH_HEADERS.apiKey] = this.apiKey;
    }

    return headers;
  }
}
