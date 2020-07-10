module.exports = {
  testResultsProcessor: './node_modules/jest-junit-reporter',
    preset: 'ts-jest',
    globals: {
    'ts-jest': {
      diagnostics: false,
      tsConfig: 'tsconfig.test.json',
    },
  },
  coverageThreshold: {
    "**/*.ts": {
      statements: 80,
    },
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
};
