/**
 * Pacifica Response Normalizer
 */
import { PACIFICA_ORDER_STATUS } from './constants.js';
import { PacificaAccountInfoSchema, PacificaFundingHistorySchema, PacificaMarketSchema, PacificaOrderBookSchema, PacificaOrderResponseSchema, PacificaPositionSchema, PacificaTickerSchema, PacificaTradeResponseSchema, } from './types.js';
import { toUnifiedSymbol } from './utils.js';
export class PacificaNormalizer {
    normalizeMarket(raw) {
        const validated = PacificaMarketSchema.parse(raw);
        const symbol = toUnifiedSymbol(validated.symbol);
        return {
            id: validated.symbol,
            symbol,
            base: validated.base_currency,
            quote: validated.quote_currency,
            settle: validated.quote_currency,
            active: validated.status === 'active',
            minAmount: parseFloat(validated.min_size),
            pricePrecision: this.countDecimals(validated.price_step),
            amountPrecision: this.countDecimals(validated.size_step),
            priceTickSize: parseFloat(validated.price_step),
            amountStepSize: parseFloat(validated.size_step),
            makerFee: parseFloat(validated.maker_fee),
            takerFee: parseFloat(validated.taker_fee),
            maxLeverage: validated.max_leverage,
            fundingIntervalHours: validated.funding_interval / 3600,
            info: validated,
        };
    }
    normalizeTicker(raw, symbol) {
        const validated = PacificaTickerSchema.parse(raw);
        const last = parseFloat(validated.last_price);
        const high = parseFloat(validated.high_24h);
        const low = parseFloat(validated.low_24h);
        return {
            symbol: symbol ?? toUnifiedSymbol(validated.symbol),
            last,
            bid: parseFloat(validated.bid_price),
            ask: parseFloat(validated.ask_price),
            high,
            low,
            open: last,
            close: last,
            change: 0,
            percentage: 0,
            baseVolume: parseFloat(validated.volume_24h),
            quoteVolume: parseFloat(validated.quote_volume_24h),
            timestamp: validated.timestamp,
            info: {
                ...validated,
                _bidAskSource: 'orderbook',
            },
        };
    }
    normalizeOrderBook(raw, symbol) {
        const validated = PacificaOrderBookSchema.parse(raw);
        return {
            symbol,
            timestamp: validated.timestamp,
            bids: validated.bids.map((b) => [parseFloat(b.price), parseFloat(b.size)]),
            asks: validated.asks.map((a) => [parseFloat(a.price), parseFloat(a.size)]),
            sequenceId: validated.sequence,
            exchange: 'pacifica',
        };
    }
    normalizeTrade(raw, symbol) {
        const validated = PacificaTradeResponseSchema.parse(raw);
        const price = parseFloat(typeof validated.price === 'number' ? String(validated.price) : validated.price);
        const amount = parseFloat(typeof validated.size === 'number' ? String(validated.size) : validated.size);
        return {
            id: validated.id,
            symbol: symbol ?? toUnifiedSymbol(validated.symbol),
            side: validated.side,
            price,
            amount,
            cost: price * amount,
            timestamp: validated.timestamp,
            info: validated,
        };
    }
    normalizeFundingRate(raw, symbol) {
        const validated = PacificaFundingHistorySchema.parse(raw);
        return {
            symbol,
            fundingRate: parseFloat(validated.funding_rate),
            fundingTimestamp: validated.timestamp,
            nextFundingTimestamp: validated.timestamp + 3600000,
            markPrice: parseFloat(validated.mark_price),
            indexPrice: parseFloat(validated.index_price),
            fundingIntervalHours: 1,
            info: validated,
        };
    }
    normalizeOrder(raw, symbol) {
        const validated = PacificaOrderResponseSchema.parse(raw);
        const filled = parseFloat(typeof validated.filled_size === 'number' ? String(validated.filled_size) : validated.filled_size);
        const amount = parseFloat(typeof validated.size === 'number' ? String(validated.size) : validated.size);
        return {
            id: validated.order_id,
            symbol: symbol ?? toUnifiedSymbol(validated.symbol),
            type: validated.type === 'market' ? 'market' : 'limit',
            side: validated.side,
            amount,
            price: validated.price ? parseFloat(typeof validated.price === 'number' ? String(validated.price) : validated.price) : undefined,
            status: (PACIFICA_ORDER_STATUS[validated.status] ?? 'open'),
            filled,
            remaining: amount - filled,
            averagePrice: validated.avg_fill_price ? parseFloat(typeof validated.avg_fill_price === 'number' ? String(validated.avg_fill_price) : validated.avg_fill_price) : undefined,
            reduceOnly: validated.reduce_only,
            postOnly: validated.post_only,
            clientOrderId: validated.client_order_id,
            timestamp: validated.created_at,
            lastUpdateTimestamp: validated.updated_at,
            info: validated,
        };
    }
    normalizePosition(raw, symbol) {
        const validated = PacificaPositionSchema.parse(raw);
        const size = parseFloat(typeof validated.size === 'number' ? String(validated.size) : validated.size);
        const markPrice = parseFloat(typeof validated.mark_price === 'number' ? String(validated.mark_price) : validated.mark_price);
        const maintenanceMargin = parseFloat(typeof validated.maintenance_margin === 'number' ? String(validated.maintenance_margin) : validated.maintenance_margin);
        const notional = size * markPrice;
        return {
            symbol: symbol ?? toUnifiedSymbol(validated.symbol),
            side: validated.side,
            size,
            entryPrice: parseFloat(typeof validated.entry_price === 'number' ? String(validated.entry_price) : validated.entry_price),
            markPrice,
            liquidationPrice: parseFloat(typeof validated.liquidation_price === 'number' ? String(validated.liquidation_price) : validated.liquidation_price),
            unrealizedPnl: parseFloat(typeof validated.unrealized_pnl === 'number' ? String(validated.unrealized_pnl) : validated.unrealized_pnl),
            realizedPnl: parseFloat(typeof validated.realized_pnl === 'number' ? String(validated.realized_pnl) : validated.realized_pnl),
            leverage: validated.leverage,
            marginMode: validated.margin_mode,
            margin: parseFloat(typeof validated.margin === 'number' ? String(validated.margin) : validated.margin),
            maintenanceMargin,
            marginRatio: notional > 0 ? maintenanceMargin / notional : 0,
            timestamp: validated.timestamp,
            info: validated,
        };
    }
    normalizeBalance(raw) {
        const validated = PacificaAccountInfoSchema.parse(raw);
        const total = parseFloat(validated.total_equity);
        const free = parseFloat(validated.available_balance);
        return {
            currency: validated.currency,
            total,
            free,
            used: total - free,
            info: validated,
        };
    }
    countDecimals(value) {
        if (!value || !value.includes('.'))
            return 0;
        const decimals = value.split('.')[1];
        if (!decimals)
            return 0;
        return decimals.replace(/0+$/, '').length || 0;
    }
}
//# sourceMappingURL=PacificaNormalizer.js.map