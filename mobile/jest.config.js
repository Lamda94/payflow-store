module.exports = {
  preset: 'react-native',
  setupFiles: [
    '<rootDir>/jest.setup.js',
    'react-native-gesture-handler/jestSetup.js',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-async-storage/async-storage|react-native-safe-area-context|react-native-screens|react-native-gesture-handler|@react-navigation|immer|react-redux)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'App.tsx',
    '!**/*.d.ts',
    // type-only modules and thin re-exports — no runtime logic to cover
    '!src/domain/types.ts',
    '!src/domain/card/types.ts',
    '!src/store/hooks.ts',
    '!src/navigation/types.ts',
    '!src/ui/theme/index.ts',
    '!src/test-utils/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
