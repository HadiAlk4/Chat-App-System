import { db } from "../db.js";

export function roomRoutes(app) {
  // GA: add a room directly (no proposal approval)
  app.post("/api/groups/:groupName/rooms/direct", async (req, res) => {
    try {
      const { groupName } = req.params;
      const roomName = req.body.roomName?.trim();

      if (!roomName) {
        return res.status(400).send({ ok: false, message: "Room name is required" });
      }

      const groupsCollection = db.collection("groups");
      const group = await groupsCollection.findOne({ groupName });

      if (!group) {
        return res.status(404).send({ ok: false, message: "Group not found" });
      }

      if (group.rooms?.some((r) => r.toLowerCase() === roomName.toLowerCase())) {
        return res.status(400).send({ ok: false, message: "A room with this name already exists in this group" });
      }

      await groupsCollection.updateOne(
        { groupName },
        { $addToSet: { rooms: roomName } }
      );

      const updatedGroup = await groupsCollection.findOne({ groupName });
      res.send({ ok: true, rooms: updatedGroup.rooms });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  // GA: rename a room
  app.patch("/api/groups/:groupName/rooms/rename", async (req, res) => {
    try {
      const { groupName } = req.params;
      const oldName = req.body.oldName?.trim();
      const newName = req.body.newName?.trim();

      if (!oldName || !newName) {
        return res.status(400).send({ ok: false, message: "oldName and newName are required" });
      }

      const groupsCollection = db.collection("groups");
      const group = await groupsCollection.findOne({ groupName });

      if (!group) {
        return res.status(404).send({ ok: false, message: "Group not found" });
      }

      const rooms = group.rooms || [];
      const existingRoom = rooms.find((r) => r.toLowerCase() === oldName.toLowerCase());
      if (!existingRoom) {
        return res.status(404).send({ ok: false, message: "Room not found" });
      }

      const nameTaken = rooms.some(
        (r) => r.toLowerCase() === newName.toLowerCase() && r.toLowerCase() !== existingRoom.toLowerCase()
      );
      if (nameTaken) {
        return res.status(400).send({ ok: false, message: "A room with this name already exists in this group" });
      }

      await groupsCollection.updateOne(
        { groupName, rooms: existingRoom },
        { $set: { "rooms.$": newName } }
      );

      const updatedGroup = await groupsCollection.findOne({ groupName });
      res.send({ ok: true, rooms: updatedGroup.rooms });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  // GA: delete a room
  app.delete("/api/groups/:groupName/rooms/:roomName", async (req, res) => {
    try {
      const { groupName, roomName } = req.params;
      const groupsCollection = db.collection("groups");
      const group = await groupsCollection.findOne({ groupName });

      if (!group) {
        return res.status(404).send({ ok: false, message: "Group not found" });
      }

      const existingRoom = group.rooms?.find((r) => r.toLowerCase() === roomName.toLowerCase());
      if (!existingRoom) {
        return res.status(404).send({ ok: false, message: "Room not found" });
      }

      await groupsCollection.updateOne(
        { groupName },
        { $pull: { rooms: existingRoom } }
      );

      const updatedGroup = await groupsCollection.findOne({ groupName });
      res.send({ ok: true, rooms: updatedGroup.rooms });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  // create a new room
  app.post("/api/rooms", async (req, res) => {
    try {
      const { groupName, roomName } = req.body;
      const groupsCollection = db.collection("groups");

      const result = await groupsCollection.updateOne(
        { groupName },
        { $addToSet: { rooms: roomName } }
      );

      if (result.matchedCount === 0) {
        return res.send({ ok: false, message: "Group not found" });
      }

      const updatedGroup = await groupsCollection.findOne({ groupName });
      res.send({ ok: true, rooms: updatedGroup.rooms });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });
}
