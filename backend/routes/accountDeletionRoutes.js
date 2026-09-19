import { ObjectId } from "mongodb";
import { db } from "../db.js";
import { logAudit } from "../audit.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function accountDeletionRoutes(app, io) {
  app.post("/api/account-deletion-requests", async (req, res) => {
    try {
      const { username } = req.body;
      if (!username) {
        return res.send({ ok: false, message: "Username is required" });
      }

      const user = await db.collection("users").findOne({ username });
      if (!user) {
        return res.send({ ok: false, message: "User not found" });
      }

      if (user.role === "super-admin") {
        return res.status(400).send({
          ok: false,
          message: "Super Admin cannot request account deletion",
        });
      }

      const pending = await db.collection("accountDeletionRequests").findOne({
        username,
        status: "pending",
      });
      if (pending) {
        return res.send({ ok: false, message: "Account deletion request already exists" });
      }

      const newRequest = {
        username: user.username,
        email: normalizeEmail(user.email),
        role: user.role,
        status: "pending",
        createdAt: new Date(),
      };

      const result = await db.collection("accountDeletionRequests").insertOne(newRequest);
      const savedRequest = { _id: result.insertedId, ...newRequest };

      io.emit("account-deletion-request-created", savedRequest);
      res.send({ ok: true, message: "Account deletion request submitted", request: savedRequest });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  app.get("/api/account-deletion-requests", async (req, res) => {
    try {
      const filter = {};
      if (req.query.username) filter.username = req.query.username;
      if (req.query.status) filter.status = req.query.status;

      const requests = await db.collection("accountDeletionRequests").find(filter).toArray();
      res.send(requests);
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  app.patch("/api/account-deletion-requests/:id/approve", async (req, res) => {
    try {
      const request = await db.collection("accountDeletionRequests").findOne({
        _id: new ObjectId(req.params.id),
        status: "pending",
      });

      if (!request) {
        return res.status(404).send({ ok: false, message: "Pending account deletion request not found" });
      }

      const targetUser = await db.collection("users").findOne({ username: request.username });
      if (targetUser?.role === "super-admin" || request.role === "super-admin") {
        return res.status(400).send({
          ok: false,
          message: "Super Admin cannot delete or hard-ban themselves",
        });
      }

      const email = normalizeEmail(request.email || targetUser?.email);
      if (email) {
        await db.collection("bannedEmails").updateOne(
          { email },
          {
            $setOnInsert: {
              email,
              username: request.username,
              bannedAt: new Date(),
              reason: "account-deletion",
            },
          },
          { upsert: true }
        );
      }

      if (targetUser) {
        await db.collection("users").deleteOne({ username: request.username });
        await db.collection("groups").updateMany(
          {},
          { $pull: { members: request.username, admins: request.username } }
        );
        await db.collection("messages").deleteMany({ senderUserName: request.username });
      }

      await db.collection("accountDeletionRequests").updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: "approved", reviewedAt: new Date() } }
      );

      try {
        await logAudit(db, {
          actionPerformed: "Accepted Global User Ban",
          target: email || request.username,
          performedBy: req.body.performedBy,
        });
      } catch (err) {
        console.error("Failed to write audit log:", err);
      }

      io.emit("account-deletion-request-resolved", {
        requestId: req.params.id,
        status: "approved",
        username: request.username,
        email,
      });

      res.send({ ok: true, message: "Account deleted and email permanently banned" });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  app.patch("/api/account-deletion-requests/:id/reject", async (req, res) => {
    try {
      const reason = req.body.reason?.trim();
      if (!reason) {
        return res.status(400).send({ ok: false, message: "A rejection reason is required" });
      }

      const request = await db.collection("accountDeletionRequests").findOne({
        _id: new ObjectId(req.params.id),
        status: "pending",
      });

      if (!request) {
        return res.status(404).send({ ok: false, message: "Pending account deletion request not found" });
      }

      await db.collection("accountDeletionRequests").updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: "rejected", rejectionReason: reason, reviewedAt: new Date() } }
      );

      try {
        await logAudit(db, {
          actionPerformed: "Rejected Global User Ban",
          target: request.email || request.username,
          performedBy: req.body.performedBy,
        });
      } catch (err) {
        console.error("Failed to write audit log:", err);
      }

      io.emit("account-deletion-request-resolved", {
        requestId: req.params.id,
        status: "rejected",
      });

      res.send({ ok: true, message: "Account deletion request rejected" });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  app.get("/api/banned-emails", async (_req, res) => {
    try {
      const banned = await db.collection("bannedEmails").find({}).sort({ bannedAt: -1 }).toArray();
      res.send(banned);
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });
}
