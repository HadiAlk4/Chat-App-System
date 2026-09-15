import { db } from "./db.js";

export function initChatSockets(io) {
  io.on("connection", (socket) => {
    // Join a specific group room channel
    socket.on("join-room", ({ groupName, roomName, username }) => {
      const channel = `${groupName}:${roomName}`;
      socket.join(channel);
      io.to(channel).emit("user-joined", { username, roomName, time: new Date() });
    });

    // Leave a specific group room channel
    socket.on("leave-room", ({ groupName, roomName, username }) => {
      const channel = `${groupName}:${roomName}`;
      socket.leave(channel);
      io.to(channel).emit("user-left", { username, roomName, time: new Date() });
    });

    // Receive and broadcast message, saving to MongoDB
    socket.on("send-message", async (msgData) => {
      try {
        const { groupName, roomName, senderUserName, content } = msgData;
        if (!content?.trim()) return;

        const newMsg = {
          groupName,
          roomName,
          senderUserName,
          content: content.trim(),
          timestamp: new Date()
        };

        const result = await db.collection("messages").insertOne(newMsg);
        const savedMessage = { _id: result.insertedId, ...newMsg };

        // Broadcast to everyone in the room
        io.to(`${groupName}:${roomName}`).emit("new-message", savedMessage);
      } catch (err) {
        console.error("Failed to save socket message:", err);
      }
    });
  });
}
