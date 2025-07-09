/* global cy, it, describe, beforeEach */

describe('app', () => {
  beforeEach(() => {
    cy.loginWithControl();
  });

  it('can access all pages', () => {
    // Data collection
    cy.findByRole('button', { name: /Beamline Actions/u }).should('be.visible');
    cy.findByText('Energy:').should('be.visible');
    cy.findByText('Sample Changer').should('be.visible');
    cy.findByText('Omega').should('be.visible');

    // Samples list
    cy.findByRole('link', { name: 'Samples' }).click();
    cy.findByRole('button', { name: /Get samples from/u }).should('be.visible');

    // Equipment
    cy.findByRole('link', { name: 'Equipment' }).click();
    cy.findByText('Power').should('be.visible');

    // Help
    cy.findByRole('link', { name: 'Help' }).click();
    cy.findByText('Local Contact').should('be.visible');

    // Remote control
    cy.findByRole('link', { name: /Remote/u }).click();
    cy.findByText('Users').should('be.visible');
  });
});
