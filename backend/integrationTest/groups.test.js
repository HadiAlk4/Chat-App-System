import { app, expect, request, seedGroup, seedUser, useCleanDb } from "./setup.js";
import { getDB } from "../db.js";

describe("group routes", () => {
  useCleanDb();

  describe("GET /api/groups", () => {
    it("returns every group", async () => {
      await seedGroup();

      const res = await request.execute(app).get("/api/groups");

      expect(res).to.have.status(200);
      expect(res.body).to.be.an("array").with.lengthOf(1);
      expect(res.body[0].groupName).to.equal("Readers");
    });

    it("returns an empty list when no groups exist", async () => {
      const res = await request.execute(app).get("/api/groups");

      expect(res).to.have.status(200);
      expect(res.body).to.deep.equal([]);
    });
  });

  describe("GET /api/groups/user/:username", () => {
    it("returns groups the user belongs to", async () => {
      await seedGroup({ members: ["ada", "bea"], admins: ["ada"] });

      const res = await request.execute(app).get("/api/groups/user/bea");

      expect(res.body).to.be.an("array").with.lengthOf(1);
      expect(res.body[0].groupName).to.equal("Readers");
    });

    it("returns an empty list for a user who belongs to no group", async () => {
      await seedGroup();

      const res = await request.execute(app).get("/api/groups/user/nobody");

      expect(res.body).to.deep.equal([]);
    });
  });

  describe("GET /api/groups/:groupName", () => {
    it("returns one group", async () => {
      await seedGroup();

      const res = await request.execute(app).get("/api/groups/Readers");

      expect(res).to.have.status(200);
      expect(res.body.ok).to.equal(true);
      expect(res.body.group.groupName).to.equal("Readers");
    });

    it("returns 404 when the group does not exist", async () => {
      const res = await request.execute(app).get("/api/groups/Missing");

      expect(res).to.have.status(404);
      expect(res.body.ok).to.equal(false);
    });
  });

  describe("POST /api/groups/:groupName/leave", () => {
    it("removes a member who is not the sole admin", async () => {
      await seedGroup({ admins: ["ada"], members: ["ada", "bea"] });

      const res = await request.execute(app).post("/api/groups/Readers/leave").send({
        username: "bea",
      });

      expect(res).to.have.status(200);
      expect(res.body.ok).to.equal(true);
      const group = await getDB().collection("groups").findOne({ groupName: "Readers" });
      expect(group.members).to.not.include("bea");
    });

    it("rejects a leave request with no username", async () => {
      await seedGroup();

      const res = await request.execute(app).post("/api/groups/Readers/leave").send({});

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("Username is required");
    });
  });

  describe("PATCH /api/groups/:groupName", () => {
    it("saves settings and removes members under the new minimum age", async () => {
      await seedUser({ username: "ada", age: 30 });
      await seedUser({ username: "bea", email: "bea@example.com", age: 16 });
      await seedGroup({
        minAge: 10,
        admins: ["ada"],
        members: ["ada", "bea"],
      });

      const res = await request.execute(app).patch("/api/groups/Readers").send({
        groupName: "Readers",
        groupDescription: "Updated books",
        minAge: 18,
        themeColor: "dark",
        username: "ada",
      });

      expect(res.body.ok).to.equal(true);
      expect(res.body.group.minAge).to.equal(18);
      expect(res.body.group.members).to.not.include("bea");
      expect(res.body.group.admins).to.include("ada");
    });

    it("rejects a member who is not a Group Admin", async () => {
      await seedGroup({ admins: ["ada"], members: ["ada", "bea"] });

      const res = await request.execute(app).patch("/api/groups/Readers").send({
        groupName: "Readers",
        groupDescription: "Hacked",
        minAge: 99,
        themeColor: "dark",
        username: "bea",
      });

      expect(res).to.have.status(403);
      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.equal("Only a Group Admin can change these settings");
      const group = await getDB().collection("groups").findOne({ groupName: "Readers" });
      expect(group.minAge).to.equal(18);
    });
  });
});
