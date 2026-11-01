import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import { authRoutes } from "./routes/authRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";
import { groupRoutes } from "./routes/groupRoutes.js";
import { roomRoutes } from "./routes/roomRoutes.js";
import { memberRoutes } from "./routes/memberRoutes.js";
import { groupRequestRoutes } from "./routes/groupRequestRoutes.js";
import { requestRoutes } from "./routes/requestRoutes.js";
import { roomRequestRoutes } from "./routes/roomRequestRoutes.js";
import { chatRoutes } from "./routes/chatRoutes.js";
import { uploadRoutes } from "./routes/uploadRoutes.js";
import { accountDeletionRoutes } from "./routes/accountDeletionRoutes.js";
import { groupBanRequestRoutes } from "./routes/groupBanRequestRoutes.js";
import { groupDeletionRoutes } from "./routes/groupDeletionRoutes.js";
import { auditRoutes } from "./routes/auditRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createIoStub() {
  const sink = { emit() {} };
  return {
    emit() {},
    to() {
      return sink;
    },
    on() {},
  };
}

export function createApp(io = createIoStub()) {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  app.get("/api/health", (_req, res) => res.send({ ok: true }));
  if (!serveFrontend(app)) app.get("/", (_req, res) => res.send({ ok: true }));

  authRoutes(app);
  userRoutes(app);
  groupRoutes(app);
  roomRoutes(app, io);
  memberRoutes(app);
  groupRequestRoutes(app, io);
  requestRoutes(app, io);
  roomRequestRoutes(app, io);
  chatRoutes(app);
  uploadRoutes(app);
  accountDeletionRoutes(app, io);
  groupBanRequestRoutes(app, io);
  groupDeletionRoutes(app, io);
  auditRoutes(app);

  return app;
}

// In production the backend also serves the built Angular app, so the whole
// system runs as one service on one URL. Skipped when no build exists (local dev, tests).
function serveFrontend(app) {
  const browserDir = path.join(__dirname, "..", "frontend", "dist", "frontend", "browser");
  const shell = ["index.csr.html", "index.html"]
    .map((f) => path.join(browserDir, f))
    .find((f) => fs.existsSync(f));
  if (!shell) return false;

  app.use(express.static(browserDir, { index: false, redirect: false }));
  app.get(/^(?!\/(api|uploads|socket\.io)\/).*/, (_req, res) => res.sendFile(shell));
  return true;
}
