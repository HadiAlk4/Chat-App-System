import { app, expect, request, seedUser, useCleanDb } from "./setup.js";
import { getDB } from "../db.js";

describe("auth routes", () => {
  useCleanDb();

  describe("POST /api/auth", () => {
    it("logs in with a valid email and password", async () => {
      await seedUser();

      const res = await request.execute(app).post("/api/auth").send({
        email: "ada@example.com",
        password: "Password1",
      });

      expect(res).to.have.status(200);
      expect(res.body.ok).to.equal(true);
      expect(res.body.valid).to.equal(true);
      expect(res.body.user.username).to.equal("ada");
      expect(res.body.user.password).to.equal(undefined);
    });

    it("rejects a wrong password", async () => {
      await seedUser();

      const res = await request.execute(app).post("/api/auth").send({
        email: "ada@example.com",
        password: "WrongPass1",
      });

      expect(res.body.ok).to.equal(false);
      expect(res.body.valid).to.equal(false);
      expect(res.body.message).to.equal("Invalid Credentials");
    });

    it("tells a permanently banned account it cannot log in", async () => {
      await getDB().collection("bannedEmails").insertOne({ email: "ada@example.com" });

      const res = await request.execute(app).post("/api/auth").send({
        email: "ada@example.com",
        password: "Password1",
      });

      expect(res.body.ok).to.equal(false);
      expect(res.body.banned).to.equal(true);
      expect(res.body.message).to.match(/permanently banned/);
    });
  });

  describe("POST /api/signup", () => {
    it("creates the first account as super admin", async () => {
      const res = await request.execute(app).post("/api/signup").send({
        username: "ada",
        email: "ada@example.com",
        password: "Password1",
        dob: "2000-01-01",
        age: 26,
      });

      expect(res.body.ok).to.equal(true);
      expect(res.body.user.role).to.equal("super-admin");
      expect(res.body.user.password).to.equal(undefined);
    });

    it("rejects a password without an uppercase letter", async () => {
      const res = await request.execute(app).post("/api/signup").send({
        username: "ada",
        email: "ada@example.com",
        password: "password1",
        dob: "2000-01-01",
        age: 26,
      });

      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.match(/uppercase/);
    });

    it("rejects a permanently banned email", async () => {
      await getDB().collection("bannedEmails").insertOne({ email: "ada@example.com" });

      const res = await request.execute(app).post("/api/signup").send({
        username: "ada",
        email: "ada@example.com",
        password: "Password1",
        dob: "2000-01-01",
        age: 26,
      });

      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.equal("This email is permanently banned");
    });
  });
});
