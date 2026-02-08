import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import boundaries from 'eslint-plugin-boundaries'
import ts from 'typescript-eslint'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

const boundariesConfig = {
  files: ['**/*.{ts,tsx}'],

  ignores: [
    'eslint.config.mjs',
    '*.config.js',
    '*.config.ts',
    '*.config.cjs',
    '*.setup.ts',
    'next-env.d.ts',
    '.next/**/*',
    'public/**/*',
    '@types/**/*',
    'node_modules/**/*',
    '.git/**/*',
    '.vscode/**/*',
    'tsconfig.json',
    'package.json',
    'pnpm-lock.yaml',
    'README.md',
    'middleware.ts',
    'i18n/**/*',
    'ui-kit-plugin.ts',
  ],

  plugins: { boundaries },

  settings: {
    'boundaries/elements': [
      {
        mode: 'full',
        type: 'shared',
        pattern: [
          'components/**/*',
          'lib/**/*',
          'hooks/**/*',
          'data/**/*',
          'server/**/*',
          'utils/**/*',
          'providers/**/*',
          'types/**/*',
          'schemas/**/*',
        ],
      },
      {
        mode: 'full',
        type: 'feature',
        capture: ['featureName'],
        pattern: ['features/([^/]+)/**/*'],
      },
      {
        mode: 'full',
        type: 'feature',
        capture: ['featureName'],
        pattern: ['app/api/([^/]+)/**/*'],
      },
      {
        mode: 'full',
        type: 'feature',
        capture: ['featureName'],
        pattern: ['app/\\[locale\\]/\\([^)]+\\)/([^/]+)/**/*'],
      },
      {
        mode: 'full',
        type: 'app',
        pattern: [
          'app/\\[locale\\]/+(layout|page|loading|error|not-found|template|global-error).tsx$',
          'app/\\[locale\\]/\\([^)]+\\)/+(layout|page|loading|error|not-found|template|global-error).tsx$',
        ],
      },
      {
        mode: 'full',
        type: 'app',
        pattern: [
          'app/+(layout|page|loading|error|not-found|template|global-error|manifest|sitemap|robots).+(ts|tsx)$',
        ],
      },
      {
        mode: 'full',
        type: 'app',
        capture: ['_', 'fileName'],
        pattern: ['app/**/*'],
      },
      { mode: 'full', type: 'neverImport', pattern: ['tasks/**/*'] },
      { mode: 'full', type: 'i18n', pattern: ['i18n/**/*'] },
    ],
  },
  rules: {
    'boundaries/no-unknown': ['error'],
    'boundaries/no-unknown-files': ['error'],
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [
          { from: ['shared'], allow: ['shared', 'i18n'] },
          {
            from: ['feature'],
            allow: ['shared', ['feature', { featureName: '${from.featureName}' }]],
          },
          {
            from: ['app', 'neverImport'],
            allow: ['shared', 'feature', 'i18n'],
          },
          { from: ['app'], allow: [['app', { fileName: '*.css' }]] },
        ],
      },
    ],
  },
}

const eslintConfig = [
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],

    settings: {
      next: {
        rootDir: '.',
      },
    },
  }),

  js.configs.recommended,
  ...ts.configs.recommended,
  boundariesConfig,

  {
    rules: {
      // NOTE: Temporary disabled for now. Not working as expected with react compiler
      'react-hooks/exhaustive-deps': 'off',
    },
  },

  {
    ignores: ['.next/**/*', 'node_modules/**/*', 'public/**/*'],
  },
]

export default eslintConfig
