/**
 * Exchange Factory
 *
 * Factory function for creating exchange adapter instances
 */
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
export function createExchange(exchange, config) {
    switch (exchange) {
        case 'hyperliquid':
            return new HyperliquidAdapter(config);
        case 'lighter':
            return new LighterAdapter(config);
        case 'grvt':
            return new GRVTAdapter(config);
        case 'paradex':
            return new ParadexAdapter(config);
        case 'edgex':
            return new EdgeXAdapter(config);
        case 'backpack':
            return new BackpackAdapter(config);
        case 'nado':
            return new NadoAdapter(config);
        case 'variational':
            return new VariationalAdapter(config);
        case 'extended':
            return new ExtendedAdapter(config);
        case 'dydx':
            return new DydxAdapter(config);
        case 'jupiter':
            return new JupiterAdapter(config);
        case 'drift':
            return new DriftAdapter(config);
        case 'gmx':
            return new GmxAdapter(config);
        default:
            throw new Error(`Unknown exchange: ${exchange}`);
    }
}
/**
 * Get list of supported exchanges
 */
export function getSupportedExchanges() {
    return ['hyperliquid', 'lighter', 'grvt', 'paradex', 'edgex', 'backpack', 'nado', 'variational', 'extended', 'dydx', 'jupiter', 'drift', 'gmx'];
}
/**
 * Check if an exchange is supported
 */
export function isExchangeSupported(exchange) {
    return getSupportedExchanges().includes(exchange);
}
//# sourceMappingURL=factory.js.map