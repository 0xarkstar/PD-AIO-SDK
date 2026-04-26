#!/usr/bin/env tsx
/**
 * Capability Matrix Generator
 *
 * Discovers all exchange adapters, extracts their `has` field using the
 * TypeScript compiler API, and writes docs/CAPABILITY_MATRIX.md.
 *
 * Usage:
 *   npm run gen:capability-matrix
 */

import * as ts from 'typescript';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Feature groups matching FeatureMap comment sections
// ---------------------------------------------------------------------------

const FEATURE_GROUPS: ReadonlyArray<{ label: string; keys: ReadonlyArray<string> }> = [
  {
    label: 'Market Data (Public)',
    keys: [
      'fetchMarkets',
      'fetchTicker',
      'fetchTickers',
      'fetchOrderBook',
      'fetchTrades',
      'fetchOHLCV',
      'fetchFundingRate',
      'fetchFundingRateHistory',
      'fetchCurrencies',
      'fetchStatus',
      'fetchTime',
    ],
  },
  {
    label: 'Trading (Private)',
    keys: [
      'createOrder',
      'cancelOrder',
      'cancelAllOrders',
      'createBatchOrders',
      'cancelBatchOrders',
      'editOrder',
      'fetchOpenOrders',
      'fetchClosedOrders',
      'fetchOrder',
    ],
  },
  {
    label: 'Account',
    keys: [
      'fetchOrderHistory',
      'fetchMyTrades',
      'fetchDeposits',
      'fetchWithdrawals',
      'fetchLedger',
      'fetchFundingHistory',
      'fetchPositions',
      'fetchBalance',
      'setLeverage',
      'setMarginMode',
      'fetchUserFees',
      'fetchPortfolio',
      'fetchRateLimitStatus',
    ],
  },
  {
    label: 'WebSocket Streams',
    keys: [
      'watchOrderBook',
      'watchTrades',
      'watchTicker',
      'watchTickers',
      'watchOHLCV',
      'watchPositions',
      'watchOrders',
      'watchBalance',
      'watchFundingRate',
      'watchMyTrades',
    ],
  },
  {
    label: 'Advanced Features',
    keys: ['twapOrders', 'vaultTrading'],
  },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FeatureValue = boolean | 'emulated' | undefined;

interface AdapterCapability {
  readonly id: string;
  readonly filePath: string;
  readonly has: Readonly<Record<string, FeatureValue>>;
}

// ---------------------------------------------------------------------------
// Glob: find adapter files
// ---------------------------------------------------------------------------

function discoverAdapterFiles(): ReadonlyArray<string> {
  const adaptersDir = path.join(ROOT, 'src', 'adapters');
  const entries = fs.readdirSync(adaptersDir, { withFileTypes: true });

  const files: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(adaptersDir, entry.name);
    const dirEntries = fs.readdirSync(dir, { withFileTypes: true });
    for (const f of dirEntries) {
      if (
        f.isFile() &&
        /^[A-Z].*Adapter\.ts$/.test(f.name) &&
        // Exclude BaseAdapter — it's abstract, no real `has` literal
        f.name !== 'BaseAdapter.ts' &&
        f.name !== 'BaseAdapterCore.ts'
      ) {
        files.push(path.join(dir, f.name));
      }
    }
  }
  return files;
}

// ---------------------------------------------------------------------------
// Parse: extract `has` object literal from a source file
// ---------------------------------------------------------------------------

function extractHasLiteral(
  sourceFile: ts.SourceFile,
  filePath: string,
): Readonly<Record<string, FeatureValue>> {
  // Walk AST looking for:
  //   readonly has: ... = { ... }
  //   or  readonly has = { ... }
  // as a PropertyDeclaration inside a ClassDeclaration.

  let result: Record<string, FeatureValue> | null = null;

  function visit(node: ts.Node): void {
    if (result !== null) return;

    if (
      ts.isPropertyDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'has' &&
      node.initializer != null &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      result = parseObjectLiteral(node.initializer, filePath);
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (result === null) {
    throw new Error(
      `[PARSE ERROR] Could not find "readonly has = { ... }" in ${filePath}\n` +
        `  Ensure the adapter declares: readonly has: Partial<FeatureMap> = { ... }`,
    );
  }

  return result;
}

function parseObjectLiteral(
  obj: ts.ObjectLiteralExpression,
  filePath: string,
): Record<string, FeatureValue> {
  const result: Record<string, FeatureValue> = {};

  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) {
      // Spread / shorthand — not expected in `has` literal, fail loudly
      throw new Error(
        `[PARSE ERROR] Unexpected non-property-assignment in "has" object in ${filePath}\n` +
          `  Property kind: ${ts.SyntaxKind[prop.kind]}`,
      );
    }

    const key = ts.isIdentifier(prop.name)
      ? prop.name.text
      : ts.isStringLiteral(prop.name)
        ? prop.name.text
        : null;

    if (key === null) {
      throw new Error(
        `[PARSE ERROR] Non-identifier key in "has" object in ${filePath}`,
      );
    }

    const val = prop.initializer;

    if (val.kind === ts.SyntaxKind.TrueKeyword) {
      result[key] = true;
    } else if (val.kind === ts.SyntaxKind.FalseKeyword) {
      result[key] = false;
    } else if (ts.isStringLiteral(val) && val.text === 'emulated') {
      result[key] = 'emulated';
    } else {
      throw new Error(
        `[PARSE ERROR] Unexpected value for key "${key}" in ${filePath}\n` +
          `  Expected: true | false | 'emulated', got: ${val.getText(val.getSourceFile())}`,
      );
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Extract adapter `id` from source file
// ---------------------------------------------------------------------------

function extractAdapterId(sourceFile: ts.SourceFile, filePath: string): string {
  // Look for:  readonly id = 'somestring'
  // inside a ClassDeclaration

  let adapterId: string | null = null;

  function visit(node: ts.Node): void {
    if (adapterId !== null) return;

    if (
      ts.isPropertyDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'id' &&
      node.initializer != null &&
      ts.isStringLiteral(node.initializer)
    ) {
      adapterId = node.initializer.text;
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (adapterId === null) {
    // Fall back to filename-based id
    const baseName = path.basename(filePath, '.ts');
    const fallback = baseName.replace(/Adapter$/, '').toLowerCase();
    process.stderr.write(
      `[WARN] Could not extract "readonly id" from ${filePath}, using fallback: "${fallback}"\n`,
    );
    return fallback;
  }

  return adapterId;
}

// ---------------------------------------------------------------------------
// Load and parse all adapters
// ---------------------------------------------------------------------------

function loadAdapters(filePaths: ReadonlyArray<string>): ReadonlyArray<AdapterCapability> {
  const program = ts.createProgram(filePaths as string[], {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    strict: true,
    noEmit: true,
  });

  const adapters: AdapterCapability[] = [];

  for (const filePath of filePaths) {
    const sourceFile = program.getSourceFile(filePath);
    if (sourceFile == null) {
      throw new Error(
        `[PARSE ERROR] TypeScript program could not load source file: ${filePath}`,
      );
    }

    const id = extractAdapterId(sourceFile, filePath);
    const has = extractHasLiteral(sourceFile, filePath);

    adapters.push({ id, filePath, has });
  }

  // Sort by id for stable output
  return adapters.slice().sort((a, b) => a.id.localeCompare(b.id));
}

// ---------------------------------------------------------------------------
// Markdown rendering
// ---------------------------------------------------------------------------

function cellFor(value: FeatureValue): string {
  if (value === true) return '✅';
  if (value === 'emulated') return '~';
  return '❌';
}

function renderTable(
  adapters: ReadonlyArray<AdapterCapability>,
  groupLabel: string,
  keys: ReadonlyArray<string>,
): string {
  const header = `| Feature | ${adapters.map((a) => a.id).join(' | ')} |`;
  const separator = `|---------|${adapters.map(() => ':---:').join('|')}|`;

  const rows = keys.map((key) => {
    const cells = adapters.map((a) => cellFor(a.has[key]));
    return `| \`${key}\` | ${cells.join(' | ')} |`;
  });

  return [`### ${groupLabel}`, '', header, separator, ...rows].join('\n');
}

function buildMarkdown(
  adapters: ReadonlyArray<AdapterCapability>,
  timestamp: string,
): string {
  const allKeys = new Set(FEATURE_GROUPS.flatMap((g) => g.keys));
  const totalFeatures = allKeys.size;

  const tables = FEATURE_GROUPS.map((g) => renderTable(adapters, g.label, g.keys));

  const lines: string[] = [
    '<!-- DO NOT EDIT: generated by scripts/generate-capability-matrix.ts -->',
    '',
    '# Capability Matrix',
    '',
    `> Auto-generated on ${timestamp} from each adapter's \`has\` field.`,
    '> Re-generate: `npm run gen:capability-matrix`',
    '',
    `**${adapters.length} adapters** × **${totalFeatures} features**`,
    '',
    '**Legend:** ✅ supported · ❌ not supported · `~` emulated (sequential fallback)',
    '',
    ...tables.flatMap((t) => [t, '']),
  ];

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const adapterFiles = discoverAdapterFiles();

  if (adapterFiles.length === 0) {
    process.stderr.write('[ERROR] No adapter files found under src/adapters/*/[A-Z]*Adapter.ts\n');
    process.exit(1);
  }

  const adapters = loadAdapters(adapterFiles);

  const timestamp = new Date().toISOString();
  const markdown = buildMarkdown(adapters, timestamp);

  const outDir = path.join(ROOT, 'docs');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'CAPABILITY_MATRIX.md');
  fs.writeFileSync(outPath, markdown, 'utf8');

  const allKeys = new Set(FEATURE_GROUPS.flatMap((g) => g.keys));
  process.stdout.write(
    `Generated matrix for ${adapters.length} adapters × ${allKeys.size} features\n`,
  );
  process.stdout.write(`Output: ${outPath}\n`);
}

main();
