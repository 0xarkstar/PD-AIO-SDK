/**
 * Paradex authentication strategy
 */

import { Account, ec, hash, encode } from 'starknet';
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

    try {
      // Create signature payload
      const timestamp = Date.now();
      const message = this.createSignatureMessage(request, timestamp);

      // Hash the message using Pedersen hash (StarkNet standard)
      const messageHash = hash.computeHashOnElements([message]);

      // Sign with StarkNet ECDSA
      const signature = ec.starkCurve.sign(messageHash, this.starkPrivateKey);

      // Return signature in format: r,s
      return `0x${signature.r.toString(16)},0x${signature.s.toString(16)}`;
    } catch (error) {
      throw new Error(`Failed to sign StarkNet request: ${error instanceof Error ? error.message : String(error)}`);
    }
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
   * Get StarkNet address from private key
   */
  getAddress(): string | undefined {
    if (!this.starkPrivateKey) {
      return undefined;
    }

    try {
      // Get public key from private key using StarkNet curve
      const publicKey = ec.starkCurve.getStarkKey(this.starkPrivateKey);

      // Return the public key as the address (StarkNet format)
      return publicKey;
    } catch (error) {
      console.error('Failed to derive StarkNet address:', error);
      return undefined;
    }
  }
}
