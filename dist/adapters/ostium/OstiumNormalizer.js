/**
 * Ostium Response Normalizer
 */
import { toUnifiedSymbolFromName, parseCollateral, parsePrice } from './utils.js';
export class OstiumNormalizer {
    normalizeMarket(pair) {
        return {
            id: String(pair.pairIndex),
            symbol: toUnifiedSymbolFromName(pair.name),
            base: pair.from,
            quote: pair.to,
            settle: 'USDC',
            active: true,
            minAmount: parseFloat(pair.minPositionSize),
            maxAmount: parseFloat(pair.maxPositionSize),
            pricePrecision: 2,
            amountPrecision: 2,
            priceTickSize: 0.01,
            amountStepSize: 0.01,
            makerFee: 0,
            takerFee: parseFloat(pair.spreadP) / 100,
            maxLeverage: pair.maxLeverage,
            fundingIntervalHours: 1,
            info: pair,
        };
    }
    normalizeTicker(raw, pair) {
        const price = parseFloat(raw.price);
        return {
            symbol: toUnifiedSymbolFromName(pair.name),
            last: price,
            bid: price,
            ask: price,
            high: price,
            low: price,
            open: price,
            close: price,
            change: 0,
            percentage: 0,
            baseVolume: 0,
            quoteVolume: 0,
            timestamp: raw.timestamp,
            info: raw,
        };
    }
    normalizeTrade(raw) {
        const price = parseFloat(raw.price);
        const amount = parseFloat(raw.size);
        return {
            id: raw.id,
            symbol: `PAIR-${raw.pairIndex}/USD:USD`,
            side: raw.buy ? 'buy' : 'sell',
            price,
            amount,
            cost: price * amount,
            timestamp: parseInt(raw.timestamp, 10) * 1000,
            info: raw,
        };
    }
    normalizePosition(raw, currentPrice) {
        const size = parseCollateral(raw.positionSizeDai);
        const entryPrice = parsePrice(raw.openPrice);
        const leverage = parseInt(raw.leverage, 10);
        const markPrice = currentPrice ?? entryPrice;
        const notional = size * leverage;
        const pnlMultiplier = raw.buy ? 1 : -1;
        const unrealizedPnl = notional * pnlMultiplier * ((markPrice - entryPrice) / entryPrice);
        return {
            symbol: `PAIR-${raw.pairIndex}/USD:USD`,
            side: raw.buy ? 'long' : 'short',
            size,
            entryPrice,
            markPrice,
            liquidationPrice: 0,
            unrealizedPnl,
            realizedPnl: 0,
            leverage,
            marginMode: 'isolated',
            margin: size,
            maintenanceMargin: size * 0.05,
            marginRatio: 0,
            timestamp: parseInt(raw.timestamp, 10) * 1000,
            info: raw,
        };
    }
    normalizeBalance(rawBalance, currency = 'USDC') {
        const total = parseCollateral(rawBalance);
        return {
            currency,
            total,
            free: total,
            used: 0,
            info: { rawBalance },
        };
    }
    normalizeOrderFromTrade(raw) {
        return {
            id: `${raw.pairIndex}-${raw.index}`,
            symbol: `PAIR-${raw.pairIndex}/USD:USD`,
            type: 'market',
            side: raw.buy ? 'buy' : 'sell',
            amount: parseCollateral(raw.positionSizeDai),
            price: parsePrice(raw.openPrice),
            status: 'filled',
            filled: parseCollateral(raw.positionSizeDai),
            remaining: 0,
            reduceOnly: false,
            postOnly: false,
            timestamp: raw.timestamp,
            info: raw,
        };
    }
}
//# sourceMappingURL=OstiumNormalizer.js.map