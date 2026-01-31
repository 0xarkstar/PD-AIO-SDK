/**
 * Lighter FFI Type Definitions
 *
 * Type definitions for interacting with the native Lighter signing library.
 * These types mirror the C structures used by the native library.
 */

/**
 * Signed transaction response from the native library
 */
export interface SignedTxResponse {
  /** Transaction type (e.g., 1 = CreateOrder, 2 = CancelOrder) */
  txType: number;
  /** JSON-encoded transaction info */
  txInfo: string;
  /** Transaction hash (hex string) */
  txHash: string;
  /** Message that was signed (hex string) */
  messageToSign: string;
  /** Error message if signing failed, empty string on success */
  err: string;
}

/**
 * String or error response from native library
 */
export interface StrOrErr {
  /** Result string value */
  result: string;
  /** Error message if operation failed */
  err: string;
}

/**
 * Create order transaction request parameters
 */
export interface CreateOrderTxReq {
  /** Market index (0-255) */
  marketIndex: number;
  /** Client order index for tracking */
  clientOrderIndex: bigint;
  /** Base amount in smallest units */
  baseAmount: bigint;
  /** Price in smallest units (uint32) */
  price: number;
  /** true = sell/ask, false = buy/bid */
  isAsk: boolean;
  /** Order type: 0 = limit, 1 = market, 2 = stop-limit, 3 = stop-market */
  orderType: OrderType;
  /** Time in force: 0 = GTC, 1 = IOC, 2 = FOK, 3 = POST_ONLY */
  timeInForce: TimeInForce;
  /** Reduce only flag */
  reduceOnly: boolean;
  /** Trigger price for stop orders (0 if not applicable) */
  triggerPrice: number;
  /** Order expiry timestamp in seconds (0 = no expiry) */
  orderExpiry: bigint;
}

/**
 * Cancel order transaction request parameters
 */
export interface CancelOrderTxReq {
  /** Market index */
  marketIndex: number;
  /** Order ID to cancel */
  orderId: bigint;
}

/**
 * Cancel all orders transaction request parameters
 */
export interface CancelAllOrdersTxReq {
  /** Optional market index (-1 for all markets) */
  marketIndex?: number;
}

/**
 * Withdraw collateral transaction request parameters
 */
export interface WithdrawCollateralTxReq {
  /** Collateral index */
  collateralIndex: number;
  /** Amount to withdraw in smallest units */
  amount: bigint;
  /** Destination address (hex string) */
  destinationAddress: string;
}

/**
 * Update API key permissions transaction request parameters
 */
export interface UpdateApiKeyPermissionsTxReq {
  /** API key index to update */
  apiKeyIndex: number;
  /** Can withdraw flag */
  canWithdraw: boolean;
  /** Can trade flag */
  canTrade: boolean;
}

/**
 * Order types supported by Lighter
 */
export enum OrderType {
  LIMIT = 0,
  MARKET = 1,
  STOP_LIMIT = 2,
  STOP_MARKET = 3,
}

/**
 * Time in force options
 */
export enum TimeInForce {
  /** Good Till Cancel */
  GTC = 0,
  /** Immediate or Cancel */
  IOC = 1,
  /** Fill or Kill */
  FOK = 2,
  /** Post Only (maker only) */
  POST_ONLY = 3,
}

/**
 * Transaction types returned by the native library
 */
export enum TxType {
  CREATE_ORDER = 1,
  CANCEL_ORDER = 2,
  CANCEL_ALL_ORDERS = 3,
  WITHDRAW_COLLATERAL = 4,
  UPDATE_API_KEY_PERMISSIONS = 5,
}

/**
 * LighterSigner configuration
 */
export interface LighterSignerConfig {
  /** API private key (hex string, with or without 0x prefix) */
  apiPrivateKey: string;
  /** API public key (hex string, optional - derived if not provided) */
  apiPublicKey?: string;
  /** Account index (default: 0) */
  accountIndex?: number;
  /** API key index (default: 255 for main key) */
  apiKeyIndex?: number;
  /** Chain ID (300 = testnet, 304 = mainnet) */
  chainId: number;
  /** Path to native library (optional, auto-detected if not provided) */
  libraryPath?: string;
}

/**
 * Signed transaction ready for submission
 */
export interface SignedTx {
  /** Transaction type */
  txType: number;
  /** JSON-encoded transaction info for API submission */
  txInfo: string;
  /** Transaction hash */
  txHash: string;
}

/**
 * Create order parameters (normalized for SDK use)
 */
export interface CreateOrderParams {
  /** Market index */
  marketIndex: number;
  /** Client order index */
  clientOrderIndex: bigint;
  /** Base amount in base units */
  baseAmount: bigint;
  /** Price in price units */
  price: number;
  /** Order side: true = sell, false = buy */
  isAsk: boolean;
  /** Order type */
  orderType: OrderType;
  /** Time in force */
  timeInForce: TimeInForce;
  /** Reduce only flag */
  reduceOnly?: boolean;
  /** Trigger price for stop orders */
  triggerPrice?: number;
  /** Order expiry (seconds since epoch) */
  orderExpiry?: bigint;
  /** Nonce value */
  nonce: bigint;
}

/**
 * Cancel order parameters
 */
export interface CancelOrderParams {
  /** Market index */
  marketIndex: number;
  /** Order ID to cancel */
  orderId: bigint;
  /** Nonce value */
  nonce: bigint;
}

/**
 * Cancel all orders parameters
 */
export interface CancelAllOrdersParams {
  /** Optional market index (-1 for all markets) */
  marketIndex?: number;
  /** Nonce value */
  nonce: bigint;
}

/**
 * Withdraw collateral parameters
 */
export interface WithdrawCollateralParams {
  /** Collateral index */
  collateralIndex: number;
  /** Amount to withdraw */
  amount: bigint;
  /** Destination address */
  destinationAddress: string;
  /** Nonce value */
  nonce: bigint;
}
