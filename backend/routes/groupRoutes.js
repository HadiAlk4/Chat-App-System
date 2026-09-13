import { ObjectId } from "mongodb";
import { db } from "../db.js";

export function groupRoutes(app, io) {
  // get all groups
  app.get("/api/groups", async (req, res) => {
    try {
      const groups = await db.collection("groups").find({}).toArray();
      res.send(groups);
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  // Get groups where the user is either a member or an admin
  app.get("/api/groups/user/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const groups = await db.collection("groups").find({
        $or: [{ members: username }, { admins: username }]
      }).toArray();
      res.send(groups);
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  // Leave group endpoint with sole admin check
  app.post("/api/groups/:groupName/leave", async (req, res) => {
    try {
      const { groupName } = req.params;
      const { username } = req.body;

      if (!username) {
        return res.status(400).send({ ok: false, message: "Username is required" });
      }

      const groupsCollection = db.collection("groups");
      const group = await groupsCollection.findOne({ groupName });

      if (!group) {
        return res.status(404).send({ ok: false, message: "Group not found" });
      }

      // Business rule: Sole admin cannot leave
      const isSoleAdmin = group.admins?.length === 1 && group.admins[0] === username;
      if (isSoleAdmin) {
        return res.status(400).send({ ok: false, message: "Cannot leave group as sole admin" });
      }

      await groupsCollection.updateOne(
        { groupName },
        {
          $pull: {
            members: username,
            admins: username
          }
        }
      );

      res.send({ ok: true, message: "Successfully left group" });
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

  // group proposals
  app.post("/api/group-requests", async (req, res) => {
    try {
      const { groupName, groupDescription, minAge, themeColor, creatorUserName, creatorEmail } = req.body;
      if (!groupName || !groupDescription || !minAge || !themeColor || !creatorUserName || !creatorEmail) {
        return res.send({ ok: false, valid: false, message: "All fields are required" });
      }

      const groupRequestsCollection = db.collection("groupRequests");
      const exists = await groupRequestsCollection.findOne({ groupName });
      if (exists) {
        return res.send({ ok: false, valid: false, message: "Group request already exists" });
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
      });

      await groupRequestsCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: "approved", reviewedAt: new Date() } }
      );

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

      const result = await db.collection("groupRequests").updateOne(
        { _id: new ObjectId(req.params.id), status: "pending" },
        { $set: { status: "rejected", rejectionReason: reason, reviewedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).send({ ok: false, message: "Pending proposal not found" });
      }

      io.emit("group-request-resolved", { requestId: req.params.id, status: "rejected" });
      res.send({ ok: true, message: "Proposal rejected" });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });
}
