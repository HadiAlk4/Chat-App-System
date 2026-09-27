import { ObjectId } from "mongodb";
import { app, expect, request, seedGroup, seedUser, useCleanDb } from "./setup.js";
import { getDB } from "../db.js";

describe("join request routes", () => {
  useCleanDb();

  describe("POST /api/join-requests", () => {
    it("creates a pending join request", async () => {
      await seedUser({ username: "bea", email: "bea@example.com", age: 20 });
      await seedGroup({ admins: ["ada"], members: ["ada"], minAge: 18 });

      const res = await request.execute(app).post("/api/join-requests").send({
        groupName: "Readers",
        username: "bea",
      });

      expect(res.body.ok).to.equal(true);
      const saved = await getDB().collection("joinRequests").findOne({ username: "bea" });
      expect(saved.status).to.equal("pending");
    });

    it("rejects a user who is under the group minimum age", async () => {
      await seedUser({ username: "bea", email: "bea@example.com", age: 12 });
      await seedGroup({ minAge: 18 });

      const res = await request.execute(app).post("/api/join-requests").send({
        groupName: "Readers",
        username: "bea",
      });

      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.equal("User is not old enough to join this group");
    });
  });

  describe("GET /api/join-requests", () => {
    it("returns pending requests for a group", async () => {
      await getDB().collection("joinRequests").insertOne({
        groupName: "Readers",
        username: "bea",
        status: "pending",
      });

      const res = await request.execute(app).get("/api/join-requests").query({
        groupName: "Readers",
        status: "pending",
      });

      expect(res.body).to.be.an("array").with.lengthOf(1);
    });

    it("returns an empty list when the status filter matches nothing", async () => {
      await getDB().collection("joinRequests").insertOne({
        groupName: "Readers",
        username: "bea",
        status: "pending",
      });

      const res = await request.execute(app).get("/api/join-requests").query({ status: "approved" });

      expect(res.body).to.deep.equal([]);
    });
  });

  describe("PATCH /api/join-requests/:id/approve", () => {
    it("adds the requester to the group", async () => {
      await seedGroup({ admins: ["ada"], members: ["ada"] });
      const inserted = await getDB().collection("joinRequests").insertOne({
        groupName: "Readers",
        username: "bea",
        status: "pending",
      });

      const res = await request.execute(app)
        .patch(`/api/join-requests/${inserted.insertedId}/approve`);

      expect(res.body.ok).to.equal(true);
      const group = await getDB().collection("groups").findOne({ groupName: "Readers" });
      expect(group.members).to.include("bea");
    });

    it("rejects an id that is not a pending request", async () => {
      const res = await request.execute(app)
        .patch(`/api/join-requests/${new ObjectId()}/approve`);

      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.equal("Pending join request not found");
    });
  });

  describe("PATCH /api/join-requests/:id/reject", () => {
    it("stores the rejection reason", async () => {
      const inserted = await getDB().collection("joinRequests").insertOne({
        groupName: "Readers",
        username: "bea",
        status: "pending",
      });

      const res = await request.execute(app)
        .patch(`/api/join-requests/${inserted.insertedId}/reject`)
        .send({ reason: "Room is full" });

      expect(res.body.ok).to.equal(true);
      const saved = await getDB().collection("joinRequests").findOne({ _id: inserted.insertedId });
      expect(saved.rejectionReason).to.equal("Room is full");
    });

    it("rejects a decision that has no reason", async () => {
      const res = await request.execute(app)
        .patch(`/api/join-requests/${new ObjectId()}/reject`)
        .send({});

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("A rejection reason is required");
    });
  });
});
