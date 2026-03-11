import { createExchange } from '../src/index.js';

const name = process.argv[2] ?? 'hyperliquid';
const symbol = process.argv[3] ?? 'BTC/USDT:USDT';

(async () => {
  console.log(`Testing ${name}...`);
  const ex = await createExchange(name as any);
  await ex.initialize();

  try {
    const markets = await ex.fetchMarkets();
    console.log(`  Markets: ${markets.length}`);
    if (markets[0]) console.log(`  First: ${markets[0].symbol}`);
  } catch (e: any) { console.log(`  Markets FAIL: ${e.message?.slice(0, 100)}`); }

  try {
    const ticker = await ex.fetchTicker(symbol);
    console.log(`  Ticker: $${ticker.last ?? ticker.mark}`);
  } catch (e: any) { console.log(`  Ticker FAIL: ${e.message?.slice(0, 100)}`); }

  try {
    const ob = await ex.fetchOrderBook(symbol);
    console.log(`  OB: ${ob.bids.length}b/${ob.asks.length}a`);
  } catch (e: any) { console.log(`  OB FAIL: ${e.message?.slice(0, 100)}`); }

  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
