/**
 * Extended StarkNet Client
 *
 * StarkNet blockchain integration for Extended exchange
 * Handles on-chain position tracking and transaction submission
 */
import { Account, RpcProvider, CallData } from 'starknet';
import { EXTENDED_STARKNET_CONFIG } from './constants.js';
import { mapStarkNetError } from './error-codes.js';
import { formatStarkNetAddress, isValidStarkNetAddress } from './utils.js';
import { Logger } from '../../core/logger.js';
/**
 * StarkNet client for Extended exchange
 */
export class ExtendedStarkNetClient {
    provider;
    account;
    logger;
    constructor(config) {
        this.logger = new Logger('ExtendedStarkNetClient');
        // Initialize StarkNet provider
        const nodeUrl = config.rpcUrl ||
            (config.network === 'mainnet'
                ? 'https://starknet-mainnet.public.blastapi.io'
                : 'https://starknet-testnet.public.blastapi.io');
        this.provider = new RpcProvider({ nodeUrl });
        // Initialize account if credentials provided
        if (config.privateKey && config.accountAddress) {
            this.initializeAccount(config.privateKey, config.accountAddress);
        }
    }
    /**
     * Initialize StarkNet account with private key
     */
    initializeAccount(privateKey, address) {
        try {
            const formattedAddress = formatStarkNetAddress(address);
            if (!isValidStarkNetAddress(formattedAddress)) {
                throw new Error(`Invalid StarkNet address: ${address}`);
            }
            // StarkNet.js uses AccountOptions object pattern
            const accountOptions = {
                provider: this.provider,
                address: formattedAddress,
                signer: privateKey,
                cairoVersion: '1',
            };
            this.account = new Account(accountOptions);
            this.logger.info('StarkNet account initialized', { address: formattedAddress });
        }
        catch (error) {
            this.logger.error('Failed to initialize StarkNet account', error instanceof Error ? error : undefined);
            throw mapStarkNetError(error);
        }
    }
    /**
     * Check if account is initialized
     */
    isAccountInitialized() {
        return this.account !== undefined;
    }
    /**
     * Get account address
     */
    getAccountAddress() {
        return this.account?.address;
    }
    /**
     * Get current block number
     */
    async getBlockNumber() {
        try {
            const block = await this.provider.getBlock('latest');
            return block.block_number;
        }
        catch (error) {
            this.logger.error('Failed to get block number', error instanceof Error ? error : undefined);
            throw mapStarkNetError(error);
        }
    }
    // StarkNet ETH contract address (same on mainnet and testnet)
    static ETH_CONTRACT_ADDRESS = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
    /**
     * Get account state from StarkNet
     */
    async getAccountState(address) {
        try {
            const targetAddress = address || this.account?.address;
            if (!targetAddress) {
                throw new Error('No account address provided');
            }
            const formattedAddress = formatStarkNetAddress(targetAddress);
            // Fetch ETH balance using ERC20 balanceOf call
            let balance = '0';
            try {
                const result = await this.provider.callContract({
                    contractAddress: ExtendedStarkNetClient.ETH_CONTRACT_ADDRESS,
                    entrypoint: 'balanceOf',
                    calldata: CallData.compile({ account: formattedAddress }),
                });
                // balanceOf returns a u256 as two felts (low, high), we use low for typical balances
                if (result && result.length > 0) {
                    const lowValue = result[0];
                    if (lowValue !== undefined) {
                        balance = BigInt(lowValue).toString();
                    }
                }
            }
            catch (balanceError) {
                this.logger.warn('Failed to fetch balance, using 0', { error: balanceError instanceof Error ? balanceError.message : String(balanceError) });
            }
            // Get account nonce
            const nonce = await this.provider.getNonceForAddress(formattedAddress);
            return {
                address: formattedAddress,
                balance: balance,
                nonce: parseInt(nonce, 16),
            };
        }
        catch (error) {
            this.logger.error('Failed to get account state', error instanceof Error ? error : undefined);
            throw mapStarkNetError(error);
        }
    }
    /**
     * Get transaction status
     */
    async getTransaction(txHash) {
        try {
            const receipt = await this.provider.getTransactionReceipt(txHash);
            // StarkNet.js v8+ returns GetTransactionReceiptResponse with helper methods
            // Use isSuccess()/isReverted() to determine status and access typed properties
            const executionStatus = receipt.isSuccess() ? 'SUCCEEDED' : receipt.isReverted() ? 'REVERTED' : undefined;
            const txType = receipt.isError() ? 'INVOKE' : receipt.type;
            const blockNumber = receipt.isError() ? undefined : receipt.block_number;
            return {
                txHash,
                status: this.mapTransactionStatus(executionStatus),
                type: txType,
                blockNumber,
                timestamp: Date.now(), // StarkNet doesn't provide timestamp in receipt
            };
        }
        catch (error) {
            this.logger.error('Failed to get transaction', error instanceof Error ? error : undefined, { txHash });
            throw mapStarkNetError(error);
        }
    }
    /**
     * Map StarkNet transaction status to our format
     */
    mapTransactionStatus(status) {
        switch (status) {
            case 'SUCCEEDED':
                return 'accepted';
            case 'REVERTED':
                return 'rejected';
            default:
                return 'pending';
        }
    }
    /**
     * Wait for transaction confirmation
     */
    async waitForTransaction(txHash, _confirmations = EXTENDED_STARKNET_CONFIG.confirmations, timeoutMs = 300000 // 5 minutes
    ) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
            try {
                const tx = await this.getTransaction(txHash);
                if (tx.status === 'accepted' || tx.status === 'rejected') {
                    return tx;
                }
                // Wait before next check
                await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds
            }
            catch (error) {
                // Transaction might not be available yet
                await new Promise((resolve) => setTimeout(resolve, 5000));
            }
        }
        throw new Error(`Transaction ${txHash} confirmation timeout after ${timeoutMs}ms`);
    }
    /**
     * Call contract view function (read-only)
     */
    async callContract(contractAddress, entrypoint, calldata = []) {
        try {
            const formattedAddress = formatStarkNetAddress(contractAddress);
            // Use CallData.compile() for proper calldata formatting
            const compiledCalldata = Array.isArray(calldata)
                ? calldata.map(String)
                : CallData.compile(calldata);
            const result = await this.provider.callContract({
                contractAddress: formattedAddress,
                entrypoint,
                calldata: compiledCalldata,
            });
            return result;
        }
        catch (error) {
            this.logger.error('Failed to call contract', error instanceof Error ? error : undefined, {
                contractAddress,
                entrypoint,
            });
            throw mapStarkNetError(error);
        }
    }
    /**
     * Execute contract function (state-changing)
     * Requires initialized account
     */
    async executeContract(contractAddress, entrypoint, calldata = []) {
        if (!this.account) {
            throw new Error('Account not initialized. Cannot execute contract calls.');
        }
        try {
            const formattedAddress = formatStarkNetAddress(contractAddress);
            // Use CallData.compile() for proper calldata formatting
            const compiledCalldata = Array.isArray(calldata)
                ? calldata.map(String)
                : CallData.compile(calldata);
            const { transaction_hash } = await this.account.execute({
                contractAddress: formattedAddress,
                entrypoint,
                calldata: compiledCalldata,
            });
            this.logger.info('Contract execution initiated', {
                contractAddress: formattedAddress,
                entrypoint,
                txHash: transaction_hash,
            });
            return transaction_hash;
        }
        catch (error) {
            this.logger.error('Failed to execute contract', error instanceof Error ? error : undefined, {
                contractAddress,
                entrypoint,
            });
            throw mapStarkNetError(error);
        }
    }
    /**
     * Get positions from StarkNet contract
     * (Placeholder - actual implementation depends on Extended's contract ABI)
     */
    async getPositionsFromContract(contractAddress, accountAddress) {
        try {
            const targetAddress = accountAddress || this.account?.address;
            if (!targetAddress) {
                throw new Error('No account address provided');
            }
            // This is a placeholder - actual implementation requires:
            // 1. Extended's position contract ABI
            // 2. Correct entrypoint name
            // 3. Proper calldata formatting
            const result = await this.callContract(contractAddress, 'get_positions', [
                targetAddress,
            ]);
            return result;
        }
        catch (error) {
            this.logger.error('Failed to get positions from contract', error instanceof Error ? error : undefined);
            throw mapStarkNetError(error);
        }
    }
    /**
     * Submit order to StarkNet contract
     * (Placeholder - actual implementation depends on Extended's contract ABI)
     */
    async submitOrderToContract(contractAddress, orderData) {
        if (!this.account) {
            throw new Error('Account not initialized. Cannot submit orders.');
        }
        try {
            // This is a placeholder - actual implementation requires:
            // 1. Extended's trading contract ABI
            // 2. Correct entrypoint name
            // 3. Proper order data formatting
            const txHash = await this.executeContract(contractAddress, 'submit_order', [orderData] // Needs proper formatting
            );
            return txHash;
        }
        catch (error) {
            this.logger.error('Failed to submit order to contract', error instanceof Error ? error : undefined);
            throw mapStarkNetError(error);
        }
    }
    /**
     * Get contract info
     */
    async getContractInfo(contractAddress) {
        try {
            const formattedAddress = formatStarkNetAddress(contractAddress);
            const classHash = await this.provider.getClassHashAt(formattedAddress);
            return {
                address: formattedAddress,
                classHash,
            };
        }
        catch (error) {
            this.logger.error('Failed to get contract info', error instanceof Error ? error : undefined, { contractAddress });
            throw mapStarkNetError(error);
        }
    }
    /**
     * Estimate fee for contract execution
     */
    async estimateFee(contractAddress, entrypoint, calldata = []) {
        if (!this.account) {
            throw new Error('Account not initialized. Cannot estimate fees.');
        }
        try {
            const formattedAddress = formatStarkNetAddress(contractAddress);
            // Use CallData.compile() for proper calldata formatting
            const compiledCalldata = Array.isArray(calldata)
                ? calldata.map(String)
                : CallData.compile(calldata);
            // Use estimateInvokeFee for proper fee estimation
            const feeEstimate = await this.account.estimateInvokeFee({
                contractAddress: formattedAddress,
                entrypoint,
                calldata: compiledCalldata,
            });
            return BigInt(feeEstimate.overall_fee.toString());
        }
        catch (error) {
            this.logger.error('Failed to estimate fee', error instanceof Error ? error : undefined, { contractAddress, entrypoint });
            throw mapStarkNetError(error);
        }
    }
    /**
     * Cleanup resources
     */
    async disconnect() {
        this.account = undefined;
        this.logger.info('StarkNet client disconnected');
    }
}
//# sourceMappingURL=ExtendedStarkNetClient.js.map