/**
 * Jupiter Perps Adapter
 *
 * Unified interface for Jupiter Perpetuals on Solana.
 *
 * @packageDocumentation
 */

// Main adapter
export { JupiterAdapter, type JupiterConfig, type JupiterAdapterConfig } from './JupiterAdapter.js';

// Authentication
export {
  JupiterAuth,
  type JupiterAuthConfig,
  isValidSolanaAddress,
  isValidSolanaPrivateKey,
} from './JupiterAuth.js';

// Solana Client
export {
  SolanaClient,
  type SolanaClientConfig,
  type TransactionResult,
  type AccountFetchResult,
  createSolanaClient,
} from './solana.js';

// Instruction Builder
export {
  JupiterInstructionBuilder,
  type OpenPositionParams,
  type ClosePositionParams,
  type IncreaseSizeParams,
  type DecreaseSizeParams,
  type AddCollateralParams,
  type RemoveCollateralParams,
  type PositionAccounts,
  createInstructionBuilder,
} from './instructions.js';

// Normalizer
export { JupiterNormalizer } from './JupiterNormalizer.js';

// Constants
export {
  JUPITER_API_URLS,
  JUPITER_MAINNET_PRICE_API,
  JUPITER_MAINNET_STATS_API,
  JUPITER_PERPS_PROGRAM_ID,
  JLP_TOKEN_MINT,
  JUPITER_TOKEN_MINTS,
  JUPITER_RATE_LIMIT,
  JUPITER_MARKETS,
  JUPITER_ORDER_SIDES,
  JUPITER_DEFAULT_PRECISION,
  JUPITER_BORROW_FEE,
  SOLANA_RPC_ENDPOINTS,
  SOLANA_DEFAULT_RPC,
  JUPITER_ERROR_MESSAGES,
  unifiedToJupiter,
  jupiterToUnified,
  getBaseToken,
} from './constants.js';

// Error mapping
export { mapJupiterError, JupiterErrorCodes, type JupiterErrorCode } from './error-codes.js';

// Types
export type {
  // On-chain types
  JupiterPositionSide,
  JupiterPositionAccount,
  JupiterPositionRequest,
  JupiterRequestType,
  JupiterPoolAccount,
  JupiterFeeSchedule,
  JupiterCustodyAccount,
  JupiterOracleConfig,
  JupiterPricingConfig,
  JupiterTradingConfig,
  JupiterFundingRateState,
  JupiterCustodyAssets,
  // API types
  JupiterPriceResponse,
  JupiterPriceData,
  JupiterPoolStats,
  JupiterMarketStats,
  // Transaction types
  JupiterOpenPositionParams,
  JupiterClosePositionParams,
  JupiterModifyPositionParams,
  // Normalized types
  JupiterNormalizedPosition,
} from './types.js';

// Utilities
export {
  getTokenMint,
  getMarketConfig,
  isValidMarket,
  formatPrice,
  formatSize,
  roundToTickSize,
  roundToStepSize,
  validateLeverage,
  calculateSizeFromCollateral,
  calculateCollateralFromSize,
  getPositionPDASeeds,
  buildPriceApiUrl,
  buildRpcRequestBody,
  calculateBorrowFee,
  hourlyToAnnualizedRate,
  annualizedToHourlyRate,
  calculateLiquidationPrice,
  isLiquidatable,
  parseOnChainValue,
  formatOnChainValue,
  parseOnChainTimestamp,
  validatePositionSize,
  validateOrderParams,
} from './utils.js';
