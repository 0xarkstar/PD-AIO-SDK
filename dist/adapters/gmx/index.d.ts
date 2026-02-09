/**
 * GMX v2 Adapter
 *
 * Unified interface for GMX v2 perpetuals on Arbitrum and Avalanche.
 *
 * @packageDocumentation
 */
export { GmxAdapter, type GmxConfig, type GmxChain } from './GmxAdapter.js';
export { GmxAuth, type GmxAuthConfig, isValidEthereumAddress, isValidEthereumPrivateKey, } from './GmxAuth.js';
export { GmxContracts, type GmxPositionData, type GmxOrderData } from './GmxContracts.js';
export { GmxSubgraph, type NormalizedGmxPosition, type NormalizedGmxOrder, type NormalizedGmxTrade, } from './GmxSubgraph.js';
export { GmxOrderBuilder, type GmxPriceData as GmxOrderPriceData, type OrderBuilderConfig, } from './GmxOrderBuilder.js';
export { GmxNormalizer } from './GmxNormalizer.js';
export { GMX_API_URLS, GMX_ARBITRUM_API, GMX_AVALANCHE_API, GMX_PRECISION, GMX_RATE_LIMIT, GMX_MARKETS, GMX_MARKET_ADDRESS_MAP, GMX_ORDER_TYPES, GMX_DECREASE_POSITION_SWAP_TYPES, GMX_CONTRACTS, GMX_FUNDING, GMX_ERROR_MESSAGES, unifiedToGmx, gmxToUnified, getMarketByAddress, getBaseToken, getMarketsForChain, type GMXMarketKey, } from './constants.js';
export { mapGmxError, GmxErrorCodes, type GmxErrorCode } from './error-codes.js';
export type { GmxMarketInfo, GmxTokenInfo, GmxCandlestick, GmxPosition, GmxOrder, GmxTrade, GmxFundingRate, GmxPriceData, GmxMarketStats, GmxAccountStats, GmxCreateOrderParams, GmxNormalizedPosition, GmxNormalizedOrder, GmxNormalizedTrade, } from './types.js';
//# sourceMappingURL=index.d.ts.map