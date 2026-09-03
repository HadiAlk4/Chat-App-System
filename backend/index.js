import express from "express";
import http from "node:http";
import cors from "cors";
import { MongoClient } from "mongodb";
import { testroute } from "./routes.js"; 

const APP = express();

APP.use(cors());

APP.use(express.json()); 

const URL = "mongodb://localhost:27017";
const client = new MongoClient(URL);
const dbName = "chat-app";

async function main() 
{

await client.connect();
console.log("Connected to MongoDB");
const db = client.db(dbName);

testroute(APP, db);
const httpServer = http.createServer(APP);
httpServer.listen(3000, () => 
{
console.log("Server listening on port: 3000");
});
}

main().catch(console.error);