import { db } from "../db.js";

export async function banFromGroup(groupName, username, options = {}) {
  const requireMember = options.requireMember !== false;
  const groupsCollection = db.collection("groups");
  const group = await groupsCollection.findOne({ groupName });

  if (!group) {
    return { ok: false, status: 404, message: "Group not found" };
  }

  if (group.bannedMembers?.includes(username)) {
    return {
      ok: true,
      status: 200,
      message: "Member already banned from this group",
      members: group.members,
      admins: group.admins,
      bannedMembers: group.bannedMembers || [],
    };
  }

  const isMember = group.members?.includes(username) || group.admins?.includes(username);
  if (requireMember && !isMember) {
    return { ok: false, status: 404, message: "Member not found in this group" };
  }

  const isSoleAdmin = group.admins?.length === 1 && group.admins[0] === username;
  if (isMember && isSoleAdmin) {
    return { ok: false, status: 400, message: "Cannot ban the sole administrator" };
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
  return {
    ok: true,
    status: 200,
    message: "Member permanently banned from this group",
    members: updatedGroup.members,
    admins: updatedGroup.admins,
    bannedMembers: updatedGroup.bannedMembers || [],
  };
}

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
      const result = await banFromGroup(groupName, username);
      if (!result.ok) {
        return res.status(result.status).send({ ok: false, message: result.message });
      }
      res.send(result);
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });
}
