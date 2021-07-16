// This is a convenience field for what rules we want to use
const rules = {
  semi: ['error', 'always'],
  '@typescript-eslint/camelcase': 'off',
  'comma-dangle': ['error', 'always-multiline'],
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
};

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json', './tsconfig.test.json'],
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
  ],
  env: {
    node: true,
  },
  rules: {
    ...rules,
  },
  overrides: [
    {
      files: ['*.test.ts'],
      rules: {
        '@typescript-eslint/unbound-method': 0,
      },
    },
  ],
  ignorePatterns: ['dist/', 'bin/', 'dev/'],
};
