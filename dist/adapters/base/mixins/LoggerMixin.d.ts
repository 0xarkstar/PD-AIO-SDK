/**
 * Logger Mixin
 *
 * Provides logging capabilities for adapters with lazy initialization.
 */
import { Logger } from '../../../core/logger.js';
import type { ExchangeConfig } from '../../../types/index.js';
/**
 * Constructor type for mixin pattern
 */
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
export declare function LoggerMixin<T extends Constructor<ILoggerMixinBase>>(Base: T): {
    new (...args: any[]): {
        /** @internal */
        _logger?: Logger;
        /**
         * Get logger instance (lazy initialization with adapter name as context)
         * @internal
         */
        readonly logger: Logger;
        /**
         * Log debug message
         * @internal
         */
        debug(message: string, meta?: Record<string, unknown>): void;
        /**
         * Log info message
         * @internal
         */
        info(message: string, meta?: Record<string, unknown>): void;
        /**
         * Log warning message
         * @internal
         */
        warn(message: string, meta?: Record<string, unknown>): void;
        /**
         * Log error message
         * @internal
         */
        error(message: string, error?: Error, meta?: Record<string, unknown>): void;
        readonly name: string;
        readonly config: ExchangeConfig;
    };
} & T;
//# sourceMappingURL=LoggerMixin.d.ts.map