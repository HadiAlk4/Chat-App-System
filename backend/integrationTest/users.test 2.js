import { app, expect, request, seedUser, useCleanDb } from "./setup.js";
import { getDB } from "../db.js";

describe("user routes", () => {
  useCleanDb();

  describe("PATCH /api/users/username", () => {
    it("renames the account", async () => {
      await seedUser();

      const res = await request.execute(app).patch("/api/users/username").send({
        email: "ada@example.com",
        newUsername: "ada2",
      });

      expect(res.body.ok).to.equal(true);
      expect(res.body.user.username).to.equal("ada2");
      const saved = await getDB().collection("users").findOne({ email: "ada@example.com" });
      expect(saved.username).to.equal("ada2");
    });

    it("rejects a missing new username", async () => {
      const res = await request.execute(app).patch("/api/users/username").send({
        email: "ada@example.com",
      });

      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.equal("Email and new username are required");
    });
  });

  describe("PATCH /api/users/password", () => {
    it("changes the password when the current password matches", async () => {
      await seedUser();

      const res = await request.execute(app).patch("/api/users/password").send({
        email: "ada@example.com",
        currentPassword: "Password1",
        newPassword: "Password2",
      });

      expect(res.body.ok).to.equal(true);

      const login = await request.execute(app).post("/api/auth").send({
        email: "ada@example.com",
        password: "Password2",
      });
      expect(login.body.ok).to.equal(true);
    });

    it("rejects a wrong current password", async () => {
      await seedUser();

      const res = await request.execute(app).patch("/api/users/password").send({
        email: "ada@example.com",
        currentPassword: "WrongPass1",
        newPassword: "Password2",
      });

      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.equal("Current password is incorrect");
    });
  });

  describe("PATCH /api/users/theme", () => {
    it("saves the chat theme flags", async () => {
      await seedUser();

      const res = await request.execute(app).patch("/api/users/theme").send({
        email: "ada@example.com",
        isDarkMode: true,
        usePersonalTheme: true,
      });

      expect(res.body.ok).to.equal(true);
      expect(res.body.user.isDarkMode).to.equal(true);
      expect(res.body.user.usePersonalTheme).to.equal(true);
    });

    it("rejects a theme update that omits the boolean flags", async () => {
      const res = await request.execute(app).patch("/api/users/theme").send({
        email: "ada@example.com",
        isDarkMode: true,
      });

      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.match(/booleans/);
    });
  });
});
