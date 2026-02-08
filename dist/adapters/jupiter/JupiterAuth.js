/**
 * Jupiter Perps Authentication
 *
 * Handles Solana wallet authentication for Jupiter Perps trading.
 * Jupiter Perps requires on-chain transactions signed by the wallet.
 */
import { SOLANA_DEFAULT_RPC } from './constants.js';
import { Logger } from '../../core/logger.js';
/**
 * Solana wallet authentication for Jupiter Perps
 *
 * Jupiter Perps uses on-chain Solana transactions, so authentication
 * is done via transaction signing rather than API headers.
 *
 * For read operations (positions, balances), only the wallet address is needed.
 * For write operations (trading), the private key is required for signing.
 */
export class JupiterAuth {
    keypair;
    walletAddress;
    publicKey;
    rpcEndpoint;
    connection;
    isInitialized = false;
    logger = new Logger('JupiterAuth');
    constructor(config) {
        this.rpcEndpoint = config.rpcEndpoint || SOLANA_DEFAULT_RPC;
        // Store config for lazy initialization
        if (config.privateKey) {
            this.initializeFromPrivateKey(config.privateKey);
        }
        else if (config.walletAddress) {
            this.walletAddress = config.walletAddress;
        }
    }
    /**
     * Initialize keypair from private key
     */
    initializeFromPrivateKey(privateKey) {
        try {
            const bytes = this.parsePrivateKey(privateKey);
            // Lazy import to handle ESM module - void prefix for intentional fire-and-forget
            void this.initKeypairAsync(bytes);
        }
        catch (error) {
            this.logger.warn(`Failed to initialize keypair: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Async initialization of keypair (for dynamic import)
     */
    async initKeypairAsync(bytes) {
        try {
            const { Keypair, Connection } = await import('@solana/web3.js');
            this.keypair = Keypair.fromSecretKey(bytes);
            this.publicKey = this.keypair.publicKey;
            this.walletAddress = this.publicKey.toBase58();
            this.connection = new Connection(this.rpcEndpoint, 'confirmed');
            this.isInitialized = true;
        }
        catch (error) {
            this.logger.warn(`Failed to initialize Solana keypair: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Ensure async initialization is complete
     */
    async ensureInitialized() {
        if (!this.isInitialized && this.walletAddress) {
            try {
                const { Connection, PublicKey } = await import('@solana/web3.js');
                this.connection = new Connection(this.rpcEndpoint, 'confirmed');
                if (this.walletAddress) {
                    this.publicKey = new PublicKey(this.walletAddress);
                }
                this.isInitialized = true;
            }
            catch (error) {
                throw new Error(`Failed to initialize Solana connection: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
    /**
     * Sign a request (required by IAuthStrategy interface)
     * Jupiter uses on-chain transaction signing, not HTTP request signing
     */
    async sign(request) {
        // Jupiter doesn't use HTTP request signing
        // Just return the request with empty headers
        return {
            ...request,
            headers: {},
        };
    }
    /**
     * Jupiter doesn't use HTTP header authentication
     * All authentication is done via transaction signing
     */
    getHeaders() {
        // No headers needed for Jupiter - uses on-chain transactions
        return {};
    }
    /**
     * Sign a message
     */
    async signMessage(message) {
        if (!this.keypair) {
            throw new Error('Private key required for signing');
        }
        const { sign } = await import('@noble/ed25519');
        const messageBytes = new TextEncoder().encode(message);
        return sign(messageBytes, this.keypair.secretKey.slice(0, 32));
    }
    /**
     * Sign bytes (for transaction signing)
     */
    async signBytes(bytes) {
        if (!this.keypair) {
            throw new Error('Private key required for signing');
        }
        const { sign } = await import('@noble/ed25519');
        return sign(bytes, this.keypair.secretKey.slice(0, 32));
    }
    /**
     * Sign a Solana transaction
     */
    async signTransaction(transaction) {
        if (!this.keypair) {
            throw new Error('Private key required for transaction signing');
        }
        transaction.sign(this.keypair);
        return transaction;
    }
    /**
     * Sign multiple Solana transactions
     */
    async signAllTransactions(transactions) {
        if (!this.keypair) {
            throw new Error('Private key required for transaction signing');
        }
        for (const tx of transactions) {
            tx.sign(this.keypair);
        }
        return transactions;
    }
    /**
     * Get the wallet address
     */
    getWalletAddress() {
        return this.walletAddress;
    }
    /**
     * Get the public key
     */
    getPublicKey() {
        return this.publicKey;
    }
    /**
     * Get the keypair (for SDK usage)
     */
    getKeypair() {
        return this.keypair;
    }
    /**
     * Check if authentication is configured for trading
     */
    canSign() {
        return this.keypair !== undefined;
    }
    /**
     * Check if authentication is configured for read operations
     */
    canRead() {
        return this.walletAddress !== undefined;
    }
    /**
     * Get RPC endpoint
     */
    getRpcEndpoint() {
        return this.rpcEndpoint;
    }
    /**
     * Get Solana connection
     */
    async getConnection() {
        await this.ensureInitialized();
        if (!this.connection) {
            throw new Error('Connection not initialized');
        }
        return this.connection;
    }
    /**
     * Get SOL balance
     */
    async getSolBalance() {
        await this.ensureInitialized();
        if (!this.connection || !this.publicKey) {
            throw new Error('Connection or public key not initialized');
        }
        const balance = await this.connection.getBalance(this.publicKey);
        return balance / 1e9; // Convert lamports to SOL
    }
    /**
     * Get token balance for an SPL token
     */
    async getTokenBalance(tokenMint) {
        await this.ensureInitialized();
        if (!this.connection || !this.publicKey) {
            throw new Error('Connection or public key not initialized');
        }
        const { PublicKey } = await import('@solana/web3.js');
        const tokenMintPubkey = new PublicKey(tokenMint);
        // Get associated token account
        const tokenAccounts = await this.connection.getTokenAccountsByOwner(this.publicKey, { mint: tokenMintPubkey });
        if (tokenAccounts.value.length === 0) {
            return 0;
        }
        // Parse account data to get balance
        const accountInfo = tokenAccounts.value[0];
        if (!accountInfo) {
            return 0;
        }
        // Account data layout: 64 bytes mint, 32 bytes owner, 8 bytes amount
        const data = accountInfo.account.data;
        const amountBytes = data.slice(64, 72);
        const amount = Buffer.from(amountBytes).readBigUInt64LE();
        return Number(amount);
    }
    /**
     * Get associated token account address
     */
    async getAssociatedTokenAddress(tokenMint) {
        if (!this.publicKey) {
            throw new Error('Public key not initialized');
        }
        const { PublicKey } = await import('@solana/web3.js');
        const mintPubkey = new PublicKey(tokenMint);
        const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
        const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
        const [address] = await PublicKey.findProgramAddress([this.publicKey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mintPubkey.toBuffer()], ASSOCIATED_TOKEN_PROGRAM_ID);
        return address.toBase58();
    }
    // ==========================================================================
    // Private Methods
    // ==========================================================================
    /**
     * Parse private key from various formats
     */
    parsePrivateKey(key) {
        if (key instanceof Uint8Array) {
            return key;
        }
        // Try to parse as JSON array (common format from Solana CLI)
        if (key.startsWith('[')) {
            try {
                const parsed = JSON.parse(key);
                return new Uint8Array(parsed);
            }
            catch {
                throw new Error('Invalid private key JSON array format');
            }
        }
        // Try to parse as base58 (Phantom wallet format)
        if (/^[1-9A-HJ-NP-Za-km-z]+$/.test(key)) {
            try {
                // Use bs58 for base58 decoding
                const bs58 = require('bs58');
                return bs58.decode(key);
            }
            catch {
                throw new Error('Invalid base58 private key format');
            }
        }
        // Try hex format
        if (/^(0x)?[0-9a-fA-F]+$/.test(key)) {
            const hex = key.startsWith('0x') ? key.slice(2) : key;
            const bytes = new Uint8Array(hex.length / 2);
            for (let i = 0; i < bytes.length; i++) {
                bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
            }
            return bytes;
        }
        throw new Error('Unsupported private key format');
    }
}
/**
 * Validate Solana address format
 */
export function isValidSolanaAddress(address) {
    // Solana addresses are base58-encoded 32-byte public keys
    // Valid characters: 1-9, A-H, J-N, P-Z, a-k, m-z (no 0, I, O, l)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(address);
}
/**
 * Validate Solana private key format
 */
export function isValidSolanaPrivateKey(key) {
    if (key instanceof Uint8Array) {
        // Solana uses 64-byte secret keys (32 bytes private + 32 bytes public)
        return key.length === 64;
    }
    // JSON array format
    if (key.startsWith('[')) {
        try {
            const parsed = JSON.parse(key);
            return Array.isArray(parsed) && parsed.length === 64;
        }
        catch {
            return false;
        }
    }
    // Base58 format (approximately 87-88 characters for 64 bytes)
    if (/^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(key)) {
        return true;
    }
    // Hex format (128 characters for 64 bytes)
    if (/^(0x)?[0-9a-fA-F]{128}$/.test(key)) {
        return true;
    }
    return false;
}
//# sourceMappingURL=JupiterAuth.js.map