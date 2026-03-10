import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import ts from 'typescript-eslint'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

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

  {
    rules: {
      'react-hooks/exhaustive-deps': 'off',
    },
  },

  {
    ignores: [
      '.next/**/*',
      'node_modules/**/*',
      'public/**/*',
      'contracts/**/*',
      'prisma/**/*',
      'scripts/**/*',
      'sybil-airdrop/**/*',
    ],
  },
]

export default eslintConfig
