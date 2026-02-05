/**
 * Logger Mixin
 *
 * Provides logging capabilities for adapters with lazy initialization.
 */

import { Logger, LogLevel } from '../../../core/logger.js';
import type { ExchangeConfig } from '../../../types/index.js';

/**
 * Constructor type for mixin pattern
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T = object> = new (...args: any[]) => T;

/**
 * Base interface for logger mixin requirements
 */
export interface ILoggerMixinBase {
  readonly name: string;
  readonly config: ExchangeConfig;
}

/**
 * Interface for logger capabilities
 */
export interface ILoggerCapable {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
}

/**
 * Logger Mixin - adds logging capabilities to a class
 *
 * @example
 * ```typescript
 * class MyAdapter extends LoggerMixin(BaseClass) {
 *   doSomething() {
 *     this.debug('Doing something');
 *   }
 * }
 * ```
 */
export function LoggerMixin<T extends Constructor<ILoggerMixinBase>>(Base: T) {
  return class LoggerMixinClass extends Base {
    /** @internal */
    _logger?: Logger;

    /**
     * Get logger instance (lazy initialization with adapter name as context)
     * @internal
     */
    get logger(): Logger {
      if (!this._logger) {
        this._logger = new Logger(this.name, {
          level: this.config.debug ? LogLevel.DEBUG : LogLevel.INFO,
          enabled: true,
          maskSensitiveData: true,
        });
      }
      return this._logger;
    }

    /**
     * Log debug message
     * @internal
     */
    debug(message: string, meta?: Record<string, unknown>): void {
      this.logger.debug(message, meta);
    }

    /**
     * Log info message
     * @internal
     */
    info(message: string, meta?: Record<string, unknown>): void {
      this.logger.info(message, meta);
    }

    /**
     * Log warning message
     * @internal
     */
    warn(message: string, meta?: Record<string, unknown>): void {
      this.logger.warn(message, meta);
    }

    /**
     * Log error message
     * @internal
     */
    error(message: string, error?: Error, meta?: Record<string, unknown>): void {
      this.logger.error(message, error, meta);
    }
  };
}
