/**
 * Portfolio Management Example
 *
 * Demonstrates advanced portfolio management across multiple positions
 */

import { Wallet } from 'ethers';
import {
  createExchange,
  calculateUnrealizedPnl,
  calculateMarginRatio,
  calculateROE,
} from '../src/index.js';

interface PortfolioMetrics {
  totalValue: number;
  totalPnl: number;
  totalROE: number;
  marginUsed: number;
  marginAvailable: number;
  marginRatio: number;
  positions: Array<{
    symbol: string;
    side: 'long' | 'short';
    size: number;
    value: number;
    pnl: number;
    roe: number;
    weight: number;
  }>;
}

async function main(): Promise<void> {
  const wallet = new Wallet(process.env.PRIVATE_KEY!);

  const exchange = createExchange('hyperliquid', {
    wallet,
    testnet: true,
  });

  await exchange.initialize();

  // Fetch account data
  const [positions, balances] = await Promise.all([
    exchange.fetchPositions(),
    exchange.fetchBalance(),
  ]);

  const accountValue = balances[0]?.total ?? 0;
  const freeMargin = balances[0]?.free ?? 0;

  console.log('\n=== Portfolio Overview ===');
  console.log(`Account Value: $${accountValue.toLocaleString()}`);
  console.log(`Free Margin: $${freeMargin.toLocaleString()}`);
  console.log(`Open Positions: ${positions.length}`);

  // Calculate portfolio metrics
  let totalPnl = 0;
  let totalMarginUsed = 0;
  const positionMetrics = [];

  for (const position of positions) {
    const positionValue = position.size * position.markPrice;
    const pnl = position.unrealizedPnl;
    const roe = calculateROE(pnl, position.margin);

    totalPnl += pnl;
    totalMarginUsed += position.margin;

    positionMetrics.push({
      symbol: position.symbol,
      side: position.side,
      size: position.size,
      value: positionValue,
      pnl,
      roe,
      weight: positionValue / accountValue,
    });
  }

  const totalROE = accountValue > 0 ? totalPnl / accountValue : 0;
  const marginRatio = calculateMarginRatio(totalMarginUsed, accountValue);

  const metrics: PortfolioMetrics = {
    totalValue: accountValue,
    totalPnl,
    totalROE,
    marginUsed: totalMarginUsed,
    marginAvailable: freeMargin,
    marginRatio,
    positions: positionMetrics,
  };

  // Display portfolio metrics
  console.log('\n=== Portfolio Metrics ===');
  console.log(`Total P&L: $${metrics.totalPnl.toLocaleString()}`);
  console.log(`Portfolio ROE: ${(metrics.totalROE * 100).toFixed(2)}%`);
  console.log(`Margin Used: $${metrics.marginUsed.toLocaleString()}`);
  console.log(`Margin Ratio: ${(metrics.marginRatio * 100).toFixed(2)}%`);

  // Display position details
  console.log('\n=== Position Details ===');
  for (const pos of metrics.positions) {
    console.log(`\n${pos.symbol}:`);
    console.log(`  Side: ${pos.side.toUpperCase()}`);
    console.log(`  Size: ${pos.size}`);
    console.log(`  Value: $${pos.value.toLocaleString()}`);
    console.log(`  P&L: $${pos.pnl.toLocaleString()} (${(pos.roe * 100).toFixed(2)}%)`);
    console.log(`  Portfolio Weight: ${(pos.weight * 100).toFixed(2)}%`);
  }

  // Risk analysis
  console.log('\n=== Risk Analysis ===');

  if (metrics.marginRatio > 0.8) {
    console.warn('⚠️  HIGH RISK: Margin ratio above 80%');
  } else if (metrics.marginRatio > 0.6) {
    console.warn('⚠️  MODERATE RISK: Margin ratio above 60%');
  } else {
    console.log('✓ Risk level acceptable');
  }

  // Position concentration check
  const maxWeight = Math.max(...metrics.positions.map((p) => p.weight));
  if (maxWeight > 0.5) {
    console.warn(`⚠️  Portfolio concentrated: ${(maxWeight * 100).toFixed(2)}% in single position`);
  }

  // Diversification score (1 = fully concentrated, higher = more diversified)
  const diversificationScore = 1 / metrics.positions.reduce((sum, p) => sum + p.weight ** 2, 0);
  console.log(`Diversification Score: ${diversificationScore.toFixed(2)}`);

  // Worst performing position
  const worstPosition = metrics.positions.reduce((worst, pos) =>
    pos.roe < worst.roe ? pos : worst
  , metrics.positions[0] ?? { roe: 0, symbol: 'N/A', pnl: 0 });

  if (worstPosition && worstPosition.roe < -0.1) {
    console.warn(`⚠️  Worst position: ${worstPosition.symbol} (${(worstPosition.roe * 100).toFixed(2)}%)`);
  }

  await exchange.disconnect();
}

main().catch(console.error);
