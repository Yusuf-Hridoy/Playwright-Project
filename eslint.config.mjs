// What ESLint checks in this repo.
//
// Three layers, in this order:
//   1. The recommended JavaScript rules, everywhere.
//   2. The recommended TypeScript rules *with type information*, on the .ts
//      files. Type information is what makes no-floating-promises work, and
//      that rule is the one that catches a missing `await` in front of an
//      expect or a page action.
//   3. The recommended Playwright rules on the files that drive a browser.
//
// eslint-config-prettier comes last and switches off every rule about
// spacing and line breaks, so ESLint and Prettier never disagree.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier/flat';

// Everything a browser-driving file is: the specs, the one setup file, the
// page objects, the components, the fixtures and the reusable checks.
const BROWSER_FILES = [
  'tests/**/*.ts',
  'setup/**/*.ts',
  'pages/**/*.ts',
  'components/**/*.ts',
  'fixtures/**/*.ts',
  'checks/**/*.ts',
];

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'playwright-report/**',
      'blob-report/**',
      'test-results/**',
      'heal-report/**',
      'flaky-report/**',
    ],
  },

  js.configs.recommended,

  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // The helper scripts are plain Node modules, not part of the TypeScript
  // project, so they are checked without type information.
  {
    files: ['**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        TextDecoder: 'readonly',
        TextEncoder: 'readonly',
      },
    },
  },

  {
    files: BROWSER_FILES,
    extends: [playwright.configs['flat/recommended']],
    rules: {
      // The seven that matter most here are errors, not warnings. Each one
      // stands for a way a Playwright test quietly stops testing anything.
      'playwright/missing-playwright-await': 'error',
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/no-skipped-test': 'error',
      'playwright/no-force-option': 'error',
      'playwright/no-page-pause': 'error',
      'playwright/prefer-web-first-assertions': 'error',

      // The reusable checks in checks/ are all named expect-something and do
      // the asserting for the tests that call them. Without this, every test
      // that leans on one is reported as having no assertions at all.
      'playwright/expect-expect': ['warn', { assertFunctionPatterns: ['^expect'] }],
    },
  },

  prettier,
);
