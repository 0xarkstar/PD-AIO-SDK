/**
 * Config-Adapter Alignment Tests
 *
 * Verifies that environment variable requirements in config.ts
 * align with the actual credentials used by each exchange adapter.
 *
 * This ensures consistency between:
 * - EXCHANGE_ENV_REQUIREMENTS in config.ts
 * - Adapter config interfaces (e.g., EdgeXConfig, LighterConfig)
 * - Adapter initialization validation
 */

import { createExchange } from '../../src/factory.js';
import { getRequiredEnvVars } from '../../src/utils/config.js';
import { PerpDEXError } from '../../src/types/errors.js';

describe('Config-Adapter Alignment', () => {
  describe('Priority Exchange Configs', () => {
    /**
     * Test matrix for priority exchanges
     * Maps exchange name to valid minimal config
     */
    const exchangeConfigs = [
      {
        exchange: 'hyperliquid',
        config: { privateKey: '0x' + '1'.repeat(64) },
        envVars: ['HYPERLIQUID_PRIVATE_KEY'],
        description: 'EIP-712 signing with Ethereum private key',
      },
      {
        exchange: 'lighter',
        config: { apiKey: 'test-api-key-1234567890', apiSecret: 'test-api-secret-1234567890' },
        envVars: ['LIGHTER_API_KEY', 'LIGHTER_API_SECRET'],
        description: 'HMAC-SHA256 signing with API key + secret',
      },
      {
        exchange: 'edgex',
        config: { starkPrivateKey: '0x' + '1'.repeat(64) },
        envVars: ['EDGEX_STARK_PRIVATE_KEY'],
        description: 'StarkEx Pedersen hash + ECDSA with L2 private key',
      },
      {
        exchange: 'nado',
        config: { privateKey: '0x' + '1'.repeat(64) },
        envVars: ['NADO_PRIVATE_KEY'],
        description: 'EIP-712 signing on Ink L2',
      },
      {
        exchange: 'extended',
        config: { apiKey: 'test-api-key-1234567890' },
        envVars: ['EXTENDED_API_KEY'],
        description: 'API key + optional StarkNet signing',
      },
      {
        exchange: 'variational',
        config: { apiKey: 'test-api-key-1234567890', apiSecret: 'test-api-secret-1234567890' },
        envVars: ['VARIATIONAL_API_KEY', 'VARIATIONAL_API_SECRET'],
        description: 'HMAC signing (API in development)',
      },
    ] as const;

    describe.each(exchangeConfigs)('$exchange adapter', ({ exchange, config, envVars, description }) => {
      test(`should create adapter with valid credentials (${description})`, () => {
        const adapter = createExchange(exchange, config as any);

        expect(adapter).toBeDefined();
        expect(adapter.id).toBe(exchange);
      });

      test('should have matching env var requirements', () => {
        const requiredVars = getRequiredEnvVars(exchange as any);

        expect(requiredVars).toHaveLength(envVars.length);
        for (const envVar of envVars) {
          expect(requiredVars).toContain(envVar);
        }
      });
    });
  });

  describe('Adapter Initialization Validation', () => {
    test('EdgeX should require starkPrivateKey on initialize', async () => {
      const adapter = createExchange('edgex', {});

      await expect(adapter.initialize()).rejects.toThrow(PerpDEXError);
      await expect(adapter.initialize()).rejects.toThrow(/starkPrivateKey/i);
    });

    test('Lighter should require apiKey and apiSecret for trading', async () => {
      const adapter = createExchange('lighter', {});

      // Should be able to create adapter without credentials
      expect(adapter).toBeDefined();

      // But trading should require credentials
      await expect(
        adapter.createOrder({
          symbol: 'BTC/USDT:USDT',
          type: 'limit',
          side: 'buy',
          amount: 0.001,
          price: 50000,
        })
      ).rejects.toThrow();
    });

    test('Extended should require apiKey for authenticated endpoints', async () => {
      const adapter = createExchange('extended', {});

      // Market data should work without apiKey (once initialized)
      // But trading requires apiKey - check that it throws
      await expect(
        adapter.createOrder({
          symbol: 'BTC/USDT:USDT',
          type: 'limit',
          side: 'buy',
          amount: 0.001,
          price: 50000,
        })
      ).rejects.toThrow(/API key/i);
    });
  });

  describe('Environment Variable Naming Conventions', () => {
    const namingConventions = [
      // EIP-712 signature based (PRIVATE_KEY)
      { exchange: 'hyperliquid', expectedSuffix: 'PRIVATE_KEY' },
      { exchange: 'nado', expectedSuffix: 'PRIVATE_KEY' },

      // API Key + HMAC signature based (API_KEY, API_SECRET)
      { exchange: 'lighter', expectedSuffix: 'API_KEY' },
      { exchange: 'variational', expectedSuffix: 'API_KEY' },

      // StarkEx/StarkNet signing (STARK_PRIVATE_KEY)
      { exchange: 'edgex', expectedSuffix: 'STARK_PRIVATE_KEY' },
      { exchange: 'paradex', expectedSuffix: 'STARK_PRIVATE_KEY' },
    ] as const;

    test.each(namingConventions)(
      '$exchange should follow naming convention (*_$expectedSuffix)',
      ({ exchange, expectedSuffix }) => {
        const requiredVars = getRequiredEnvVars(exchange as any);
        const hasExpectedSuffix = requiredVars.some((v) => v.endsWith(expectedSuffix));

        expect(hasExpectedSuffix).toBe(true);
      }
    );
  });

  describe('Other Supported Exchanges', () => {
    test('GRVT requires both private key and API key', () => {
      const vars = getRequiredEnvVars('grvt');

      expect(vars).toContain('GRVT_PRIVATE_KEY');
      expect(vars).toContain('GRVT_API_KEY');
    });

    test('Paradex requires StarkNet private key', () => {
      const vars = getRequiredEnvVars('paradex');

      expect(vars).toContain('PARADEX_STARK_PRIVATE_KEY');
    });

    test('Backpack requires ED25519 API credentials', () => {
      const vars = getRequiredEnvVars('backpack');

      expect(vars).toContain('BACKPACK_API_KEY');
      expect(vars).toContain('BACKPACK_SECRET_KEY');
    });
  });
});
