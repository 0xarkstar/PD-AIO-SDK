/**
 * GRVT authentication strategy (cookie-session).
 *
 * Ground-truthed 2026-05-26. GRVT does NOT use per-request HMAC/message signing.
 * Authentication is a cookie session:
 *   1. `POST {edge}/auth/api_key/login {api_key}` -> `Set-Cookie: gravity=...`
 *      + header `X-Grvt-Account-Id` + body `{ sub_account_id, funding_account_address }`.
 *   2. Authed requests send `Cookie: gravity=...` + `X-Grvt-Account-Id: <id>`.
 *   3. Refresh when <5s remain to cookie expiry.
 *
 * Order signing is EIP-712 (leg-based) and is DELEGATED to `signing.ts`
 * (`signOrder`) — this class never re-implements EIP-712. The session itself is
 * owned by `GRVTSDKWrapper` (which performs the login HTTP); this class exposes
 * the wallet + a thin `IAuthStrategy` surface the adapter framework depends on.
 */

import type { Wallet } from 'ethers';
import type { IAuthStrategy, AuthenticatedRequest, RequestParams } from '../../types/adapter.js';
import { GRVT_CHAIN_IDS } from './constants.js';
import { signOrder, generateNonce, generateExpiration } from './signing.js';
import type { GrvtSignOrderInput, GrvtSignature } from './signing.js';
import type { GRVTSession } from './types.js';

/**
 * GRVT authentication configuration.
 */
export interface GRVTAuthConfig {
  /** API key (created in the GRVT UI; required for the cookie-session login). */
  apiKey?: string;
  /** EVM wallet used to sign orders (the sub-account signer). */
  wallet?: Wallet;
  /** Use testnet (chainId 326). */
  testnet?: boolean;
}

/**
 * GRVT cookie-session auth strategy.
 *
 * Implements {@link IAuthStrategy} (`sign` / `getHeaders`) so the adapter
 * framework can plug it in; the internals are cookie-session, not message
 * signing. The session is set by the adapter after `GRVTSDKWrapper.login()`.
 */
export class GRVTAuth implements IAuthStrategy {
  private readonly apiKey?: string;
  private readonly wallet?: Wallet;
  private readonly testnet: boolean;
  private session?: GRVTSession;

  constructor(config: GRVTAuthConfig) {
    this.apiKey = config.apiKey;
    this.wallet = config.wallet;
    this.testnet = config.testnet ?? false;
    // Credentials are optional — public API methods work without auth.
  }

  /**
   * Whether auth credentials are available (an API key is required to log in).
   */
  hasCredentials(): boolean {
    return !!this.apiKey;
  }

  /**
   * Whether a signing wallet is available (required to place orders).
   */
  hasWallet(): boolean {
    return !!this.wallet;
  }

  /**
   * Require authentication for private methods.
   * @throws {Error} if no API key is configured.
   */
  requireAuth(): void {
    if (!this.hasCredentials()) {
      throw new Error('Authentication required. Provide apiKey in config.');
    }
  }

  /**
   * The EIP-712 chain id for the configured environment (326 testnet / 325 mainnet).
   */
  get chainId(): number {
    return this.testnet ? GRVT_CHAIN_IDS.testnet : GRVT_CHAIN_IDS.mainnet;
  }

  /**
   * Attach cookie-session auth headers to a request (IAuthStrategy contract).
   */
  async sign(request: RequestParams): Promise<AuthenticatedRequest> {
    return {
      ...request,
      headers: this.getHeaders(),
    };
  }

  /**
   * Get the cookie-session auth headers. Includes `Cookie: gravity=...` +
   * `X-Grvt-Account-Id` when a live session is present.
   */
  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.session && this.isSessionValid()) {
      headers['Cookie'] = `gravity=${this.session.cookie}`;
      headers['X-Grvt-Account-Id'] = this.session.accountId;
    }
    return headers;
  }

  /**
   * Verify credentials are usable (non-empty API key or a connected wallet).
   */
  async verify(): Promise<boolean> {
    try {
      if (this.apiKey && this.apiKey.length > 0) {
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
   * Store the resolved session (called by the adapter after login).
   */
  setSession(session: GRVTSession): void {
    this.session = session;
  }

  /**
   * The current session, if any.
   */
  getSession(): GRVTSession | undefined {
    return this.session;
  }

  /**
   * Clear the current session.
   */
  clearSession(): void {
    this.session = undefined;
  }

  /**
   * Whether the current session is present and not within the 5s refresh buffer.
   */
  private isSessionValid(): boolean {
    if (!this.session) {
      return false;
    }
    return Date.now() < this.session.expiresAt - 5000;
  }

  /**
   * The signing wallet address, if a wallet is configured.
   */
  getAddress(): string | undefined {
    return this.wallet?.address;
  }

  /**
   * Generate a GRVT order nonce (uint32-safe random; delegates to signing.ts).
   */
  generateNonce(): number {
    return generateNonce();
  }

  /**
   * Generate an order expiration in unix nanoseconds (delegates to signing.ts).
   * @param hoursFromNow hours until expiry (default 24, must stay <= 30 days).
   */
  generateExpiration(hoursFromNow?: number): string {
    return generateExpiration(hoursFromNow);
  }

  /**
   * Sign a GRVT order via the proven leg-based EIP-712 path in `signing.ts`.
   * Fills in the configured chain id when the caller omits it.
   *
   * @throws {Error} if no signing wallet is configured.
   */
  async signOrder(input: Omit<GrvtSignOrderInput, 'chainId'> & { chainId?: number }): Promise<GrvtSignature> {
    if (!this.wallet) {
      throw new Error('Wallet required for signing orders');
    }
    return signOrder(this.wallet, {
      ...input,
      chainId: input.chainId ?? this.chainId,
    });
  }
}
