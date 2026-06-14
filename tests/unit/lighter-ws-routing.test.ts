/**
 * Lighter WS routing + protocol-shape tests (WS-Routing Repair)
 *
 * Two coupled fixes:
 *  1. Routing — server echoes colon-form channel ("order_book:1"); the sub key is
 *     the colon form, the WIRE subscribe uses slash form ("order_book/1").
 *  2. Protocol — error frames ({error:{code,message}}) must surface, not hang.
 *
 * Frames are byte-faithful live captures.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import {
  lighterResolveKeys,
  lighterParseMessage,
} from '../../src/adapters/lighter/LighterWsRouting.js';
import type { WebSocketMessage } from '../../src/websocket/types.js';

const FIXTURES = join(__dirname, '../fixtures/lighter');
const load = (f: string): unknown => JSON.parse(readFileSync(join(FIXTURES, f), 'utf-8'));

const snapshot = load('ws_orderbook_snapshot.json');
const update = load('ws_orderbook_update.json');
const trade = load('ws_trade.json');
const errorFrame = load('ws_error_invalid_channel.json');
const connected = load('ws_connected.json');

describe('lighterParseMessage', () => {
  test('parses an order_book frame keeping the colon-form channel', () => {
    const m = lighterParseMessage(snapshot);
    expect(m.channel).toBe('order_book:1');
  });

  test('flags an {error:...} frame with type "error" and no channel', () => {
    const m = lighterParseMessage(errorFrame);
    expect(m.type).toBe('error');
    expect(m.channel).toBeUndefined();
    expect((m.data as { error: { code: number } }).error.code).toBe(30005);
  });

  test('parses the {type:"connected"} session frame with no channel', () => {
    const m = lighterParseMessage(connected);
    expect(m.channel).toBeUndefined();
    expect(m.type).toBe('connected');
  });
});

describe('lighterResolveKeys', () => {
  function msg(raw: unknown): WebSocketMessage {
    return lighterParseMessage(raw);
  }

  test('order_book snapshot frame resolves to its colon-form channel key', () => {
    expect(lighterResolveKeys(msg(snapshot))).toEqual(['order_book:1']);
  });

  test('order_book update frame resolves to the same colon-form key', () => {
    expect(lighterResolveKeys(msg(update))).toEqual(['order_book:1']);
  });

  test('trade frame resolves to its colon-form channel key', () => {
    expect(lighterResolveKeys(msg(trade))).toEqual(['trade:1']);
  });

  test('error frame resolves to undefined (surfaced via parse, not routed)', () => {
    expect(lighterResolveKeys(msg(errorFrame))).toBeUndefined();
  });

  test('connected session frame resolves to undefined', () => {
    expect(lighterResolveKeys(msg(connected))).toBeUndefined();
  });
});
