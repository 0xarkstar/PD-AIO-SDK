/**
 * Exchange Factory
 *
 * Factory function for creating exchange adapter instances.
 * Supports both built-in adapters and custom adapters via plugin registration.
 */
import { Logger } from './core/logger.js';
import { HyperliquidAdapter } from './adapters/hyperliquid/index.js';
import { LighterAdapter } from './adapters/lighter/index.js';
import { GRVTAdapter } from './adapters/grvt/index.js';
import { ParadexAdapter } from './adapters/paradex/index.js';
import { EdgeXAdapter } from './adapters/edgex/index.js';
import { BackpackAdapter } from './adapters/backpack/index.js';
import { NadoAdapter } from './adapters/nado/index.js';
import { VariationalAdapter } from './adapters/variational/index.js';
import { ExtendedAdapter } from './adapters/extended/index.js';
import { DydxAdapter } from './adapters/dydx/index.js';
import { JupiterAdapter } from './adapters/jupiter/index.js';
import { DriftAdapter } from './adapters/drift/index.js';
import { GmxAdapter } from './adapters/gmx/index.js';
import { AsterAdapter } from './adapters/aster/index.js';
import { PacificaAdapter } from './adapters/pacifica/index.js';
import { OstiumAdapter } from './adapters/ostium/index.js';
/**
 * Plugin registry for exchange adapters
 *
 * Built-in adapters are pre-registered. Custom adapters can be added
 * via registerExchange() for extensibility.
 */
const adapterRegistry = new Map([
    ['hyperliquid', HyperliquidAdapter],
    ['lighter', LighterAdapter],
    ['grvt', GRVTAdapter],
    ['paradex', ParadexAdapter],
    ['edgex', EdgeXAdapter],
    ['backpack', BackpackAdapter],
    ['nado', NadoAdapter],
    ['variational', VariationalAdapter],
    ['extended', ExtendedAdapter],
    ['dydx', DydxAdapter],
    ['jupiter', JupiterAdapter],
    ['drift', DriftAdapter],
    ['gmx', GmxAdapter],
    ['aster', AsterAdapter],
    ['pacifica', PacificaAdapter],
    ['ostium', OstiumAdapter],
]);
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
 * const exchange = createExchange('myexchange' as any, { ... });
 * ```
 */
const factoryLogger = new Logger('ExchangeFactory');
export function registerExchange(id, constructor) {
    const normalizedId = id.toLowerCase();
    if (adapterRegistry.has(normalizedId)) {
        factoryLogger.warn(`Exchange '${normalizedId}' already registered. Overwriting.`);
    }
    adapterRegistry.set(normalizedId, constructor);
}
/**
 * Unregister an exchange adapter
 *
 * @param id - Exchange identifier to remove
 * @returns true if adapter was removed, false if not found
 */
export function unregisterExchange(id) {
    return adapterRegistry.delete(id.toLowerCase());
}
/**
 * Create an exchange adapter instance
 *
 * Uses the adapter registry to instantiate adapters. Built-in adapters
 * are pre-registered, and custom adapters can be added via registerExchange().
 *
 * @param exchange - Exchange identifier
 * @param config - Exchange-specific configuration
 * @returns Exchange adapter instance
 *
 * @example
 * ```typescript
 * import { createExchange } from 'pd-aio-sdk';
 * import { Wallet } from 'ethers';
 *
 * const wallet = new Wallet(process.env.PRIVATE_KEY);
 * const exchange = createExchange('hyperliquid', {
 *   wallet,
 *   testnet: true
 * });
 *
 * await exchange.initialize();
 * const markets = await exchange.fetchMarkets();
 * ```
 */
export function createExchange(exchange, config) {
    const normalizedId = exchange.toLowerCase();
    const Constructor = adapterRegistry.get(normalizedId);
    if (!Constructor) {
        throw new Error(`Unknown exchange: ${exchange}. ` +
            `Supported exchanges: ${getSupportedExchanges().join(', ')}. ` +
            `Use registerExchange() to add custom adapters.`);
    }
    return new Constructor(config);
}
/**
 * Get list of supported exchanges
 *
 * Returns all registered exchange IDs including both built-in
 * and custom-registered adapters.
 */
export function getSupportedExchanges() {
    return Array.from(adapterRegistry.keys());
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
    return adapterRegistry.has(exchange.toLowerCase());
}
/**
 * Check if an exchange is a built-in supported exchange
 */
export function isBuiltInExchange(exchange) {
    return getBuiltInExchanges().includes(exchange);
}
//# sourceMappingURL=factory.js.map