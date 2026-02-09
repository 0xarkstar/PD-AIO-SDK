/**
 * Ostium Contract Interactions
 */

import type { OstiumContractAddresses, OstiumTradeParams, OstiumOpenTrade } from './types.js';
import {
  OSTIUM_TRADING_ABI,
  OSTIUM_STORAGE_ABI,
  OSTIUM_COLLATERAL_ABI,
  OSTIUM_CONTRACTS,
} from './constants.js';

export class OstiumContracts {
  private readonly addresses: OstiumContractAddresses;
  private readonly rpcUrl: string;
  private readonly privateKey: string;

  constructor(rpcUrl: string, privateKey: string, addresses?: OstiumContractAddresses) {
    this.rpcUrl = rpcUrl;
    this.privateKey = privateKey;
    this.addresses = addresses ?? OSTIUM_CONTRACTS;
  }

  private async getProvider(): Promise<import('ethers').JsonRpcProvider> {
    const { JsonRpcProvider } = await import('ethers');
    return new JsonRpcProvider(this.rpcUrl);
  }

  private async getSigner(): Promise<import('ethers').Wallet> {
    const { Wallet } = await import('ethers');
    const provider = await this.getProvider();
    return new Wallet(this.privateKey, provider);
  }

  private async getTradingContract(): Promise<import('ethers').Contract> {
    const { Contract } = await import('ethers');
    const signer = await this.getSigner();
    return new Contract(this.addresses.trading, OSTIUM_TRADING_ABI, signer);
  }

  private async getStorageContract(): Promise<import('ethers').Contract> {
    const { Contract } = await import('ethers');
    const provider = await this.getProvider();
    return new Contract(this.addresses.storage, OSTIUM_STORAGE_ABI, provider);
  }

  async openTrade(params: OstiumTradeParams): Promise<{ hash: string }> {
    const trading = await this.getTradingContract();

    const trade = {
      trader: (await this.getSigner()).address,
      pairIndex: params.pairIndex,
      index: 0,
      positionSizeDai: params.positionSizeDai,
      openPrice: params.openPrice,
      buy: params.buy,
      leverage: params.leverage,
      tp: params.tp,
      sl: params.sl,
    };

    const tx = await trading.openTrade!(trade, 0, '10000000000', params.referral);
    return { hash: tx.hash as string };
  }

  async closeTrade(pairIndex: number, index: number): Promise<{ hash: string }> {
    const trading = await this.getTradingContract();
    const tx = await trading.closeTradeMarket!(pairIndex, index);
    return { hash: tx.hash as string };
  }

  async cancelOrder(pairIndex: number, index: number): Promise<{ hash: string }> {
    const trading = await this.getTradingContract();
    const tx = await trading.cancelOpenLimitOrder!(pairIndex, index);
    return { hash: tx.hash as string };
  }

  async getOpenTrade(trader: string, pairIndex: number, index: number): Promise<OstiumOpenTrade> {
    const storage = await this.getStorageContract();
    const raw = await storage.openTrades!(trader, pairIndex, index);
    return {
      trader: raw.trader as string,
      pairIndex: Number(raw.pairIndex),
      index: Number(raw.index),
      positionSizeDai: String(raw.positionSizeDai),
      openPrice: String(raw.openPrice),
      buy: raw.buy as boolean,
      leverage: Number(raw.leverage),
      tp: String(raw.tp),
      sl: String(raw.sl),
      timestamp: Date.now(),
    };
  }

  async getOpenTradeCount(trader: string, pairIndex: number): Promise<number> {
    const storage = await this.getStorageContract();
    const count = await storage.openTradesCount!(trader, pairIndex);
    return Number(count);
  }

  async getCollateralBalance(address: string): Promise<string> {
    const { Contract } = await import('ethers');
    const provider = await this.getProvider();
    const collateral = new Contract(this.addresses.collateral, OSTIUM_COLLATERAL_ABI, provider);
    const balance = await collateral.balanceOf!(address);
    return String(balance);
  }

  getTraderAddress(): string {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Wallet } = require('ethers') as typeof import('ethers');
    return new Wallet(this.privateKey).address;
  }
}
