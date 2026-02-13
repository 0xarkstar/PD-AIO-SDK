/**
 * Exchange Factory
 *
 * Factory function for creating exchange adapter instances.
 * Uses lazy loading via dynamic imports — only the requested adapter is loaded.
 */
import { Logger } from './core/logger.js';
/**
 * Lazy adapter loader map
 * Each entry is a function that dynamically imports the adapter module
 */
const adapterLoaders = {
    hyperliquid: async () => (await import('./adapters/hyperliquid/index.js')).HyperliquidAdapter,
    lighter: async () => (await import('./adapters/lighter/index.js')).LighterAdapter,
    grvt: async () => (await import('./adapters/grvt/index.js')).GRVTAdapter,
    paradex: async () => (await import('./adapters/paradex/index.js')).ParadexAdapter,
    edgex: async () => (await import('./adapters/edgex/index.js')).EdgeXAdapter,
    backpack: async () => (await import('./adapters/backpack/index.js')).BackpackAdapter,
    nado: async () => (await import('./adapters/nado/index.js')).NadoAdapter,
    variational: async () => (await import('./adapters/variational/index.js')).VariationalAdapter,
    extended: async () => (await import('./adapters/extended/index.js')).ExtendedAdapter,
    dydx: async () => (await import('./adapters/dydx/index.js')).DydxAdapter,
    jupiter: async () => (await import('./adapters/jupiter/index.js')).JupiterAdapter,
    drift: async () => (await import('./adapters/drift/index.js')).DriftAdapter,
    gmx: async () => (await import('./adapters/gmx/index.js')).GmxAdapter,
    aster: async () => (await import('./adapters/aster/index.js')).AsterAdapter,
    pacifica: async () => (await import('./adapters/pacifica/index.js')).PacificaAdapter,
    ostium: async () => (await import('./adapters/ostium/index.js')).OstiumAdapter,
};
/** Cache for loaded adapter constructors */
const adapterCache = new Map();
/** Custom adapter registry (for registerExchange) */
const customRegistry = new Map();
const factoryLogger = new Logger('ExchangeFactory');
/**
 * Register a custom exchange adapter
 *
 * Use this to add support for new exchanges without modifying the SDK.
 *
 * @param id - Unique exchange identifier (lowercase)
 * @param constructor - Adapter class constructor
 *
 * @example
 * ```typescript
 * import { registerExchange } from 'pd-aio-sdk';
 * import { MyCustomAdapter } from './my-adapter';
 *
 * // Register custom adapter
 * registerExchange('myexchange', MyCustomAdapter);
 *
 * // Now you can use it with createExchange
 * const exchange = await createExchange('myexchange' as any, { ... });
 * ```
 */
export function registerExchange(id, constructor) {
    const normalizedId = id.toLowerCase();
    if (customRegistry.has(normalizedId) || adapterLoaders[normalizedId]) {
        factoryLogger.warn(`Exchange '${normalizedId}' already registered. Overwriting.`);
    }
    customRegistry.set(normalizedId, constructor);
}
/**
 * Unregister an exchange adapter
 *
 * @param id - Exchange identifier to remove
 * @returns true if adapter was removed, false if not found
 */
export function unregisterExchange(id) {
    return customRegistry.delete(id.toLowerCase());
}
/**
 * Create an exchange adapter instance (async, lazy-loading)
 *
 * Uses dynamic imports to load only the requested adapter.
 * Built-in adapters are lazy-loaded on first use and cached.
 * Custom adapters registered via registerExchange() are resolved synchronously.
 *
 * @param exchange - Exchange identifier
 * @param config - Exchange-specific configuration
 * @returns Promise resolving to exchange adapter instance
 *
 * @example
 * ```typescript
 * import { createExchange } from 'pd-aio-sdk';
 * import { Wallet } from 'ethers';
 *
 * const wallet = new Wallet(process.env.PRIVATE_KEY);
 * const exchange = await createExchange('hyperliquid', {
 *   wallet,
 *   testnet: true
 * });
 *
 * await exchange.initialize();
 * const markets = await exchange.fetchMarkets();
 * ```
 */
export async function createExchange(exchange, config) {
    const normalizedId = exchange.toLowerCase();
    // Check custom registry first
    const customConstructor = customRegistry.get(normalizedId);
    if (customConstructor) {
        return new customConstructor(config);
    }
    // Check cache
    let Constructor = adapterCache.get(normalizedId);
    if (!Constructor) {
        const loader = adapterLoaders[normalizedId];
        if (!loader) {
            throw new Error(`Unknown exchange: ${exchange}. ` +
                `Supported exchanges: ${getSupportedExchanges().join(', ')}. ` +
                `Use registerExchange() to add custom adapters.`);
        }
        Constructor = await loader();
        adapterCache.set(normalizedId, Constructor);
    }
    return new Constructor(config);
}
/**
 * Create exchange adapter synchronously (requires pre-loaded adapters)
 *
 * Use preloadAdapters() first, or use createExchange() for automatic lazy loading.
 * Also works with adapters registered via registerExchange().
 *
 * @param exchange - Exchange identifier
 * @param config - Exchange-specific configuration
 * @returns Exchange adapter instance
 */
export function createExchangeSync(exchange, config) {
    const normalizedId = exchange.toLowerCase();
    const customConstructor = customRegistry.get(normalizedId);
    if (customConstructor) {
        return new customConstructor(config);
    }
    const Constructor = adapterCache.get(normalizedId);
    if (!Constructor) {
        throw new Error(`Exchange '${exchange}' not preloaded. Use createExchange() (async) or call preloadAdapters(['${exchange}']) first.`);
    }
    return new Constructor(config);
}
/**
 * Preload specific adapters into cache for synchronous access
 *
 * @param exchanges - List of exchange identifiers to preload
 */
export async function preloadAdapters(exchanges) {
    await Promise.all(exchanges.map(async (exchange) => {
        const normalizedId = exchange.toLowerCase();
        const loader = adapterLoaders[normalizedId];
        if (loader && !adapterCache.has(normalizedId)) {
            adapterCache.set(normalizedId, await loader());
        }
    }));
}
/**
 * Get list of supported exchanges
 *
 * Returns all registered exchange IDs including both built-in
 * and custom-registered adapters.
 */
export function getSupportedExchanges() {
    const builtInKeys = Object.keys(adapterLoaders);
    const customKeys = Array.from(customRegistry.keys());
    const allKeys = new Set([...builtInKeys, ...customKeys]);
    return Array.from(allKeys);
}
/**
 * Get list of built-in exchanges (for type safety)
 */
export function getBuiltInExchanges() {
    return [
        'hyperliquid',
        'lighter',
        'grvt',
        'paradex',
        'edgex',
        'backpack',
        'nado',
        'variational',
        'extended',
        'dydx',
        'jupiter',
        'drift',
        'gmx',
        'aster',
        'pacifica',
        'ostium',
    ];
}
/**
 * Check if an exchange is supported
 */
export function isExchangeSupported(exchange) {
    const normalizedId = exchange.toLowerCase();
    return normalizedId in adapterLoaders || customRegistry.has(normalizedId);
}
/**
 * Check if an exchange is a built-in supported exchange
 */
export function isBuiltInExchange(exchange) {
    return getBuiltInExchanges().includes(exchange);
}
//# sourceMappingURL=factory.js.map