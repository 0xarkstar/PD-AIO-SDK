/**
 * Pacifica Response Normalizer
 *
 * Maps real Pacifica API responses to unified types.
 * @see https://docs.pacifica.fi/api-documentation/api/rest-api
 */
import { PACIFICA_ORDER_STATUS } from './constants.js';
import { PacificaAccountInfoSchema, PacificaFundingHistorySchema, PacificaMarketSchema, PacificaOrderBookSchema, PacificaOrderResponseSchema, PacificaPositionSchema, PacificaTickerSchema, PacificaTradeResponseSchema, } from './types.js';
import { toUnifiedSymbol, toPacificaSymbol } from './utils.js';
export class PacificaNormalizer {
    /**
     * Normalize /info market entry.
     * Real fields: symbol, tick_size, lot_size, max_leverage, min_order_size, etc.
     */
    normalizeMarket(raw) {
        const validated = PacificaMarketSchema.parse(raw);
        const symbol = toUnifiedSymbol(validated.symbol);
        const base = validated.symbol;
        return {
            id: validated.symbol,
            symbol,
            base,
            quote: 'USDC',
            settle: 'USDC',
            active: true,
            minAmount: parseFloat(validated.min_order_size ?? '0'),
            pricePrecision: this.countDecimals(validated.tick_size),
            amountPrecision: this.countDecimals(validated.lot_size),
            priceTickSize: parseFloat(validated.tick_size),
            amountStepSize: parseFloat(validated.lot_size),
            makerFee: 0,
            takerFee: 0,
            maxLeverage: validated.max_leverage,
            fundingIntervalHours: 1,
            info: validated,
        };
    }
    /**
     * Normalize /info/prices entry.
     * Real fields: symbol, mark, mid, oracle, funding, next_funding,
     * open_interest, volume_24h, yesterday_price, timestamp
     */
    normalizeTicker(raw, symbol) {
        const validated = PacificaTickerSchema.parse(raw);
        const mid = parseFloat(validated.mid);
        const yesterday = parseFloat(validated.yesterday_price);
        const change = mid - yesterday;
        const percentage = yesterday !== 0 ? (change / yesterday) * 100 : 0;
        return {
            symbol: symbol ?? toUnifiedSymbol(validated.symbol),
            last: mid,
            bid: mid,
            ask: mid,
            high: mid,
            low: mid,
            open: yesterday,
            close: mid,
            change,
            percentage,
            baseVolume: 0,
            quoteVolume: parseFloat(validated.volume_24h),
            timestamp: validated.timestamp,
            info: {
                ...validated,
                _bidAskSource: 'mid',
            },
        };
    }
    normalizeOrderBook(raw, symbol) {
        const validated = PacificaOrderBookSchema.parse(raw);
        // l[0] = bids (descending by price), l[1] = asks (ascending by price)
        const rawBids = validated.l[0] ?? [];
        const rawAsks = validated.l[1] ?? [];
        return {
            symbol,
            timestamp: validated.t,
            bids: rawBids.map((b) => [parseFloat(b.p), parseFloat(b.a)]),
            asks: rawAsks.map((a) => [parseFloat(a.p), parseFloat(a.a)]),
            exchange: 'pacifica',
        };
    }
    /**
     * Normalize /trades entry.
     * Real fields: event_type, price, amount, side, cause, created_at
     */
    normalizeTrade(raw, symbol, index) {
        const validated = PacificaTradeResponseSchema.parse(raw);
        const price = parseFloat(typeof validated.price === 'number' ? String(validated.price) : validated.price);
        const amount = parseFloat(typeof validated.amount === 'number' ? String(validated.amount) : validated.amount);
        const sideStr = String(validated.side);
        const normalizedSide = sideStr === 'open_long' || sideStr === 'close_short' ? 'buy' : 'sell';
        return {
            id: `${validated.created_at}-${index ?? 0}`,
            symbol: symbol ?? '',
            side: normalizedSide,
            price,
            amount,
            cost: price * amount,
            timestamp: validated.created_at,
            info: validated,
        };
    }
    /**
     * Normalize /funding_rate/history entry.
     * Real fields: oracle_price, funding_rate, next_funding_rate, created_at
     */
    normalizeFundingRate(raw, symbol) {
        const validated = PacificaFundingHistorySchema.parse(raw);
        const oraclePrice = parseFloat(validated.oracle_price);
        return {
            symbol,
            fundingRate: parseFloat(validated.funding_rate),
            fundingTimestamp: validated.created_at,
            nextFundingTimestamp: validated.created_at + 3600000,
            markPrice: oraclePrice,
            indexPrice: oraclePrice,
            fundingIntervalHours: 1,
            info: validated,
        };
    }
    normalizeOrder(raw, symbol) {
        const validated = PacificaOrderResponseSchema.parse(raw);
        const filled = parseFloat(typeof validated.filled_size === 'number'
            ? String(validated.filled_size)
            : validated.filled_size);
        const amount = parseFloat(typeof validated.size === 'number' ? String(validated.size) : validated.size);
        return {
            id: validated.order_id,
            symbol: symbol ?? toUnifiedSymbol(validated.symbol),
            type: validated.type === 'market' ? 'market' : 'limit',
            side: validated.side,
            amount,
            price: validated.price
                ? parseFloat(typeof validated.price === 'number' ? String(validated.price) : validated.price)
                : undefined,
            status: (PACIFICA_ORDER_STATUS[validated.status] ?? 'open'),
            filled,
            remaining: amount - filled,
            averagePrice: validated.avg_fill_price
                ? parseFloat(typeof validated.avg_fill_price === 'number'
                    ? String(validated.avg_fill_price)
                    : validated.avg_fill_price)
                : undefined,
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
        const maintenanceMargin = parseFloat(typeof validated.maintenance_margin === 'number'
            ? String(validated.maintenance_margin)
            : validated.maintenance_margin);
        const notional = size * markPrice;
        return {
            symbol: symbol ?? toUnifiedSymbol(validated.symbol),
            side: validated.side,
            size,
            entryPrice: parseFloat(typeof validated.entry_price === 'number'
                ? String(validated.entry_price)
                : validated.entry_price),
            markPrice,
            liquidationPrice: parseFloat(typeof validated.liquidation_price === 'number'
                ? String(validated.liquidation_price)
                : validated.liquidation_price),
            unrealizedPnl: parseFloat(typeof validated.unrealized_pnl === 'number'
                ? String(validated.unrealized_pnl)
                : validated.unrealized_pnl),
            realizedPnl: parseFloat(typeof validated.realized_pnl === 'number'
                ? String(validated.realized_pnl)
                : validated.realized_pnl),
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
    normalizeSymbol(exchangeSymbol) {
        return toUnifiedSymbol(exchangeSymbol);
    }
    toExchangeSymbol(symbol) {
        return toPacificaSymbol(symbol);
    }
}
//# sourceMappingURL=PacificaNormalizer.js.map