import { ObjectId } from "mongodb";
import { db } from "../db.js";

export function roomRequestRoutes(app, io) {
  app.post("/api/room-requests", async (req, res) => {
    try {
      const { groupName, roomName, username } = req.body;
      const cleanRoomName = roomName?.trim();

      if (!groupName || !cleanRoomName || !username) {
        return res.send({ ok: false, message: "Group name, room name, and username are required" });
      }

      const group = await db.collection("groups").findOne({ groupName });
      if (!group) return res.send({ ok: false, message: "Group not found" });

      const isMember = group.members?.includes(username) || group.admins?.includes(username);
      if (!isMember) {
        return res.send({ ok: false, message: "Only group members can propose rooms" });
      }

      if (group.rooms?.some((r) => r.toLowerCase() === cleanRoomName.toLowerCase())) {
        return res.send({ ok: false, message: "A room with this name already exists in this group" });
      }

      const pendingReq = await db.collection("roomRequests").findOne({
        groupName,
        roomName: cleanRoomName,
        status: "pending"
      });
      if (pendingReq) {
        return res.send({ ok: false, message: "A proposal for this room is already pending" });
      }

      const newRoomRequest = {
        groupName,
        roomName: cleanRoomName,
        username,
        status: "pending",
        createdAt: new Date(),
      };

      const result = await db.collection("roomRequests").insertOne(newRoomRequest);
      io.emit("room-request-created", { _id: result.insertedId, ...newRoomRequest });

      res.send({ ok: true, message: "Room proposal submitted successfully" });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  app.get("/api/room-requests", async (req, res) => {
    try {
      const filter = {};
      if (req.query.groupName) filter.groupName = req.query.groupName;
      if (req.query.username) filter.username = req.query.username;
      if (req.query.status) filter.status = req.query.status;

      const requests = await db.collection("roomRequests").find(filter).toArray();
      res.send(requests);
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  app.patch("/api/room-requests/:id/approve", async (req, res) => {
    try {
      const request = await db.collection("roomRequests").findOne({
        _id: new ObjectId(req.params.id),
        status: "pending"
      });

      if (!request) return res.send({ ok: false, message: "Pending room proposal not found" });

      await db.collection("groups").updateOne(
        { groupName: request.groupName },
        { $addToSet: { rooms: request.roomName } }
      );

      await db.collection("roomRequests").updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: "approved", reviewedAt: new Date() } }
      );

      io.emit("room-request-resolved", {
        requestId: req.params.id,
        status: "approved",
        groupName: request.groupName,
        roomName: request.roomName
      });

      res.send({ ok: true, message: "Room proposal approved and room created" });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  app.patch("/api/room-requests/:id/reject", async (req, res) => {
    try {
      const reason = req.body.reason?.trim();
      if (!reason) return res.status(400).send({ ok: false, message: "A rejection reason is required" });

      const request = await db.collection("roomRequests").findOne({
        _id: new ObjectId(req.params.id),
        status: "pending"
      });

      if (!request) return res.status(404).send({ ok: false, message: "Pending room proposal not found" });

      await db.collection("roomRequests").updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: "rejected", rejectionReason: reason, reviewedAt: new Date() } }
      );

      io.emit("room-request-resolved", {
        requestId: req.params.id,
        status: "rejected",
        groupName: request.groupName,
        roomName: request.roomName
      });

      res.send({ ok: true, message: "Room proposal rejected" });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });
}
