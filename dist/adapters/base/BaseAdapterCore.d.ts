/**
 * Base Adapter Core
 *
 * Abstract base class providing infrastructure functionality for all adapters.
 * Contains logger, metrics, cache, health check, HTTP request, and connection management.
 */
import type { ExchangeConfig, FeatureMap, IAuthStrategy, Market, MarketParams, OrderRequest } from '../../types/index.js';
import type { HealthCheckConfig, HealthCheckResult, ComponentHealth } from '../../types/health.js';
import type { APIMetrics, MetricsSnapshot } from '../../types/metrics.js';
import { Logger } from '../../core/logger.js';
import { CircuitBreaker } from '../../core/CircuitBreaker.js';
import type { HTTPClient } from '../../core/http/HTTPClient.js';
import { PrometheusMetrics } from '../../monitoring/prometheus.js';
import type { RateLimiter } from '../../core/RateLimiter.js';
export declare abstract class BaseAdapterCore {
    abstract readonly id: string;
    abstract readonly name: string;
    abstract readonly has: Partial<FeatureMap>;
    protected _isReady: boolean;
    protected _isDisconnected: boolean;
    protected readonly config: ExchangeConfig;
    protected authStrategy?: IAuthStrategy;
    protected rateLimiter?: RateLimiter;
    private _logger?;
    protected circuitBreaker: CircuitBreaker;
    protected httpClient?: HTTPClient;
    protected prometheusMetrics?: PrometheusMetrics;
    protected timers: Set<NodeJS.Timeout>;
    protected intervals: Set<NodeJS.Timeout>;
    protected abortControllers: Set<AbortController>;
    protected marketCache: Market[] | null;
    protected marketCacheExpiry: number;
    protected marketCacheTTL: number;
    protected metrics: APIMetrics;
    constructor(config?: ExchangeConfig);
    protected get logger(): Logger;
    protected debug(message: string, meta?: Record<string, unknown>): void;
    protected info(message: string, meta?: Record<string, unknown>): void;
    protected warn(message: string, meta?: Record<string, unknown>): void;
    protected error(message: string, error?: Error, meta?: Record<string, unknown>): void;
    get isReady(): boolean;
    isDisconnected(): boolean;
    abstract initialize(): Promise<void>;
    disconnect(): Promise<void>;
    clearCache(): void;
    preloadMarkets(options?: {
        ttl?: number;
        params?: MarketParams;
    }): Promise<void>;
    getPreloadedMarkets(): Market[] | null;
    protected fetchMarketsFromAPI(params?: MarketParams): Promise<Market[]>;
    abstract fetchMarkets(params?: MarketParams): Promise<Market[]>;
    healthCheck(config?: HealthCheckConfig): Promise<HealthCheckResult>;
    protected checkApiHealth(timeout: number): Promise<ComponentHealth>;
    protected performApiHealthCheck(): Promise<void>;
    protected checkWebSocketHealth(): Promise<{
        connected: boolean;
        reconnecting: boolean;
    }>;
    protected checkAuthHealth(): Promise<{
        valid: boolean;
        expiresAt?: number;
        expiresIn?: number;
        needsRefresh?: boolean;
    }>;
    protected getRateLimitStatus(): {
        remaining: number;
        limit: number;
        resetAt: number;
        percentUsed: number;
    } | undefined;
    protected updateEndpointMetrics(endpointKey: string, latency: number, isError: boolean): void;
    protected updateAverageLatency(latency: number): void;
    getMetrics(): MetricsSnapshot;
    getCircuitBreakerMetrics(): import("../../core/CircuitBreaker.js").CircuitBreakerMetrics;
    getCircuitBreakerState(): import("../../core/CircuitBreaker.js").CircuitState;
    resetMetrics(): void;
    protected trackRateLimitHit(): void;
    protected request<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, body?: unknown, headers?: Record<string, string>): Promise<T>;
    protected registerTimer(timer: NodeJS.Timeout): void;
    protected registerInterval(interval: NodeJS.Timeout): void;
    protected unregisterTimer(timer: NodeJS.Timeout): void;
    protected unregisterInterval(interval: NodeJS.Timeout): void;
    protected extractEndpoint(url: string): string;
    supportsFeature(feature: keyof FeatureMap): boolean;
    protected assertFeatureSupported(feature: keyof FeatureMap): void;
    protected ensureInitialized(): void;
    protected validateOrder(request: OrderRequest, correlationId?: string): OrderRequest;
    protected getValidator(): {
        validate: <T>(schema: import("zod").ZodType<T>, data: unknown, context?: import("../../core/logger.js").RequestContext) => T;
        orderRequest: (data: unknown, context?: import("../../core/logger.js").RequestContext) => import("zod").TypeOf<typeof import("../../index.js").OrderRequestSchema>;
        orderBookParams: (data: unknown, context?: import("../../core/logger.js").RequestContext) => import("zod").TypeOf<typeof import("../../core/index.js").OrderBookParamsSchema> | undefined;
        tradeParams: (data: unknown, context?: import("../../core/logger.js").RequestContext) => import("zod").TypeOf<typeof import("../../core/index.js").TradeParamsSchema> | undefined;
        marketParams: (data: unknown, context?: import("../../core/logger.js").RequestContext) => import("zod").TypeOf<typeof import("../../core/index.js").MarketParamsSchema> | undefined;
        ohlcvParams: (data: unknown, context?: import("../../core/logger.js").RequestContext) => import("zod").TypeOf<typeof import("../../core/validation/schemas.js").OHLCVParamsSchema> | undefined;
        ohlcvTimeframe: (data: unknown, context?: import("../../core/logger.js").RequestContext) => import("zod").TypeOf<typeof import("../../core/validation/schemas.js").OHLCVTimeframeSchema>;
        array: <T>(schema: import("zod").ZodType<T>, data: unknown[], context?: import("../../core/logger.js").RequestContext) => T[];
    };
    protected attachCorrelationId(error: unknown, correlationId: string): Error;
    protected abstract symbolToExchange(symbol: string): string;
    protected abstract symbolFromExchange(exchangeSymbol: string): string;
}
//# sourceMappingURL=BaseAdapterCore.d.ts.map