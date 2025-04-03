/**
 * Jest configuration for end-to-end tests with Puppeteer
 */

module.exports = {
  testEnvironment: 'node',
  testTimeout: 60000, // Keep increased timeout for now
  verbose: true,
  testMatch: ['**/tests/e2e/**/*.test.js'],
  globalSetup: './globalSetup.js', // Path relative to rootDir
  globalTeardown: './globalTeardown.js', // Path relative to rootDir
};
