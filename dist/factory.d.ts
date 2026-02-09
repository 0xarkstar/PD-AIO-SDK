/**
 * Exchange Factory
 *
 * Factory function for creating exchange adapter instances.
 * Supports both built-in adapters and custom adapters via plugin registration.
 */
import type { ExchangeConfig, IExchangeAdapter } from './types/index.js';
import { type HyperliquidConfig } from './adapters/hyperliquid/index.js';
import { type LighterConfig } from './adapters/lighter/index.js';
import { type GRVTAdapterConfig } from './adapters/grvt/index.js';
import { type ParadexConfig } from './adapters/paradex/index.js';
import { type EdgeXConfig } from './adapters/edgex/index.js';
import { type BackpackConfig } from './adapters/backpack/index.js';
import { type NadoConfig } from './adapters/nado/index.js';
import { type VariationalConfig } from './adapters/variational/index.js';
import { type ExtendedConfig } from './adapters/extended/index.js';
import { type DydxConfig } from './adapters/dydx/index.js';
import { type JupiterAdapterConfig } from './adapters/jupiter/index.js';
import { type DriftConfig } from './adapters/drift/index.js';
import { type GmxConfig } from './adapters/gmx/index.js';
import { type AsterConfig } from './adapters/aster/index.js';
import { type PacificaConfig } from './adapters/pacifica/index.js';
import { type OstiumConfig } from './adapters/ostium/index.js';
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
export declare function registerExchange<C extends ExchangeConfig>(id: string, constructor: AdapterConstructor<C>): void;
/**
 * Unregister an exchange adapter
 *
 * @param id - Exchange identifier to remove
 * @returns true if adapter was removed, false if not found
 */
export declare function unregisterExchange(id: string): boolean;
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
export declare function createExchange<T extends SupportedExchange>(exchange: T, config?: ExchangeConfigMap[T]): IExchangeAdapter;
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