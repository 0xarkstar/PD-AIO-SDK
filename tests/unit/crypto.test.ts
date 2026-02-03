/**
 * Crypto Utilities Unit Tests
 *
 * Tests for cross-platform cryptographic functions
 */

import {
  createHmacSha256,
  createHmacSha256Sync,
  createSha3Hash,
  createSha3HashSync,
  createSha3HashBuffer,
  createSha256Hash,
  createSha256HashBuffer,
  hexToBytes,
  bytesToHex,
} from '../../src/utils/crypto.js';

describe('crypto utilities', () => {
  describe('createHmacSha256', () => {
    const testKey = 'secret-key';
    const testData = 'test-data';

    test('creates HMAC-SHA256 hash asynchronously', async () => {
      const result = await createHmacSha256(testKey, testData);

      expect(typeof result).toBe('string');
      expect(result.length).toBe(64); // 32 bytes = 64 hex chars
      expect(/^[0-9a-f]+$/.test(result)).toBe(true);
    });

    test('produces consistent results for same input', async () => {
      const result1 = await createHmacSha256(testKey, testData);
      const result2 = await createHmacSha256(testKey, testData);

      expect(result1).toBe(result2);
    });

    test('produces different results for different keys', async () => {
      const result1 = await createHmacSha256('key1', testData);
      const result2 = await createHmacSha256('key2', testData);

      expect(result1).not.toBe(result2);
    });

    test('produces different results for different data', async () => {
      const result1 = await createHmacSha256(testKey, 'data1');
      const result2 = await createHmacSha256(testKey, 'data2');

      expect(result1).not.toBe(result2);
    });

    test('handles empty data', async () => {
      const result = await createHmacSha256(testKey, '');

      expect(typeof result).toBe('string');
      expect(result.length).toBe(64);
    });

    test('handles special characters in data', async () => {
      const result = await createHmacSha256(testKey, '!@#$%^&*()_+-=[]{}|;:,.<>?');

      expect(typeof result).toBe('string');
      expect(result.length).toBe(64);
    });
  });

  describe('createHmacSha256Sync', () => {
    const testKey = 'secret-key';
    const testData = 'test-data';

    test('creates HMAC-SHA256 hash synchronously', () => {
      const result = createHmacSha256Sync(testKey, testData);

      expect(typeof result).toBe('string');
      expect(result.length).toBe(64);
      expect(/^[0-9a-f]+$/.test(result)).toBe(true);
    });

    test('produces same result as async version', async () => {
      const syncResult = createHmacSha256Sync(testKey, testData);
      const asyncResult = await createHmacSha256(testKey, testData);

      expect(syncResult).toBe(asyncResult);
    });

    test('handles Unicode characters', () => {
      const result = createHmacSha256Sync(testKey, '你好世界🌍');

      expect(typeof result).toBe('string');
      expect(result.length).toBe(64);
    });
  });

  describe('createSha3Hash', () => {
    const testData = 'test-data';

    test('creates SHA3-256 hash asynchronously', async () => {
      const result = await createSha3Hash(testData);

      expect(typeof result).toBe('string');
      expect(result.length).toBe(64); // 32 bytes = 64 hex chars
      expect(/^[0-9a-f]+$/.test(result)).toBe(true);
    });

    test('produces consistent results for same input', async () => {
      const result1 = await createSha3Hash(testData);
      const result2 = await createSha3Hash(testData);

      expect(result1).toBe(result2);
    });

    test('produces different results for different data', async () => {
      const result1 = await createSha3Hash('data1');
      const result2 = await createSha3Hash('data2');

      expect(result1).not.toBe(result2);
    });

    test('handles empty string', async () => {
      const result = await createSha3Hash('');

      expect(typeof result).toBe('string');
      expect(result.length).toBe(64);
    });

    test('handles Uint8Array input', async () => {
      const data = new Uint8Array([116, 101, 115, 116]); // "test"
      const result = await createSha3Hash(data);

      expect(typeof result).toBe('string');
      expect(result.length).toBe(64);
    });
  });

  describe('createSha3HashSync', () => {
    const testData = 'test-data';

    test('creates SHA3-256 hash synchronously', () => {
      const result = createSha3HashSync(testData);

      expect(typeof result).toBe('string');
      expect(result.length).toBe(64);
      expect(/^[0-9a-f]+$/.test(result)).toBe(true);
    });

    test('produces same result as async version', async () => {
      const syncResult = createSha3HashSync(testData);
      const asyncResult = await createSha3Hash(testData);

      expect(syncResult).toBe(asyncResult);
    });

    test('handles long strings', () => {
      const longData = 'a'.repeat(10000);
      const result = createSha3HashSync(longData);

      expect(typeof result).toBe('string');
      expect(result.length).toBe(64);
    });

    test('handles Uint8Array input', () => {
      const data = new Uint8Array([116, 101, 115, 116]); // "test"
      const result = createSha3HashSync(data);

      expect(typeof result).toBe('string');
      expect(result.length).toBe(64);
    });
  });

  describe('createSha3HashBuffer', () => {
    const testData = 'test-data';

    test('creates SHA3-256 hash as Uint8Array', async () => {
      const result = await createSha3HashBuffer(testData);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32); // 32 bytes
    });

    test('produces consistent results', async () => {
      const result1 = await createSha3HashBuffer(testData);
      const result2 = await createSha3HashBuffer(testData);

      expect(Array.from(result1)).toEqual(Array.from(result2));
    });

    test('buffer hex matches string hash', async () => {
      const bufferResult = await createSha3HashBuffer(testData);
      const stringResult = createSha3HashSync(testData);

      const hexFromBuffer = bytesToHex(bufferResult);
      expect(hexFromBuffer).toBe(stringResult);
    });

    test('handles Uint8Array input', async () => {
      const data = new Uint8Array([116, 101, 115, 116]);
      const result = await createSha3HashBuffer(data);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32);
    });
  });

  describe('createSha256Hash', () => {
    const testData = 'test-data';

    test('creates SHA-256 hash asynchronously', async () => {
      const result = await createSha256Hash(testData);

      expect(typeof result).toBe('string');
      expect(result.length).toBe(64);
      expect(/^[0-9a-f]+$/.test(result)).toBe(true);
    });

    test('produces consistent results', async () => {
      const result1 = await createSha256Hash(testData);
      const result2 = await createSha256Hash(testData);

      expect(result1).toBe(result2);
    });

    test('SHA-256 differs from SHA3-256', async () => {
      const sha256 = await createSha256Hash(testData);
      const sha3 = await createSha3Hash(testData);

      expect(sha256).not.toBe(sha3);
    });

    test('handles Uint8Array input', async () => {
      const data = new Uint8Array([116, 101, 115, 116]);
      const result = await createSha256Hash(data);

      expect(typeof result).toBe('string');
      expect(result.length).toBe(64);
    });
  });

  describe('createSha256HashBuffer', () => {
    const testData = 'test-data';

    test('creates SHA-256 hash as Uint8Array', async () => {
      const result = await createSha256HashBuffer(testData);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32);
    });

    test('buffer hex matches string hash', async () => {
      const bufferResult = await createSha256HashBuffer(testData);
      const stringResult = await createSha256Hash(testData);

      const hexFromBuffer = bytesToHex(bufferResult);
      expect(hexFromBuffer).toBe(stringResult);
    });

    test('handles Uint8Array input', async () => {
      const data = new Uint8Array([116, 101, 115, 116]);
      const result = await createSha256HashBuffer(data);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32);
    });
  });

  describe('hexToBytes', () => {
    test('converts hex string to Uint8Array', () => {
      const hex = '48656c6c6f'; // "Hello" in hex
      const result = hexToBytes(hex);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(5);
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
    });

    test('handles empty string', () => {
      const result = hexToBytes('');

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(0);
    });

    test('handles lowercase hex', () => {
      const result = hexToBytes('abcdef');

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(3);
      expect(Array.from(result)).toEqual([171, 205, 239]);
    });

    test('handles uppercase hex', () => {
      const result = hexToBytes('ABCDEF');

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(3);
      expect(Array.from(result)).toEqual([171, 205, 239]);
    });

    test('handles mixed case hex', () => {
      const result = hexToBytes('AbCdEf');

      expect(Array.from(result)).toEqual([171, 205, 239]);
    });

    test('handles 0x prefix', () => {
      const result = hexToBytes('0x48656c6c6f');

      expect(result.length).toBe(5);
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
    });

    test('handles all zeros', () => {
      const result = hexToBytes('000000');

      expect(Array.from(result)).toEqual([0, 0, 0]);
    });

    test('handles all ones (ff)', () => {
      const result = hexToBytes('ffffff');

      expect(Array.from(result)).toEqual([255, 255, 255]);
    });
  });

  describe('bytesToHex', () => {
    test('converts Uint8Array to hex string', () => {
      const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const result = bytesToHex(bytes);

      expect(result).toBe('48656c6c6f');
    });

    test('handles empty array', () => {
      const result = bytesToHex(new Uint8Array(0));

      expect(result).toBe('');
    });

    test('handles single byte', () => {
      const result = bytesToHex(new Uint8Array([255]));

      expect(result).toBe('ff');
    });

    test('pads single digit hex values', () => {
      const result = bytesToHex(new Uint8Array([0, 1, 15]));

      expect(result).toBe('00010f');
    });

    test('round trip: hexToBytes -> bytesToHex', () => {
      const original = 'deadbeef';
      const bytes = hexToBytes(original);
      const result = bytesToHex(bytes);

      expect(result).toBe(original);
    });

    test('round trip: bytesToHex -> hexToBytes', () => {
      const original = new Uint8Array([1, 2, 3, 254, 255]);
      const hex = bytesToHex(original);
      const result = hexToBytes(hex);

      expect(Array.from(result)).toEqual(Array.from(original));
    });
  });

  describe('edge cases and integration', () => {
    test('handles binary data in hashing', async () => {
      const binaryData = '\x00\x01\x02\xff';
      const result = await createSha256Hash(binaryData);

      expect(typeof result).toBe('string');
      expect(result.length).toBe(64);
    });

    test('HMAC with binary key', async () => {
      const binaryKey = '\x00\x01\x02\xff';
      const result = await createHmacSha256(binaryKey, 'test');

      expect(typeof result).toBe('string');
      expect(result.length).toBe(64);
    });

    test('consistent hash across multiple calls', async () => {
      const data = 'consistent-test';
      const results = await Promise.all([
        createSha256Hash(data),
        createSha256Hash(data),
        createSha256Hash(data),
      ]);

      expect(results[0]).toBe(results[1]);
      expect(results[1]).toBe(results[2]);
    });
  });
});
