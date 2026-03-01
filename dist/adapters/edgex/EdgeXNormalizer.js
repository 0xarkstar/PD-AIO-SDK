/**
 * EdgeX Normalizer
 *
 * Transforms EdgeX-specific data structures to unified SDK format
 */
import { EdgeXOrderSchema, EdgeXPositionSchema, EdgeXBalanceSchema, EdgeXTradeSchema, EdgeXDepthDataSchema, EdgeXAPITickerSchema, EdgeXAPIFundingDataSchema, } from './types.js';
export class EdgeXNormalizer {
    // Cache for symbol -> contractId mapping
    symbolToContractId = new Map();
    contractIdToSymbol = new Map();
    /**
     * Initialize mapping from market data
     */
    initializeMappings(contracts) {
        for (const contract of contracts) {
            // contractName is like "BTCUSD", "ETHUSD"
            // Convert to CCXT format: "BTC/USD:USD"
            const name = contract.contractName;
            // Extract base (first 3-4 chars) and quote (last 3 chars typically USD)
            const base = name.replace(/USD$/, '');
            const quote = 'USD';
            const ccxtSymbol = `${base}/${quote}:${quote}`;
            this.symbolToContractId.set(ccxtSymbol, contract.contractId);
            this.contractIdToSymbol.set(contract.contractId, ccxtSymbol);
        }
    }
    /**
     * Normalize EdgeX symbol to unified format
     *
     * Handles multiple formats:
     * - New API format: 'BTCUSD', 'ETHUSD' → 'BTC/USD:USD'
     * - Legacy format: 'BTC-USDC-PERP' → 'BTC/USDC:USDC'
     */
    normalizeSymbol(edgexSymbol) {
        // Handle legacy format: BTC-USDC-PERP
        if (edgexSymbol.includes('-')) {
            const parts = edgexSymbol.split('-');
            if (parts.length === 3 && parts[2] === 'PERP') {
                const base = parts[0];
                const quote = parts[1];
                return `${base}/${quote}:${quote}`;
            }
            // Spot format: BTC-USDC
            return edgexSymbol.replace('-', '/');
        }
        // New API format: BTCUSD, ETHUSD (perpetuals use USD quote)
        // Extract base by removing USD suffix
        const base = edgexSymbol.replace(/USD$/, '');
        return `${base}/USD:USD`;
    }
    /**
     * Convert unified symbol to EdgeX format
     *
     * Supports both formats:
     * - New API: 'BTC/USD:USD' → 'BTCUSD'
     * - Legacy: 'BTC/USDC:USDC' → 'BTC-USDC-PERP'
     */
    toEdgeXSymbol(symbol) {
        const parts = symbol.split(':');
        const [pair = ''] = parts;
        const [base = '', quote = ''] = pair.split('/');
        // If quote is USDC (legacy format), use dash-separated format
        if (quote === 'USDC') {
            return parts.length === 2 ? `${base}-${quote}-PERP` : `${base}-${quote}`;
        }
        // New API format: BTCUSD
        return `${base}${quote || 'USD'}`;
    }
    /**
     * Convert unified symbol to EdgeX contractId
     *
     * @example
     * toEdgeXContractId('BTC/USD:USD') // '10000001'
     */
    toEdgeXContractId(symbol) {
        // Check cache first
        const cachedId = this.symbolToContractId.get(symbol);
        if (cachedId) {
            return cachedId;
        }
        // Fallback: Map common symbols to known contract IDs
        const symbolToId = {
            'BTC/USD:USD': '10000001',
            'ETH/USD:USD': '10000002',
            'SOL/USD:USD': '10000003',
            'ARB/USD:USD': '10000004',
            'DOGE/USD:USD': '10000005',
            'XRP/USD:USD': '10000006',
            'BNB/USD:USD': '10000007',
            'AVAX/USD:USD': '10000008',
            'LINK/USD:USD': '10000009',
            'LTC/USD:USD': '10000010',
        };
        return symbolToId[symbol] || '10000001'; // Default to BTC
    }
    /**
     * Normalize EdgeX market to unified format
     * Handles both old test format and new API format
     */
    normalizeMarket(contract) {
        // New API format: has contractName (e.g., "BTCUSD")
        if ('contractName' in contract) {
            const contractName = contract.contractName;
            const base = contractName.replace(/USD$/, '');
            const symbol = `${base}/USD:USD`;
            // Store mapping
            this.symbolToContractId.set(symbol, contract.contractId);
            this.contractIdToSymbol.set(contract.contractId, symbol);
            // Get max leverage from first tier
            const maxLeverage = contract.riskTierList?.[0]?.maxLeverage
                ? parseFloat(contract.riskTierList[0].maxLeverage)
                : 100;
            return {
                id: contract.contractId,
                symbol,
                base,
                quote: 'USD',
                settle: 'USD',
                active: contract.enableTrade ?? true,
                minAmount: parseFloat(contract.minOrderSize || '0.001'),
                pricePrecision: this.countDecimals(contract.tickSize || '0.1'),
                amountPrecision: this.countDecimals(contract.stepSize || '0.001'),
                priceTickSize: parseFloat(contract.tickSize || '0.1'),
                amountStepSize: parseFloat(contract.stepSize || '0.001'),
                makerFee: parseFloat(contract.defaultMakerFeeRate || '0.0002'),
                takerFee: parseFloat(contract.defaultTakerFeeRate || '0.0005'),
                maxLeverage,
                fundingIntervalHours: 4, // EdgeX uses 4h funding
            };
        }
        // Legacy test format: has symbol (e.g., "BTC-USDC-PERP")
        const symbol = this.normalizeSymbol(contract.symbol);
        return {
            id: contract.market_id,
            symbol,
            base: contract.base_asset,
            quote: contract.quote_asset,
            settle: contract.settlement_asset,
            active: contract.is_active,
            minAmount: parseFloat(contract.min_order_size),
            pricePrecision: this.countDecimals(contract.tick_size),
            amountPrecision: this.countDecimals(contract.step_size),
            priceTickSize: parseFloat(contract.tick_size),
            amountStepSize: parseFloat(contract.step_size),
            makerFee: parseFloat(contract.maker_fee),
            takerFee: parseFloat(contract.taker_fee),
            maxLeverage: parseFloat(contract.max_leverage),
            fundingIntervalHours: 8,
        };
    }
    /**
     * Normalize EdgeX order to unified format
     */
    normalizeOrder(edgexOrder) {
        const validated = EdgeXOrderSchema.parse(edgexOrder);
        const symbol = this.normalizeSymbol(validated.market);
        return {
            id: validated.order_id,
            clientOrderId: validated.client_order_id,
            symbol,
            type: this.normalizeOrderType(validated.type),
            side: this.normalizeOrderSide(validated.side),
            amount: parseFloat(validated.size),
            price: validated.price ? parseFloat(validated.price) : undefined,
            filled: parseFloat(validated.filled_size),
            remaining: parseFloat(validated.size) - parseFloat(validated.filled_size),
            averagePrice: validated.average_price ? parseFloat(validated.average_price) : undefined,
            status: this.normalizeOrderStatus(validated.status),
            timeInForce: this.normalizeTimeInForce(validated.time_in_force),
            postOnly: validated.post_only,
            reduceOnly: validated.reduce_only,
            timestamp: validated.created_at,
            lastUpdateTimestamp: validated.updated_at,
            info: validated,
        };
    }
    /**
     * Normalize EdgeX position to unified format
     */
    normalizePosition(edgexPosition) {
        const validated = EdgeXPositionSchema.parse(edgexPosition);
        const symbol = this.normalizeSymbol(validated.market);
        const size = parseFloat(validated.size);
        const side = validated.side === 'LONG' ? 'long' : 'short';
        const absSize = Math.abs(size);
        const markPrice = parseFloat(validated.mark_price);
        const maintenanceMargin = parseFloat(validated.margin) * 0.04;
        const notional = absSize * markPrice;
        return {
            symbol,
            side,
            marginMode: 'cross',
            size: absSize,
            entryPrice: parseFloat(validated.entry_price),
            markPrice,
            liquidationPrice: validated.liquidation_price ? parseFloat(validated.liquidation_price) : 0,
            unrealizedPnl: parseFloat(validated.unrealized_pnl),
            realizedPnl: parseFloat(validated.realized_pnl),
            margin: parseFloat(validated.margin),
            leverage: parseFloat(validated.leverage),
            maintenanceMargin,
            marginRatio: notional > 0 ? maintenanceMargin / notional : 0,
            timestamp: validated.timestamp,
            info: validated,
        };
    }
    /**
     * Normalize EdgeX balance to unified format
     */
    normalizeBalance(edgexBalance) {
        const validated = EdgeXBalanceSchema.parse(edgexBalance);
        return {
            currency: validated.asset,
            total: parseFloat(validated.total),
            free: parseFloat(validated.available),
            used: parseFloat(validated.locked),
            info: validated,
        };
    }
    /**
     * Normalize EdgeX order book to unified format
     * Handles new API format from /api/v1/public/quote/getDepth
     */
    normalizeOrderBook(depthData, symbol) {
        const validated = EdgeXDepthDataSchema.parse(depthData);
        // New format: { asks: [{price, size}], bids: [{price, size}] }
        return {
            symbol,
            exchange: 'edgex',
            bids: (validated.bids || []).map((level) => [
                parseFloat(level.price),
                parseFloat(level.size),
            ]),
            asks: (validated.asks || []).map((level) => [
                parseFloat(level.price),
                parseFloat(level.size),
            ]),
            timestamp: Date.now(),
        };
    }
    /**
     * Normalize EdgeX trade to unified format
     */
    normalizeTrade(edgexTrade) {
        const validated = EdgeXTradeSchema.parse(edgexTrade);
        const price = parseFloat(validated.price);
        const amount = parseFloat(validated.size);
        return {
            id: validated.trade_id,
            symbol: this.normalizeSymbol(validated.market),
            side: this.normalizeOrderSide(validated.side),
            price,
            amount,
            cost: price * amount,
            timestamp: validated.timestamp,
            info: validated,
        };
    }
    /**
     * Normalize EdgeX ticker to unified format
     * Handles new API format from /api/v1/public/quote/getTicker
     */
    normalizeTicker(tickerData) {
        const validated = EdgeXAPITickerSchema.parse(tickerData);
        const last = parseFloat(validated.lastPrice || validated.close || '0');
        const open = parseFloat(validated.open || '0');
        const change = parseFloat(validated.priceChange || '0');
        const percentage = parseFloat(validated.priceChangePercent || '0');
        const symbol = this.normalizeSymbol(validated.contractName || '');
        return {
            symbol,
            last,
            open,
            close: last,
            bid: last, // No separate bid in ticker response
            ask: last, // No separate ask in ticker response
            high: parseFloat(validated.high || '0'),
            low: parseFloat(validated.low || '0'),
            change,
            percentage,
            baseVolume: parseFloat(validated.size || validated.volume || '0'),
            quoteVolume: parseFloat(validated.value || '0'),
            timestamp: parseInt(validated.endTime || Date.now().toString(), 10),
            info: {
                ...validated,
                _bidAskSource: 'last_price',
            },
        };
    }
    /**
     * Normalize EdgeX funding rate to unified format
     * Handles new API format from /api/v1/public/funding/getLatestFundingRate
     */
    normalizeFundingRate(fundingData, symbol) {
        const validated = EdgeXAPIFundingDataSchema.parse(fundingData);
        return {
            symbol,
            fundingRate: parseFloat(validated.fundingRate || '0'),
            fundingTimestamp: parseInt(validated.fundingTime || validated.fundingTimestamp || '0', 10),
            markPrice: parseFloat(validated.markPrice || '0'),
            indexPrice: parseFloat(validated.indexPrice || '0'),
            nextFundingTimestamp: parseInt(validated.nextFundingTime || '0', 10),
            fundingIntervalHours: 4, // EdgeX uses 4h funding intervals
            info: validated,
        };
    }
    /**
     * Normalize EdgeX order type to unified format
     */
    normalizeOrderType(edgexType) {
        switch (edgexType) {
            case 'MARKET':
                return 'market';
            case 'LIMIT':
                return 'limit';
            default:
                return 'limit';
        }
    }
    /**
     * Normalize EdgeX order side to unified format
     */
    normalizeOrderSide(edgexSide) {
        return edgexSide === 'BUY' ? 'buy' : 'sell';
    }
    /**
     * Normalize EdgeX order status to unified format
     */
    normalizeOrderStatus(edgexStatus) {
        const statusMap = {
            PENDING: 'open',
            OPEN: 'open',
            PARTIALLY_FILLED: 'partiallyFilled',
            FILLED: 'filled',
            CANCELLED: 'canceled',
            REJECTED: 'rejected',
        };
        return statusMap[edgexStatus] ?? 'open';
    }
    /**
     * Normalize EdgeX time in force to unified format
     */
    normalizeTimeInForce(edgexTif) {
        switch (edgexTif) {
            case 'GTC':
                return 'GTC';
            case 'IOC':
                return 'IOC';
            case 'FOK':
                return 'FOK';
            default:
                return 'GTC';
        }
    }
    /**
     * Count decimal places in a string number
     */
    countDecimals(value) {
        const parts = value.split('.');
        return parts.length === 2 && parts[1] ? parts[1].length : 0;
    }
}
//# sourceMappingURL=EdgeXNormalizer.js.map