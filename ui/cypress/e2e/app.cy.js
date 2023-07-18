describe('app', () => {
  it('loads the login page', () => {
    cy.visit('http://localhost:8081');
    cy.get('input[placeholder*="LoginID"]').should('be.visible');
    cy.get('input[placeholder*="Password"]').should('be.visible');
    cy.get('button[type=submit]').should('be.visible');
  });
});
