Cypress.Commands.add('login', (username, password) => {
  cy.visit('http://localhost:8081');
  cy.get('input[placeholder*="Login ID"]').type('idtest0');
  cy.get('input[placeholder*="Password"]').type('0000');
  cy.get('button[type=submit]').click();
  cy.get('[class=navbar-brand]').contains('MXCuBE');
});

describe('login', () => {
  it('cant login with invalid credentials', () => {
    cy.visit('http://localhost:8081');
    cy.get('input[placeholder*="Login ID"]').type('idte0');
    cy.get('input[placeholder*="Password"]').type('0000');
    cy.get('button[type=submit]').click();
    cy.get('pre*[class^="Login_error"]').should('be.visible');
  });

  it('can login with valid credentials', () => {
    cy.visit('http://localhost:8081');
    cy.get('input[placeholder*="Login ID"]').type('idtest0');
    cy.get('input[placeholder*="Password"]').type('0000');
    cy.get('button[type=submit]').click();
    cy.get('[class=navbar-brand]').contains('MXCuBE');
  });
});

describe('app', () => {
  beforeEach(() => {
    cy.login();
  });

  it('displays collection page', () => {
    cy.visit('http://localhost:8081');
    cy.get('[class=navbar-brand]').contains('MXCuBE');
  });
});
