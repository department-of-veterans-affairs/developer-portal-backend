module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: [
      './tsconfig.json',
      './tsconfig.test.json',
    ],
  },
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  env: {
    'node': true,
  },
  rules: {
    'semi': ['error', 'always'],
    '@typescript-eslint/camelcase': 'off',
    'comma-dangle': ["error", "always-multiline"],
    indent: ['error', 2],
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
