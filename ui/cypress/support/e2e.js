// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')
beforeEach(() => {
  it('can login', () => {
    cy.visit('http://localhost:8081');
    cy.get('input[placeholder*="Login ID"]').type('idtest0');
    cy.get('input[placeholder*="Password"]').type('0000');
    cy.get('button[type=submit]').click();
    cy.get('[class=navbar-brand]').contains('MXCuBE');
  });
});
