import { Server } from "socket.io";
import cookie from "cookie";
import jwt from "jsonwebtoken";

let io;
const userSocketMap = new Map();

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ["websocket"]
  });

  io.use((socket, next) => {
    const cookies = socket.handshake.headers.cookie;
    const parsed = cookie.parse(cookies || "");

    const token = parsed["token"];
    if (!token) return next(new Error("Authentication error"));

    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = user;
      next();
    } catch (err) {
      console.error(err);
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const username = socket.user?.username;
    if (username) {
      let socketIds = userSocketMap.get(username) || [];

      socketIds.push(socket.id);

      if (socketIds.length > 3) {
        const toDisconnect = socketIds.shift();
        const oldSocket = io.sockets.sockets.get(toDisconnect);
        if (oldSocket) {
          oldSocket.emit(
            "forceDisconnect",
            "This session has been disconnected and will be closed in 3 seconds. Please do not open more than 3 active sessions."
          );
          oldSocket.disconnect(true);
        }
      }

      userSocketMap.set(username, socketIds);
      console.log(`User ${username} connected with socket ${socket.id}`);
    }

    socket.on("disconnect", () => {
      const socketIds = userSocketMap.get(username);
      if (socketIds) {
        userSocketMap.set(
          username,
          socketIds.filter((id) => id !== socket.id)
        );
      }
      console.log(`User ${username} (${socket.id}) disconnected`);
    });

    socket.on("joinLobby", (lobbyId) => {
      socket.join(lobbyId);
      io.to(lobbyId).emit("lobbyJoined", lobbyId);
      console.log(`User ${socket.id} joined lobby ${lobbyId}`);
    });

    socket.on("leaveLobby", (lobbyId) => {
      socket.leave(lobbyId);
      console.log(`User ${socket.id} left lobby ${lobbyId}`);
    });

    socket.on("pingCheck", (func) => {
      func();
    });
  });

  return io;
}

export function getSocketIO() {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initSocket first.");
  }
  return io;
}

export function getUserSocketMap() {
  return userSocketMap;
}
