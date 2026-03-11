/**
 * Reya Data Normalizer
 *
 * Transforms Reya API responses to unified SDK format.
 */
import { REYA_DEFAULT_PRECISION, REYA_FUNDING_INTERVAL_HOURS, reyaToUnified } from './constants.js';
import { mapOrderStatus, parseReyaSymbol } from './utils.js';
import { ReyaMarketDefinitionSchema, ReyaMarketSummarySchema, ReyaOrderSchema, ReyaPositionSchema, ReyaAccountBalanceSchema, ReyaDepthSchema, ReyaPerpExecutionSchema, ReyaCandleHistoryDataSchema, } from './types.js';
export class ReyaNormalizer {
    // ===========================================================================
    // Symbol Conversion
    // ===========================================================================
    symbolToCCXT(reyaSymbol) {
        return reyaToUnified(reyaSymbol);
    }
    symbolFromCCXT(ccxtSymbol) {
        const parts = ccxtSymbol.split('/');
        const base = parts[0] ?? '';
        const quotePart = parts[1] ?? '';
        const quote = quotePart.split(':')[0] ?? 'USD';
        return `${base}R${quote}PERP`;
    }
    // ===========================================================================
    // Market Normalization
    // ===========================================================================
    normalizeMarket(definition, _summary) {
        ReyaMarketDefinitionSchema.parse(definition);
        const unifiedSymbol = reyaToUnified(definition.symbol);
        const { base, quote } = parseReyaSymbol(definition.symbol);
        const minAmount = parseFloat(definition.minOrderQty);
        const tickSize = parseFloat(definition.tickSize);
        const stepSize = parseFloat(definition.qtyStepSize);
        const pricePrecision = tickSize > 0 ? Math.max(0, -Math.floor(Math.log10(tickSize))) : REYA_DEFAULT_PRECISION.price;
        const amountPrecision = stepSize > 0 ? Math.max(0, -Math.floor(Math.log10(stepSize))) : REYA_DEFAULT_PRECISION.amount;
        return {
            id: definition.marketId.toString(),
            symbol: unifiedSymbol,
            base,
            quote,
            settle: quote,
            active: true,
            minAmount,
            pricePrecision,
            amountPrecision,
            priceTickSize: tickSize,
            amountStepSize: stepSize,
            makerFee: 0.0002, // Default, actual comes from fee tier
            takerFee: 0.0005,
            maxLeverage: definition.maxLeverage,
            fundingIntervalHours: REYA_FUNDING_INTERVAL_HOURS,
            info: {
                liquidationMarginParameter: definition.liquidationMarginParameter,
                initialMarginParameter: definition.initialMarginParameter,
                oiCap: definition.oiCap,
            },
        };
    }
    // ===========================================================================
    // Ticker Normalization
    // ===========================================================================
    normalizeTicker(summary, price) {
        ReyaMarketSummarySchema.parse(summary);
        const unifiedSymbol = reyaToUnified(summary.symbol);
        const oraclePrice = price ? parseFloat(price.oraclePrice) : 0;
        const poolPrice = price?.poolPrice ? parseFloat(price.poolPrice) : oraclePrice;
        const pxChangeAbs = summary.pxChange24h ? parseFloat(summary.pxChange24h) : 0;
        const currentPrice = poolPrice || oraclePrice;
        const openPrice = currentPrice - pxChangeAbs;
        const pctChange = openPrice !== 0 ? (pxChangeAbs / openPrice) * 100 : 0;
        return {
            symbol: unifiedSymbol,
            last: currentPrice,
            bid: currentPrice,
            ask: currentPrice,
            high: 0,
            low: 0,
            open: openPrice > 0 ? openPrice : oraclePrice,
            close: currentPrice,
            change: pxChangeAbs,
            percentage: pctChange,
            baseVolume: 0,
            quoteVolume: parseFloat(summary.volume24h),
            timestamp: summary.updatedAt,
            info: {
                fundingRate: summary.fundingRate,
                fundingRateVelocity: summary.fundingRateVelocity,
                longOiQty: summary.longOiQty,
                shortOiQty: summary.shortOiQty,
                _bidAskSource: 'pool_price',
            },
        };
    }
    // ===========================================================================
    // Order Book Normalization
    // ===========================================================================
    normalizeOrderBook(depth) {
        ReyaDepthSchema.parse(depth);
        const unifiedSymbol = reyaToUnified(depth.symbol);
        const bids = depth.bids.map((level) => [parseFloat(level.px), parseFloat(level.qty)]);
        const asks = depth.asks.map((level) => [parseFloat(level.px), parseFloat(level.qty)]);
        return {
            symbol: unifiedSymbol,
            timestamp: depth.updatedAt,
            bids,
            asks,
            exchange: 'reya',
        };
    }
    // ===========================================================================
    // Trade Normalization
    // ===========================================================================
    normalizeTrade(execution) {
        ReyaPerpExecutionSchema.parse(execution);
        const unifiedSymbol = reyaToUnified(execution.symbol);
        const price = parseFloat(execution.price);
        const amount = parseFloat(execution.qty);
        return {
            id: execution.sequenceNumber.toString(),
            symbol: unifiedSymbol,
            side: execution.side === 'B' ? 'buy' : 'sell',
            price,
            amount,
            cost: price * amount,
            timestamp: execution.timestamp,
            info: {
                fee: execution.fee,
                executionType: execution.type,
                accountId: execution.accountId,
            },
        };
    }
    // ===========================================================================
    // Order Normalization
    // ===========================================================================
    normalizeOrder(order) {
        ReyaOrderSchema.parse(order);
        const unifiedSymbol = reyaToUnified(order.symbol);
        const isBuy = order.side === 'B';
        const qty = order.qty ? parseFloat(order.qty) : 0;
        const cumQty = order.cumQty ? parseFloat(order.cumQty) : 0;
        return {
            id: order.orderId,
            symbol: unifiedSymbol,
            type: order.orderType === 'LIMIT' ? 'limit' : 'stopMarket',
            side: isBuy ? 'buy' : 'sell',
            amount: qty,
            price: parseFloat(order.limitPx),
            status: mapOrderStatus(order.status),
            filled: cumQty,
            remaining: qty - cumQty,
            reduceOnly: order.reduceOnly ?? false,
            postOnly: false,
            timestamp: order.createdAt,
            lastUpdateTimestamp: order.lastUpdateAt,
            info: {
                orderType: order.orderType,
                timeInForce: order.timeInForce,
                triggerPx: order.triggerPx,
                accountId: order.accountId,
            },
        };
    }
    // ===========================================================================
    // Position Normalization
    // ===========================================================================
    normalizePosition(position) {
        ReyaPositionSchema.parse(position);
        const unifiedSymbol = reyaToUnified(position.symbol);
        const size = Math.abs(parseFloat(position.qty));
        const isLong = position.side === 'B';
        return {
            symbol: unifiedSymbol,
            side: isLong ? 'long' : 'short',
            size,
            entryPrice: parseFloat(position.avgEntryPrice),
            markPrice: 0, // Need to fetch separately
            liquidationPrice: 0, // Not directly available
            unrealizedPnl: 0, // Need to calculate
            realizedPnl: 0,
            leverage: 0, // Account-level
            marginMode: 'cross',
            margin: 0,
            maintenanceMargin: 0,
            marginRatio: 0,
            timestamp: Date.now(),
            info: {
                accountId: position.accountId,
                avgEntryFundingValue: position.avgEntryFundingValue,
                lastTradeSequenceNumber: position.lastTradeSequenceNumber,
                _realizedPnlSource: 'not_available',
                _marginRatioSource: 'not_available',
            },
        };
    }
    // ===========================================================================
    // Balance Normalization
    // ===========================================================================
    normalizeBalance(balance) {
        ReyaAccountBalanceSchema.parse(balance);
        const total = parseFloat(balance.realBalance);
        return {
            currency: balance.asset,
            total,
            free: total, // Reya doesn't expose used margin in balance endpoint
            used: 0,
            usdValue: total, // Reya balances are in USD
        };
    }
    // ===========================================================================
    // Funding Rate Normalization
    // ===========================================================================
    normalizeFundingRate(summary, markPrice) {
        ReyaMarketSummarySchema.parse(summary);
        const unifiedSymbol = reyaToUnified(summary.symbol);
        return {
            symbol: unifiedSymbol,
            fundingRate: parseFloat(summary.fundingRate),
            fundingTimestamp: summary.updatedAt,
            nextFundingTimestamp: summary.updatedAt + REYA_FUNDING_INTERVAL_HOURS * 3600 * 1000,
            markPrice,
            indexPrice: markPrice,
            fundingIntervalHours: REYA_FUNDING_INTERVAL_HOURS,
        };
    }
    // ===========================================================================
    // OHLCV Normalization
    // ===========================================================================
    normalizeCandles(data, limit) {
        ReyaCandleHistoryDataSchema.parse(data);
        const candles = [];
        const count = Math.min(data.t.length, limit ?? data.t.length);
        for (let i = 0; i < count; i++) {
            const t = data.t[i];
            const o = data.o[i];
            const h = data.h[i];
            const l = data.l[i];
            const c = data.c[i];
            if (t !== undefined &&
                o !== undefined &&
                h !== undefined &&
                l !== undefined &&
                c !== undefined) {
                candles.push([
                    t * 1000, // Reya timestamps are in seconds
                    parseFloat(o),
                    parseFloat(h),
                    parseFloat(l),
                    parseFloat(c),
                    0, // Volume not included in candle data
                ]);
            }
        }
        return candles;
    }
    // ===========================================================================
    // Helper Methods
    // ===========================================================================
    normalizeSymbol(exchangeSymbol) {
        return this.symbolToCCXT(exchangeSymbol);
    }
    toExchangeSymbol(symbol) {
        return this.symbolFromCCXT(symbol);
    }
}
//# sourceMappingURL=ReyaNormalizer.js.map