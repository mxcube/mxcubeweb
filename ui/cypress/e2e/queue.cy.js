/* global cy, it, describe, beforeEach */

describe('queue', () => {
  beforeEach(() => {
    cy.login();
    cy.findByRole('heading', { name: 'MXCuBE-Web (OSC)' }).should('be.visible');
    cy.takeControl();
  });

  it('mount a test sample', () => {
    cy.mountSample('test', 'test');
    cy.findByText('Sample: test - test').should('be.visible');
  });
});
