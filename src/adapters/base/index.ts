/**
 * Base Adapter Module
 *
 * Exports base adapter class and utilities.
 */

export { BaseAdapter } from './BaseAdapter.js';
export { BaseAdapterCore } from './BaseAdapterCore.js';

// Mixins for custom adapter composition
export {
  LoggerMixin,
  MetricsTrackerMixin,
  CacheManagerMixin,
  HealthCheckMixin,
  HttpRequestMixin,
  OrderHelpersMixin,
  type Constructor,
  type ILoggerMixinBase,
  type ILoggerCapable,
  type IMetricsMixinBase,
  type IMetricsCapable,
  type ICacheMixinBase,
  type ICacheCapable,
  type IHealthCheckMixinBase,
  type IHealthCheckCapable,
  type IHttpRequestMixinBase,
  type IHttpRequestCapable,
  type IOrderHelpersMixinBase,
  type IOrderHelpersCapable,
} from './mixins/index.js';

// Order creation helpers
export {
  createLimitBuyOrderRequest,
  createLimitSellOrderRequest,
  createMarketBuyOrderRequest,
  createMarketSellOrderRequest,
  createStopLossOrderRequest,
  createTakeProfitOrderRequest,
  createStopLimitOrderRequest,
  createTrailingStopOrderRequest,
  validateOrderRequest,
} from './OrderHelpers.js';

// Normalizer utilities
export {
  // Numeric parsing
  parseDecimal,
  parseBigInt,
  parseX18,
  formatX18,
  // Symbol formatting
  buildUnifiedSymbol,
  parseUnifiedSymbol,
  extractBaseFromPerpSymbol,
  // Status mapping
  ORDER_STATUS_MAP,
  ORDER_TYPE_MAP,
  mapOrderStatus,
  mapOrderType,
  mapOrderSide,
  mapTimeInForce,
  // Timestamp utilities
  normalizeTimestamp,
  formatTimestamp,
  // Precision utilities
  roundToDecimals,
  roundToTickSize,
  roundToStepSize,
  getDecimalPlaces,
} from './BaseNormalizer.js';
