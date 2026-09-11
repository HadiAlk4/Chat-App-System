import express from "express";
import http from "node:http";
import cors from "cors";
import { Server } from "socket.io";
import { authRoutes } from "./routes/authRoutes.js";
import { groupRoutes } from "./routes/groupRoutes.js";
import { requestRoutes } from "./routes/requestRoutes.js";
import { connectDB } from "./db.js"; 

const APP = express();
const httpServer = http.createServer(APP);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST", "PATCH"]
  }
});

APP.use(cors());

APP.use(express.json()); 

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);
});

async function main() 
{
await connectDB();
console.log("Connected to MongoDB");

authRoutes(APP);
groupRoutes(APP, io);
requestRoutes(APP, io);
httpServer.listen(3000, () => 
{
console.log("Server listening on port: 3000");
});
}

main().catch(console.error);