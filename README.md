# Fabulari Chat System

A real-time group chat app built on the MEAN stack (MongoDB, Express, Angular, Node.js) with Socket.io for live messaging.

Users join groups and chat in the rooms inside them. There are three roles:

- **Super Admin**: the first account registered. Approves groups, account deletions and bans, and has an audit log of every decision.
- **Group Admin**: manages their group's settings, rooms, members and bans.
- **User**: joins groups, chats, sends images and suggests new rooms.

## Features

- Live chat, with join/leave notifications and a list of who's in the room
- Image messages (PNG, JPEG or GIF, up to 2 MB)
- Groups with age limits, light/dark themes and permanent bans
- A request flow for joining groups, adding rooms and deleting groups or accounts
- Profile settings with username, password and profile picture

## Tech stack

| Part | Tools |
|---|---|
| Frontend | Angular 22, PaperCSS, Socket.io client |
| Backend | Node.js, Express 5, Socket.io, Multer |
| Database | MongoDB |
| Tests | Mocha + Chai (backend), Vitest + Cypress (frontend) |

## Getting started

You need Node.js and MongoDB running on `localhost:27017`.

```bash
# 1. Start the backend (http://localhost:3000)
cd backend
npm install
npm start

# 2. In a second terminal, start the frontend (http://localhost:4200)
cd frontend
npm install
npm start
```

Open http://localhost:4200 and sign up. The first account becomes the Super Admin.

The backend reads these optional environment variables: `PORT` (default `3000`), `MONGO_URL` (default `mongodb://localhost`), `MONGO_PORT` (default `27017`) and `MONGO_DB_NAME` (default `chat-app`).

## Tests

```bash
cd backend
npm run unitTest   # unit tests
npm test           # integration tests (use the chat-app-test database)

cd frontend
npm test           # component tests
npm run e2e        # Cypress end-to-end tests
```

## Project structure

```
backend/              Express API, Socket.io server and MongoDB access
frontend/             Angular app
assignment_material/  Brief and phase documentation
```

For the full API reference and design notes, see [`assignment_material/phase2.md`](assignment_material/phase2.md).
