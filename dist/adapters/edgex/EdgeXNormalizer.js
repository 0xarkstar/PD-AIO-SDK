/**
 * EdgeX Normalizer
 *
 * Transforms EdgeX-specific data structures to unified SDK format
 */
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
        if (contract.contractName) {
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
        const symbol = this.normalizeSymbol(edgexOrder.market);
        return {
            id: edgexOrder.order_id,
            clientOrderId: edgexOrder.client_order_id,
            symbol,
            type: this.normalizeOrderType(edgexOrder.type),
            side: this.normalizeOrderSide(edgexOrder.side),
            amount: parseFloat(edgexOrder.size),
            price: edgexOrder.price ? parseFloat(edgexOrder.price) : undefined,
            filled: parseFloat(edgexOrder.filled_size),
            remaining: parseFloat(edgexOrder.size) - parseFloat(edgexOrder.filled_size),
            averagePrice: edgexOrder.average_price
                ? parseFloat(edgexOrder.average_price)
                : undefined,
            status: this.normalizeOrderStatus(edgexOrder.status),
            timeInForce: this.normalizeTimeInForce(edgexOrder.time_in_force),
            postOnly: edgexOrder.post_only,
            reduceOnly: edgexOrder.reduce_only,
            timestamp: edgexOrder.created_at,
            lastUpdateTimestamp: edgexOrder.updated_at,
            info: edgexOrder,
        };
    }
    /**
     * Normalize EdgeX position to unified format
     */
    normalizePosition(edgexPosition) {
        const symbol = this.normalizeSymbol(edgexPosition.market);
        const size = parseFloat(edgexPosition.size);
        const side = edgexPosition.side === 'LONG' ? 'long' : 'short';
        return {
            symbol,
            side,
            marginMode: 'cross',
            size: Math.abs(size),
            entryPrice: parseFloat(edgexPosition.entry_price),
            markPrice: parseFloat(edgexPosition.mark_price),
            liquidationPrice: edgexPosition.liquidation_price
                ? parseFloat(edgexPosition.liquidation_price)
                : 0,
            unrealizedPnl: parseFloat(edgexPosition.unrealized_pnl),
            realizedPnl: parseFloat(edgexPosition.realized_pnl),
            margin: parseFloat(edgexPosition.margin),
            leverage: parseFloat(edgexPosition.leverage),
            maintenanceMargin: parseFloat(edgexPosition.margin) * 0.04,
            marginRatio: 0,
            timestamp: edgexPosition.timestamp,
            info: edgexPosition,
        };
    }
    /**
     * Normalize EdgeX balance to unified format
     */
    normalizeBalance(edgexBalance) {
        return {
            currency: edgexBalance.asset,
            total: parseFloat(edgexBalance.total),
            free: parseFloat(edgexBalance.available),
            used: parseFloat(edgexBalance.locked),
            info: edgexBalance,
        };
    }
    /**
     * Normalize EdgeX order book to unified format
     * Handles new API format from /api/v1/public/quote/getDepth
     */
    normalizeOrderBook(depthData, symbol) {
        // New format: { asks: [{price, size}], bids: [{price, size}] }
        return {
            symbol,
            exchange: 'edgex',
            bids: (depthData.bids || []).map((level) => [
                parseFloat(level.price),
                parseFloat(level.size),
            ]),
            asks: (depthData.asks || []).map((level) => [
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
        const price = parseFloat(edgexTrade.price);
        const amount = parseFloat(edgexTrade.size);
        return {
            id: edgexTrade.trade_id,
            symbol: this.normalizeSymbol(edgexTrade.market),
            side: this.normalizeOrderSide(edgexTrade.side),
            price,
            amount,
            cost: price * amount,
            timestamp: edgexTrade.timestamp,
            info: edgexTrade,
        };
    }
    /**
     * Normalize EdgeX ticker to unified format
     * Handles new API format from /api/v1/public/quote/getTicker
     */
    normalizeTicker(tickerData) {
        const last = parseFloat(tickerData.lastPrice || tickerData.close || '0');
        const open = parseFloat(tickerData.open || '0');
        const change = parseFloat(tickerData.priceChange || '0');
        const percentage = parseFloat(tickerData.priceChangePercent || '0');
        const symbol = this.normalizeSymbol(tickerData.contractName || '');
        return {
            symbol,
            last,
            open,
            close: last,
            bid: last, // No separate bid in ticker response
            ask: last, // No separate ask in ticker response
            high: parseFloat(tickerData.high || '0'),
            low: parseFloat(tickerData.low || '0'),
            change,
            percentage,
            baseVolume: parseFloat(tickerData.size || tickerData.volume || '0'),
            quoteVolume: parseFloat(tickerData.value || '0'),
            timestamp: parseInt(tickerData.endTime || Date.now().toString(), 10),
            info: tickerData,
        };
    }
    /**
     * Normalize EdgeX funding rate to unified format
     * Handles new API format from /api/v1/public/funding/getLatestFundingRate
     */
    normalizeFundingRate(fundingData, symbol) {
        return {
            symbol,
            fundingRate: parseFloat(fundingData.fundingRate || '0'),
            fundingTimestamp: parseInt(fundingData.fundingTime || fundingData.fundingTimestamp || '0', 10),
            markPrice: parseFloat(fundingData.markPrice || '0'),
            indexPrice: parseFloat(fundingData.indexPrice || '0'),
            nextFundingTimestamp: parseInt(fundingData.nextFundingTime || '0', 10),
            fundingIntervalHours: 4, // EdgeX uses 4h funding intervals
            info: fundingData,
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