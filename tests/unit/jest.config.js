/**
 * Jest configuration for unit tests
 */

module.exports = {

  testEnvironment: 'jsdom',
  verbose: true,
  testMatch: ['**/tests/unit/**/*.test.{js,mjs}'],
  transform: {
    // Standard pattern for all JS files
    '^.+\.(js|mjs)$': 'babel-jest', 
  },
  // Keep ignoring node_modules explicitly
  transformIgnorePatterns: ['/node_modules/'],
  // Removing moduleNameMapper as it didn't help
  // moduleNameMapper: {
  //   '^../../js/entities/paddle.js$': '<rootDir>/js/entities/paddle.js'
  // }
};
