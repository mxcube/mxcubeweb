/* global Cypress, cy */
import '@testing-library/cypress/add-commands';

Cypress.Commands.add('login', (username = 'idtest0', password = '0000') => {
  cy.visit('/');
  cy.findByRole('heading', { name: 'MXCuBE' }).should('be.visible');
  cy.findByLabelText('Login ID').type(username);
  cy.findByLabelText('Password').type(password);
  cy.findByRole('button', { name: 'Sign in' }).click();
});

Cypress.Commands.add('takeControl', () => {
  /* firefox (only firefox) throws an unhandled promise error when executing
     this function. Hence, we tell cypress to ignore this, otherwise the tests
     fail, when we try to click the observer mode dialog away. */
  Cypress.on('uncaught:exception', (err, runnable) => {
    return false;
  });

  // ensure to click away the observer mode dialog box if present
  /* eslint-disable-next-line promise/catch-or-return, promise/prefer-await-to-then */
  cy.findByRole('dialog').then(($dialog) => {
    if ($dialog.text().includes('Observer mode')) {
      cy.wrap($dialog.find('.form-control')).type('test');
      cy.findByText('OK').click();
    }
  });
  cy.request('POST', '/mxcube/api/v0.1/ra/take_control');

  // tell cypress to listen to any uncaught:execptions again
  Cypress.on('uncaught:exception', (err, runnable) => {
    return true;
  });
});

Cypress.Commands.add('mountSample', (sample = 'test', protein = 'test') => {
  cy.visit('/datacollection');
  cy.findByRole('button', { name: /Queued Samples/u }).click();
  cy.findByText('Create new sample').click();
  cy.findByLabelText('Sample name').type(sample);
  cy.findByLabelText('Protein acronym').type(protein);
  cy.findByText('Mount').click();
  // reload for button changes to take effect
  cy.reload();
});
