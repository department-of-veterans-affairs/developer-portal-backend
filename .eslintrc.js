// These rules are set due to various eslint errors we get when upgrading
const getThingsWorkingRules = {
  '@typescript-eslint/no-unsafe-return': 'off',
  '@typescript-eslint/no-unsafe-call': 'off',
  '@typescript-eslint/no-unsafe-member-access': 'off',
  '@typescript-eslint/restrict-template-expressions': 'off',
  '@typescript-eslint/no-unsafe-assignment': 'off',
  '@typescript-eslint/ban-types': 'off',
  '@typescript-eslint/restrict-plus-operands': 'off',
  '@typescript-eslint/no-var-requires': 'off',
};

// This is a convenience field for what rules we want to use
const rules = {
  'semi': ['error', 'always'],
  '@typescript-eslint/camelcase': 'off',
  'comma-dangle': ["error", "always-multiline"],
  indent: ['error', 2],
};

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
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  env: {
    'node': true,
  },
  rules: {
    ...getThingsWorkingRules,
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
  ignorePatterns: [
    'dist/',
    'bin/',
    'dev/'
  ],
};
