module.exports = {
  testResultsProcessor: './node_modules/jest-junit-reporter',
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      diagnostics: false,
      tsConfig: 'tsconfig.test.json'
    }
  },
  coverageThreshold: {
    '**/*.ts': {
      statements: 80
    }
  },
  testMatch: ['**/?(*.)+(integration|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/']
};
