/**
 * Lighter Authentication Strategy
 *
 * Implements IAuthStrategy for Lighter exchange.
 * Supports two authentication modes:
 * 1. FFI mode: Native library signing for full trading
 * 2. HMAC mode: HMAC-SHA256 for legacy/read-only operations
 */

import { createHmacSha256 } from '../../utils/crypto.js';
import type { IAuthStrategy, RequestParams, AuthenticatedRequest } from '../../types/adapter.js';
import { LighterSigner } from './signer/index.js';
import { NonceManager } from './NonceManager.js';
import type { HTTPClient } from '../../core/http/HTTPClient.js';

/**
 * Lighter authentication configuration
 */
export interface LighterAuthConfig {
  // FFI auth (native signing)
  apiPrivateKey?: string;
  apiPublicKey?: string;
  accountIndex?: number;
  apiKeyIndex?: number;
  chainId?: number;
  nativeLibraryPath?: string;

  // HMAC auth (legacy)
  apiKey?: string;
  apiSecret?: string;

  // HTTP client for nonce management
  httpClient?: HTTPClient;
}

/**
 * Authentication mode
 */
export type AuthMode = 'ffi' | 'hmac' | 'none';

/**
 * Lighter Authentication Strategy
 *
 * Provides flexible authentication supporting both FFI-based native signing
 * and HMAC-based authentication.
 *
 * @example
 * ```typescript
 * // FFI mode
 * const auth = new LighterAuth({
 *   apiPrivateKey: '0x...',
 *   chainId: 300,
 *   httpClient: client,
 * });
 * await auth.initialize();
 *
 * // HMAC mode
 * const authHmac = new LighterAuth({
 *   apiKey: 'key',
 *   apiSecret: 'secret',
 * });
 * ```
 */
export class LighterAuth implements IAuthStrategy {
  private readonly config: LighterAuthConfig;
  private signer: LighterSigner | null = null;
  private nonceManager: NonceManager | null = null;
  private authToken: string | null = null;
  private authTokenExpiry = 0;
  private initialized = false;

  /** Token validity duration in seconds */
  private static readonly TOKEN_DURATION = 3600;
  /** Refresh token before expiry (seconds) */
  private static readonly TOKEN_REFRESH_BUFFER = 300;

  constructor(config: LighterAuthConfig) {
    this.config = config;
  }

  /**
   * Get the current authentication mode
   */
  get mode(): AuthMode {
    if (this.config.apiPrivateKey) {
      return 'ffi';
    }
    if (this.config.apiKey && this.config.apiSecret) {
      return 'hmac';
    }
    return 'none';
  }

  /**
   * Check if authentication is configured
   */
  get isConfigured(): boolean {
    return this.mode !== 'none';
  }

  /**
   * Check if FFI signing is available
   */
  get hasFFISigning(): boolean {
    return this.signer !== null && this.signer.isInitialized;
  }

  /**
   * Get the API key index (for FFI mode)
   */
  get apiKeyIndex(): number {
    return this.config.apiKeyIndex ?? 255;
  }

  /**
   * Get the account index (for FFI mode)
   */
  get accountIndex(): number {
    return this.config.accountIndex ?? 0;
  }

  /**
   * Initialize the authentication strategy
   *
   * For FFI mode, initializes the native signer and nonce manager.
   * For HMAC mode, no initialization is required.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.mode === 'ffi' && this.config.apiPrivateKey) {
      // Initialize FFI signer
      this.signer = new LighterSigner({
        apiPrivateKey: this.config.apiPrivateKey,
        apiPublicKey: this.config.apiPublicKey,
        accountIndex: this.config.accountIndex,
        apiKeyIndex: this.config.apiKeyIndex,
        chainId: this.config.chainId ?? 300,
        libraryPath: this.config.nativeLibraryPath,
      });

      try {
        await this.signer.initialize();
      } catch (error) {
        // FFI initialization failed, disable FFI mode
        console.warn('FFI signer initialization failed:', error);
        this.signer = null;
      }

      // Initialize nonce manager if HTTP client is available
      if (this.config.httpClient) {
        this.nonceManager = new NonceManager({
          httpClient: this.config.httpClient,
          apiKeyIndex: this.config.apiKeyIndex ?? 255,
        });
      }
    }

    this.initialized = true;
  }

  /**
   * Sign a request with appropriate authentication
   *
   * For FFI mode with POST/DELETE trading requests, uses auth token.
   * For HMAC mode, adds HMAC signature headers.
   */
  async sign(request: RequestParams): Promise<AuthenticatedRequest> {
    const headers: Record<string, string> = {};

    if (this.hasFFISigning) {
      // FFI mode: use auth token
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } else if (this.mode === 'hmac' && this.config.apiKey && this.config.apiSecret) {
      // HMAC mode
      const timestamp = (request.timestamp ?? Date.now()).toString();
      const signature = await this.generateHmacSignature(
        request.method,
        request.path,
        timestamp,
        request.body as Record<string, unknown> | undefined
      );
      headers['X-API-KEY'] = this.config.apiKey;
      headers['X-TIMESTAMP'] = timestamp;
      headers['X-SIGNATURE'] = signature;
    }

    return {
      ...request,
      headers,
    };
  }

  /**
   * Get authentication headers
   *
   * Returns cached auth headers. For dynamic headers, use sign() instead.
   */
  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.authToken && Date.now() / 1000 < this.authTokenExpiry) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    } else if (this.config.apiKey) {
      headers['X-API-KEY'] = this.config.apiKey;
    }

    return headers;
  }

  /**
   * Refresh authentication (refresh auth token for FFI mode)
   */
  async refresh(): Promise<void> {
    if (this.hasFFISigning) {
      await this.refreshAuthToken();
    }
  }

  /**
   * Get or create an auth token (FFI mode only)
   */
  async getAuthToken(): Promise<string | null> {
    if (!this.signer || !this.signer.isInitialized) {
      return null;
    }

    const now = Date.now() / 1000;

    // Check if token needs refresh
    if (!this.authToken || now >= this.authTokenExpiry - LighterAuth.TOKEN_REFRESH_BUFFER) {
      await this.refreshAuthToken();
    }

    return this.authToken;
  }

  /**
   * Refresh the auth token
   */
  private async refreshAuthToken(): Promise<void> {
    if (!this.signer || !this.signer.isInitialized) {
      return;
    }

    try {
      this.authToken = await this.signer.createAuthToken(LighterAuth.TOKEN_DURATION);
      this.authTokenExpiry = Date.now() / 1000 + LighterAuth.TOKEN_DURATION;
    } catch (error) {
      console.warn('Failed to refresh auth token:', error);
      this.authToken = null;
      this.authTokenExpiry = 0;
    }
  }

  /**
   * Generate HMAC-SHA256 signature
   * Note: This is now async to support browser Web Crypto API
   */
  private async generateHmacSignature(
    method: string,
    path: string,
    timestamp: string,
    body?: Record<string, unknown>
  ): Promise<string> {
    const message = `${timestamp}${method}${path}${body ? JSON.stringify(body) : ''}`;
    return createHmacSha256(this.config.apiSecret!, message);
  }

  /**
   * Get the signer instance (for advanced usage)
   */
  getSigner(): LighterSigner | null {
    return this.signer;
  }

  /**
   * Get the nonce manager (for advanced usage)
   */
  getNonceManager(): NonceManager | null {
    return this.nonceManager;
  }

  /**
   * Get next nonce for transaction signing
   */
  async getNextNonce(): Promise<bigint> {
    if (!this.nonceManager) {
      throw new Error('Nonce manager not initialized. Provide httpClient in config.');
    }
    return this.nonceManager.getNextNonce();
  }

  /**
   * Reset nonce (call after transaction failures)
   */
  resetNonce(): void {
    this.nonceManager?.reset();
  }

  /**
   * Rollback nonce by one (call when transaction not submitted)
   */
  rollbackNonce(): void {
    this.nonceManager?.rollback();
  }

  /**
   * Sync nonce with server
   */
  async syncNonce(): Promise<void> {
    await this.nonceManager?.sync();
  }
}
