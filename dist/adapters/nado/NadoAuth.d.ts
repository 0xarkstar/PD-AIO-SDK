/**
 * Nado Authentication & Signing Strategy
 *
 * Centralizes EIP-712 signature logic for Nado DEX operations.
 * Handles nonce management and domain construction.
 *
 * @see https://docs.nado.xyz/developer-resources/api/gateway/signing
 */
import { Wallet } from 'ethers';
import type { NadoEIP712Order, NadoEIP712Cancellation, NadoEIP712StreamAuth } from './types.js';
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
export declare class NadoAuth {
    private wallet;
    private chainId;
    private currentNonce;
    /**
     * Creates a new NadoAuth instance
     *
     * @param wallet - ethers.Wallet instance for signing
     * @param chainId - Nado chain ID (57073 mainnet, 763373 testnet)
     */
    constructor(wallet: Wallet, chainId: number);
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
    signOrder(order: NadoEIP712Order, productId: number): Promise<string>;
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
     *   contractsInfo.endpoint_addr
     * );
     * ```
     */
    signCancellation(cancellation: NadoEIP712Cancellation, endpointAddress: string): Promise<string>;
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
     *   contractsInfo.endpoint_addr
     * );
     * ```
     */
    signStreamAuth(streamAuth: NadoEIP712StreamAuth, endpointAddress: string): Promise<string>;
    /**
     * Get the current nonce without incrementing
     *
     * @returns Current nonce value as bigint
     */
    getCurrentNonce(): bigint;
    /**
     * Get the next nonce and increment the counter
     *
     * @returns Next nonce value (before increment) as bigint
     *
     * @example
     * ```typescript
     * const nonce1 = auth.getNextNonce(); // 0n
     * const nonce2 = auth.getNextNonce(); // 1n
     * const nonce3 = auth.getNextNonce(); // 2n
     * ```
     */
    getNextNonce(): bigint;
    /**
     * Set the nonce to a specific value
     *
     * Useful for synchronizing with on-chain nonce or recovering from errors.
     * Accepts bigint, number, or string representation of the nonce.
     *
     * @param nonce - New nonce value (bigint, number, or string)
     *
     * @example
     * ```typescript
     * // Sync with on-chain nonce (from API as string)
     * const onChainNonce = await fetchNonceFromAPI();
     * auth.setNonce(onChainNonce); // "1854600042563764224"
     * ```
     */
    setNonce(nonce: bigint | number | string): void;
    /**
     * Increment nonce by a specific amount
     *
     * @param amount - Amount to increment (default: 1n)
     */
    incrementNonce(amount?: bigint | number): void;
    /**
     * Get wallet address
     *
     * @returns Wallet address (0x-prefixed)
     */
    getAddress(): string;
    /**
     * Get chain ID
     *
     * @returns Nado chain ID
     */
    getChainId(): number;
    /**
     * Create EIP-712 domain for Nado
     *
     * @param verifyingContract - Contract address for domain
     * @returns EIP-712 domain object
     */
    private createDomain;
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
    private productIdToVerifyingContract;
}
//# sourceMappingURL=NadoAuth.d.ts.map