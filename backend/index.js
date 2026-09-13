import express from "express";
import http from "node:http";
import cors from "cors";
import { Server } from "socket.io";
import { connectDB, health } from "./db.js";
import { authRoutes } from "./routes/authRoutes.js";
import { groupRoutes } from "./routes/groupRoutes.js";
import { roomRoutes } from "./routes/roomRoutes.js";
import { memberRoutes } from "./routes/memberRoutes.js";
import { groupRequestRoutes } from "./routes/groupRequestRoutes.js";
import { requestRoutes } from "./routes/requestRoutes.js";
import { roomRequestRoutes } from "./routes/roomRequestRoutes.js";

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

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);
});

// MongoDB Connection & Route Registration (as taught in Week 8/9 workshops)
async function mongo() {
  try {
    await connectDB();
    await health();

    // Default health check endpoint
    APP.get("/", (_req, res) => res.send({ ok: true }));

    // Mount route modules
    authRoutes(APP);
    groupRoutes(APP);
    roomRoutes(APP);
    memberRoutes(APP);
    groupRequestRoutes(APP, io);
    requestRoutes(APP, io);
    roomRequestRoutes(APP, io);
  } catch (err) {
    console.error("Database connection error:", err);
  }
}

mongo().catch(console.dir);

httpServer.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});

export { APP, httpServer };
