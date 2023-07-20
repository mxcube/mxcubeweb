describe('app', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('loads the login page', () => {
    cy.findByRole('textbox', { label: 'Login ID' }).should('be.visible');
    cy.findByRole('textbox', { label: 'Password' }).should('be.visible');
    cy.findByRole('button', { label: 'Sign in' }).should('be.visible');
  });
});
