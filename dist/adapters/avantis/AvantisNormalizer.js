/**
 * Avantis Data Normalizer
 *
 * Transforms on-chain contract data to unified SDK format.
 * No normalizeOrderBook or normalizeTrade (oracle-based, no book/public trades).
 */
import { AVANTIS_FUNDING_INTERVAL_HOURS, AVANTIS_DEFAULT_PRECISION, avantisToUnified, } from './constants.js';
import { convertPythPrice, fromUsdcDecimals, fromPriceDecimals } from './utils.js';
import { AvantisPairInfoSchema, AvantisOpenTradeSchema, AvantisBalanceSchema, AvantisPythPriceSchema, AvantisFundingFeesSchema, } from './types.js';
export class AvantisNormalizer {
    // ===========================================================================
    // Symbol Conversion
    // ===========================================================================
    symbolToCCXT(pairIndex) {
        return avantisToUnified(pairIndex);
    }
    // ===========================================================================
    // Market Normalization
    // ===========================================================================
    normalizeMarket(pair) {
        AvantisPairInfoSchema.parse(pair);
        const base = pair.from;
        const quote = pair.to;
        const unifiedSymbol = `${base}/${quote}:${quote}`;
        const spreadP = parseFloat(pair.spreadP);
        return {
            id: pair.pairIndex.toString(),
            symbol: unifiedSymbol,
            base,
            quote,
            settle: quote,
            active: true,
            minAmount: 0,
            pricePrecision: AVANTIS_DEFAULT_PRECISION.price,
            amountPrecision: AVANTIS_DEFAULT_PRECISION.amount,
            priceTickSize: 0.01,
            amountStepSize: 0.001,
            makerFee: spreadP / 100,
            takerFee: spreadP / 100,
            maxLeverage: 150,
            fundingIntervalHours: AVANTIS_FUNDING_INTERVAL_HOURS,
            info: {
                pairIndex: pair.pairIndex,
                groupIndex: pair.groupIndex,
                feeIndex: pair.feeIndex,
                spreadP: pair.spreadP,
            },
        };
    }
    // ===========================================================================
    // Ticker Normalization (from Pyth Oracle)
    // ===========================================================================
    normalizeTicker(pairIndex, pythPrice) {
        AvantisPythPriceSchema.parse(pythPrice);
        const unifiedSymbol = avantisToUnified(pairIndex);
        const price = convertPythPrice(pythPrice.price, pythPrice.expo);
        const confidence = convertPythPrice(pythPrice.conf, pythPrice.expo);
        return {
            symbol: unifiedSymbol,
            last: price,
            bid: price - confidence,
            ask: price + confidence,
            high: 0,
            low: 0,
            open: 0,
            close: price,
            change: 0,
            percentage: 0,
            baseVolume: 0,
            quoteVolume: 0,
            timestamp: pythPrice.publishTime * 1000,
            info: {
                pythPrice: pythPrice.price,
                pythConf: pythPrice.conf,
                pythExpo: pythPrice.expo,
                _bidAskSource: 'pyth_oracle_confidence',
            },
        };
    }
    // ===========================================================================
    // Position Normalization (from contract openTrades)
    // ===========================================================================
    normalizePosition(trade, markPrice) {
        AvantisOpenTradeSchema.parse(trade);
        const unifiedSymbol = avantisToUnified(trade.pairIndex);
        const positionSize = fromUsdcDecimals(trade.positionSizeDai);
        const entryPrice = fromPriceDecimals(trade.openPrice);
        const leverage = parseFloat(trade.leverage);
        const isLong = trade.buy;
        // Calculate size in base units
        const size = entryPrice > 0 ? (positionSize * leverage) / entryPrice : 0;
        // Calculate unrealized PnL
        const priceDelta = isLong ? markPrice - entryPrice : entryPrice - markPrice;
        const unrealizedPnl = size * priceDelta;
        return {
            symbol: unifiedSymbol,
            side: isLong ? 'long' : 'short',
            size,
            entryPrice,
            markPrice,
            liquidationPrice: 0,
            unrealizedPnl,
            realizedPnl: 0,
            leverage,
            marginMode: 'isolated',
            margin: positionSize,
            maintenanceMargin: 0,
            marginRatio: 0,
            timestamp: Date.now(),
            info: {
                trader: trade.trader,
                pairIndex: trade.pairIndex,
                tradeIndex: trade.index,
                initialPosToken: trade.initialPosToken,
                tp: trade.tp,
                sl: trade.sl,
                _realizedPnlSource: 'not_available',
                _marginRatioSource: 'not_available',
            },
        };
    }
    // ===========================================================================
    // Balance Normalization
    // ===========================================================================
    normalizeBalance(balance) {
        AvantisBalanceSchema.parse(balance);
        const total = parseFloat(balance.balance) / Math.pow(10, balance.decimals);
        return {
            currency: balance.asset,
            total,
            free: total,
            used: 0,
            usdValue: total,
        };
    }
    // ===========================================================================
    // Funding Rate Normalization
    // ===========================================================================
    normalizeFundingRate(pairIndex, funding, markPrice) {
        AvantisFundingFeesSchema.parse(funding);
        const unifiedSymbol = avantisToUnified(pairIndex);
        const longRate = parseFloat(funding.accPerOiLong) / 1e18;
        const shortRate = parseFloat(funding.accPerOiShort) / 1e18;
        const fundingRate = longRate - shortRate;
        const now = Date.now();
        return {
            symbol: unifiedSymbol,
            fundingRate,
            fundingTimestamp: now,
            nextFundingTimestamp: now + AVANTIS_FUNDING_INTERVAL_HOURS * 3600 * 1000,
            markPrice,
            indexPrice: markPrice,
            fundingIntervalHours: AVANTIS_FUNDING_INTERVAL_HOURS,
        };
    }
}
//# sourceMappingURL=AvantisNormalizer.js.map