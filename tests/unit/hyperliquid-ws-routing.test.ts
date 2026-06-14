/**
 * Hyperliquid WS routing resolver tests (WS-Routing Repair)
 *
 * hyperliquidResolveKeys maps a parsed wire frame (byte-faithful live capture)
 * to the composite subscription key(s) the adapter subscribes under.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import {
  hyperliquidResolveKeys,
  hyperliquidParseMessage,
} from '../../src/adapters/hyperliquid/HyperliquidWsRouting.js';
import type { WebSocketMessage } from '../../src/websocket/types.js';

const FIXTURES = join(__dirname, '../fixtures/hyperliquid');
const load = (f: string): unknown => JSON.parse(readFileSync(join(FIXTURES, f), 'utf-8'));

const l2book = load('ws_l2book.json');
const trades = load('ws_trades.json');
const allmids = load('ws_allmids.json');
const ack = load('ws_subscription_ack.json');

// Exercise the REAL pipeline: parseMessage unwraps the nested `.data` payload,
// then resolveKeys reads the inner payload. The test must mirror this.
function msg(raw: unknown): WebSocketMessage {
  return hyperliquidParseMessage(raw);
}

describe('hyperliquidResolveKeys', () => {
  test('l2Book frame resolves to ["l2Book:<coin>"]', () => {
    expect(hyperliquidResolveKeys(msg(l2book))).toEqual(['l2Book:BTC']);
  });

  test('trades array frame resolves to ["trades:<coin>"] from first element', () => {
    expect(hyperliquidResolveKeys(msg(trades))).toEqual(['trades:BTC']);
  });

  test('allMids frame resolves to the bare ["allMids"] key', () => {
    expect(hyperliquidResolveKeys(msg(allmids))).toEqual(['allMids']);
  });

  test('subscriptionResponse ack resolves to undefined (no routing)', () => {
    expect(hyperliquidResolveKeys(msg(ack))).toBeUndefined();
  });

  test('unknown channel falls back to [message.channel]', () => {
    expect(hyperliquidResolveKeys(msg({ channel: 'bbo', data: {} }))).toEqual(['bbo']);
  });

  test('user frame resolves to user:<address>', () => {
    const userMsg = msg({ channel: 'user', data: { user: '0xabc' } });
    expect(hyperliquidResolveKeys(userMsg)).toEqual(['user:0xabc']);
  });
});
