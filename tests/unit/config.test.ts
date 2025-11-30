/**
 * Configuration Utilities Unit Tests
 */

import {
  validateConfig,
  validateMultipleConfigs,
  getRequiredEnvVars,
  isValidPrivateKey,
  isValidApiKey,
  maskSensitive,
  ConfigurationError,
} from '../../src/utils/config.js';

describe('Configuration Utilities', () => {
  // Save original env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env before each test
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('validateConfig', () => {
    test('throws ConfigurationError when required vars missing', () => {
      delete process.env.HYPERLIQUID_PRIVATE_KEY;

      expect(() => validateConfig('hyperliquid')).toThrow(ConfigurationError);
    });

    test('passes when all required vars present', () => {
      process.env.HYPERLIQUID_PRIVATE_KEY = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      expect(() => validateConfig('hyperliquid')).not.toThrow();
    });

    test('throws when var is placeholder text', () => {
      process.env.HYPERLIQUID_PRIVATE_KEY = 'your_private_key_here';

      expect(() => validateConfig('hyperliquid')).toThrow(ConfigurationError);
    });

    test('throws when var is empty string', () => {
      process.env.HYPERLIQUID_PRIVATE_KEY = '';

      expect(() => validateConfig('hyperliquid')).toThrow(ConfigurationError);
    });

    test('throws when var is whitespace only', () => {
      process.env.HYPERLIQUID_PRIVATE_KEY = '   ';

      expect(() => validateConfig('hyperliquid')).toThrow(ConfigurationError);
    });

    test('ConfigurationError contains exchange and missing vars', () => {
      delete process.env.LIGHTER_API_KEY;
      delete process.env.LIGHTER_API_SECRET;
      process.env.LIGHTER_ACCOUNT_ID = 'test123';

      try {
        validateConfig('lighter');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigurationError);
        const configError = error as ConfigurationError;
        expect(configError.exchange).toBe('lighter');
        expect(configError.missingVars).toContain('LIGHTER_API_KEY');
        expect(configError.missingVars).toContain('LIGHTER_API_SECRET');
        expect(configError.missingVars).not.toContain('LIGHTER_ACCOUNT_ID');
      }
    });
  });

  describe('validateMultipleConfigs', () => {
    test('validates multiple exchanges', () => {
      process.env.HYPERLIQUID_PRIVATE_KEY = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      delete process.env.LIGHTER_API_KEY;

      const results = validateMultipleConfigs(['hyperliquid', 'lighter']);

      expect(results.hyperliquid.valid).toBe(true);
      expect(results.hyperliquid.missing).toHaveLength(0);

      expect(results.lighter.valid).toBe(false);
      expect(results.lighter.missing.length).toBeGreaterThan(0);
    });
  });

  describe('getRequiredEnvVars', () => {
    test('returns required vars for hyperliquid', () => {
      const vars = getRequiredEnvVars('hyperliquid');
      expect(vars).toContain('HYPERLIQUID_PRIVATE_KEY');
      expect(vars).toHaveLength(1);
    });

    test('returns required vars for lighter', () => {
      const vars = getRequiredEnvVars('lighter');
      expect(vars).toContain('LIGHTER_API_KEY');
      expect(vars).toContain('LIGHTER_API_SECRET');
      expect(vars).toContain('LIGHTER_ACCOUNT_ID');
      expect(vars).toHaveLength(3);
    });

    test('returns required vars for grvt', () => {
      const vars = getRequiredEnvVars('grvt');
      expect(vars).toContain('GRVT_PRIVATE_KEY');
      expect(vars).toContain('GRVT_API_KEY');
      expect(vars).toHaveLength(2);
    });
  });

  describe('isValidPrivateKey', () => {
    test('accepts valid 64-char hex with 0x prefix', () => {
      const key = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      expect(isValidPrivateKey(key)).toBe(true);
    });

    test('accepts valid 64-char hex without prefix', () => {
      const key = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      expect(isValidPrivateKey(key)).toBe(true);
    });

    test('rejects invalid length', () => {
      expect(isValidPrivateKey('0x1234')).toBe(false);
      expect(isValidPrivateKey('1234567890abcdef')).toBe(false);
    });

    test('rejects non-hex characters', () => {
      const key = '0x1234567890abcdefGHIJ567890abcdef1234567890abcdef1234567890abcdef';
      expect(isValidPrivateKey(key)).toBe(false);
    });

    test('rejects empty or undefined', () => {
      expect(isValidPrivateKey('')).toBe(false);
      expect(isValidPrivateKey('   ')).toBe(false);
    });

    test('handles uppercase hex', () => {
      const key = '0x1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF';
      expect(isValidPrivateKey(key)).toBe(true);
    });
  });

  describe('isValidApiKey', () => {
    test('accepts valid API key (>= 16 chars)', () => {
      expect(isValidApiKey('abcdef1234567890')).toBe(true);
      expect(isValidApiKey('my-super-secret-api-key-12345')).toBe(true);
    });

    test('rejects too short keys', () => {
      expect(isValidApiKey('short')).toBe(false);
      expect(isValidApiKey('1234567890')).toBe(false);
    });

    test('rejects placeholder text', () => {
      expect(isValidApiKey('your_api_key_here')).toBe(false);
      expect(isValidApiKey('your_api_secret_here')).toBe(false);
    });

    test('rejects all x characters', () => {
      expect(isValidApiKey('xxxxxxxxxxxxxxxx')).toBe(false);
      expect(isValidApiKey('XXXXXXXXXXXXXXXX')).toBe(false);
    });

    test('rejects empty or whitespace', () => {
      expect(isValidApiKey('')).toBe(false);
      expect(isValidApiKey('   ')).toBe(false);
    });
  });

  describe('maskSensitive', () => {
    test('masks middle of string', () => {
      const masked = maskSensitive('0x1234567890abcdef');
      expect(masked).toBe('0x12...cdef');
    });

    test('masks with custom show chars', () => {
      const masked = maskSensitive('1234567890abcdef', 6);
      expect(masked).toBe('123456...abcdef');
    });

    test('returns *** for short strings', () => {
      expect(maskSensitive('short')).toBe('***');
      expect(maskSensitive('1234')).toBe('***');
    });

    test('returns *** for empty string', () => {
      expect(maskSensitive('')).toBe('***');
    });

    test('handles very long strings', () => {
      const long = 'a'.repeat(100);
      const masked = maskSensitive(long);
      expect(masked).toBe('aaaa...aaaa');
      expect(masked.length).toBe(11); // 4 + 3 + 4
    });
  });
});
