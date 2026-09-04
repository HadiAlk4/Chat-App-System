import express from "express";
import http from "node:http";
import cors from "cors";
import { MongoClient } from "mongodb";
import { Server } from "socket.io";
import { testroute } from "./routes.js"; 

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

const URL = "mongodb://localhost:27017";
const client = new MongoClient(URL);
const dbName = "chat-app";

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);
});

async function main() 
{

await client.connect();
console.log("Connected to MongoDB");
const db = client.db(dbName);

testroute(APP, db, io);
httpServer.listen(3000, () => 
{
console.log("Server listening on port: 3000");
});
}

main().catch(console.error);