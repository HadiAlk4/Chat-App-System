import { ObjectId } from "mongodb";
import { app, expect, request, seedGroup, seedUser, useCleanDb } from "./setup.js";
import { getDB } from "../db.js";

describe("group ban request routes", () => {
  useCleanDb();

  async function seedPair() {
    await seedUser({ username: "ada", role: "group-admin" });
    await seedUser({ username: "bea", email: "bea@example.com", role: "user" });
    await seedGroup({ admins: ["ada"], members: ["ada", "bea"] });
  }

  describe("POST /api/group-ban-requests", () => {
    it("queues a ban request against another member", async () => {
      await seedPair();

      const res = await request.execute(app).post("/api/group-ban-requests").send({
        groupName: "Readers",
        targetUsername: "bea",
        requestedBy: "ada",
      });

      expect(res.body.ok).to.equal(true);
      expect(res.body.request.destination).to.equal("group-admin");
    });

    it("rejects a request that is missing fields", async () => {
      const res = await request.execute(app).post("/api/group-ban-requests").send({
        groupName: "Readers",
      });

      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.equal("Group name, target username, and requester are required");
    });
  });

  describe("GET /api/group-ban-requests", () => {
    it("returns pending requests for a destination", async () => {
      await getDB().collection("groupBanRequests").insertOne({
        groupName: "Readers",
        targetUsername: "bea",
        destination: "group-admin",
        status: "pending",
      });

      const res = await request.execute(app).get("/api/group-ban-requests").query({
        destination: "group-admin",
        status: "pending",
      });

      expect(res.body).to.be.an("array").with.lengthOf(1);
    });

    it("returns an empty list when the destination filter matches nothing", async () => {
      await getDB().collection("groupBanRequests").insertOne({
        groupName: "Readers",
        destination: "group-admin",
        status: "pending",
      });

      const res = await request.execute(app).get("/api/group-ban-requests").query({
        destination: "super-admin",
      });

      expect(res.body).to.deep.equal([]);
    });
  });

  describe("PATCH /api/group-ban-requests/:id/approve", () => {
    it("bans the target member", async () => {
      await seedPair();
      const inserted = await getDB().collection("groupBanRequests").insertOne({
        groupName: "Readers",
        targetUsername: "bea",
        destination: "group-admin",
        status: "pending",
      });

      const res = await request.execute(app)
        .patch(`/api/group-ban-requests/${inserted.insertedId}/approve`);

      expect(res.body.ok).to.equal(true);
      const group = await getDB().collection("groups").findOne({ groupName: "Readers" });
      expect(group.bannedMembers).to.include("bea");
    });

    it("returns 404 when the request is not pending", async () => {
      const res = await request.execute(app)
        .patch(`/api/group-ban-requests/${new ObjectId()}/approve`);

      expect(res).to.have.status(404);
      expect(res.body.message).to.equal("Pending ban request not found");
    });
  });

  describe("PATCH /api/group-ban-requests/:id/reject", () => {
    it("stores the rejection reason", async () => {
      const inserted = await getDB().collection("groupBanRequests").insertOne({
        groupName: "Readers",
        targetUsername: "bea",
        destination: "group-admin",
        status: "pending",
      });

      const res = await request.execute(app)
        .patch(`/api/group-ban-requests/${inserted.insertedId}/reject`)
        .send({ reason: "Not warranted" });

      expect(res.body.ok).to.equal(true);
      const saved = await getDB().collection("groupBanRequests").findOne({ _id: inserted.insertedId });
      expect(saved.rejectionReason).to.equal("Not warranted");
    });

    it("rejects a decision that has no reason", async () => {
      const res = await request.execute(app)
        .patch(`/api/group-ban-requests/${new ObjectId()}/reject`)
        .send({});

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("A rejection reason is required");
    });
  });
});
