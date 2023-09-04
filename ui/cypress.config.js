const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8081',
    supportFile: 'cypress/support.js',
    screenshotsFolder: 'cypress/debug',
  },
});
