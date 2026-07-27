import { defineConfig } from 'cypress';
import installLogsPrinter from 'cypress-terminal-report/src/installLogsPrinter.js';

import secondUserTasks from './cypress/secondUser.js';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support.js',
    screenshotsFolder: 'cypress/debug',
    setupNodeEvents(on, config) {
      installLogsPrinter(on);
      // register imported default secondUser object as cypress's tasks
      on('task', secondUserTasks);
      secondUserTasks['setBaseUrl'](config.baseUrl);
    },
  },
  viewportWidth: 2048,
  viewportHeight: 1024,
});
