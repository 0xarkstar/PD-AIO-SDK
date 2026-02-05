/**
 * Base Adapter Mixins
 *
 * Composable mixins that provide specific functionality for adapters.
 */

// Types
export type { Constructor } from './LoggerMixin.js';

// Logger
export {
  LoggerMixin,
  type ILoggerMixinBase,
  type ILoggerCapable,
} from './LoggerMixin.js';

// Metrics
export {
  MetricsTrackerMixin,
  type IMetricsMixinBase,
  type IMetricsCapable,
} from './MetricsTrackerMixin.js';

// Cache
export {
  CacheManagerMixin,
  type ICacheMixinBase,
  type ICacheCapable,
} from './CacheManagerMixin.js';

// Health Check
export {
  HealthCheckMixin,
  type IHealthCheckMixinBase,
  type IHealthCheckCapable,
} from './HealthCheckMixin.js';

// HTTP Request
export {
  HttpRequestMixin,
  type IHttpRequestMixinBase,
  type IHttpRequestCapable,
} from './HttpRequestMixin.js';

// Order Helpers
export {
  OrderHelpersMixin,
  type IOrderHelpersMixinBase,
  type IOrderHelpersCapable,
} from './OrderHelpersMixin.js';
