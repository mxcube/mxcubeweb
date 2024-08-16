import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support.js',
    screenshotsFolder: 'cypress/debug',
  },
  viewportWidth: 1200,
  viewportHeight: 800,
});
