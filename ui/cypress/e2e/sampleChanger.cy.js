/* global cy, it, describe, beforeEach, afterEach */

// Expand every container/puck node in the Sample Changer tree by
// clicking one visible "+" toggle at a time, re-querying after each
// until none remain unexpanded.
function expandAllDropdowns() {
  cy.get('body').then(($body) => {
    if ($body.find('i.fa-plus').length > 0) {
      cy.get('i.fa-plus').first().closest('button').click({ force: true });
      expandAllDropdowns();
    }
  });
}

describe('Sample controls', () => {
  beforeEach(() => {
    cy.loginWithControl();
    cy.clearSamples();
    cy.findByRole('link', { name: /Samples/u, hidden: true }).click();
    cy.findByRole('button', { name: /Other LIMS Options/u }).click();
    cy.findByRole('button', { name: /Get samples from SC/u }).click();
  });

  afterEach(() => {
    // Unmount sample if mounted
    cy.findByRole('link', { name: /Equipment/u, hidden: true }).click();
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Unmount")').length > 0) {
        cy.findByRole('button', { name: /Unmount/u }).click();
      }
    });
  });

  it('Add to queue, mount and anmount samples from sample changer at the `Samples` and `Data collection` tabs', () => {
    // Add sample to queue
    cy.findByText('Sample-2:02').should('be.visible').rightclick();
    cy.findByText('Add to Queue').should('be.visible').click();

    // Mount sample
    cy.findByText('Sample-2:01').should('be.visible').rightclick();
    cy.findByText('Mount').should('be.visible').click();

    // After mounting we are redirected to 'Data Collection'
    cy.findByText('Sample: Sample-2:01').should('be.visible');

    // Mount queued sample
    cy.findByText('Queued Samples (1)').should('be.visible').click();
    cy.findByText('Sample-2:02').should('be.visible');
    cy.findByRole('button', { name: /Mount/u }).click();

    cy.findByText('Queued Samples (0)').should('be.visible').click();
  });

  it('Mount and anmount samples from sample changer at the `Equipment` tab', () => {
    cy.findByRole('link', { name: /Equipment/u, hidden: true }).click();
    // EquipmentState reflects mocked sample changer READY
    cy.get('.alert').contains('Mockup').should('contain.text', 'READY');
    cy.findByText('No sample loaded').should('be.visible');

    // Expand dropdowns
    cy.get('i.fa-plus').closest('button').contains('Mockup').click();
    cy.get('i.fa-minus').closest('button').should('contain.text', 'Mockup');
    cy.get('i.fa-plus').closest('button').contains('3').click();
    cy.get('i.fa-minus').closest('button').should('contain.text', '3');

    // Mount sample
    cy.findByRole('button', { name: /3:01/u }).click();
    cy.findByText('Mount').should('be.visible').click();
    cy.get('.alert').contains('Mockup').should('contain.text', 'LOADING');
    cy.get('.alert')
      .contains('Currently mounted:')
      .should('contain.text', '3:01 (matr3_1');
    cy.get('.alert').contains('Mockup').should('contain.text', 'READY');

    // Mount another sample
    cy.findByRole('button', { name: /3:02/u }).click();
    cy.findByText('Mount').should('be.visible').click();
    cy.get('.alert').contains('Mockup').should('contain.text', 'LOADING');
    cy.get('.alert')
      .contains('Currently mounted:')
      .should('contain.text', '3:02 (matr3_2');
    cy.get('.alert').contains('Mockup').should('contain.text', 'READY');

    // Unmount sample
    cy.findByRole('button', { name: /Unmount/u }).click();
    cy.findByText('No sample loaded').should('be.visible');
    cy.get('.alert').contains('Mockup').should('contain.text', 'READY');
  });

  it('Click `Refresh` button', () => {
    cy.findByRole('link', { name: /Equipment/u, hidden: true }).click();
    cy.intercept(
      'GET',
      '**/hwobj/sample_changer/sample_changer/get_contents',
    ).as('fetchSampleChangerContents');
    cy.intercept(
      'GET',
      '**/hwobj/sample_changer/sample_changer/loaded_sample',
    ).as('fetchLoadedSample');
    cy.findByRole('button', { name: 'Refresh' }).click();
    cy.wait(['@fetchSampleChangerContents', '@fetchLoadedSample']).then(
      ([contentsCall]) => {
        const contents = contentsCall.response.body;
        expandAllDropdowns();

        // Check every sample from the response is rendered
        contents.children.forEach((container) => {
          container.children.forEach((sample) => {
            cy.findByText(`${sample.name} ${sample.id}`)
              .should('exist')
              .scrollIntoView()
              .should('be.visible');
          });
        });
      },
    );
  });
});
