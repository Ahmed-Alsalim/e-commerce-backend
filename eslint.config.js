import { defineConfig } from 'eslint/config';

export default defineConfig([{
  rules: {
    'no-console': 'off',
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
      },
    ],
    eqeqeq: 'error',
    'no-duplicate-imports': 'error',
    curly: 'error',
    'object-curly-spacing': [
      'error',
      'always',
    ],
    'object-spacing': [
      error,
      'always',
    ],
    semi: [
      'error',
      'always',
    ],
    quotes: [
      'error',
      'single',
    ],
    'consistent-return': 'error',
    'no-var': 'error',
    'prefer-const': [
      'error',
      {
        destructuring: 'all',
      },
    ],
  },
}]);