# Testing Documentation

## Testing Guide for Zentra Commerce API

## Table of Contents
- [Overview](#overview)
- [Test Setup](#test-setup)
- [Running Tests](#running-tests)
- [Test Suites](#test-suites)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Zentra Commerce API currently has the following test coverage:

1. **Unit Tests** — Test individual utility classes in isolation
2. **Integration Tests** — Test API endpoints with a real in-memory MongoDB instance

E2E tests (Playwright) are configured but no test files exist yet. See `playwright.config.js` for the configuration when e2e tests are added.

### Test Framework Stack

- **Unit Tests**: Jest
- **Integration Tests**: Jest + Supertest + MongoDB Memory Server
- **E2E Tests**: Playwright *(configured, no tests yet)*
- **Database**: MongoMemoryReplSet (for integration tests)

---

## Test Setup

### Prerequisites

```bash
# Install dependencies
npm install

# Integration tests use MongoDB Memory Server (no external MongoDB needed)
```

---

## Running Tests

### Quick Commands

```bash
# Run all tests (unit + integration)
npm test

# Run integration tests only
npm run test:integration

# Run integration tests with verbose output
npm run test:integration:verbose

# Run integration tests in watch mode
npm run test:watch

# Run integration tests with coverage
npm run test:coverage
```

---

## Test Suites

### Unit Tests

#### 1. ApiError
**File**: `tests/unit/ApiError.test.js`

Tests the `ApiError` utility class used for structured error responses throughout the application.

#### 2. ApiResponse
**File**: `tests/unit/ApiResponse.test.js`

Tests the `ApiResponse` utility class used for consistent success response shapes.

---

### Integration Tests

#### 1. Health Check
**File**: `tests/integration/health.integration.test.js`

Tests the `/health` endpoint.

#### 2. Authentication
**File**: `tests/integration/auth.integration.test.js`

Tests auth endpoints: registration, login, token refresh, and logout.

### Integration Test Configuration

**File**: `jest.config.js`

```javascript
{
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.js'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  maxWorkers: 1, // Sequential execution for database consistency
  testTimeout: 30000
}
```

### Database Setup

Integration tests use **MongoMemoryReplSet** to provide a real MongoDB instance with replica set support (required for transactions):

**File**: `tests/setup.js`

- Starts in-memory MongoDB before all tests
- Clears database between tests
- Stops MongoDB after all tests

---

## Best Practices

### Writing Integration Tests

1. **Clean Database State**: Each test should be independent
2. **Test Both Success and Failure Cases**
3. **Use Descriptive Test Names**
4. **Always Await Async Operations**

### Writing E2E Tests (when added)

1. **Use `test.describe.configure({ mode: 'serial' })` for dependent tests**
2. **Store tokens and IDs between dependent test steps**
3. **Handle API errors gracefully with conditional skips**

---

## Troubleshooting

**Issue: Integration Tests Failing with "MongoServerError"**
```bash
# Ensure MongoDB Memory Server can initialize properly
# Verify available system memory and port availability
```

**Issue: Tests Timing Out**
```bash
# Increase timeout values in jest.config.js: testTimeout: 60000
```

**Issue: Port Already in Use**
```bash
# Terminate existing process on port 8000
lsof -ti:8000 | xargs kill -9
npm run dev
```

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
