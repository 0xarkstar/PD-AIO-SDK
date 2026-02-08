/**
 * Health Check Mixin
 *
 * Provides health check capabilities for adapters.
 */
import type { HealthCheckConfig, HealthCheckResult, ComponentHealth } from '../../../types/health.js';
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
export declare function HealthCheckMixin<T extends Constructor<IHealthCheckMixinBase>>(Base: T): {
    new (...args: any[]): {
        /**
         * Perform health check on exchange adapter
         */
        healthCheck(config?: HealthCheckConfig): Promise<HealthCheckResult>;
        /**
         * Check API health by making a lightweight request
         * @internal
         */
        checkApiHealth(timeout: number): Promise<ComponentHealth>;
        /**
         * Perform exchange-specific API health check
         * Subclasses should override this for optimal lightweight check
         * @internal
         */
        performApiHealthCheck(): Promise<void>;
        /**
         * Check WebSocket health
         * Subclasses should override if they use WebSocket
         * @internal
         */
        checkWebSocketHealth(): Promise<{
            connected: boolean;
            reconnecting: boolean;
        }>;
        /**
         * Check authentication health
         * Subclasses should override for auth-specific checks
         * @internal
         */
        checkAuthHealth(): Promise<{
            valid: boolean;
            expiresAt?: number;
            expiresIn?: number;
            needsRefresh?: boolean;
        }>;
        /**
         * Get current rate limit status
         * @internal
         */
        getRateLimitStatus(): {
            remaining: number;
            limit: number;
            resetAt: number;
            percentUsed: number;
        } | undefined;
        readonly id: string;
        readonly has: Partial<FeatureMap>;
        readonly authStrategy?: IAuthStrategy;
        readonly rateLimiter?: RateLimiter;
        fetchMarkets(params?: MarketParams): Promise<Market[]>;
    };
} & T;
//# sourceMappingURL=HealthCheckMixin.d.ts.map