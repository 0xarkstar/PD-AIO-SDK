/**
 * dYdX v4 Data Normalizer
 *
 * Transforms dYdX Indexer API responses to unified SDK format.
 * dYdX v4 is built on Cosmos SDK and uses USD-denominated perpetuals.
 *
 * @see https://docs.dydx.exchange/
 */
import { DYDX_DEFAULT_PRECISION, DYDX_FUNDING_INTERVAL_HOURS, dydxToUnified } from './constants.js';
/**
 * dYdX v4 Data Normalizer
 *
 * Provides data transformation between dYdX Indexer API and unified formats with:
 * - Symbol format conversions (BTC-USD ↔ BTC/USD:USD)
 * - Numeric string parsing
 * - Status mapping
 * - Position side detection
 *
 * @example
 * ```typescript
 * const normalizer = new DydxNormalizer();
 *
 * // Single entity
 * const market = normalizer.normalizeMarket(dydxMarket);
 *
 * // Batch processing
 * const markets = normalizer.normalizeMarkets(dydxMarkets);
 * ```
 */
export class DydxNormalizer {
    // ===========================================================================
    // Market Normalization
    // ===========================================================================
    /**
     * Normalize dYdX market to unified format
     *
     * @param market - dYdX perpetual market data
     * @returns Unified market
     */
    normalizeMarket(market) {
        const unifiedSymbol = dydxToUnified(market.ticker);
        const [base = '', rest = ''] = unifiedSymbol.split('/');
        const [quote = '', settle = ''] = rest.split(':');
        // Parse step size for amount precision
        const stepSize = parseFloat(market.stepSize);
        const amountPrecision = stepSize > 0 ? Math.abs(Math.log10(stepSize)) : DYDX_DEFAULT_PRECISION.amount;
        // Parse tick size for price precision
        const tickSize = parseFloat(market.tickSize);
        const pricePrecision = tickSize > 0 ? Math.abs(Math.log10(tickSize)) : DYDX_DEFAULT_PRECISION.price;
        return {
            id: market.ticker,
            symbol: unifiedSymbol,
            base,
            quote,
            settle,
            active: market.status === 'ACTIVE',
            minAmount: stepSize,
            pricePrecision: Math.round(pricePrecision),
            amountPrecision: Math.round(amountPrecision),
            priceTickSize: tickSize,
            amountStepSize: stepSize,
            makerFee: 0.0001, // 0.01% - dYdX v4 default
            takerFee: 0.0005, // 0.05% - dYdX v4 default
            maxLeverage: 20, // Default max leverage
            fundingIntervalHours: DYDX_FUNDING_INTERVAL_HOURS,
            info: {
                oraclePrice: market.oraclePrice,
                openInterest: market.openInterest,
                volume24H: market.volume24H,
                initialMarginFraction: market.initialMarginFraction,
                maintenanceMarginFraction: market.maintenanceMarginFraction,
            },
        };
    }
    /**
     * Normalize multiple markets
     *
     * @param markets - Record of dYdX markets
     * @returns Array of unified markets
     */
    normalizeMarkets(markets) {
        return Object.values(markets).map((market) => this.normalizeMarket(market));
    }
    // ===========================================================================
    // Order Normalization
    // ===========================================================================
    /**
     * Normalize dYdX order to unified format
     *
     * @param order - dYdX order
     * @returns Unified order
     */
    normalizeOrder(order) {
        const unifiedSymbol = dydxToUnified(order.ticker);
        const size = parseFloat(order.size);
        const filled = parseFloat(order.totalFilled);
        const remaining = size - filled;
        return {
            id: order.id,
            symbol: unifiedSymbol,
            type: this.normalizeOrderType(order.type),
            side: order.side === 'BUY' ? 'buy' : 'sell',
            amount: size,
            price: order.price ? parseFloat(order.price) : undefined,
            stopPrice: order.triggerPrice ? parseFloat(order.triggerPrice) : undefined,
            status: this.normalizeOrderStatus(order.status),
            filled,
            remaining,
            reduceOnly: order.reduceOnly,
            postOnly: order.postOnly,
            clientOrderId: order.clientId,
            timestamp: order.updatedAt ? new Date(order.updatedAt).getTime() : Date.now(),
            timeInForce: this.normalizeTimeInForce(order.timeInForce),
            info: {
                subaccountId: order.subaccountId,
                clobPairId: order.clobPairId,
                goodTilBlock: order.goodTilBlock,
                goodTilBlockTime: order.goodTilBlockTime,
                orderFlags: order.orderFlags,
                removalReason: order.removalReason,
            },
        };
    }
    /**
     * Normalize multiple orders
     *
     * @param orders - Array of dYdX orders
     * @returns Array of unified orders
     */
    normalizeOrders(orders) {
        return orders.map((order) => this.normalizeOrder(order));
    }
    /**
     * Normalize dYdX order type to unified format
     */
    normalizeOrderType(type) {
        switch (type) {
            case 'MARKET':
                return 'market';
            case 'STOP_LIMIT':
                return 'stopLimit';
            case 'STOP_MARKET':
                return 'stopMarket';
            case 'LIMIT':
            default:
                return 'limit';
        }
    }
    /**
     * Normalize dYdX order status to unified format
     */
    normalizeOrderStatus(status) {
        switch (status) {
            case 'OPEN':
            case 'PENDING':
            case 'UNTRIGGERED':
                return 'open';
            case 'FILLED':
                return 'filled';
            case 'CANCELED':
            case 'BEST_EFFORT_CANCELED':
                return 'canceled';
            default:
                return 'open';
        }
    }
    /**
     * Normalize time in force
     */
    normalizeTimeInForce(tif) {
        switch (tif) {
            case 'IOC':
                return 'IOC';
            case 'FOK':
                return 'FOK';
            case 'GTT':
            default:
                return 'GTC';
        }
    }
    // ===========================================================================
    // Position Normalization
    // ===========================================================================
    /**
     * Normalize dYdX position to unified format
     *
     * @param position - dYdX perpetual position
     * @param oraclePrice - Current oracle price for the market
     * @returns Unified position
     */
    normalizePosition(position, oraclePrice = 0) {
        const unifiedSymbol = dydxToUnified(position.market);
        const size = Math.abs(parseFloat(position.size));
        const entryPrice = parseFloat(position.entryPrice);
        const unrealizedPnl = parseFloat(position.unrealizedPnl);
        const realizedPnl = parseFloat(position.realizedPnl);
        // Calculate position value
        const positionValue = size * (oraclePrice || entryPrice);
        // Estimate leverage (simplified - actual calculation depends on account equity)
        const leverage = positionValue > 0 ? positionValue / (positionValue + unrealizedPnl) : 1;
        return {
            symbol: unifiedSymbol,
            side: position.side === 'LONG' ? 'long' : 'short',
            size,
            entryPrice,
            markPrice: oraclePrice || entryPrice,
            liquidationPrice: 0, // Needs to be calculated based on account state
            unrealizedPnl,
            realizedPnl,
            leverage: Math.round(leverage * 10) / 10,
            marginMode: 'cross', // dYdX v4 uses cross-margin
            margin: 0, // Needs account equity data
            maintenanceMargin: 0,
            marginRatio: 0,
            timestamp: new Date(position.createdAt).getTime(),
            info: {
                status: position.status,
                maxSize: position.maxSize,
                netFunding: position.netFunding,
                sumOpen: position.sumOpen,
                sumClose: position.sumClose,
                subaccountNumber: position.subaccountNumber,
            },
        };
    }
    /**
     * Normalize multiple positions
     *
     * @param positions - Record of dYdX positions
     * @param oraclePrices - Map of oracle prices by ticker
     * @returns Array of unified positions
     */
    normalizePositions(positions, oraclePrices = {}) {
        return Object.values(positions)
            .filter((pos) => parseFloat(pos.size) !== 0)
            .map((pos) => this.normalizePosition(pos, oraclePrices[pos.market] || 0));
    }
    // ===========================================================================
    // Order Book Normalization
    // ===========================================================================
    /**
     * Normalize dYdX order book to unified format
     *
     * @param orderBook - dYdX order book response
     * @param ticker - Market ticker
     * @returns Unified order book
     */
    normalizeOrderBook(orderBook, ticker) {
        const unifiedSymbol = dydxToUnified(ticker);
        const bids = orderBook.bids.map((level) => [
            parseFloat(level.price),
            parseFloat(level.size),
        ]);
        const asks = orderBook.asks.map((level) => [
            parseFloat(level.price),
            parseFloat(level.size),
        ]);
        return {
            symbol: unifiedSymbol,
            timestamp: Date.now(),
            bids,
            asks,
            exchange: 'dydx',
        };
    }
    // ===========================================================================
    // Trade Normalization
    // ===========================================================================
    /**
     * Normalize dYdX trade to unified format
     *
     * @param trade - dYdX trade
     * @param ticker - Market ticker
     * @returns Unified trade
     */
    normalizeTrade(trade, ticker) {
        const unifiedSymbol = dydxToUnified(ticker);
        const price = parseFloat(trade.price);
        const amount = parseFloat(trade.size);
        return {
            id: trade.id,
            symbol: unifiedSymbol,
            side: trade.side === 'BUY' ? 'buy' : 'sell',
            price,
            amount,
            cost: price * amount,
            timestamp: new Date(trade.createdAt).getTime(),
            info: {
                type: trade.type,
                createdAtHeight: trade.createdAtHeight,
            },
        };
    }
    /**
     * Normalize multiple trades
     *
     * @param trades - Array of dYdX trades
     * @param ticker - Market ticker
     * @returns Array of unified trades
     */
    normalizeTrades(trades, ticker) {
        return trades.map((trade) => this.normalizeTrade(trade, ticker));
    }
    /**
     * Normalize dYdX fill to unified trade format
     *
     * @param fill - dYdX fill
     * @returns Unified trade
     */
    normalizeFill(fill) {
        const unifiedSymbol = dydxToUnified(fill.market);
        const price = parseFloat(fill.price);
        const amount = parseFloat(fill.size);
        return {
            id: fill.id,
            symbol: unifiedSymbol,
            orderId: fill.orderId,
            side: fill.side === 'BUY' ? 'buy' : 'sell',
            price,
            amount,
            cost: price * amount,
            timestamp: new Date(fill.createdAt).getTime(),
            info: {
                liquidity: fill.liquidity,
                type: fill.type,
                fee: fill.fee,
                subaccountNumber: fill.subaccountNumber,
            },
        };
    }
    /**
     * Normalize multiple fills
     *
     * @param fills - Array of dYdX fills
     * @returns Array of unified trades
     */
    normalizeFills(fills) {
        return fills.map((fill) => this.normalizeFill(fill));
    }
    // ===========================================================================
    // Funding Rate Normalization
    // ===========================================================================
    /**
     * Normalize dYdX funding rate to unified format
     *
     * @param funding - dYdX historical funding data
     * @param oraclePrice - Current oracle price
     * @returns Unified funding rate
     */
    normalizeFundingRate(funding, oraclePrice = 0) {
        const unifiedSymbol = dydxToUnified(funding.ticker);
        const fundingTimestamp = new Date(funding.effectiveAt).getTime();
        return {
            symbol: unifiedSymbol,
            fundingRate: parseFloat(funding.rate),
            fundingTimestamp,
            nextFundingTimestamp: fundingTimestamp + DYDX_FUNDING_INTERVAL_HOURS * 3600 * 1000,
            markPrice: oraclePrice || parseFloat(funding.price),
            indexPrice: parseFloat(funding.price),
            fundingIntervalHours: DYDX_FUNDING_INTERVAL_HOURS,
            info: {
                price: funding.price,
                effectiveAtHeight: funding.effectiveAtHeight,
            },
        };
    }
    /**
     * Normalize multiple funding rates
     *
     * @param fundingHistory - Array of dYdX funding records
     * @param oraclePrice - Current oracle price
     * @returns Array of unified funding rates
     */
    normalizeFundingHistory(fundingHistory, oraclePrice = 0) {
        return fundingHistory.map((f) => this.normalizeFundingRate(f, oraclePrice));
    }
    // ===========================================================================
    // Balance Normalization
    // ===========================================================================
    /**
     * Normalize dYdX subaccount to unified balance format
     *
     * @param subaccount - dYdX subaccount data
     * @returns Array of unified balances
     */
    normalizeBalance(subaccount) {
        const equity = parseFloat(subaccount.equity);
        const freeCollateral = parseFloat(subaccount.freeCollateral);
        const used = equity - freeCollateral;
        return [
            {
                currency: 'USDC',
                total: equity,
                free: freeCollateral,
                used: used > 0 ? used : 0,
                usdValue: equity,
                info: {
                    pendingDeposits: subaccount.pendingDeposits,
                    pendingWithdrawals: subaccount.pendingWithdrawals,
                    marginEnabled: subaccount.marginEnabled,
                    subaccountNumber: subaccount.subaccountNumber,
                },
            },
        ];
    }
    // ===========================================================================
    // Ticker Normalization
    // ===========================================================================
    /**
     * Normalize market data to ticker format
     *
     * @param market - dYdX perpetual market data
     * @returns Unified ticker
     */
    normalizeTicker(market) {
        const unifiedSymbol = dydxToUnified(market.ticker);
        const oraclePrice = parseFloat(market.oraclePrice);
        const priceChange = parseFloat(market.priceChange24H);
        const volume = parseFloat(market.volume24H);
        // Calculate open price from current price and change
        const openPrice = priceChange !== 0 ? oraclePrice / (1 + priceChange) : oraclePrice;
        return {
            symbol: unifiedSymbol,
            last: oraclePrice,
            bid: oraclePrice, // dYdX doesn't provide BBO in market data
            ask: oraclePrice,
            high: oraclePrice, // Not provided in basic market data
            low: oraclePrice,
            open: openPrice,
            close: oraclePrice,
            change: oraclePrice - openPrice,
            percentage: priceChange * 100,
            baseVolume: volume / oraclePrice, // Convert USD volume to base
            quoteVolume: volume,
            timestamp: Date.now(),
            info: {
                openInterest: market.openInterest,
                nextFundingRate: market.nextFundingRate,
                nextFundingAt: market.nextFundingAt,
                trades24H: market.trades24H,
            },
        };
    }
    // ===========================================================================
    // OHLCV Normalization
    // ===========================================================================
    /**
     * Normalize dYdX candle to OHLCV format
     *
     * @param candle - dYdX candle data
     * @returns OHLCV tuple
     */
    normalizeCandle(candle) {
        return [
            new Date(candle.startedAt).getTime(),
            parseFloat(candle.open),
            parseFloat(candle.high),
            parseFloat(candle.low),
            parseFloat(candle.close),
            parseFloat(candle.baseTokenVolume),
        ];
    }
    /**
     * Normalize multiple candles
     *
     * @param candles - Array of dYdX candles
     * @returns Array of OHLCV tuples
     */
    normalizeCandles(candles) {
        return candles.map((candle) => this.normalizeCandle(candle));
    }
}
//# sourceMappingURL=DydxNormalizer.js.map