/**
 * EdgeX Authentication Strategy
 *
 * Implements ECDSA + SHA3 signing for EdgeX exchange
 */

import { createSha3HashBuffer } from '../../utils/crypto.js';
import { ec } from 'starknet';
import type { AuthenticatedRequest, IAuthStrategy, RequestParams } from '../../types/index.js';
import { PerpDEXError } from '../../types/errors.js';

export interface EdgeXAuthConfig {
  /** StarkNet private key for signing */
  starkPrivateKey: string;
}

export class EdgeXAuth implements IAuthStrategy {
  private readonly starkPrivateKey: string;

  constructor(config: EdgeXAuthConfig) {
    this.starkPrivateKey = config.starkPrivateKey;
  }

  /**
   * Sign a request with ECDSA signature using SHA3 hash
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
        'X-edgeX-Api-Timestamp': timestamp,
        'X-edgeX-Api-Signature': signature,
      },
    };
  }

  /**
   * Get authentication headers
   */
  getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Sign request with ECDSA signature using SHA3 hash
   *
   * EdgeX authentication process:
   * 1. Create message: {timestamp}{METHOD}{path}{sorted_params}
   * 2. Hash with SHA3-256
   * 3. Sign with ECDSA using private key
   *
   * @see https://edgex-1.gitbook.io/edgeX-documentation/api/authentication
   */
  async signRequest(
    method: string,
    path: string,
    timestamp: string,
    body?: Record<string, unknown>
  ): Promise<string> {
    try {
      // Parse path and query parameters
      const [basePath, queryString] = path.split('?');

      // Build sorted query parameters
      let sortedParams = '';
      if (queryString) {
        const params = new URLSearchParams(queryString);
        const sortedKeys = Array.from(params.keys()).sort();
        sortedParams = sortedKeys.map(k => `${k}=${params.get(k)}`).join('&');
      } else if (body) {
        const sortedKeys = Object.keys(body).sort();
        sortedParams = sortedKeys.map(k => `${k}=${body[k]}`).join('&');
      }

      // Create message: timestamp + METHOD + path + sorted_params
      const message = `${timestamp}${method.toUpperCase()}${basePath}${sortedParams}`;

      // Hash with SHA3-256 (cross-platform)
      const messageHash = await createSha3HashBuffer(message);

      // Sign with ECDSA using private key
      const signature = ec.starkCurve.sign(messageHash, this.starkPrivateKey);

      // Return signature in hex format
      return `0x${signature.r.toString(16).padStart(64, '0')}${signature.s.toString(16).padStart(64, '0')}`;
    } catch (error) {
      throw new PerpDEXError(
        `Failed to sign request: ${error instanceof Error ? error.message : String(error)}`,
        'SIGNATURE_ERROR',
        'edgex'
      );
    }
  }

  /**
   * Verify if credentials are available
   */
  hasCredentials(): boolean {
    return !!this.starkPrivateKey;
  }
}
