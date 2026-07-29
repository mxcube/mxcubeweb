/* global cy, it, describe, beforeEach */

function findTaskHeaders() {
  return cy.get('[aria-controls^="collapse-"]');
}

function findTaskDetails() {
  return cy.get('[id^="collapse-"]');
}

describe('queue task display', () => {
  beforeEach(() => {
    cy.loginWithControl();
    cy.clearSamples();
    // clearSamples() navigates to the /samplegrid page.
    cy.findByRole('link', { name: /Data collection/u, hidden: true }).click();
    cy.mountSample();
  });

  it('shows and hides the details of a task when its header is clicked', () => {
    cy.addDataCollection();

    // A newly queued task starts out with its details hidden
    findTaskHeaders().should('have.length', 1);
    findTaskDetails().should('not.have.class', 'show');
    cy.findByText('Path:').should('not.be.visible');

    findTaskHeaders().click();
    findTaskDetails().should('have.class', 'show');
    cy.findByText('Path:').should('be.visible');

    findTaskHeaders().click();
    findTaskDetails().should('not.have.class', 'show');
    cy.findByText('Path:').should('not.be.visible');
  });

  it('keeps the display state of existing tasks when another task is queued', () => {
    cy.addDataCollection();
    findTaskHeaders().click();
    findTaskDetails().should('have.class', 'show');

    cy.addDataCollection();

    // The first task must still be expanded, and the new one collapsed
    findTaskHeaders().should('have.length', 2);
    findTaskDetails().eq(0).should('have.class', 'show');
    findTaskDetails().eq(1).should('not.have.class', 'show');
  });

  it('keeps the display state of the remaining tasks when one is deleted', () => {
    cy.addDataCollection();
    cy.addDataCollection();

    // Expand the second task only
    findTaskHeaders().eq(1).click();
    findTaskDetails().eq(0).should('not.have.class', 'show');
    findTaskDetails().eq(1).should('have.class', 'show');

    findTaskHeaders().eq(0).find('i.fa-times').click();
    findTaskHeaders().should('have.length', 1);
    findTaskDetails().should('have.class', 'show');
  });
});
