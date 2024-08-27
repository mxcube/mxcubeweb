/* global Cypress, cy */
import '@testing-library/cypress/add-commands';
import installLogsCollector from 'cypress-terminal-report/src/installLogsCollector.js';

installLogsCollector();

Cypress.Commands.add('login', (username = 'idtest0', password = '0000') => {
  cy.visit('/');
  cy.findByRole('heading', { name: 'MXCuBE' }).should('be.visible');
  cy.findByLabelText('Login ID').type(username);
  cy.findByLabelText('Password').type(password);
  cy.findByRole('button', { name: 'Sign in' }).click();
});

Cypress.Commands.add('takeControl', (returnPage = '/datacollection') => {
  /* firefox (only firefox) throws an unhandled promise error when executing
     this function. Hence, we tell cypress to ignore this, otherwise the tests
     fail, when we try to click the observer mode dialog away. */
  Cypress.on('uncaught:exception', () => false);

  // control only needs to be taken, when observer mode is present
  cy.get('body').then(($body) => {
    if ($body.text().includes('Observer mode')) {
      cy.findByRole('button', { name: 'Continue' }).click();
      cy.findByRole('link', { name: /Remote/u, hidden: true }).click();
      cy.findByRole('button', { name: 'Take control' }).click();
    }
  });

  // tell cypress to listen to any uncaught:execptions again
  Cypress.on('uncaught:exception', () => true);
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
  cy.findByRole('button', { name: 'Mount' }).click();

  // Wait for "Queued Samples" tab to no longer be selected to ensure that mount command has been sent
  cy.findByRole('button', { name: /Queued Samples/u }).should(
    'not.have.class',
    'active',
  );

  // Reload to see mounted sample (until WebSockets are fixed on CI)
  cy.reload();
});

Cypress.Commands.add('clearSamples', () => {
  cy.findByText('Samples').click();
  cy.findByRole('button', { name: /Clear sample list/u }).click('left');
  cy.findByRole('button', { name: 'Ok' }).click();
});
