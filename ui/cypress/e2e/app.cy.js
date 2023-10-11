/* global cy, it, describe, beforeEach */

describe('login', () => {
  it("can't login with invalid credentials", () => {
    cy.login('idte0', '0000');
    cy.findByText('Could not authenticate').should('be.visible');
  });

  it('can login with valid credentials', () => {
    cy.login();
    cy.findByRole('link', { name: 'MXCuBE-Web (OSC)' }).should('be.visible');
  });
});

describe('app', () => {
  beforeEach(() => {
    cy.login();
    cy.findByRole('link', { name: 'MXCuBE-Web (OSC)' }).should('be.visible');
  });

  it('displays collection page', () => {
    cy.findByRole('button', { name: /Beamline Actions/u }).should('be.visible');
  });
});
