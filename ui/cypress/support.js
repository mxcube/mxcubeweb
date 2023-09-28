/* global Cypress, cy */
import '@testing-library/cypress/add-commands';

Cypress.Commands.add('login', (username = 'idtest0', password = '0000') => {
  cy.visit('http://127.0.0.1:8888');
  cy.findByRole('heading', { name: 'MXCuBE' }).should('be.visible');
  cy.findByLabelText('Login ID').type(username);
  cy.findByLabelText('Password').type(password);
  cy.findByRole('button', { name: 'Sign in' }).click();
});
