/**
 * Backpack Authentication Strategy
 *
 * Implements ED25519 signing for Backpack exchange
 */

import * as ed from '@noble/ed25519';
import { toBuffer, fromBuffer } from '../../utils/buffer.js';
import type { AuthenticatedRequest, IAuthStrategy, RequestParams } from '../../types/index.js';
import { PerpDEXError } from '../../types/errors.js';

export interface BackpackAuthConfig {
  /** API key for authentication */
  apiKey: string;
  /** API secret (private key) for signing - supports hex or base64 format */
  apiSecret: string;
}

export class BackpackAuth implements IAuthStrategy {
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(config: BackpackAuthConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
  }

  /**
   * Sign a request with ED25519 signature
   */
  async sign(request: RequestParams): Promise<AuthenticatedRequest> {
    const timestamp = Date.now().toString();
    const signature = await this.signRequest(
      request.method,
      request.path,
      timestamp,
      request.body as Record<string, unknown> | undefined
    );

    return {
      ...request,
      headers: {
        ...this.getHeaders(),
        'X-API-KEY': this.apiKey,
        'X-Timestamp': timestamp,
        'X-Signature': signature,
      },
    };
  }

  /**
   * Get authentication headers
   */
  getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-API-KEY': this.apiKey,
    };
  }

  /**
   * Sign request with ED25519 signature
   * Uses cross-platform buffer utilities for browser compatibility
   */
  async signRequest(
    method: string,
    path: string,
    timestamp: string,
    body?: Record<string, unknown>
  ): Promise<string> {
    try {
      // Create message to sign
      const message = `${method}${path}${timestamp}${body ? JSON.stringify(body) : ''}`;
      const messageBytes = new TextEncoder().encode(message);

      // Convert private key to Uint8Array
      // Support both hex (0x... or plain hex) and base64 formats
      let privateKey: Uint8Array;
      if (this.apiSecret.startsWith('0x')) {
        // Hex format with 0x prefix
        privateKey = toBuffer(this.apiSecret.slice(2), 'hex');
      } else if (/^[0-9a-fA-F]+$/.test(this.apiSecret)) {
        // Plain hex format
        privateKey = toBuffer(this.apiSecret, 'hex');
      } else {
        // Assume base64 format (Backpack's default format)
        privateKey = toBuffer(this.apiSecret, 'base64');
      }

      // Sign the message with ED25519
      const signature = await ed.signAsync(messageBytes, privateKey);

      // Return signature as base64 string (Backpack expects base64)
      return fromBuffer(new Uint8Array(signature), 'base64');
    } catch (error) {
      throw new PerpDEXError(
        `Failed to sign request: ${error instanceof Error ? error.message : String(error)}`,
        'SIGNATURE_ERROR',
        'backpack'
      );
    }
  }

  /**
   * Verify if credentials are available
   */
  hasCredentials(): boolean {
    return !!(this.apiKey && this.apiSecret);
  }

  /**
   * Get the API key
   */
  getApiKey(): string {
    return this.apiKey;
  }
}
