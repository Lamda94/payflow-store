module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      files: ['jest.setup.js'],
      env: { jest: true },
    },
    {
      // R15.2: domain es TypeScript puro — cero React/RN/Redux/HTTP
      files: ['src/domain/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: [
                  'react',
                  'react-*',
                  '@react-native*',
                  '@reduxjs/*',
                  'redux*',
                  '**/services/**',
                  '**/store/**',
                  '**/ui/**',
                  '**/navigation/**',
                ],
                message:
                  'src/domain debe ser TypeScript puro: sin React/RN/Redux ni capas externas (R15.2).',
              },
            ],
          },
        ],
      },
    },
    {
      // R15.2: HTTP solo desde thunks del store — la UI nunca importa services
      files: ['src/ui/**/*.{ts,tsx}', 'src/navigation/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['**/services/**'],
                message:
                  'La UI no llama HTTP: despacha thunks del store que usan services (R15.2).',
              },
            ],
          },
        ],
      },
    },
  ],
};
