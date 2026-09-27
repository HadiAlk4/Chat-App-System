import { app, expect, request, seedGroup, seedUser, useCleanDb } from "./setup.js";

describe("member routes", () => {
  useCleanDb();

  describe("PATCH /api/groups/:groupName/members/:username/promote", () => {
    it("adds a member to the admin list", async () => {
      await seedGroup({ admins: ["ada"], members: ["ada", "bea"] });

      const res = await request.execute(app)
        .patch("/api/groups/Readers/members/bea/promote");

      expect(res.body.ok).to.equal(true);
      expect(res.body.admins).to.include("bea");
    });

    it("returns 404 when the user is not in the group", async () => {
      await seedGroup();

      const res = await request.execute(app)
        .patch("/api/groups/Readers/members/bea/promote");

      expect(res).to.have.status(404);
      expect(res.body.message).to.equal("Member not found in this group");
    });
  });

  describe("POST /api/groups/:groupName/members/:username/remove", () => {
    it("removes a member who is not the sole admin", async () => {
      await seedGroup({ admins: ["ada"], members: ["ada", "bea"] });

      const res = await request.execute(app)
        .post("/api/groups/Readers/members/bea/remove");

      expect(res.body.ok).to.equal(true);
      expect(res.body.members).to.not.include("bea");
    });

    it("rejects removal of the sole administrator", async () => {
      await seedGroup({ admins: ["ada"], members: ["ada"] });

      const res = await request.execute(app)
        .post("/api/groups/Readers/members/ada/remove");

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("Cannot remove the sole administrator");
    });
  });

  describe("POST /api/groups/:groupName/members/:username/ban", () => {
    it("permanently bans a member", async () => {
      await seedGroup({ admins: ["ada"], members: ["ada", "bea"] });

      const res = await request.execute(app)
        .post("/api/groups/Readers/members/bea/ban");

      expect(res.body.ok).to.equal(true);
      expect(res.body.bannedMembers).to.include("bea");
      expect(res.body.members).to.not.include("bea");
    });

    it("returns 404 when the user is not in the group", async () => {
      await seedGroup();

      const res = await request.execute(app)
        .post("/api/groups/Readers/members/bea/ban");

      expect(res).to.have.status(404);
      expect(res.body.message).to.equal("Member not found in this group");
    });
  });

  describe("POST /api/groups/:groupName/admins/:username/step-down", () => {
    it("steps down when another group admin remains", async () => {
      await seedUser({ username: "ada", role: "group-admin" });
      await seedUser({ username: "bea", email: "bea@example.com", role: "group-admin" });
      await seedGroup({ admins: ["ada", "bea"], members: ["ada", "bea"] });

      const res = await request.execute(app)
        .post("/api/groups/Readers/admins/ada/step-down");

      expect(res.body.ok).to.equal(true);
      expect(res.body.admins).to.not.include("ada");
      expect(res.body.role).to.equal("user");
    });

    it("rejects a step-down by the sole group admin", async () => {
      await seedGroup({ admins: ["ada"], members: ["ada"] });

      const res = await request.execute(app)
        .post("/api/groups/Readers/admins/ada/step-down");

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("Cannot step down as the sole Group Admin");
    });
  });
});
