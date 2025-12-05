/**
 * Nado Authentication & Signing Strategy
 *
 * Centralizes EIP-712 signature logic for Nado DEX operations.
 * Handles nonce management and domain construction.
 *
 * @see https://docs.nado.xyz/developer-resources/api/gateway/signing
 */

import { Wallet, ethers } from 'ethers';
import type {
  NadoEIP712Order,
  NadoEIP712Cancellation,
  NadoEIP712StreamAuth,
} from './types.js';
import { NADO_EIP712_DOMAIN } from './constants.js';
import { PerpDEXError } from '../../types/errors.js';

/**
 * EIP-712 Domain Structure
 */
interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

/**
 * EIP-712 Order Type Definitions
 */
const EIP712_ORDER_TYPES = {
  Order: [
    { name: 'sender', type: 'address' },
    { name: 'priceX18', type: 'uint256' },
    { name: 'amount', type: 'uint256' },
    { name: 'expiration', type: 'uint64' },
    { name: 'nonce', type: 'uint64' },
    { name: 'appendix', type: 'OrderAppendix' },
  ],
  OrderAppendix: [
    { name: 'productId', type: 'uint32' },
    { name: 'side', type: 'uint8' },
    { name: 'reduceOnly', type: 'bool' },
    { name: 'postOnly', type: 'bool' },
  ],
};

/**
 * EIP-712 Cancellation Type Definitions
 */
const EIP712_CANCELLATION_TYPES = {
  Cancellation: [
    { name: 'sender', type: 'address' },
    { name: 'productIds', type: 'uint32[]' },
    { name: 'digests', type: 'bytes32[]' },
    { name: 'nonce', type: 'uint64' },
  ],
};

/**
 * EIP-712 Stream Authentication Type Definitions
 */
const EIP712_STREAM_AUTH_TYPES = {
  StreamAuthentication: [
    { name: 'sender', type: 'address' },
    { name: 'expiration', type: 'uint64' },
  ],
};

/**
 * Nado Authentication Strategy
 *
 * Provides EIP-712 signing and nonce management for Nado DEX operations.
 *
 * @example
 * ```typescript
 * const auth = new NadoAuth(wallet, 763373); // Ink testnet
 *
 * // Sign an order
 * const signature = await auth.signOrder(orderData, productId);
 *
 * // Manage nonce
 * const nonce = auth.getNextNonce();
 * ```
 */
export class NadoAuth {
  private wallet: Wallet;
  private chainId: number;
  private currentNonce: number = 0;

  /**
   * Creates a new NadoAuth instance
   *
   * @param wallet - ethers.Wallet instance for signing
   * @param chainId - Nado chain ID (57073 mainnet, 763373 testnet)
   */
  constructor(wallet: Wallet, chainId: number) {
    this.wallet = wallet;
    this.chainId = chainId;
  }

  // ===========================================================================
  // Public Signing Methods
  // ===========================================================================

  /**
   * Sign an EIP-712 order for Nado
   *
   * @param order - Order data to sign
   * @param productId - Product ID for verifying contract derivation
   * @returns EIP-712 signature (0x-prefixed hex string)
   *
   * @throws {PerpDEXError} If signing fails
   *
   * @example
   * ```typescript
   * const order: NadoEIP712Order = {
   *   sender: wallet.address,
   *   priceX18: '80000000000000000000000',
   *   amount: '10000000000000000',
   *   expiration: nowInSeconds() + 3600,
   *   nonce: auth.getNextNonce(),
   *   appendix: {
   *     productId: 2,
   *     side: 0, // buy
   *     reduceOnly: false,
   *     postOnly: true,
   *   },
   * };
   *
   * const signature = await auth.signOrder(order, 2);
   * ```
   */
  async signOrder(order: NadoEIP712Order, productId: number): Promise<string> {
    try {
      const verifyingContract = this.productIdToVerifyingContract(productId);
      const domain = this.createDomain(verifyingContract);

      return await this.wallet.signTypedData(domain, EIP712_ORDER_TYPES, order);
    } catch (error) {
      throw new PerpDEXError(
        `Failed to sign order: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SIGNING_FAILED',
        'nado',
        error
      );
    }
  }

  /**
   * Sign an EIP-712 cancellation for Nado
   *
   * @param cancellation - Cancellation data to sign
   * @param endpointAddress - Nado endpoint contract address
   * @returns EIP-712 signature (0x-prefixed hex string)
   *
   * @throws {PerpDEXError} If signing fails
   *
   * @example
   * ```typescript
   * const cancellation: NadoEIP712Cancellation = {
   *   sender: wallet.address,
   *   productIds: [2, 3],
   *   digests: ['0x...', '0x...'],
   *   nonce: auth.getNextNonce(),
   * };
   *
   * const signature = await auth.signCancellation(
   *   cancellation,
   *   contractsInfo.endpoint_address
   * );
   * ```
   */
  async signCancellation(
    cancellation: NadoEIP712Cancellation,
    endpointAddress: string
  ): Promise<string> {
    try {
      const domain = this.createDomain(endpointAddress);

      return await this.wallet.signTypedData(domain, EIP712_CANCELLATION_TYPES, cancellation);
    } catch (error) {
      throw new PerpDEXError(
        `Failed to sign cancellation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SIGNING_FAILED',
        'nado',
        error
      );
    }
  }

  /**
   * Sign an EIP-712 stream authentication for Nado WebSocket
   *
   * @param streamAuth - Stream auth data to sign
   * @param endpointAddress - Nado endpoint contract address
   * @returns EIP-712 signature (0x-prefixed hex string)
   *
   * @throws {PerpDEXError} If signing fails
   *
   * @example
   * ```typescript
   * const streamAuth: NadoEIP712StreamAuth = {
   *   sender: wallet.address,
   *   expiration: nowInSeconds() + 3600, // 1 hour
   * };
   *
   * const signature = await auth.signStreamAuth(
   *   streamAuth,
   *   contractsInfo.endpoint_address
   * );
   * ```
   */
  async signStreamAuth(
    streamAuth: NadoEIP712StreamAuth,
    endpointAddress: string
  ): Promise<string> {
    try {
      const domain = this.createDomain(endpointAddress);

      return await this.wallet.signTypedData(domain, EIP712_STREAM_AUTH_TYPES, streamAuth);
    } catch (error) {
      throw new PerpDEXError(
        `Failed to sign stream auth: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SIGNING_FAILED',
        'nado',
        error
      );
    }
  }

  // ===========================================================================
  // Nonce Management
  // ===========================================================================

  /**
   * Get the current nonce without incrementing
   *
   * @returns Current nonce value
   */
  getCurrentNonce(): number {
    return this.currentNonce;
  }

  /**
   * Get the next nonce and increment the counter
   *
   * @returns Next nonce value (before increment)
   *
   * @example
   * ```typescript
   * const nonce1 = auth.getNextNonce(); // 0
   * const nonce2 = auth.getNextNonce(); // 1
   * const nonce3 = auth.getNextNonce(); // 2
   * ```
   */
  getNextNonce(): number {
    return this.currentNonce++;
  }

  /**
   * Set the nonce to a specific value
   *
   * Useful for synchronizing with on-chain nonce or recovering from errors.
   *
   * @param nonce - New nonce value
   *
   * @example
   * ```typescript
   * // Sync with on-chain nonce
   * const onChainNonce = await fetchNonceFromAPI();
   * auth.setNonce(onChainNonce);
   * ```
   */
  setNonce(nonce: number): void {
    if (nonce < 0 || !Number.isInteger(nonce)) {
      throw new PerpDEXError('Nonce must be a non-negative integer', 'INVALID_NONCE', 'nado');
    }

    this.currentNonce = nonce;
  }

  /**
   * Increment nonce by a specific amount
   *
   * @param amount - Amount to increment (default: 1)
   */
  incrementNonce(amount: number = 1): void {
    if (amount < 0 || !Number.isInteger(amount)) {
      throw new PerpDEXError('Increment amount must be a non-negative integer', 'INVALID_NONCE', 'nado');
    }

    this.currentNonce += amount;
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  /**
   * Get wallet address
   *
   * @returns Wallet address (0x-prefixed)
   */
  getAddress(): string {
    return this.wallet.address;
  }

  /**
   * Get chain ID
   *
   * @returns Nado chain ID
   */
  getChainId(): number {
    return this.chainId;
  }

  // ===========================================================================
  // Private Helper Methods
  // ===========================================================================

  /**
   * Create EIP-712 domain for Nado
   *
   * @param verifyingContract - Contract address for domain
   * @returns EIP-712 domain object
   */
  private createDomain(verifyingContract: string): EIP712Domain {
    return {
      name: NADO_EIP712_DOMAIN.name,
      version: NADO_EIP712_DOMAIN.version,
      chainId: this.chainId,
      verifyingContract,
    };
  }

  /**
   * Convert product ID to verifying contract address
   *
   * Nado uses a special encoding where product ID is embedded in the last 8 bytes
   * of a 20-byte address.
   *
   * @param productId - Nado product ID
   * @returns Verifying contract address (0x-prefixed hex)
   *
   * @example
   * ```typescript
   * // Product ID 2 -> 0x0000000000000000000000000000000000000002
   * const contract = productIdToVerifyingContract(2);
   * ```
   */
  private productIdToVerifyingContract(productId: number): string {
    if (productId < 0 || !Number.isInteger(productId)) {
      throw new PerpDEXError(
        `Invalid product ID: ${productId}`,
        'INVALID_PRODUCT_ID',
        'nado'
      );
    }

    // Cross-platform compatible: use ethers instead of Buffer
    return ethers.zeroPadValue(ethers.toBeHex(productId), 20);
  }
}
