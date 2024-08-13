/* global cy, it, describe, beforeEach, Cypress */

describe('3-click centring', () => {
  beforeEach(() => {
    cy.login();
    cy.findByRole('heading', { name: 'MXCuBE-Web (OSC)' }).should('be.visible');
    cy.takeControl();
  });

  it('3-click centring should not work without sample', () => {
    cy.clearSamples();
    cy.findByRole('button', { name: '3-click centring' }).click();
    cy.findByRole('alert', 'Error: There is no sample mounted').should(
      'be.visible',
    );
  });

  it.skip('Each click is rotating the sample by 90 degrees', () => {
    cy.mountSample();
    cy.findByRole('button', { name: 'Sample: test - test' }).should(
      'be.visible',
    );
    cy.findByRole('button', { name: '3-click centring' }).click();
    cy.get('.form-control[name="diffractometer.phi"]')
      .invoke('val')
      .then((value) => {
        let omegaValue = Number.parseFloat(value);
        Cypress._.times(2, () => {
          omegaValue += 90;
          cy.get('.canvas-container').click();
          // to update the omega value, a small amount of time must be waited and the page reloaded
          cy.wait(1000);
          cy.reload();
          // press the centring button again after reload to stay in the correct mode
          cy.findByRole('button', { name: '3-click centring' }).click();
          cy.get('.form-control[name="diffractometer.phi"]')
            .invoke('val')
            .should('equal', omegaValue.toFixed(2));
        });
      });
  });
});
