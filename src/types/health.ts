/**
 * Health Check Types
 *
 * Types for monitoring exchange adapter health and connectivity
 */

/**
 * Overall health status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Component health status
 */
export interface ComponentHealth {
  /** Whether component is reachable/functional */
  reachable: boolean;

  /** Latency in milliseconds */
  latency: number;

  /** Optional error message */
  error?: string;
}

/**
 * Authentication health details
 */
export interface AuthHealth {
  /** Whether authentication is valid */
  valid: boolean;

  /** Token/session expiration timestamp (ms) */
  expiresAt?: number;

  /** Time until expiration (ms) */
  expiresIn?: number;

  /** Whether auth needs refresh soon */
  needsRefresh?: boolean;
}

/**
 * WebSocket health details
 */
export interface WebSocketHealth {
  /** Whether WebSocket is connected */
  connected: boolean;

  /** Whether currently reconnecting */
  reconnecting: boolean;

  /** Number of reconnection attempts */
  reconnectAttempts?: number;

  /** Uptime in milliseconds */
  uptime?: number;

  /** Last successful ping timestamp */
  lastPing?: number;
}

/**
 * Comprehensive health check result
 */
export interface HealthCheckResult {
  /** Overall health status */
  status: HealthStatus;

  /** Total check duration in milliseconds */
  latency: number;

  /** Exchange identifier */
  exchange: string;

  /** REST API health */
  api: ComponentHealth;

  /** WebSocket health (if supported) */
  websocket?: WebSocketHealth;

  /** Authentication health (if authenticated) */
  auth?: AuthHealth;

  /** Rate limit status */
  rateLimit?: {
    /** Remaining requests in current window */
    remaining: number;

    /** Total limit per window */
    limit: number;

    /** Window reset timestamp (ms) */
    resetAt: number;

    /** Percentage used (0-100) */
    percentUsed: number;
  };

  /** Timestamp of health check */
  timestamp: number;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  /** Timeout for health check in milliseconds (default: 5000) */
  timeout?: number;

  /** Whether to check WebSocket health (default: true) */
  checkWebSocket?: boolean;

  /** Whether to check authentication health (default: true) */
  checkAuth?: boolean;

  /** Whether to include rate limit info (default: true) */
  includeRateLimit?: boolean;

  /** Test endpoint to use for API check */
  testEndpoint?: string;
}

/**
 * Determine overall status from component statuses
 */
export function determineHealthStatus(
  apiReachable: boolean,
  wsConnected?: boolean,
  authValid?: boolean
): HealthStatus {
  // Critical: API must be reachable
  if (!apiReachable) {
    return 'unhealthy';
  }

  // If we have auth check and it's invalid, degraded
  if (authValid === false) {
    return 'degraded';
  }

  // If we check websocket and it's not connected, degraded
  if (wsConnected === false) {
    return 'degraded';
  }

  // All checks passed
  return 'healthy';
}

/**
 * Check if health status is acceptable for operations
 */
export function isHealthy(status: HealthStatus): boolean {
  return status === 'healthy' || status === 'degraded';
}

/**
 * Check if health result indicates critical failure
 */
export function isCriticallyUnhealthy(result: HealthCheckResult): boolean {
  return result.status === 'unhealthy' || !result.api.reachable;
}
