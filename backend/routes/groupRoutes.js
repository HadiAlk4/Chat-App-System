import { db } from "../db.js";

export function groupRoutes(app) {
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

  // Get a single group by name
  app.get("/api/groups/:groupName", async (req, res) => {
    try {
      const { groupName } = req.params;
      const group = await db.collection("groups").findOne({ groupName });

      if (!group) {
        return res.status(404).send({ ok: false, message: "Group not found" });
      }

      res.send({ ok: true, group });
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
}
