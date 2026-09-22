import { ObjectId } from "mongodb";
import { db } from "../db.js";
import { logAudit } from "../audit.js";

async function groupNameTaken(name) {
  const groupName = String(name || "").trim();
  const existingGroup = await db.collection("groups").findOne({ groupName });
  const pending = await db.collection("groupRequests").findOne({
    groupName,
    status: "pending",
  });
  return Boolean(existingGroup || pending);
}

export function groupRequestRoutes(app, io) {
  // group proposals
  app.post("/api/group-requests", async (req, res) => {
    try {
      const { groupDescription, minAge, themeColor, creatorUserName, creatorEmail } = req.body;
      const groupName = String(req.body.groupName || "").trim();
      if (!groupName || !groupDescription || !minAge || !themeColor || !creatorUserName || !creatorEmail) {
        return res.send({ ok: false, valid: false, message: "All fields are required" });
      }

      const creator = await db.collection("users").findOne({ username: creatorUserName });
      if (creator?.role === "super-admin") {
        return res.send({ ok: false, message: "Super Admin cannot propose groups" });
      }

      const groupRequestsCollection = db.collection("groupRequests");
      if (await groupNameTaken(groupName)) {
        return res.send({ ok: false, valid: false, message: "Group name already taken" });
      }

      const newRequest = {
        groupName,
        groupDescription,
        minAge,
        themeColor,
        creatorUserName,
        creatorEmail,
        status: "pending",
        createdAt: new Date(),
      };

      const result = await groupRequestsCollection.insertOne(newRequest);
      io.emit("group-request-created", { _id: result.insertedId, ...newRequest });

      res.send({ ok: true, valid: true, message: "Group request submitted successfully" });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  app.get("/api/group-requests", async (req, res) => {
    try {
      const filter = req.query.status ? { status: req.query.status } : {};
      const requests = await db.collection("groupRequests").find(filter).toArray();
      res.send(requests);
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  app.patch("/api/group-requests/:id/approve", async (req, res) => {
    try {
      const groupRequestsCollection = db.collection("groupRequests");
      const request = await groupRequestsCollection.findOne({ _id: new ObjectId(req.params.id), status: "pending" });
      if (!request) {
        return res.send({ ok: false, valid: false, message: "Request not found" });
      }

      const groupsCollection = db.collection("groups");
      const groupExists = await groupsCollection.findOne({ groupName: request.groupName });
      if (groupExists) {
        return res.send({ ok: false, valid: false, message: "Group already exists" });
      }

      await groupsCollection.insertOne({
        groupName: request.groupName,
        groupDescription: request.groupDescription,
        minAge: request.minAge,
        themeColor: request.themeColor,
        admins: [request.creatorUserName],
        members: [request.creatorUserName],
        rooms: ["Main Room"],
        bannedMembers: [],
      });

      await groupRequestsCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: "approved", reviewedAt: new Date() } }
      );

      try {
        await logAudit(db, {
          actionPerformed: "Accepted Group Creation",
          target: request.groupName,
          performedBy: req.body.performedBy,
        });
      } catch (err) {
        console.error("Failed to write audit log:", err);
      }

      io.emit("group-request-resolved", { requestId: req.params.id, status: "approved" });
      res.send({ ok: true, valid: true, message: "Group request approved successfully" });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  app.patch("/api/group-requests/:id/reject", async (req, res) => {
    try {
      const reason = req.body.reason?.trim();
      if (!reason) {
        return res.status(400).send({ ok: false, message: "A rejection reason is required" });
      }

      const request = await db.collection("groupRequests").findOne({
        _id: new ObjectId(req.params.id),
        status: "pending",
      });

      if (!request) {
        return res.status(404).send({ ok: false, message: "Pending proposal not found" });
      }

      await db.collection("groupRequests").updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: "rejected", rejectionReason: reason, reviewedAt: new Date() } }
      );

      try {
        await logAudit(db, {
          actionPerformed: "Rejected Group Creation",
          target: request.groupName,
          performedBy: req.body.performedBy,
        });
      } catch (err) {
        console.error("Failed to write audit log:", err);
      }

      io.emit("group-request-resolved", { requestId: req.params.id, status: "rejected" });
      res.send({ ok: true, message: "Proposal rejected" });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });
}
