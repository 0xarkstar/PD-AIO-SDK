/**
 * GRVT HTTP client.
 *
 * Direct REST client for the REAL GRVT API (no `@grvt/client` SDK — that was
 * built against a guessed shape). GRVT splits its API across three hosts:
 *  - edge:        `POST /auth/api_key/login` -> `gravity` cookie + X-Grvt-Account-Id
 *  - trades:      authed orders / account (`full/v1/create_order`, ...)
 *  - market-data: public market data (`full/v1/{instruments,ticker,book,trade}`)
 *
 * All REST is POST with a JSON body; responses wrap the payload in `{ result }`.
 * Authed requests carry `Cookie: gravity=<cookie>` + `X-Grvt-Account-Id: <id>`.
 * This client owns the session (login, refresh-on-expiry) and delegates order
 * signing to the adapter (which uses `signing.ts`); it does no signing itself.
 */

import { GRVT_API_URLS, GRVT_ENDPOINTS, GRVT_SESSION_DURATION } from './constants.js';
import type {
  GRVTSession,
  GRVTLoginResult,
  GRVTCreateOrderBody,
  GRVTCancelOrderBody,
} from './types.js';

/**
 * Resolved GRVT host set for one environment.
 */
interface GRVTHosts {
  edge: string;
  trades: string;
  marketData: string;
}

/**
 * GRVT HTTP client configuration.
 */
export interface GRVTSDKWrapperConfig {
  /** Use testnet hosts (chainId 326). */
  testnet?: boolean;
  /** API key (created in the GRVT UI; required for authed calls). */
  apiKey?: string;
  /** Per-request timeout (ms). */
  timeout?: number;
}

/**
 * Minimal fetch-like response shape (Node 18+/browser global `fetch`).
 */
type FetchResponse = {
  ok: boolean;
  status: number;
  statusText: string;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
};

const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Direct GRVT REST client + session manager.
 */
export class GRVTSDKWrapper {
  private readonly hosts: GRVTHosts;
  private readonly apiKey?: string;
  private readonly timeout: number;
  private session?: GRVTSession;

  constructor(config: GRVTSDKWrapperConfig = {}) {
    const urls = config.testnet ? GRVT_API_URLS.testnet : GRVT_API_URLS.mainnet;
    this.hosts = {
      edge: urls.edge,
      trades: urls.trades,
      marketData: urls.marketData,
    };
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
  }

  // ==================== Session ====================

  /**
   * Log in with the API key, capturing the `gravity` session cookie, the
   * `X-Grvt-Account-Id` header, and the body `{ sub_account_id,
   * funding_account_address }`. Returns the resolved session.
   *
   * @throws {Error} if no API key is configured or the login fails.
   */
  async login(): Promise<GRVTSession> {
    if (!this.apiKey) {
      throw new Error('GRVT login requires an apiKey');
    }

    const response = await this.rawPost(
      `${this.hosts.edge}${GRVT_ENDPOINTS.login}`,
      { api_key: this.apiKey },
      {}
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GRVT login failed (${response.status} ${response.statusText}): ${body}`);
    }

    const cookie = this.parseGravityCookie(response.headers.get('set-cookie'));
    if (!cookie) {
      throw new Error('GRVT login response did not include a gravity session cookie');
    }

    const accountId = response.headers.get('x-grvt-account-id') ?? '';
    const bodyText = await response.text();
    const parsed = bodyText ? (JSON.parse(bodyText) as { result?: GRVTLoginResult } | GRVTLoginResult) : {};
    const result: GRVTLoginResult =
      parsed && typeof parsed === 'object' && 'result' in parsed && parsed.result
        ? parsed.result
        : (parsed as GRVTLoginResult);

    const session: GRVTSession = {
      cookie,
      accountId,
      subAccountId: result.sub_account_id,
      fundingAccountAddress: result.funding_account_address,
      expiresAt: Date.now() + GRVT_SESSION_DURATION,
    };
    this.session = session;
    return session;
  }

  /**
   * The current session, if logged in.
   */
  getSession(): GRVTSession | undefined {
    return this.session;
  }

  /**
   * The trading sub-account id from the current session (if any).
   */
  getSubAccountId(): string | undefined {
    return this.session?.subAccountId;
  }

  /**
   * Manually set the session (e.g. restored from elsewhere).
   */
  setSession(session: GRVTSession): void {
    this.session = session;
  }

  /**
   * Clear the current session.
   */
  clearSession(): void {
    this.session = undefined;
  }

  /**
   * Whether a session is present.
   */
  hasSession(): boolean {
    return this.session !== undefined;
  }

  /**
   * Whether the client is configured with an API key (can authenticate).
   */
  hasCredentials(): boolean {
    return !!this.apiKey;
  }

  // ==================== Market Data (public, market-data host) ====================

  /**
   * Fetch active perpetual instruments (`full/v1/instruments`).
   */
  async getInstruments(): Promise<unknown> {
    return this.postUnwrapped(this.hosts.marketData, GRVT_ENDPOINTS.instruments, {
      kind: ['PERPETUAL'],
      is_active: true,
    });
  }

  /**
   * Fetch a full ticker for one instrument (`full/v1/ticker`).
   */
  async getTicker(instrument: string): Promise<unknown> {
    return this.postUnwrapped(this.hosts.marketData, GRVT_ENDPOINTS.ticker, { instrument });
  }

  /**
   * Fetch a FULL order-book snapshot (`full/v1/book`). Depth ∈ {10,50,100,500}.
   */
  async getOrderBook(instrument: string, depth: number): Promise<unknown> {
    return this.postUnwrapped(this.hosts.marketData, GRVT_ENDPOINTS.book, { instrument, depth });
  }

  /**
   * Fetch recent public trades (`full/v1/trade`).
   */
  async getTrades(instrument: string, limit: number): Promise<unknown> {
    return this.postUnwrapped(this.hosts.marketData, GRVT_ENDPOINTS.trade, { instrument, limit });
  }

  /**
   * Fetch funding-rate entries (`full/v1/funding`).
   */
  async getFunding(instrument: string): Promise<unknown> {
    return this.postUnwrapped(this.hosts.marketData, GRVT_ENDPOINTS.funding, { instrument });
  }

  /**
   * Fetch candlesticks (`full/v1/kline`).
   */
  async getKline(body: Record<string, unknown>): Promise<unknown> {
    return this.postUnwrapped(this.hosts.marketData, GRVT_ENDPOINTS.kline, body);
  }

  // ==================== Trading (authed, trades host) ====================

  /**
   * Submit a signed order (`full/v1/create_order`). The caller builds + signs
   * the body via `signing.ts`; this method just POSTs it under `{ order }`.
   */
  async createOrder(order: GRVTCreateOrderBody): Promise<unknown> {
    return this.postAuthed(this.hosts.trades, GRVT_ENDPOINTS.createOrder, { order });
  }

  /**
   * Cancel a single order by `order_id` or `client_order_id`.
   */
  async cancelOrder(body: GRVTCancelOrderBody): Promise<unknown> {
    return this.postAuthed(this.hosts.trades, GRVT_ENDPOINTS.cancelOrder, {
      ...body,
    });
  }

  /**
   * Cancel all open orders for the sub-account.
   */
  async cancelAllOrders(subAccountId: string): Promise<unknown> {
    return this.postAuthed(this.hosts.trades, GRVT_ENDPOINTS.cancelAllOrders, {
      sub_account_id: subAccountId,
    });
  }

  /**
   * Fetch open orders for the sub-account.
   */
  async getOpenOrders(subAccountId: string, instrument?: string): Promise<unknown> {
    const body: Record<string, unknown> = { sub_account_id: subAccountId };
    if (instrument) body.instrument = instrument;
    return this.postAuthed(this.hosts.trades, GRVT_ENDPOINTS.openOrders, body);
  }

  /**
   * Fetch historical orders for the sub-account.
   */
  async getOrderHistory(subAccountId: string, instrument?: string, limit?: number): Promise<unknown> {
    const body: Record<string, unknown> = { sub_account_id: subAccountId };
    if (instrument) body.instrument = instrument;
    if (limit !== undefined) body.limit = limit;
    return this.postAuthed(this.hosts.trades, GRVT_ENDPOINTS.orderHistory, body);
  }

  /**
   * Fetch user fills (`full/v1/fill_history`).
   */
  async getFillHistory(subAccountId: string, instrument?: string, limit?: number): Promise<unknown> {
    const body: Record<string, unknown> = { sub_account_id: subAccountId };
    if (instrument) body.instrument = instrument;
    if (limit !== undefined) body.limit = limit;
    return this.postAuthed(this.hosts.trades, GRVT_ENDPOINTS.fillHistory, body);
  }

  /**
   * Fetch open positions for the sub-account.
   */
  async getPositions(subAccountId: string): Promise<unknown> {
    return this.postAuthed(this.hosts.trades, GRVT_ENDPOINTS.positions, {
      sub_account_id: subAccountId,
    });
  }

  /**
   * Fetch the sub-account summary (balances).
   */
  async getSubAccountSummary(subAccountId: string): Promise<unknown> {
    return this.postAuthed(this.hosts.trades, GRVT_ENDPOINTS.accountSummary, {
      sub_account_id: subAccountId,
    });
  }

  // ==================== Internals ====================

  /**
   * POST a public request and unwrap the `{ result }` envelope.
   */
  private async postUnwrapped(
    host: string,
    path: string,
    body: Record<string, unknown>
  ): Promise<unknown> {
    const response = await this.rawPost(`${host}/${path}`, body, {});
    return this.handleJson(response);
  }

  /**
   * POST an authenticated request (cookie + account id), refreshing the session
   * first if it is missing or near expiry. Unwraps the `{ result }` envelope.
   */
  private async postAuthed(
    host: string,
    path: string,
    body: Record<string, unknown>
  ): Promise<unknown> {
    await this.ensureSession();
    const session = this.session;
    if (!session) {
      throw new Error('GRVT authenticated request requires a session (login failed)');
    }
    const headers: Record<string, string> = {
      Cookie: `gravity=${session.cookie}`,
      'X-Grvt-Account-Id': session.accountId,
    };
    const response = await this.rawPost(`${host}/${path}`, body, headers);
    return this.handleJson(response);
  }

  /**
   * Ensure a live session exists, logging in (or refreshing) when needed.
   */
  private async ensureSession(): Promise<void> {
    const now = Date.now();
    const stale =
      !this.session || this.session.expiresAt - now < 5000; // GRVT_SESSION_REFRESH_BUFFER_MS
    if (stale) {
      await this.login();
    }
  }

  /**
   * Raw POST helper using the global `fetch` (Node 18+/browser), with a timeout.
   */
  private async rawPost(
    url: string,
    body: Record<string, unknown>,
    extraHeaders: Record<string, string>
  ): Promise<FetchResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = (await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...extraHeaders,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })) as unknown as FetchResponse;
      return response;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Read a response body, throw on non-2xx, and unwrap the `{ result }` envelope.
   */
  private async handleJson(response: FetchResponse): Promise<unknown> {
    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : undefined;
    } catch {
      parsed = undefined;
    }

    if (!response.ok) {
      const error = new Error(
        `GRVT request failed (${response.status} ${response.statusText})`
      ) as Error & { status: number; response: { status: number; data: unknown } };
      error.status = response.status;
      error.response = { status: response.status, data: parsed };
      throw error;
    }

    if (parsed && typeof parsed === 'object' && 'result' in parsed) {
      return (parsed as { result: unknown }).result;
    }
    return parsed;
  }

  /**
   * Extract the `gravity` cookie value from a Set-Cookie header (single value;
   * `fetch` collapses multiple Set-Cookie headers into one comma-joined string).
   */
  private parseGravityCookie(setCookie: string | null): string | undefined {
    if (!setCookie) {
      return undefined;
    }
    const match = setCookie.match(/gravity=([^;,\s]+)/i);
    return match ? match[1] : undefined;
  }
}
