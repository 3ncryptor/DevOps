/**
 * Jest Configuration for Zentra E-Commerce Platform
 * ESM Support with Node.js
 */

export default {
  // Test environment
  testEnvironment: "node",

  // Transform files
  transform: {},
  
  // File extensions
  moduleFileExtensions: ["js", "json"],

  // Test match patterns
  testMatch: [
    "**/tests/**/*.test.js",
    "**/__tests__/**/*.test.js"
  ],

  // Coverage configuration
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/index.js",
    "!src/app.js",
    "!src/**/*.config.js",
    "!src/docs/**",
    "!src/constants/**"
  ],

  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html", "json-summary"],
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  // Ignore patterns
  testPathIgnorePatterns: [
    "/node_modules/",
    "/public/",
    "/logs/",
    "/coverage/"
  ],

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Detect open handles
  detectOpenHandles: false,

  // Force exit
  forceExit: true
};
