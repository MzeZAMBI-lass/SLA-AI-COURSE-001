module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/setupEnv.ts'],
  collectCoverageFrom: ['src/services/**/*.ts', 'src/middleware/**/*.ts'],
  coverageThreshold: {
    global: { lines: 70 },
  },
};
