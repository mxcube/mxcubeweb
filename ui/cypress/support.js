/* global Cypress, cy, beforeEach, afterEach */
import '@testing-library/cypress/add-commands';

import installLogsCollector from 'cypress-terminal-report/src/installLogsCollector.js';

installLogsCollector();

beforeEach(() => {
  cy.visit('/');
});

afterEach(() => {
  // Only log out if a session is actually active, so specs that never
  // logged in or failed aren't broken / failure isn't shadowed by this hook.
  cy.get('body').then(($body) => {
    if ($body.find('button:contains("Sign out")').length > 0) {
      cy.findByRole('button', { name: /Sign out/u }).click();
      cy.findByRole('button', { name: 'Sign in with proposal' }).should(
        'be.visible',
      );
    }
  });
});

Cypress.Commands.add('login', (username = 'idtest0', password = '0000') => {
  cy.findByRole('heading', { name: 'MXCuBE' }).should('be.visible');
  cy.findByLabelText('Login ID').type(username);
  cy.findByLabelText('Password').type(password);
  cy.findByRole('button', { name: 'Sign in with proposal' }).click();
});

Cypress.Commands.add('takeControl', () => {
  // control only needs to be taken, when observer mode is present
  cy.get('body').then(($body) => {
    if ($body.text().includes('Observer mode')) {
      cy.findByRole('button', { name: 'Continue' }).click();
      // Wait for the dialog to be gone, so its backdrop doesn't swallow the click
      cy.findByRole('dialog').should('not.exist');
      cy.findByRole('link', { name: /Remote/u, hidden: true }).click();
      cy.findByRole('button', { name: 'Take control' }).click();
      cy.findByRole('button', { name: 'Hide' }).click();
    }
  });
});

Cypress.Commands.add('loginWithControl', () => {
  cy.login();
  cy.findByRole('heading', { name: 'MXCuBE-Web (OSC)' }).should('be.visible');

  cy.takeControl();
  cy.findByRole('link', { name: /Data collection/u, hidden: true }).click();
  cy.findByRole('button', { name: 'Run Queue' }).should('be.visible');
});

Cypress.Commands.add('mountSample', (sample = 'test', protein = 'test') => {
  cy.findByRole('button', { name: /Queued Samples/u }).click();
  cy.findByRole('button', { name: 'Create new sample' }).click();
  cy.findByLabelText('Sample name').type(sample);
  cy.findByLabelText('Protein acronym').type(protein);
  cy.findByRole('dialog').within(() => {
    cy.findByRole('button', { name: 'Mount' }).click(); // multiple "Mount" buttons if queue isn't empty
  });

  // Wait for "Queued Samples" tab to no longer be selected to ensure that mount command has been sent
  cy.findByRole('button', { name: /Queued Samples/u }).should(
    'not.have.class',
    'active',
  );
});

// Adds a data collection task to the given sample via the sample list context
// menu, then returns to the "Data collection" page. Expects to start there too.
Cypress.Commands.add('addDataCollection', (sampleLabel = 'test - test') => {
  cy.findByText('Samples').click();

  // Right-clicking a sample row both selects it and opens its context menu
  cy.findByText(sampleLabel).rightclick();
  cy.findByRole('menu').within(() => {
    cy.findByText('Data collection').click();
  });

  cy.findByRole('dialog').within(() => {
    cy.findByText('Standard Data Collection').should('be.visible');
    cy.findByRole('button', { name: 'Add to Queue' }).click();
  });

  cy.findByRole('link', { name: /Data collection/u, hidden: true }).click();
});

Cypress.Commands.add('clearSamples', () => {
  cy.findByText('Samples').click();
  cy.findByRole('button', { name: /Clear sample list/u }).click('left');
  cy.findByRole('button', { name: 'Clear' }).click();
});
