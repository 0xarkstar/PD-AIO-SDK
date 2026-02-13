/**
 * Jupiter Perps Utilities Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  getTokenMint,
  getMarketConfig,
  isValidMarket,
  formatPrice,
  formatSize,
  roundToTickSize,
  roundToStepSize,
  validateLeverage,
  calculateSizeFromCollateral,
  calculateCollateralFromSize,
  getPositionPDASeeds,
  buildPriceApiUrl,
  buildRpcRequestBody,
  calculateBorrowFee,
  hourlyToAnnualizedRate,
  annualizedToHourlyRate,
  calculateLiquidationPrice,
  isLiquidatable,
  parseOnChainValue,
  formatOnChainValue,
  parseOnChainTimestamp,
  validatePositionSize,
  validateOrderParams,
} from '../../src/adapters/jupiter/utils.js';
import {
  unifiedToJupiter,
  jupiterToUnified,
  getBaseToken,
  JUPITER_TOKEN_MINTS,
} from '../../src/adapters/jupiter/constants.js';

describe('Jupiter Utils', () => {
  // =============================================================================
  // Symbol Conversion Tests
  // =============================================================================

  describe('Symbol Conversion', () => {
    describe('unifiedToJupiter', () => {
      it('should convert unified perpetual symbol to Jupiter format', () => {
        expect(unifiedToJupiter('BTC/USD:USD')).toBe('BTC-PERP');
        expect(unifiedToJupiter('ETH/USD:USD')).toBe('ETH-PERP');
        expect(unifiedToJupiter('SOL/USD:USD')).toBe('SOL-PERP');
      });

      it('should throw for invalid symbol format', () => {
        expect(() => unifiedToJupiter('')).toThrow('Invalid symbol format');
      });
    });

    describe('jupiterToUnified', () => {
      it('should convert Jupiter symbol to unified format', () => {
        expect(jupiterToUnified('BTC-PERP')).toBe('BTC/USD:USD');
        expect(jupiterToUnified('ETH-PERP')).toBe('ETH/USD:USD');
        expect(jupiterToUnified('SOL-PERP')).toBe('SOL/USD:USD');
      });
    });

    describe('getBaseToken', () => {
      it('should extract base token from unified symbol', () => {
        expect(getBaseToken('BTC/USD:USD')).toBe('BTC');
        expect(getBaseToken('ETH/USD:USD')).toBe('ETH');
        expect(getBaseToken('SOL/USD:USD')).toBe('SOL');
      });

      it('should return empty string for invalid format', () => {
        expect(getBaseToken('')).toBe('');
      });
    });
  });

  // =============================================================================
  // Token Utilities Tests
  // =============================================================================

  describe('Token Utilities', () => {
    describe('getTokenMint', () => {
      it('should return mint address for valid markets', () => {
        const solMint = getTokenMint('SOL-PERP');
        expect(solMint).toBe(JUPITER_TOKEN_MINTS.SOL);
      });

      it('should return undefined for unknown markets', () => {
        expect(getTokenMint('INVALID-PERP')).toBeUndefined();
      });
    });

    describe('getMarketConfig', () => {
      it('should return config for valid unified symbol', () => {
        const config = getMarketConfig('SOL/USD:USD');
        expect(config).toBeDefined();
        expect(config?.maxLeverage).toBe(250);
        expect(config?.baseToken).toBe('SOL');
      });

      it('should return config for Jupiter format symbol', () => {
        const config = getMarketConfig('BTC-PERP');
        expect(config).toBeDefined();
        expect(config?.baseToken).toBe('BTC');
      });

      it('should return undefined for invalid symbol', () => {
        expect(getMarketConfig('INVALID-PERP')).toBeUndefined();
      });
    });

    describe('isValidMarket', () => {
      it('should return true for valid markets', () => {
        expect(isValidMarket('BTC/USD:USD')).toBe(true);
        expect(isValidMarket('BTC-PERP')).toBe(true);
        expect(isValidMarket('ETH-PERP')).toBe(true);
        expect(isValidMarket('SOL-PERP')).toBe(true);
      });

      it('should return false for invalid markets', () => {
        expect(isValidMarket('INVALID-PERP')).toBe(false);
        expect(isValidMarket('XYZ/USD:USD')).toBe(false);
      });
    });
  });

  // =============================================================================
  // Price Utilities Tests
  // =============================================================================

  describe('Price Utilities', () => {
    describe('formatPrice', () => {
      it('should format price with market precision', () => {
        // SOL has tickSize 0.001, so 3 decimals
        const solPrice = formatPrice(123.4567, 'SOL-PERP');
        expect(solPrice).toBe('123.457');

        // BTC has tickSize 0.1, so 1 decimal
        const btcPrice = formatPrice(50000.456, 'BTC-PERP');
        expect(btcPrice).toBe('50000.5');
      });

      it('should use default precision for unknown markets', () => {
        const price = formatPrice(100.1234, 'UNKNOWN-PERP');
        expect(price).toBe('100.123');
      });
    });

    describe('formatSize', () => {
      it('should format size with market precision', () => {
        // SOL has stepSize 0.001
        const solSize = formatSize(1.12345, 'SOL-PERP');
        expect(solSize).toBe('1.123');

        // BTC has stepSize 0.00001
        const btcSize = formatSize(0.123456, 'BTC-PERP');
        expect(btcSize).toBe('0.12346');
      });
    });

    describe('roundToTickSize', () => {
      it('should round price to tick size', () => {
        // SOL has tickSize 0.001
        expect(roundToTickSize(123.4565, 'SOL-PERP')).toBeCloseTo(123.457, 3);
        expect(roundToTickSize(123.4564, 'SOL-PERP')).toBeCloseTo(123.456, 3);
      });
    });

    describe('roundToStepSize', () => {
      it('should round size to step size', () => {
        // SOL has stepSize 0.001
        // Use values not on exact .5 boundary to avoid banker's rounding
        expect(roundToStepSize(1.0006, 'SOL-PERP')).toBeCloseTo(1.001, 4);
        expect(roundToStepSize(1.0003, 'SOL-PERP')).toBeCloseTo(1.000, 4);
      });
    });
  });

  // =============================================================================
  // Leverage Utilities Tests
  // =============================================================================

  describe('Leverage Utilities', () => {
    describe('validateLeverage', () => {
      it('should validate valid leverage', () => {
        const result = validateLeverage(10, 'BTC-PERP');
        expect(result.valid).toBe(true);
        expect(result.reason).toBeUndefined();
      });

      it('should allow high leverage up to max', () => {
        // Jupiter allows up to 250x
        const result = validateLeverage(200, 'BTC-PERP');
        expect(result.valid).toBe(true);
      });

      it('should reject leverage below 1', () => {
        const result = validateLeverage(0.5, 'BTC-PERP');
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('Leverage must be at least 1x');
      });

      it('should reject leverage above max', () => {
        // BTC has maxLeverage 250
        const result = validateLeverage(300, 'BTC-PERP');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Maximum leverage');
      });
    });

    describe('calculateSizeFromCollateral', () => {
      it('should calculate size from collateral and leverage', () => {
        // $1000 collateral, 10x leverage, $50000 price = 0.2 BTC
        const size = calculateSizeFromCollateral(1000, 10, 50000);
        expect(size).toBeCloseTo(0.2, 4);
      });
    });

    describe('calculateCollateralFromSize', () => {
      it('should calculate collateral from size and leverage', () => {
        // $10000 position size, 10x leverage = $1000 collateral
        const collateral = calculateCollateralFromSize(10000, 10);
        expect(collateral).toBe(1000);
      });
    });
  });

  // =============================================================================
  // PDA Utilities Tests
  // =============================================================================

  describe('PDA Utilities', () => {
    describe('getPositionPDASeeds', () => {
      it('should return correct seeds for long position', () => {
        const seeds = getPositionPDASeeds(
          'ownerPubkey',
          'poolPubkey',
          'custodyPubkey',
          'long'
        );

        expect(seeds.prefix).toBe('position');
        expect(seeds.owner).toBe('ownerPubkey');
        expect(seeds.pool).toBe('poolPubkey');
        expect(seeds.custody).toBe('custodyPubkey');
        expect(seeds.side).toBe('Long');
      });

      it('should return correct seeds for short position', () => {
        const seeds = getPositionPDASeeds(
          'ownerPubkey',
          'poolPubkey',
          'custodyPubkey',
          'short'
        );

        expect(seeds.side).toBe('Short');
      });
    });
  });

  // =============================================================================
  // URL Builder Tests
  // =============================================================================

  describe('URL Builders', () => {
    describe('buildPriceApiUrl', () => {
      it('should build Pyth price API URL with single token', () => {
        const url = buildPriceApiUrl(['SOL']);
        expect(url).toContain('https://hermes.pyth.network/v2/updates/price/latest');
        expect(url).toContain('ids[]=');
      });

      it('should build Pyth price API URL with multiple tokens', () => {
        const url = buildPriceApiUrl(['SOL', 'ETH', 'BTC']);
        expect(url).toContain('hermes.pyth.network');
        // Should have 3 feed IDs
        const feedCount = (url.match(/ids\[\]=/g) || []).length;
        expect(feedCount).toBe(3);
      });

      it('should strip 0x prefix from Pyth feed IDs', () => {
        const url = buildPriceApiUrl(['SOL']);
        // Feed IDs in URL should NOT contain 0x prefix
        expect(url).not.toMatch(/ids\[\]=0x/);
        // But should still contain feed ID content
        expect(url).toContain('ids[]=');
      });

      it('should handle empty token list', () => {
        const url = buildPriceApiUrl([]);
        expect(url).toBe('https://hermes.pyth.network/v2/updates/price/latest?');
      });

      it('should handle unknown tokens gracefully', () => {
        const url = buildPriceApiUrl(['UNKNOWN_TOKEN']);
        // Should produce URL with no feed IDs
        expect(url).toBe('https://hermes.pyth.network/v2/updates/price/latest?');
      });
    });

    describe('buildRpcRequestBody', () => {
      it('should build RPC request body', () => {
        const body = buildRpcRequestBody('getAccountInfo', ['pubkey123']);

        expect(body.jsonrpc).toBe('2.0');
        expect(body.method).toBe('getAccountInfo');
        expect(body.params).toEqual(['pubkey123']);
        expect(body.id).toBeDefined();
      });
    });
  });

  // =============================================================================
  // Borrow Fee Tests
  // =============================================================================

  describe('Borrow Fee Calculations', () => {
    describe('calculateBorrowFee', () => {
      it('should calculate borrow fee for position', () => {
        // $10000 position, 0.01% hourly rate, held for 24 hours
        const fee = calculateBorrowFee(10000, 0.0001, 24);
        // Compound interest: 10000 * ((1.0001)^24 - 1) ≈ 24.02
        expect(fee).toBeCloseTo(24.02, 1);
      });

      it('should return 0 for 0 hours held', () => {
        const fee = calculateBorrowFee(10000, 0.0001, 0);
        expect(fee).toBe(0);
      });
    });

    describe('hourlyToAnnualizedRate', () => {
      it('should convert hourly rate to annualized', () => {
        // 0.01% hourly compounded for 8760 hours
        const annualized = hourlyToAnnualizedRate(0.0001);
        // Should be roughly 139% APY
        expect(annualized).toBeGreaterThan(1.3);
        expect(annualized).toBeLessThan(1.5);
      });
    });

    describe('annualizedToHourlyRate', () => {
      it('should convert annualized rate to hourly', () => {
        const annualized = 1.0; // 100% APY
        const hourly = annualizedToHourlyRate(annualized);
        // Should be small positive number
        expect(hourly).toBeGreaterThan(0);
        expect(hourly).toBeLessThan(0.001);
      });

      it('should round-trip with hourlyToAnnualizedRate', () => {
        const originalHourly = 0.0001;
        const annualized = hourlyToAnnualizedRate(originalHourly);
        const backToHourly = annualizedToHourlyRate(annualized);
        expect(backToHourly).toBeCloseTo(originalHourly, 8);
      });
    });
  });

  // =============================================================================
  // Liquidation Calculations Tests
  // =============================================================================

  describe('Liquidation Calculations', () => {
    describe('calculateLiquidationPrice', () => {
      it('should calculate liquidation price for long position', () => {
        // Long at $50000, $5000 collateral, $50000 position size, 1% maintenance
        const liqPrice = calculateLiquidationPrice(
          'long',
          50000,
          5000,
          50000,
          0.01
        );
        // Should be below entry price
        expect(liqPrice).toBeLessThan(50000);
        expect(liqPrice).toBeGreaterThan(40000);
      });

      it('should calculate liquidation price for short position', () => {
        // Short at $50000, $5000 collateral, $50000 position size, 1% maintenance
        const liqPrice = calculateLiquidationPrice(
          'short',
          50000,
          5000,
          50000,
          0.01
        );
        // Should be above entry price
        expect(liqPrice).toBeGreaterThan(50000);
        expect(liqPrice).toBeLessThan(60000);
      });
    });

    describe('isLiquidatable', () => {
      it('should detect liquidatable long position', () => {
        // Long at $50000, price dropped significantly
        expect(
          isLiquidatable('long', 50000, 40000, 5000, 50000, 0.01)
        ).toBe(true);
      });

      it('should detect safe long position', () => {
        // Long at $50000, price still healthy
        expect(
          isLiquidatable('long', 50000, 48000, 5000, 50000, 0.01)
        ).toBe(false);
      });

      it('should detect liquidatable short position', () => {
        // Short at $50000, price rose significantly
        expect(
          isLiquidatable('short', 50000, 60000, 5000, 50000, 0.01)
        ).toBe(true);
      });

      it('should detect safe short position', () => {
        // Short at $50000, price still reasonable
        expect(
          isLiquidatable('short', 50000, 52000, 5000, 50000, 0.01)
        ).toBe(false);
      });
    });
  });

  // =============================================================================
  // Data Parsing Tests
  // =============================================================================

  describe('Data Parsing', () => {
    describe('parseOnChainValue', () => {
      it('should parse on-chain value with decimals', () => {
        // 1000000000 with 6 decimals = 1000
        expect(parseOnChainValue('1000000000', 6)).toBe(1000);

        // 1500000000 with 9 decimals = 1.5
        expect(parseOnChainValue('1500000000', 9)).toBe(1.5);
      });

      it('should handle small values', () => {
        // 1000 with 6 decimals = 0.001
        expect(parseOnChainValue('1000', 6)).toBe(0.001);
      });

      it('should handle number input', () => {
        expect(parseOnChainValue(1000000, 6)).toBe(1);
      });
    });

    describe('formatOnChainValue', () => {
      it('should format value for on-chain', () => {
        // 1000 with 6 decimals = 1000000000
        expect(formatOnChainValue(1000, 6)).toBe('1000000000');

        // 1.5 with 9 decimals = 1500000000
        expect(formatOnChainValue(1.5, 9)).toBe('1500000000');
      });

      it('should round to integer', () => {
        expect(formatOnChainValue(1.5, 6)).toBe('1500000');
      });
    });

    describe('parseOnChainTimestamp', () => {
      it('should convert seconds to milliseconds', () => {
        const seconds = 1700000000; // Unix timestamp in seconds
        const ms = parseOnChainTimestamp(seconds);
        expect(ms).toBe(1700000000000);
      });

      it('should keep milliseconds as-is', () => {
        const ms = 1700000000000; // Already in milliseconds
        expect(parseOnChainTimestamp(ms)).toBe(1700000000000);
      });

      it('should handle string input', () => {
        expect(parseOnChainTimestamp('1700000000')).toBe(1700000000000);
      });
    });
  });

  // =============================================================================
  // Validation Tests
  // =============================================================================

  describe('Validation', () => {
    describe('validatePositionSize', () => {
      it('should validate valid position size', () => {
        const result = validatePositionSize(100, 'BTC-PERP');
        expect(result.valid).toBe(true);
      });

      it('should reject position size below $10', () => {
        const result = validatePositionSize(5, 'BTC-PERP');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Minimum position size is $10');
      });
    });

    describe('validateOrderParams', () => {
      it('should validate valid order params', () => {
        const result = validateOrderParams({
          symbol: 'BTC-PERP',
          side: 'long',
          sizeUsd: 100,
          leverage: 10,
        });
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject invalid market', () => {
        const result = validateOrderParams({
          symbol: 'INVALID-PERP',
          side: 'long',
          sizeUsd: 100,
          leverage: 10,
        });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Invalid market: INVALID-PERP');
      });

      it('should reject size below minimum', () => {
        const result = validateOrderParams({
          symbol: 'BTC-PERP',
          side: 'long',
          sizeUsd: 5, // min is $10
          leverage: 10,
        });
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Minimum position size'))).toBe(true);
      });

      it('should reject leverage above max', () => {
        const result = validateOrderParams({
          symbol: 'BTC-PERP',
          side: 'long',
          sizeUsd: 100,
          leverage: 300, // max is 250
        });
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Maximum leverage'))).toBe(true);
      });

      it('should collect multiple errors', () => {
        const result = validateOrderParams({
          symbol: 'INVALID-PERP',
          side: 'long',
          sizeUsd: 5,
          leverage: 300,
        });
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(1);
      });
    });
  });
});
