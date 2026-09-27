import { users } from '../support/commands';

describe('Access control', () => {
  beforeEach(() => {
    cy.resetDb();
    cy.signup(users.ada);
  });

  it('redirects a logged-out visit to the dashboard back to login', () => {
    cy.visit('/dashboard');

    cy.location('pathname').should('equal', '/login');
    cy.contains('h1', 'Log In');
  });

  it('lets a logged-in user reach the dashboard', () => {
    cy.loginViaUi(users.ada);

    cy.location('pathname').should('equal', '/dashboard');
    cy.contains('button', 'My Memberships').click();
    cy.location('pathname').should('equal', '/my-memberships');
  });

  it('keeps a user with bad credentials on the login page', () => {
    cy.loginViaUi({ ...users.ada, password: 'WrongPass1' });

    cy.get('.alert-danger').should('contain', 'Invalid Credentials');
    cy.location('pathname').should('equal', '/login');
  });
});
