import bcrypt from "bcrypt";
import { db } from "../db.js";
import { isValidPassword } from "../lib/passwordPolicy.js";

export function authRoutes(app) {
  // Authenticate user
  app.post("/api/auth", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.send({ ok: false, valid: false, message: "Email and password are required" });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const banned = await db.collection("bannedEmails").findOne({ email: normalizedEmail });
      if (banned) {
        return res.send({
          ok: false,
          valid: false,
          banned: true,
          message: "This account has been permanently banned and can no longer log in",
        });
      }

      const usersCollection = db.collection("users");
      const user = await usersCollection.findOne({ email });

      if (!user) {
        return res.send({ ok: false, valid: false, message: "Invalid Credentials" });
      }

      const passwordMatches = await bcrypt.compare(password, user.password);
      if (!passwordMatches) {
        return res.send({ ok: false, valid: false, message: "Invalid Credentials" });
      }

      const userResponse = { ...user };
      delete userResponse.password;
      res.send({ ok: true, valid: true, message: "Login Successful", user: userResponse });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  // Tell the signup page whether the next account becomes the Super Admin
  app.get("/api/signup/first-user", async (req, res) => {
    try {
      const userCount = await db.collection("users").countDocuments();
      res.send({ ok: true, firstUser: userCount === 0 });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  // Sign up users
  app.post("/api/signup", async (req, res) => {
    try {
      const { username, email, password, dob, age } = req.body;

      if (!username || !email || !password || !dob || !age) {
        return res.send({ ok: false, valid: false, message: "All fields are required" });
      }

      if (!isValidPassword(password)) {
        return res.send({
          ok: false,
          valid: false,
          message: "Password must be at least 8 characters long and contain at least one uppercase letter",
        });
      }

      const usersCollection = db.collection("users");
      const normalizedEmail = String(email).trim().toLowerCase();
      const banned = await db.collection("bannedEmails").findOne({ email: normalizedEmail });
      if (banned) {
        return res.send({
          ok: false,
          valid: false,
          message: "This email is permanently banned",
        });
      }

      const exists = await usersCollection.findOne({ email });
      if (exists) {
        return res.send({ ok: false, valid: false, message: "Email already exists" });
      }

      // Check user count to determine role
      const userCount = await usersCollection.countDocuments();
      const role = userCount === 0 ? "super-admin" : "user";

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const newUser = {
        username,
        email,
        password: hashedPassword,
        dob,
        age,
        role,
        valid: true,
        isDarkMode: false,
        profilePictureUrl: "/pfp.png",
      };

      await usersCollection.insertOne(newUser);

      const userResponse = { ...newUser };
      delete userResponse.password;
      res.send({ ok: true, valid: true, message: "Signup Successful", user: userResponse });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });
}
