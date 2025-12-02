/**
 * Nado Exchange - Basic Trading Example
 *
 * This example demonstrates basic trading operations on Nado DEX,
 * built on Ink L2 by the Kraken team with 5-15ms latency.
 *
 * Features demonstrated:
 * - Exchange initialization with wallet
 * - Market data fetching
 * - Order placement and cancellation
 * - Position and balance monitoring
 * - WebSocket streaming
 */

import { createExchange, createSymbol } from '../src/index.js';
import { Wallet } from 'ethers';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  // ============================================================================
  // 1. Initialize Nado Adapter
  // ============================================================================

  const privateKey = process.env.NADO_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('NADO_PRIVATE_KEY not found in .env');
  }

  const wallet = new Wallet(privateKey);

  console.log('🚀 Initializing Nado adapter...');
  const nado = createExchange('nado', {
    wallet,
    testnet: true, // Use testnet for safety
  });

  await nado.initialize();
  console.log('✅ Nado adapter initialized');
  console.log(`📍 Chain ID: ${nado.testnet ? '763373 (testnet)' : '57073 (mainnet)'}`);
  console.log(`🏦 Wallet: ${wallet.address}`);

  // ============================================================================
  // 2. Fetch Market Data
  // ============================================================================

  console.log('\n📊 Fetching market data...');

  // Get all available markets
  const markets = await nado.fetchMarkets();
  console.log(`📈 Found ${markets.length} markets`);
  markets.slice(0, 3).forEach(market => {
    console.log(`   - ${market.symbol} (ID: ${market.id})`);
  });

  // Use BTC perpetual for examples
  const symbol = createSymbol('nado', 'BTC'); // Returns "BTC/USDT:USDT"
  console.log(`\n🎯 Using symbol: ${symbol}`);

  // Fetch order book
  const orderBook = await nado.fetchOrderBook(symbol);
  console.log('\n📖 Order Book:');
  console.log(`   Best Bid: ${orderBook.bids[0][0]} (${orderBook.bids[0][1]} BTC)`);
  console.log(`   Best Ask: ${orderBook.asks[0][0]} (${orderBook.asks[0][1]} BTC)`);
  console.log(`   Spread: ${(orderBook.asks[0][0] - orderBook.bids[0][0]).toFixed(2)}`);

  // Fetch ticker
  const ticker = await nado.fetchTicker(symbol);
  console.log('\n📊 Ticker:');
  console.log(`   Last: $${ticker.last.toLocaleString()}`);
  console.log(`   24h High: $${ticker.high.toLocaleString()}`);
  console.log(`   24h Low: $${ticker.low.toLocaleString()}`);
  console.log(`   24h Volume: ${ticker.baseVolume.toFixed(2)} BTC`);

  // Fetch funding rate
  const fundingRate = await nado.fetchFundingRate(symbol);
  console.log('\n💰 Funding:');
  console.log(`   Rate: ${(fundingRate.fundingRate * 100).toFixed(4)}%`);
  console.log(`   Mark Price: $${fundingRate.markPrice.toLocaleString()}`);
  console.log(`   Index Price: $${fundingRate.indexPrice.toLocaleString()}`);

  // ============================================================================
  // 3. Check Account Balance
  // ============================================================================

  console.log('\n💳 Fetching account balance...');
  const balances = await nado.fetchBalance();

  balances.forEach(balance => {
    console.log(`\n${balance.currency} Balance:`);
    console.log(`   Free: ${balance.free.toLocaleString()}`);
    console.log(`   Used: ${balance.used.toLocaleString()}`);
    console.log(`   Total: ${balance.total.toLocaleString()}`);
  });

  // ============================================================================
  // 4. Place an Order
  // ============================================================================

  console.log('\n📝 Placing limit order...');

  const bestBid = orderBook.bids[0][0];
  const orderPrice = bestBid * 0.95; // 5% below best bid
  const orderAmount = 0.001; // Small test order

  try {
    const order = await nado.createOrder({
      symbol,
      type: 'limit',
      side: 'buy',
      amount: orderAmount,
      price: orderPrice,
      postOnly: true, // Ensure maker order
    });

    console.log('✅ Order placed successfully:');
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Symbol: ${order.symbol}`);
    console.log(`   Side: ${order.side}`);
    console.log(`   Price: $${order.price.toLocaleString()}`);
    console.log(`   Amount: ${order.amount} BTC`);
    console.log(`   Status: ${order.status}`);

    // ============================================================================
    // 5. Fetch Open Orders
    // ============================================================================

    console.log('\n📋 Fetching open orders...');
    const openOrders = await nado.fetchOpenOrders(symbol);
    console.log(`   Found ${openOrders.length} open orders`);

    // ============================================================================
    // 6. Cancel the Order
    // ============================================================================

    if (openOrders.length > 0) {
      console.log('\n🗑️  Canceling order...');
      const canceledOrder = await nado.cancelOrder(order.id, symbol);
      console.log(`   ✅ Order ${canceledOrder.id} canceled`);
    }

  } catch (error) {
    console.error('❌ Order error:', error);
  }

  // ============================================================================
  // 7. Check Positions
  // ============================================================================

  console.log('\n📊 Fetching positions...');
  const positions = await nado.fetchPositions();

  if (positions.length === 0) {
    console.log('   No open positions');
  } else {
    positions.forEach(position => {
      console.log(`\n${position.symbol} Position:`);
      console.log(`   Side: ${position.side}`);
      console.log(`   Size: ${position.size}`);
      console.log(`   Entry: $${position.entryPrice.toLocaleString()}`);
      console.log(`   Mark: $${position.markPrice.toLocaleString()}`);
      console.log(`   Unrealized PnL: $${position.unrealizedPnl.toFixed(2)}`);
      console.log(`   Leverage: ${position.leverage}x`);
    });
  }

  // ============================================================================
  // 8. WebSocket Streaming (Optional)
  // ============================================================================

  console.log('\n📡 Setting up WebSocket streaming...');
  console.log('   (Streaming for 10 seconds...)');

  const stream = nado.watchOrderBook(symbol);
  const updates: number[] = [];

  const streamPromise = (async () => {
    try {
      for await (const update of stream) {
        updates.push(update.timestamp);
        if (updates.length === 1) {
          console.log(`   ✅ First update received: ${new Date(update.timestamp).toISOString()}`);
        }

        // Stop after 10 seconds
        if (Date.now() - updates[0] > 10000) {
          break;
        }
      }
    } catch (error) {
      console.error('   WebSocket error:', error);
    }
  })();

  await streamPromise;
  console.log(`   📊 Received ${updates.length} order book updates`);

  // ============================================================================
  // 9. Cleanup
  // ============================================================================

  console.log('\n🧹 Cleaning up...');
  await nado.disconnect();
  console.log('✅ Disconnected from Nado');
}

// Run the example
main()
  .then(() => {
    console.log('\n✅ Example completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Example failed:', error);
    process.exit(1);
  });
