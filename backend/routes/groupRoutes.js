import { db } from "../db.js";
import { isUnderMinAge } from "../lib/ageGate.js";

const THEME_COLORS = new Set(["light", "dark"]);

async function renameGroupEverywhere(oldName, newName) {
  await db.collection("messages").updateMany(
    { groupName: oldName },
    { $set: { groupName: newName } }
  );
  await db.collection("joinRequests").updateMany(
    { groupName: oldName },
    { $set: { groupName: newName } }
  );
  await db.collection("roomRequests").updateMany(
    { groupName: oldName },
    { $set: { groupName: newName } }
  );
  await db.collection("groupRequests").updateMany(
    { groupName: oldName },
    { $set: { groupName: newName } }
  );
  await db.collection("groupBanRequests").updateMany(
    { groupName: oldName },
    { $set: { groupName: newName } }
  );
  await db.collection("groupDeletionRequests").updateMany(
    { groupName: oldName },
    { $set: { groupName: newName } }
  );
}

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

  // GA: update name, description, min age, and theme
  app.patch("/api/groups/:groupName", async (req, res) => {
    try {
      const oldName = req.params.groupName;
      const newName = String(req.body.groupName || "").trim();
      const groupDescription = String(req.body.groupDescription || "").trim();
      const minAge = Number(req.body.minAge);
      const themeColor = String(req.body.themeColor || "").trim().toLowerCase();

      if (!newName || !groupDescription) {
        return res.send({ ok: false, message: "Group name and description are required" });
      }
      if (groupDescription.length > 250) {
        return res.send({ ok: false, message: "Group description must be 250 characters or fewer" });
      }
      if (!Number.isFinite(minAge)) {
        return res.send({ ok: false, message: "Minimum age must be a number" });
      }
      if (!THEME_COLORS.has(themeColor)) {
        return res.send({ ok: false, message: "Theme must be light or dark" });
      }

      const username = String(req.body.username || "").trim();
      if (!username) {
        return res.status(400).send({ ok: false, message: "Username is required" });
      }

      const groupsCollection = db.collection("groups");
      const group = await groupsCollection.findOne({ groupName: oldName });
      if (!group) {
        return res.status(404).send({ ok: false, message: "Group not found" });
      }

      if (!group.admins?.includes(username)) {
        return res.status(403).send({
          ok: false,
          message: "Only a Group Admin can change these settings",
        });
      }

      if (newName !== oldName) {
        const nameTaken = await groupsCollection.findOne({ groupName: newName });
        const pending = await db.collection("groupRequests").findOne({
          groupName: newName,
          status: "pending",
        });
        if (nameTaken || pending) {
          return res.send({ ok: false, message: "Group name already taken" });
        }
      }

      const usernames = [...new Set([...(group.members || []), ...(group.admins || [])])];
      const users = usernames.length
        ? await db.collection("users").find({ username: { $in: usernames } }).toArray()
        : [];
      const tooYoung = users
        .filter((user) => isUnderMinAge(user.age, minAge))
        .map((user) => user.username);
      const tooYoungSet = new Set(tooYoung);
      const remainingAdmins = (group.admins || []).filter((admin) => !tooYoungSet.has(admin));
      if ((group.admins || []).length > 0 && remainingAdmins.length === 0) {
        return res.status(400).send({
          ok: false,
          message: "Cannot raise min age: it would remove the last Group Admin",
        });
      }

      await groupsCollection.updateOne(
        { groupName: oldName },
        {
          $set: {
            groupName: newName,
            groupDescription,
            minAge,
            themeColor,
          },
        }
      );

      if (tooYoung.length) {
        await groupsCollection.updateOne(
          { groupName: newName },
          { $pull: { members: { $in: tooYoung }, admins: { $in: tooYoung } } }
        );
      }

      if (newName !== oldName) {
        await renameGroupEverywhere(oldName, newName);
      }

      const updated = await groupsCollection.findOne({ groupName: newName });
      res.send({ ok: true, message: "Group settings saved", group: updated });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });
}
