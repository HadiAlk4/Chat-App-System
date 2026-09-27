import http from "node:http";
import { Server } from "socket.io";
import { connectDB, health } from "./db.js";
import { createApp } from "./app.js";
import { initChatSockets } from "./sockets.js";

const PORT = process.env.PORT || 3000;

const ioProxy = {
  emit(...args) {
    return io.emit(...args);
  },
  to(...args) {
    return io.to(...args);
  },
  on(...args) {
    return io.on(...args);
  },
};

const APP = createApp(ioProxy);
const httpServer = http.createServer(APP);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  },
});

initChatSockets(io);

async function start() {
  try {
    await connectDB();
    await health();
  } catch (err) {
    console.error("Database connection error:", err);
  }

  httpServer.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
  });
}

start();

export { APP, httpServer };
