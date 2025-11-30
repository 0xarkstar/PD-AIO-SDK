/**
 * Paradex authentication strategy
 */

import type { IAuthStrategy, AuthenticatedRequest, RequestParams } from '../../types/adapter.js';
import { PARADEX_JWT_EXPIRY_BUFFER } from './constants.js';
import type { ParadexJWT } from './types.js';

/**
 * Paradex authentication configuration
 */
export interface ParadexAuthConfig {
  apiKey?: string;
  apiSecret?: string;
  privateKey?: string;
  starkPrivateKey?: string;
  testnet?: boolean;
}

/**
 * JWT token storage
 */
interface JWTToken {
  accessToken: string;
  expiresAt: number;
}

/**
 * Paradex authentication strategy implementation
 *
 * Uses API key + JWT tokens + StarkNet signatures
 */
export class ParadexAuth implements IAuthStrategy {
  private readonly apiKey?: string;
  private readonly apiSecret?: string;
  private readonly privateKey?: string;
  private readonly starkPrivateKey?: string;
  private readonly testnet: boolean;
  private jwtToken?: JWTToken;

  constructor(config: ParadexAuthConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.privateKey = config.privateKey;
    this.starkPrivateKey = config.starkPrivateKey;
    this.testnet = config.testnet ?? false;

    if (!this.apiKey && !this.starkPrivateKey) {
      throw new Error('Either apiKey or starkPrivateKey must be provided for Paradex authentication');
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

    // Add JWT token if available and valid
    if (this.jwtToken && this.isTokenValid()) {
      headers['Authorization'] = `Bearer ${this.jwtToken.accessToken}`;
    }

    // Add timestamp for all requests
    headers['X-Timestamp'] = Date.now().toString();

    // Add signature for trading operations
    if (this.requiresSignature(request.method, request.path)) {
      const signature = await this.signRequest(request);
      headers['X-Signature'] = signature;
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

    if (this.jwtToken && this.isTokenValid()) {
      headers['Authorization'] = `Bearer ${this.jwtToken.accessToken}`;
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

      // If using StarkNet key, verify it's not empty
      if (this.starkPrivateKey && this.starkPrivateKey.length > 0) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get current JWT token
   */
  getJWTToken(): string | undefined {
    if (this.jwtToken && this.isTokenValid()) {
      return this.jwtToken.accessToken;
    }
    return undefined;
  }

  /**
   * Set JWT token from authentication response
   */
  setJWTToken(jwt: ParadexJWT): void {
    this.jwtToken = {
      accessToken: jwt.access_token,
      expiresAt: Date.now() + (jwt.expires_in * 1000),
    };
  }

  /**
   * Clear JWT token
   */
  clearJWTToken(): void {
    this.jwtToken = undefined;
  }

  /**
   * Check if current JWT token is valid
   */
  private isTokenValid(): boolean {
    if (!this.jwtToken) {
      return false;
    }

    // Add buffer before expiry
    return Date.now() < this.jwtToken.expiresAt - (PARADEX_JWT_EXPIRY_BUFFER * 1000);
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
   * Sign request data with StarkNet key
   */
  private async signRequest(request: RequestParams): Promise<string> {
    if (!this.starkPrivateKey) {
      throw new Error('StarkNet private key required for signing requests');
    }

    // Create signature payload
    const timestamp = Date.now();
    const message = this.createSignatureMessage(request, timestamp);

    // For now, return placeholder signature
    // Full StarkNet signing would require starknet.js library
    return this.createPlaceholderSignature(message);
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
   * Create placeholder signature (to be replaced with actual StarkNet signing)
   */
  private createPlaceholderSignature(message: string): string {
    // This is a placeholder - in production, use starknet.js to sign
    // const signature = await account.signMessage(message);
    return `0x${Buffer.from(message).toString('hex').slice(0, 128)}`;
  }

  /**
   * Get StarkNet address (placeholder)
   */
  getAddress(): string | undefined {
    // This would derive address from starkPrivateKey
    // Requires starknet.js implementation
    return undefined;
  }
}
