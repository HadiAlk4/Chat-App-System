import { app, expect, request, seedGroup, useCleanDb } from "./setup.js";

describe("room routes", () => {
  useCleanDb();

  describe("POST /api/groups/:groupName/rooms/direct", () => {
    it("adds a room", async () => {
      await seedGroup();

      const res = await request.execute(app).post("/api/groups/Readers/rooms/direct").send({
        roomName: "Quiet",
      });

      expect(res.body.ok).to.equal(true);
      expect(res.body.rooms).to.include("Quiet");
    });

    it("rejects a missing room name", async () => {
      await seedGroup();

      const res = await request.execute(app).post("/api/groups/Readers/rooms/direct").send({});

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("Room name is required");
    });
  });

  describe("PATCH /api/groups/:groupName/rooms/rename", () => {
    it("renames a room", async () => {
      await seedGroup({ rooms: ["Main Room"] });

      const res = await request.execute(app).patch("/api/groups/Readers/rooms/rename").send({
        oldName: "Main Room",
        newName: "Lobby",
      });

      expect(res.body.ok).to.equal(true);
      expect(res.body.rooms).to.include("Lobby");
      expect(res.body.rooms).to.not.include("Main Room");
    });

    it("rejects a rename that omits the new name", async () => {
      await seedGroup();

      const res = await request.execute(app).patch("/api/groups/Readers/rooms/rename").send({
        oldName: "Main Room",
      });

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("oldName and newName are required");
    });
  });

  describe("DELETE /api/groups/:groupName/rooms/:roomName", () => {
    it("deletes a room", async () => {
      await seedGroup({ rooms: ["Main Room", "Quiet"] });

      const res = await request.execute(app).delete("/api/groups/Readers/rooms/Quiet");

      expect(res.body.ok).to.equal(true);
      expect(res.body.rooms).to.not.include("Quiet");
    });

    it("returns 404 when the room does not exist", async () => {
      await seedGroup();

      const res = await request.execute(app).delete("/api/groups/Readers/rooms/Missing");

      expect(res).to.have.status(404);
      expect(res.body.message).to.equal("Room not found");
    });
  });

  describe("POST /api/rooms", () => {
    it("adds a room to an existing group", async () => {
      await seedGroup();

      const res = await request.execute(app).post("/api/rooms").send({
        groupName: "Readers",
        roomName: "Annex",
      });

      expect(res.body.ok).to.equal(true);
      expect(res.body.rooms).to.include("Annex");
    });

    it("rejects a room for a group that does not exist", async () => {
      const res = await request.execute(app).post("/api/rooms").send({
        groupName: "Missing",
        roomName: "Annex",
      });

      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.equal("Group not found");
    });
  });
});
