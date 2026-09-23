/* global cy, it, describe */

function setEquipmentVisibility(showForStaffOnly) {
  cy.intercept('GET', '**/uiproperties', (request) => {
    request.continue((response) => {
      response.send({
        ...response.body,
        equipment: {
          ...response.body.equipment,
          show_for_staff_only: showForStaffOnly,
        },
      });
    });
  });
}

function logInAsNonStaff() {
  // The test backend only authenticates idtest0, who is a staff user.
  // Intercept to set the user to be non-staff for testing
  // without the staff role.
  cy.intercept('GET', '**/login_info', (request) => {
    request.continue((response) => {
      if (response.body.loggedIn) {
        response.send({
          ...response.body,
          user: { ...response.body.user, isstaff: false },
        });
      }
    });
  });

  cy.login();
  cy.findByRole('heading', { name: 'MXCuBE-Web (OSC)' }).should('be.visible');
}
describe('Equipment tab visibility', () => {
  it('is visible to staff users when staff-only access is enabled', () => {
    setEquipmentVisibility(true);
    cy.login();

    cy.findByRole('heading', { name: 'MXCuBE-Web (OSC)' }).should('be.visible');
    cy.findByRole('link', { name: 'Equipment', hidden: true }).should(
      'be.visible',
    );
  });

  it('is hidden from non-staff users when staff-only access is enabled', () => {
    setEquipmentVisibility(true);
    logInAsNonStaff();

    cy.findByRole('link', { name: 'Equipment', hidden: true }).should(
      'not.exist',
    );
  });

  it('is visible to non-staff users when staff-only access is disabled', () => {
    setEquipmentVisibility(false);
    logInAsNonStaff();

    cy.findByRole('link', { name: 'Equipment', hidden: true }).should(
      'be.visible',
    );
  });
});
