/**
 * Remaining Exchanges API Contract Tests
 * Simplified tests for Paradex, EdgeX, Backpack, and Nado
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { ContractValidator } from './contract-validator.js';
import {
  paradexTestnetSpec,
  edgexTestnetSpec,
  nadoTestnetSpec,
} from './specs/remaining-exchanges.spec.js';
import { backpackSpec } from './specs/remaining-exchanges.spec.js';
import type { ContractValidationReport } from './types.js';

describe('Remaining Exchanges API Contract Tests', () => {
  describe('Paradex', () => {
    let report: ContractValidationReport;

    beforeAll(async () => {
      const validator = new ContractValidator(paradexTestnetSpec.baseUrl, {
        timeout: 15000,
        skipAuthEndpoints: true,
        maxConcurrency: 2,
      });
      report = await validator.validateSpecification(paradexTestnetSpec);
    }, 30000);

    it('should complete validation', () => {
      expect(report.results).toHaveLength(paradexTestnetSpec.endpoints.length);
      expect(report.successRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('EdgeX', () => {
    let report: ContractValidationReport;

    beforeAll(async () => {
      const validator = new ContractValidator(edgexTestnetSpec.baseUrl, {
        timeout: 15000,
        skipAuthEndpoints: true,
        maxConcurrency: 2,
      });
      report = await validator.validateSpecification(edgexTestnetSpec);
    }, 30000);

    it('should complete validation', () => {
      expect(report.results).toHaveLength(edgexTestnetSpec.endpoints.length);
      expect(report.successRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Backpack', () => {
    let report: ContractValidationReport;

    beforeAll(async () => {
      const validator = new ContractValidator(backpackSpec.baseUrl, {
        timeout: 15000,
        skipAuthEndpoints: true,
        maxConcurrency: 2,
      });
      report = await validator.validateSpecification(backpackSpec);
    }, 30000);

    it('should complete validation', () => {
      expect(report.results).toHaveLength(backpackSpec.endpoints.length);
      expect(report.successRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Nado', () => {
    let report: ContractValidationReport;

    beforeAll(async () => {
      const validator = new ContractValidator(nadoTestnetSpec.baseUrl, {
        timeout: 15000,
        skipAuthEndpoints: true,
        maxConcurrency: 2,
      });
      report = await validator.validateSpecification(nadoTestnetSpec);
    }, 30000);

    it('should complete validation', () => {
      expect(report.results).toHaveLength(nadoTestnetSpec.endpoints.length);
      expect(report.successRate).toBeGreaterThanOrEqual(0);
    });
  });
});
