import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost";
const MONGO_PORT = process.env.MONGO_PORT || 27017;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || "chat-app";
const mongo_url = `${MONGO_URL}:${MONGO_PORT}`;

const client = new MongoClient(mongo_url);
let db;

async function connectDB() {
  await client.connect();
  db = client.db(MONGO_DB_NAME);
  return db;
}

function getDB() {
  if (!db) throw new Error("DB not initialized. Call connectDB() first.");
  return db;
}

async function health() {
  try {
    const result = await getDB().command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    return result;
  } catch (err) {
    console.log("Pinged your deployment. It failed, check if MongoDB is running.");
  }
}

async function closeDB() {
  await client.close();
  db = null;
  console.log("Database connection closed");
}

export { connectDB, getDB, health, closeDB, db, client };
