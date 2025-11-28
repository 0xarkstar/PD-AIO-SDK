/**
 * Risk Management Example
 *
 * Demonstrates automated risk management with stop-loss and take-profit
 */

import { Wallet } from 'ethers';
import {
  createExchange,
  calculateLiquidationPrice,
  calculateUnrealizedPnl,
} from '../src/index.js';

interface RiskConfig {
  symbol: string;
  stopLossPercent: number;     // Stop loss as % from entry
  takeProfitPercent: number;   // Take profit as % from entry
  trailingStopPercent?: number; // Optional trailing stop
  maxLiquidationDistance: number; // Min % from liquidation
}

async function monitorPosition(config: RiskConfig): Promise<void> {
  const wallet = new Wallet(process.env.PRIVATE_KEY!);

  const exchange = createExchange('hyperliquid', {
    wallet,
    testnet: true,
  });

  await exchange.initialize();

  console.log('\n=== Risk Management Started ===');
  console.log(`Monitoring: ${config.symbol}`);
  console.log(`Stop Loss: ${config.stopLossPercent}%`);
  console.log(`Take Profit: ${config.takeProfitPercent}%`);
  if (config.trailingStopPercent) {
    console.log(`Trailing Stop: ${config.trailingStopPercent}%`);
  }

  let highestPrice = 0;
  let checkCount = 0;

  // Stream position updates
  for await (const positions of exchange.watchPositions()) {
    const position = positions.find((p) => p.symbol === config.symbol);

    if (!position) {
      console.log('No position found, exiting monitor...');
      break;
    }

    checkCount++;
    console.log(`\n[Check #${checkCount}] ${new Date().toISOString()}`);

    const {
      side,
      size,
      entryPrice,
      markPrice,
      unrealizedPnl,
      liquidationPrice,
    } = position;

    // Update highest price for trailing stop (long only)
    if (side === 'long' && markPrice > highestPrice) {
      highestPrice = markPrice;
    }

    // Calculate metrics
    const priceChangePercent = ((markPrice - entryPrice) / entryPrice) * 100;
    const liquidationDistance = Math.abs(markPrice - liquidationPrice);
    const liquidationDistancePercent = (liquidationDistance / markPrice) * 100;

    console.log(`Position: ${side.toUpperCase()} ${size} @ $${entryPrice.toLocaleString()}`);
    console.log(`Mark Price: $${markPrice.toLocaleString()}`);
    console.log(`P&L: $${unrealizedPnl.toLocaleString()} (${priceChangePercent.toFixed(2)}%)`);
    console.log(`Liquidation: $${liquidationPrice.toLocaleString()} (${liquidationDistancePercent.toFixed(2)}% away)`);

    // Check liquidation distance
    if (liquidationDistancePercent < config.maxLiquidationDistance) {
      console.warn(`\n⚠️  CRITICAL: Position close to liquidation!`);
      console.warn(`Closing position immediately...`);

      await closePosition(exchange, config.symbol, size);
      break;
    }

    // Calculate stop loss and take profit prices
    let stopLossPrice: number;
    let takeProfitPrice: number;

    if (side === 'long') {
      stopLossPrice = entryPrice * (1 - config.stopLossPercent / 100);
      takeProfitPrice = entryPrice * (1 + config.takeProfitPercent / 100);

      // Trailing stop (use highest price if configured)
      if (config.trailingStopPercent && highestPrice > entryPrice) {
        const trailingStop = highestPrice * (1 - config.trailingStopPercent / 100);
        if (trailingStop > stopLossPrice) {
          stopLossPrice = trailingStop;
          console.log(`Trailing stop active: $${stopLossPrice.toLocaleString()}`);
        }
      }

      // Check stop loss
      if (markPrice <= stopLossPrice) {
        console.warn(`\n🛑 Stop Loss triggered at $${markPrice.toLocaleString()}`);
        console.warn(`Loss: $${unrealizedPnl.toLocaleString()}`);

        await closePosition(exchange, config.symbol, size);
        break;
      }

      // Check take profit
      if (markPrice >= takeProfitPrice) {
        console.log(`\n✅ Take Profit triggered at $${markPrice.toLocaleString()}`);
        console.log(`Profit: $${unrealizedPnl.toLocaleString()}`);

        await closePosition(exchange, config.symbol, size);
        break;
      }
    } else {
      // Short position
      stopLossPrice = entryPrice * (1 + config.stopLossPercent / 100);
      takeProfitPrice = entryPrice * (1 - config.takeProfitPercent / 100);

      if (markPrice >= stopLossPrice) {
        console.warn(`\n🛑 Stop Loss triggered at $${markPrice.toLocaleString()}`);
        await closePosition(exchange, config.symbol, size);
        break;
      }

      if (markPrice <= takeProfitPrice) {
        console.log(`\n✅ Take Profit triggered at $${markPrice.toLocaleString()}`);
        await closePosition(exchange, config.symbol, size);
        break;
      }
    }

    console.log(`Stop Loss: $${stopLossPrice.toLocaleString()}`);
    console.log(`Take Profit: $${takeProfitPrice.toLocaleString()}`);

    // Rate limit: check every 5 seconds max
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  await exchange.disconnect();
}

async function closePosition(
  exchange: ReturnType<typeof createExchange>,
  symbol: string,
  size: number
): Promise<void> {
  try {
    console.log(`Closing position: ${size} ${symbol}`);

    // Determine side based on position (close opposite)
    const positions = await exchange.fetchPositions([symbol]);
    const position = positions[0];

    if (!position) {
      console.log('Position already closed');
      return;
    }

    const closeSide = position.side === 'long' ? 'sell' : 'buy';

    const order = await exchange.createOrder({
      symbol,
      type: 'market',
      side: closeSide,
      amount: Math.abs(size),
      reduceOnly: true,
    });

    console.log(`✓ Position closed at $${order.averagePrice?.toLocaleString()}`);
  } catch (error) {
    console.error('Error closing position:', error);
    throw error;
  }
}

// Example usage
const riskConfig: RiskConfig = {
  symbol: 'BTC/USDT:USDT',
  stopLossPercent: 2,           // 2% stop loss
  takeProfitPercent: 5,         // 5% take profit
  trailingStopPercent: 1.5,     // 1.5% trailing stop
  maxLiquidationDistance: 10,   // Alert if < 10% from liquidation
};

monitorPosition(riskConfig).catch(console.error);
