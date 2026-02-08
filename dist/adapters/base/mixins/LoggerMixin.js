/**
 * Logger Mixin
 *
 * Provides logging capabilities for adapters with lazy initialization.
 */
import { Logger, LogLevel } from '../../../core/logger.js';
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
export function LoggerMixin(Base) {
    return class LoggerMixinClass extends Base {
        /** @internal */
        _logger;
        /**
         * Get logger instance (lazy initialization with adapter name as context)
         * @internal
         */
        get logger() {
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
        debug(message, meta) {
            this.logger.debug(message, meta);
        }
        /**
         * Log info message
         * @internal
         */
        info(message, meta) {
            this.logger.info(message, meta);
        }
        /**
         * Log warning message
         * @internal
         */
        warn(message, meta) {
            this.logger.warn(message, meta);
        }
        /**
         * Log error message
         * @internal
         */
        error(message, error, meta) {
            this.logger.error(message, error, meta);
        }
    };
}
//# sourceMappingURL=LoggerMixin.js.map