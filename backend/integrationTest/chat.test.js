import { ObjectId } from "mongodb";
import { app, expect, request, seedUser, useCleanDb } from "./setup.js";
import { getDB } from "../db.js";

describe("chat routes", () => {
  useCleanDb();

  describe("GET /api/messages/:groupName/:roomName", () => {
    it("returns the latest five messages oldest first", async () => {
      await seedUser();
      const messages = getDB().collection("messages");
      for (let minute = 0; minute < 6; minute += 1) {
        await messages.insertOne({
          groupName: "Readers",
          roomName: "Main",
          senderUserName: "ada",
          content: `m${minute}`,
          timestamp: new Date(Date.UTC(2026, 0, 1, 0, minute)),
        });
      }

      const res = await request.execute(app).get("/api/messages/Readers/Main").query({ username: "ada" });

      expect(res).to.have.status(200);
      expect(res.body.map((message) => message.content)).to.deep.equal(["m1", "m2", "m3", "m4", "m5"]);
    });

    it("forbids a super admin from reading chat history", async () => {
      await seedUser({ role: "super-admin" });

      const res = await request.execute(app).get("/api/messages/Readers/Main").query({ username: "ada" });

      expect(res).to.have.status(403);
      expect(res.body.message).to.equal("Super Admin cannot view chat history");
    });
  });

  describe("DELETE /api/messages/:id", () => {
    it("deletes a stored message", async () => {
      const inserted = await getDB().collection("messages").insertOne({
        groupName: "Readers",
        roomName: "Main",
        senderUserName: "ada",
        content: "hello",
        timestamp: new Date(),
      });

      const res = await request.execute(app).delete(`/api/messages/${inserted.insertedId}`);

      expect(res.body.ok).to.equal(true);
      const saved = await getDB().collection("messages").findOne({ _id: inserted.insertedId });
      expect(saved).to.equal(null);
    });

    it("returns 404 when the message does not exist", async () => {
      const res = await request.execute(app).delete(`/api/messages/${new ObjectId()}`);

      expect(res).to.have.status(404);
      expect(res.body.message).to.equal("Message not found");
    });
  });
});
