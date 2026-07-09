/* global cy, it, describe, beforeEach */

describe('Sample list view context menu', () => {
  beforeEach(() => {
    cy.loginWithControl();
    cy.clearSamples(); // another test may have mounted a sample
    // clearSamples() navigates to the /samplegrid page via the "Samples"
    // nav link; mountSample() expects to start from Data collection
    cy.findByRole('link', { name: /Data collection/u, hidden: true }).click();
  });

  it('opens on right-click and closes when clicking outside', () => {
    cy.mountSample();

    cy.findByText('Samples').click();

    // Right-click the mounted sample row to open its generic context menu.
    cy.findByText('test - test').rightclick();

    cy.findByRole('menu').should('have.class', 'show');
    cy.findByText('Add to Queue').should('be.visible');

    cy.get('body').click(5, 5);
    cy.findByRole('menu', { hidden: true }).should('not.have.class', 'show');
  });
});
