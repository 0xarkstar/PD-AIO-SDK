/**
 * Avantis Exchange Adapter
 *
 * Implements IExchangeAdapter for Avantis, an on-chain perpetual DEX
 * on Base chain using Pyth oracle price feeds. All interactions happen
 * via smart contract calls using ethers.js.
 */

import { ethers } from 'ethers';
import type {
  Balance,
  FundingRate,
  Market,
  MarketParams,
  OHLCV,
  OHLCVParams,
  OHLCVTimeframe,
  Order,
  OrderBook,
  OrderBookParams,
  OrderRequest,
  Position,
  Ticker,
  Trade,
  TradeParams,
} from '../../types/common.js';
import type { FeatureMap, IExchangeAdapter } from '../../types/adapter.js';
import { PerpDEXError, NotSupportedError } from '../../types/errors.js';
import { BaseAdapter } from '../base/BaseAdapter.js';
import { RateLimiter } from '../../core/RateLimiter.js';
import {
  AVANTIS_RPC_MAINNET,
  AVANTIS_RPC_TESTNET,
  AVANTIS_CONTRACTS_MAINNET,
  AVANTIS_CONTRACTS_TESTNET,
  AVANTIS_RATE_LIMIT,
  AVANTIS_ORDER_TYPES,
  AVANTIS_TRADING_ABI,
  AVANTIS_STORAGE_ABI,
  AVANTIS_PAIR_INFO_ABI,
  AVANTIS_PYTH_ABI,
  AVANTIS_ERC20_ABI,
  AVANTIS_INDEX_TO_SYMBOL,
  PYTH_PRICE_FEED_IDS,
  avantisToUnified,
  unifiedToAvantis,
} from './constants.js';
import { AvantisAuth } from './AvantisAuth.js';
import { AvantisNormalizer } from './AvantisNormalizer.js';
import { buildOrderParams, getPairIndex, convertPythPrice } from './utils.js';
import { mapError } from './error-codes.js';
import type {
  AvantisConfig,
  AvantisPairInfo,
  AvantisOpenTrade,
  AvantisPythPrice,
  AvantisFundingFees,
} from './types.js';

export { AvantisConfig };

interface AvantisContracts {
  trading: string;
  storage: string;
  pairInfo: string;
  pythOracle: string;
  callbacks: string;
  usdc: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ContractCall = (...args: any[]) => Promise<any>;

/**
 * Safely call a contract method that may be typed as possibly undefined by ethers.
 */
function getContractFn(contract: ethers.Contract, method: string): ContractCall {
  const fn = contract.getFunction(method);
  return fn as ContractCall;
}

export class AvantisAdapter extends BaseAdapter implements IExchangeAdapter {
  readonly id = 'avantis';
  readonly name = 'Avantis';

  readonly has: Partial<FeatureMap> = {
    // Market Data
    fetchMarkets: true,
    fetchTicker: true,
    fetchOrderBook: false,
    fetchTrades: false,
    fetchOHLCV: false,
    fetchFundingRate: true,
    fetchFundingRateHistory: false,

    // Trading
    createOrder: true,
    cancelOrder: true,
    cancelAllOrders: false,
    editOrder: false,

    // Account
    fetchOpenOrders: false,
    fetchOrderHistory: false,
    fetchMyTrades: false,
    fetchDeposits: false,
    fetchWithdrawals: false,

    // Positions & Balance
    fetchPositions: true,
    fetchBalance: true,
    setLeverage: false,
    setMarginMode: false,

    // WebSocket (not available - on-chain)
    watchOrderBook: false,
    watchTrades: false,
    watchTicker: false,
    watchOrders: false,
    watchPositions: false,
    watchBalance: false,
  };

  private readonly auth?: AvantisAuth;
  private readonly provider: ethers.JsonRpcProvider;
  private readonly normalizer: AvantisNormalizer;
  protected rateLimiter: RateLimiter;

  private tradingContract?: ethers.Contract;
  private storageContract?: ethers.Contract;
  private pairInfoContract?: ethers.Contract;
  private pythContract?: ethers.Contract;
  private usdcContract?: ethers.Contract;

  private readonly contracts: AvantisContracts;

  constructor(config: AvantisConfig = {}) {
    super(config);

    const rpcUrl = config.rpcUrl ?? (config.testnet ? AVANTIS_RPC_TESTNET : AVANTIS_RPC_MAINNET);
    this.contracts = config.testnet ? AVANTIS_CONTRACTS_TESTNET : AVANTIS_CONTRACTS_MAINNET;

    if (config.privateKey) {
      this.auth = new AvantisAuth(config.privateKey, rpcUrl);
      this.provider = this.auth.getProvider();
    } else {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
    }

    this.normalizer = new AvantisNormalizer();

    this.rateLimiter = new RateLimiter({
      maxTokens: config.rateLimit?.maxRequests ?? AVANTIS_RATE_LIMIT.maxRequests,
      windowMs: config.rateLimit?.windowMs ?? AVANTIS_RATE_LIMIT.windowMs,
      weights: AVANTIS_RATE_LIMIT.weights,
    });
  }

  async initialize(): Promise<void> {
    if (this._isReady) {
      return;
    }

    const signerOrProvider = this.auth ? this.auth.getWallet() : this.provider;

    this.tradingContract = new ethers.Contract(
      this.contracts.trading,
      AVANTIS_TRADING_ABI,
      signerOrProvider
    );
    this.storageContract = new ethers.Contract(
      this.contracts.storage,
      AVANTIS_STORAGE_ABI,
      signerOrProvider
    );
    this.pairInfoContract = new ethers.Contract(
      this.contracts.pairInfo,
      AVANTIS_PAIR_INFO_ABI,
      signerOrProvider
    );
    this.pythContract = new ethers.Contract(
      this.contracts.pythOracle,
      AVANTIS_PYTH_ABI,
      signerOrProvider
    );
    this.usdcContract = new ethers.Contract(
      this.contracts.usdc,
      AVANTIS_ERC20_ABI,
      signerOrProvider
    );

    this._isReady = true;
    this.debug('Adapter initialized');
  }

  // === Symbol conversion ===

  protected symbolToExchange(symbol: string): string {
    return unifiedToAvantis(symbol).toString();
  }

  protected symbolFromExchange(exchangeSymbol: string): string {
    return avantisToUnified(parseInt(exchangeSymbol, 10));
  }

  // === Auth helpers ===

  private requireAuth(): AvantisAuth {
    if (!this.auth) {
      throw new PerpDEXError(
        'Private key required for authenticated operations',
        'MISSING_CREDENTIALS',
        'avantis'
      );
    }
    return this.auth;
  }

  private requireContract(contract: ethers.Contract | undefined, name: string): ethers.Contract {
    if (!contract) {
      throw new PerpDEXError(
        `${name} contract not initialized. Call initialize() first`,
        'NOT_INITIALIZED',
        'avantis'
      );
    }
    return contract;
  }

  // === Public Market Data ===

  async fetchMarkets(_params?: MarketParams): Promise<Market[]> {
    await this.rateLimiter.acquire('fetchMarkets');

    try {
      const pairInfoContract = this.requireContract(this.pairInfoContract, 'PairInfo');
      const pairsCountFn = getContractFn(pairInfoContract, 'pairsCount');
      const pairsFn = getContractFn(pairInfoContract, 'pairs');

      const pairsCount = await pairsCountFn();
      const count = Number(pairsCount);

      const markets: Market[] = [];
      for (let i = 0; i < count; i++) {
        try {
          const pairData = await pairsFn(i);
          const pair: AvantisPairInfo = {
            pairIndex: i,
            from: pairData.from ?? pairData[0] ?? AVANTIS_INDEX_TO_SYMBOL[i] ?? `PAIR${i}`,
            to: pairData.to ?? pairData[1] ?? 'USD',
            spreadP: (pairData.spreadP ?? pairData[2] ?? '0').toString(),
            groupIndex: Number(pairData.groupIndex ?? pairData[3] ?? 0),
            feeIndex: Number(pairData.feeIndex ?? pairData[4] ?? 0),
          };
          markets.push(this.normalizer.normalizeMarket(pair));
        } catch {
          this.debug(`Failed to fetch pair at index ${i}`);
        }
      }

      return markets;
    } catch (error: unknown) {
      throw mapError(error);
    }
  }

  async _fetchTicker(symbol: string): Promise<Ticker> {
    await this.rateLimiter.acquire('fetchTicker');

    try {
      const pairIndex = getPairIndex(symbol);
      const base = symbol.split('/')[0] ?? '';
      const feedId = PYTH_PRICE_FEED_IDS[base];

      if (!feedId) {
        throw new PerpDEXError(`No Pyth price feed for ${base}`, 'UNSUPPORTED_SYMBOL', 'avantis');
      }

      const pythContract = this.requireContract(this.pythContract, 'Pyth');
      const getPriceFn = getContractFn(pythContract, 'getPrice');
      const priceData = await getPriceFn(feedId);

      const pythPrice: AvantisPythPrice = {
        price: priceData.price.toString(),
        conf: priceData.conf.toString(),
        expo: Number(priceData.expo),
        publishTime: Number(priceData.publishTime),
      };

      return this.normalizer.normalizeTicker(pairIndex, pythPrice);
    } catch (error: unknown) {
      throw mapError(error);
    }
  }

  async _fetchOrderBook(_symbol: string, _params?: OrderBookParams): Promise<OrderBook> {
    throw new NotSupportedError(
      'Avantis is an oracle-based DEX with no order book',
      'NOT_SUPPORTED',
      'avantis'
    );
  }

  async _fetchTrades(_symbol: string, _params?: TradeParams): Promise<Trade[]> {
    throw new NotSupportedError(
      'Avantis does not expose public trade history via contracts',
      'NOT_SUPPORTED',
      'avantis'
    );
  }

  async _fetchFundingRate(symbol: string): Promise<FundingRate> {
    await this.rateLimiter.acquire('fetchFundingRate');

    try {
      const pairIndex = getPairIndex(symbol);
      const pairInfoContract = this.requireContract(this.pairInfoContract, 'PairInfo');
      const fundingFeesFn = getContractFn(pairInfoContract, 'pairFundingFees');

      const fundingData = await fundingFeesFn(pairIndex);
      const funding: AvantisFundingFees = {
        accPerOiLong: fundingData.accPerOiLong.toString(),
        accPerOiShort: fundingData.accPerOiShort.toString(),
        lastUpdateBlock: Number(fundingData.lastUpdateBlock),
      };

      // Get mark price from Pyth
      const base = symbol.split('/')[0] ?? '';
      const feedId = PYTH_PRICE_FEED_IDS[base];
      let markPrice = 0;

      if (feedId) {
        const pythContract = this.requireContract(this.pythContract, 'Pyth');
        const getPriceFn = getContractFn(pythContract, 'getPrice');
        const priceData = await getPriceFn(feedId);
        markPrice = convertPythPrice(priceData.price.toString(), Number(priceData.expo));
      }

      return this.normalizer.normalizeFundingRate(pairIndex, funding, markPrice);
    } catch (error: unknown) {
      throw mapError(error);
    }
  }

  async fetchFundingRateHistory(
    _symbol: string,
    _since?: number,
    _limit?: number
  ): Promise<FundingRate[]> {
    throw new NotSupportedError(
      'Avantis funding rate history is not available via on-chain queries',
      'NOT_SUPPORTED',
      'avantis'
    );
  }

  async fetchOHLCV(
    _symbol: string,
    _timeframe: OHLCVTimeframe,
    _params?: OHLCVParams
  ): Promise<OHLCV[]> {
    throw new NotSupportedError(
      'Avantis does not provide OHLCV data on-chain',
      'NOT_SUPPORTED',
      'avantis'
    );
  }

  // === Private Trading ===

  async createOrder(request: OrderRequest): Promise<Order> {
    const auth = this.requireAuth();
    await this.rateLimiter.acquire('createOrder');

    try {
      const tradingContract = this.requireContract(this.tradingContract, 'Trading');
      const openTradeFn = getContractFn(tradingContract, 'openTrade');
      const orderParams = buildOrderParams(request, auth.getAddress());

      const orderType =
        request.type === 'market' ? AVANTIS_ORDER_TYPES.MARKET : AVANTIS_ORDER_TYPES.LIMIT;

      // Default 1% slippage for market orders
      const slippageP = BigInt(Math.round(0.01 * 1e10));

      // Empty price update data (would need actual Pyth update in production)
      const priceUpdateData: string[] = [];

      const tx = await openTradeFn(
        [
          orderParams.trader,
          orderParams.pairIndex,
          orderParams.index,
          orderParams.initialPosToken,
          orderParams.positionSizeDai,
          orderParams.openPrice,
          orderParams.buy,
          orderParams.leverage,
          orderParams.tp,
          orderParams.sl,
        ],
        orderType,
        slippageP,
        priceUpdateData
      );

      const receipt = await tx.wait();

      return {
        id: receipt?.hash ?? tx.hash,
        symbol: request.symbol,
        type: request.type,
        side: request.side,
        amount: request.amount,
        price: request.price,
        status: receipt?.status === 1 ? 'open' : 'rejected',
        filled: 0,
        remaining: request.amount,
        reduceOnly: request.reduceOnly ?? false,
        postOnly: false,
        clientOrderId: request.clientOrderId,
        timestamp: Date.now(),
        info: {
          txHash: tx.hash,
          blockNumber: receipt?.blockNumber,
        },
      };
    } catch (error: unknown) {
      throw mapError(error);
    }
  }

  async cancelOrder(orderId: string, symbol?: string): Promise<Order> {
    this.requireAuth();
    await this.rateLimiter.acquire('cancelOrder');

    try {
      const tradingContract = this.requireContract(this.tradingContract, 'Trading');
      const cancelFn = getContractFn(tradingContract, 'cancelOpenLimitOrder');

      // orderId format: "pairIndex-tradeIndex"
      const parts = orderId.split('-');
      const pairIndex = parseInt(parts[0] ?? '0', 10);
      const tradeIndex = parseInt(parts[1] ?? '0', 10);

      const tx = await cancelFn(pairIndex, tradeIndex);
      const receipt = await tx.wait();

      return {
        id: orderId,
        symbol: symbol ?? avantisToUnified(pairIndex),
        type: 'limit',
        side: 'buy',
        amount: 0,
        status: receipt?.status === 1 ? 'canceled' : 'rejected',
        filled: 0,
        remaining: 0,
        reduceOnly: false,
        postOnly: false,
        timestamp: Date.now(),
        info: {
          txHash: tx.hash,
          blockNumber: receipt?.blockNumber,
        },
      };
    } catch (error: unknown) {
      throw mapError(error);
    }
  }

  async cancelAllOrders(_symbol?: string): Promise<Order[]> {
    throw new NotSupportedError(
      'Avantis does not support batch cancellation via a single contract call',
      'NOT_SUPPORTED',
      'avantis'
    );
  }

  // === Account History ===

  async fetchOpenOrders(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]> {
    throw new NotSupportedError(
      'Avantis open limit orders require iterating on-chain storage; use fetchPositions instead',
      'NOT_SUPPORTED',
      'avantis'
    );
  }

  async fetchOrderHistory(_symbol?: string, _since?: number, _limit?: number): Promise<Order[]> {
    throw new NotSupportedError(
      'Avantis order history is not available via on-chain queries',
      'NOT_SUPPORTED',
      'avantis'
    );
  }

  async fetchMyTrades(_symbol?: string, _since?: number, _limit?: number): Promise<Trade[]> {
    throw new NotSupportedError(
      'Avantis trade history requires event log indexing',
      'NOT_SUPPORTED',
      'avantis'
    );
  }

  // === Positions & Balance ===

  async fetchPositions(symbols?: string[]): Promise<Position[]> {
    const auth = this.requireAuth();
    await this.rateLimiter.acquire('fetchPositions');

    try {
      const storageContract = this.requireContract(this.storageContract, 'Storage');
      const openTradesCountFn = getContractFn(storageContract, 'openTradesCount');
      const openTradesFn = getContractFn(storageContract, 'openTrades');
      const address = auth.getAddress();
      const positions: Position[] = [];

      // Determine which pair indices to check
      const pairIndices = symbols
        ? symbols.map((s) => getPairIndex(s))
        : Object.keys(AVANTIS_INDEX_TO_SYMBOL).map(Number);

      for (const pairIndex of pairIndices) {
        try {
          const count = await openTradesCountFn(address, pairIndex);
          const tradeCount = Number(count);

          for (let i = 0; i < tradeCount; i++) {
            try {
              const tradeData = await openTradesFn(address, pairIndex, i);

              // Skip empty trades
              const posSize = tradeData.positionSizeDai ?? tradeData[4];
              if (!posSize || BigInt(posSize) === BigInt(0)) continue;

              const trade: AvantisOpenTrade = {
                trader: (tradeData.trader ?? tradeData[0] ?? '').toString(),
                pairIndex: Number(tradeData.pairIndex ?? tradeData[1] ?? pairIndex),
                index: Number(tradeData.index ?? tradeData[2] ?? i),
                initialPosToken: (tradeData.initialPosToken ?? tradeData[3] ?? '0').toString(),
                positionSizeDai: (tradeData.positionSizeDai ?? tradeData[4] ?? '0').toString(),
                openPrice: (tradeData.openPrice ?? tradeData[5] ?? '0').toString(),
                buy: Boolean(tradeData.buy ?? tradeData[6]),
                leverage: (tradeData.leverage ?? tradeData[7] ?? '0').toString(),
                tp: (tradeData.tp ?? tradeData[8] ?? '0').toString(),
                sl: (tradeData.sl ?? tradeData[9] ?? '0').toString(),
              };

              // Get mark price
              const base = AVANTIS_INDEX_TO_SYMBOL[pairIndex] ?? '';
              const feedId = PYTH_PRICE_FEED_IDS[base];
              let markPrice = 0;

              if (feedId && this.pythContract) {
                try {
                  const getPriceFn = getContractFn(this.pythContract, 'getPrice');
                  const priceData = await getPriceFn(feedId);
                  markPrice = convertPythPrice(priceData.price.toString(), Number(priceData.expo));
                } catch {
                  this.debug(`Failed to get mark price for ${base}`);
                }
              }

              positions.push(this.normalizer.normalizePosition(trade, markPrice));
            } catch {
              this.debug(`Failed to read trade at pairIndex=${pairIndex}, index=${i}`);
            }
          }
        } catch {
          this.debug(`Failed to read trade count for pairIndex=${pairIndex}`);
        }
      }

      return positions;
    } catch (error: unknown) {
      throw mapError(error);
    }
  }

  async fetchBalance(): Promise<Balance[]> {
    const auth = this.requireAuth();
    await this.rateLimiter.acquire('fetchBalance');

    try {
      const usdcContract = this.requireContract(this.usdcContract, 'USDC');
      const balanceOfFn = getContractFn(usdcContract, 'balanceOf');
      const decimalsFn = getContractFn(usdcContract, 'decimals');
      const address = auth.getAddress();

      const [balance, decimals] = await Promise.all([balanceOfFn(address), decimalsFn()]);

      const balanceInfo = {
        asset: 'USDC',
        balance: balance.toString(),
        decimals: Number(decimals),
      };

      return [this.normalizer.normalizeBalance(balanceInfo)];
    } catch (error: unknown) {
      throw mapError(error);
    }
  }

  async _setLeverage(_symbol: string, _leverage: number): Promise<void> {
    throw new NotSupportedError(
      'Avantis sets leverage per-trade at order creation time, not as a separate operation',
      'NOT_SUPPORTED',
      'avantis'
    );
  }
}
