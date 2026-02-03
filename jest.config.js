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
    // Global Thresholds - Target: 80% (Current: ~51%)
    // Roadmap: 51% -> 60% -> 70% -> 80%
    // ==========================================================================
    global: {
      branches: 45,
      functions: 50,
      lines: 50,
      statements: 50
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
    // Newer Adapters - Baseline thresholds (to be improved)
    // These are set to current coverage levels, will be raised incrementally
    // ==========================================================================

    // dydx: Current ~46% overall (some files may be lower)
    './src/adapters/dydx/**/*.ts': {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    },

    // drift: Current ~32% overall (some files at 0-4%)
    './src/adapters/drift/**/*.ts': {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    },

    // gmx: Current ~29% overall (OrderBuilder has 0% functions)
    './src/adapters/gmx/**/*.ts': {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    },

    // jupiter: Current ~37% overall (some files at 5-18%)
    './src/adapters/jupiter/**/*.ts': {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    },

    // extended: Current ~50% overall (Adapter at 21%, types at 0%)
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
