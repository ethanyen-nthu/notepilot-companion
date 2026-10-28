module.exports = {
  preset: 'jest-expo',
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: ['<rootDir>/tests/**/*.test.[jt]s?(x)'],
  collectCoverageFrom: ['src/domain/**/*.ts', 'src/state/model.ts', 'src/providers/**/*.ts'],
  coverageThreshold: { global: { branches: 85, functions: 90, lines: 90, statements: 90 } },
};
