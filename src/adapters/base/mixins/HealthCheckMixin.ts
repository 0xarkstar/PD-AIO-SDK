/**
 * Health Check Mixin
 *
 * Provides health check capabilities for adapters.
 */

import type {
  HealthCheckConfig,
  HealthCheckResult,
  ComponentHealth,
} from '../../../types/health.js';
import { determineHealthStatus } from '../../../types/health.js';
import type { FeatureMap, IAuthStrategy, MarketParams, Market } from '../../../types/index.js';
import type { RateLimiter } from '../../../core/RateLimiter.js';
import type { Constructor } from './LoggerMixin.js';

/**
 * Base interface for health check mixin requirements
 */
export interface IHealthCheckMixinBase {
  readonly id: string;
  readonly has: Partial<FeatureMap>;
  readonly authStrategy?: IAuthStrategy;
  readonly rateLimiter?: RateLimiter;
  fetchMarkets(params?: MarketParams): Promise<Market[]>;
}

/**
 * Interface for health check capabilities
 */
export interface IHealthCheckCapable {
  healthCheck(config?: HealthCheckConfig): Promise<HealthCheckResult>;
}

/**
 * Health Check Mixin - adds health check capabilities to a class
 *
 * @example
 * ```typescript
 * class MyAdapter extends HealthCheckMixin(BaseClass) {
 *   async checkHealth() {
 *     return this.healthCheck({ timeout: 5000 });
 *   }
 * }
 * ```
 */
export function HealthCheckMixin<T extends Constructor<IHealthCheckMixinBase>>(Base: T) {
  return class HealthCheckMixinClass extends Base {
    /**
     * Perform health check on exchange adapter
     */
    async healthCheck(config: HealthCheckConfig = {}): Promise<HealthCheckResult> {
      const {
        timeout = 5000,
        checkWebSocket = true,
        checkAuth = true,
        includeRateLimit = true,
      } = config;

      const startTime = Date.now();
      const timestamp = Date.now();

      // Initialize result
      const result: HealthCheckResult = {
        status: 'unhealthy',
        latency: 0,
        exchange: this.id,
        api: {
          reachable: false,
          latency: 0,
        },
        timestamp,
      };

      try {
        // 1. Check API connectivity
        result.api = await this.checkApiHealth(timeout);

        // 2. Check WebSocket (if supported and enabled)
        if (checkWebSocket && this.has.watchOrderBook) {
          result.websocket = await this.checkWebSocketHealth();
        }

        // 3. Check authentication (if applicable)
        if (checkAuth && this.authStrategy) {
          result.auth = await this.checkAuthHealth();
        }

        // 4. Include rate limit info (if available)
        if (includeRateLimit && this.rateLimiter) {
          result.rateLimit = this.getRateLimitStatus();
        }

        // Determine overall status
        result.status = determineHealthStatus(
          result.api.reachable,
          result.websocket?.connected,
          result.auth?.valid
        );

        result.latency = Date.now() - startTime;

        return result;
      } catch (error) {
        result.latency = Date.now() - startTime;
        result.api.error = error instanceof Error ? error.message : 'Unknown error';
        return result;
      }
    }

    /**
     * Check API health by making a lightweight request
     * @internal
     */
    async checkApiHealth(timeout: number): Promise<ComponentHealth> {
      const startTime = Date.now();

      try {
        // Try to fetch a single ticker (lightweight operation)
        // Subclasses can override this method for exchange-specific checks
        await Promise.race([
          this.performApiHealthCheck(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Health check timeout')), timeout)
          ),
        ]);

        return {
          reachable: true,
          latency: Date.now() - startTime,
        };
      } catch (error) {
        return {
          reachable: false,
          latency: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    /**
     * Perform exchange-specific API health check
     * Subclasses should override this for optimal lightweight check
     * @internal
     */
    async performApiHealthCheck(): Promise<void> {
      // Default: try to fetch markets (most exchanges support this)
      await this.fetchMarkets({ active: true });
    }

    /**
     * Check WebSocket health
     * Subclasses should override if they use WebSocket
     * @internal
     */
    async checkWebSocketHealth(): Promise<{
      connected: boolean;
      reconnecting: boolean;
    }> {
      // Default implementation - subclasses should override
      return {
        connected: false,
        reconnecting: false,
      };
    }

    /**
     * Check authentication health
     * Subclasses should override for auth-specific checks
     * @internal
     */
    async checkAuthHealth(): Promise<{
      valid: boolean;
      expiresAt?: number;
      expiresIn?: number;
      needsRefresh?: boolean;
    }> {
      // Default: assume auth is valid if authStrategy exists
      return {
        valid: !!this.authStrategy,
      };
    }

    /**
     * Get current rate limit status
     * @internal
     */
    getRateLimitStatus(): {
      remaining: number;
      limit: number;
      resetAt: number;
      percentUsed: number;
    } | undefined {
      // Subclasses should override if they track rate limits
      return undefined;
    }
  };
}
