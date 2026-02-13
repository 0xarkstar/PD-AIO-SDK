#!/usr/bin/env ts-node
/**
 * API Compatibility Checker
 *
 * Automatically validates all exchange APIs against their specifications
 * and reports any breaking changes.
 *
 * Usage:
 *   npm run check:api              # Check all exchanges
 *   npm run check:api hyperliquid  # Check specific exchange
 */

import { fileURLToPath } from 'node:url';
import { ContractValidator } from '../tests/api-contracts/contract-validator.js';
import {
  hyperliquidTestnetSpec,
  grvtTestnetSpec,
  lighterTestnetSpec,
  paradexTestnetSpec,
  edgexTestnetSpec,
  nadoTestnetSpec,
  backpackSpec,
  dydxTestnetSpec,
  asterTestnetSpec,
  pacificaTestnetSpec,
  extendedTestnetSpec,
  variationalTestnetSpec,
  gmxSpec,
  driftDevnetSpec,
  jupiterSpec,
  ostiumSpec,
} from '../tests/api-contracts/index.js';
import type { APISpecification, ContractValidationReport } from '../tests/api-contracts/types.js';

interface CompatibilityCheckResult {
  exchange: string;
  success: boolean;
  report?: ContractValidationReport;
  error?: string;
}

const ALL_SPECS: Record<string, APISpecification> = {
  hyperliquid: hyperliquidTestnetSpec,
  grvt: grvtTestnetSpec,
  lighter: lighterTestnetSpec,
  paradex: paradexTestnetSpec,
  edgex: edgexTestnetSpec,
  nado: nadoTestnetSpec,
  backpack: backpackSpec,
  dydx: dydxTestnetSpec,
  aster: asterTestnetSpec,
  pacifica: pacificaTestnetSpec,
  extended: extendedTestnetSpec,
  variational: variationalTestnetSpec,
  gmx: gmxSpec,
  drift: driftDevnetSpec,
  jupiter: jupiterSpec,
  ostium: ostiumSpec,
};

/**
 * Check API compatibility for a single exchange
 */
async function checkExchange(spec: APISpecification): Promise<CompatibilityCheckResult> {
  console.log(`\n🔍 Checking ${spec.exchange}...`);

  try {
    const validator = new ContractValidator(spec.baseUrl, {
      timeout: 15000,
      skipAuthEndpoints: true,
      maxConcurrency: 2,
    });

    const report = await validator.validateSpecification(spec);

    const criticalChanges = report.breakingChanges.filter((c) => c.severity === 'critical');
    const majorChanges = report.breakingChanges.filter((c) => c.severity === 'major');

    console.log(`  ✅ Success Rate: ${(report.successRate * 100).toFixed(1)}%`);
    console.log(`  ⏱️  Avg Response Time: ${report.averageResponseTime.toFixed(0)}ms`);
    console.log(`  📊 ${report.passed} passed, ${report.failed} failed, ${report.skipped} skipped`);

    if (criticalChanges.length > 0) {
      console.log(`  🔴 Critical Changes: ${criticalChanges.length}`);
      criticalChanges.forEach((change) => {
        console.log(`     - ${change.endpointId}: ${change.description}`);
      });
    }

    if (majorChanges.length > 0) {
      console.log(`  🟠 Major Changes: ${majorChanges.length}`);
    }

    return {
      exchange: spec.exchange,
      success: true,
      report,
    };
  } catch (error) {
    console.log(`  ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      exchange: spec.exchange,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Generate markdown summary report
 */
function generateSummaryReport(results: CompatibilityCheckResult[]): string {
  const lines: string[] = [];

  lines.push('# API Compatibility Check Report');
  lines.push(`**Date**: ${new Date().toISOString()}`);
  lines.push('');

  lines.push('## Summary');
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  lines.push(`- ✅ Successful: ${successful}/${results.length}`);
  lines.push(`- ❌ Failed: ${failed}/${results.length}`);
  lines.push('');

  // Critical changes summary
  const criticalChanges = results
    .filter((r) => r.report && r.report.breakingChanges.some((c) => c.severity === 'critical'))
    .map((r) => ({
      exchange: r.exchange,
      changes: r.report!.breakingChanges.filter((c) => c.severity === 'critical'),
    }));

  if (criticalChanges.length > 0) {
    lines.push('## 🚨 Critical Breaking Changes');
    criticalChanges.forEach(({ exchange, changes }) => {
      lines.push(`### ${exchange}`);
      changes.forEach((change) => {
        lines.push(`- **${change.endpointId}**: ${change.description}`);
      });
    });
    lines.push('');
  }

  // Exchange-by-exchange details
  lines.push('## Exchange Details');
  results.forEach((result) => {
    lines.push(`### ${result.exchange}`);
    if (result.success && result.report) {
      const r = result.report;
      lines.push(`- **Success Rate**: ${(r.successRate * 100).toFixed(1)}%`);
      lines.push(`- **Avg Response Time**: ${r.averageResponseTime.toFixed(0)}ms`);
      lines.push(`- **Endpoints**: ${r.passed} passed, ${r.failed} failed, ${r.skipped} skipped`);
      lines.push(`- **Breaking Changes**: ${r.breakingChanges.length}`);
    } else {
      lines.push(`- ❌ **Error**: ${result.error}`);
    }
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const specificExchange = args[0];

  console.log('🚀 API Compatibility Checker');
  console.log('================================');

  let specsToCheck: [string, APISpecification][];

  if (specificExchange) {
    if (!ALL_SPECS[specificExchange]) {
      console.error(`❌ Unknown exchange: ${specificExchange}`);
      console.log(`Available exchanges: ${Object.keys(ALL_SPECS).join(', ')}`);
      process.exit(1);
    }
    specsToCheck = [[specificExchange, ALL_SPECS[specificExchange]]];
  } else {
    specsToCheck = Object.entries(ALL_SPECS);
  }

  const results: CompatibilityCheckResult[] = [];

  for (const [name, spec] of specsToCheck) {
    const result = await checkExchange(spec);
    results.push(result);
  }

  // Generate and save report
  const report = generateSummaryReport(results);
  const fs = await import('fs');
  const path = await import('path');

  const reportDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, `api-compatibility-${Date.now()}.md`);
  fs.writeFileSync(reportPath, report);

  console.log('\n================================');
  console.log(`📄 Report saved to: ${reportPath}`);

  // Exit with error code if there are critical changes
  const hasCritical = results.some(
    (r) => r.report && r.report.breakingChanges.some((c) => c.severity === 'critical')
  );

  if (hasCritical) {
    console.log('\n🚨 CRITICAL BREAKING CHANGES DETECTED!');
    process.exit(1);
  }

  const hasFailures = results.some((r) => !r.success);
  if (hasFailures) {
    console.log('\n⚠️  Some exchanges failed validation');
    process.exit(1);
  }

  console.log('\n✅ All exchanges passed compatibility check');
  process.exit(0);
}

// Run if called directly
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { checkExchange, generateSummaryReport };
