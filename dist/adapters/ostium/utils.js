/**
 * Ostium Utility Functions
 */
import { OSTIUM_PAIRS, OSTIUM_COLLATERAL_DECIMALS, OSTIUM_PRICE_DECIMALS } from './constants.js';
import { PerpDEXError } from '../../types/errors.js';
export function toOstiumPairIndex(unified) {
    const parts = unified.split(/[/:]/);
    const name = `${parts[0]}/${parts[1]}`;
    const pair = OSTIUM_PAIRS.find((p) => p.name === name);
    if (pair)
        return pair.pairIndex;
    throw new PerpDEXError(`Unknown Ostium pair: ${unified}`, 'PAIR_NOT_FOUND', 'ostium');
}
export function toUnifiedSymbol(pairIndex) {
    const pair = OSTIUM_PAIRS.find((p) => p.pairIndex === pairIndex);
    if (!pair)
        return `UNKNOWN-${pairIndex}/USD:USD`;
    return `${pair.from}/${pair.to}:${pair.to}`;
}
export function toUnifiedSymbolFromName(name) {
    const parts = name.split('/');
    return `${parts[0]}/${parts[1]}:${parts[1]}`;
}
export function getPairInfo(pairIndex) {
    return OSTIUM_PAIRS.find((p) => p.pairIndex === pairIndex);
}
export function formatCollateral(amount) {
    return String(Math.round(amount * 10 ** OSTIUM_COLLATERAL_DECIMALS));
}
export function parseCollateral(raw) {
    return parseInt(raw, 10) / 10 ** OSTIUM_COLLATERAL_DECIMALS;
}
export function formatPrice(price) {
    return String(Math.round(price * 10 ** OSTIUM_PRICE_DECIMALS));
}
export function parsePrice(raw) {
    return parseInt(raw, 10) / 10 ** OSTIUM_PRICE_DECIMALS;
}
//# sourceMappingURL=utils.js.map