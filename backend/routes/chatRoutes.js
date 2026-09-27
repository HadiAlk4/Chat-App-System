import { ObjectId } from "mongodb";
import { db } from "../db.js";
import { latestMessagesOldestFirst } from "../lib/messageWindow.js";

export function chatRoutes(app) {
  // Fetch message history for a specific room
  app.get("/api/messages/:groupName/:roomName", async (req, res) => {
    try {
      const { groupName, roomName } = req.params;
      const { username } = req.query;
      if (!username || typeof username !== "string") {
        return res.status(400).send({ ok: false, message: "Username is required" });
      }

      const user = await db.collection("users").findOne({ username });
      if (user?.role === "super-admin") {
        return res.status(403).send({ ok: false, message: "Super Admin cannot view chat history" });
      }

      // Last 5 on join/re-entry only; live socket messages stay uncapped while the user remains in the room
      const messages = await db.collection("messages")
        .find({ groupName, roomName })
        .toArray();
      res.send(latestMessagesOldestFirst(messages));
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  // Delete message
  app.delete("/api/messages/:id", async (req, res) => {
    try {
      const result = await db.collection("messages").deleteOne({
        _id: new ObjectId(req.params.id)
      });
      if (result.deletedCount === 0) {
        return res.status(404).send({ ok: false, message: "Message not found" });
      }
      res.send({ ok: true, message: "Message deleted" });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });
}
