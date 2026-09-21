import express from "express";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import { Server } from "socket.io";
import { connectDB, health } from "./db.js";
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
import { auditRoutes } from "./routes/auditRoutes.js";
import { initChatSockets } from "./sockets.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP = express();
const httpServer = http.createServer(APP);
const PORT = process.env.PORT || 3000;

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  },
});

APP.use(cors());
APP.use(express.json());

// Serve static uploaded assets
APP.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Initialize Socket.IO event listeners
initChatSockets(io);

async function mongo() {
  try {
    await connectDB();
    await health();

    APP.get("/", (_req, res) => res.send({ ok: true }));

    // Mount modular routes
    authRoutes(APP);
    userRoutes(APP);
    groupRoutes(APP);
    roomRoutes(APP);
    memberRoutes(APP);
    groupRequestRoutes(APP, io);
    requestRoutes(APP, io);
    roomRequestRoutes(APP, io);
    chatRoutes(APP);
    uploadRoutes(APP);
    accountDeletionRoutes(APP, io);
    groupBanRequestRoutes(APP, io);
    auditRoutes(APP);
  } catch (err) {
    console.error("Database connection error:", err);
  }
}

mongo().catch(console.dir);

httpServer.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});

export { APP, httpServer };
