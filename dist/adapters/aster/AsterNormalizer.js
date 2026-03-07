/**
 * Aster Response Normalizer
 */
import { ASTER_ORDER_STATUS } from './constants.js';
import { toAsterSymbol } from './utils.js';
import { AsterSymbolInfoSchema, AsterTicker24hrSchema, AsterOrderBookResponseSchema, AsterTradeResponseSchema, AsterPremiumIndexSchema, AsterOrderResponseSchema, AsterPositionRiskSchema, AsterAccountBalanceSchema, } from './types.js';
import { toUnifiedSymbol } from './utils.js';
export class AsterNormalizer {
    normalizeMarket(info) {
        const validated = AsterSymbolInfoSchema.parse(info);
        const priceFilter = validated.filters.find((f) => f.filterType === 'PRICE_FILTER');
        const lotFilter = validated.filters.find((f) => f.filterType === 'LOT_SIZE');
        const tickSize = priceFilter ? parseFloat(priceFilter.tickSize) : 0.01;
        const stepSize = lotFilter ? parseFloat(lotFilter.stepSize) : 0.001;
        const minQty = lotFilter ? parseFloat(lotFilter.minQty) : 0;
        return {
            id: validated.symbol,
            symbol: toUnifiedSymbol(validated.symbol, validated.baseAsset, validated.quoteAsset),
            base: validated.baseAsset,
            quote: validated.quoteAsset,
            settle: validated.marginAsset,
            active: validated.status === 'TRADING',
            minAmount: minQty,
            pricePrecision: validated.pricePrecision,
            amountPrecision: validated.quantityPrecision,
            priceTickSize: tickSize,
            amountStepSize: stepSize,
            makerFee: 0.0002,
            takerFee: 0.0005,
            maxLeverage: 125,
            fundingIntervalHours: 8,
            info: validated,
        };
    }
    normalizeTicker(raw, symbol) {
        const validated = AsterTicker24hrSchema.parse(raw);
        const last = parseFloat(validated.lastPrice);
        return {
            symbol: symbol ?? validated.symbol,
            last,
            bid: last,
            ask: last,
            high: parseFloat(validated.highPrice),
            low: parseFloat(validated.lowPrice),
            open: parseFloat(validated.openPrice),
            close: last,
            change: parseFloat(validated.priceChange),
            percentage: parseFloat(validated.priceChangePercent),
            baseVolume: parseFloat(validated.volume),
            quoteVolume: parseFloat(validated.quoteVolume),
            timestamp: validated.closeTime,
            info: {
                ...validated,
                _bidAskSource: 'last_price',
            },
        };
    }
    normalizeOrderBook(raw, symbol) {
        const validated = AsterOrderBookResponseSchema.parse(raw);
        return {
            symbol,
            timestamp: validated.T ?? Date.now(),
            bids: validated.bids.map(([p, s]) => [parseFloat(p), parseFloat(s)]),
            asks: validated.asks.map(([p, s]) => [parseFloat(p), parseFloat(s)]),
            exchange: 'aster',
        };
    }
    normalizeTrade(raw, symbol) {
        const validated = AsterTradeResponseSchema.parse(raw);
        return {
            id: String(validated.id),
            symbol,
            side: validated.isBuyerMaker ? 'sell' : 'buy',
            price: parseFloat(validated.price),
            amount: parseFloat(validated.qty),
            cost: parseFloat(validated.quoteQty),
            timestamp: validated.time,
            info: validated,
        };
    }
    normalizeFundingRate(raw, symbol) {
        const validated = AsterPremiumIndexSchema.parse(raw);
        return {
            symbol,
            fundingRate: parseFloat(validated.lastFundingRate),
            fundingTimestamp: validated.time,
            nextFundingTimestamp: validated.nextFundingTime,
            markPrice: parseFloat(validated.markPrice),
            indexPrice: parseFloat(validated.indexPrice),
            fundingIntervalHours: 8,
            info: validated,
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
        const validated = AsterOrderResponseSchema.parse(raw);
        const filled = parseFloat(validated.executedQty);
        const amount = parseFloat(validated.origQty);
        const price = parseFloat(validated.price);
        const avgPrice = parseFloat(validated.avgPrice);
        return {
            id: String(validated.orderId),
            symbol: symbol ?? validated.symbol,
            type: validated.origType?.toLowerCase() === 'market' ? 'market' : 'limit',
            side: validated.side === 'BUY' ? 'buy' : 'sell',
            amount,
            price: price || undefined,
            status: (ASTER_ORDER_STATUS[validated.status] ?? 'open'),
            filled,
            remaining: amount - filled,
            averagePrice: avgPrice || undefined,
            cost: filled * (avgPrice || price),
            reduceOnly: validated.reduceOnly ?? false,
            postOnly: validated.timeInForce === 'GTX',
            clientOrderId: validated.clientOrderId,
            timestamp: validated.updateTime,
            info: validated,
        };
    }
    normalizePosition(raw, symbol) {
        const validated = AsterPositionRiskSchema.parse(raw);
        const size = parseFloat(validated.positionAmt);
        const absSize = Math.abs(size);
        const leverage = parseFloat(validated.leverage);
        const entryPrice = parseFloat(validated.entryPrice);
        const markPrice = parseFloat(validated.markPrice);
        const notional = Math.abs(parseFloat(validated.notional));
        return {
            symbol: symbol ?? validated.symbol,
            side: size >= 0 ? 'long' : 'short',
            size: absSize,
            entryPrice,
            markPrice,
            liquidationPrice: parseFloat(validated.liquidationPrice) || 0,
            unrealizedPnl: parseFloat(validated.unRealizedProfit),
            realizedPnl: 0,
            leverage,
            marginMode: validated.marginType === 'isolated' ? 'isolated' : 'cross',
            margin: notional / leverage,
            maintenanceMargin: 0,
            marginRatio: 0,
            timestamp: validated.updateTime,
            info: {
                ...validated,
                _realizedPnlSource: 'not_available',
                _marginRatioSource: 'not_available',
            },
        };
    }
    normalizeBalance(raw) {
        const validated = AsterAccountBalanceSchema.parse(raw);
        return {
            currency: validated.asset,
            total: parseFloat(validated.balance),
            free: parseFloat(validated.availableBalance),
            used: parseFloat(validated.balance) - parseFloat(validated.availableBalance),
            info: validated,
        };
    }
    normalizeSymbol(exchangeSymbol) {
        const quoteAssets = ['USDT', 'USDC', 'BUSD'];
        for (const quote of quoteAssets) {
            if (exchangeSymbol.endsWith(quote)) {
                const base = exchangeSymbol.slice(0, -quote.length);
                return `${base}/${quote}:${quote}`;
            }
        }
        return exchangeSymbol;
    }
    toExchangeSymbol(symbol) {
        return toAsterSymbol(symbol);
    }
}
//# sourceMappingURL=AsterNormalizer.js.map