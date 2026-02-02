/**
 * GMX v2 Authentication
 *
 * Handles Ethereum wallet authentication for GMX v2 trading.
 * GMX uses on-chain transactions via the ExchangeRouter contract.
 */
import { ethers } from 'ethers';
import { GMX_API_URLS } from './constants.js';
/**
 * Ethereum wallet authentication for GMX v2
 *
 * GMX v2 uses on-chain Ethereum transactions, so authentication
 * is done via transaction signing rather than API headers.
 *
 * For read operations (positions, balances), only the wallet address is needed.
 * For write operations (trading), the private key/wallet is required for signing.
 */
export class GmxAuth {
    wallet;
    walletAddress;
    chain;
    provider;
    rpcEndpoint;
    constructor(config) {
        this.chain = config.chain;
        this.rpcEndpoint = config.rpcEndpoint || GMX_API_URLS[config.chain].rpc;
        this.provider = new ethers.JsonRpcProvider(this.rpcEndpoint);
        if (config.wallet) {
            this.wallet = config.wallet.connect(this.provider);
            this.walletAddress = config.wallet.address;
        }
        else if (config.privateKey) {
            this.wallet = new ethers.Wallet(config.privateKey, this.provider);
            this.walletAddress = this.wallet.address;
        }
        else if (config.walletAddress) {
            this.walletAddress = config.walletAddress;
        }
    }
    /**
     * Sign a request (required by IAuthStrategy interface)
     * GMX uses on-chain transaction signing, not HTTP request signing
     */
    async sign(request) {
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
    getHeaders() {
        return {};
    }
    /**
     * Sign a message
     */
    async signMessage(message) {
        if (!this.wallet) {
            throw new Error('Wallet required for signing');
        }
        return this.wallet.signMessage(message);
    }
    /**
     * Sign typed data (EIP-712)
     */
    async signTypedData(domain, types, value) {
        if (!this.wallet) {
            throw new Error('Wallet required for signing');
        }
        return this.wallet.signTypedData(domain, types, value);
    }
    /**
     * Get the wallet address
     */
    getWalletAddress() {
        return this.walletAddress;
    }
    /**
     * Get the wallet instance (for contract interactions)
     */
    getWallet() {
        return this.wallet;
    }
    /**
     * Get the signer (for contract interactions)
     */
    getSigner() {
        return this.wallet;
    }
    /**
     * Get the provider
     */
    getProvider() {
        return this.provider;
    }
    /**
     * Get the chain
     */
    getChain() {
        return this.chain;
    }
    /**
     * Get chain ID
     */
    getChainId() {
        return GMX_API_URLS[this.chain].chainId;
    }
    /**
     * Get RPC endpoint
     */
    getRpcEndpoint() {
        return this.rpcEndpoint;
    }
    /**
     * Check if authentication is configured for trading
     */
    canSign() {
        return this.wallet !== undefined;
    }
    /**
     * Check if authentication is configured for read operations
     */
    canRead() {
        return this.walletAddress !== undefined;
    }
    /**
     * Estimate gas for a transaction
     */
    async estimateGas(tx) {
        return this.provider.estimateGas(tx);
    }
    /**
     * Get current gas price
     */
    async getGasPrice() {
        const feeData = await this.provider.getFeeData();
        return feeData.gasPrice || 0n;
    }
    /**
     * Get current block number
     */
    async getBlockNumber() {
        return this.provider.getBlockNumber();
    }
    /**
     * Wait for a transaction to be confirmed
     */
    async waitForTransaction(txHash, confirmations = 1) {
        return this.provider.waitForTransaction(txHash, confirmations);
    }
    /**
     * Get ETH balance of wallet
     */
    async getBalance() {
        if (!this.walletAddress) {
            throw new Error('Wallet address required');
        }
        return this.provider.getBalance(this.walletAddress);
    }
    /**
     * Get token balance
     */
    async getTokenBalance(tokenAddress) {
        if (!this.walletAddress) {
            throw new Error('Wallet address required');
        }
        const erc20Abi = ['function balanceOf(address owner) view returns (uint256)'];
        const contract = new ethers.Contract(tokenAddress, erc20Abi, this.provider);
        return contract.balanceOf(this.walletAddress);
    }
    /**
     * Get token allowance
     */
    async getTokenAllowance(tokenAddress, spenderAddress) {
        if (!this.walletAddress) {
            throw new Error('Wallet address required');
        }
        const erc20Abi = ['function allowance(address owner, address spender) view returns (uint256)'];
        const contract = new ethers.Contract(tokenAddress, erc20Abi, this.provider);
        return contract.allowance(this.walletAddress, spenderAddress);
    }
    /**
     * Approve token spending
     */
    async approveToken(tokenAddress, spenderAddress, amount) {
        if (!this.wallet) {
            throw new Error('Wallet required for approval');
        }
        const erc20Abi = ['function approve(address spender, uint256 amount) returns (bool)'];
        const contract = new ethers.Contract(tokenAddress, erc20Abi, this.wallet);
        return contract.approve(spenderAddress, amount);
    }
}
/**
 * Validate Ethereum address format
 */
export function isValidEthereumAddress(address) {
    return ethers.isAddress(address);
}
/**
 * Validate Ethereum private key format
 */
export function isValidEthereumPrivateKey(key) {
    try {
        // Private key should be 32 bytes (64 hex characters)
        const cleanKey = key.startsWith('0x') ? key.slice(2) : key;
        if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
            return false;
        }
        // Try to create a wallet to validate
        new ethers.Wallet(key);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=GmxAuth.js.map