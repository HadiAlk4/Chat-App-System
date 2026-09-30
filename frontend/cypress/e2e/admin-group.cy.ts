import { users } from '../support/commands';

describe('Group approval', () => {
  beforeEach(() => {
    cy.resetDb();
    cy.signup(users.ada);
  });

  it('shows a group to its creator once the Super Admin approves it', () => {
    cy.loginViaUi(users.ada);
    cy.location('pathname').should('equal', '/dashboard');
    cy.window().then((win) => cy.stub(win, 'alert').as('alert'));

    cy.contains('label', 'Propose New Group').click();
    cy.get('#grpName').type('Writers Guild');
    cy.get('#grpDesc').type('Short stories and poems');
    cy.contains('label', 'Submit Proposal').click();
    cy.get('@alert').should('have.been.calledWith', 'Group request submitted successfully');
    cy.contains('No available groups found.');
    cy.contains('button', 'Log Out').click();

    cy.loginViaUi(users.root);
    cy.location('pathname').should('equal', '/super-admin-dashboard');
    cy.window().then((win) => cy.stub(win, 'alert').as('adminAlert'));
    cy.contains('tr', 'Writers Guild').within(() => {
      cy.contains('td', 'ada');
      cy.contains('button', 'Accept').click();
    });
    cy.get('@adminAlert').should('have.been.calledWith', 'Group request approved successfully');
    cy.contains('button', 'Log Out').click();

    cy.loginViaUi(users.ada);
    cy.location('pathname').should('equal', '/dashboard');
    cy.contains('No available groups found.');
    cy.contains('button', 'My Memberships').click();
    cy.contains('.card-title', 'Writers Guild');
  });
});
