/* global cy, it, describe, beforeEach */

describe('unattended collect', () => {
  beforeEach(() => {
    cy.loginWithControl();
    cy.clearSamples();
    cy.findByRole('link', { name: /Samples/u, hidden: true }).click();
    cy.findByRole('button', { name: /Other LIMS Options/u }).click();
    cy.findByRole('button', { name: /Get samples from SC/u }).click();
  });

  it('edits the acquisition parameters and removes the task group', () => {
    cy.findByText('Sample-2:02').should('be.visible').rightclick();
    cy.findByRole('menu').within(() => {
      cy.findByText('Unattended collect').click();
    });
    cy.findByRole('button', { name: 'Add to Queue' }).click();
    cy.findByRole('link', { name: /Data collection/u, hidden: true }).click();
    cy.findByText('Sample-2:02').click();

    cy.findByTitle('Edit the acquisition parameters').click();
    cy.findByLabelText('Number of images').clear();
    cy.findByLabelText('Number of images').type('25');
    cy.findByRole('button', { name: 'Change' }).click();
    cy.findByText('Unattended collect (0/8)').should('be.visible');
    cy.findByText('8. Unmount').should('be.visible');

    cy.findByTitle('Edit the acquisition parameters').click();
    cy.findByLabelText('Number of images').should('have.value', '25');
    cy.findByRole('button', { name: 'Close' }).click();

    cy.findByTitle('Remove the unattended collect').click();
    cy.findByText('Unattended collect (0/8)').should('not.exist');
    cy.findByText('8. Unmount').should('not.exist');
  });

  it('queues the tasks of a sample and runs them in the "Running now" tab', () => {
    cy.findByText('Sample-2:02').should('be.visible').rightclick();
    cy.findByRole('menu').within(() => {
      cy.findByText('Unattended collect').click();
    });
    cy.findByRole('button', { name: 'Add to Queue' }).click();
    cy.findByRole('link', { name: /Data collection/u, hidden: true }).click();

    // Nothing runs: the plan is shown, the live tab is off
    cy.findByRole('button', { name: /Running now/u }).should(
      'have.class',
      'disabled',
    );
    cy.findByText('Queued Samples (1)').should('be.visible');
    cy.findByText('Sample-2:02').click();
    cy.findByText('Unattended collect (0/8)').should('be.visible');
    cy.findByText('8. Unmount').should('be.visible');

    cy.findByRole('button', { name: 'Run Queue' }).click();
    cy.findByRole('button', { name: 'Collect' }).click();

    cy.findByRole('button', { name: /Running now/u }).should(
      'have.class',
      'active',
    );
    // The run is over: back to the plan, where the sample is listed as done
    cy.findByRole('button', { name: /Running now/u, timeout: 60_000 }).should(
      'have.class',
      'disabled',
    );
    cy.findByText('Sample-2:02').click();
    cy.findByText('Unattended collect (8/8)').should('be.visible');
  });
});
