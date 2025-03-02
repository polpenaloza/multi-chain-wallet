import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    plugins: {
      'simple-import-sort': simpleImportSortPlugin,
    },
    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // React and Next.js related packages come first
            ['^react', '^next', '^\\w'],
            // External packages
            ['^@tanstack', '^@solana', '^ethers', '^sats-connect'],
            // Internal packages/components
            ['^@/components(/.*|$)'],
            ['^@/hooks(/.*|$)'],
            ['^@/store(/.*|$)'],
            ['^@/utils(/.*|$)'],
            ['^@/lib(/.*|$)'],
            ['^@/types(/.*|$)'],
            ['^@/constants(/.*|$)'],
            // Side effect imports
            ['^\\u0000'],
            // Parent imports. Put `..` last
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            // Other relative imports. Put same-folder imports and `.` last
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            // Style imports
            ['^.+\\.?(css)$'],
          ],
        },
      ],
      // Allow unused variables that start with underscore
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
    ignores: [
      'node_modules',
      '.next',
      'out',
      'dist',
      'public',
      '.husky',
      '.github',
      '.vscode',
      '.env',
    ],
  },
]

export default eslintConfig
