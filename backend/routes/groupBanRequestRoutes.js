import { ObjectId } from "mongodb";
import { db } from "../db.js";
import { banFromGroup } from "./memberRoutes.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function groupBanRequestRoutes(app, io) {
  app.post("/api/group-ban-requests", async (req, res) => {
    try {
      const groupName = String(req.body.groupName || "").trim();
      const targetUsername = String(req.body.targetUsername || "").trim();
      const requestedBy = String(req.body.requestedBy || "").trim();

      if (!groupName || !targetUsername || !requestedBy) {
        return res.send({ ok: false, message: "Group name, target username, and requester are required" });
      }

      const group = await db.collection("groups").findOne({ groupName });
      if (!group) {
        return res.status(404).send({ ok: false, message: "Group not found" });
      }

      const requesterInGroup =
        group.members?.includes(requestedBy) || group.admins?.includes(requestedBy);
      if (!requesterInGroup) {
        return res.status(400).send({ ok: false, message: "Requester is not a member of this group" });
      }

      if (group.bannedMembers?.includes(targetUsername)) {
        return res.send({ ok: false, message: "User is already banned from this group" });
      }

      const targetInGroup =
        group.members?.includes(targetUsername) || group.admins?.includes(targetUsername);
      if (!targetInGroup) {
        return res.status(404).send({ ok: false, message: "Target user is not a member of this group" });
      }

      const targetUser = await db.collection("users").findOne({ username: targetUsername });
      if (!targetUser) {
        return res.status(404).send({ ok: false, message: "Target user not found" });
      }

      const requester = await db.collection("users").findOne({ username: requestedBy });
      if (!requester) {
        return res.status(404).send({ ok: false, message: "Requester not found" });
      }

      const pending = await db.collection("groupBanRequests").findOne({
        groupName,
        targetUsername,
        status: "pending",
      });
      if (pending) {
        return res.send({ ok: false, message: "A pending ban request already exists for this user" });
      }

      const targetIsAdmin = group.admins?.includes(targetUsername);
      const newRequest = {
        groupName,
        targetUsername,
        targetEmail: normalizeEmail(targetUser.email),
        targetRole: targetIsAdmin ? "group-admin" : "user",
        requestedBy,
        requestedByRole: requester.role,
        destination: targetIsAdmin ? "super-admin" : "group-admin",
        status: "pending",
        createdAt: new Date(),
      };

      const result = await db.collection("groupBanRequests").insertOne(newRequest);
      const savedRequest = { _id: result.insertedId, ...newRequest };

      io.emit("group-ban-request-created", savedRequest);
      res.send({ ok: true, message: "Ban request submitted", request: savedRequest });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  app.get("/api/group-ban-requests", async (req, res) => {
    try {
      const filter = {};
      if (req.query.groupName) filter.groupName = req.query.groupName;
      if (req.query.status) filter.status = req.query.status;
      if (req.query.destination) filter.destination = req.query.destination;
      if (req.query.requestedBy) filter.requestedBy = req.query.requestedBy;

      const requests = await db.collection("groupBanRequests").find(filter).toArray();
      res.send(requests);
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  app.patch("/api/group-ban-requests/:id/approve", async (req, res) => {
    try {
      const request = await db.collection("groupBanRequests").findOne({
        _id: new ObjectId(req.params.id),
        status: "pending",
      });

      if (!request) {
        return res.status(404).send({ ok: false, message: "Pending ban request not found" });
      }

      const result = await banFromGroup(request.groupName, request.targetUsername, {
        requireMember: false,
      });
      if (!result.ok) {
        return res.status(result.status).send({ ok: false, message: result.message });
      }

      await db.collection("groupBanRequests").updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: "approved", reviewedAt: new Date() } }
      );

      io.emit("group-ban-request-resolved", {
        requestId: req.params.id,
        status: "approved",
        groupName: request.groupName,
        destination: request.destination,
      });

      res.send({ ok: true, message: result.message });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  app.patch("/api/group-ban-requests/:id/reject", async (req, res) => {
    try {
      const reason = req.body.reason?.trim();
      if (!reason) {
        return res.status(400).send({ ok: false, message: "A rejection reason is required" });
      }

      const request = await db.collection("groupBanRequests").findOne({
        _id: new ObjectId(req.params.id),
        status: "pending",
      });

      if (!request) {
        return res.status(404).send({ ok: false, message: "Pending ban request not found" });
      }

      await db.collection("groupBanRequests").updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: "rejected", rejectionReason: reason, reviewedAt: new Date() } }
      );

      io.emit("group-ban-request-resolved", {
        requestId: req.params.id,
        status: "rejected",
        groupName: request.groupName,
        destination: request.destination,
      });

      res.send({ ok: true, message: "Ban request rejected" });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });
}
