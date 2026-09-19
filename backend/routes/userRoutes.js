import { db } from "../db.js";

function stripPassword(user) {
  if (!user) return user;
  const userResponse = { ...user };
  delete userResponse.password;
  return userResponse;
}

async function renameUsernameEverywhere(oldUsername, newUsername) {
  await db.collection("groups").updateMany(
    { members: oldUsername },
    { $set: { "members.$[m]": newUsername } },
    { arrayFilters: [{ m: oldUsername }] }
  );
  await db.collection("groups").updateMany(
    { admins: oldUsername },
    { $set: { "admins.$[a]": newUsername } },
    { arrayFilters: [{ a: oldUsername }] }
  );
  await db.collection("messages").updateMany(
    { senderUserName: oldUsername },
    { $set: { senderUserName: newUsername } }
  );
  await db.collection("joinRequests").updateMany(
    { username: oldUsername },
    { $set: { username: newUsername } }
  );
  await db.collection("roomRequests").updateMany(
    { username: oldUsername },
    { $set: { username: newUsername } }
  );
  await db.collection("groupRequests").updateMany(
    { creatorUserName: oldUsername },
    { $set: { creatorUserName: newUsername } }
  );
  await db.collection("accountDeletionRequests").updateMany(
    { username: oldUsername },
    { $set: { username: newUsername } }
  );
}

export function userRoutes(app) {
  app.patch("/api/users/username", async (req, res) => {
    try {
      const { email, newUsername } = req.body;
      const nextUsername = String(newUsername || "").trim();

      if (!email || !nextUsername) {
        return res.send({ ok: false, message: "Email and new username are required" });
      }

      const usersCollection = db.collection("users");
      const user = await usersCollection.findOne({ email });
      if (!user) {
        return res.status(404).send({ ok: false, message: "User not found" });
      }

      if (user.username === nextUsername) {
        return res.send({ ok: true, message: "No change", user: stripPassword(user) });
      }

      const taken = await usersCollection.findOne({ username: nextUsername });
      if (taken) {
        return res.send({ ok: false, message: "Username already taken" });
      }

      const oldUsername = user.username;
      await usersCollection.updateOne({ email }, { $set: { username: nextUsername } });
      await renameUsernameEverywhere(oldUsername, nextUsername);

      const updated = await usersCollection.findOne({ email });
      res.send({
        ok: true,
        message: "Username updated",
        user: stripPassword(updated),
      });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });
}
