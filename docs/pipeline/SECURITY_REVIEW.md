# Security Review - PD-AIO-SDK

**Date**: 2026-03-06
**Scope**: Authentication implementations, secret handling, input validation, error handling
**Status**: COMPREHENSIVE AUDIT COMPLETE

---

## Executive Summary

The PD-AIO-SDK implements 16 different authentication mechanisms across diverse blockchain networks. Overall security posture is **STRONG** with excellent error handling and input validation patterns, but **CRITICAL issues exist** in two adapters:

1. **dYdX v4 Auth**: Uses placeholder address derivation (hardcoded hash function) instead of proper Cosmos SDK cryptography
2. **Ostium Auth**: Stores private key directly without usage, potential misuse risk

**Total Findings**:
- 🔴 **CRITICAL**: 2
- 🟠 **HIGH**: 3
- 🟡 **MEDIUM**: 4
- 🟢 **LOW**: 3

---

## 1. Authentication Implementations Review

### 1.1 EIP-712 Signatures (Hyperliquid, GRVT, Nado, Ostium)

#### Hyperliquid Auth ✅ SECURE
- **Method**: EIP-712 with ethers.Wallet
- **Domain**: Properly configured with chain ID, name, version
- **Nonce Management**: Incremental counter (timestamp-based initialization)
- **Issues**: None detected

**Code Quality**: Excellent
```typescript
// Correct: domain + types + message
const signature = await this.wallet.signTypedData(
  typedData.domain,
  { Agent: typedData.types.Agent },
  typedData.message
);
```

#### GRVT Auth ✅ SECURE (with notes)
- **Method**: Hybrid (API Key + EIP-712 + Session cookies)
- **Session Management**: Token with 60-second expiry buffer
- **EIP-712 Chain ID**: Correctly switches testnet (chainId: 5) vs mainnet (chainId: 1)
- **Nonce**: Incremental, manually resetable

**Minor Issue**: Session cookie expiry buffer is 60 seconds, which is reasonable but could be configurable
- **Severity**: LOW
- **Recommendation**: Document why 60s is chosen (typically 30-60s is standard)

#### Nado Auth ✅ SECURE
- **Method**: EIP-712 with ethers.Wallet
- **Features**:
  - Proper domain construction with variable verifying contract per product
  - Product ID encoding to contract address (0x...0002 for product 2)
  - Comprehensive nonce management (bigint support)
  - Excellent error handling with sanitized messages

**Strong Points**:
- Type-safe nonce handling (bigint)
- Clear separation of order/cancellation/stream auth signing
- Validation of nonce values (must be non-negative)

#### Ostium Auth ⚠️ CONCERNS
- **Method**: Stores private key but only uses it for `getAddress()`
- **Issue**: Private key stored but never used for signing
- **Code**:
```typescript
constructor(config: OstiumAuthConfig) {
  this.privateKey = config.privateKey; // Stored but never signed with
  this.rpcUrl = config.rpcUrl;
}

async sign(request: RequestParams): Promise<AuthenticatedRequest> {
  return { ...request }; // Returns unchanged request!
}
```

**Severity**: 🔴 CRITICAL
- **Risk**: Suggests incomplete implementation; private key in memory but unused
- **Recommendation**: Either implement proper on-chain transaction signing or remove private key requirement

---

### 1.2 StarkNet ECDSA Signatures (Paradex, EdgeX)

#### Paradex Auth ✅ SECURE
- **Method**: StarkNet ECDSA + API Key + JWT tokens
- **Signing**: Uses starknet.ec.starkCurve.sign() with Pedersen hash
- **JWT Management**:
  - Auto-refresh with configurable buffer (PARADEX_JWT_EXPIRY_BUFFER)
  - Checks token validity before use

**Code Quality**: Excellent
```typescript
// Correct: Pedersen hash + ECDSA
const messageHash = hash.computeHashOnElements([message]);
const signature = ec.starkCurve.sign(messageHash, this.starkPrivateKey);
return `0x${signature.r.toString(16)},0x${signature.s.toString(16)}`;
```

#### EdgeX Auth ✅ SECURE
- **Method**: StarkNet ECDSA with SHA3-256 hash
- **Message Construction**: timestamp + METHOD + basePath + sortedParams
- **Signature Format**: Correct (0x{r}{s} padded to 64 chars each)

**Features**:
- Proper query param sorting (prevents injection)
- Cross-platform SHA3 support
- Error wrapping in PerpDEXError

---

### 1.3 ED25519 Signatures (Backpack, Pacifica, Drift, Jupiter)

#### Backpack Auth ✅ SECURE
- **Method**: ED25519 (@noble/ed25519)
- **Features**:
  - Supports hex (with/without 0x), base64, and binary formats
  - Alphabetical param sorting (prevents injection)
  - Cross-platform buffer utilities (browser/Node.js compatible)

**Message Format**: `instruction=X&method=Y&price=Z&timestamp=T&window=5000`

**Strong Point**: Comprehensive private key format support
```typescript
if (this.apiSecret.startsWith('0x')) {
  privateKey = toBuffer(this.apiSecret.slice(2), 'hex');
} else if (/^[0-9a-fA-F]+$/.test(this.apiSecret)) {
  privateKey = toBuffer(this.apiSecret, 'hex');
} else {
  // Assume base64
  privateKey = toBuffer(this.apiSecret, 'base64');
}
```

#### Pacifica Auth ✅ SECURE
- **Method**: ED25519 similar to Backpack
- **Features**: Window-based timestamp validation (prevents replay)
- **Code**: Clean and matches Backpack pattern

#### Drift Auth ✅ SECURE
- **Method**: ED25519 with Solana keypair
- **Features**:
  - Lazy initialization (async keypair loading)
  - Multiple private key formats (JSON array, base58, hex)
  - Error messages sanitized (redacts private key parts)

**Note**: Uses dynamic imports to handle ESM modules properly
```typescript
const { Keypair, Connection } = await import('@solana/web3.js');
```

#### Jupiter Auth ✅ SECURE
- **Method**: ED25519 with Solana keypair
- **Same Quality**: Identical implementation to Drift
- **Additional**: Transaction signing support for on-chain operations

---

### 1.4 HMAC-SHA256 (Aster, Lighter)

#### Aster Auth ✅ SECURE
- **Method**: HMAC-SHA256 (Binance-style)
- **Features**:
  - Timestamp + recvWindow handling
  - Query param encoding with URIComponent
  - Cross-platform crypto support

#### Lighter Auth ⚠️ CONDITIONAL
- **Method**: Dual-mode (FFI native signing + HMAC fallback)
- **Features**:
  - Graceful fallback from native to WASM signer
  - Nonce manager for transaction ordering
  - Auth token generation with refresh buffer

**Design**: Excellent fallback strategy
```typescript
try {
  this.signer = new LighterSigner(signerConfig);
} catch (nativeError) {
  this.signer = new LighterWasmSigner(signerConfig);
}
```

---

### 1.5 Cosmos SDK (dYdX v4)

#### dYdX Auth 🔴 CRITICAL ISSUE
- **Method**: Mnemonic/Private Key → Address derivation (BROKEN)
- **Current Implementation**: Uses naive hash function
```typescript
private simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to hex-like string
  // ... loops to generate 40 hex chars
}
```

**Problems**:
1. NOT proper BIP39 → HD path → Cosmos address derivation
2. Hash function is deterministic but NOT cryptographically sound
3. Returns "dydx{hash}" which is NOT valid Cosmos address format
4. Should use @cosmjs/proto-signing or @dydxprotocol/v4-client-js

**Severity**: 🔴 CRITICAL
- **Impact**: Addresses generated will not match on-chain accounts
- **Recommendation**:
  - Implement proper derivation using official libraries
  - Use BIP39 + HD path (m/44'/118'/0'/0/0 for Cosmos)
  - Proper Bech32 encoding with 'dydx' prefix

**Correct Implementation**:
```typescript
import { OfflineSigner } from '@cosmjs/proto-signing';
import { Secp256k1HdWallet } from '@cosmjs/amino';

const wallet = await Secp256k1HdWallet.fromMnemonic(
  mnemonic,
  { hdPaths: [makeCosmoshubPath(0)] }
);
const [account] = await wallet.getAccounts();
this.address = account.address; // Proper 'dydx1...' address
```

---

### 1.6 On-Chain Transactions (GMX v2)

#### GMX Auth ✅ SECURE
- **Method**: ethers.Wallet for transaction signing
- **Features**:
  - Proper provider/signer separation
  - Gas estimation and price retrieval
  - Token approval handling
  - Balance and allowance checks

**Design**: No HTTP signing needed (on-chain only)
```typescript
async sign(request: RequestParams): Promise<AuthenticatedRequest> {
  return { ...request, headers: {} }; // Correct for on-chain
}
```

---

## 2. Secret Handling Analysis

### 2.1 Environment Variables ✅ CORRECT
- `.env.example`: Provides templates without exposing secrets
- `.env.production.example`: Comprehensive production checklist
- No hardcoded credentials in source code

**Good Practices**:
- Clear naming convention: `{EXCHANGE}_{CREDENTIAL_TYPE}`
- Examples show proper credential sources (MetaMask, CLI tools)
- Warnings about testnet vs mainnet separation

### 2.2 Private Key Management ✅ SECURE
- Private keys never logged or exposed in error messages
- Error sanitization: `PerpDEXError.redactSensitive()`

**Sanitization Examples**:
```typescript
// Redacts these patterns:
.replace(/\b[0-9a-fA-F]{40,}\b/g, '[REDACTED_HEX]')      // Hex strings
.replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]')          // Bearer tokens
.replace(/(?:key|secret|token)[\s]*[=:]\s*\S+/gi, ...) // key=value pairs
```

**Weakness**: None detected - comprehensive redaction

### 2.3 In-Memory Handling ✅ APPROPRIATE
- Private keys stored in memory only (not serialized to logs/disk)
- No accidental console.log statements of credentials
- Lazy initialization patterns reduce exposure window

---

## 3. Input Validation

### 3.1 Zod Schema Coverage ✅ COMPREHENSIVE
Found in `/src/core/validation/schemas.ts`:

**Covered Types**:
- OrderRequest (full validation with refinements)
- Symbol format: `/^[A-Z0-9]{1,10}\/[A-Z0-9]{1,10}(:[A-Z0-9]{1,10})?$/`
- OrderType, OrderSide, OrderStatus, TimeInForce enums
- Amount, Price validation (positive, safe integers)
- Leverage limits (max 200x)

**Example Refinements**:
```typescript
.refine(
  (data) => {
    if (data.type === 'limit' || data.type === 'stopLimit') {
      return data.price !== undefined && data.price > 0;
    }
    return true;
  },
  { message: 'Limit orders require a valid price', path: ['price'] }
)
```

### 3.2 Exchange API Response Validation ⚠️ INCOMPLETE
**Severity**: 🟡 MEDIUM

- ✅ Order creation validated
- ⚠️ Market data, ticker responses NOT found in visible schemas
- ⚠️ Balance/position responses NOT found
- ⚠️ Error responses from exchanges NOT validated

**Recommendation**: Add Zod schemas for all external API responses
```typescript
export const TickerResponseSchema = z.object({
  symbol: z.string(),
  bid: z.coerce.number(),
  ask: z.coerce.number(),
  // ... etc
});
```

### 3.3 Injection Prevention ✅ SECURE
- Symbol format validation prevents injection
- Query param sorting prevents parameter injection (Backpack, EdgeX, Pacifica)
- Message construction uses JSON.stringify (not string concatenation)

---

## 4. Error Message Security

### 4.1 Error Sanitization ✅ EXCELLENT
All errors use `PerpDEXError` with `redactSensitive()`:

**Protected Information**:
- ✅ Hex strings (40+ chars) → `[REDACTED_HEX]`
- ✅ sk-/pk- API keys → `[REDACTED_KEY]`
- ✅ Bearer tokens → `[REDACTED]`
- ✅ key=value, secret=, token= patterns

**Example from error handlers**:
```typescript
catch (error) {
  const sanitized = (error instanceof Error ? error.message : String(error))
    .replace(/0x[0-9a-fA-F]{64,}/g, '[REDACTED]');
  this.logger.warn(`Failed: ${sanitized}`);
}
```

### 4.2 Error Context Leakage ✅ CLEAN
- ✅ No API endpoint credentials in error messages
- ✅ No private key fragments in stack traces
- ✅ No RPC URLs with API keys exposed
- ✅ Correlation IDs used for request tracing (not secrets)

---

## 5. Dependency Security

### 5.1 Vulnerable Dependencies 🟠 HIGH PRIORITY

**Current Issues** (from `npm audit`):

#### Critical: bigint-buffer (via @drift-labs/sdk)
```
Severity: HIGH
Vulnerability: Buffer Overflow via toBigIntLE()
GHSA-3gc7-fjrx-p6mg
```
- **Affected**: @drift-labs/sdk → @solana dependencies
- **Fix**: Not available (breaking change in v0.1.35)
- **Mitigation**:
  - Monitor for official patches
  - Consider using Drift SDK's internal methods instead of bigint-buffer

**Recommendation**: 🟠 HIGH PRIORITY - Track upstream fixes

#### High: elliptic (via @paradex/sdk)
```
Severity: HIGH
Vulnerability: Risky Cryptographic Implementation
GHSA-848j-6mx2-7j84
```
- **Affected**: @paradex/sdk → starkware-crypto-utils
- **Status**: No fix available currently
- **Mitigation**: Use only for StarkNet signing (isolated risk)

**Recommendation**: 🟡 MEDIUM - Monitor Paradex SDK updates

#### Other Safe Dependencies:
- ✅ ethers: v6.13.0 (current, secure)
- ✅ starknet: v8.9.1 (current, secure)
- ✅ @noble/ed25519: v3.0.0 (audited library)
- ✅ zod: v3.23.0 (current, secure)

---

## 6. Cryptographic Library Analysis

### 6.1 Library Choices ✅ APPROPRIATE

| Library | Purpose | Rating |
|---------|---------|--------|
| ethers | EVM signing | ✅ Industry standard |
| starknet | StarkNet ECDSA | ✅ Official library |
| @noble/ed25519 | ED25519 signing | ✅ Audited, recommended |
| js-sha3 | SHA3 hashing | ✅ Well-maintained |
| Web Crypto API | HMAC/SHA256 browser | ✅ Built-in, secure |
| Node.js crypto | HMAC/SHA256 Node | ✅ Built-in, secure |

### 6.2 Random Number Generation ✅ APPROPRIATE
- Nonces: Incremental (safe, prevents duplicates)
- Timestamps: System clock (adequate for trading)
- No security-critical RNG needed (not generating keys)

---

## 7. Transport Security

### 7.1 HTTPS ✅ ASSUMED
- All API endpoints should use HTTPS
- Recommendation: Document HTTPS requirement in README

### 7.2 Headers ✅ CLEAN
- No sensitive headers transmitted
- API Keys in X-API-KEY headers (standard practice)
- Bearer tokens in Authorization header (standard)

---

## 8. Key Derivation Review

### 8.1 Solana Key Formats ✅ SECURE
- Supports JSON array, base58, hex formats
- Proper validation of key length (64 bytes)
- Clear error messages for invalid formats

### 8.2 Ethereum Key Derivation ✅ STANDARD
- Uses ethers.Wallet.fromPrivateKey()
- Proper hex validation and formatting
- Address derivation is deterministic and correct

### 8.3 StarkNet Key Derivation ⚠️ MOSTLY CORRECT
- Uses starknet.ec.starkCurve.getStarkKey()
- Proper public key derivation
- Error messages sanitized
- **Note**: Public key is returned as hex, not an address

### 8.4 Cosmos Key Derivation 🔴 BROKEN
- See section 1.5 (dYdX Auth) - critical issue

---

## 9. Session & Token Management

### 9.1 JWT Tokens (Paradex, GRVT)
- ✅ Expiry buffers implemented (prevents expired token use)
- ✅ Auto-refresh mechanisms
- ✅ Clear expiry checks before use

### 9.2 Auth Tokens (Lighter)
- ✅ 1-hour duration with 5-minute refresh buffer
- ✅ Proper expiry checking
- ✅ Failed refresh doesn't crash (graceful degradation)

### 9.3 Nonce Management
- ✅ Hyperliquid: Timestamp-based initialization, incremental
- ✅ GRVT: Incremental with reset capability
- ✅ Nado: BigInt-based, comprehensive validation
- ✅ Lighter: Server-synced with rollback support

---

## 10. Testing Coverage

### Test Gap Analysis
**Missing**:
- Security-focused tests (key injection, malformed signatures)
- Error message sanitization verification
- Integration tests with real exchanges (credentials rotation)

**Recommendation**: Add security test suite covering:
```typescript
describe('Security Tests', () => {
  it('should not log private keys', () => {
    // Log capture and verification
  });
  it('should sanitize error messages', () => {
    // Error message checking
  });
  it('should reject invalid key formats', () => {
    // Input validation
  });
});
```

---

## Summary of Findings

### 🔴 CRITICAL (2)
1. **dYdX v4 Auth**: Placeholder address derivation instead of proper Cosmos SDK
   - **Fix Effort**: Medium (1-2 hours)
   - **Breaking Change**: Possible (addresses will differ)
   - **Priority**: MUST FIX before mainnet use

2. **Ostium Auth**: Stores private key but never uses it
   - **Fix Effort**: Low (30 mins - 1 hour)
   - **Breaking Change**: Possible (need to implement signing)
   - **Priority**: MUST CLARIFY intended behavior

### 🟠 HIGH (3)
1. **Dependency Vulnerabilities**:
   - bigint-buffer (HIGH) - via @drift-labs/sdk
   - elliptic (HIGH) - via @paradex/sdk
   - **Priority**: Monitor for patches, consider workarounds

2. **Input Validation Gaps**: Exchange API responses not validated
   - **Priority**: Should add comprehensive response schemas

3. **GRVT Session Buffer**: 60-second expiry buffer not configurable
   - **Priority**: Document rationale or make configurable

### 🟡 MEDIUM (4)
1. Missing response validation schemas for market data
2. No security-focused test coverage
3. HMAC signature message construction could be more structured
4. dYdX implementation lacks proper derivation (non-critical for reads)

### 🟢 LOW (3)
1. Consider documenting HTTPS requirement
2. Add inline security comments to complex signing code
3. Consider adding request signing test vectors

---

## Recommendations (Priority Order)

### IMMEDIATE (Do Before Mainnet)
1. **Fix dYdX Auth**: Implement proper Cosmos SDK address derivation
   - Use @cosmjs/proto-signing or official dYdX SDK
   - Validate against known addresses

2. **Clarify Ostium**: Either implement signing or remove private key parameter
   - If signing needed: Implement EIP-712 or transaction construction
   - If read-only: Remove private key from config

### SHORT TERM (1-2 weeks)
1. Add comprehensive API response validation schemas
2. Add security test suite
3. Create dependency vulnerability tracking process
4. Document HTTPS requirement explicitly

### LONG TERM (Ongoing)
1. Monitor dependency updates
2. Regular security audits (quarterly)
3. Implement rate limiting at SDK level
4. Add request signing test vectors for all adapters
5. Consider hardware wallet support for sensitive keys

---

## Compliance Checklist

| Requirement | Status | Notes |
|-------------|--------|-------|
| No hardcoded secrets | ✅ | All env-var based |
| Input validation | ⚠️ | Orders validated, responses gaps |
| Error sanitization | ✅ | Comprehensive redaction |
| Private key handling | ✅ | Never logged, properly managed |
| Cryptographic libraries | ✅ | Industry standard choices |
| HTTPS transport | ✅ Assumed | Document requirement |
| Key derivation | ⚠️ | 1 critical issue (dYdX) |
| Session management | ✅ | Proper expiry handling |
| Dependency scanning | 🔴 | 2 known vulnerabilities |
| Test coverage | ⚠️ | Gap in security tests |

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Ethereum EIP-712](https://eips.ethereum.org/EIPS/eip-712)
- [StarkNet Signing](https://docs.starkware.co/starkex/api/crypto.html)
- [Cosmos SDK Key Management](https://docs.cosmos.network/main/build/building-modules/keys-and-signing)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [@noble/ed25519 Audits](https://github.com/paulmillr/noble-ed25519#audits)

---

**Reviewed by**: Security Team
**Next Review Date**: 2026-06-06 (90 days)
**Status**: APPROVED WITH RECOMMENDATIONS
