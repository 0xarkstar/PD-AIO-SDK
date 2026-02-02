/**
 * Lighter WASM Signer
 *
 * Pure TypeScript/WASM-based transaction signing for Lighter Protocol.
 * Uses @oraichain/lighter-ts-sdk WASM module - no native dependencies required.
 *
 * This replaces the native FFI signer with a cross-platform WASM implementation.
 */

import type {
  LighterSignerConfig,
  SignedTx,
  CreateOrderParams,
  CancelOrderParams,
  CancelAllOrdersParams,
  WithdrawCollateralParams,
} from './types.js';
import { OrderType, TimeInForce } from './types.js';

// Dynamic import for the WASM signer
let WasmSignerClient: any = null;
let wasmSignerInstance: any = null;

/**
 * Load the WASM signer module dynamically
 */
async function loadWasmSigner(): Promise<any> {
  if (WasmSignerClient) {
    return WasmSignerClient;
  }

  try {
    const module = await import('@oraichain/lighter-ts-sdk');
    WasmSignerClient = module.WasmSignerClient;
    return WasmSignerClient;
  } catch (error) {
    throw new Error(
      'Failed to load @oraichain/lighter-ts-sdk. Please install it: npm install @oraichain/lighter-ts-sdk'
    );
  }
}

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
export class LighterWasmSigner {
  private wasmClient: any = null;
  private readonly config: Required<LighterSignerConfig>;
  private initialized = false;
  private apiPublicKey: string = '';

  constructor(config: LighterSignerConfig) {
    // Normalize private key (remove 0x prefix if present)
    const privateKey = config.apiPrivateKey.startsWith('0x')
      ? config.apiPrivateKey.slice(2)
      : config.apiPrivateKey;

    this.config = {
      apiPrivateKey: privateKey,
      apiPublicKey: config.apiPublicKey || '',
      accountIndex: config.accountIndex ?? 0,
      apiKeyIndex: config.apiKeyIndex ?? 255,
      chainId: config.chainId,
      libraryPath: config.libraryPath || '', // Not used for WASM
    };
    this.apiPublicKey = this.config.apiPublicKey;
  }

  /**
   * Initialize the WASM signer
   * Must be called before any signing operations
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Load the WASM signer class
      const SignerClass = await loadWasmSigner();

      // Create WASM client instance
      this.wasmClient = new SignerClass({});

      // Initialize the WASM module
      await this.wasmClient.initialize();

      // Create the signing client with credentials
      await this.wasmClient.createClient({
        url: '', // Not needed for signing
        privateKey: this.config.apiPrivateKey,
        chainId: this.config.chainId,
        apiKeyIndex: this.config.apiKeyIndex,
        accountIndex: this.config.accountIndex,
      });

      this.initialized = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize WASM signer: ${message}`);
    }
  }

  /**
   * Ensure the signer is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.wasmClient) {
      throw new Error('LighterWasmSigner not initialized. Call initialize() first.');
    }
  }

  /**
   * Sign a create order transaction
   */
  async signCreateOrder(params: CreateOrderParams): Promise<SignedTx> {
    this.ensureInitialized();

    const response = await this.wasmClient.signCreateOrder({
      marketIndex: params.marketIndex,
      clientOrderIndex: Number(params.clientOrderIndex),
      baseAmount: Number(params.baseAmount),
      price: params.price,
      isAsk: params.isAsk ? 1 : 0,
      orderType: params.orderType,
      timeInForce: params.timeInForce,
      reduceOnly: params.reduceOnly ? 1 : 0,
      triggerPrice: params.triggerPrice || 0,
      orderExpiry: Number(params.orderExpiry || 0),
      nonce: Number(params.nonce),
      apiKeyIndex: this.config.apiKeyIndex,
      accountIndex: this.config.accountIndex,
    });

    if (response.error) {
      throw new Error(`Signing failed: ${response.error}`);
    }

    return {
      txType: response.txType,
      txInfo: response.txInfo || '',
      txHash: response.txHash || '',
    };
  }

  /**
   * Sign a cancel order transaction
   */
  async signCancelOrder(params: CancelOrderParams): Promise<SignedTx> {
    this.ensureInitialized();

    const response = await this.wasmClient.signCancelOrder({
      marketIndex: params.marketIndex,
      orderIndex: Number(params.orderId),
      nonce: Number(params.nonce),
      apiKeyIndex: this.config.apiKeyIndex,
      accountIndex: this.config.accountIndex,
    });

    if (response.error) {
      throw new Error(`Signing failed: ${response.error}`);
    }

    return {
      txType: response.txType,
      txInfo: response.txInfo || '',
      txHash: response.txHash || '',
    };
  }

  /**
   * Sign a cancel all orders transaction
   */
  async signCancelAllOrders(params: CancelAllOrdersParams): Promise<SignedTx> {
    this.ensureInitialized();

    // timeInForce: 0 = immediate cancel all
    // time: 0 = no deadline
    const response = await this.wasmClient.signCancelAllOrders({
      timeInForce: 0,
      time: 0,
      nonce: Number(params.nonce),
      apiKeyIndex: this.config.apiKeyIndex,
      accountIndex: this.config.accountIndex,
    });

    if (response.error) {
      throw new Error(`Signing failed: ${response.error}`);
    }

    return {
      txType: response.txType,
      txInfo: response.txInfo || '',
      txHash: response.txHash || '',
    };
  }

  /**
   * Sign a withdraw collateral transaction
   */
  async signWithdrawCollateral(params: WithdrawCollateralParams): Promise<SignedTx> {
    this.ensureInitialized();

    const response = await this.wasmClient.signWithdraw({
      usdcAmount: Number(params.amount),
      nonce: Number(params.nonce),
      apiKeyIndex: this.config.apiKeyIndex,
      accountIndex: this.config.accountIndex,
    });

    if (response.error) {
      throw new Error(`Signing failed: ${response.error}`);
    }

    return {
      txType: response.txType,
      txInfo: response.txInfo || '',
      txHash: response.txHash || '',
    };
  }

  /**
   * Create a signed authentication token
   *
   * @param expirySeconds - Token validity duration in seconds (default: 3600)
   * @returns Signed auth token string
   */
  async createAuthToken(expirySeconds = 3600): Promise<string> {
    this.ensureInitialized();

    const deadline = Math.floor(Date.now() / 1000) + expirySeconds;

    const token = await this.wasmClient.createAuthToken(
      deadline,
      this.config.apiKeyIndex,
      this.config.accountIndex
    );

    if (!token || typeof token !== 'string') {
      throw new Error('Failed to create auth token');
    }

    return token;
  }

  /**
   * Generate a new API key pair
   * @param seed - Optional seed for deterministic key generation
   */
  async generateApiKey(seed?: string): Promise<{ privateKey: string; publicKey: string }> {
    this.ensureInitialized();

    const keyPair = await this.wasmClient.generateAPIKey(seed);

    return {
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
    };
  }

  /**
   * Get the API key index
   */
  get apiKeyIndex(): number {
    return this.config.apiKeyIndex;
  }

  /**
   * Get the account index
   */
  get accountIndex(): number {
    return this.config.accountIndex;
  }

  /**
   * Get the public key
   */
  get publicKey(): string {
    return this.apiPublicKey;
  }

  /**
   * Check if the signer is initialized
   */
  get isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get chain ID
   */
  get chainId(): number {
    return this.config.chainId;
  }
}

// Re-export types for convenience
export { OrderType, TimeInForce };
export type { LighterSignerConfig, SignedTx, CreateOrderParams, CancelOrderParams, CancelAllOrdersParams, WithdrawCollateralParams };

// Alias for browser compatibility (package.json browser field maps LighterSigner -> LighterWasmSigner)
export { LighterWasmSigner as LighterSigner };
