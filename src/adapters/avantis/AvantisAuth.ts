/**
 * Avantis Authentication Strategy
 *
 * Avantis uses direct wallet signing for on-chain transactions.
 * Unlike EIP-712 exchanges, Avantis just needs wallet.sendTransaction.
 */

import { ethers } from 'ethers';
import type { AuthenticatedRequest, IAuthStrategy, RequestParams } from '../../types/index.js';

export class AvantisAuth implements IAuthStrategy {
  private readonly wallet: ethers.Wallet;
  private readonly provider: ethers.JsonRpcProvider;

  constructor(privateKey: string, rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
  }

  /**
   * Sign a request (no-op for on-chain DEX, signing happens at tx level)
   */
  async sign(request: RequestParams): Promise<AuthenticatedRequest> {
    return {
      ...request,
      headers: this.getHeaders(),
    };
  }

  /**
   * Get headers (not used for on-chain interactions)
   */
  getHeaders(): Record<string, string> {
    return {};
  }

  /**
   * Get the connected wallet instance for sending transactions
   */
  getWallet(): ethers.Wallet {
    return this.wallet;
  }

  /**
   * Get the JSON-RPC provider
   */
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  /**
   * Get wallet address
   */
  getAddress(): string {
    return this.wallet.address;
  }

  /**
   * Get current nonce for the wallet
   */
  async getNonce(): Promise<number> {
    return this.provider.getTransactionCount(this.wallet.address, 'pending');
  }
}
