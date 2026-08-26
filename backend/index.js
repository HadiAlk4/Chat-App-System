import express from "express";
import http from "node:http";
import cors from "cors";
import { testroute } from "./routes.js"; 

const APP = express();

APP.use(cors());

APP.use(express.json()); 

testroute(APP);

const httpServer = http.createServer(APP);

httpServer.listen(3000, () => {
    console.log("Server listening on port: 3000");
});