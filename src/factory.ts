/**
 * Exchange Factory
 *
 * Factory function for creating exchange adapter instances
 */

import type { ExchangeConfig, IExchangeAdapter } from './types/index.js';
import { HyperliquidAdapter, type HyperliquidConfig } from './adapters/hyperliquid/index.js';
import { LighterAdapter, type LighterConfig } from './adapters/lighter/index.js';
// import { GRVTAdapter, type GRVTAdapterConfig } from './adapters/grvt/index.js';

export type SupportedExchange = 'hyperliquid' | 'lighter' | 'grvt' | 'paradex' | 'edgex' | 'backpack';

export type ExchangeConfigMap = {
  hyperliquid: HyperliquidConfig;
  lighter: LighterConfig;
  grvt: ExchangeConfig;
  paradex: ExchangeConfig;
  edgex: ExchangeConfig;
  backpack: ExchangeConfig;
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
      throw new Error('GRVT adapter temporarily disabled - under development');

    case 'paradex':
      throw new Error('Paradex adapter not yet implemented');

    case 'edgex':
      throw new Error('EdgeX adapter not yet implemented');

    case 'backpack':
      throw new Error('Backpack adapter not yet implemented');

    default:
      throw new Error(`Unknown exchange: ${exchange as string}`);
  }
}

/**
 * Get list of supported exchanges
 */
export function getSupportedExchanges(): SupportedExchange[] {
  return ['hyperliquid', 'lighter', 'grvt', 'paradex', 'edgex', 'backpack'];
}

/**
 * Check if an exchange is supported
 */
export function isExchangeSupported(exchange: string): exchange is SupportedExchange {
  return getSupportedExchanges().includes(exchange as SupportedExchange);
}
