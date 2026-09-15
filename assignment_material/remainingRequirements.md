# Phase 2 Development Roadmap & Checklists

Mapped against `requirements_assignment.txt`. Part 1 is leftover Phase 1 mocks. Part 2 is the full Phase 2 spec, including role constraints, messaging rules, profiles, and non-functional requirements. Testing and `Phase2.md` are course extras not listed in the assignment notes.

---

## Part 1: Phase 1 Unfinished & Mocked Features Checklist

This ordered checklist covers the missing or mocked Phase 1 features that need to be made fully functional for Phase 2:

### 1. System Bootstrapping (Initial Super Admin Setup)

- [x] Add an initial database check to detect whether any users exist in the system.
- [ ] If empty, display a setup/bootstrap screen prompting the first visitor to register as the single Super Admin.
- [ ] Permanently lock this bootstrapping route once the Super Admin is registered.

### 2. Group Creation Request Flow (Connecting Modal to Admin)

- [x] Connect the "Propose New Group" PaperCSS modal in `dashboard.html` to an API endpoint rather than purely toggling the UI.
- [x] Ensure proposals route to the Super Admin's queue.
- [x] Allow the Super Admin to accept the proposal, designate the initial Group Admin (GA), and create the group in the database.
- [ ] Enforce unique group names on proposal and creation.
- [ ] Super Admin cannot create groups directly without a user proposal.

### 3. Group Join Requests & Age Validation

- [x] Bind a click event to the "Request to Join" button in `dashboard.html` to submit a join request to the group's GA.
- [x] Add validation blocking any user from requesting to join if their birth year is below the group's `minAge`.
- [ ] Implement logic in the GA settings where updating `minAge` automatically boots existing members who fall below the new age limit.
- [ ] Pending join requests cannot be cancelled by the requester.

### 4. Group Admin Management (Un-mocking `group-settings.ts`)

- Replace local `.splice()` and hardcoded arrays with real API updates:
  - [x] **Rooms:** Connect "+ Add Room", "Edit Name", and "Delete Room" to backend endpoints.
  - [x] **Join Requests:** Persist approvals and rejections; require and save a rejection reason to be viewed in the user's `request-history`.
  - [x] **Room Requests:** Persist approvals and rejections; require and save a rejection reason to be viewed in the user's `request-history`.
  - [x] **Promotions:** Persist regular member promotions to Group Admin.
  - [ ] **Group Bans:** Persist group-level bans and ensure they are permanent (remove the "un-ban" button, as the specification states there is no un-ban system). Member removal currently pulls the user from `members`/`admins` only; it does not store a permanent group ban list.
  - [ ] **Banned-member visibility:** GA can see all allowed and banned members for their group.
  - [ ] **User-requested bans:** Regular users can request the GA to ban a specific user. A GA cannot self-approve a ban against themselves; that request must go to the Super Admin.
  - [ ] **Resignation & Deletion:** Enforce GA step-down rules (cannot step down if sole GA or if pending requests exist) and route group deletion requests to the Super Admin. After Super Admin deletes the group, that requesting GA is demoted to a regular user.
  - [ ] **Group metadata:** Wire "Save Changes" on the General tab (unique name, description up to 250 characters, min age, theme).

### 5. Account Deletion & Banned Emails

- [ ] Wire the "Request Account Deletion" button in `user-profile-settings.html` to submit an approval request to the Super Admin.
- [ ] Implement backend logic for Super Admin global bans/deletions: add emails to a permanent ban list that blocks re-registration.
- [ ] Super Admin cannot delete or hard-ban themselves.
- [ ] Super Admin can view the list of permanently banned accounts.

### 6. Super Admin Audit Logging (Un-mocking `super-admin-audit-log.ts`)

- [ ] Replace `auditLogBook` with a server-side collection that logs every administrative action (bans, approvals, deletions) with an immutable timestamp.

### 7. Super Admin Role Restrictions (mocked / incomplete in Phase 1)

- [ ] Super Admin is action-requests only: no chat functions and no access to old chat history.
- [ ] Keep Super Admin tools in the main app shell (audit log remains a dedicated filterable page; no separate Super Admin-only product).

---

## Part 2: Comprehensive Phase 2 Implementation Checklist

This checklist combines the missing and un-mocked Phase 1 features with all Phase 2 requirements from `requirements_assignment.txt`, structured in chronological order of implementation:

### 1. MongoDB Migration & Data Modeling

- [x] Set up a MongoDB connection (via Mongoose) and remove all `fakeData.json` file reading/writing logic.
- [ ] Define schemas for Users, Groups, Rooms, Messages, Requests (Join, Room, Deletion, Ban), and Audit Logs.
- [ ] Migrate existing seed records into MongoDB collections.

### 2. Password Encryption & Authentication Hardening

- [x] Integrate `bcrypt` into the backend for hashing passwords on user registration.
- [x] Enforce password criteria: minimum 8 characters, alphanumeric, and at least one uppercase letter.
- [x] Update `/api/auth` to verify hashed credentials with `bcrypt.compare`.
- [x] Basic authentication only; OAuth (e.g. GitHub OAuth) is not permitted.

### 3. Super Admin Bootstrapping & Role Scope

- [ ] Implement an initial startup check that verifies if the user collection is empty.
- [ ] If empty, redirect to a bootstrap view prompting the initial visitor to register the single Super Admin (the only Super Admin, generated via this bootstrap process).
- [ ] Permanently lock the bootstrap endpoint once the Super Admin account exists.
- [ ] Super Admin handles action requests only: no chat access and no old chat history.
- [ ] Super Admin cannot create groups except by approving a user proposal and assigning the initial GA.
- [ ] Super Admin cannot delete themselves.
- [ ] Super Admin tools stay integrated in the main app; retain a dedicated filterable audit-log page.

### 4. Group & Room Request Lifecycle

- [x] Connect the `dashboard.html` proposal modal to a backend endpoint that queues proposals for the Super Admin.
- [x] Super Admin reviews and approves the proposal, creating the group in MongoDB and assigning the creator as Group Admin (GA).
- [x] Wire the "Request to Join" button on `dashboard.html` to create a pending join request for the GA, enforcing age validation so users under the group's `minAge` are rejected automatically.
- [x] Enable regular users to propose new rooms within a group via `request-history`.
- [x] Regular users can view a list of all existing groups to potentially join.
- [ ] Enforce unique group names. There is no limit on how many groups a user can join or administer.
- [ ] Pending join requests cannot be cancelled.
- [ ] Regular users can request the GA to ban a specific user.

### 5. Un-Mocking Group Admin Controls (`group-settings.ts`)

- Replace all component array `.splice()` methods with persistent MongoDB updates:
  - [x] Create, rename, and delete rooms. Groups may have 0 to unlimited rooms with unlimited user capacity.
  - [x] Approve or reject join and room requests, storing a mandatory rejection reason displayed in the user's `request-history`.
  - [x] Promote members to GA. A group must always have at least one GA and may have multiple.
  - [ ] Show a visual indicator of GA status while chatting.
  - [ ] Enforce GA step-down rules: prevent demotion if the user is the sole GA or has pending requests queued with the Super Admin.
  - [ ] Issue permanent group-level bans (removing the un-ban capability from the UI). Member removal is wired, but bans are not persisted as a permanent group ban list.
  - [ ] GA can see all allowed and banned members for their group.
  - [ ] User-requested bans: persist requests from regular users. A GA cannot self-approve a ban against themselves; those requests go to the Super Admin.
  - [ ] Auto-evict existing members if the GA increases the group's minimum age threshold above their birth year. The age limit is birth-year based and applies to all rooms in the group.
  - [ ] Queue group deletion requests to the Super Admin; after deletion, the requesting GA is demoted to a regular user.
  - [ ] Persist General tab edits via Save Changes: unique group name, description (max 250 characters), min age, and theme. No Super Admin permission required for these edits.

### 6. Super Admin Audit Logging & Global Bans

- [ ] Replace `auditLogBook` with a server-side MongoDB collection that inserts an immutable timestamped record for every administrative action.
- [ ] Enable date and action-type filtering directly against the database on `/super-admin-audit-log`.
- [ ] Implement global account deletions and permanent email bans, preventing banned emails from ever re-registering. Super Admin is the only role that can hard-ban a user from the entire system.
- [ ] Super Admin can view permanently banned accounts.
- [ ] Super Admin cannot delete or hard-ban themselves.

### 7. Real-Time Chat Infrastructure (Socket.io)

- [x] Install and configure `socket.io` on the Node.js HTTP server and `socket.io-client` on Angular.
- [x] Establish room-based socket channels matching group room IDs to isolate message traffic.
- [x] Emit join and leave events to trigger real-time toast notifications (toasts are dismissible with an 'X').
- [x] Dynamically update the online room participants list in the chat sidebar via live socket presence tracking (sidebar is for the chat room, not the main group page).
- [ ] Also fire a toast when a GA verifies a user (join accept/deny).

### 8. Real-Time Messaging & Media Handling

- [x] **History Buffer:** Persist only the last 5 messages per room (server of record). When a user enters a room, load those 5. If they were not in the room when a message was sent, they will not see it except via this last-5 buffer on rejoin. Re-entry (leave and come back, or switch rooms) reloads those 5; live socket messages are not capped while they stay in the room.
- [x] **Live Streaming:** Broadcast subsequent messages in real-time without capping the chat display while the user stays active.
- [x] **Self-Message Deletion:** Allow users to delete their own messages (e.g. right-click), emitting a socket event that removes the message instantly from all active screens and deletes it from MongoDB.
- [ ] **Cascaded Deletion:** When a user account is deleted (subject to Super Admin approval), broadcast an event to remove all messages sent by that user across all rooms instantly. If those messages were in any room's last-5 buffer, they are removed (the room may then show fewer than 5 messages, or a blank chat if all 5 belonged to them).
- [ ] **File Attachments:** Enable image uploads (PNG, JPEG, GIF up to 2MB) in chat messages. Text is also allowed. No other file types.
- [ ] **Channel rules:** Single-channel, single-thread only. No one-on-one private chat, voice, video, markup tags (e.g. `@someone`), or typing indicators.
- [ ] **Content rules:** No external hyperlinks (no malicious-link detection required) and no automatic parental censoring.
- [ ] **Message display:** Show timestamp and sender display name, not the unique user ID. No text size limit. No unread indicators.
- [ ] **Empty rooms:** A user joining a completely fresh chat room with no prior history starts with a blank chat interface.

### 9. UI, Themes & Profiles

- [ ] Apply GA-configured default background-color themes to chat rooms while allowing individual users to apply a unified custom theme across all their groups.
- [ ] Wire profile settings: changeable username; unchangeable email as unique ID; password change with current-password verification; age/DOB; light/dark screen preference; role; profile picture (up to 2MB); group memberships.
- [ ] Profiles are completely private. Other users cannot open them (hovering for basic info is optional).
- [ ] Desktop-first layout that remains usable at tablet sizes.

### 10. Non-Functional Requirements

- [ ] Serve user messages over HTTPS for final client-server communication.
- [ ] Continue using GitHub with frequent commits that demonstrate progress.

### 11. Automated Testing & Verification (course extra)

- [ ] Write automated Unit Tests for Angular components using Jasmine/Karma.
- [ ] Write backend integration tests for Express API endpoints using Mocha/Supertest.
- [ ] Implement End-to-End (E2E) UI testing to validate the multi-user chat and admin workflows.

### 12. Phase 2 Documentation (`Phase2.md`) (course extra)

- [ ] Document final system specifications and requirements.
- [ ] Provide full REST API and WebSocket event documentation.
- [ ] Detail the final Angular component, service, and model architecture.
- [ ] Include testing methodologies and an automated test results table.
