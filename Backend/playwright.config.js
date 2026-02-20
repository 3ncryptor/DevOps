import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for API E2E Tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  // Run tests in files in parallel
  fullyParallel: false,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL for API requests
    baseURL: process.env.API_BASE_URL || 'http://localhost:8000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Extra HTTP headers to be sent with every request
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },

  // Configure projects for different test scenarios
  projects: [
    {
      name: 'api-tests',
      use: { 
        ...devices['Desktop Chrome'],
        // API testing doesn't need browser context
        contextOptions: {
          ignoreHTTPSErrors: true,
        }
      },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NODE_ENV: 'test',
      PORT: '5000',
    },
  },
});
