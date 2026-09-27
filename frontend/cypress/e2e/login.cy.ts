import { users } from '../support/commands';

describe('Login', () => {
  beforeEach(() => {
    cy.resetDb();
    cy.signup(users.ada);
  });

  it('logs in and fills the dashboard', () => {
    cy.loginViaUi(users.ada);

    cy.location('pathname').should('equal', '/dashboard');
    cy.contains('Name : ada');
    cy.contains('Available Groups');
  });

  it('sends the credentials to the auth API', () => {
    cy.intercept('POST', '**/api/auth').as('auth');

    cy.loginViaUi(users.ada);

    cy.wait('@auth').then(({ request, response }) => {
      expect(request.body).to.deep.equal({ email: users.ada.email, password: users.ada.password });
      expect(response?.body.ok).to.equal(true);
      expect(response?.body.user.username).to.equal('ada');
    });
  });

  it('shows an error when submitted empty', () => {
    cy.visit('/login');
    cy.contains('button', 'Login').click();

    cy.get('.alert-danger').should('contain', 'Please enter both email and password.');
    cy.location('pathname').should('equal', '/login');
  });
});
