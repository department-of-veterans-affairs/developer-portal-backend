module.exports = {
  testResultsProcessor: './node_modules/jest-junit-reporter',
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      diagnostics: false,
      tsconfig: 'tsconfig.test.json',
    },
  },
  coverageThreshold: {
    '**/*.ts': {
      statements: 80,
    },
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testEnvironment: 'node',
  setupFiles: ['./dotenv-config.js'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec|integration))\\.[jt]sx?$',
};
