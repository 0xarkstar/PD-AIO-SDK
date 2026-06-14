/**
 * dYdX WS honest-false tests (WS-Routing Repair, decision §4)
 *
 * The dydx adapter has no WS wrapper — all six watch* methods are pure stubs.
 * Decision: HONEST_FALSE.
 *  - has.watch* flags for the stubbed streams are false (truthful matrix)
 *  - the stub error messages contain 'not implemented' so downstream
 *    isNotImplementedError matches → clean REST fallback (no reconnect loop)
 */

import { DydxAdapter } from '../../src/adapters/dydx/DydxAdapter.js';

describe('DydxAdapter — honest-false WS flags', () => {
  const adapter = new DydxAdapter();

  test('watchOrderBook is advertised false', () => {
    expect(adapter.has.watchOrderBook).toBe(false);
  });

  test('watchTrades is advertised false', () => {
    expect(adapter.has.watchTrades).toBe(false);
  });

  test('watchTicker / watchPositions / watchOrders / watchBalance / watchOHLCV are false', () => {
    expect(adapter.has.watchTicker).toBe(false);
    expect(adapter.has.watchPositions).toBe(false);
    expect(adapter.has.watchOrders).toBe(false);
    expect(adapter.has.watchBalance).toBe(false);
    expect(adapter.has.watchOHLCV).toBe(false);
  });
});

describe('DydxAdapter — WS stub messages match isNotImplementedError', () => {
  // Force-ready so ensureInitialized() does not pre-empt the not-implemented throw.
  function makeReadyAdapter(): DydxAdapter {
    const adapter = new DydxAdapter();
    (adapter as unknown as { _isReady: boolean })._isReady = true;
    return adapter;
  }

  async function expectNotImplemented(gen: AsyncGenerator<unknown>): Promise<void> {
    await expect(gen.next()).rejects.toThrow(/not implemented/i);
  }

  test('watchOrderBook throws with "not implemented" message', async () => {
    await expectNotImplemented(makeReadyAdapter().watchOrderBook('BTC/USD:USD'));
  });

  test('watchTrades throws with "not implemented" message', async () => {
    await expectNotImplemented(makeReadyAdapter().watchTrades('BTC/USD:USD'));
  });

  test('watchTicker throws with "not implemented" message', async () => {
    await expectNotImplemented(makeReadyAdapter().watchTicker('BTC/USD:USD'));
  });

  test('watchPositions throws with "not implemented" message', async () => {
    await expectNotImplemented(makeReadyAdapter().watchPositions());
  });

  test('watchOrders throws with "not implemented" message', async () => {
    await expectNotImplemented(makeReadyAdapter().watchOrders());
  });

  test('watchBalance throws with "not implemented" message', async () => {
    await expectNotImplemented(makeReadyAdapter().watchBalance());
  });
});
