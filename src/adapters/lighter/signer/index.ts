/**
 * Lighter Signer Module Exports
 *
 * Provides two signing implementations:
 * 1. LighterWasmSigner (recommended) - WASM-based, cross-platform, no native dependencies
 * 2. LighterSigner (legacy) - Native FFI, requires platform-specific binaries
 */

// WASM Signer (recommended - cross-platform)
export { LighterWasmSigner } from './LighterWasmSigner.js';

// Native FFI Signer (legacy - requires native library)
export { LighterSigner } from './LighterSigner.js';

// Default export is WASM signer
export { LighterWasmSigner as default } from './LighterWasmSigner.js';

// Types
export type {
  LighterSignerConfig,
  SignedTx,
  SignedTxResponse,
  StrOrErr,
  CreateOrderParams,
  CancelOrderParams,
  CancelAllOrdersParams,
  WithdrawCollateralParams,
  CreateOrderTxReq,
  CancelOrderTxReq,
  CancelAllOrdersTxReq,
  WithdrawCollateralTxReq,
  UpdateApiKeyPermissionsTxReq,
} from './types.js';

// Enums
export { OrderType, TimeInForce, TxType } from './types.js';
