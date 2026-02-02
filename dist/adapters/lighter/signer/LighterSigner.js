/**
 * Lighter Native Signer
 *
 * FFI wrapper for the native Lighter signing library.
 * Provides transaction signing for private API operations.
 *
 * Uses koffi for FFI (compatible with Node.js 18-25+)
 */
import { platform, arch } from 'os';
import { existsSync } from 'fs';
import { join } from 'path';
/**
 * Get the appropriate native library filename for the current platform
 */
function getLibraryFilename() {
    const os = platform();
    const architecture = arch();
    switch (os) {
        case 'darwin':
            return architecture === 'arm64'
                ? 'lighter-signer-darwin-arm64.dylib'
                : 'lighter-signer-darwin-amd64.dylib';
        case 'linux':
            return architecture === 'arm64'
                ? 'lighter-signer-linux-arm64.so'
                : 'lighter-signer-linux-amd64.so';
        case 'win32':
            return 'lighter-signer-windows-amd64.dll';
        default:
            throw new Error(`Unsupported platform: ${os}-${architecture}`);
    }
}
/**
 * Find the native library path
 */
function findLibraryPath(customPath) {
    if (customPath) {
        if (!existsSync(customPath)) {
            throw new Error(`Native library not found at: ${customPath}`);
        }
        return customPath;
    }
    const filename = getLibraryFilename();
    const searchPaths = [
        // Project root native directory (most common)
        join(process.cwd(), 'native/lighter', filename),
        // Node modules (when used as dependency)
        join(process.cwd(), 'node_modules/pd-aio-sdk/native/lighter', filename),
        // Relative to dist directory (when running from dist)
        join(process.cwd(), 'dist/native/lighter', filename),
    ];
    for (const path of searchPaths) {
        if (existsSync(path)) {
            return path;
        }
    }
    throw new Error(`Native library not found. Searched: ${searchPaths.join(', ')}. ` +
        `Please ensure the Lighter native library is installed in native/lighter/`);
}
/**
 * LighterSigner class for FFI-based transaction signing
 */
export class LighterSigner {
    koffi = null;
    nativeLib = null;
    functions = {};
    config;
    initialized = false;
    apiPublicKey = '';
    // Struct types for koffi
    SignedTxResponseType = null;
    StrOrErrType = null;
    constructor(config) {
        // Normalize private key (remove 0x prefix if present)
        const privateKey = config.apiPrivateKey.startsWith('0x')
            ? config.apiPrivateKey.slice(2)
            : config.apiPrivateKey;
        this.config = {
            apiPrivateKey: privateKey,
            apiPublicKey: config.apiPublicKey || '',
            accountIndex: config.accountIndex ?? 0,
            apiKeyIndex: config.apiKeyIndex ?? 255,
            chainId: config.chainId,
            libraryPath: config.libraryPath || '',
        };
        this.apiPublicKey = this.config.apiPublicKey;
    }
    /**
     * Initialize the native library using koffi
     * Must be called before any signing operations
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        try {
            // Import koffi dynamically - handle both ESM and CommonJS contexts
            try {
                // Try dynamic import first (ESM)
                this.koffi = await import('koffi');
                this.koffi = this.koffi.default || this.koffi;
            }
            catch {
                // Try CommonJS require as fallback (Jest, older Node.js)
                try {
                    // Use globalThis.require if available (CommonJS context)
                    if (typeof globalThis.require === 'function') {
                        this.koffi = globalThis.require('koffi');
                    }
                    else {
                        // Try createRequire with a file URL
                        const { createRequire } = await import('module');
                        const { fileURLToPath } = await import('url');
                        // Use process.cwd() as base for require context
                        const requireFn = createRequire(process.cwd() + '/package.json');
                        this.koffi = requireFn('koffi');
                    }
                }
                catch {
                    throw new Error('koffi could not be loaded. Ensure it is installed: npm install koffi');
                }
            }
            const libraryPath = findLibraryPath(this.config.libraryPath);
            this.nativeLib = this.koffi.load(libraryPath);
            // Define struct types matching the C header
            // typedef struct {
            //   uint8_t txType;
            //   char* txInfo;
            //   char* txHash;
            //   char* messageToSign;
            //   char* err;
            // } SignedTxResponse;
            this.SignedTxResponseType = this.koffi.struct('SignedTxResponse', {
                txType: 'uint8',
                txInfo: 'char *',
                txHash: 'char *',
                messageToSign: 'char *',
                err: 'char *',
            });
            // typedef struct {
            //   char* str;
            //   char* err;
            // } StrOrErr;
            this.StrOrErrType = this.koffi.struct('StrOrErr', {
                str: 'char *',
                err: 'char *',
            });
            // Define function bindings using struct names in signature strings
            // char* CreateClient(char* cUrl, char* cPrivateKey, int cChainId, int cApiKeyIndex, long long cAccountIndex)
            this.functions.CreateClient = this.nativeLib.func('char * CreateClient(char *, char *, int, int, int64)');
            // SignedTxResponse SignCreateOrder(int, long long, long long, int, int, int, int, int, int, long long, long long, int, long long)
            this.functions.SignCreateOrder = this.nativeLib.func('SignedTxResponse SignCreateOrder(int, int64, int64, int, int, int, int, int, int, int64, int64, int, int64)');
            // SignedTxResponse SignCancelOrder(int cMarketIndex, long long cOrderIndex, long long cNonce, int cApiKeyIndex, long long cAccountIndex)
            this.functions.SignCancelOrder = this.nativeLib.func('SignedTxResponse SignCancelOrder(int, int64, int64, int, int64)');
            // SignedTxResponse SignCancelAllOrders(int cTimeInForce, long long cTime, long long cNonce, int cApiKeyIndex, long long cAccountIndex)
            this.functions.SignCancelAllOrders = this.nativeLib.func('SignedTxResponse SignCancelAllOrders(int, int64, int64, int, int64)');
            // SignedTxResponse SignWithdraw(int cAssetIndex, int cRouteType, unsigned long long cAmount, long long cNonce, int cApiKeyIndex, long long cAccountIndex)
            this.functions.SignWithdraw = this.nativeLib.func('SignedTxResponse SignWithdraw(int, int, uint64, int64, int, int64)');
            // StrOrErr CreateAuthToken(long long cDeadline, int cApiKeyIndex, long long cAccountIndex)
            this.functions.CreateAuthToken = this.nativeLib.func('StrOrErr CreateAuthToken(int64, int, int64)');
            // Initialize the client - note: first param is URL, we pass empty string
            const result = this.functions.CreateClient('', // URL (not used in our case)
            this.config.apiPrivateKey, this.config.chainId, this.config.apiKeyIndex, BigInt(this.config.accountIndex));
            if (result && result !== '' && result !== 'ok' && !result.includes('success')) {
                // Check if result is an error
                if (result.toLowerCase().includes('error') || result.toLowerCase().includes('fail')) {
                    throw new Error(`Failed to create signer client: ${result}`);
                }
            }
            this.initialized = true;
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('Cannot find module')) {
                throw new Error('koffi is not installed. Please run: npm install koffi');
            }
            throw error;
        }
    }
    /**
     * Ensure the library is initialized
     */
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('LighterSigner not initialized. Call initialize() first.');
        }
    }
    /**
     * Sign a create order transaction
     */
    async signCreateOrder(params) {
        this.ensureInitialized();
        const response = this.functions.SignCreateOrder(params.marketIndex, BigInt(params.clientOrderIndex), BigInt(params.baseAmount), params.price, params.isAsk ? 1 : 0, params.orderType, params.timeInForce, params.reduceOnly ? 1 : 0, params.triggerPrice || 0, BigInt(params.orderExpiry || 0), BigInt(params.nonce), this.config.apiKeyIndex, BigInt(this.config.accountIndex));
        if (response.err) {
            throw new Error(`Signing failed: ${response.err}`);
        }
        return {
            txType: response.txType,
            txInfo: response.txInfo || '',
            txHash: response.txHash || '',
        };
    }
    /**
     * Sign a cancel order transaction
     */
    async signCancelOrder(params) {
        this.ensureInitialized();
        const response = this.functions.SignCancelOrder(params.marketIndex, BigInt(params.orderId), BigInt(params.nonce), this.config.apiKeyIndex, BigInt(this.config.accountIndex));
        if (response.err) {
            throw new Error(`Signing failed: ${response.err}`);
        }
        return {
            txType: response.txType,
            txInfo: response.txInfo || '',
            txHash: response.txHash || '',
        };
    }
    /**
     * Sign a cancel all orders transaction
     *
     * Note: The native library takes (timeInForce, time, nonce, apiKeyIndex, accountIndex)
     * We use timeInForce=0 (GTC) and time=0 to cancel all
     */
    async signCancelAllOrders(params) {
        this.ensureInitialized();
        // timeInForce: 0 = GTC (cancel all), 1 = IOC, 2 = FOK
        // time: deadline timestamp (0 for no deadline)
        const response = this.functions.SignCancelAllOrders(0, // timeInForce (GTC to cancel all)
        BigInt(0), // time (no deadline)
        BigInt(params.nonce), this.config.apiKeyIndex, BigInt(this.config.accountIndex));
        if (response.err) {
            throw new Error(`Signing failed: ${response.err}`);
        }
        return {
            txType: response.txType,
            txInfo: response.txInfo || '',
            txHash: response.txHash || '',
        };
    }
    /**
     * Sign a withdraw transaction
     *
     * @param params.collateralIndex - Asset index (0 = USDC typically)
     * @param params.amount - Amount in base units
     * @param params.destinationAddress - Not used by native lib (uses routeType instead)
     */
    async signWithdrawCollateral(params) {
        this.ensureInitialized();
        // routeType: 0 = L1, 1 = L2, etc.
        const response = this.functions.SignWithdraw(params.collateralIndex, 0, // routeType (L1 withdrawal)
        BigInt(params.amount), BigInt(params.nonce), this.config.apiKeyIndex, BigInt(this.config.accountIndex));
        if (response.err) {
            throw new Error(`Signing failed: ${response.err}`);
        }
        return {
            txType: response.txType,
            txInfo: response.txInfo || '',
            txHash: response.txHash || '',
        };
    }
    /**
     * Create a signed authentication token
     *
     * @param expirySeconds - Token validity duration in seconds (default: 3600)
     * @returns Signed auth token string
     */
    async createAuthToken(expirySeconds = 3600) {
        this.ensureInitialized();
        const deadline = BigInt(Math.floor(Date.now() / 1000) + expirySeconds);
        const response = this.functions.CreateAuthToken(deadline, this.config.apiKeyIndex, BigInt(this.config.accountIndex));
        if (response.err) {
            throw new Error(`Failed to create auth token: ${response.err}`);
        }
        return response.str || '';
    }
    /**
     * Get the API key index
     */
    get apiKeyIndex() {
        return this.config.apiKeyIndex;
    }
    /**
     * Get the account index
     */
    get accountIndex() {
        return this.config.accountIndex;
    }
    /**
     * Get the public key
     */
    get publicKey() {
        return this.apiPublicKey;
    }
    /**
     * Check if the signer is initialized
     */
    get isInitialized() {
        return this.initialized;
    }
}
//# sourceMappingURL=LighterSigner.js.map