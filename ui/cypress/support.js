/* global Cypress, cy, beforeEach */
import '@testing-library/cypress/add-commands';
import installLogsCollector from 'cypress-terminal-report/src/installLogsCollector.js';

installLogsCollector();

beforeEach(() => {
  cy.visit('/');
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

Cypress.Commands.add('clearSamples', () => {
  cy.findByText('Samples').click();
  cy.findByRole('button', { name: /Clear sample list/u }).click('left');
  cy.findByRole('button', { name: 'Clear' }).click();
});
