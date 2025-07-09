/* global cy, it, describe, beforeEach */

describe('queue', () => {
  beforeEach(() => {
    cy.loginWithControl();
  });

  it('mount a test sample', () => {
    cy.mountSample('test', 'test');
    cy.findByRole('button', { name: 'Sample: test - test' }).should(
      'be.visible',
    );
  });

  it('queue is not cleard and sample not un-mounted on logout', () => {
    cy.mountSample('foo', 'bar');
    cy.findByRole('button', { name: 'Sample: bar - foo' }).should('be.visible');

    cy.findByRole('button', { name: /Sign out/u, hidden: true }).click();
    cy.login();

    cy.findByRole('button', { name: 'Sample: bar - foo' }).should('be.visible');
  });
});
