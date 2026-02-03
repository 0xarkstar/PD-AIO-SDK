/**
 * Crypto Utilities Browser Environment Tests
 *
 * Tests for browser-specific code paths by mocking the browser environment
 */

// Mock the browser environment before importing the module
const mockArrayBuffer = new ArrayBuffer(32);
const mockHashBuffer = new ArrayBuffer(32);

// Fill with deterministic values for testing
const hashView = new Uint8Array(mockHashBuffer);
for (let i = 0; i < 32; i++) {
  hashView[i] = i;
}

const mockCrypto = {
  subtle: {
    importKey: jest.fn().mockResolvedValue('mock-key'),
    sign: jest.fn().mockResolvedValue(mockHashBuffer),
    digest: jest.fn().mockResolvedValue(mockHashBuffer),
  },
};

// Set up browser environment before module import
beforeAll(() => {
  // @ts-expect-error - mocking browser globals
  global.window = { crypto: mockCrypto };
  // @ts-expect-error - mocking browser globals
  global.crypto = mockCrypto;
});

afterAll(() => {
  // @ts-expect-error - cleaning up mocks
  delete global.window;
  // @ts-expect-error - cleaning up mocks
  delete global.crypto;
});

// We need to re-import the module after setting up the environment
// Jest caches modules, so we use jest.isolateModules
describe('crypto utilities (browser environment)', () => {
  // Note: These tests verify the structure of browser code paths
  // The actual crypto operations use Node.js crypto in this test environment
  // because module caching means isBrowser is evaluated once at load time

  test('bytesToHex converts array to hex', async () => {
    const { bytesToHex } = await import('../../src/utils/crypto.js');

    const bytes = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    const result = bytesToHex(bytes);

    expect(result).toBe('000102030405060708090a0b0c0d0e0f');
  });

  test('hexToBytes handles edge cases', async () => {
    const { hexToBytes } = await import('../../src/utils/crypto.js');

    // Test single byte
    expect(Array.from(hexToBytes('00'))).toEqual([0]);
    expect(Array.from(hexToBytes('ff'))).toEqual([255]);

    // Test with padding needed
    expect(Array.from(hexToBytes('0f'))).toEqual([15]);
  });

  test('createHmacSha256 produces 64-char hex output', async () => {
    const { createHmacSha256 } = await import('../../src/utils/crypto.js');

    const result = await createHmacSha256('key', 'message');
    expect(typeof result).toBe('string');
    expect(result.length).toBe(64);
  });

  test('createSha3Hash produces consistent output', async () => {
    const { createSha3Hash } = await import('../../src/utils/crypto.js');

    const result1 = await createSha3Hash('test');
    const result2 = await createSha3Hash('test');
    expect(result1).toBe(result2);
  });

  test('createSha256Hash produces 64-char hex output', async () => {
    const { createSha256Hash } = await import('../../src/utils/crypto.js');

    const result = await createSha256Hash('test');
    expect(typeof result).toBe('string');
    expect(result.length).toBe(64);
  });
});

describe('crypto utilities sync functions in browser context', () => {
  // The sync function should throw in browser context
  // Our mock makes isBrowser true, so the sync function should throw

  test('createHmacSha256Sync throws in browser environment', async () => {
    const { createHmacSha256Sync } = await import('../../src/utils/crypto.js');

    // In browser context (mocked), this should throw
    expect(() => createHmacSha256Sync('key', 'message')).toThrow(
      'createHmacSha256Sync is not available in browsers'
    );
  });
});

describe('crypto utilities browser code paths', () => {
  // These tests run with isBrowser = true due to our global.window mock
  // This allows us to test the Web Crypto API code paths

  test('createHmacSha256 uses Web Crypto API in browser', async () => {
    const { createHmacSha256 } = await import('../../src/utils/crypto.js');

    // The mock crypto.subtle.sign returns our predetermined buffer
    const result = await createHmacSha256('secret', 'message');

    expect(typeof result).toBe('string');
    // Result should be hex string from our mock buffer
    expect(result.length).toBe(64);
    expect(mockCrypto.subtle.importKey).toHaveBeenCalled();
    expect(mockCrypto.subtle.sign).toHaveBeenCalled();
  });

  test('createSha256Hash uses Web Crypto API in browser', async () => {
    const { createSha256Hash } = await import('../../src/utils/crypto.js');

    const result = await createSha256Hash('test data');

    expect(typeof result).toBe('string');
    expect(result.length).toBe(64);
    expect(mockCrypto.subtle.digest).toHaveBeenCalled();
  });

  test('createSha256HashBuffer uses Web Crypto API in browser', async () => {
    const { createSha256HashBuffer } = await import('../../src/utils/crypto.js');

    const result = await createSha256HashBuffer('test data');

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(32);
    expect(mockCrypto.subtle.digest).toHaveBeenCalled();
  });

  test('createSha256Hash handles Uint8Array input in browser', async () => {
    const { createSha256Hash } = await import('../../src/utils/crypto.js');

    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const result = await createSha256Hash(data);

    expect(typeof result).toBe('string');
    expect(result.length).toBe(64);
  });

  test('createSha256HashBuffer handles Uint8Array input in browser', async () => {
    const { createSha256HashBuffer } = await import('../../src/utils/crypto.js');

    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const result = await createSha256HashBuffer(data);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(32);
  });
});
