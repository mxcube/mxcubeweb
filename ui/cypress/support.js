/* global Cypress, cy */
import '@testing-library/cypress/add-commands';

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
  Cypress.on('uncaught:exception', (err, runnable) => {
    return false;
  });

  // control only needs to be taken, when observer mode is present
  cy.get('body').then(($body) => {
    if ($body.text().includes('Observer mode')) {
      cy.findByRole('button', { name: 'OK' }).click();
      cy.findByRole('link', { name: /Remote/u, hidden: true }).click();
      cy.findByRole('button', { name: 'Take control' }).click();
      cy.visit(returnPage);
    }
  });

  // tell cypress to listen to any uncaught:execptions again
  Cypress.on('uncaught:exception', (err, runnable) => {
    return true;
  });
});

Cypress.Commands.add('mountSample', (sample = 'test', protein = 'test') => {
  cy.visit('/datacollection');
  cy.findByRole('button', { name: /Queued Samples/u }).click();
  cy.findByRole('button', { name: 'Create new sample' }).click();
  cy.findByLabelText('Sample name').type(sample);
  cy.findByLabelText('Protein acronym').type(protein);
  cy.findByRole('button', { name: 'Mount' }).click();
  // reload for button changes to take effect
  cy.reload();
});

Cypress.Commands.add('clearSamples', (returnPage = '/datacollection') => {
  cy.findByText('Samples').click();
  cy.findByRole('button', { name: /Clear sample list/u }).click('left');
  cy.findByRole('button', { name: 'Ok' }).click();
  cy.visit(returnPage);
});
