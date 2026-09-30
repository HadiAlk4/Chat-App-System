import { ObjectId } from "mongodb";
import { app, expect, request, seedUser, useCleanDb } from "./setup.js";
import { getDB } from "../db.js";

describe("account deletion routes", () => {
  useCleanDb();

  describe("POST /api/account-deletion-requests", () => {
    it("queues a deletion request", async () => {
      await seedUser();

      const res = await request.execute(app).post("/api/account-deletion-requests").send({
        username: "ada",
      });

      expect(res.body.ok).to.equal(true);
      expect(res.body.request.status).to.equal("pending");
    });

    it("rejects a super admin deletion request", async () => {
      await seedUser({ role: "super-admin" });

      const res = await request.execute(app).post("/api/account-deletion-requests").send({
        username: "ada",
      });

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("Super Admin cannot request account deletion");
    });
  });

  describe("GET /api/account-deletion-requests", () => {
    it("returns pending requests", async () => {
      await getDB().collection("accountDeletionRequests").insertOne({
        username: "ada",
        email: "ada@example.com",
        status: "pending",
      });

      const res = await request.execute(app).get("/api/account-deletion-requests").query({ status: "pending" });

      expect(res.body).to.be.an("array").with.lengthOf(1);
    });

    it("returns an empty list when the status filter matches nothing", async () => {
      await getDB().collection("accountDeletionRequests").insertOne({
        username: "ada",
        status: "pending",
      });

      const res = await request.execute(app).get("/api/account-deletion-requests").query({ status: "approved" });

      expect(res.body).to.deep.equal([]);
    });
  });

  describe("PATCH /api/account-deletion-requests/:id/approve", () => {
    it("deletes the user and bans the email", async () => {
      await seedUser();
      const inserted = await getDB().collection("accountDeletionRequests").insertOne({
        username: "ada",
        email: "ada@example.com",
        role: "user",
        status: "pending",
      });

      const res = await request.execute(app)
        .patch(`/api/account-deletion-requests/${inserted.insertedId}/approve`)
        .send({ performedBy: "super-admin" });

      expect(res.body.ok).to.equal(true);
      const user = await getDB().collection("users").findOne({ username: "ada" });
      const banned = await getDB().collection("bannedEmails").findOne({ email: "ada@example.com" });
      expect(user).to.equal(null);
      expect(banned).to.not.equal(null);
    });

    it("returns 404 when the request is not pending", async () => {
      const res = await request.execute(app)
        .patch(`/api/account-deletion-requests/${new ObjectId()}/approve`)
        .send({});

      expect(res).to.have.status(404);
      expect(res.body.message).to.equal("Pending account deletion request not found");
    });
  });

  describe("PATCH /api/account-deletion-requests/:id/reject", () => {
    it("stores the rejection reason", async () => {
      const inserted = await getDB().collection("accountDeletionRequests").insertOne({
        username: "ada",
        email: "ada@example.com",
        status: "pending",
      });

      const res = await request.execute(app)
        .patch(`/api/account-deletion-requests/${inserted.insertedId}/reject`)
        .send({ reason: "Still active", performedBy: "super-admin" });

      expect(res.body.ok).to.equal(true);
      const saved = await getDB().collection("accountDeletionRequests").findOne({ _id: inserted.insertedId });
      expect(saved.rejectionReason).to.equal("Still active");
    });

    it("rejects a decision that has no reason", async () => {
      const res = await request.execute(app)
        .patch(`/api/account-deletion-requests/${new ObjectId()}/reject`)
        .send({});

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("A rejection reason is required");
    });
  });

  describe("GET /api/banned-emails", () => {
    it("returns banned emails", async () => {
      await getDB().collection("bannedEmails").insertOne({
        email: "ada@example.com",
        bannedAt: new Date(),
      });

      const res = await request.execute(app).get("/api/banned-emails");

      expect(res.body).to.be.an("array").with.lengthOf(1);
      expect(res.body[0].email).to.equal("ada@example.com");
    });

    it("returns an empty list when nobody is banned", async () => {
      const res = await request.execute(app).get("/api/banned-emails");

      expect(res.body).to.deep.equal([]);
    });
  });
});
