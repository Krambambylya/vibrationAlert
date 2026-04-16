const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const layerImportRules = {
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        {
          group: ['@/app/**', '@/processes/**'],
          message: 'pages can only depend on widgets, features, entities, and shared.',
        },
      ],
    },
  ],
};

module.exports = defineConfig([
  ...expoConfig,
  {
    files: ['src/pages/**/*.{ts,tsx}'],
    rules: layerImportRules,
  },
  {
    files: ['src/widgets/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/**', '@/processes/**', '@/pages/**', '@/widgets/**'],
              message: 'widgets can only depend on features, entities, and shared.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/**', '@/processes/**', '@/pages/**', '@/widgets/**', '@/features/**'],
              message: 'features can only depend on entities and shared.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/entities/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/app/**',
                '@/processes/**',
                '@/pages/**',
                '@/widgets/**',
                '@/features/**',
                '@/entities/**',
              ],
              message: 'entities can only depend on shared.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/**', '@/processes/**', '@/pages/**', '@/widgets/**', '@/features/**', '@/entities/**'],
              message: 'shared must be independent from business layers.',
            },
          ],
        },
      ],
    },
  },
]);
