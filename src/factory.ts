/**
 * Exchange Factory
 *
 * Factory function for creating exchange adapter instances.
 * Uses lazy loading via dynamic imports — only the requested adapter is loaded.
 */

import type { ExchangeConfig, IExchangeAdapter } from './types/index.js';
import { Logger } from './core/logger.js';

// Type-only imports for config types (no runtime cost)
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

export type SupportedExchange =
  | 'hyperliquid'
  | 'lighter'
  | 'grvt'
  | 'paradex'
  | 'edgex'
  | 'backpack'
  | 'nado'
  | 'variational'
  | 'extended'
  | 'dydx'
  | 'jupiter'
  | 'drift'
  | 'gmx'
  | 'aster'
  | 'pacifica'
  | 'ostium';

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
export type AdapterConstructor<C extends ExchangeConfig = ExchangeConfig> = new (
  config?: C
) => IExchangeAdapter;

/**
 * Lazy adapter loader map
 * Each entry is a function that dynamically imports the adapter module
 */
const adapterLoaders: Record<string, () => Promise<AdapterConstructor>> = {
  hyperliquid: async () =>
    (await import('./adapters/hyperliquid/index.js')).HyperliquidAdapter as AdapterConstructor,
  lighter: async () =>
    (await import('./adapters/lighter/index.js')).LighterAdapter as AdapterConstructor,
  grvt: async () => (await import('./adapters/grvt/index.js')).GRVTAdapter as AdapterConstructor,
  paradex: async () =>
    (await import('./adapters/paradex/index.js')).ParadexAdapter as AdapterConstructor,
  edgex: async () => (await import('./adapters/edgex/index.js')).EdgeXAdapter as AdapterConstructor,
  backpack: async () =>
    (await import('./adapters/backpack/index.js')).BackpackAdapter as AdapterConstructor,
  nado: async () => (await import('./adapters/nado/index.js')).NadoAdapter as AdapterConstructor,
  variational: async () =>
    (await import('./adapters/variational/index.js')).VariationalAdapter as AdapterConstructor,
  extended: async () =>
    (await import('./adapters/extended/index.js')).ExtendedAdapter as AdapterConstructor,
  dydx: async () => (await import('./adapters/dydx/index.js')).DydxAdapter as AdapterConstructor,
  jupiter: async () =>
    (await import('./adapters/jupiter/index.js')).JupiterAdapter as AdapterConstructor,
  drift: async () => (await import('./adapters/drift/index.js')).DriftAdapter as AdapterConstructor,
  gmx: async () => (await import('./adapters/gmx/index.js')).GmxAdapter as AdapterConstructor,
  aster: async () => (await import('./adapters/aster/index.js')).AsterAdapter as AdapterConstructor,
  pacifica: async () =>
    (await import('./adapters/pacifica/index.js')).PacificaAdapter as AdapterConstructor,
  ostium: async () =>
    (await import('./adapters/ostium/index.js')).OstiumAdapter as AdapterConstructor,
};

/** Cache for loaded adapter constructors */
const adapterCache = new Map<string, AdapterConstructor>();

/** Custom adapter registry (for registerExchange) */
const customRegistry = new Map<string, AdapterConstructor>();

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
export function registerExchange<C extends ExchangeConfig>(
  id: string,
  constructor: AdapterConstructor<C>
): void {
  const normalizedId = id.toLowerCase();

  if (customRegistry.has(normalizedId) || adapterLoaders[normalizedId]) {
    factoryLogger.warn(`Exchange '${normalizedId}' already registered. Overwriting.`);
  }

  customRegistry.set(normalizedId, constructor as AdapterConstructor);
}

/**
 * Unregister an exchange adapter
 *
 * @param id - Exchange identifier to remove
 * @returns true if adapter was removed, false if not found
 */
export function unregisterExchange(id: string): boolean {
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
export async function createExchange<T extends SupportedExchange>(
  exchange: T,
  config?: ExchangeConfigMap[T]
): Promise<IExchangeAdapter> {
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
      throw new Error(
        `Unknown exchange: ${exchange}. ` +
          `Supported exchanges: ${getSupportedExchanges().join(', ')}. ` +
          `Use registerExchange() to add custom adapters.`
      );
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
export function createExchangeSync<T extends SupportedExchange>(
  exchange: T,
  config?: ExchangeConfigMap[T]
): IExchangeAdapter {
  const normalizedId = exchange.toLowerCase();

  const customConstructor = customRegistry.get(normalizedId);
  if (customConstructor) {
    return new customConstructor(config);
  }

  const Constructor = adapterCache.get(normalizedId);
  if (!Constructor) {
    throw new Error(
      `Exchange '${exchange}' not preloaded. Use createExchange() (async) or call preloadAdapters(['${exchange}']) first.`
    );
  }
  return new Constructor(config);
}

/**
 * Preload specific adapters into cache for synchronous access
 *
 * @param exchanges - List of exchange identifiers to preload
 */
export async function preloadAdapters(exchanges: SupportedExchange[]): Promise<void> {
  await Promise.all(
    exchanges.map(async (exchange) => {
      const normalizedId = exchange.toLowerCase();
      const loader = adapterLoaders[normalizedId];
      if (loader && !adapterCache.has(normalizedId)) {
        adapterCache.set(normalizedId, await loader());
      }
    })
  );
}

/**
 * Get list of supported exchanges
 *
 * Returns all registered exchange IDs including both built-in
 * and custom-registered adapters.
 */
export function getSupportedExchanges(): string[] {
  const builtInKeys = Object.keys(adapterLoaders);
  const customKeys = Array.from(customRegistry.keys());
  const allKeys = new Set([...builtInKeys, ...customKeys]);
  return Array.from(allKeys);
}

/**
 * Get list of built-in exchanges (for type safety)
 */
export function getBuiltInExchanges(): SupportedExchange[] {
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
export function isExchangeSupported(exchange: string): boolean {
  const normalizedId = exchange.toLowerCase();
  return normalizedId in adapterLoaders || customRegistry.has(normalizedId);
}

/**
 * Check if an exchange is a built-in supported exchange
 */
export function isBuiltInExchange(exchange: string): exchange is SupportedExchange {
  return getBuiltInExchanges().includes(exchange as SupportedExchange);
}
