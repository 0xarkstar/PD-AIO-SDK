/**
 * Structured Logging System
 *
 * Provides JSON-based structured logging with levels, context, and metadata
 */
/**
 * Log levels in order of severity
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel || (LogLevel = {}));
/**
 * Log level priorities for filtering
 */
const LOG_LEVEL_PRIORITY = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
};
/**
 * Generate a unique correlation ID
 */
export function generateCorrelationId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `${timestamp}-${random}`;
}
/**
 * Create a new request context
 */
export function createRequestContext(adapter, method, metadata) {
    return {
        correlationId: generateCorrelationId(),
        adapter,
        method,
        timestamp: Date.now(),
        metadata,
    };
}
/**
 * Structured logger with JSON output
 *
 * @example
 * ```typescript
 * const logger = new Logger('HyperliquidAdapter');
 *
 * logger.info('Fetching markets', { count: 10 });
 * logger.error('Order failed', new Error('Insufficient margin'));
 * logger.debug('WebSocket message received', { type: 'orderUpdate' });
 * ```
 */
export class Logger {
    context;
    level;
    enabled;
    output;
    maskSensitiveData;
    correlationId;
    constructor(context, config = {}) {
        this.context = context;
        this.level = config.level ?? LogLevel.INFO;
        this.enabled = config.enabled ?? true;
        this.output = config.output ?? this.defaultOutput;
        this.maskSensitiveData = config.maskSensitiveData ?? true;
        this.correlationId = config.correlationId;
    }
    /**
     * Log a debug message
     */
    debug(message, meta) {
        this.log(LogLevel.DEBUG, message, meta);
    }
    /**
     * Log an info message
     */
    info(message, meta) {
        this.log(LogLevel.INFO, message, meta);
    }
    /**
     * Log a warning message
     */
    warn(message, meta) {
        this.log(LogLevel.WARN, message, meta);
    }
    /**
     * Log an error message
     *
     * @param message - Error message
     * @param error - Optional error object
     * @param meta - Optional metadata
     */
    error(message, error, meta) {
        const errorMeta = error ? { error: this.serializeError(error) } : {};
        this.log(LogLevel.ERROR, message, { ...meta, ...errorMeta });
    }
    /**
     * Set the minimum log level
     */
    setLevel(level) {
        this.level = level;
    }
    /**
     * Enable or disable logging
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    /**
     * Set correlation ID for request tracing
     */
    setCorrelationId(correlationId) {
        this.correlationId = correlationId;
    }
    /**
     * Get current correlation ID
     */
    getCorrelationId() {
        return this.correlationId;
    }
    /**
     * Create a child logger with a specific correlation ID
     */
    withCorrelationId(correlationId) {
        return new Logger(this.context, {
            level: this.level,
            enabled: this.enabled,
            output: this.output,
            maskSensitiveData: this.maskSensitiveData,
            correlationId,
        });
    }
    /**
     * Internal log method
     */
    log(level, message, meta) {
        if (!this.enabled)
            return;
        // Check if log level meets minimum threshold
        if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.level]) {
            return;
        }
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            context: this.context,
            message,
        };
        // Add correlation ID if present
        if (this.correlationId) {
            entry.correlationId = this.correlationId;
        }
        if (meta && Object.keys(meta).length > 0) {
            entry.meta = this.maskSensitiveData ? this.maskSensitive(meta) : meta;
        }
        this.output(entry);
    }
    /**
     * Default log output (JSON to console)
     */
    defaultOutput(entry) {
        console.log(JSON.stringify(entry));
    }
    /**
     * Serialize error object for logging
     */
    serializeError(error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code,
        };
    }
    /**
     * Mask sensitive data in metadata
     */
    maskSensitive(data) {
        const masked = {};
        const sensitiveKeys = [
            'privatekey',
            'apikey',
            'apisecret',
            'password',
            'secret',
            'token',
            'auth',
            'authorization',
            'signature',
        ];
        for (const key of Object.keys(data)) {
            const value = data[key];
            const lowerKey = key.toLowerCase();
            // Check if this key contains sensitive data
            const isSensitive = sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive));
            if (isSensitive && typeof value === 'string') {
                // Mask all but last 4 characters
                masked[key] = value.length > 4 ? '***' + value.slice(-4) : '***';
            }
            else if (isSensitive) {
                // Non-string sensitive values get fully masked
                masked[key] = '***';
            }
            else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // Recursively mask nested objects (only if not sensitive)
                masked[key] = this.maskSensitive(value);
            }
            else {
                // Non-sensitive values pass through unchanged
                masked[key] = value;
            }
        }
        return masked;
    }
}
/**
 * Create a child logger with additional context
 *
 * @param parent - Parent logger
 * @param childContext - Additional context to append
 * @returns New logger instance
 *
 * @example
 * ```typescript
 * const parentLogger = new Logger('Exchange');
 * const childLogger = createChildLogger(parentLogger, 'WebSocket');
 * // Child logger context will be: "Exchange:WebSocket"
 * ```
 */
export function createChildLogger(parent, childContext) {
    const fullContext = `${parent.context}:${childContext}`;
    return new Logger(fullContext, {
        level: parent.level,
        enabled: parent.enabled,
        output: parent.output,
        maskSensitiveData: parent.maskSensitiveData,
        correlationId: parent.correlationId,
    });
}
/**
 * Format log entry as human-readable string
 *
 * @param entry - Log entry to format
 * @returns Formatted string
 *
 * @example
 * ```typescript
 * const entry: LogEntry = {
 *   timestamp: '2025-12-01T10:00:00.000Z',
 *   level: LogLevel.INFO,
 *   context: 'HyperliquidAdapter',
 *   message: 'Order created',
 *   meta: { orderId: '123' }
 * };
 *
 * console.log(formatLogEntry(entry));
 * // Output: [2025-12-01T10:00:00.000Z] INFO [HyperliquidAdapter] Order created {"orderId":"123"}
 * ```
 */
export function formatLogEntry(entry) {
    const parts = [
        `[${entry.timestamp}]`,
        entry.level.toUpperCase(),
        `[${entry.context}]`,
    ];
    // Add correlation ID if present
    if (entry.correlationId) {
        parts.push(`[${entry.correlationId}]`);
    }
    parts.push(entry.message);
    if (entry.meta) {
        parts.push(JSON.stringify(entry.meta));
    }
    if (entry.error) {
        parts.push(`Error: ${entry.error.message}`);
        if (entry.error.stack) {
            parts.push(`\nStack: ${entry.error.stack}`);
        }
    }
    return parts.join(' ');
}
//# sourceMappingURL=logger.js.map