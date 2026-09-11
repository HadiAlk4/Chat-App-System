# Phase 2 Development Roadmap & Checklists

---

## Part 1: Phase 1 Unfinished & Mocked Features Checklist

This ordered checklist covers the missing or mocked Phase 1 features that need to be made fully functional for Phase 2:

### 1. System Bootstrapping (Initial Super Admin Setup)
* [x] Add an initial database check to detect whether any users exist in the system.
* [ ] If empty, display a setup/bootstrap screen prompting the first visitor to register as the single Super Admin.
* [ ] Permanently lock this bootstrapping route once the Super Admin is registered.

### 2. Group Creation Request Flow (Connecting Modal to Admin)
* [x] Connect the "Propose New Group" PaperCSS modal in `dashboard.html` to an API endpoint rather than purely toggling the UI.
* [x] Ensure proposals route to the Super Admin's queue.
* [x] Allow the Super Admin to accept the proposal, designate the initial Group Admin (GA), and create the group in the database.

### 3. Group Join Requests & Age Validation
* [x] Bind a click event to the "Request to Join" button in `dashboard.html` to submit a join request to the group's GA.
* [x] Add validation blocking any user from requesting to join if their birth year is below the group's `minAge`.
* [ ] Implement logic in the GA settings where updating `minAge` automatically boots existing members who fall below the new age limit.

### 4. Group Admin Management (Un-mocking `group-settings.ts`)
* Replace local `.splice()` and hardcoded arrays with real API updates:
  * [ ] **Rooms:** Connect "+ Add Room", "Edit Name", and "Delete Room" to backend endpoints.
  * [x] **Join Requests:** Persist approvals and rejections; require and save a rejection reason to be viewed in the user's `request-history`.
  * [x] **Room Requests:** Persist approvals and rejections; require and save a rejection reason to be viewed in the user's `request-history`.
  * [ ] **Promotions:** Persist regular member promotions to Group Admin.
  * [ ] **Group Bans:** Persist group-level bans and ensure they are permanent (remove the "un-ban" button, as the specification states there is no un-ban system).
  * [ ] **Resignation & Deletion:** Enforce GA step-down rules (cannot step down if sole GA or if pending requests exist) and route group deletion requests to the Super Admin.

### 5. Account Deletion & Banned Emails
* [ ] Wire the "Request Account Deletion" button in `user-profile-settings.html` to submit an approval request to the Super Admin.
* [ ] Implement backend logic for Super Admin global bans/deletions: add emails to a permanent ban list that blocks re-registration.

### 6. Super Admin Audit Logging (Un-mocking `super-admin-audit-log.ts`)
* [ ] Replace `auditLogBook` with a server-side collection that logs every administrative action (bans, approvals, deletions) with an immutable timestamp.

---

## Part 2: Comprehensive Phase 2 Implementation Checklist

This checklist combines the missing and un-mocked Phase 1 features with all new Phase 2 requirements, structured in chronological order of implementation:

### 1. MongoDB Migration & Data Modeling
* [x] Set up a MongoDB connection (via Mongoose) and remove all `fakeData.json` file reading/writing logic.
* [ ] Define schemas for Users, Groups, Rooms, Messages, Requests (Join, Room, Deletion, Ban), and Audit Logs.
* [ ] Migrate existing seed records into MongoDB collections.

### 2. Password Encryption & Authentication Hardening
* [x] Integrate `bcrypt` into the backend for hashing passwords on user registration.
* [x] Enforce password criteria: minimum 8 characters, alphanumeric, and at least one uppercase letter.
* [x] Update `/api/auth` to verify hashed credentials with `bcrypt.compare`.

### 3. Super Admin Bootstrapping
* [ ] Implement an initial startup check that verifies if the user collection is empty.
* [ ] If empty, redirect to a bootstrap view prompting the initial visitor to register the single Super Admin.
* [ ] Permanently lock the bootstrap endpoint once the Super Admin account exists.

### 4. Group & Room Request Lifecycle
* [x] Connect the `dashboard.html` proposal modal to a backend endpoint that queues proposals for the Super Admin.
* [x] Super Admin reviews and approves the proposal, creating the group in MongoDB and assigning the creator as Group Admin (GA).
* [x] Wire the "Request to Join" button on `dashboard.html` to create a pending join request for the GA, enforcing age validation so users under the group's `minAge` are rejected automatically.
* [x] Enable regular users to propose new rooms within a group via `request-history`.

### 5. Un-Mocking Group Admin Controls (`group-settings.ts`)
* Replace all component array `.splice()` methods with persistent MongoDB updates:
  * [ ] Create, rename, and delete rooms.
  * [x] Approve or reject join and room requests, storing a mandatory rejection reason displayed in the user's `request-history`.
  * [ ] Promote members to GA.
  * [ ] Enforce GA step-down rules: prevent demotion if the user is the sole GA or has pending requests queued with the Super Admin.
  * [ ] Issue permanent group-level bans (removing the un-ban capability from the UI).
  * [ ] Auto-evict existing members if the GA increases the group's minimum age threshold above their birth year.
  * [ ] Queue group deletion requests to the Super Admin.

### 6. Super Admin Audit Logging & Global Bans
* [ ] Replace `auditLogBook` with a server-side MongoDB collection that inserts an immutable timestamped record for every administrative action.
* [ ] Enable date and action-type filtering directly against the database on `/super-admin-audit-log`.
* [ ] Implement global account deletions and permanent email bans, preventing banned emails from ever re-registering.

### 7. Real-Time Chat Infrastructure (Socket.io)
* [x] Install and configure `socket.io` on the Node.js HTTP server and `socket.io-client` on Angular.
* [ ] Establish room-based socket channels matching group room IDs to isolate message traffic.
* [ ] Emit join and leave events to trigger real-time toast notifications.
* [ ] Dynamically update the online room participants list in the chat sidebar via live socket presence tracking.

### 8. Real-Time Messaging & Media Handling
* [ ] **History Buffer:** When a user enters a room, query MongoDB for strictly the last 5 messages sent in that channel.
* [ ] **Live Streaming:** Broadcast subsequent messages in real-time without capping the chat display while the user stays active.
* [ ] **Self-Message Deletion:** Allow users to delete their own messages, emitting a socket event that removes the message instantly from all active screens and deletes it from MongoDB.
* [ ] **Cascaded Deletion:** If a user account is deleted by the Super Admin, broadcast an event to remove all messages sent by that user across all rooms instantly.
* [ ] **File Attachments:** Enable image uploads (PNG, JPEG, GIF up to 2MB) in chat messages.

### 9. UI & Theme Customization
* [ ] Apply GA-configured default themes to chat rooms while allowing individual users to apply unified custom themes across all their groups.
* [ ] Wire profile settings to allow updating display names, profile pictures (up to 2MB), and password changes (with current password verification).

### 10. Automated Testing & Verification
* [ ] Write automated Unit Tests for Angular components using Jasmine/Karma.
* [ ] Write backend integration tests for Express API endpoints using Mocha/Supertest.
* [ ] Implement End-to-End (E2E) UI testing to validate the multi-user chat and admin workflows.

### 11. Phase 2 Documentation (`Phase2.md`)
* [ ] Document final system specifications and requirements.
* [ ] Provide full REST API and WebSocket event documentation.
* [ ] Detail the final Angular component, service, and model architecture.
* [ ] Include testing methodologies and an automated test results tabl
