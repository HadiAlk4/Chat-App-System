import { ObjectId } from "mongodb";
import { db } from "./db.js";

const roomUsers = new Map();

function getUsernames(channel) {
  const sockets = roomUsers.get(channel);
  if (!sockets) return [];
  return [...new Set(sockets.values())];
}

function addUser(channel, socketId, username) {
  if (!roomUsers.has(channel)) {
    roomUsers.set(channel, new Map());
  }
  roomUsers.get(channel).set(socketId, username);
}

function removeUser(channel, socketId) {
  const sockets = roomUsers.get(channel);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    roomUsers.delete(channel);
  }
}

function emitRoomUsers(io, channel, roomName) {
  io.to(channel).emit("room-users", {
    roomName,
    users: getUsernames(channel),
  });
}

export function initChatSockets(io) {
  io.on("connection", (socket) => {
    socket.on("join-room", ({ groupName, roomName, username }) => {
      if (!groupName || !roomName || !username) return;

      const channel = `${groupName}:${roomName}`;
      socket.join(channel);
      socket.data.channel = channel;
      socket.data.roomName = roomName;
      socket.data.username = username;

      addUser(channel, socket.id, username);
      io.to(channel).emit("user-joined", { username, roomName, time: new Date() });
      emitRoomUsers(io, channel, roomName);
    });

    socket.on("leave-room", ({ groupName, roomName, username }) => {
      if (!groupName || !roomName) return;

      const channel = `${groupName}:${roomName}`;
      socket.leave(channel);
      removeUser(channel, socket.id);

      if (socket.data.channel === channel) {
        socket.data.channel = null;
        socket.data.roomName = null;
      }

      io.to(channel).emit("user-left", { username, roomName, time: new Date() });
      emitRoomUsers(io, channel, roomName);
    });

    socket.on("disconnect", () => {
      const { channel, roomName, username } = socket.data || {};
      if (!channel) return;

      removeUser(channel, socket.id);
      io.to(channel).emit("user-left", { username, roomName, time: new Date() });
      emitRoomUsers(io, channel, roomName);
    });

    socket.on("send-message", async (msgData) => {
      try {
        const { groupName, roomName, senderUserName, content, imageUrl } = msgData;
        if (!content?.trim() && !imageUrl) return;

        const newMsg = {
          groupName,
          roomName,
          senderUserName,
          content: content ? content.trim() : "",
          imageUrl: imageUrl || null,
          timestamp: new Date()
        };

        const result = await db.collection("messages").insertOne(newMsg);
        const savedMessage = { _id: result.insertedId, ...newMsg };

        io.to(`${groupName}:${roomName}`).emit("new-message", savedMessage);
      } catch (err) {
        console.error("Failed to save socket message:", err);
      }
    });

    socket.on("delete-message", async ({ groupName, roomName, messageId }) => {
      try {
        if (!messageId || !groupName || !roomName) return;

        await db.collection("messages").deleteOne({
          _id: new ObjectId(messageId)
        });

        io.to(`${groupName}:${roomName}`).emit("message-deleted", { messageId });
      } catch (err) {
        console.error("Failed to delete socket message:", err);
      }
    });
  });
}
