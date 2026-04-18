const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run build && npx serve -l 5173 .',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    { name: 'mobile',  use: { viewport: { width: 375,  height: 812  } } },
    { name: 'tablet',  use: { viewport: { width: 768,  height: 1024 } } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 800  } } },
    { name: 'wide',    use: { viewport: { width: 1440, height: 900  } } },
  ],
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    },
  },
});
