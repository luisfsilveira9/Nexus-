// NX-015 (ADR-002): ESLint (configuração flat) com typescript-eslint e react-hooks.
// Regra só para src/engine/: o motor é puro. Proíbe relógio, sorteio global, DOM, timers, rede e
// imports de React, da UI, do app e do save. Assim a pureza é checada pela máquina (C1, C2).
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

/** Globais que o motor não pode tocar. */
export const GLOBAIS_PROIBIDOS_NO_MOTOR = [
  'Date',
  'performance',
  'window',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'globalThis',
  'self',
  'setTimeout',
  'setInterval',
  'clearTimeout',
  'clearInterval',
  'requestAnimationFrame',
  'queueMicrotask',
  'fetch',
  'XMLHttpRequest',
  'crypto',
  'process',
  'console',
];

export default defineConfig([
  globalIgnores([
    'dist',
    'dist-teste',
    'coverage',
    'playwright-report',
    'test-results',
    'docs',
    'assets',
    'public',
    'node_modules',
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ['src/engine/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        ...GLOBAIS_PROIBIDOS_NO_MOTOR.map((name) => ({
          name,
          message: 'O motor é puro (ADR-002): tempo e sorteio entram por parâmetro.',
        })),
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Use o sorteio com semente de src/engine/rng.ts (RN-009).',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react/*', 'react-dom/*'],
              message: 'Motor sem React.',
            },
            {
              group: ['**/ui/**', '**/app/**', '**/save/**', '**/content/**'],
              message: 'O motor não depende de UI, app, save nem textos.',
            },
          ],
        },
      ],
    },
  },
]);
