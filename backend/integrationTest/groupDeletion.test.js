import { ObjectId } from "mongodb";
import { app, expect, request, seedGroup, seedUser, useCleanDb } from "./setup.js";
import { getDB } from "../db.js";

describe("group deletion routes", () => {
  useCleanDb();

  describe("POST /api/group-deletion-requests", () => {
    it("queues a deletion request from a group admin", async () => {
      await seedUser({ username: "ada", role: "group-admin" });
      await seedGroup({ admins: ["ada"], members: ["ada"] });

      const res = await request.execute(app).post("/api/group-deletion-requests").send({
        groupName: "Readers",
        requestedBy: "ada",
        reason: "Inactive",
      });

      expect(res.body.ok).to.equal(true);
      expect(res.body.request.status).to.equal("pending");
    });

    it("rejects a request that is missing a reason", async () => {
      const res = await request.execute(app).post("/api/group-deletion-requests").send({
        groupName: "Readers",
        requestedBy: "ada",
      });

      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.equal("Group name, requester, and reason are required");
    });
  });

  describe("GET /api/group-deletion-requests", () => {
    it("returns pending requests", async () => {
      await getDB().collection("groupDeletionRequests").insertOne({
        groupName: "Readers",
        requestedBy: "ada",
        status: "pending",
      });

      const res = await request.execute(app).get("/api/group-deletion-requests").query({ status: "pending" });

      expect(res.body).to.be.an("array").with.lengthOf(1);
    });

    it("returns an empty list when the status filter matches nothing", async () => {
      await getDB().collection("groupDeletionRequests").insertOne({
        groupName: "Readers",
        status: "pending",
      });

      const res = await request.execute(app).get("/api/group-deletion-requests").query({ status: "rejected" });

      expect(res.body).to.deep.equal([]);
    });
  });

  describe("PATCH /api/group-deletion-requests/:id/approve", () => {
    it("deletes the group and demotes the requesting admin", async () => {
      await seedUser({ username: "ada", role: "group-admin" });
      await seedGroup({ admins: ["ada"], members: ["ada"] });
      const inserted = await getDB().collection("groupDeletionRequests").insertOne({
        groupName: "Readers",
        requestedBy: "ada",
        status: "pending",
      });

      const res = await request.execute(app)
        .patch(`/api/group-deletion-requests/${inserted.insertedId}/approve`)
        .send({ performedBy: "super-admin" });

      expect(res.body.ok).to.equal(true);
      const group = await getDB().collection("groups").findOne({ groupName: "Readers" });
      const user = await getDB().collection("users").findOne({ username: "ada" });
      expect(group).to.equal(null);
      expect(user.role).to.equal("user");
    });

    it("returns 404 when the request is not pending", async () => {
      const res = await request.execute(app)
        .patch(`/api/group-deletion-requests/${new ObjectId()}/approve`);

      expect(res).to.have.status(404);
      expect(res.body.message).to.equal("Pending group deletion request not found");
    });
  });

  describe("PATCH /api/group-deletion-requests/:id/reject", () => {
    it("stores the rejection reason", async () => {
      const inserted = await getDB().collection("groupDeletionRequests").insertOne({
        groupName: "Readers",
        requestedBy: "ada",
        status: "pending",
      });

      const res = await request.execute(app)
        .patch(`/api/group-deletion-requests/${inserted.insertedId}/reject`)
        .send({ reason: "Still active", performedBy: "super-admin" });

      expect(res.body.ok).to.equal(true);
      const saved = await getDB().collection("groupDeletionRequests").findOne({ _id: inserted.insertedId });
      expect(saved.rejectionReason).to.equal("Still active");
    });

    it("rejects a decision that has no reason", async () => {
      const res = await request.execute(app)
        .patch(`/api/group-deletion-requests/${new ObjectId()}/reject`)
        .send({});

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("A rejection reason is required");
    });
  });
});
