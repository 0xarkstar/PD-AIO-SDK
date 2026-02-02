/**
 * Health Check Types
 *
 * Types for monitoring exchange adapter health and connectivity
 */
/**
 * Determine overall status from component statuses
 */
export function determineHealthStatus(apiReachable, wsConnected, authValid) {
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
export function isHealthy(status) {
    return status === 'healthy' || status === 'degraded';
}
/**
 * Check if health result indicates critical failure
 */
export function isCriticallyUnhealthy(result) {
    return result.status === 'unhealthy' || !result.api.reachable;
}
//# sourceMappingURL=health.js.map