/**
 * Main Jest configuration
 * 
 * This configuration will run unit tests by default.
 * For end-to-end tests, use the specific config in tests/e2e/jest.config.js
 */

module.exports = {
  testEnvironment: 'jsdom',
  verbose: true,
  testMatch: ['**/tests/unit/**/*.test.js'],
  // Exclude e2e tests from normal test runs
  testPathIgnorePatterns: ['/node_modules/', '/tests/e2e/']
};
