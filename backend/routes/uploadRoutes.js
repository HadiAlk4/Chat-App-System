import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { db } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads folder exists next to the backend entrypoint
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export function uploadRoutes(app) {
  // 1. Upload User Profile Doodle / Avatar
  app.post("/api/upload/avatar", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send({ ok: false, message: "No image file provided" });
      }

      const { username } = req.body;
      if (!username) {
        return res.status(400).send({ ok: false, message: "Username is required" });
      }

      const profilePictureUrl = `/uploads/${req.file.filename}`;

      const result = await db.collection("users").updateOne(
        { username },
        { $set: { profilePictureUrl } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).send({ ok: false, message: "User not found" });
      }

      res.send({
        ok: true,
        message: "Profile doodle updated successfully",
        profilePictureUrl,
      });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  // 2. Upload Chat Attachment
  app.post("/api/upload/chat", upload.single("image"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send({ ok: false, message: "No image file provided" });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      res.send({ ok: true, fileUrl });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });
}
