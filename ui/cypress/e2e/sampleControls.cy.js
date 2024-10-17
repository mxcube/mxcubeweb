/* global cy, it, describe, beforeEach */

describe('Sample controls', () => {
  beforeEach(() => {
    cy.loginWithControl();
  });

  it('3-click centring', () => {
    cy.clearSamples(); // another test may have mounted a sample
    cy.findByRole('link', { name: /Data collection/u, hidden: true }).click();

    // Start 3-click centring
    cy.findByRole('button', { name: '3-click centring' }).click();

    // Error because no sample is mounted
    cy.findByRole('alert').should('contain', 'There is no sample mounted');
    cy.findByRole('button', { name: 'Close alert' }).click();

    // Mount sample
    cy.mountSample();
    cy.findByRole('button', { name: 'Sample: test - test' }).should(
      'be.visible',
    );

    // Start 3-click centring again
    cy.findByRole('button', { name: '3-click centring' }).click();
    cy.findByText(/Clicks left: 3/u, { hidden: true }).should('exist');

    // Click on sample view to rotate sample once
    cy.findByLabelText('Omega')
      .invoke('val')
      .then((initialValue) => {
        cy.get('.canvas-container').click();
        cy.findByText(/Clicks left: 2/u, { hidden: true }).should('exist');

        cy.findByLabelText('Omega').should(
          'have.value',
          (Number.parseFloat(initialValue) + 90).toFixed(2),
        );
      });
  });
});
