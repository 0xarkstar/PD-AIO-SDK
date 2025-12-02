/**
 * Configuration Validation Utilities
 *
 * Validates environment variables and exchange configurations
 */

import type { SupportedExchange } from '../factory.js';

/**
 * Environment variable requirements per exchange
 */
const EXCHANGE_ENV_REQUIREMENTS: Record<SupportedExchange, string[]> = {
  hyperliquid: ['HYPERLIQUID_PRIVATE_KEY'],
  lighter: ['LIGHTER_API_KEY', 'LIGHTER_API_SECRET', 'LIGHTER_ACCOUNT_ID'],
  grvt: ['GRVT_PRIVATE_KEY', 'GRVT_API_KEY'],
  paradex: ['PARADEX_PRIVATE_KEY', 'PARADEX_L1_RPC_URL'],
  edgex: ['EDGEX_PRIVATE_KEY', 'EDGEX_STARK_PRIVATE_KEY'],
  backpack: ['BACKPACK_API_KEY', 'BACKPACK_SECRET_KEY'],
  nado: ['NADO_PRIVATE_KEY'],
};

/**
 * Validation error with helpful context
 */
export class ConfigurationError extends Error {
  constructor(
    message: string,
    public readonly exchange: SupportedExchange,
    public readonly missingVars: string[]
  ) {
    super(message);
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
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
export function validateConfig(exchange: SupportedExchange): void {
  const required = EXCHANGE_ENV_REQUIREMENTS[exchange];
  const missing = required.filter((key) => {
    const value = process.env[key];
    return !value || value.trim() === '' || value === 'your_private_key_here' || value === 'your_api_key_here';
  });

  if (missing.length > 0) {
    throw new ConfigurationError(
      `Missing or invalid environment variables for ${exchange}:\n` +
        missing.map((key) => `  ❌ ${key}`).join('\n') +
        `\n\n📝 See .env.example for configuration template.\n` +
        `💡 Copy .env.example to .env and fill in your credentials.`,
      exchange,
      missing
    );
  }
}

/**
 * Validate private key format (Ethereum/EIP-712)
 *
 * @param key - Private key to validate
 * @param allowPrefix - Whether to allow 0x prefix (default: true)
 * @returns true if valid
 */
export function isValidPrivateKey(key: string, allowPrefix = true): boolean {
  if (!key) return false;

  const trimmed = key.trim();

  if (allowPrefix && trimmed.startsWith('0x')) {
    return /^0x[a-fA-F0-9]{64}$/.test(trimmed);
  }

  return /^[a-fA-F0-9]{64}$/.test(trimmed);
}

/**
 * Validate API key format (basic check)
 *
 * @param key - API key to validate
 * @returns true if valid (non-empty, reasonable length)
 */
export function isValidApiKey(key: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  // API keys should be at least 16 characters and not placeholder text
  return (
    trimmed.length >= 16 &&
    trimmed !== 'your_api_key_here' &&
    trimmed !== 'your_api_secret_here' &&
    !/^x+$/i.test(trimmed)
  );
}

/**
 * Get helpful error message for missing configuration
 *
 * @param exchange - Exchange name
 * @param missingVars - Array of missing variable names
 * @returns Formatted error message with instructions
 */
export function getConfigErrorMessage(exchange: SupportedExchange, missingVars: string[]): string {
  const varList = missingVars.map((v) => `  - ${v}`).join('\n');

  const instructions: Record<SupportedExchange, string> = {
    hyperliquid: 'Export your MetaMask private key or generate a new wallet',
    lighter: 'Register at lighter.xyz and create API credentials',
    grvt: 'Register at grvt.io, generate API key, and use your ETH wallet',
    paradex: 'Generate a StarkNet wallet key (different from Ethereum!)',
    edgex: 'Register at edgex.exchange and get both Ethereum and StarkEx keys',
    backpack: 'Register at backpack.exchange and create ED25519 API credentials',
    nado: 'Export your MetaMask private key for Ink L2 trading on Nado',
  };

  return (
    `❌ Missing environment variables for ${exchange}:\n\n` +
    `${varList}\n\n` +
    `📝 Setup Instructions:\n` +
    `1. Copy .env.example to .env\n` +
    `2. ${instructions[exchange]}\n` +
    `3. Fill in the credentials in .env file\n` +
    `4. Ensure .env is in .gitignore (NEVER commit credentials!)\n`
  );
}

/**
 * Check if running in Node.js environment (has process.env)
 */
export function hasEnvironmentSupport(): boolean {
  return typeof process !== 'undefined' && typeof process.env === 'object';
}

/**
 * Validate all required environment variables for multiple exchanges
 *
 * @param exchanges - Array of exchanges to validate
 * @returns Object with validation results per exchange
 */
export function validateMultipleConfigs(
  exchanges: SupportedExchange[]
): Record<SupportedExchange, { valid: boolean; missing: string[] }> {
  const results = {} as Record<SupportedExchange, { valid: boolean; missing: string[] }>;

  for (const exchange of exchanges) {
    const required = EXCHANGE_ENV_REQUIREMENTS[exchange];
    const missing = required.filter((key) => {
      const value = process.env[key];
      return !value || value.trim() === '';
    });

    results[exchange] = {
      valid: missing.length === 0,
      missing,
    };
  }

  return results;
}

/**
 * Get all environment variable names required for an exchange
 *
 * @param exchange - Exchange name
 * @returns Array of required environment variable names
 */
export function getRequiredEnvVars(exchange: SupportedExchange): string[] {
  return [...EXCHANGE_ENV_REQUIREMENTS[exchange]];
}

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
export function maskSensitive(value: string, showChars = 4): string {
  if (!value || value.length <= showChars * 2) {
    return '***';
  }

  const start = value.slice(0, showChars);
  const end = value.slice(-showChars);
  return `${start}...${end}`;
}
