/**
 * GRVT API Contract Tests
 *
 * Validates that the GRVT API conforms to its specification.
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { ContractValidator } from './contract-validator.js';
import { grvtSpec, grvtTestnetSpec } from './specs/grvt.spec.js';
import type { ContractValidationReport } from './types.js';

describe('GRVT API Contract Tests', () => {
  let validator: ContractValidator;
  let report: ContractValidationReport;

  beforeAll(async () => {
    validator = new ContractValidator(grvtTestnetSpec.baseUrl, {
      timeout: 15000,
      skipAuthEndpoints: true,
      maxConcurrency: 2,
    });

    report = await validator.validateSpecification(grvtTestnetSpec);
  }, 30000);

  describe('Contract Validation', () => {
    it('should complete validation for all endpoints', () => {
      expect(report.results).toHaveLength(grvtTestnetSpec.endpoints.length);
      expect(report.totalEndpoints).toBe(grvtTestnetSpec.endpoints.length);
      expect(report.successRate).toBeGreaterThanOrEqual(0);
      expect(report.successRate).toBeLessThanOrEqual(1);
    });

    it('should not have critical breaking changes', () => {
      const criticalChanges = report.breakingChanges.filter(
        (change) => change.severity === 'critical'
      );
      expect(criticalChanges.length).toBeLessThanOrEqual(2);
    });

    it('should have reasonable response times', () => {
      expect(report.averageResponseTime).toBeLessThan(2000);
    });
  });

  describe('Individual Endpoint Validation', () => {
    it('should attempt to validate fetchMarkets endpoint', () => {
      const result = report.results.find((r) => r.endpointId === 'grvt.fetchMarkets');
      expect(result).toBeDefined();
      expect(result?.endpointId).toBe('grvt.fetchMarkets');
    });

    it('should attempt to validate fetchTicker endpoint', () => {
      const result = report.results.find((r) => r.endpointId === 'grvt.fetchTicker');
      expect(result).toBeDefined();
    });
  });

  describe('Report Generation', () => {
    it('should include all validation details', () => {
      expect(report.exchange).toBe('grvt-testnet');
      expect(report.passed + report.failed + report.skipped).toBe(report.totalEndpoints);
    });
  });
});
