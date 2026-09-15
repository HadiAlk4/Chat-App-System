import { ObjectId } from "mongodb";
import { db } from "../db.js";

export function chatRoutes(app) {
  // Fetch message history for a specific room
  app.get("/api/messages/:groupName/:roomName", async (req, res) => {
    try {
      const { groupName, roomName } = req.params;
      const messages = await db.collection("messages")
        .find({ groupName, roomName })
        .sort({ timestamp: 1 })
        .toArray();
      res.send(messages);
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
