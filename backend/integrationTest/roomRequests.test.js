import { ObjectId } from "mongodb";
import { app, expect, request, seedGroup, useCleanDb } from "./setup.js";
import { getDB } from "../db.js";

describe("room request routes", () => {
  useCleanDb();

  describe("POST /api/room-requests", () => {
    it("creates a pending room proposal", async () => {
      await seedGroup({ admins: ["ada"], members: ["ada"] });

      const res = await request.execute(app).post("/api/room-requests").send({
        groupName: "Readers",
        roomName: "Quiet",
        username: "ada",
      });

      expect(res.body.ok).to.equal(true);
      const saved = await getDB().collection("roomRequests").findOne({ roomName: "Quiet" });
      expect(saved.status).to.equal("pending");
    });

    it("rejects a proposal that is missing fields", async () => {
      const res = await request.execute(app).post("/api/room-requests").send({
        groupName: "Readers",
      });

      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.equal("Group name, room name, and username are required");
    });
  });

  describe("GET /api/room-requests", () => {
    it("returns pending proposals for a group", async () => {
      await getDB().collection("roomRequests").insertOne({
        groupName: "Readers",
        roomName: "Quiet",
        username: "ada",
        status: "pending",
      });

      const res = await request.execute(app).get("/api/room-requests").query({
        groupName: "Readers",
        status: "pending",
      });

      expect(res.body).to.be.an("array").with.lengthOf(1);
    });

    it("returns an empty list when the status filter matches nothing", async () => {
      await getDB().collection("roomRequests").insertOne({
        groupName: "Readers",
        roomName: "Quiet",
        status: "pending",
      });

      const res = await request.execute(app).get("/api/room-requests").query({ status: "approved" });

      expect(res.body).to.deep.equal([]);
    });
  });

  describe("PATCH /api/room-requests/:id/approve", () => {
    it("adds the proposed room", async () => {
      await seedGroup({ rooms: ["Main Room"] });
      const inserted = await getDB().collection("roomRequests").insertOne({
        groupName: "Readers",
        roomName: "Quiet",
        username: "ada",
        status: "pending",
      });

      const res = await request.execute(app)
        .patch(`/api/room-requests/${inserted.insertedId}/approve`);

      expect(res.body.ok).to.equal(true);
      const group = await getDB().collection("groups").findOne({ groupName: "Readers" });
      expect(group.rooms).to.include("Quiet");
    });

    it("rejects an id that is not a pending proposal", async () => {
      const res = await request.execute(app)
        .patch(`/api/room-requests/${new ObjectId()}/approve`);

      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.equal("Pending room proposal not found");
    });
  });

  describe("PATCH /api/room-requests/:id/reject", () => {
    it("stores the rejection reason", async () => {
      const inserted = await getDB().collection("roomRequests").insertOne({
        groupName: "Readers",
        roomName: "Quiet",
        username: "ada",
        status: "pending",
      });

      const res = await request.execute(app)
        .patch(`/api/room-requests/${inserted.insertedId}/reject`)
        .send({ reason: "Too similar" });

      expect(res.body.ok).to.equal(true);
      const saved = await getDB().collection("roomRequests").findOne({ _id: inserted.insertedId });
      expect(saved.rejectionReason).to.equal("Too similar");
    });

    it("rejects a decision that has no reason", async () => {
      const res = await request.execute(app)
        .patch(`/api/room-requests/${new ObjectId()}/reject`)
        .send({});

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("A rejection reason is required");
    });
  });
});
