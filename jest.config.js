module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    clearMocks: true,
    testMatch: ['**/tests/**/*.test.ts'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    setupFilesAfterEnv: ['./tests/setupTests.ts'],
  };