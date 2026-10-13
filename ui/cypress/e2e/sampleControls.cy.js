/* global cy, it, describe, beforeEach, expect */

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

    // Read initial Omega value and calculate expected rotation
    cy.get('#MotorInput_omega').select('value');

    cy.get('input[type="number"]')
      .first()
      .then(($input) => {
        const max = Number($input.attr('max'));
        const initialOmega =
          Number($input.val()) + 90 > max
            ? Number($input.val()) - 90
            : Number($input.val());
        const expectedOmega = Number(Number(initialOmega) + 90);
        cy.wrap(expectedOmega).as('expectedOmega');
      });

    cy.get('.canvas-container').click();

    cy.findByText(/Clicks left: 2/u, { hidden: true }).should('exist');
    cy.get('@expectedOmega').then((expectedOmega) => {
      cy.get('input[type="number"]').should(($input) => {
        expect(Number($input.val())).to.be.closeTo(expectedOmega, 0.01);
      });
    });
  });
});
