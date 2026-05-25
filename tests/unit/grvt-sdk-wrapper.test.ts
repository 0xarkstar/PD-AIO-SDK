/**
 * Unit tests for GRVTSDKWrapper (direct REST client + cookie session).
 *
 * Mocks the global `fetch` — no live network. Verifies the cookie-session login
 * (gravity cookie + X-Grvt-Account-Id + sub_account_id), authed request headers,
 * the `full/v1/*` POST paths, the `{ result }` unwrapping, and error mapping.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { GRVTSDKWrapper } from '../../src/adapters/grvt/GRVTSDKWrapper.js';

type MockResponse = {
  ok: boolean;
  status: number;
  statusText: string;
  headers: { get(name: string): string | null };
  text: () => Promise<string>;
};

function jsonResponse(
  body: unknown,
  { ok = true, status = 200, headers = {} }: { ok?: boolean; status?: number; headers?: Record<string, string> } = {}
): MockResponse {
  const lower: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) lower[k.toLowerCase()] = v;
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    headers: { get: (name: string) => lower[name.toLowerCase()] ?? null },
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  };
}

describe('GRVTSDKWrapper', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    (globalThis as unknown as { fetch: unknown }).fetch = fetchMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login (cookie session)', () => {
    it('captures gravity cookie + X-Grvt-Account-Id + sub_account_id', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(
          { result: { sub_account_id: '987654321', funding_account_address: '0xfund' } },
          {
            headers: {
              'set-cookie': 'gravity=abc123; Path=/; HttpOnly; Secure',
              'x-grvt-account-id': 'acct-777',
            },
          }
        )
      );

      const wrapper = new GRVTSDKWrapper({ testnet: true, apiKey: 'KEY' });
      const session = await wrapper.login();

      // hits the edge host login endpoint with the api_key body
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://edge.testnet.grvt.io/auth/api_key/login');
      expect(JSON.parse(init.body as string)).toEqual({ api_key: 'KEY' });

      expect(session.cookie).toBe('abc123');
      expect(session.accountId).toBe('acct-777');
      expect(session.subAccountId).toBe('987654321');
      expect(session.fundingAccountAddress).toBe('0xfund');
      expect(wrapper.getSubAccountId()).toBe('987654321');
      expect(wrapper.hasSession()).toBe(true);
    });

    it('throws without an apiKey', async () => {
      const wrapper = new GRVTSDKWrapper({ testnet: true });
      await expect(wrapper.login()).rejects.toThrow('GRVT login requires an apiKey');
    });

    it('throws when the login response lacks a gravity cookie', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ result: {} }, { headers: {} }));
      const wrapper = new GRVTSDKWrapper({ apiKey: 'KEY' });
      await expect(wrapper.login()).rejects.toThrow(/gravity session cookie/);
    });

    it('throws on a non-2xx login', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'bad' }, { ok: false, status: 401 }));
      const wrapper = new GRVTSDKWrapper({ apiKey: 'KEY' });
      await expect(wrapper.login()).rejects.toThrow(/GRVT login failed/);
    });
  });

  describe('public market data', () => {
    it('POSTs full/v1/instruments to the market-data host and unwraps result', async () => {
      const instruments = [{ instrument: 'BTC_USDT_Perp', instrument_hash: '0x030501' }];
      fetchMock.mockResolvedValueOnce(jsonResponse({ result: instruments }));

      const wrapper = new GRVTSDKWrapper({});
      const result = await wrapper.getInstruments();

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://market-data.grvt.io/full/v1/instruments');
      expect(JSON.parse(init.body as string)).toEqual({ kind: ['PERPETUAL'], is_active: true });
      expect(result).toEqual(instruments);
    });

    it('POSTs full/v1/book with instrument + depth', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ result: { bids: [], asks: [] } }));
      const wrapper = new GRVTSDKWrapper({});
      await wrapper.getOrderBook('BTC_USDT_Perp', 50);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://market-data.grvt.io/full/v1/book');
      expect(JSON.parse(init.body as string)).toEqual({ instrument: 'BTC_USDT_Perp', depth: 50 });
    });

    it('POSTs full/v1/ticker and full/v1/trade', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ result: {} }));
      const wrapper = new GRVTSDKWrapper({});
      await wrapper.getTicker('BTC_USDT_Perp');
      await wrapper.getTrades('BTC_USDT_Perp', 25);
      expect((fetchMock.mock.calls[0] as [string])[0]).toBe('https://market-data.grvt.io/full/v1/ticker');
      expect((fetchMock.mock.calls[1] as [string])[0]).toBe('https://market-data.grvt.io/full/v1/trade');
    });

    it('throws a status-bearing error on non-2xx', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ error: { code: 'INVALID_ORDER' } }, { ok: false, status: 400 })
      );
      const wrapper = new GRVTSDKWrapper({});
      await expect(wrapper.getInstruments()).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('authed requests', () => {
    it('attaches gravity cookie + X-Grvt-Account-Id and targets the trades host', async () => {
      // First call: login. Second call: createOrder.
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse(
            { result: { sub_account_id: '111' } },
            { headers: { 'set-cookie': 'gravity=sess; Path=/', 'x-grvt-account-id': 'acct-1' } }
          )
        )
        .mockResolvedValueOnce(jsonResponse({ result: { order_id: 'o-1' } }));

      const wrapper = new GRVTSDKWrapper({ testnet: true, apiKey: 'KEY' });
      await wrapper.login();
      const order = (await wrapper.createOrder({
        sub_account_id: '111',
        is_market: false,
        time_in_force: 'GOOD_TILL_TIME',
        post_only: true,
        reduce_only: false,
        legs: [{ instrument: 'BTC_USDT_Perp', size: '0.001', limit_price: '50000', is_buying_asset: true }],
        signature: { r: '0xr', s: '0xs', v: 27, expiration: '1', nonce: 1, signer: '0xsig' },
        metadata: { client_order_id: '999' },
      })) as { order_id: string };

      const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
      expect(url).toBe('https://trades.testnet.grvt.io/full/v1/create_order');
      const headers = init.headers as Record<string, string>;
      expect(headers['Cookie']).toBe('gravity=sess');
      expect(headers['X-Grvt-Account-Id']).toBe('acct-1');
      // wire body wraps the order under `{ order }`
      expect(JSON.parse(init.body as string)).toHaveProperty('order.sub_account_id', '111');
      expect(order.order_id).toBe('o-1');
    });

    it('auto-logs-in before an authed call when no session exists', async () => {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse(
            { result: { sub_account_id: '222' } },
            { headers: { 'set-cookie': 'gravity=auto; Path=/', 'x-grvt-account-id': 'acct-2' } }
          )
        )
        .mockResolvedValueOnce(jsonResponse({ result: [] }));

      const wrapper = new GRVTSDKWrapper({ apiKey: 'KEY' });
      await wrapper.getPositions('222');

      // first call is the login (edge host)
      expect((fetchMock.mock.calls[0] as [string])[0]).toBe('https://edge.grvt.io/auth/api_key/login');
      // second call is the positions request (trades host)
      expect((fetchMock.mock.calls[1] as [string])[0]).toBe('https://trades.grvt.io/full/v1/positions');
    });

    it('cancelAllOrders posts the sub_account_id', async () => {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse({ result: {} }, { headers: { 'set-cookie': 'gravity=s; Path=/', 'x-grvt-account-id': 'a' } })
        )
        .mockResolvedValueOnce(jsonResponse({ result: { num_cancelled: 3 } }));
      const wrapper = new GRVTSDKWrapper({ apiKey: 'KEY' });
      await wrapper.login();
      await wrapper.cancelAllOrders('555');
      const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
      expect(url).toBe('https://trades.grvt.io/full/v1/cancel_all_orders');
      expect(JSON.parse(init.body as string)).toEqual({ sub_account_id: '555' });
    });
  });

  describe('session helpers', () => {
    it('set/clear/has session', () => {
      const wrapper = new GRVTSDKWrapper({ apiKey: 'KEY' });
      expect(wrapper.hasSession()).toBe(false);
      wrapper.setSession({ cookie: 'c', accountId: 'a', subAccountId: 's', expiresAt: Date.now() + 60000 });
      expect(wrapper.hasSession()).toBe(true);
      expect(wrapper.getSubAccountId()).toBe('s');
      wrapper.clearSession();
      expect(wrapper.hasSession()).toBe(false);
    });

    it('reports credentials based on apiKey presence', () => {
      expect(new GRVTSDKWrapper({ apiKey: 'KEY' }).hasCredentials()).toBe(true);
      expect(new GRVTSDKWrapper({}).hasCredentials()).toBe(false);
    });
  });
});
