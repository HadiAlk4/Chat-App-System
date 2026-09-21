import { db } from "../db.js";

export function memberRoutes(app) {
  // GA: promote a member to group admin
  app.patch("/api/groups/:groupName/members/:username/promote", async (req, res) => {
    try {
      const { groupName, username } = req.params;
      const groupsCollection = db.collection("groups");
      const group = await groupsCollection.findOne({ groupName });

      if (!group) {
        return res.status(404).send({ ok: false, message: "Group not found" });
      }

      const isMember = group.members?.includes(username) || group.admins?.includes(username);
      if (!isMember) {
        return res.status(404).send({ ok: false, message: "Member not found in this group" });
      }

      await groupsCollection.updateOne(
        { groupName },
        { $addToSet: { admins: username } }
      );

      const updatedGroup = await groupsCollection.findOne({ groupName });
      res.send({ ok: true, admins: updatedGroup.admins });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  // GA: remove a member (blocked if they are the sole administrator)
  app.post("/api/groups/:groupName/members/:username/remove", async (req, res) => {
    try {
      const { groupName, username } = req.params;
      const groupsCollection = db.collection("groups");
      const group = await groupsCollection.findOne({ groupName });

      if (!group) {
        return res.status(404).send({ ok: false, message: "Group not found" });
      }

      const isMember = group.members?.includes(username) || group.admins?.includes(username);
      if (!isMember) {
        return res.status(404).send({ ok: false, message: "Member not found in this group" });
      }

      const isSoleAdmin = group.admins?.length === 1 && group.admins[0] === username;
      if (isSoleAdmin) {
        return res.status(400).send({ ok: false, message: "Cannot remove the sole administrator" });
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

      const updatedGroup = await groupsCollection.findOne({ groupName });
      res.send({
        ok: true,
        message: "Member removed",
        members: updatedGroup.members,
        admins: updatedGroup.admins
      });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  // GA: permanently ban a member from this group (no un-ban)
  app.post("/api/groups/:groupName/members/:username/ban", async (req, res) => {
    try {
      const { groupName, username } = req.params;
      const groupsCollection = db.collection("groups");
      const group = await groupsCollection.findOne({ groupName });

      if (!group) {
        return res.status(404).send({ ok: false, message: "Group not found" });
      }

      const isMember = group.members?.includes(username) || group.admins?.includes(username);
      if (!isMember) {
        return res.status(404).send({ ok: false, message: "Member not found in this group" });
      }

      const isSoleAdmin = group.admins?.length === 1 && group.admins[0] === username;
      if (isSoleAdmin) {
        return res.status(400).send({ ok: false, message: "Cannot ban the sole administrator" });
      }

      await groupsCollection.updateOne(
        { groupName },
        {
          $pull: {
            members: username,
            admins: username,
          },
          $addToSet: {
            bannedMembers: username,
          },
        }
      );

      const updatedGroup = await groupsCollection.findOne({ groupName });
      res.send({
        ok: true,
        message: "Member permanently banned from this group",
        members: updatedGroup.members,
        admins: updatedGroup.admins,
        bannedMembers: updatedGroup.bannedMembers || [],
      });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });
}
