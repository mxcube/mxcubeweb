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

// The canvas is repainted from Redux state asynchronously after a shape is
// added/removed, slightly after the triggering network request resolves.
// Right-clicking too early can therefore miss the (still unpainted) shape
// and fall back to the wrong context menu. Retry the right click until the
// expected menu item shows up, closing any stale context menu between attempts.
function rightClickAwaitMenuItem(x, y, text, attemptsLeft = 15) {
  rightClickCanvas(x, y);

  cy.get('body').then(($body) => {
    const found = $body
      .find('.dropdown-item')
      // eslint-disable-next-line unicorn/no-useless-iterator-to-array
      .toArray()
      .some((el) => el.textContent.includes(text));

    if (found) {
      return;
    }

    if (attemptsLeft <= 0) {
      throw new Error(`"${text}" menu item never appeared`);
    }
    cy.get('body').type('{esc}');
    cy.wait(100);
    rightClickAwaitMenuItem(x, y, text, attemptsLeft - 1);
  });
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
    rightClickAwaitMenuItem(x, y, 'Delete Point');
    clickMenuItem('Delete Point');
    cy.wait('@deleteShape');

    // Point is gone: right-clicking the same spot falls back to the empty-canvas menu
    rightClickAwaitMenuItem(x, y, 'Create 2D Point');
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
    rightClickAwaitMenuItem(MIDPOINT.x, MIDPOINT.y, 'Add Line');
    clickMenuItem('Add Line');
    cy.wait('@updateShapes');

    // The 2 points stay active-selected after adding the line, so a right
    // click at the same spot would still hit the "2 points selected" menu
    // rather than the line itself. Clear the selection first.
    cy.get('.upper-canvas').click(20, 20);

    // Line now exists: right-clicking its midpoint shows the line's own menu
    rightClickAwaitMenuItem(MIDPOINT.x, MIDPOINT.y, 'Delete Line');
    clickMenuItem('Delete Line');
    cy.wait('@deleteShape');
  });
});
