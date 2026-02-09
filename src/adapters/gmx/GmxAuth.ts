/**
 * GMX v2 Authentication
 *
 * Handles Ethereum wallet authentication for GMX v2 trading.
 * GMX uses on-chain transactions via the ExchangeRouter contract.
 */

import { ethers, type Signer, type Provider } from 'ethers';
import type { IAuthStrategy, RequestParams, AuthenticatedRequest } from '../../types/adapter.js';
import { GMX_API_URLS } from './constants.js';
import type { GmxChain } from './GmxAdapter.js';

/**
 * Configuration for GMX authentication
 */
export interface GmxAuthConfig {
  /** Ethereum private key */
  privateKey?: string;
  /** Pre-configured ethers Wallet instance */
  wallet?: ethers.Wallet;
  /** Wallet address (for read-only operations) */
  walletAddress?: string;
  /** Chain to use */
  chain: GmxChain;
  /** Custom RPC endpoint */
  rpcEndpoint?: string;
}

/**
 * Ethereum wallet authentication for GMX v2
 *
 * GMX v2 uses on-chain Ethereum transactions, so authentication
 * is done via transaction signing rather than API headers.
 *
 * For read operations (positions, balances), only the wallet address is needed.
 * For write operations (trading), the private key/wallet is required for signing.
 */
export class GmxAuth implements IAuthStrategy {
  private readonly wallet?: ethers.Wallet;
  private readonly walletAddress?: string;
  private readonly chain: GmxChain;
  private readonly provider: Provider;
  private readonly rpcEndpoint: string;

  constructor(config: GmxAuthConfig) {
    this.chain = config.chain;
    this.rpcEndpoint = config.rpcEndpoint || GMX_API_URLS[config.chain].rpc;
    this.provider = new ethers.JsonRpcProvider(this.rpcEndpoint);

    if (config.wallet) {
      this.wallet = config.wallet.connect(this.provider);
      this.walletAddress = config.wallet.address;
    } else if (config.privateKey) {
      this.wallet = new ethers.Wallet(config.privateKey, this.provider);
      this.walletAddress = this.wallet.address;
    } else if (config.walletAddress) {
      this.walletAddress = config.walletAddress;
    }
  }

  /**
   * Sign a request (required by IAuthStrategy interface)
   * GMX uses on-chain transaction signing, not HTTP request signing
   */
  async sign(request: RequestParams): Promise<AuthenticatedRequest> {
    // GMX doesn't use HTTP request signing
    // Just return the request with empty headers
    return {
      ...request,
      headers: {},
    };
  }

  /**
   * GMX doesn't use HTTP header authentication
   * All authentication is done via transaction signing
   */
  getHeaders(): Record<string, string> {
    return {};
  }

  /**
   * Sign a message
   */
  async signMessage(message: string): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet required for signing');
    }
    return this.wallet.signMessage(message);
  }

  /**
   * Sign typed data (EIP-712)
   */
  async signTypedData(
    domain: ethers.TypedDataDomain,
    types: Record<string, ethers.TypedDataField[]>,
    value: Record<string, unknown>
  ): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet required for signing');
    }
    return this.wallet.signTypedData(domain, types, value);
  }

  /**
   * Get the wallet address
   */
  getWalletAddress(): string | undefined {
    return this.walletAddress;
  }

  /**
   * Get the wallet instance (for contract interactions)
   */
  getWallet(): ethers.Wallet | undefined {
    return this.wallet;
  }

  /**
   * Get the signer (for contract interactions)
   */
  getSigner(): Signer | undefined {
    return this.wallet;
  }

  /**
   * Get the provider
   */
  getProvider(): Provider {
    return this.provider;
  }

  /**
   * Get the chain
   */
  getChain(): GmxChain {
    return this.chain;
  }

  /**
   * Get chain ID
   */
  getChainId(): number {
    return GMX_API_URLS[this.chain].chainId;
  }

  /**
   * Get RPC endpoint
   */
  getRpcEndpoint(): string {
    return this.rpcEndpoint;
  }

  /**
   * Check if authentication is configured for trading
   */
  canSign(): boolean {
    return this.wallet !== undefined;
  }

  /**
   * Check if authentication is configured for read operations
   */
  canRead(): boolean {
    return this.walletAddress !== undefined;
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(tx: ethers.TransactionRequest): Promise<bigint> {
    return this.provider.estimateGas(tx);
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice || 0n;
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    return this.provider.getBlockNumber();
  }

  /**
   * Wait for a transaction to be confirmed
   */
  async waitForTransaction(
    txHash: string,
    confirmations = 1
  ): Promise<ethers.TransactionReceipt | null> {
    return this.provider.waitForTransaction(txHash, confirmations);
  }

  /**
   * Get ETH balance of wallet
   */
  async getBalance(): Promise<bigint> {
    if (!this.walletAddress) {
      throw new Error('Wallet address required');
    }
    return this.provider.getBalance(this.walletAddress);
  }

  /**
   * Get token balance
   */
  async getTokenBalance(tokenAddress: string): Promise<bigint> {
    if (!this.walletAddress) {
      throw new Error('Wallet address required');
    }

    const erc20Abi = ['function balanceOf(address owner) view returns (uint256)'];
    const contract = new ethers.Contract(tokenAddress, erc20Abi, this.provider);
    return contract.balanceOf!(this.walletAddress) as Promise<bigint>;
  }

  /**
   * Get token allowance
   */
  async getTokenAllowance(tokenAddress: string, spenderAddress: string): Promise<bigint> {
    if (!this.walletAddress) {
      throw new Error('Wallet address required');
    }

    const erc20Abi = ['function allowance(address owner, address spender) view returns (uint256)'];
    const contract = new ethers.Contract(tokenAddress, erc20Abi, this.provider);
    return contract.allowance!(this.walletAddress, spenderAddress) as Promise<bigint>;
  }

  /**
   * Approve token spending
   */
  async approveToken(
    tokenAddress: string,
    spenderAddress: string,
    amount: bigint
  ): Promise<ethers.TransactionResponse> {
    if (!this.wallet) {
      throw new Error('Wallet required for approval');
    }

    const erc20Abi = ['function approve(address spender, uint256 amount) returns (bool)'];
    const contract = new ethers.Contract(tokenAddress, erc20Abi, this.wallet);
    return contract.approve!(spenderAddress, amount) as Promise<ethers.TransactionResponse>;
  }
}

/**
 * Validate Ethereum address format
 */
export function isValidEthereumAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * Validate Ethereum private key format
 */
export function isValidEthereumPrivateKey(key: string): boolean {
  try {
    // Private key should be 32 bytes (64 hex characters)
    const cleanKey = key.startsWith('0x') ? key.slice(2) : key;
    if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
      return false;
    }
    // Try to create a wallet to validate
    new ethers.Wallet(key);
    return true;
  } catch {
    return false;
  }
}
