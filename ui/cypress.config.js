const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:8888',
    supportFile: 'cypress/support.js',
    screenshotsFolder: 'cypress/debug',
    setupNodeEvents(on, config) {
      // bind to the event we care about
      require('cypress-log-to-output').install(on);
    },
  },
});
