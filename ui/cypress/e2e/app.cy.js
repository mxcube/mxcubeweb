/* global cy, it, describe, beforeEach */

describe('app', () => {
  beforeEach(() => {
    cy.loginWithControl();
  });

  it('displays collection page', () => {
    cy.findByRole('button', { name: /Beamline Actions/u }).should('be.visible');
  });
});
