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
import { Config, Account, Signer, ParaclearProvider, Paraclear } from '@paradex/sdk';
import { PerpDEXError } from '../../types/errors.js';
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
export class ParadexParaclearWrapper {
    account;
    config;
    provider;
    testnet;
    constructor(config = {}) {
        this.testnet = config.testnet ?? false;
    }
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
    async initializeAccount(ethersSigner) {
        try {
            // Fetch Paradex config for the environment
            const env = this.testnet ? 'testnet' : 'prod';
            this.config = await Config.fetchConfig(env);
            // Create Ethereum signer adapter
            const signer = Signer.ethersSignerAdapter(ethersSigner);
            // Create Paraclear provider
            // Note: SDK type definitions may be inconsistent, using type assertion
            this.provider = new ParaclearProvider.DefaultProvider(this.config.paradexFullNodeRpcUrl);
            // Derive Paradex account from Ethereum signer
            this.account = await Account.fromEthSigner({
                provider: this.provider, // Safe: just created above
                config: this.config,
                signer,
            });
        }
        catch (error) {
            throw new PerpDEXError(`Failed to initialize Paraclear account: ${error instanceof Error ? error.message : String(error)}`, 'PARACLEAR_INIT_ERROR', 'paradex', error);
        }
    }
    /**
     * Get Paraclear account
     *
     * @returns Account or undefined if not initialized
     */
    getAccount() {
        return this.account;
    }
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
    async getTokenBalance(token) {
        this.ensureInitialized();
        try {
            const result = await Paraclear.getTokenBalance({
                config: this.config,
                provider: this.provider,
                account: this.account,
                token,
            });
            return result.size;
        }
        catch (error) {
            throw new PerpDEXError(`Failed to get token balance for ${token}: ${error instanceof Error ? error.message : String(error)}`, 'PARACLEAR_BALANCE_ERROR', 'paradex', error);
        }
    }
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
    async getAllBalances() {
        this.ensureInitialized();
        const balances = {};
        try {
            // Get supported tokens from config
            const tokens = Object.keys(this.config.bridgedTokens);
            // Query balance for each token
            for (const token of tokens) {
                const balance = await this.getTokenBalance(token);
                balances[token] = balance;
            }
            return balances;
        }
        catch (error) {
            throw new PerpDEXError(`Failed to get all balances: ${error instanceof Error ? error.message : String(error)}`, 'PARACLEAR_BALANCE_ERROR', 'paradex', error);
        }
    }
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
    async checkSocializedLoss() {
        this.ensureInitialized();
        try {
            const result = await Paraclear.getSocializedLossFactor({
                config: this.config,
                provider: this.provider,
            });
            const factor = parseFloat(result.socializedLossFactor);
            return {
                active: factor > 0,
                factor: result.socializedLossFactor,
            };
        }
        catch (error) {
            throw new PerpDEXError(`Failed to check socialized loss: ${error instanceof Error ? error.message : String(error)}`, 'PARACLEAR_SOCIALIZED_LOSS_ERROR', 'paradex', error);
        }
    }
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
    async calculateReceivableAmount(token, amount) {
        this.ensureInitialized();
        try {
            const result = await Paraclear.getReceivableAmount({
                config: this.config,
                provider: this.provider,
                token,
                amount,
            });
            return {
                receivableAmount: result.receivableAmount,
                receivableAmountChain: result.receivableAmountChain,
                socializedLoss: result.socializedLossFactor,
            };
        }
        catch (error) {
            throw new PerpDEXError(`Failed to calculate receivable amount: ${error instanceof Error ? error.message : String(error)}`, 'PARACLEAR_CALCULATION_ERROR', 'paradex', error);
        }
    }
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
    async withdraw(token, amount, bridgeCall) {
        this.ensureInitialized();
        try {
            // Get receivable amount first
            const receivableInfo = await this.calculateReceivableAmount(token, amount);
            // Execute withdrawal transaction
            const result = await Paraclear.withdraw({
                config: this.config,
                account: this.account,
                token,
                amount,
                bridgeCall,
            });
            return {
                transactionHash: result.hash,
                receivableAmount: receivableInfo.receivableAmount,
            };
        }
        catch (error) {
            throw new PerpDEXError(`Failed to withdraw ${amount} ${token}: ${error instanceof Error ? error.message : String(error)}`, 'PARACLEAR_WITHDRAWAL_ERROR', 'paradex', error);
        }
    }
    /**
     * Check if account is initialized
     *
     * @throws {PerpDEXError} If not initialized
     */
    ensureInitialized() {
        if (!this.account || !this.config || !this.provider) {
            throw new PerpDEXError('Paraclear account not initialized. Call initializeAccount() first.', 'PARACLEAR_NOT_INITIALIZED', 'paradex');
        }
    }
    /**
     * Get Paradex configuration
     *
     * @returns Config or undefined if not initialized
     */
    getConfig() {
        return this.config;
    }
    /**
     * Check if account is initialized
     *
     * @returns true if initialized
     */
    isInitialized() {
        return !!(this.account && this.config && this.provider);
    }
}
//# sourceMappingURL=ParadexParaclearWrapper.js.map