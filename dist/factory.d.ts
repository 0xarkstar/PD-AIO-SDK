/**
 * Exchange Factory
 *
 * Factory function for creating exchange adapter instances.
 * Uses lazy loading via dynamic imports — only the requested adapter is loaded.
 */
import type { ExchangeConfig, IExchangeAdapter } from './types/index.js';
import type { HyperliquidConfig } from './adapters/hyperliquid/index.js';
import type { LighterConfig } from './adapters/lighter/index.js';
import type { GRVTAdapterConfig } from './adapters/grvt/index.js';
import type { ParadexConfig } from './adapters/paradex/index.js';
import type { EdgeXConfig } from './adapters/edgex/index.js';
import type { BackpackConfig } from './adapters/backpack/index.js';
import type { NadoConfig } from './adapters/nado/index.js';
import type { VariationalConfig } from './adapters/variational/index.js';
import type { ExtendedConfig } from './adapters/extended/index.js';
import type { DydxConfig } from './adapters/dydx/index.js';
import type { JupiterAdapterConfig } from './adapters/jupiter/index.js';
import type { DriftConfig } from './adapters/drift/index.js';
import type { GmxConfig } from './adapters/gmx/index.js';
import type { AsterConfig } from './adapters/aster/index.js';
import type { PacificaConfig } from './adapters/pacifica/index.js';
import type { OstiumConfig } from './adapters/ostium/index.js';
export type SupportedExchange = 'hyperliquid' | 'lighter' | 'grvt' | 'paradex' | 'edgex' | 'backpack' | 'nado' | 'variational' | 'extended' | 'dydx' | 'jupiter' | 'drift' | 'gmx' | 'aster' | 'pacifica' | 'ostium';
export type ExchangeConfigMap = {
    hyperliquid: HyperliquidConfig;
    lighter: LighterConfig;
    grvt: GRVTAdapterConfig;
    paradex: ParadexConfig;
    edgex: EdgeXConfig;
    backpack: BackpackConfig;
    nado: NadoConfig;
    variational: VariationalConfig;
    extended: ExtendedConfig;
    dydx: DydxConfig;
    jupiter: JupiterAdapterConfig;
    drift: DriftConfig;
    gmx: GmxConfig;
    aster: AsterConfig;
    pacifica: PacificaConfig;
    ostium: OstiumConfig;
};
/**
 * Type for adapter constructor function
 */
export type AdapterConstructor<C extends ExchangeConfig = ExchangeConfig> = new (config?: C) => IExchangeAdapter;
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
export declare function registerExchange<C extends ExchangeConfig>(id: string, constructor: AdapterConstructor<C>): void;
/**
 * Unregister an exchange adapter
 *
 * @param id - Exchange identifier to remove
 * @returns true if adapter was removed, false if not found
 */
export declare function unregisterExchange(id: string): boolean;
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
export declare function createExchange<T extends SupportedExchange>(exchange: T, config?: ExchangeConfigMap[T]): Promise<IExchangeAdapter>;
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
export declare function createExchangeSync<T extends SupportedExchange>(exchange: T, config?: ExchangeConfigMap[T]): IExchangeAdapter;
/**
 * Preload specific adapters into cache for synchronous access
 *
 * @param exchanges - List of exchange identifiers to preload
 */
export declare function preloadAdapters(exchanges: SupportedExchange[]): Promise<void>;
/**
 * Get list of supported exchanges
 *
 * Returns all registered exchange IDs including both built-in
 * and custom-registered adapters.
 */
export declare function getSupportedExchanges(): string[];
/**
 * Get list of built-in exchanges (for type safety)
 */
export declare function getBuiltInExchanges(): SupportedExchange[];
/**
 * Check if an exchange is supported
 */
export declare function isExchangeSupported(exchange: string): boolean;
/**
 * Check if an exchange is a built-in supported exchange
 */
export declare function isBuiltInExchange(exchange: string): exchange is SupportedExchange;
//# sourceMappingURL=factory.d.ts.map