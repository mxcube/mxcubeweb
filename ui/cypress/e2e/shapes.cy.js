/* global cy, it, describe, beforeEach */

// Coordinates are relative to the top-left of #insideWrapper (element that
// contains the canvas).

const POINT_A = { x: 150, y: 150 };

const POINT_B = { x: 350, y: 250 };

const MIDPOINT = {
  x: (POINT_A.x + POINT_B.x) / 2,
  y: (POINT_A.y + POINT_B.y) / 2,
};

function rightClickCanvas(x, y) {
  cy.get('#insideWrapper').rightclick(x, y);
}

function clickMenuItem(text) {
  cy.contains('.dropdown-item', text).click();
}

function menuItem(text) {
  return cy.contains('.dropdown-item', text);
}

function create2DPoint(x, y) {
  rightClickCanvas(x, y);
  clickMenuItem('Create 2D Point');
  cy.wait('@updateShapes');
}

describe('Shapes', () => {
  beforeEach(() => {
    cy.loginWithControl();
    cy.mountSample();
    cy.findByRole('button', { name: 'Sample: test - test' }).should(
      'be.visible',
    );

    cy.intercept('PUT', '**/sample_view/sample_view/update_shapes').as(
      'updateShapes',
    );
    cy.intercept('PUT', '**/sample_view/sample_view/delete_shape').as(
      'deleteShape',
    );
  });

  it('creates and deletes a 2D point', () => {
    const { x, y } = POINT_A;

    create2DPoint(x, y);

    // Right-clicking the point itself now shows its own menu
    rightClickCanvas(x, y);
    menuItem('Delete Point').should('exist');
    clickMenuItem('Delete Point');
    cy.wait('@deleteShape');

    // Point is gone: right-clicking the same spot falls back to the empty-canvas menu
    rightClickCanvas(x, y);
    menuItem('Create 2D Point').should('exist');
    menuItem('Delete Point').should('not.exist');
  });

  it('creates a line between two 2D points and deletes it', () => {
    create2DPoint(POINT_A.x, POINT_A.y);
    create2DPoint(POINT_B.x, POINT_B.y);

    // Drag-select a rectangle enclosing both points
    cy.get('.upper-canvas')
      .trigger('mousedown', POINT_A.x - 30, POINT_A.y - 30, {
        button: 0,
        buttons: 1,
      })
      .trigger('mousemove', POINT_B.x + 30, POINT_B.y + 30, {
        button: 0,
        buttons: 1,
      })
      .trigger('mouseup', POINT_B.x + 30, POINT_B.y + 30, { button: 0 });
    cy.wait('@updateShapes');

    // Right-clicking within the selection offers to connect the two points
    rightClickCanvas(MIDPOINT.x, MIDPOINT.y);
    menuItem('Add Line').should('exist');
    clickMenuItem('Add Line');
    cy.wait('@updateShapes');

    // The 2 points stay active-selected after adding the line, so a right
    // click at the same spot would still hit the "2 points selected" menu
    // rather than the line itself. Clear the selection first.
    cy.get('.upper-canvas').click(20, 20);

    // Line now exists: right-clicking its midpoint shows the line's own menu
    rightClickCanvas(MIDPOINT.x, MIDPOINT.y);
    menuItem('Delete Line').should('exist');
    clickMenuItem('Delete Line');
    cy.wait('@deleteShape');
  });
});
