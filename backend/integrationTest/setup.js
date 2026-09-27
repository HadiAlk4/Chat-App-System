import bcrypt from "bcrypt";
import { expect, use } from "chai";
import chaiHttp, { request } from "chai-http";
import { createApp } from "../app.js";
import { connectDB, closeDB, getDB } from "../db.js";

use(chaiHttp);

if (process.env.MONGO_DB_NAME !== "chat-app-test") {
  throw new Error("Integration tests must use MONGO_DB_NAME=chat-app-test");
}

export const app = createApp();

export const COLLECTIONS = [
  "users",
  "groups",
  "messages",
  "joinRequests",
  "roomRequests",
  "groupRequests",
  "groupBanRequests",
  "groupDeletionRequests",
  "accountDeletionRequests",
  "bannedEmails",
  "auditLogs",
];

export async function wipeDb() {
  const database = getDB();
  for (const name of COLLECTIONS) {
    await database.collection(name).deleteMany({});
  }
}

export function useCleanDb() {
  before(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    await wipeDb();
  });

  afterEach(async () => {
    await wipeDb();
  });
}

export async function closeTestDb() {
  try {
    await wipeDb();
  } catch {
    // Database was never opened.
  }
  try {
    await closeDB();
  } catch {
    // Client was never opened.
  }
}

export async function seedUser(overrides = {}) {
  const password = overrides.password || "Password1";
  const user = {
    username: "ada",
    email: "ada@example.com",
    dob: "2000-01-01",
    age: 26,
    role: "user",
    valid: true,
    isDarkMode: false,
    profilePictureUrl: "/pfp.png",
    ...overrides,
    password: await bcrypt.hash(password, 8),
  };
  await getDB().collection("users").insertOne(user);
  return user;
}

export async function seedGroup(overrides = {}) {
  const group = {
    groupName: "Readers",
    groupDescription: "Books",
    minAge: 18,
    themeColor: "light",
    admins: ["ada"],
    members: ["ada"],
    rooms: ["Main Room"],
    bannedMembers: [],
    ...overrides,
  };
  await getDB().collection("groups").insertOne(group);
  return group;
}

export { expect, request };
