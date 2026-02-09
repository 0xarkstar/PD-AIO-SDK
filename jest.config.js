export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
    '^.+\\.jsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@noble|starknet|@scure|@paradex)/)',
  ],
  testMatch: [
    '**/tests/unit/**/*.test.ts',
    '**/tests/integration/**/*.test.ts',
    '**/tests/e2e/**/*.test.ts',
    '**/tests/api-contracts/**/*.test.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    // ==========================================================================
    // Global Thresholds — Cycle 8: 81.31% stmts, 74.56% branch, 86.51% funcs
    // Roadmap: 51% → 65% → 72% → 78% → 81%
    // ==========================================================================
    global: {
      branches: 72,
      functions: 84,
      lines: 79,
      statements: 79
    },

    // ==========================================================================
    // High-Quality Core Modules (maintain high standards)
    // ==========================================================================
    './src/utils/**/*.ts': {
      branches: 93,
      functions: 100,
      lines: 100,
      statements: 100
    },
    './src/core/calculations/**/*.ts': {
      branches: 83,
      functions: 100,
      lines: 100,
      statements: 100
    },

    // ==========================================================================
    // Established Adapter Utils
    // ==========================================================================
    './src/adapters/hyperliquid/utils.ts': {
      branches: 88,
      functions: 100,
      lines: 91,
      statements: 91
    },
    './src/adapters/grvt/utils.ts': {
      branches: 73,
      functions: 100,
      lines: 93,
      statements: 93
    },
    './src/adapters/paradex/utils.ts': {
      branches: 50,
      functions: 85,
      lines: 75,
      statements: 75
    },
    './src/adapters/edgex/utils.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    './src/adapters/backpack/utils.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },

    // ==========================================================================
    // Per-Adapter Thresholds (Cycle 8, 2026-02-09)
    // Note: **/*.ts globs apply per-file, so thresholds must fit weakest file
    // ==========================================================================

    // dydx: DydxAdapter.ts weakest (63% stmts, 58% branch, 83% funcs)
    './src/adapters/dydx/**/*.ts': {
      branches: 55,
      functions: 80,
      lines: 60,
      statements: 60
    },

    // drift: DriftAdapter.ts at 11% stmts, 15% branch, 22% funcs
    './src/adapters/drift/**/*.ts': {
      branches: 13,
      functions: 20,
      lines: 10,
      statements: 10
    },

    // gmx: GmxAdapter.ts at 33% stmts, 25% branch, 81% funcs
    './src/adapters/gmx/**/*.ts': {
      branches: 23,
      functions: 80,
      lines: 30,
      statements: 30
    },

    // jupiter: solana.ts weakest (46% stmts, 37% branch, 77% funcs)
    './src/adapters/jupiter/**/*.ts': {
      branches: 35,
      functions: 70,
      lines: 45,
      statements: 45
    },

    // extended: types.ts at 0% stmts, WebSocketWrapper at 50%
    './src/adapters/extended/**/*.ts': {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    },

    // lighter/signer: LighterWasmSigner.ts weakest (40% stmts, 22% branch, 22% funcs)
    './src/adapters/lighter/signer/**/*.ts': {
      branches: 20,
      functions: 20,
      lines: 38,
      statements: 38
    }
  },
  moduleDirectories: ['node_modules', 'src'],
  testTimeout: 10000
};
