/**
 * DCA (Dollar Cost Averaging) Strategy Example
 *
 * Implements automated DCA buying with position tracking
 */

import { Wallet } from 'ethers';
import {
  createExchange,
  calculateAverageEntryPrice,
  calculateUnrealizedPnl,
} from '../src/index.js';

interface DCAConfig {
  symbol: string;
  amountPerBuy: number;      // Amount to buy each interval
  intervalMinutes: number;    // Time between buys
  totalBuys: number;         // Number of buys to execute
  maxSlippageBps: number;    // Maximum slippage in basis points
}

async function executeDCA(config: DCAConfig): Promise<void> {
  const wallet = new Wallet(process.env.PRIVATE_KEY!);

  const exchange = createExchange('hyperliquid', {
    wallet,
    testnet: true,
  });

  await exchange.initialize();

  console.log('\n=== DCA Strategy Started ===');
  console.log(`Symbol: ${config.symbol}`);
  console.log(`Amount per buy: ${config.amountPerBuy}`);
  console.log(`Interval: ${config.intervalMinutes} minutes`);
  console.log(`Total buys: ${config.totalBuys}`);
  console.log(`Max slippage: ${config.maxSlippageBps / 100}%`);

  let totalSize = 0;
  let totalCost = 0;
  let buyCount = 0;

  for (let i = 0; i < config.totalBuys; i++) {
    try {
      console.log(`\n--- Buy ${i + 1}/${config.totalBuys} ---`);

      // Get current market price
      const orderbook = await exchange.fetchOrderBook(config.symbol);
      const [, askSize] = orderbook.asks[0] ?? [0, 0];
      const marketPrice = orderbook.asks[0]?.[0] ?? 0;

      console.log(`Market price: $${marketPrice.toLocaleString()}`);
      console.log(`Available liquidity: ${askSize}`);

      // Check slippage
      const limitPrice = marketPrice * (1 + config.maxSlippageBps / 10000);

      // Place limit order with slippage protection
      const order = await exchange.createOrder({
        symbol: config.symbol,
        type: 'limit',
        side: 'buy',
        amount: config.amountPerBuy,
        price: limitPrice,
        timeInForce: 'IOC', // Immediate or cancel
      });

      if (order.status === 'filled' || order.status === 'partiallyFilled') {
        const filledSize = order.filled;
        const avgFillPrice = order.averagePrice ?? limitPrice;

        totalSize += filledSize;
        totalCost += filledSize * avgFillPrice;
        buyCount++;

        const currentAvgPrice = calculateAverageEntryPrice(
          totalSize - filledSize,
          totalSize > filledSize ? totalCost / (totalSize - filledSize) : 0,
          filledSize,
          avgFillPrice
        );

        console.log(`✓ Filled ${filledSize} @ $${avgFillPrice.toLocaleString()}`);
        console.log(`  Running avg price: $${currentAvgPrice.toLocaleString()}`);
        console.log(`  Total position: ${totalSize}`);

        // Calculate current P&L
        const currentPrice = orderbook.asks[0]?.[0] ?? avgFillPrice;
        const unrealizedPnl = calculateUnrealizedPnl('long', currentAvgPrice, currentPrice, totalSize);

        console.log(`  Current P&L: $${unrealizedPnl.toLocaleString()}`);
      } else {
        console.log(`✗ Order not filled (slippage too high)`);
      }

      // Wait for next interval (except on last iteration)
      if (i < config.totalBuys - 1) {
        const waitMs = config.intervalMinutes * 60 * 1000;
        console.log(`Waiting ${config.intervalMinutes} minutes...`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    } catch (error) {
      console.error(`Error on buy ${i + 1}:`, error);
      continue;
    }
  }

  // Final summary
  console.log('\n=== DCA Strategy Completed ===');
  console.log(`Successful buys: ${buyCount}/${config.totalBuys}`);
  console.log(`Total size: ${totalSize}`);

  if (totalSize > 0) {
    const avgEntryPrice = totalCost / totalSize;
    console.log(`Average entry price: $${avgEntryPrice.toLocaleString()}`);

    // Get final position
    const positions = await exchange.fetchPositions([config.symbol]);
    const position = positions.find((p) => p.symbol === config.symbol);

    if (position) {
      console.log(`\nCurrent position:`);
      console.log(`  Size: ${position.size}`);
      console.log(`  Entry: $${position.entryPrice.toLocaleString()}`);
      console.log(`  Mark: $${position.markPrice.toLocaleString()}`);
      console.log(`  P&L: $${position.unrealizedPnl.toLocaleString()}`);
    }
  }

  await exchange.disconnect();
}

// Example usage
const dcaConfig: DCAConfig = {
  symbol: 'BTC/USDT:USDT',
  amountPerBuy: 0.01,        // Buy 0.01 BTC each time
  intervalMinutes: 60,        // Every hour
  totalBuys: 5,              // 5 total buys
  maxSlippageBps: 10,        // Max 0.1% slippage
};

executeDCA(dcaConfig).catch(console.error);
