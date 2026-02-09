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
    // Global Thresholds - Current: ~78%, Target: 80%
    // Roadmap: 51% -> 65% -> 72% -> 80%
    // ==========================================================================
    global: {
      branches: 65,
      functions: 78,
      lines: 72,
      statements: 72
    },

    // ==========================================================================
    // High-Quality Core Modules (maintain high standards)
    // ==========================================================================
    './src/utils/**/*.ts': {
      branches: 75,
      functions: 90,
      lines: 85,
      statements: 85
    },
    './src/core/calculations/**/*.ts': {
      branches: 75,
      functions: 95,
      lines: 95,
      statements: 95
    },

    // ==========================================================================
    // Established Adapter Utils
    // ==========================================================================
    './src/adapters/hyperliquid/utils.ts': {
      branches: 60,
      functions: 65,
      lines: 70,
      statements: 70
    },
    './src/adapters/grvt/utils.ts': {
      branches: 50,
      functions: 90,
      lines: 75,
      statements: 75
    },
    './src/adapters/paradex/utils.ts': {
      branches: 50,
      functions: 85,
      lines: 75,
      statements: 75
    },
    './src/adapters/edgex/utils.ts': {
      branches: 30,
      functions: 40,
      lines: 40,
      statements: 40
    },
    './src/adapters/backpack/utils.ts': {
      branches: 35,
      functions: 50,
      lines: 50,
      statements: 50
    },

    // ==========================================================================
    // Newer Adapters - Per-file thresholds (Cycle 7, 2026-02-09)
    // Note: **/*.ts globs apply per-file, so thresholds must fit weakest file
    // ==========================================================================

    // dydx: DydxAdapter.ts is weakest (63% stmts, 58% branch, 83% funcs)
    './src/adapters/dydx/**/*.ts': {
      branches: 55,
      functions: 80,
      lines: 60,
      statements: 60
    },

    // drift: DriftAdapter.ts at 11%, DriftClientWrapper at 56% — keep low
    './src/adapters/drift/**/*.ts': {
      branches: 10,
      functions: 20,
      lines: 10,
      statements: 10
    },

    // gmx: GmxAdapter.ts at 33%, GmxAuth funcs at 83% — keep conservative
    './src/adapters/gmx/**/*.ts': {
      branches: 20,
      functions: 30,
      lines: 30,
      statements: 30
    },

    // jupiter: JupiterAdapter.ts at 56%, solana.ts at 46% — keep conservative
    './src/adapters/jupiter/**/*.ts': {
      branches: 35,
      functions: 40,
      lines: 45,
      statements: 45
    },

    // extended: types.ts at 0%, WebSocketWrapper at 50%, Adapter branches 47%
    './src/adapters/extended/**/*.ts': {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  },
  moduleDirectories: ['node_modules', 'src'],
  testTimeout: 10000
};
