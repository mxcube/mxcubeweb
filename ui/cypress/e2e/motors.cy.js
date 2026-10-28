/* global cy, it, describe, beforeEach */

describe('Motors', () => {
  beforeEach(() => {
    cy.loginWithControl();
  });

  it('can control motors with all display variants', () => {
    cy.findByLabelText('Phase Control').select('COLLECT');
    cy.findByLabelText('Phase Control').should('have.value', 'COLLECT');

    cy.findByLabelText('Beam size').select('A20');
    cy.findByLabelText('Beam size').should('have.value', 'A20');

    cy.findByLabelText('Omega').then(($el) => {
      const isSelect = $el.is('select');
      const variants = isSelect
        ? [...$el.find('option')].map((opt) => opt.value)
        : ['value'];

      cy.wrap(variants).each((variant) => {
        if (isSelect) {
          cy.findByLabelText('Omega').select(variant);
        }

        switch (variant) {
          case 'dial': {
            cy.get('svg').should('be.visible');

            break;
          }
          case 'slider': {
            cy.findByLabelText('Omega')
              .should('be.visible')
              .invoke('val', 180)
              .trigger('input')
              .trigger('change')
              .trigger('pointerup');

            break;
          }
          case 'value': {
            cy.findByLabelText('Omega')
              .should('be.visible')
              .type('{selectAll}200{enter}');

            break;
          }
          // No default
        }
      });
    });

    cy.findByRole('button', { name: 'Show motors' }).click();

    cy.findByLabelText('Focus').type('{selectAll}1.1116{enter}');
    cy.findByLabelText('Focus').should('have.value', '1.112');

    // Move sample with two-axis control
    cy.findByLabelText('Sample Vertical')
      .invoke('val')
      .then((initialValue) => {
        cy.findByRole('button', { name: 'Move down' }).click();
        cy.findByLabelText('Sample Vertical').should(
          'have.value',
          (Number.parseFloat(initialValue) - 0.1).toFixed(3),
        );
      });

    // Change step of "Sample vertical" motor (in "Sample alignment motors" tooltip)
    cy.findByRole('button', { name: 'Show sample alignment motors' }).click();
    cy.findByTestId('TwoAxisTranslationControl_sample_vertical_step').type(
      '{selectall}1{esc}',
    );

    // Move sample with two-axis control again to check that new step is used
    cy.findByLabelText('Sample Vertical')
      .invoke('val')
      .then((initialValue) => {
        cy.findByRole('button', { name: 'Move up' }).click();
        cy.findByLabelText('Sample Vertical').should(
          'have.value',
          (Number.parseFloat(initialValue) + 1).toFixed(3),
        );
      });

    // Move "X" motor with keyboard (up arrow)
    cy.findByLabelText('X')
      .invoke('val')
      .then((initialValue) => {
        cy.findByLabelText('X').type('{upArrow}');
        cy.findByLabelText('X').should(
          'have.value',
          (Number.parseFloat(initialValue) + 0.1).toFixed(3),
        );
      });

    // Move "Y" motor with down arrow button
    cy.findByLabelText('Y')
      .invoke('val')
      .then((initialValue) => {
        cy.findByTestId('MotorInput_phiy_down').click();
        cy.findByLabelText('Y').should(
          'have.value',
          (Number.parseFloat(initialValue) - 0.1).toFixed(3),
        );
      });
  });
});
