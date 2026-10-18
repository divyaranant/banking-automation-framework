require('dotenv').config();
const { defineConfig, devices } = require('@playwright/test');
const { loadBank, statePaths } = require('./lib/bank-context');

// One run == one bank. BANK picks the folder; SUITE (build | sit | smoke) picks the tag.
const bank = loadBank();
const suite = process.env.SUITE;

// FEATURES narrows the run to a comma-separated subset of the bank's enabled features
// (e.g. FEATURES=accounts,transfers). Unset/empty runs everything the bank supports.
const requestedFeatures = (process.env.FEATURES || '')
  .split(',')
  .map((f) => f.trim())
  .filter(Boolean);
if (requestedFeatures.some((f) => !bank.config.features.includes(f))) {
  throw new Error(
    `FEATURES contains a feature not enabled for ${bank.name}: ${requestedFeatures.join(', ')} ` +
      `(enabled: ${bank.config.features.join(', ')})`
  );
}
const features = requestedFeatures.length ? requestedFeatures : bank.config.features;

// Only the feature folders this FI actually uses are collected.
const testMatch = features.map((feature) => `**/tests/${feature}/**/*.spec.js`);

module.exports = defineConfig({
  testDir: './tests',
  testMatch,
  grep: suite ? new RegExp(`@${suite}\\b`) : undefined,
  globalSetup: require.resolve('./lib/global-setup'),

  fullyParallel: true,
  workers: Number(process.env.WORKERS || 2),
  retries: Number(process.env.RETRIES ?? (process.env.CI ? 1 : 0)),
  timeout: 45_000,
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: `reports/${bank.name}/html` }],
    ['junit', { outputFile: `reports/${bank.name}/junit.xml` }],
  ],
  outputDir: `reports/${bank.name}/artifacts`,

  use: {
    baseURL: bank.env.baseUrl,
    storageState: statePaths(bank.name).storageState,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
