// This is a convenience field for what rules we want to use
const rules = {
  'semi': ['error', 'always'],
  '@typescript-eslint/camelcase': 'off',
  'comma-dangle': ["error", "always-multiline"],
  indent: ['error', 2],
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  'node/no-unsupported-features/es-syntax': ['error', { ignores: ['modules'] }],
};

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    tsconfigRootDir: __dirname,
    project: [
      './tsconfig.json',
      './tsconfig.test.json',
    ],
  },
  plugins: [
    '@typescript-eslint',
    'prettier'
  ],
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
  ],
  env: {
    'node': true,
  },
  rules: {
    ...rules,
  },
  settings: {
    node: {
      allowModules: ['jest', 'nock', 'supertest'],
      tryExtensions: ['.js', '.json', '.node', '.ts', '.d.ts'],
    },
  },
  overrides: [
    {
      files: ['*.test.ts'],
      rules: {
        '@typescript-eslint/unbound-method': 0,
      },
    },
  ],
  ignorePatterns: [
    'dist/',
    'bin/',
    'dev/'
  ],
};
