/**
 * GRVT Basic Usage Example
 *
 * Demonstrates basic trading and market data fetching with GRVT
 */

import { Wallet } from 'ethers';
import { createExchange } from '../src/index.js';

async function main(): Promise<void> {
  // Initialize GRVT exchange
  const wallet = new Wallet(process.env.PRIVATE_KEY!);

  const exchange = createExchange('grvt', {
    wallet,
    testnet: true, // Use testnet for development
  });

  await exchange.initialize();

  console.log('\n=== GRVT Basic Example ===\n');

  // 1. Fetch available markets
  console.log('1. Fetching markets...');
  const markets = await exchange.fetchMarkets({ active: true });

  console.log(`Found ${markets.length} active markets`);
  console.log('\nTop 5 markets:');
  markets.slice(0, 5).forEach((market) => {
    console.log(`  ${market.symbol}:`);
    console.log(`    Max Leverage: ${market.maxLeverage}x`);
    console.log(`    Maker Fee: ${(market.makerFee * 100).toFixed(3)}%`);
    console.log(`    Taker Fee: ${(market.takerFee * 100).toFixed(3)}%`);
  });

  // 2. Fetch order book
  console.log('\n2. Fetching BTC order book...');
  const orderbook = await exchange.fetchOrderBook('BTC/USDT:USDT', 5);

  console.log('Best 3 bids:');
  orderbook.bids.slice(0, 3).forEach(([price, size]) => {
    console.log(`  $${price.toLocaleString()} x ${size}`);
  });

  console.log('Best 3 asks:');
  orderbook.asks.slice(0, 3).forEach(([price, size]) => {
    console.log(`  $${price.toLocaleString()} x ${size}`);
  });

  const spread = orderbook.asks[0][0] - orderbook.bids[0][0];
  const spreadBps = (spread / orderbook.bids[0][0]) * 10000;
  console.log(`Spread: $${spread.toFixed(2)} (${spreadBps.toFixed(2)} bps)`);

  // 3. Fetch ticker
  console.log('\n3. Fetching BTC ticker...');
  const ticker = await exchange.fetchTicker('BTC/USDT:USDT');

  console.log(`Last: $${ticker.last?.toLocaleString()}`);
  console.log(`24h High: $${ticker.high?.toLocaleString()}`);
  console.log(`24h Low: $${ticker.low?.toLocaleString()}`);
  console.log(`24h Volume: ${ticker.volume?.toLocaleString()}`);

  // 4. Fetch funding rate
  console.log('\n4. Fetching BTC funding rate...');
  const fundingRate = await exchange.fetchFundingRate('BTC/USDT:USDT');

  console.log(`Funding Rate: ${(fundingRate.fundingRate * 100).toFixed(4)}%`);
  console.log(`Mark Price: $${fundingRate.markPrice.toLocaleString()}`);
  console.log(`Next Funding: ${new Date(fundingRate.nextFundingTimestamp).toISOString()}`);

  // Calculate funding payment for 1 BTC position
  const positionValue = 1 * fundingRate.markPrice;
  const fundingPayment = positionValue * fundingRate.fundingRate;
  console.log(`Funding payment (1 BTC): $${fundingPayment.toFixed(2)}`);

  // 5. Fetch account balance
  console.log('\n5. Fetching account balance...');
  const balances = await exchange.fetchBalance();

  balances.forEach((balance) => {
    console.log(`${balance.currency}:`);
    console.log(`  Total: ${balance.total.toLocaleString()}`);
    console.log(`  Free: ${balance.free.toLocaleString()}`);
    console.log(`  Used: ${balance.used.toLocaleString()}`);
  });

  // 6. Fetch open positions
  console.log('\n6. Fetching open positions...');
  const positions = await exchange.fetchPositions();

  if (positions.length === 0) {
    console.log('No open positions');
  } else {
    positions.forEach((position) => {
      console.log(`\n${position.symbol}:`);
      console.log(`  Side: ${position.side.toUpperCase()}`);
      console.log(`  Size: ${position.size}`);
      console.log(`  Entry: $${position.entryPrice.toLocaleString()}`);
      console.log(`  Mark: $${position.markPrice.toLocaleString()}`);
      console.log(`  PnL: $${position.unrealizedPnl.toLocaleString()}`);
      console.log(`  Leverage: ${position.leverage}x`);
      console.log(`  Liquidation: $${position.liquidationPrice?.toLocaleString()}`);
    });
  }

  // 7. Place a limit order (post-only)
  console.log('\n7. Placing limit order...');

  try {
    // Place a buy order below market price
    const buyPrice = orderbook.bids[0][0] - 10; // $10 below best bid

    const order = await exchange.createOrder({
      symbol: 'BTC/USDT:USDT',
      type: 'limit',
      side: 'buy',
      amount: 0.001, // 0.001 BTC
      price: buyPrice,
      postOnly: true, // Maker order only
    });

    console.log('Order placed successfully:');
    console.log(`  ID: ${order.id}`);
    console.log(`  Status: ${order.status}`);
    console.log(`  Price: $${order.price?.toLocaleString()}`);
    console.log(`  Amount: ${order.amount}`);

    // Wait a moment
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Fetch open orders
    const openOrders = await exchange.fetchOpenOrders('BTC/USDT:USDT');
    console.log(`\nOpen orders: ${openOrders.length}`);

    // Cancel the order
    if (openOrders.length > 0) {
      console.log('\nCancelling order...');
      await exchange.cancelOrder(order.id, 'BTC/USDT:USDT');
      console.log('Order cancelled successfully');
    }
  } catch (error) {
    console.error('Order error:', error);
  }

  // 8. Stream real-time order book (optional)
  console.log('\n8. Streaming order book for 10 seconds...');

  const streamController = new AbortController();
  let updateCount = 0;

  // Stop after 10 seconds
  setTimeout(() => streamController.abort(), 10000);

  try {
    for await (const ob of exchange.watchOrderBook('BTC/USDT:USDT')) {
      if (streamController.signal.aborted) break;

      updateCount++;
      const [bidPrice, bidSize] = ob.bids[0];
      const [askPrice, askSize] = ob.asks[0];

      console.log(
        `Update #${updateCount}: Bid $${bidPrice.toLocaleString()} x ${bidSize} | Ask $${askPrice.toLocaleString()} x ${askSize}`
      );

      if (updateCount >= 10) break;
    }
  } catch (error) {
    // Stream interrupted (expected)
  }

  // Cleanup
  await exchange.disconnect();

  console.log('\n=== Example completed ===');
}

main().catch(console.error);
