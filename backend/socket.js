import { Server } from "socket.io";

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  })

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });

    socket.on('joinLobby', (lobbyId) => {
      socket.join(lobbyId);
      console.log(`User ${socket.id} joined lobby ${lobbyId}`);
    })

    socket.on('leaveLobby', (lobbyId) => {
      socket.leave(lobbyId);
      console.log(`User ${socket.id} left lobby ${lobbyId}`);
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

