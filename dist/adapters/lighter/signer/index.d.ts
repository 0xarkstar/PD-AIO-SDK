/**
 * Lighter Signer Module Exports
 *
 * Provides two signing implementations:
 * 1. LighterWasmSigner (recommended) - WASM-based, cross-platform, no native dependencies
 * 2. LighterSigner (legacy) - Native FFI, requires platform-specific binaries
 */
export { LighterWasmSigner } from './LighterWasmSigner.js';
export { LighterSigner } from './LighterSigner.js';
export { LighterWasmSigner as default } from './LighterWasmSigner.js';
export type { LighterSignerConfig, SignedTx, SignedTxResponse, StrOrErr, CreateOrderParams, CancelOrderParams, CancelAllOrdersParams, WithdrawCollateralParams, CreateOrderTxReq, CancelOrderTxReq, CancelAllOrdersTxReq, WithdrawCollateralTxReq, UpdateApiKeyPermissionsTxReq, } from './types.js';
export { OrderType, TimeInForce, TxType } from './types.js';
//# sourceMappingURL=index.d.ts.map