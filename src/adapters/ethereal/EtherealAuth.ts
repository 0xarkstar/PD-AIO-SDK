/**
 * Ethereal Authentication Strategy
 *
 * Implements EIP-712 signing for Ethereal exchange.
 */

import { ethers } from 'ethers';
import type { AuthenticatedRequest, IAuthStrategy, RequestParams } from '../../types/index.js';
import { ETHEREAL_EIP712_DOMAIN } from './constants.js';

export class EtherealAuth implements IAuthStrategy {
  private nonce: bigint;

  constructor(private readonly wallet: ethers.Wallet) {
    this.nonce = BigInt(Date.now()) * BigInt(1000);
  }

  /**
   * Sign a request with EIP-712 signature
   */
  async sign(request: RequestParams): Promise<AuthenticatedRequest> {
    if (!request.body) {
      return {
        ...request,
        headers: this.getHeaders(),
      };
    }

    return {
      ...request,
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
   * Sign an order action using EIP-712
   */
  async signOrderAction(
    action: Record<string, unknown>
  ): Promise<{ signature: string; nonce: string }> {
    this.nonce++;
    const nonce = this.nonce.toString();

    const domain = {
      ...ETHEREAL_EIP712_DOMAIN,
    };

    const types = {
      Order: [
        { name: 'accountId', type: 'string' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };

    const message = {
      accountId: String((action.accountId as string) ?? ''),
      nonce: BigInt(nonce),
      deadline: BigInt((action.deadline as number) ?? Math.floor(Date.now() / 1000) + 300),
    };

    const signature = await this.wallet.signTypedData(domain, types, message);

    return { signature, nonce };
  }

  /**
   * Sign a cancellation action
   */
  async signCancelAction(
    accountId: string,
    _orderId?: string
  ): Promise<{ signature: string; nonce: string }> {
    this.nonce++;
    const nonce = this.nonce.toString();

    const domain = {
      ...ETHEREAL_EIP712_DOMAIN,
    };

    const types = {
      Cancel: [
        { name: 'accountId', type: 'string' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };

    const message = {
      accountId,
      nonce: BigInt(nonce),
      deadline: BigInt(Math.floor(Date.now() / 1000) + 300),
    };

    const signature = await this.wallet.signTypedData(domain, types, message);

    return { signature, nonce };
  }

  /**
   * Get wallet address
   */
  getAddress(): string {
    return this.wallet.address;
  }

  /**
   * Get next nonce
   */
  getNextNonce(): string {
    this.nonce++;
    return this.nonce.toString();
  }
}
