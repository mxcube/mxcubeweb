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

  it('unmount sample and clear queue on log out', () => {
    cy.mountSample('foo', 'bar');
    cy.findByRole('button', { name: 'Sample: bar - foo' }).should('be.visible');

    cy.findByRole('button', { name: /Sign out/u, hidden: true }).click();
    cy.login();

    cy.findByRole('button', { name: 'Sample: bar - foo' }).should('not.exist');
    cy.findByRole('button', { name: 'Current' }).should('be.visible');
    cy.findByRole('button', { name: 'Queued Samples (0)' }).should(
      'be.visible',
    );
  });
});
