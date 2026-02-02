/**
 * Paradex Paraclear Wrapper
 *
 * Integrates @paradex/sdk for Paraclear (withdrawal) operations.
 * Paraclear is Paradex's on-chain settlement layer built on StarkNet.
 *
 * Features:
 * - Account derivation from Ethereum signer
 * - Token balance queries
 * - Socialized loss calculations
 * - Withdrawal operations
 *
 * @see https://docs.paradex.trade/paraclear
 */
import type { ParadexConfig as SDKParadexConfig } from '@paradex/sdk/dist/config.js';
import type { Account as SDKAccount } from '@paradex/sdk/dist/account.js';
/**
 * Configuration for ParaclearWrapper
 */
export interface ParadexParaclearWrapperConfig {
    testnet?: boolean;
}
/**
 * Paradex Paraclear Wrapper
 *
 * Provides withdrawal and balance query functionality via Paradex SDK
 *
 * @example
 * ```typescript
 * const paraclear = new ParadexParaclearWrapper({ testnet: true });
 *
 * // Initialize with Ethereum signer
 * await paraclear.initializeAccount(ethersSigner);
 *
 * // Check balance
 * const balance = await paraclear.getTokenBalance('USDC');
 *
 * // Withdraw
 * const tx = await paraclear.withdraw('USDC', '100.0', bridgeAddress);
 * console.log('Transaction:', tx.transactionHash);
 * ```
 */
export declare class ParadexParaclearWrapper {
    private account?;
    private config?;
    private provider?;
    private readonly testnet;
    constructor(config?: ParadexParaclearWrapperConfig);
    /**
     * Initialize Paraclear account from Ethereum signer
     *
     * @param ethersSigner - Ethers.js signer (v5 or v6)
     * @returns void
     *
     * @throws {PerpDEXError} If initialization fails
     *
     * @example
     * ```typescript
     * import { ethers } from 'ethers';
     *
     * const wallet = new ethers.Wallet(privateKey);
     * await paraclear.initializeAccount(wallet);
     * ```
     */
    initializeAccount(ethersSigner: any): Promise<void>;
    /**
     * Get Paraclear account
     *
     * @returns Account or undefined if not initialized
     */
    getAccount(): SDKAccount | undefined;
    /**
     * Get token balance from Paraclear
     *
     * @param token - Token symbol (e.g., "USDC", "ETH")
     * @returns Balance as decimal string
     *
     * @throws {PerpDEXError} If account not initialized or query fails
     *
     * @example
     * ```typescript
     * const balance = await paraclear.getTokenBalance('USDC');
     * console.log('Balance:', balance); // "1000.45"
     * ```
     */
    getTokenBalance(token: string): Promise<string>;
    /**
     * Get all token balances
     *
     * @returns Record of token symbol to balance
     *
     * @throws {PerpDEXError} If account not initialized
     *
     * @example
     * ```typescript
     * const balances = await paraclear.getAllBalances();
     * // { "USDC": "1000.45", "ETH": "0.5" }
     * ```
     */
    getAllBalances(): Promise<Record<string, string>>;
    /**
     * Check socialized loss status
     *
     * Socialized losses occur when Paradex Insurance Fund is bankrupt.
     * When active, withdrawals receive less than the requested amount.
     *
     * @returns Socialized loss factor (0 if not active)
     *
     * @throws {PerpDEXError} If query fails
     *
     * @example
     * ```typescript
     * const { active, factor } = await paraclear.checkSocializedLoss();
     * if (active) {
     *   console.log('Loss factor:', factor); // "0.05" = 5%
     * }
     * ```
     */
    checkSocializedLoss(): Promise<{
        active: boolean;
        factor: string;
    }>;
    /**
     * Calculate receivable amount after socialized loss
     *
     * @param token - Token symbol
     * @param amount - Requested withdrawal amount (decimal string)
     * @returns Receivable amount and loss factor
     *
     * @throws {PerpDEXError} If calculation fails
     *
     * @example
     * ```typescript
     * const result = await paraclear.calculateReceivableAmount('USDC', '100.0');
     * console.log('Will receive:', result.receivableAmount); // "95.0" if 5% loss
     * console.log('Loss:', result.socializedLoss); // "0.05"
     * ```
     */
    calculateReceivableAmount(token: string, amount: string): Promise<{
        receivableAmount: string;
        receivableAmountChain: string;
        socializedLoss: string;
    }>;
    /**
     * Withdraw funds from Paraclear
     *
     * IMPORTANT: This creates an on-chain transaction on StarkNet.
     * You must provide a bridge call to transfer funds to L1.
     *
     * @param token - Token symbol
     * @param amount - Amount to withdraw (decimal string)
     * @param bridgeCall - StarkNet bridge call (or multiple calls)
     * @returns Transaction hash and receivable amount
     *
     * @throws {PerpDEXError} If withdrawal fails
     *
     * @example
     * ```typescript
     * import * as Starknet from 'starknet';
     *
     * // Calculate receivable amount first
     * const { receivableAmountChain } = await paraclear.calculateReceivableAmount(
     *   'USDC',
     *   '100.0'
     * );
     *
     * // Create bridge call
     * const bridgeCall: Starknet.Call = {
     *   contractAddress: config.bridgedTokens['USDC'].l2BridgeAddress,
     *   entrypoint: 'initiate_withdraw',
     *   calldata: [
     *     recipientAddress,
     *     receivableAmountChain,
     *     '0', // Amount high (for uint256)
     *   ],
     * };
     *
     * // Execute withdrawal
     * const tx = await paraclear.withdraw('USDC', '100.0', bridgeCall);
     * console.log('TX Hash:', tx.transactionHash);
     * ```
     */
    withdraw(token: string, amount: string, bridgeCall: any): Promise<{
        transactionHash: string;
        receivableAmount: string;
    }>;
    /**
     * Check if account is initialized
     *
     * @throws {PerpDEXError} If not initialized
     */
    private ensureInitialized;
    /**
     * Get Paradex configuration
     *
     * @returns Config or undefined if not initialized
     */
    getConfig(): SDKParadexConfig | undefined;
    /**
     * Check if account is initialized
     *
     * @returns true if initialized
     */
    isInitialized(): boolean;
}
//# sourceMappingURL=ParadexParaclearWrapper.d.ts.map