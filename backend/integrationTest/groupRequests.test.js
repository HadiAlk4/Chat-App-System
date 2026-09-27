import { ObjectId } from "mongodb";
import { app, expect, request, seedUser, useCleanDb } from "./setup.js";
import { getDB } from "../db.js";

describe("group request routes", () => {
  useCleanDb();

  describe("POST /api/group-requests", () => {
    it("queues a proposal", async () => {
      await seedUser();

      const res = await request.execute(app).post("/api/group-requests").send({
        groupName: "Readers",
        groupDescription: "Books",
        minAge: 18,
        themeColor: "light",
        creatorUserName: "ada",
        creatorEmail: "ada@example.com",
      });

      expect(res.body.ok).to.equal(true);
      const saved = await getDB().collection("groupRequests").findOne({ groupName: "Readers" });
      expect(saved.status).to.equal("pending");
    });

    it("rejects a proposal that is missing fields", async () => {
      const res = await request.execute(app).post("/api/group-requests").send({
        groupName: "Readers",
      });

      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.equal("All fields are required");
    });
  });

  describe("GET /api/group-requests", () => {
    it("returns pending proposals", async () => {
      await getDB().collection("groupRequests").insertOne({
        groupName: "Readers",
        status: "pending",
      });

      const res = await request.execute(app).get("/api/group-requests").query({ status: "pending" });

      expect(res.body).to.be.an("array").with.lengthOf(1);
    });

    it("returns an empty list when the status filter matches nothing", async () => {
      await getDB().collection("groupRequests").insertOne({
        groupName: "Readers",
        status: "pending",
      });

      const res = await request.execute(app).get("/api/group-requests").query({ status: "approved" });

      expect(res.body).to.deep.equal([]);
    });
  });

  describe("PATCH /api/group-requests/:id/approve", () => {
    it("creates the group and assigns the proposer as admin", async () => {
      const inserted = await getDB().collection("groupRequests").insertOne({
        groupName: "Readers",
        groupDescription: "Books",
        minAge: 18,
        themeColor: "light",
        creatorUserName: "ada",
        creatorEmail: "ada@example.com",
        status: "pending",
      });

      const res = await request.execute(app)
        .patch(`/api/group-requests/${inserted.insertedId}/approve`)
        .send({ performedBy: "super-admin" });

      expect(res.body.ok).to.equal(true);
      const group = await getDB().collection("groups").findOne({ groupName: "Readers" });
      expect(group.admins).to.deep.equal(["ada"]);
    });

    it("rejects an id that is not a pending proposal", async () => {
      const res = await request.execute(app)
        .patch(`/api/group-requests/${new ObjectId()}/approve`)
        .send({});

      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.equal("Request not found");
    });
  });

  describe("PATCH /api/group-requests/:id/reject", () => {
    it("stores the rejection reason", async () => {
      const inserted = await getDB().collection("groupRequests").insertOne({
        groupName: "Readers",
        status: "pending",
      });

      const res = await request.execute(app)
        .patch(`/api/group-requests/${inserted.insertedId}/reject`)
        .send({ reason: "Duplicate topic", performedBy: "super-admin" });

      expect(res.body.ok).to.equal(true);
      const saved = await getDB().collection("groupRequests").findOne({ _id: inserted.insertedId });
      expect(saved.rejectionReason).to.equal("Duplicate topic");
    });

    it("rejects a decision that has no reason", async () => {
      const res = await request.execute(app)
        .patch(`/api/group-requests/${new ObjectId()}/reject`)
        .send({});

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("A rejection reason is required");
    });
  });
});
