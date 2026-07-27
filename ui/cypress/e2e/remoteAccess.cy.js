/* global cy, it, describe, beforeEach, afterEach, expect, assert */

describe('remote access', () => {
  beforeEach(() => {
    cy.loginWithControl();
    cy.findByRole('link', { name: /Remote/u, hidden: true }).click();
  });

  afterEach(() => {
    // add condition: check if second user is  logged in if no procceed:
    cy.secondUserLogout();
  });

  it('shows a new observer joining as soon as they log in', () => {
    cy.contains('secondUser').should('not.exist');

    cy.secondUserLogin();

    cy.findByText('Users').should('be.visible');
    cy.contains('secondUser').should('be.visible');
  });

  it('operator grants an observer control after request', () => {
    cy.secondUserLogin();
    cy.secondUserRequestControl('Please give me control');

    cy.findByText(/is asking for control/u).should('be.visible');
    cy.findByRole('dialog').within(() => {
      cy.findByRole('button', { name: 'Give control' }).click();
    });

    cy.secondUserLoginInfo().then((info) => {
      expect(info.body.user.inControl).to.equal(true);
    });
    cy.findByText('You lost control').should('be.visible');
    cy.findByRole('dialog').within(() => {
      cy.findByRole('button', { name: 'Hide' }).click();
    });
    cy.findByRole('button', { name: 'Ask for control' }).should('be.visible');
  });

  it('operator denys an observer control request with a message', () => {
    cy.secondUserLogin();
    cy.secondUserRequestControl('Please give me control');

    cy.findByText(/is asking for control/u).should('be.visible');
    cy.findByRole('dialog').within(() => {
      cy.findByLabelText('Your response:').type('Not right now');
      cy.findByRole('button', { name: 'Deny control' }).click();
    });

    cy.secondUserLoginInfo().then((info) => {
      expect(info.body.user.inControl).to.equal(false);
    });
    cy.findByText('You lost control').should('not.exist');
    cy.findByRole('button', { name: 'Ask for control' }).should('not.exist');
  });

  it('operator gives control directly to the observer listed', () => {
    cy.secondUserLogin();

    cy.contains('secondUser')
      .closest('.row')
      .within(() => {
        cy.findByRole('button', { name: 'Give control' }).click();
      });

    cy.secondUserLoginInfo().then((info) => {
      expect(info.body.user.inControl).to.equal(true);
    });
    cy.findByText('You lost control').should('be.visible');
    cy.findByRole('dialog').within(() => {
      cy.findByRole('button', { name: 'Hide' }).click();
    });
    cy.findByRole('button', { name: 'Ask for control' }).should('be.visible');
  });

  it('operator logo out an observer from the user list', () => {
    cy.secondUserLogin();
    cy.contains('secondUser').should('be.visible');

    cy.contains('secondUser')
      .closest('.row')
      .within(() => {
        cy.findByRole('button', { name: 'Logout' }).click();
      });

    cy.contains('secondUser').should('not.exist');
    cy.secondUserLoginInfo().then((info) => {
      expect(info.body.loggedIn).to.equal(false);
    });
  });

  it('delivers chat messages between the operator and an observer', () => {
    cy.secondUserLogin();

    //  operator -> observer
    cy.findByRole('button', { name: 'Toggle chat' }).click();
    cy.findByLabelText('Type a message').type('Hello from the operator');
    cy.findByRole('button', { name: 'Send' }).click();
    cy.findByText('Hello from the operator').should('be.visible');
    cy.secondUserEvents().then((events) => {
      const chatEvent = events.find((e) => e.name === 'ra_chat_message');
      assert.exists(chatEvent, 'ra_chat_message event not found');
      expect(chatEvent.data.message).to.equal('Hello from the operator');
    });

    //  observer -> operator
    cy.secondUserSendChatMessage('Hello from the observer');
    cy.findByText('Hello from the observer').should('be.visible');
  });

  it('operator enables and disables remote access', () => {
    cy.findByLabelText('Enable remote access').as('checkbox');
    cy.get('@checkbox').should('not.be.checked');

    cy.get('@checkbox').click();
    cy.get('@checkbox').should('be.checked');

    cy.get('@checkbox').click();
    cy.get('@checkbox').should('not.be.checked');
  });
});
