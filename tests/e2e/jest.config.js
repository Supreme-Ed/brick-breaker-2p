/**
 * Jest configuration for end-to-end tests with Puppeteer
 */

module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000, // Increase timeout for e2e tests
  verbose: true,
  testMatch: ['**/tests/e2e/**/*.test.js'],
};
