/**
 * Lighter WASM Signer
 *
 * Pure TypeScript/WASM-based transaction signing for Lighter Protocol.
 * Uses @oraichain/lighter-ts-sdk WASM module - no native dependencies required.
 *
 * This replaces the native FFI signer with a cross-platform WASM implementation.
 */
import type { LighterSignerConfig, SignedTx, CreateOrderParams, CancelOrderParams, CancelAllOrdersParams, WithdrawCollateralParams } from './types.js';
import { OrderType, TimeInForce } from './types.js';
/**
 * LighterWasmSigner - WASM-based transaction signing
 *
 * Cross-platform signer using Go WASM module from @oraichain/lighter-ts-sdk.
 * Works in both Node.js and browser environments without native dependencies.
 *
 * @example
 * ```typescript
 * const signer = new LighterWasmSigner({
 *   apiPrivateKey: '0x...',
 *   chainId: 304, // mainnet
 *   accountIndex: 0,
 *   apiKeyIndex: 255,
 * });
 *
 * await signer.initialize();
 *
 * const signedOrder = await signer.signCreateOrder({
 *   marketIndex: 0,
 *   clientOrderIndex: BigInt(Date.now()),
 *   baseAmount: BigInt(1000000),
 *   price: 50000,
 *   isAsk: false,
 *   orderType: OrderType.LIMIT,
 *   timeInForce: TimeInForce.GTC,
 *   nonce: BigInt(1),
 * });
 * ```
 */
export declare class LighterWasmSigner {
    private wasmClient;
    private readonly config;
    private initialized;
    private apiPublicKey;
    constructor(config: LighterSignerConfig);
    /**
     * Initialize the WASM signer
     * Must be called before any signing operations
     */
    initialize(): Promise<void>;
    /**
     * Ensure the signer is initialized
     */
    private ensureInitialized;
    /**
     * Sign a create order transaction
     */
    signCreateOrder(params: CreateOrderParams): Promise<SignedTx>;
    /**
     * Sign a cancel order transaction
     */
    signCancelOrder(params: CancelOrderParams): Promise<SignedTx>;
    /**
     * Sign a cancel all orders transaction
     */
    signCancelAllOrders(params: CancelAllOrdersParams): Promise<SignedTx>;
    /**
     * Sign a withdraw collateral transaction
     */
    signWithdrawCollateral(params: WithdrawCollateralParams): Promise<SignedTx>;
    /**
     * Create a signed authentication token
     *
     * @param expirySeconds - Token validity duration in seconds (default: 3600)
     * @returns Signed auth token string
     */
    createAuthToken(expirySeconds?: number): Promise<string>;
    /**
     * Generate a new API key pair
     * @param seed - Optional seed for deterministic key generation
     */
    generateApiKey(seed?: string): Promise<{
        privateKey: string;
        publicKey: string;
    }>;
    /**
     * Get the API key index
     */
    get apiKeyIndex(): number;
    /**
     * Get the account index
     */
    get accountIndex(): number;
    /**
     * Get the public key
     */
    get publicKey(): string;
    /**
     * Check if the signer is initialized
     */
    get isInitialized(): boolean;
    /**
     * Get chain ID
     */
    get chainId(): number;
}
export { OrderType, TimeInForce };
export type { LighterSignerConfig, SignedTx, CreateOrderParams, CancelOrderParams, CancelAllOrdersParams, WithdrawCollateralParams, };
export { LighterWasmSigner as LighterSigner };
//# sourceMappingURL=LighterWasmSigner.d.ts.map