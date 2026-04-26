#!/usr/bin/env tsx
/**
 * Pattern A Compliance Checker
 *
 * Discovers all adapters under src/adapters/*\/ (excluding base/ and extended/)
 * and verifies they follow the canonical Pattern A file structure.
 *
 * Required files (violations if missing):
 *   {Exchange}Adapter.ts
 *   {Exchange}Normalizer.ts
 *   index.ts
 *
 * Optional files (warnings if missing):
 *   {Exchange}Auth.ts
 *   utils.ts
 *   constants.ts
 *   types.ts
 *   error-codes.ts
 *
 * For each adapter's index.ts, checks that {Exchange}Adapter and
 * {Exchange}Normalizer are exported.
 *
 * Usage:
 *   npm run check:pattern-a           # advisory (always exit 0)
 *   npm run check:pattern-a -- --strict  # exit 1 on unallowlisted violations
 *
 * Allowlist:
 *   scripts/pattern-a-allowlist.json  # exceptions for intentional divergences
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdapterReport {
  readonly name: string;
  readonly exchangeName: string;
  readonly violations: string[];
  readonly warnings: string[];
}

interface AllowlistEntry {
  readonly adapter: string;
  readonly violations: string[];
  readonly reason: string;
  readonly added: string;
  readonly review_by: string;
}

interface AllowlistFile {
  readonly exceptions: AllowlistEntry[];
}

// Maps allowlist violation kind → pattern matched against violation string
const VIOLATION_KIND_PATTERNS: Record<string, (exchangeName: string) => RegExp> = {
  'missing-normalizer': (exchangeName) =>
    new RegExp(`^missing ${exchangeName}Normalizer\\.ts$`),
  'normalizer-not-exported': (exchangeName) =>
    new RegExp(`^${exchangeName}Normalizer not exported in index\\.ts$`),
  'missing-utils': (_exchangeName) => /^missing utils\.ts$/,
  'missing-auth': (exchangeName) =>
    new RegExp(`^missing ${exchangeName}Auth\\.ts$`),
};

// ---------------------------------------------------------------------------
// Load allowlist
// ---------------------------------------------------------------------------

function loadAllowlist(): ReadonlyArray<AllowlistEntry> {
  const allowlistPath = path.join(ROOT, 'scripts', 'pattern-a-allowlist.json');

  if (!fs.existsSync(allowlistPath)) {
    return [];
  }

  let raw: string;
  try {
    raw = fs.readFileSync(allowlistPath, 'utf8');
  } catch (err) {
    process.stderr.write(
      `[ERROR] Cannot read pattern-a-allowlist.json: ${(err as NodeJS.ErrnoException).message}\n`,
    );
    process.exit(1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    process.stderr.write(
      `[ERROR] pattern-a-allowlist.json is malformed JSON: ${(err as Error).message}\n`,
    );
    process.exit(1);
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('exceptions' in parsed) ||
    !Array.isArray((parsed as Record<string, unknown>)['exceptions'])
  ) {
    process.stderr.write(
      '[ERROR] pattern-a-allowlist.json must have an "exceptions" array at the top level.\n',
    );
    process.exit(1);
  }

  return (parsed as AllowlistFile).exceptions;
}

// ---------------------------------------------------------------------------
// Check if a violation is allowlisted
// Returns the matching entry or null
// ---------------------------------------------------------------------------

function findAllowlistMatch(
  adapterName: string,
  exchangeName: string,
  violation: string,
  allowlist: ReadonlyArray<AllowlistEntry>,
): AllowlistEntry | null {
  for (const entry of allowlist) {
    if (entry.adapter !== adapterName) continue;
    for (const kind of entry.violations) {
      const patternFn = VIOLATION_KIND_PATTERNS[kind];
      if (patternFn == null) continue;
      if (patternFn(exchangeName).test(violation)) {
        return entry;
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Discover adapters
// ---------------------------------------------------------------------------

const EXCLUDED_DIRS = new Set(['base', 'extended']);

function discoverAdapters(): ReadonlyArray<{ name: string; dir: string }> {
  const adaptersDir = path.join(ROOT, 'src', 'adapters');
  const entries = fs.readdirSync(adaptersDir, { withFileTypes: true });
  const adapters: { name: string; dir: string }[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    adapters.push({
      name: entry.name,
      dir: path.join(adaptersDir, entry.name),
    });
  }

  return adapters.sort((a, b) => a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// Derive exchange name from actual *Adapter.ts file on disk
// Falls back to simple capitalisation if no Adapter file is found.
// This handles non-trivial cases like edgex→EdgeX, grvt→GRVT.
// ---------------------------------------------------------------------------

function discoverExchangeName(dirName: string, files: string[]): string {
  // Prefer the name embedded in the actual *Adapter.ts filename
  const adapterFile = files.find((f) => /^[A-Z].*Adapter\.ts$/.test(f));
  if (adapterFile != null) {
    return adapterFile.replace(/Adapter\.ts$/, '');
  }
  // Fallback: simple capitalisation of the directory name
  return dirName.charAt(0).toUpperCase() + dirName.slice(1);
}

// ---------------------------------------------------------------------------
// Check a single adapter
// ---------------------------------------------------------------------------

function checkAdapter(name: string, dir: string): AdapterReport {
  const violations: string[] = [];
  const warnings: string[] = [];

  let files: string[] = [];
  try {
    files = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => e.name);
  } catch (err) {
    const exchangeName = name.charAt(0).toUpperCase() + name.slice(1);
    violations.push(`cannot read directory: ${(err as NodeJS.ErrnoException).message}`);
    return { name, exchangeName, violations, warnings };
  }

  const exchangeName = discoverExchangeName(name, files);
  const fileSet = new Set(files);

  // Required files
  const requiredFiles: string[] = [
    `${exchangeName}Adapter.ts`,
    `${exchangeName}Normalizer.ts`,
    'index.ts',
  ];

  for (const required of requiredFiles) {
    if (!fileSet.has(required)) {
      violations.push(`missing ${required}`);
    }
  }

  // Optional files
  const optionalFiles: string[] = [
    `${exchangeName}Auth.ts`,
    'utils.ts',
    'constants.ts',
    'types.ts',
    'error-codes.ts',
  ];

  for (const optional of optionalFiles) {
    if (!fileSet.has(optional)) {
      warnings.push(`missing ${optional} (optional)`);
    }
  }

  // Check index.ts exports {Exchange}Adapter and {Exchange}Normalizer
  if (fileSet.has('index.ts')) {
    const indexPath = path.join(dir, 'index.ts');
    try {
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      checkIndexExport(indexContent, exchangeName, 'Adapter', violations);
      checkIndexExport(indexContent, exchangeName, 'Normalizer', violations);
    } catch (err) {
      violations.push(`cannot read index.ts: ${(err as NodeJS.ErrnoException).message}`);
    }
  }

  return { name, exchangeName, violations, warnings };
}

// ---------------------------------------------------------------------------
// Check that a named export exists in index.ts content
// Uses regex to match export { ..., ExportName, ... } or export { ExportName }
// as well as re-export patterns like: export * from './File.js'
// and named re-exports: export { Foo } from './Foo.js'
// ---------------------------------------------------------------------------

function checkIndexExport(
  content: string,
  exchangeName: string,
  suffix: string,
  violations: string[],
): void {
  const exportName = `${exchangeName}${suffix}`;

  // Pattern 1: export { ..., ExportName, ... } (with optional 'type' qualifier)
  const namedExportPattern = new RegExp(
    `export\\s+(?:type\\s+)?\\{[^}]*\\b${exportName}\\b[^}]*\\}`,
  );

  // Pattern 2: export * from './SomeFile.js' where SomeFile matches ExchangeNameSuffix
  // This covers: export * from './HyperliquidAdapter.js'
  const starReExportPattern = new RegExp(
    `export\\s+\\*\\s+from\\s+['"][./]*${exchangeName}${suffix}(?:\\.js)?['"]`,
  );

  // Pattern 3: export class/const/function ExportName
  const directExportPattern = new RegExp(
    `export\\s+(?:default\\s+)?(?:class|const|function|abstract\\s+class)\\s+${exportName}\\b`,
  );

  if (
    !namedExportPattern.test(content) &&
    !starReExportPattern.test(content) &&
    !directExportPattern.test(content)
  ) {
    violations.push(`${exportName} not exported in index.ts`);
  }
}

// ---------------------------------------------------------------------------
// Report rendering
// ---------------------------------------------------------------------------

function renderReport(
  reports: ReadonlyArray<AdapterReport>,
  allowlist: ReadonlyArray<AllowlistEntry>,
): void {
  const total = reports.length;
  const compliant = reports.filter((r) => r.violations.length === 0).length;

  // Count allowlisted violations across all reports
  let allowlistedCount = 0;
  for (const report of reports) {
    for (const v of report.violations) {
      if (findAllowlistMatch(report.name, report.exchangeName, v, allowlist) !== null) {
        allowlistedCount++;
      }
    }
  }

  const withViolations = reports.filter((r) => r.violations.length > 0);
  const withWarnings = reports.filter(
    (r) => r.violations.length === 0 && r.warnings.length > 0,
  );

  process.stdout.write('\nPattern A Compliance Report\n');
  process.stdout.write('===========================\n');
  process.stdout.write(`Compliant adapters: ${compliant}/${total}\n`);
  process.stdout.write(`Allowlisted exceptions: ${allowlistedCount}\n`);

  if (withViolations.length > 0) {
    process.stdout.write('\nViolations:\n');
    for (const report of withViolations) {
      for (const v of report.violations) {
        const match = findAllowlistMatch(report.name, report.exchangeName, v, allowlist);
        if (match !== null) {
          process.stdout.write(
            `  ${report.name}: ${v} [allowlisted: ${match.reason}]\n`,
          );
        } else {
          process.stdout.write(`  ${report.name}: ${v}\n`);
        }
      }
    }
  }

  if (withWarnings.length > 0) {
    process.stdout.write('\nWarnings (optional files missing):\n');
    for (const report of withWarnings) {
      for (const w of report.warnings) {
        process.stdout.write(`  ${report.name}: ${w}\n`);
      }
    }
  }

  if (withViolations.length === 0 && withWarnings.length === 0) {
    process.stdout.write('\nAll adapters fully compliant.\n');
  }

  process.stdout.write('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const strict = process.argv.includes('--strict');

  const allowlist = loadAllowlist();

  const adapters = discoverAdapters();

  if (adapters.length === 0) {
    process.stderr.write('[ERROR] No adapter directories found under src/adapters/\n');
    process.exit(1);
  }

  const reports: AdapterReport[] = [];
  for (const { name, dir } of adapters) {
    reports.push(checkAdapter(name, dir));
  }

  renderReport(reports, allowlist);

  // In strict mode, only unallowlisted violations count as failures
  const hasUnallowlistedViolations = reports.some((report) =>
    report.violations.some(
      (v) => findAllowlistMatch(report.name, report.exchangeName, v, allowlist) === null,
    ),
  );

  if (strict && hasUnallowlistedViolations) {
    process.stderr.write(
      '[STRICT] Unallowlisted Pattern A violations found. Fix required files before merging.\n',
    );
    process.exit(1);
  }

  process.exit(0);
}

main();
