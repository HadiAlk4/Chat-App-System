export const API_URL = 'http://localhost:3000';

export interface TestUser {
  username: string;
  email: string;
  password: string;
  dob: string;
  age: number;
}

export const users = {
  root: {
    username: 'root',
    email: 'root@example.com',
    password: 'Password1',
    dob: '1986-01-01',
    age: 40,
  },
  ada: {
    username: 'ada',
    email: 'ada@example.com',
    password: 'Password1',
    dob: '2000-01-01',
    age: 26,
  },
  bea: {
    username: 'bea',
    email: 'bea@example.com',
    password: 'Password1',
    dob: '2001-01-01',
    age: 25,
  },
} satisfies Record<string, TestUser>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      resetDb(): Chainable<void>;
      signup(user: TestUser): Chainable<void>;
      loginViaUi(user: TestUser): Chainable<void>;
    }
  }
}

// The first account created on an empty database becomes the Super Admin.
Cypress.Commands.add('resetDb', () => {
  cy.task('resetDb');
  cy.signup(users.root);
  // Fails if the backend is writing to a database other than chat-app-test.
  cy.task('countUsers').should('equal', 1);
});

Cypress.Commands.add('signup', (user: TestUser) => {
  cy.request('POST', `${API_URL}/api/signup`, user).its('body.ok').should('equal', true);
});

// Routes are prerendered on the server, where the guard cannot see localStorage,
// so a logged-in session has to start from the login page.
Cypress.Commands.add('loginViaUi', (user: TestUser) => {
  cy.visit('/login');
  cy.get('#emailInput').type(user.email);
  cy.get('#passwordInput').type(user.password, { log: false });
  cy.contains('button', 'Login').click();
});
