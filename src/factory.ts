/**
 * Exchange Factory
 *
 * Factory function for creating exchange adapter instances.
 * Supports both built-in adapters and custom adapters via plugin registration.
 */

import type { ExchangeConfig, IExchangeAdapter } from './types/index.js';
import { Logger } from './core/logger.js';
import { HyperliquidAdapter, type HyperliquidConfig } from './adapters/hyperliquid/index.js';
import { LighterAdapter, type LighterConfig } from './adapters/lighter/index.js';
import { GRVTAdapter, type GRVTAdapterConfig } from './adapters/grvt/index.js';
import { ParadexAdapter, type ParadexConfig } from './adapters/paradex/index.js';
import { EdgeXAdapter, type EdgeXConfig } from './adapters/edgex/index.js';
import { BackpackAdapter, type BackpackConfig } from './adapters/backpack/index.js';
import { NadoAdapter, type NadoConfig } from './adapters/nado/index.js';
import { VariationalAdapter, type VariationalConfig } from './adapters/variational/index.js';
import { ExtendedAdapter, type ExtendedConfig } from './adapters/extended/index.js';
import { DydxAdapter, type DydxConfig } from './adapters/dydx/index.js';
import { JupiterAdapter, type JupiterAdapterConfig } from './adapters/jupiter/index.js';
import { DriftAdapter, type DriftConfig } from './adapters/drift/index.js';
import { GmxAdapter, type GmxConfig } from './adapters/gmx/index.js';

export type SupportedExchange = 'hyperliquid' | 'lighter' | 'grvt' | 'paradex' | 'edgex' | 'backpack' | 'nado' | 'variational' | 'extended' | 'dydx' | 'jupiter' | 'drift' | 'gmx';

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
};

/**
 * Type for adapter constructor function
 */
export type AdapterConstructor<C extends ExchangeConfig = ExchangeConfig> =
  new (config?: C) => IExchangeAdapter;

/**
 * Plugin registry for exchange adapters
 *
 * Built-in adapters are pre-registered. Custom adapters can be added
 * via registerExchange() for extensibility.
 */
const adapterRegistry = new Map<string, AdapterConstructor>([
  ['hyperliquid', HyperliquidAdapter as AdapterConstructor],
  ['lighter', LighterAdapter as AdapterConstructor],
  ['grvt', GRVTAdapter as AdapterConstructor],
  ['paradex', ParadexAdapter as AdapterConstructor],
  ['edgex', EdgeXAdapter as AdapterConstructor],
  ['backpack', BackpackAdapter as AdapterConstructor],
  ['nado', NadoAdapter as AdapterConstructor],
  ['variational', VariationalAdapter as AdapterConstructor],
  ['extended', ExtendedAdapter as AdapterConstructor],
  ['dydx', DydxAdapter as AdapterConstructor],
  ['jupiter', JupiterAdapter as AdapterConstructor],
  ['drift', DriftAdapter as AdapterConstructor],
  ['gmx', GmxAdapter as AdapterConstructor],
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

export function registerExchange<C extends ExchangeConfig>(
  id: string,
  constructor: AdapterConstructor<C>
): void {
  const normalizedId = id.toLowerCase();

  if (adapterRegistry.has(normalizedId)) {
    factoryLogger.warn(`Exchange '${normalizedId}' already registered. Overwriting.`);
  }

  adapterRegistry.set(normalizedId, constructor as AdapterConstructor);
}

/**
 * Unregister an exchange adapter
 *
 * @param id - Exchange identifier to remove
 * @returns true if adapter was removed, false if not found
 */
export function unregisterExchange(id: string): boolean {
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
export function createExchange<T extends SupportedExchange>(
  exchange: T,
  config?: ExchangeConfigMap[T]
): IExchangeAdapter {
  const normalizedId = exchange.toLowerCase();
  const Constructor = adapterRegistry.get(normalizedId);

  if (!Constructor) {
    throw new Error(
      `Unknown exchange: ${exchange}. ` +
      `Supported exchanges: ${getSupportedExchanges().join(', ')}. ` +
      `Use registerExchange() to add custom adapters.`
    );
  }

  return new Constructor(config);
}

/**
 * Get list of supported exchanges
 *
 * Returns all registered exchange IDs including both built-in
 * and custom-registered adapters.
 */
export function getSupportedExchanges(): string[] {
  return Array.from(adapterRegistry.keys());
}

/**
 * Get list of built-in exchanges (for type safety)
 */
export function getBuiltInExchanges(): SupportedExchange[] {
  return ['hyperliquid', 'lighter', 'grvt', 'paradex', 'edgex', 'backpack', 'nado', 'variational', 'extended', 'dydx', 'jupiter', 'drift', 'gmx'];
}

/**
 * Check if an exchange is supported
 */
export function isExchangeSupported(exchange: string): boolean {
  return adapterRegistry.has(exchange.toLowerCase());
}

/**
 * Check if an exchange is a built-in supported exchange
 */
export function isBuiltInExchange(exchange: string): exchange is SupportedExchange {
  return getBuiltInExchanges().includes(exchange as SupportedExchange);
}
