/**
 * Ostium Contract Interactions
 */
import { OSTIUM_TRADING_ABI, OSTIUM_STORAGE_ABI, OSTIUM_COLLATERAL_ABI, OSTIUM_CONTRACTS, } from './constants.js';
export class OstiumContracts {
    addresses;
    rpcUrl;
    privateKey;
    constructor(rpcUrl, privateKey, addresses) {
        this.rpcUrl = rpcUrl;
        this.privateKey = privateKey;
        this.addresses = addresses ?? OSTIUM_CONTRACTS;
    }
    async getProvider() {
        const { JsonRpcProvider } = await import('ethers');
        return new JsonRpcProvider(this.rpcUrl);
    }
    async getSigner() {
        const { Wallet } = await import('ethers');
        const provider = await this.getProvider();
        return new Wallet(this.privateKey, provider);
    }
    async getTradingContract() {
        const { Contract } = await import('ethers');
        const signer = await this.getSigner();
        return new Contract(this.addresses.trading, OSTIUM_TRADING_ABI, signer);
    }
    async getStorageContract() {
        const { Contract } = await import('ethers');
        const provider = await this.getProvider();
        return new Contract(this.addresses.storage, OSTIUM_STORAGE_ABI, provider);
    }
    async openTrade(params) {
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
        const tx = await trading.openTrade(trade, 0, '10000000000', params.referral);
        return { hash: tx.hash };
    }
    async closeTrade(pairIndex, index) {
        const trading = await this.getTradingContract();
        const tx = await trading.closeTradeMarket(pairIndex, index);
        return { hash: tx.hash };
    }
    async cancelOrder(pairIndex, index) {
        const trading = await this.getTradingContract();
        const tx = await trading.cancelOpenLimitOrder(pairIndex, index);
        return { hash: tx.hash };
    }
    async getOpenTrade(trader, pairIndex, index) {
        const storage = await this.getStorageContract();
        const raw = await storage.openTrades(trader, pairIndex, index);
        return {
            trader: raw.trader,
            pairIndex: Number(raw.pairIndex),
            index: Number(raw.index),
            positionSizeDai: String(raw.positionSizeDai),
            openPrice: String(raw.openPrice),
            buy: raw.buy,
            leverage: Number(raw.leverage),
            tp: String(raw.tp),
            sl: String(raw.sl),
            timestamp: Date.now(),
        };
    }
    async getOpenTradeCount(trader, pairIndex) {
        const storage = await this.getStorageContract();
        const count = await storage.openTradesCount(trader, pairIndex);
        return Number(count);
    }
    async getCollateralBalance(address) {
        const { Contract } = await import('ethers');
        const provider = await this.getProvider();
        const collateral = new Contract(this.addresses.collateral, OSTIUM_COLLATERAL_ABI, provider);
        const balance = await collateral.balanceOf(address);
        return String(balance);
    }
    getTraderAddress() {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { Wallet } = require('ethers');
        return new Wallet(this.privateKey).address;
    }
}
//# sourceMappingURL=OstiumContracts.js.map