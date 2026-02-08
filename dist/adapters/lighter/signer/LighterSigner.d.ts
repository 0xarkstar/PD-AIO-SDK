/**
 * Lighter Native Signer
 *
 * FFI wrapper for the native Lighter signing library.
 * Provides transaction signing for private API operations.
 *
 * Uses koffi for FFI (compatible with Node.js 18-25+)
 */
import type { LighterSignerConfig, SignedTx, CreateOrderParams, CancelOrderParams, CancelAllOrdersParams, WithdrawCollateralParams } from './types.js';
/**
 * LighterSigner class for FFI-based transaction signing
 */
export declare class LighterSigner {
    private koffi;
    private nativeLib;
    private functions;
    private readonly config;
    private initialized;
    private apiPublicKey;
    constructor(config: LighterSignerConfig);
    /**
     * Initialize the native library using koffi
     * Must be called before any signing operations
     */
    initialize(): Promise<void>;
    /**
     * Ensure the library is initialized
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
     *
     * Note: The native library takes (timeInForce, time, nonce, apiKeyIndex, accountIndex)
     * We use timeInForce=0 (GTC) and time=0 to cancel all
     */
    signCancelAllOrders(params: CancelAllOrdersParams): Promise<SignedTx>;
    /**
     * Sign a withdraw transaction
     *
     * @param params.collateralIndex - Asset index (0 = USDC typically)
     * @param params.amount - Amount in base units
     * @param params.destinationAddress - Not used by native lib (uses routeType instead)
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
}
//# sourceMappingURL=LighterSigner.d.ts.map