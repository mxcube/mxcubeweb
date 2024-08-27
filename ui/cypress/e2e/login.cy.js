/* global cy, it, describe */

describe('login', () => {
  it("can't login with invalid credentials", () => {
    cy.login('idte0', '0000');
    cy.findByText('Could not authenticate').should('be.visible');
  });

  it("can't login with reserved password: wrong", () => {
    cy.login('idtest0', 'wrong');
    cy.findByText('Could not authenticate').should('be.visible');
  });

  it("can't login with reserved password: ispybDown", () => {
    cy.login('idtest0', 'ispybDown');
    cy.findByText('Could not authenticate').should('be.visible');
  });

  it('can login with valid credentials', () => {
    cy.login();
    cy.findByRole('heading', { name: 'MXCuBE-Web (OSC)' }).should('be.visible');
  });

  it('can log out and log back in', () => {
    cy.login();
    cy.findByRole('heading', { name: 'MXCuBE-Web (OSC)' }).should('be.visible');

    // Dismiss observer dialog if any
    cy.get('body').then(($body) => {
      if ($body.text().includes('Observer mode')) {
        cy.findByRole('button', { name: 'Continue' }).click();
      }
    });

    // Log out
    cy.findByRole('button', { name: /Sign out/u, hidden: true }).click();

    // Log back in
    cy.login();
    cy.findByRole('heading', { name: 'MXCuBE-Web (OSC)' }).should('be.visible');
  });
});
