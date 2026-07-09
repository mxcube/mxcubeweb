/* global cy, it, describe, beforeEach */

describe('Sample view context menu', () => {
  beforeEach(() => {
    cy.loginWithControl();
  });

  it('opens on right-click and closes when clicking outside', () => {
    cy.get('#insideWrapper').rightclick(100, 100);

    cy.findByRole('menu').should('have.class', 'show');
    cy.findByText('Go to Beam').should('be.visible');
    cy.findByText('Measure Distance').should('be.visible');
    // this would be somewhere outside the context menu; it shall disappear.
    cy.get('body').click(5, 5);
    cy.findByRole('menu', { hidden: true }).should('not.have.class', 'show');
  });
});
