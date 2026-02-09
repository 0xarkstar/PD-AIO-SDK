/**
 * Aster Response Normalizer
 */
import { ASTER_ORDER_STATUS } from './constants.js';
import { toUnifiedSymbol } from './utils.js';
export class AsterNormalizer {
    normalizeMarket(info) {
        const priceFilter = info.filters.find((f) => f.filterType === 'PRICE_FILTER');
        const lotFilter = info.filters.find((f) => f.filterType === 'LOT_SIZE');
        const tickSize = priceFilter ? parseFloat(priceFilter.tickSize) : 0.01;
        const stepSize = lotFilter ? parseFloat(lotFilter.stepSize) : 0.001;
        const minQty = lotFilter ? parseFloat(lotFilter.minQty) : 0;
        return {
            id: info.symbol,
            symbol: toUnifiedSymbol(info.symbol, info.baseAsset, info.quoteAsset),
            base: info.baseAsset,
            quote: info.quoteAsset,
            settle: info.marginAsset,
            active: info.status === 'TRADING',
            minAmount: minQty,
            pricePrecision: info.pricePrecision,
            amountPrecision: info.quantityPrecision,
            priceTickSize: tickSize,
            amountStepSize: stepSize,
            makerFee: 0.0002,
            takerFee: 0.0005,
            maxLeverage: 125,
            fundingIntervalHours: 8,
            info: info,
        };
    }
    normalizeTicker(raw, symbol) {
        const last = parseFloat(raw.lastPrice);
        return {
            symbol: symbol ?? raw.symbol,
            last,
            bid: last,
            ask: last,
            high: parseFloat(raw.highPrice),
            low: parseFloat(raw.lowPrice),
            open: parseFloat(raw.openPrice),
            close: last,
            change: parseFloat(raw.priceChange),
            percentage: parseFloat(raw.priceChangePercent),
            baseVolume: parseFloat(raw.volume),
            quoteVolume: parseFloat(raw.quoteVolume),
            timestamp: raw.closeTime,
            info: raw,
        };
    }
    normalizeOrderBook(raw, symbol) {
        return {
            symbol,
            timestamp: raw.T ?? Date.now(),
            bids: raw.bids.map(([p, s]) => [parseFloat(p), parseFloat(s)]),
            asks: raw.asks.map(([p, s]) => [parseFloat(p), parseFloat(s)]),
            exchange: 'aster',
        };
    }
    normalizeTrade(raw, symbol) {
        return {
            id: String(raw.id),
            symbol,
            side: raw.isBuyerMaker ? 'sell' : 'buy',
            price: parseFloat(raw.price),
            amount: parseFloat(raw.qty),
            cost: parseFloat(raw.quoteQty),
            timestamp: raw.time,
            info: raw,
        };
    }
    normalizeFundingRate(raw, symbol) {
        return {
            symbol,
            fundingRate: parseFloat(raw.lastFundingRate),
            fundingTimestamp: raw.time,
            nextFundingTimestamp: raw.nextFundingTime,
            markPrice: parseFloat(raw.markPrice),
            indexPrice: parseFloat(raw.indexPrice),
            fundingIntervalHours: 8,
            info: raw,
        };
    }
    normalizeOHLCV(raw) {
        return [
            raw[0],
            parseFloat(raw[1]),
            parseFloat(raw[2]),
            parseFloat(raw[3]),
            parseFloat(raw[4]),
            parseFloat(raw[5]),
        ];
    }
    normalizeOrder(raw, symbol) {
        const filled = parseFloat(raw.executedQty);
        const amount = parseFloat(raw.origQty);
        const price = parseFloat(raw.price);
        const avgPrice = parseFloat(raw.avgPrice);
        return {
            id: String(raw.orderId),
            symbol: symbol ?? raw.symbol,
            type: raw.origType?.toLowerCase() === 'market' ? 'market' : 'limit',
            side: raw.side === 'BUY' ? 'buy' : 'sell',
            amount,
            price: price || undefined,
            status: (ASTER_ORDER_STATUS[raw.status] ?? 'open'),
            filled,
            remaining: amount - filled,
            averagePrice: avgPrice || undefined,
            cost: filled * (avgPrice || price),
            reduceOnly: raw.reduceOnly ?? false,
            postOnly: raw.timeInForce === 'GTX',
            clientOrderId: raw.clientOrderId,
            timestamp: raw.updateTime,
            info: raw,
        };
    }
    normalizePosition(raw, symbol) {
        const size = parseFloat(raw.positionAmt);
        const absSize = Math.abs(size);
        const leverage = parseFloat(raw.leverage);
        const entryPrice = parseFloat(raw.entryPrice);
        const markPrice = parseFloat(raw.markPrice);
        const notional = Math.abs(parseFloat(raw.notional));
        return {
            symbol: symbol ?? raw.symbol,
            side: size >= 0 ? 'long' : 'short',
            size: absSize,
            entryPrice,
            markPrice,
            liquidationPrice: parseFloat(raw.liquidationPrice) || 0,
            unrealizedPnl: parseFloat(raw.unRealizedProfit),
            realizedPnl: 0,
            leverage,
            marginMode: raw.marginType === 'isolated' ? 'isolated' : 'cross',
            margin: notional / leverage,
            maintenanceMargin: 0,
            marginRatio: 0,
            timestamp: raw.updateTime,
            info: raw,
        };
    }
    normalizeBalance(raw) {
        return {
            currency: raw.asset,
            total: parseFloat(raw.balance),
            free: parseFloat(raw.availableBalance),
            used: parseFloat(raw.balance) - parseFloat(raw.availableBalance),
            info: raw,
        };
    }
}
//# sourceMappingURL=AsterNormalizer.js.map