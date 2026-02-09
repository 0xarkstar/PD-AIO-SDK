/**
 * Configuration Validation Utilities
 *
 * Validates environment variables and exchange configurations
 */
/**
 * Environment variable requirements per exchange
 *
 * Naming convention: {EXCHANGE}_{CREDENTIAL_TYPE}
 * - PRIVATE_KEY: EVM/Ethereum private key (EIP-712 signing)
 * - STARK_PRIVATE_KEY: StarkNet/StarkEx private key (Pedersen hash)
 * - API_KEY: API authentication key
 * - API_SECRET: API signing secret (HMAC)
 */
const EXCHANGE_ENV_REQUIREMENTS = {
    // EIP-712 signature based
    hyperliquid: ['HYPERLIQUID_PRIVATE_KEY'],
    nado: ['NADO_PRIVATE_KEY'],
    // API Key + HMAC signature based
    lighter: ['LIGHTER_API_KEY', 'LIGHTER_API_SECRET'],
    // StarkEx/L2 signature based (Pedersen hash + ECDSA)
    edgex: ['EDGEX_STARK_PRIVATE_KEY'],
    // API Key + optional StarkNet signing
    extended: ['EXTENDED_API_KEY'],
    // HMAC signature based (API in development)
    variational: ['VARIATIONAL_API_KEY', 'VARIATIONAL_API_SECRET'],
    // Existing exchanges
    grvt: ['GRVT_PRIVATE_KEY', 'GRVT_API_KEY'],
    paradex: ['PARADEX_STARK_PRIVATE_KEY'],
    backpack: ['BACKPACK_API_KEY', 'BACKPACK_SECRET_KEY'],
    // Cosmos SDK based (dYdX v4)
    dydx: ['DYDX_MNEMONIC'],
    // Solana based (Jupiter Perps)
    jupiter: ['JUPITER_WALLET_ADDRESS'], // Read-only; for trading add JUPITER_PRIVATE_KEY
    // Solana based (Drift Protocol)
    drift: ['DRIFT_WALLET_ADDRESS'], // Read-only; for trading add DRIFT_PRIVATE_KEY
    // EVM based on-chain DEX (GMX v2 on Arbitrum/Avalanche)
    gmx: ['GMX_CHAIN'], // Chain selection; add GMX_WALLET_ADDRESS for positions
    // Aster (BNB Chain, Binance-style HMAC)
    aster: ['ASTER_API_KEY', 'ASTER_API_SECRET'],
    // Pacifica (Solana, Ed25519)
    pacifica: ['PACIFICA_API_KEY', 'PACIFICA_API_SECRET'],
    // Ostium (Arbitrum, EVM contracts)
    ostium: ['OSTIUM_PRIVATE_KEY'],
};
/**
 * Validation error with helpful context
 */
export class ConfigurationError extends Error {
    exchange;
    missingVars;
    constructor(message, exchange, missingVars) {
        super(message);
        this.exchange = exchange;
        this.missingVars = missingVars;
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
export function validateConfig(exchange) {
    const required = EXCHANGE_ENV_REQUIREMENTS[exchange];
    const missing = required.filter((key) => {
        const value = process.env[key];
        return (!value ||
            value.trim() === '' ||
            value === 'your_private_key_here' ||
            value === 'your_api_key_here');
    });
    if (missing.length > 0) {
        throw new ConfigurationError(`Missing or invalid environment variables for ${exchange}:\n` +
            missing.map((key) => `  ❌ ${key}`).join('\n') +
            `\n\n📝 See .env.example for configuration template.\n` +
            `💡 Copy .env.example to .env and fill in your credentials.`, exchange, missing);
    }
}
/**
 * Validate private key format (Ethereum/EIP-712)
 *
 * @param key - Private key to validate
 * @param allowPrefix - Whether to allow 0x prefix (default: true)
 * @returns true if valid
 */
export function isValidPrivateKey(key, allowPrefix = true) {
    if (!key)
        return false;
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
export function isValidApiKey(key) {
    if (!key)
        return false;
    const trimmed = key.trim();
    // API keys should be at least 16 characters and not placeholder text
    return (trimmed.length >= 16 &&
        trimmed !== 'your_api_key_here' &&
        trimmed !== 'your_api_secret_here' &&
        !/^x+$/i.test(trimmed));
}
/**
 * Get helpful error message for missing configuration
 *
 * @param exchange - Exchange name
 * @param missingVars - Array of missing variable names
 * @returns Formatted error message with instructions
 */
export function getConfigErrorMessage(exchange, missingVars) {
    const varList = missingVars.map((v) => `  - ${v}`).join('\n');
    const instructions = {
        hyperliquid: 'Export your MetaMask private key or generate a new wallet',
        lighter: 'Register at lighter.xyz and create API key + secret credentials',
        grvt: 'Register at grvt.io, generate API key, and use your ETH wallet',
        paradex: 'Generate a StarkNet wallet key (PARADEX_STARK_PRIVATE_KEY)',
        edgex: 'Register at edgex.exchange and get your StarkEx L2 private key',
        backpack: 'Register at backpack.exchange and create ED25519 API credentials',
        nado: 'Export your MetaMask private key for Ink L2 trading on Nado',
        variational: 'Register at variational.io and create HMAC API credentials',
        extended: 'Register at extended.exchange and generate API key',
        dydx: 'Generate a Cosmos wallet mnemonic (24 words) for dYdX v4 trading',
        jupiter: 'Provide your Solana wallet address for Jupiter Perps (add private key for trading)',
        drift: 'Provide your Solana wallet address for Drift Protocol (add private key for trading)',
        gmx: 'Set GMX_CHAIN to arbitrum or avalanche (add GMX_WALLET_ADDRESS for position data)',
        aster: 'Register at asterdex.com and create API key + secret (HMAC-SHA256)',
        pacifica: 'Register at pacifica.fi and create Ed25519 API credentials',
        ostium: 'Export your MetaMask private key for Arbitrum trading on Ostium',
    };
    return (`❌ Missing environment variables for ${exchange}:\n\n` +
        `${varList}\n\n` +
        `📝 Setup Instructions:\n` +
        `1. Copy .env.example to .env\n` +
        `2. ${instructions[exchange]}\n` +
        `3. Fill in the credentials in .env file\n` +
        `4. Ensure .env is in .gitignore (NEVER commit credentials!)\n`);
}
/**
 * Check if running in Node.js environment (has process.env)
 */
export function hasEnvironmentSupport() {
    return typeof process !== 'undefined' && typeof process.env === 'object';
}
/**
 * Validate all required environment variables for multiple exchanges
 *
 * @param exchanges - Array of exchanges to validate
 * @returns Object with validation results per exchange
 */
export function validateMultipleConfigs(exchanges) {
    const results = {};
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
export function getRequiredEnvVars(exchange) {
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
export function maskSensitive(value, showChars = 4) {
    if (!value || value.length <= showChars * 2) {
        return '***';
    }
    const start = value.slice(0, showChars);
    const end = value.slice(-showChars);
    return `${start}...${end}`;
}
//# sourceMappingURL=config.js.map