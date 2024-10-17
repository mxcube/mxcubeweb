/* global cy, it, describe, beforeEach */

describe('3-click centring', () => {
  beforeEach(() => {
    cy.loginWithControl();
  });

  it('displays error when no sample is mounted', () => {
    cy.clearSamples(); // another test may have mounted a sample
    cy.findByRole('link', { name: /Data collection/u, hidden: true }).click();

    cy.findByRole('button', { name: '3-click centring' }).click();
    cy.findByRole('alert', 'Error: There is no sample mounted').should(
      'be.visible',
    );
  });

  it('rotates sample by 90 degrees on click', () => {
    cy.mountSample();
    cy.findByRole('button', { name: 'Sample: test - test' }).should(
      'be.visible',
    );

    cy.findByRole('button', { name: '3-click centring' }).click();
    cy.findByText(/Clicks left: 3/u, { hidden: true }).should('exist');

    cy.findByTestId('MotorInput_value_diffractometer.phi')
      .invoke('val')
      .then((initialValue) => {
        cy.get('.canvas-container').click();
        cy.findByText(/Clicks left: 2/u, { hidden: true }).should('exist');

        // Wait for omega motor to finish moving
        cy.wait(1000);

        cy.findByTestId('MotorInput_value_diffractometer.phi')
          .invoke('val')
          .should('equal', (Number.parseFloat(initialValue) + 90).toFixed(2));
      });
  });
});
