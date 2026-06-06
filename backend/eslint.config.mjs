// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'prisma/migrations',
      'eslint.config.mjs',
      'test/jest-e2e.config.js',
      'jest.config.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.eslint.json',
        },
      },
    },
    rules: {
      // NestJS: classes with only decorators are common, so disable.
      '@typescript-eslint/no-extraneous-class': 'off',
      // Allow `_` prefix to opt out of unused checks (matches our style).
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Force awaiting / handling of returned promises — the single most
      // common source of swallowed errors in async code.
      '@typescript-eslint/no-floating-promises': 'error',
      // Throw on require('x') outside of build configs.
      '@typescript-eslint/no-require-imports': 'error',
      // Import ordering for stable diffs.
      'import/order': [
        'warn',
        {
          groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      // Prisma client types come from generated code; import resolver
      // doesn't always find them. Disable the noisy check.
      'import/no-unresolved': 'off',
      'import/named': 'off',
      'import/namespace': 'off',
    },
  },
  {
    // Tests routinely poke at typed-as-any helpers (supertest's `App` type
    // does not align with Node http.Server) and assert against arbitrary
    // response bodies, so the `no-unsafe-*` family creates noise without
    // value here.
    files: ['test/**/*.ts', 'src/**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
);
