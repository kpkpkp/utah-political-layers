import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.js',
  timeout: 60000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'cd public && python3 -m http.server 8080',
    port: 8080,
    timeout: 10000,
    reuseExistingServer: true,
  },
});
