/**
 * Configuration Validation Utilities
 *
 * Validates environment variables and exchange configurations
 */
import type { SupportedExchange } from '../factory.js';
/**
 * Validation error with helpful context
 */
export declare class ConfigurationError extends Error {
    readonly exchange: SupportedExchange;
    readonly missingVars: string[];
    constructor(message: string, exchange: SupportedExchange, missingVars: string[]);
}
/**
 * Validate that required environment variables are present for an exchange
 *
 * @param exchange - Exchange to validate configuration for
 * @throws {ConfigurationError} If required variables are missing
 *
 * @example
 * ```typescript
 * import { validateConfig } from 'perp-dex-sdk';
 *
 * try {
 *   validateConfig('hyperliquid');
 *   console.log('✅ Configuration valid');
 * } catch (error) {
 *   if (error instanceof ConfigurationError) {
 *     console.error('Missing variables:', error.missingVars);
 *   }
 * }
 * ```
 */
export declare function validateConfig(exchange: SupportedExchange): void;
/**
 * Validate private key format (Ethereum/EIP-712)
 *
 * @param key - Private key to validate
 * @param allowPrefix - Whether to allow 0x prefix (default: true)
 * @returns true if valid
 */
export declare function isValidPrivateKey(key: string, allowPrefix?: boolean): boolean;
/**
 * Validate API key format (basic check)
 *
 * @param key - API key to validate
 * @returns true if valid (non-empty, reasonable length)
 */
export declare function isValidApiKey(key: string): boolean;
/**
 * Get helpful error message for missing configuration
 *
 * @param exchange - Exchange name
 * @param missingVars - Array of missing variable names
 * @returns Formatted error message with instructions
 */
export declare function getConfigErrorMessage(exchange: SupportedExchange, missingVars: string[]): string;
/**
 * Check if running in Node.js environment (has process.env)
 */
export declare function hasEnvironmentSupport(): boolean;
/**
 * Validate all required environment variables for multiple exchanges
 *
 * @param exchanges - Array of exchanges to validate
 * @returns Object with validation results per exchange
 */
export declare function validateMultipleConfigs(exchanges: SupportedExchange[]): Record<SupportedExchange, {
    valid: boolean;
    missing: string[];
}>;
/**
 * Get all environment variable names required for an exchange
 *
 * @param exchange - Exchange name
 * @returns Array of required environment variable names
 */
export declare function getRequiredEnvVars(exchange: SupportedExchange): string[];
/**
 * Mask sensitive values for logging (show only first/last 4 chars)
 *
 * @param value - Sensitive value to mask
 * @param showChars - Number of characters to show at start/end (default: 4)
 * @returns Masked value
 *
 * @example
 * ```typescript
 * maskSensitive('0x1234567890abcdef');  // "0x12...cdef"
 * ```
 */
export declare function maskSensitive(value: string, showChars?: number): string;
//# sourceMappingURL=config.d.ts.map