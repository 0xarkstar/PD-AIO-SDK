/**
 * Hyperliquid Authentication Strategy
 *
 * Implements EIP-712 signing for Hyperliquid exchange
 */

import { ethers } from 'ethers';
import type { AuthenticatedRequest, IAuthStrategy, RequestParams } from '../../types/index.js';
import { HYPERLIQUID_EIP712_DOMAIN, HYPERLIQUID_ACTION_TYPES } from './constants.js';
import type { HyperliquidAction, HyperliquidSignedAction } from './types.js';

export class HyperliquidAuth implements IAuthStrategy {
  private nonce: number = Date.now();

  constructor(private readonly wallet: ethers.Wallet) {}

  /**
   * Sign a request with EIP-712 signature
   */
  async sign(request: RequestParams): Promise<AuthenticatedRequest> {
    if (!request.body) {
      // Public endpoints don't need signing
      return {
        ...request,
        headers: this.getHeaders(),
      };
    }

    // Extract action from request body
    const action = request.body as HyperliquidAction;

    // Create signed action
    const signedAction = await this.signAction(action);

    return {
      ...request,
      body: signedAction,
      headers: this.getHeaders(),
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
   * Sign an action using EIP-712
   */
  private async signAction(action: HyperliquidAction): Promise<HyperliquidSignedAction> {
    // Increment nonce
    this.nonce++;

    // Create connection ID (phantom agent)
    const connectionId = ethers.keccak256(
      ethers.solidityPacked(['address'], [this.wallet.address])
    );

    // EIP-712 typed data for phantom agent
    const typedData = {
      domain: HYPERLIQUID_EIP712_DOMAIN,
      types: HYPERLIQUID_ACTION_TYPES,
      primaryType: 'Agent',
      message: {
        source: 'a', // 'a' for API
        connectionId,
      },
    };

    // Sign the typed data
    const signature = await this.wallet.signTypedData(
      typedData.domain,
      { Agent: typedData.types.Agent },
      typedData.message
    );

    // Parse signature into r, s, v components
    const sig = ethers.Signature.from(signature);

    return {
      action,
      nonce: this.nonce,
      signature: {
        r: sig.r,
        s: sig.s,
        v: sig.v,
      },
    };
  }

  /**
   * Get wallet address
   */
  getAddress(): string {
    return this.wallet.address;
  }

  /**
   * Create connection ID for WebSocket authentication
   */
  getConnectionId(): string {
    return ethers.keccak256(ethers.solidityPacked(['address'], [this.wallet.address]));
  }
}
