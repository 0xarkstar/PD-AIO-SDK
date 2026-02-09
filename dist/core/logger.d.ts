/**
 * Structured Logging System
 *
 * Provides JSON-based structured logging with levels, context, and metadata
 */
/**
 * Log levels in order of severity
 */
export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error"
}
/**
 * Log entry structure
 */
export interface LogEntry {
    /** Timestamp in ISO 8601 format */
    timestamp: string;
    /** Log level */
    level: LogLevel;
    /** Logger context (e.g., adapter name) */
    context: string;
    /** Log message */
    message: string;
    /** Correlation ID for request tracing */
    correlationId?: string;
    /** Additional metadata */
    meta?: Record<string, unknown>;
    /** Error object (for error logs) */
    error?: {
        name: string;
        message: string;
        stack?: string;
        code?: string;
    };
}
/**
 * Request context for correlation tracking
 */
export interface RequestContext {
    /** Unique correlation ID for request tracing */
    correlationId: string;
    /** Adapter/exchange name */
    adapter: string;
    /** Method being called */
    method: string;
    /** Request start timestamp */
    timestamp: number;
    /** Additional request metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Generate a unique correlation ID
 */
export declare function generateCorrelationId(): string;
/**
 * Create a new request context
 */
export declare function createRequestContext(adapter: string, method: string, metadata?: Record<string, unknown>): RequestContext;
/**
 * Logger configuration options
 */
export interface LoggerConfig {
    /** Minimum log level to output */
    level?: LogLevel;
    /** Whether to enable logging */
    enabled?: boolean;
    /** Custom log output function */
    output?: (entry: LogEntry) => void;
    /** Whether to mask sensitive data */
    maskSensitiveData?: boolean;
    /** Default correlation ID (can be overridden per-call) */
    correlationId?: string;
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
export declare class Logger {
    private readonly context;
    private level;
    private enabled;
    private output;
    private maskSensitiveData;
    private correlationId?;
    constructor(context: string, config?: LoggerConfig);
    /**
     * Log a debug message
     */
    debug(message: string, meta?: Record<string, unknown>): void;
    /**
     * Log an info message
     */
    info(message: string, meta?: Record<string, unknown>): void;
    /**
     * Log a warning message
     */
    warn(message: string, meta?: Record<string, unknown>): void;
    /**
     * Log an error message
     *
     * @param message - Error message
     * @param error - Optional error object
     * @param meta - Optional metadata
     */
    error(message: string, error?: Error, meta?: Record<string, unknown>): void;
    /**
     * Set the minimum log level
     */
    setLevel(level: LogLevel): void;
    /**
     * Enable or disable logging
     */
    setEnabled(enabled: boolean): void;
    /**
     * Set correlation ID for request tracing
     */
    setCorrelationId(correlationId: string | undefined): void;
    /**
     * Get current correlation ID
     */
    getCorrelationId(): string | undefined;
    /**
     * Get logger configuration (used by createChildLogger)
     */
    getConfig(): {
        context: string;
    } & Required<Omit<LoggerConfig, 'correlationId'>> & Pick<LoggerConfig, 'correlationId'>;
    /**
     * Create a child logger with a specific correlation ID
     */
    withCorrelationId(correlationId: string): Logger;
    /**
     * Internal log method
     */
    private log;
    /**
     * Default log output (JSON to console)
     */
    private defaultOutput;
    /**
     * Serialize error object for logging
     */
    private serializeError;
    /**
     * Mask sensitive data in metadata
     */
    private maskSensitive;
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
export declare function createChildLogger(parent: Logger, childContext: string): Logger;
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
export declare function formatLogEntry(entry: LogEntry): string;
//# sourceMappingURL=logger.d.ts.map