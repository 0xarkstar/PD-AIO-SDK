/**
 * Perp DEX SDK - Main Entry Point
 *
 * Unified TypeScript SDK for decentralized perpetual exchanges
 */

// =============================================================================
// Factory Functions
// =============================================================================

export { createExchange, getSupportedExchanges, isExchangeSupported } from './factory.js';
export type { SupportedExchange, ExchangeConfigMap } from './factory.js';

// =============================================================================
// Types
// =============================================================================

export type {
  // Common types
  Order,
  OrderRequest,
  OrderType,
  OrderSide,
  OrderStatus,
  TimeInForce,
  Position,
  PositionSide,
  MarginMode,
  Market,
  OrderBook,
  PriceLevel,
  Trade,
  FundingRate,
  Balance,
  Ticker,
  MarketParams,
  OrderBookParams,
  TradeParams,
  // Adapter interface
  IExchangeAdapter,
  IAuthStrategy,
  FeatureMap,
  RequestParams,
  AuthenticatedRequest,
  ExchangeConfig,
  RateLimitConfig,
  // Health types
  HealthStatus,
  HealthCheckResult,
  HealthCheckConfig,
  ComponentHealth,
  AuthHealth,
  WebSocketHealth,
} from './types/index.js';

export {
  determineHealthStatus,
  isHealthy,
  isCriticallyUnhealthy,
} from './types/health.js';

export {
  // Constants
  ORDER_TYPES,
  ORDER_SIDES,
  ORDER_STATUSES,
  TIME_IN_FORCE,
  POSITION_SIDES,
  MARGIN_MODES,
  // Errors
  PerpDEXError,
  InsufficientMarginError,
  OrderNotFoundError,
  InvalidOrderError,
  PositionNotFoundError,
  RateLimitError,
  ExchangeUnavailableError,
  WebSocketDisconnectedError,
  InvalidSignatureError,
  ExpiredAuthError,
  InsufficientPermissionsError,
  TransactionFailedError,
  SlippageExceededError,
  LiquidationError,
  isPerpDEXError,
  isRateLimitError,
  isAuthError,
} from './types/index.js';

// =============================================================================
// WebSocket Infrastructure
// =============================================================================

export { WebSocketClient, WebSocketManager } from './websocket/index.js';

export type {
  ConnectionState,
  WebSocketConfig,
  ReconnectConfig,
  HeartbeatConfig,
  Subscription,
  WebSocketMessage,
  MessageHandler,
  WebSocketMetrics,
} from './websocket/index.js';

// =============================================================================
// Core Utilities
// =============================================================================

// Rate Limiter
export { RateLimiter } from './core/RateLimiter.js';
export type { RateLimiterConfig } from './core/RateLimiter.js';

// Retry Logic
export {
  withRetry,
  withRetryWrapper,
  withLinearRetry,
  withRetryStats,
  RetryStats,
} from './core/retry.js';
export type { RetryConfig } from './core/retry.js';

// Circuit Breaker
export { CircuitBreaker } from './core/CircuitBreaker.js';
export type { CircuitBreakerConfig, CircuitBreakerMetrics } from './core/CircuitBreaker.js';

// Resilience Utilities
export {
  createResilientExecutor,
  withResilience,
  Resilient,
  Bulkhead,
  withTimeout,
  withCache,
} from './core/resilience.js';
export type { ResilienceConfig, FailureContext } from './core/resilience.js';

// Logging
export {
  Logger,
  LogLevel,
  generateCorrelationId,
  createRequestContext,
  createChildLogger,
  formatLogEntry,
} from './core/logger.js';
export type {
  LogEntry,
  RequestContext,
  LoggerConfig,
} from './core/logger.js';

// =============================================================================
// Monitoring
// =============================================================================

// Prometheus Metrics
export {
  PrometheusMetrics,
  initializeMetrics,
  getMetrics,
  isMetricsInitialized,
} from './monitoring/prometheus.js';
export type { PrometheusConfig } from './monitoring/prometheus.js';

// Metrics HTTP Server
export { MetricsServer, startMetricsServer } from './monitoring/metrics-server.js';
export type { MetricsServerConfig, HealthCheckResponse } from './monitoring/metrics-server.js';

// PnL Calculations
export {
  calculateUnrealizedPnl,
  calculateLiquidationPrice,
  calculateRequiredMargin,
  calculatePositionValue,
  calculateROE,
  calculateMarginRatio,
  calculateEffectiveLeverage,
  calculateFundingPayment,
  calculateBreakEvenPrice,
  calculateMaxPositionSize,
  calculateAverageEntryPrice,
  calculateMarkToMarket,
} from './core/calculations/pnl.js';

// Symbol Utilities
export {
  createSymbol,
  parseSymbol,
  buildSymbol,
  isValidSymbol,
  getBaseCurrency,
  getQuoteCurrency,
  getSettleCurrency,
  isPerpetual,
  normalizeSymbol,
  compareSymbols,
  filterByBase,
  filterByQuote,
  groupByBase,
} from './utils/symbols.js';
export type { SymbolParts } from './utils/symbols.js';

// Configuration Utilities
export {
  validateConfig,
  validateMultipleConfigs,
  getRequiredEnvVars,
  getConfigErrorMessage,
  isValidPrivateKey,
  isValidApiKey,
  hasEnvironmentSupport,
  maskSensitive,
  ConfigurationError,
} from './utils/config.js';

// Cross-platform Crypto Utilities
export {
  createHmacSha256,
  createSha3Hash,
  createSha3HashBuffer,
  createSha256Hash,
  createSha256HashBuffer,
  hexToBytes,
  bytesToHex,
} from './utils/crypto.js';

// Cross-platform Buffer Utilities
export {
  toBuffer,
  fromBuffer,
  allocBuffer,
  readBigUInt64LE,
  readBigUInt64BE,
  writeBigUInt64LE,
  writeBigUInt64BE,
  concatBuffers,
  buffersEqual,
  copyBuffer,
  sliceBuffer,
} from './utils/buffer.js';

// =============================================================================
// Validation
// =============================================================================

export {
  // Schemas
  OrderRequestSchema,
  OrderSchema,
  PositionSchema,
  MarketSchema,
  OrderBookSchema,
  TradeSchema,
  FundingRateSchema,
  BalanceSchema,
  TickerSchema,
  // Simple validation helpers
  validateData,
  validateArray as validateArraySimple,
  // Middleware validation functions
  validate,
  validateSafe,
  validateOrderRequest,
  validateOrderBookParams,
  validateTradeParams,
  validateMarketParams,
  validateArray,
  createValidator,
  validateResponse,
} from './core/validation/index.js';

export type {
  ValidationResult,
  ValidationError,
  ValidationOptions,
} from './core/validation/index.js';

// =============================================================================
// Exchange Adapters
// =============================================================================

// Base adapter
export { BaseAdapter } from './adapters/base/BaseAdapter.js';

// Hyperliquid
export { HyperliquidAdapter, HyperliquidAuth } from './adapters/hyperliquid/index.js';
export type { HyperliquidConfig } from './adapters/hyperliquid/index.js';

// Lighter
export { LighterAdapter } from './adapters/lighter/index.js';
export type { LighterConfig } from './adapters/lighter/index.js';

// GRVT
export { GRVTAdapter, GRVTAuth } from './adapters/grvt/index.js';
export type { GRVTConfig, GRVTAdapterConfig, GRVTAuthConfig } from './adapters/grvt/index.js';

// Paradex
export { ParadexAdapter, ParadexAuth } from './adapters/paradex/index.js';
export type { ParadexConfig, ParadexAuthConfig } from './adapters/paradex/index.js';

// EdgeX
export { EdgeXAdapter } from './adapters/edgex/index.js';
export type { EdgeXConfig } from './adapters/edgex/index.js';

// Backpack
export { BackpackAdapter } from './adapters/backpack/index.js';
export type { BackpackConfig } from './adapters/backpack/index.js';

// Nado
export { NadoAdapter } from './adapters/nado/index.js';
export type { NadoConfig } from './adapters/nado/index.js';

// dYdX v4
export { DydxAdapter, DydxAuth, DydxNormalizer } from './adapters/dydx/index.js';
export type { DydxConfig } from './adapters/dydx/index.js';

// Jupiter Perps
export { JupiterAdapter, JupiterAuth, JupiterNormalizer } from './adapters/jupiter/index.js';
export type { JupiterConfig, JupiterAdapterConfig } from './adapters/jupiter/index.js';

// Drift Protocol
export { DriftAdapter, DriftAuth, DriftNormalizer } from './adapters/drift/index.js';
export type { DriftConfig } from './adapters/drift/index.js';

// GMX v2
export { GmxAdapter, GmxNormalizer } from './adapters/gmx/index.js';
export type { GmxConfig, GmxChain } from './adapters/gmx/index.js';

// Variational
export { VariationalAdapter } from './adapters/variational/index.js';
export type { VariationalConfig } from './adapters/variational/index.js';

// Extended (StarkNet)
export { ExtendedAdapter } from './adapters/extended/index.js';
export type { ExtendedConfig } from './adapters/extended/index.js';

// =============================================================================
// Version
// =============================================================================

export const VERSION = '0.2.0';
