/**
 * Exchange Factory
 *
 * Factory function for creating exchange adapter instances
 */

import type { ExchangeConfig, IExchangeAdapter } from './types/index.js';
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
export function createExchange<T extends SupportedExchange>(
  exchange: T,
  config?: ExchangeConfigMap[T]
): IExchangeAdapter {
  switch (exchange) {
    case 'hyperliquid':
      return new HyperliquidAdapter(config as HyperliquidConfig);

    case 'lighter':
      return new LighterAdapter(config as LighterConfig);

    case 'grvt':
      return new GRVTAdapter(config as GRVTAdapterConfig);

    case 'paradex':
      return new ParadexAdapter(config as ParadexConfig);

    case 'edgex':
      return new EdgeXAdapter(config as EdgeXConfig);

    case 'backpack':
      return new BackpackAdapter(config as BackpackConfig);

    case 'nado':
      return new NadoAdapter(config as NadoConfig);

    case 'variational':
      return new VariationalAdapter(config as VariationalConfig);

    case 'extended':
      return new ExtendedAdapter(config as ExtendedConfig);

    case 'dydx':
      return new DydxAdapter(config as DydxConfig);

    case 'jupiter':
      return new JupiterAdapter(config as JupiterAdapterConfig);

    case 'drift':
      return new DriftAdapter(config as DriftConfig);

    case 'gmx':
      return new GmxAdapter(config as GmxConfig);

    default:
      throw new Error(`Unknown exchange: ${exchange as string}`);
  }
}

/**
 * Get list of supported exchanges
 */
export function getSupportedExchanges(): SupportedExchange[] {
  return ['hyperliquid', 'lighter', 'grvt', 'paradex', 'edgex', 'backpack', 'nado', 'variational', 'extended', 'dydx', 'jupiter', 'drift', 'gmx'];
}

/**
 * Check if an exchange is supported
 */
export function isExchangeSupported(exchange: string): exchange is SupportedExchange {
  return getSupportedExchanges().includes(exchange as SupportedExchange);
}
