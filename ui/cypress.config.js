import { defineConfig } from 'cypress';
import installLogsPrinter from 'cypress-terminal-report/src/installLogsPrinter.js';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support.js',
    screenshotsFolder: 'cypress/debug',
    setupNodeEvents(on) {
      installLogsPrinter(on);
    },
  },
  viewportWidth: 2048,
  viewportHeight: 1024,
});
