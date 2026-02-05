/**
 * Paradex Authentication Strategy
 *
 * Implements multi-layer authentication for Paradex:
 * - API Key authentication (optional)
 * - JWT token management (auto-refresh)
 * - StarkNet ECDSA signatures (for trading operations)
 *
 * @see https://docs.paradex.trade/api/authentication
 */

import { Account, ec, hash, encode } from 'starknet';
import type { IAuthStrategy, AuthenticatedRequest, RequestParams } from '../../types/adapter.js';
import { PARADEX_JWT_EXPIRY_BUFFER } from './constants.js';
import type { ParadexJWT } from './types.js';
import { Logger } from '../../core/logger.js';

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
  private readonly logger = new Logger('ParadexAuth');

  constructor(config: ParadexAuthConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.privateKey = config.privateKey;
    this.starkPrivateKey = config.starkPrivateKey;
    this.testnet = config.testnet ?? false;
    // Note: Credentials are optional for public API access
  }

  /**
   * Check if any credentials are configured
   */
  hasCredentials(): boolean {
    return !!(this.apiKey || this.starkPrivateKey);
  }

  /**
   * Require authentication for private operations
   * @throws Error if no credentials are configured
   */
  requireAuth(): void {
    if (!this.hasCredentials()) {
      throw new Error(
        'Authentication required. Provide apiKey or starkPrivateKey in config.'
      );
    }
  }

  // ===========================================================================
  // IAuthStrategy Implementation
  // ===========================================================================

  /**
   * Sign a request with authentication headers
   *
   * @param request - Request parameters
   * @returns Authenticated request with headers
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
   * Verify authentication credentials
   *
   * @returns true if credentials are valid (or no credentials for public API)
   */
  async verify(): Promise<boolean> {
    // Public API access is always valid (no credentials required)
    // If credentials are provided, verify they're not empty
    if (this.apiKey && this.apiKey.length === 0) {
      return false;
    }
    if (this.starkPrivateKey && this.starkPrivateKey.length === 0) {
      return false;
    }
    return true;
  }

  // ===========================================================================
  // JWT Token Management
  // ===========================================================================

  /**
   * Get current JWT token if valid
   *
   * @returns JWT access token or undefined
   */
  getJWTToken(): string | undefined {
    if (this.jwtToken && this.isTokenValid()) {
      return this.jwtToken.accessToken;
    }
    return undefined;
  }

  /**
   * Set JWT token from authentication response
   *
   * @param jwt - JWT response from Paradex API
   */
  setJWTToken(jwt: ParadexJWT): void {
    this.jwtToken = {
      accessToken: jwt.access_token,
      expiresAt: Date.now() + (jwt.expires_in * 1000),
    };
  }

  /**
   * Clear stored JWT token
   */
  clearJWTToken(): void {
    this.jwtToken = undefined;
  }

  // ===========================================================================
  // Header Generation
  // ===========================================================================

  /**
   * Get authentication headers (without signature)
   *
   * @returns Headers object
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
   * Get full authentication headers for a request
   *
   * @param method - HTTP method
   * @param path - API path
   * @param body - Optional request body
   * @returns Headers object with signature if required
   */
  async getAuthHeaders(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: any
  ): Promise<Record<string, string>> {
    const request = await this.sign({ method, path, body });
    return request.headers || {};
  }

  // ===========================================================================
  // StarkNet Key Management
  // ===========================================================================

  /**
   * Get StarkNet private key
   *
   * @returns Private key or undefined
   */
  getStarkPrivateKey(): string | undefined {
    return this.starkPrivateKey;
  }

  /**
   * Get StarkNet public key derived from private key
   *
   * @returns Public key (address) or undefined
   */
  deriveStarkPublicKey(): string | undefined {
    return this.getAddress();
  }

  // ===========================================================================
  // Private Helper Methods
  // ===========================================================================

  /**
   * Check if current JWT token is valid
   *
   * @returns true if token exists and not expired
   */
  private isTokenValid(): boolean {
    if (!this.jwtToken) {
      return false;
    }

    // Add buffer before expiry
    return Date.now() < this.jwtToken.expiresAt - (PARADEX_JWT_EXPIRY_BUFFER * 1000);
  }

  /**
   * Check if request requires StarkNet signature
   *
   * @param method - HTTP method
   * @param path - API path
   * @returns true if signature required
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
   * Sign request data with StarkNet ECDSA
   *
   * @param request - Request parameters
   * @returns Signature in format "0x{r},0x{s}"
   *
   * @throws {Error} If StarkNet private key not available
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
   * Create message for StarkNet signing
   *
   * @param request - Request parameters
   * @param timestamp - Request timestamp
   * @returns Message string to sign
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
      this.logger.error('Failed to derive StarkNet address', error instanceof Error ? error : undefined);
      return undefined;
    }
  }
}
