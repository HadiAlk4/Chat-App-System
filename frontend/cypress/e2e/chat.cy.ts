import { io, Socket } from 'socket.io-client';
import { API_URL, users } from '../support/commands';

const room = { groupName: 'Readers', roomName: 'Main Room' };

function approvePending(path: string, query: string) {
  cy.request(`${API_URL}/api/${path}?${query}`).then(({ body }) => {
    expect(body).to.have.length(1);
    cy.request('PATCH', `${API_URL}/api/${path}/${body[0]._id}/approve`, { performedBy: 'root' })
      .its('body.ok')
      .should('equal', true);
  });
}

describe('Chat', () => {
  let beaSocket: Socket | undefined;

  beforeEach(() => {
    cy.resetDb();
    cy.signup(users.ada);
    cy.signup(users.bea);

    cy.request('POST', `${API_URL}/api/group-requests`, {
      groupName: room.groupName,
      groupDescription: 'Books',
      minAge: 18,
      themeColor: 'light',
      creatorUserName: users.ada.username,
      creatorEmail: users.ada.email,
    });
    approvePending('group-requests', 'status=pending');

    cy.request('POST', `${API_URL}/api/join-requests`, {
      groupName: room.groupName,
      username: users.bea.username,
    });
    approvePending('join-requests', 'status=pending&username=bea');

    cy.loginViaUi(users.ada);
    cy.contains('button', 'My Memberships').click();
    cy.contains('.card', room.groupName).contains('button', 'View Rooms').click();
    cy.location('pathname').should('equal', '/chat');
    cy.contains('No messages in this room yet.');
    cy.contains('h3', 'In this room').next().should('contain', users.ada.username);
  });

  afterEach(() => {
    beaSocket?.disconnect();
    beaSocket = undefined;
  });

  function sendAsBea(...contents: string[]) {
    cy.then(
      () =>
        new Promise<void>((resolve, reject) => {
          const socket = io(API_URL);
          beaSocket = socket;
          const fail = (err: Error) => {
            socket.disconnect();
            reject(err);
          };
          socket.on('connect_error', fail);
          socket.on('connect', () => {
            socket.emit('join-room', { ...room, username: users.bea.username });
            for (const content of contents) {
              socket.emit('send-message', { ...room, senderUserName: users.bea.username, content });
            }
            resolve();
          });
        })
    );
  }

  it("shows another member's message with their display name", () => {
    sendAsBea('hello from bea');

    cy.contains('.receiver-bubble', 'hello from bea').should('contain', 'bea');
  });

  it('does not show a message that contains an external link', () => {
    sendAsBea('see http://example.com', 'no links here');

    cy.contains('.receiver-bubble', 'no links here');
    cy.contains('http://example.com').should('not.exist');
  });
});
