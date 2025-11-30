/**
 * Structured Logging System
 *
 * Provides JSON-based structured logging with levels, context, and metadata
 */

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Log level priorities for filtering
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

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
  private readonly context: string;
  private level: LogLevel;
  private enabled: boolean;
  private output: (entry: LogEntry) => void;
  private maskSensitiveData: boolean;

  constructor(context: string, config: LoggerConfig = {}) {
    this.context = context;
    this.level = config.level ?? LogLevel.INFO;
    this.enabled = config.enabled ?? true;
    this.output = config.output ?? this.defaultOutput;
    this.maskSensitiveData = config.maskSensitiveData ?? true;
  }

  /**
   * Log a debug message
   */
  debug(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  /**
   * Log an info message
   */
  info(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, meta);
  }

  /**
   * Log a warning message
   */
  warn(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, meta);
  }

  /**
   * Log an error message
   *
   * @param message - Error message
   * @param error - Optional error object
   * @param meta - Optional metadata
   */
  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    const errorMeta = error ? { error: this.serializeError(error) } : {};
    this.log(LogLevel.ERROR, message, { ...meta, ...errorMeta });
  }

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Enable or disable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (!this.enabled) return;

    // Check if log level meets minimum threshold
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.level]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
    };

    if (meta && Object.keys(meta).length > 0) {
      entry.meta = this.maskSensitiveData ? this.maskSensitive(meta) : meta;
    }

    this.output(entry);
  }

  /**
   * Default log output (JSON to console)
   */
  private defaultOutput(entry: LogEntry): void {
    console.log(JSON.stringify(entry));
  }

  /**
   * Serialize error object for logging
   */
  private serializeError(error: Error): LogEntry['error'] {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
    };
  }

  /**
   * Mask sensitive data in metadata
   */
  private maskSensitive(data: Record<string, unknown>): Record<string, unknown> {
    const masked: Record<string, unknown> = {};
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
      } else if (isSensitive) {
        // Non-string sensitive values get fully masked
        masked[key] = '***';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursively mask nested objects (only if not sensitive)
        masked[key] = this.maskSensitive(value as Record<string, unknown>);
      } else {
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
export function createChildLogger(parent: Logger, childContext: string): Logger {
  const fullContext = `${(parent as any).context}:${childContext}`;
  return new Logger(fullContext, {
    level: (parent as any).level,
    enabled: (parent as any).enabled,
    output: (parent as any).output,
    maskSensitiveData: (parent as any).maskSensitiveData,
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
export function formatLogEntry(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    entry.level.toUpperCase(),
    `[${entry.context}]`,
    entry.message,
  ];

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
