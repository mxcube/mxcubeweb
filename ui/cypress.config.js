import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:8081',
    supportFile: 'cypress/support.js',
    screenshotsFolder: 'cypress/debug',
  },
  viewportWidth: 1200,
  viewportHeight: 800,
});
