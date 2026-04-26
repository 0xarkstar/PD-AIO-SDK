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
    'node_modules/(?!(@noble|starknet|@scure|@paradex|uuid|@cosmjs)/)',
  ],
  testMatch: [
    '**/tests/unit/**/*.test.ts',
    '**/tests/integration/**/*.test.ts',
    '**/tests/e2e/**/*.test.ts',
    '**/tests/api-contracts/**/*.test.ts',
    '**/tests/adapters/**/*.test.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    // ==========================================================================
    // Global Thresholds — C25: 85.87% stmts, 74.93% branch, 89.17% funcs
    // Roadmap: 51% → 65% → 72% → 78% → 81% → 86%
    // ==========================================================================
    global: {
      branches: 72,
      functions: 87,
      lines: 81,
      statements: 81
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

    // drift: DriftAdapter.ts at 82.55% stmts, 68.22% branch, 76.31% funcs, 81.78% lines
    './src/adapters/drift/**/*.ts': {
      branches: 63,
      functions: 71,
      lines: 77,
      statements: 77
    },

    // gmx: GmxAdapter.ts at 83.59% stmts, 67.21% branch, 100% funcs, 83.48% lines
    './src/adapters/gmx/**/*.ts': {
      branches: 62,
      functions: 80,
      lines: 78,
      statements: 78
    },

    // jupiter: solana.ts weakest (46% stmts, 37% branch, 77% funcs)
    './src/adapters/jupiter/**/*.ts': {
      branches: 35,
      functions: 70,
      lines: 45,
      statements: 45
    },

    // extended: ExtendedWebSocketWrapper.ts at 50.42% stmts, 40.69% branch, 56.09% funcs, 51.08% lines
    './src/adapters/extended/**/*.ts': {
      branches: 35,
      functions: 51,
      lines: 46,
      statements: 45
    },

    // lighter/signer: LighterWasmSigner.ts at 40% stmts, 22.44% branch, 22.22% funcs, 39.06% lines
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
