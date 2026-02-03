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
    // Exclude new adapters from global coverage (have separate thresholds)
    '!src/adapters/dydx/**/*.ts',
    '!src/adapters/drift/**/*.ts',
    '!src/adapters/gmx/**/*.ts',
    '!src/adapters/jupiter/**/*.ts',
    '!src/adapters/extended/**/*.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 60,
      statements: 60
    },
    // Higher threshold for utility functions and pure logic
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
    // New adapters - lower thresholds until test coverage is added
    './src/adapters/dydx/**/*.ts': {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    },
    './src/adapters/drift/**/*.ts': {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    },
    './src/adapters/gmx/**/*.ts': {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    },
    './src/adapters/jupiter/**/*.ts': {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    },
    './src/adapters/extended/**/*.ts': {
      branches: 30,
      functions: 30,
      lines: 35,
      statements: 35
    }
  },
  moduleDirectories: ['node_modules', 'src'],
  testTimeout: 10000
};
