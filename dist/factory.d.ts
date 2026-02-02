/**
 * Exchange Factory
 *
 * Factory function for creating exchange adapter instances
 */
import type { IExchangeAdapter } from './types/index.js';
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
 * Create an exchange adapter instance
 *
 * @param exchange - Exchange identifier
 * @param config - Exchange-specific configuration
 * @returns Exchange adapter instance
 *
 * @example
 * ```typescript
 * import { createExchange } from 'perp-dex-sdk';
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
 */
export declare function getSupportedExchanges(): SupportedExchange[];
/**
 * Check if an exchange is supported
 */
export declare function isExchangeSupported(exchange: string): exchange is SupportedExchange;
//# sourceMappingURL=factory.d.ts.map