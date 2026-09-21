import { ObjectId } from "mongodb";
import { db } from "../db.js";
import { logAudit } from "../audit.js";

export function groupDeletionRoutes(app, io) {
  app.post("/api/group-deletion-requests", async (req, res) => {
    try {
      const groupName = String(req.body.groupName || "").trim();
      const requestedBy = String(req.body.requestedBy || "").trim();
      const reason = String(req.body.reason || "").trim();

      if (!groupName || !requestedBy || !reason) {
        return res.send({ ok: false, message: "Group name, requester, and reason are required" });
      }

      const group = await db.collection("groups").findOne({ groupName });
      if (!group) {
        return res.status(404).send({ ok: false, message: "Group not found" });
      }

      if (!group.admins?.includes(requestedBy)) {
        return res.status(400).send({
          ok: false,
          message: "Only a Group Admin can request group deletion",
        });
      }

      const requester = await db.collection("users").findOne({ username: requestedBy });
      if (!requester) {
        return res.status(404).send({ ok: false, message: "Requester not found" });
      }

      const pending = await db.collection("groupDeletionRequests").findOne({
        groupName,
        status: "pending",
      });
      if (pending) {
        return res.send({ ok: false, message: "A pending group deletion request already exists" });
      }

      const newRequest = {
        groupName,
        requestedBy,
        requestedByRole: requester.role,
        reason,
        status: "pending",
        createdAt: new Date(),
      };

      const result = await db.collection("groupDeletionRequests").insertOne(newRequest);
      const savedRequest = { _id: result.insertedId, ...newRequest };

      io.emit("group-deletion-request-created", savedRequest);
      res.send({ ok: true, message: "Group deletion request submitted", request: savedRequest });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  app.get("/api/group-deletion-requests", async (req, res) => {
    try {
      const filter = {};
      if (req.query.groupName) filter.groupName = req.query.groupName;
      if (req.query.requestedBy) filter.requestedBy = req.query.requestedBy;
      if (req.query.status) filter.status = req.query.status;

      const requests = await db.collection("groupDeletionRequests").find(filter).toArray();
      res.send(requests);
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  app.patch("/api/group-deletion-requests/:id/approve", async (req, res) => {
    try {
      const request = await db.collection("groupDeletionRequests").findOne({
        _id: new ObjectId(req.params.id),
        status: "pending",
      });

      if (!request) {
        return res.status(404).send({ ok: false, message: "Pending group deletion request not found" });
      }

      const groupName = request.groupName;
      await db.collection("groups").deleteOne({ groupName });
      await db.collection("messages").deleteMany({ groupName });
      await db.collection("joinRequests").deleteMany({ groupName });
      await db.collection("roomRequests").deleteMany({ groupName });
      await db.collection("groupBanRequests").deleteMany({ groupName });

      const stillAdminElsewhere = await db.collection("groups").findOne({
        admins: request.requestedBy,
      });
      if (!stillAdminElsewhere) {
        const requester = await db.collection("users").findOne({ username: request.requestedBy });
        if (requester && requester.role !== "super-admin") {
          await db.collection("users").updateOne(
            { username: request.requestedBy },
            { $set: { role: "user" } }
          );
        }
      }

      await db.collection("groupDeletionRequests").updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: "approved", reviewedAt: new Date() } }
      );

      try {
        await logAudit(db, {
          actionPerformed: "Accepted Group Deletion",
          target: groupName,
          performedBy: req.body.performedBy,
        });
      } catch (err) {
        console.error("Failed to write audit log:", err);
      }

      io.emit("group-deletion-request-resolved", {
        requestId: req.params.id,
        status: "approved",
        groupName,
      });

      res.send({ ok: true, message: "Group deleted" });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  app.patch("/api/group-deletion-requests/:id/reject", async (req, res) => {
    try {
      const reason = req.body.reason?.trim();
      if (!reason) {
        return res.status(400).send({ ok: false, message: "A rejection reason is required" });
      }

      const request = await db.collection("groupDeletionRequests").findOne({
        _id: new ObjectId(req.params.id),
        status: "pending",
      });

      if (!request) {
        return res.status(404).send({ ok: false, message: "Pending group deletion request not found" });
      }

      await db.collection("groupDeletionRequests").updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: "rejected", rejectionReason: reason, reviewedAt: new Date() } }
      );

      try {
        await logAudit(db, {
          actionPerformed: "Rejected Group Deletion",
          target: request.groupName,
          performedBy: req.body.performedBy,
        });
      } catch (err) {
        console.error("Failed to write audit log:", err);
      }

      io.emit("group-deletion-request-resolved", {
        requestId: req.params.id,
        status: "rejected",
        groupName: request.groupName,
      });

      res.send({ ok: true, message: "Group deletion request rejected" });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });
}
