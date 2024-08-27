/* global cy, it, describe, beforeEach */

describe('queue', () => {
  beforeEach(() => {
    cy.loginWithControl();
  });

  it('mount a test sample', () => {
    cy.mountSample('test', 'test');
    cy.findByText('Sample: test - test').should('be.visible');
  });
});
