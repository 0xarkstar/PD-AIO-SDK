# Testnet Setup Guide

Complete guide for setting up and testing with testnet environments across all supported exchanges.

## Table of Contents

- [Overview](#overview)
- [Exchange Testnet Availability](#exchange-testnet-availability)
- [Credential Setup by Exchange](#credential-setup-by-exchange)
- [Running Tests](#running-tests)
- [Troubleshooting](#troubleshooting)

## Overview

This guide covers how to set up testnet credentials for each exchange and run production tests safely without risking real funds.

### Testnet vs Mainnet

| Aspect | Testnet | Mainnet |
|--------|---------|---------|
| Funds | Fake/faucet tokens | Real money |
| Risk | None | Financial loss possible |
| Purpose | Testing, development | Production trading |
| Data | May be reset periodically | Permanent |

## Exchange Testnet Availability

| Exchange | Testnet Available | Notes |
|----------|-------------------|-------|
| **Hyperliquid** | ✅ Yes | Public testnet with faucet |
| **GRVT** | ✅ Yes | Public testnet with faucet |
| **Paradex** | ✅ Yes | Uses Sepolia testnet |
| **Nado** | ✅ Yes | Ink L2 testnet |
| **Lighter** | ✅ Yes | ETH testnet |
| **EdgeX** | ❌ No | V1 mainnet only, V2 testnet Q3 2025 |
| **Backpack** | ❌ No | Mainnet only (use small amounts) |
| **Extended** | ✅ Yes | StarkNet testnet |
| **Variational** | ✅ Yes | Arbitrum testnet (limited functionality) |

## Credential Setup by Exchange

### Hyperliquid (EIP-712)

**Key Type:** Standard Ethereum private key

1. **Get a testnet wallet:**
   ```bash
   # Option 1: Use MetaMask - export private key
   # Option 2: Generate new wallet
   node -e "console.log(require('ethers').Wallet.createRandom().privateKey)"
   ```

2. **Get testnet funds:**
   - Visit: https://app.hyperliquid-testnet.xyz/
   - Connect wallet
   - Use the faucet to get testnet USDC

3. **Configure environment:**
   ```bash
   HYPERLIQUID_PRIVATE_KEY=0x...your_64_hex_chars...
   HYPERLIQUID_TESTNET=true
   ```

4. **Verify setup:**
   ```typescript
   import { createExchange } from 'pd-aio-sdk';

   const exchange = createExchange('hyperliquid', {
     privateKey: process.env.HYPERLIQUID_PRIVATE_KEY,
     testnet: true
   });

   await exchange.initialize();
   const balance = await exchange.fetchBalance();
   console.log('Balance:', balance);
   ```

---

### GRVT (EIP-712 + API Key)

**Key Type:** Ethereum private key + API key

1. **Create account:**
   - Visit: https://testnet.grvt.io/
   - Register and complete KYC (testnet may have simplified KYC)

2. **Generate API key:**
   - Go to Account Settings → API Keys
   - Create new API key with trading permissions
   - Save both API key and secret

3. **Get testnet funds:**
   - Use the testnet faucet in the platform

4. **Configure environment:**
   ```bash
   GRVT_PRIVATE_KEY=0x...your_eth_private_key...
   GRVT_API_KEY=your_api_key_here
   GRVT_TESTNET=true
   ```

---

### Paradex (StarkNet)

**Key Type:** StarkNet private key (NOT Ethereum!)

1. **Generate StarkNet wallet:**
   ```typescript
   // Paradex derives StarkNet key from Ethereum signature
   // The SDK handles this automatically
   ```

2. **Get Sepolia ETH for gas:**
   - Use Sepolia faucet: https://sepoliafaucet.com/

3. **Get testnet funds:**
   - Visit: https://testnet.paradex.trade/
   - Deposit testnet USDC

4. **Configure environment:**
   ```bash
   PARADEX_PRIVATE_KEY=0x...your_starknet_key...
   PARADEX_L1_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
   PARADEX_TESTNET=true
   ```

**Important:** Paradex uses StarkNet keys, which are different from Ethereum keys. The SDK can derive the StarkNet key from your Ethereum signature during onboarding.

---

### Nado (EIP-712 on Ink L2)

**Key Type:** Standard Ethereum private key

1. **Setup wallet:**
   - Use any Ethereum wallet (MetaMask, etc.)
   - Same key works on Ink L2

2. **Get testnet funds:**
   - Visit: https://test.nado.xyz/
   - Use the faucet

3. **Configure environment:**
   ```bash
   NADO_PRIVATE_KEY=0x...your_private_key...
   NADO_TESTNET=true
   ```

4. **Important - Initialize before trading:**
   ```typescript
   const exchange = createExchange('nado', {
     privateKey: process.env.NADO_PRIVATE_KEY,
     testnet: true
   });

   // CRITICAL: Must initialize to fetch contracts info
   await exchange.initialize();

   // Now trading works
   const order = await exchange.createOrder({ ... });
   ```

---

### Lighter (API Key)

**Key Type:** API key + secret

1. **Create account:**
   - Visit Lighter testnet platform
   - Register for account

2. **Generate API credentials:**
   - Create API key with trading permissions
   - Note your account ID

3. **Configure environment:**
   ```bash
   LIGHTER_API_KEY=your_api_key
   LIGHTER_API_SECRET=your_api_secret
   LIGHTER_ACCOUNT_ID=your_account_id
   LIGHTER_TESTNET=true
   ```

---

### Extended (StarkNet)

**Key Type:** StarkNet private key + API key

1. **Generate StarkNet wallet:**
   - Create a new StarkNet account using ArgentX or Braavos
   - Export the private key

2. **Configure environment:**
   ```bash
   EXTENDED_API_KEY=your_api_key
   EXTENDED_STARKNET_PRIVATE_KEY=0x...starknet_key...
   EXTENDED_STARKNET_ACCOUNT_ADDRESS=0x...account_address...
   EXTENDED_TESTNET=true
   ```

**Note:** WebSocket streaming is not yet implemented for Extended. Use REST API polling for real-time updates.

---

### EdgeX - ⚠️ 테스트 제외

**상태:** SDK 어댑터 재구현 필요

SDK 어댑터가 실제 EdgeX API 구조와 맞지 않습니다:
- **SDK 구현**: `apiKey` + `apiSecret` 방식
- **실제 EdgeX**: L2 Private Key로 직접 ECDSA 서명

EdgeX 테스트는 어댑터가 수정될 때까지 제외됩니다.

---

### Backpack (Mainnet Only)

**Key Type:** ED25519 (Solana-style, NOT Ethereum!)

Backpack does not have a testnet.

**For testing:**
- Use mainnet with minimal funds ($10-20 recommended)
- Create API keys with limited permissions
- Use small position sizes

1. **Generate ED25519 API key:**
   - Visit: https://backpack.exchange/
   - Go to Settings → API Keys
   - Create new key (system generates ED25519 keypair)

2. **Configure environment:**
   ```bash
   BACKPACK_API_KEY=your_api_key
   BACKPACK_SECRET_KEY=your_ed25519_secret
   # No testnet available
   ```

---

### Variational (Coming Soon)

**Status:** Limited functionality - only fetchMarkets() and fetchTicker() work.

```bash
# When full API is available:
VARIATIONAL_API_KEY=your_api_key
VARIATIONAL_API_SECRET=your_api_secret
VARIATIONAL_TESTNET=true
```

---

## Running Tests

### 1. Read-Only API Tests (No Credentials Needed)

Test public API endpoints without any credentials:

```bash
# Validates response schemas for public endpoints
npm run test:contracts
```

This tests:
- `fetchMarkets()`
- `fetchTicker()`
- `fetchOrderBook()`

### 2. Full Production Tests (Credentials Required)

1. **Create .env.production:**
   ```bash
   cp .env.production.example .env.production
   # Edit .env.production with your credentials
   ```

2. **Run all production tests:**
   ```bash
   npm run test:production
   ```

3. **Run tests for specific exchange:**
   ```bash
   npm test -- --testPathPattern="tests/production" --testNamePattern="Hyperliquid"
   ```

### 3. Individual Test Types

```bash
# Basic trading flow test
npm run test:production:basic

# WebSocket stability test (1 hour)
npm run test:production:websocket

# Stress test (rate limits, concurrent requests)
npm run test:production:stress
```

### 4. Recommended Test Order

1. **Start with testnet exchanges:**
   - Hyperliquid (easiest setup)
   - GRVT
   - Paradex
   - Nado

2. **Then mainnet-only (minimal funds):**
   - Backpack
   - EdgeX

3. **Skip for now:**
   - Variational (limited functionality)
   - Extended WebSocket (not implemented)

---

## Troubleshooting

### Common Issues

#### "Contracts info not loaded" (Nado)

```
Error: Contracts info not loaded
```

**Solution:** Call `initialize()` before trading:
```typescript
await adapter.initialize();  // Required!
await adapter.createOrder({ ... });
```

#### "WebSocket not supported" (Extended)

```
Error: watchOrderBook not implemented - WebSocket not supported
```

**Solution:** Use REST API polling instead:
```typescript
// Instead of WebSocket
setInterval(async () => {
  const orderBook = await adapter.fetchOrderBook(symbol);
  console.log(orderBook);
}, 1000);
```

#### "NOT_IMPLEMENTED" (Variational)

```
Error: createOrder not implemented
```

**Solution:** Variational is in early development. Only these methods work:
- `fetchMarkets()`
- `fetchTicker()`

#### Invalid StarkNet Key (Paradex, Extended)

```
Error: Invalid private key format
```

**Solution:** Ensure you're using a StarkNet key, not Ethereum:
- StarkNet keys are generated differently
- Use ArgentX/Braavos wallet to generate
- Or let the SDK derive it during onboarding

#### ED25519 Key Error (Backpack)

```
Error: Invalid signature
```

**Solution:** Backpack uses ED25519, not secp256k1:
- Keys must be generated on Backpack platform
- Cannot use Ethereum keys
- Check API key permissions

### Getting Help

- **GitHub Issues:** https://github.com/0xarkstar/PD-AIO-SDK/issues
- **Exchange-specific docs:** See individual exchange guides in `/docs/guides/`
- **API Reference:** See [API.md](../API.md)

---

## Quick Reference

| Exchange | Key Type | Testnet | Initialize Required | 상태 |
|----------|----------|---------|---------------------|------|
| Hyperliquid | EIP-712 | ✅ | No | ✅ 테스트 가능 |
| GRVT | EIP-712 + API | ✅ | No | ✅ 테스트 가능 |
| Paradex | StarkNet | ✅ | No | ✅ 테스트 가능 |
| Nado | EIP-712 | ✅ | **YES** | ✅ 테스트 가능 |
| Lighter | API Key | ✅ | No | ✅ 테스트 가능 |
| Extended | StarkNet + API | ✅ | No | ⚠️ WebSocket 미구현 |
| Backpack | ED25519 | ❌ | No | ✅ 메인넷만 |
| EdgeX | L2 Private Key | ❌ | - | ❌ SDK 재구현 필요 |
| Variational | HMAC | ✅ | N/A | ⚠️ 제한적 (2개 메서드만) |
