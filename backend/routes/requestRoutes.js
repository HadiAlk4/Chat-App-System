import { ObjectId } from "mongodb";
import { db } from "../db.js";
import { isUnderMinAge } from "../lib/ageGate.js";

export function requestRoutes(app, io) {
  app.post("/api/join-requests", async (req, res) => {
    try {
      const { groupName, username } = req.body;
      if (!groupName || !username) {
        return res.send({ ok: false, valid: false, message: "All fields are required" });
      }

      const user = await db.collection("users").findOne({ username });
      if (!user) return res.send({ ok: false, valid: false, message: "User not found" });

      if (user.role === "super-admin") {
        return res.send({ ok: false, message: "Super Admin cannot join groups" });
      }

      const group = await db.collection("groups").findOne({ groupName });
      if (!group) return res.send({ ok: false, valid: false, message: "Group not found" });

      if (isUnderMinAge(user.age, group.minAge)) {
        return res.send({ ok: false, valid: false, message: "User is not old enough to join this group" });
      }

      const alreadyMember = group.members?.includes(username) || group.admins?.includes(username);
      if (alreadyMember) {
        return res.send({ ok: false, valid: false, message: "User is already a member of this group" });
      }

      if (group.bannedMembers?.includes(username)) {
        return res.send({ ok: false, valid: false, message: "User is permanently banned from this group" });
      }

      const duplicateRequest = await db.collection("joinRequests").findOne({ groupName, username, status: "pending" });
      if (duplicateRequest) {
        return res.send({ ok: false, valid: false, message: "Join request already exists" });
      }

      const newRequest = {
        groupName,
        username,
        status: "pending",
        createdAt: new Date(),
      };

      const result = await db.collection("joinRequests").insertOne(newRequest);
      io.emit("join-request-created", { _id: result.insertedId, ...newRequest });

      res.send({ ok: true, message: "Join request submitted" });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  app.get("/api/join-requests", async (req, res) => {
    try {
      const filter = {};
      if (req.query.groupName) filter.groupName = req.query.groupName;
      if (req.query.username) filter.username = req.query.username;
      if (req.query.status) filter.status = req.query.status;

      const requests = await db.collection("joinRequests").find(filter).toArray();
      res.send(requests);
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  app.patch("/api/join-requests/:id/approve", async (req, res) => {
    try {
      const request = await db.collection("joinRequests").findOne({
        _id: new ObjectId(req.params.id),
        status: "pending",
      });

      if (!request) return res.send({ ok: false, message: "Pending join request not found" });

      const group = await db.collection("groups").findOne({ groupName: request.groupName });
      if (group?.bannedMembers?.includes(request.username)) {
        return res.send({ ok: false, message: "User is permanently banned from this group" });
      }

      await db.collection("groups").updateOne(
        { groupName: request.groupName },
        { $addToSet: { members: request.username } }
      );

      await db.collection("joinRequests").updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: "approved", reviewedAt: new Date() } }
      );

      io.emit("join-request-resolved", {
        requestId: req.params.id,
        status: "approved",
        groupName: request.groupName,
        username: request.username,
      });

      res.send({ ok: true, message: "Join request approved" });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  app.patch("/api/join-requests/:id/reject", async (req, res) => {
    try {
      const reason = req.body.reason?.trim();
      if (!reason) return res.status(400).send({ ok: false, message: "A rejection reason is required" });

      const request = await db.collection("joinRequests").findOne({
        _id: new ObjectId(req.params.id),
        status: "pending",
      });

      if (!request) return res.status(404).send({ ok: false, message: "Pending join request not found" });

      await db.collection("joinRequests").updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: "rejected", rejectionReason: reason, reviewedAt: new Date() } }
      );

      io.emit("join-request-resolved", {
        requestId: req.params.id,
        status: "rejected",
        groupName: request.groupName,
        username: request.username,
      });

      res.send({ ok: true, message: "Join request rejected" });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });
}
