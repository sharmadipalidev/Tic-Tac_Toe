const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

const rooms = {}; // roomCode => { players: [{ id, name, symbol }] }

function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getUniqueRoomCode() {
  let code = generateRoomCode();
  while (rooms[code]) {
    code = generateRoomCode();
  }
  return code;
}

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create room
  socket.on("create-room", ({ playerName }) => {
    if (!playerName || playerName.trim() === "") {
      socket.emit("room-error", { message: "Name is required to create a room." });
      return;
    }
    
    const roomCode = getUniqueRoomCode();
    rooms[roomCode] = {
      players: [{ id: socket.id, name: playerName, symbol: "X" }]
    };
    
    socket.join(roomCode);
    socket.roomCode = roomCode;
    
    socket.emit("room-created", { roomCode, symbol: "X" });
    console.log(`Room created: ${roomCode} by ${playerName}`);
  });

  // Join room
  socket.on("join-room", ({ roomCode, playerName }) => {
    if (!playerName || playerName.trim() === "") {
      socket.emit("room-error", { message: "Name is required to join a room." });
      return;
    }
    if (!roomCode || roomCode.trim() === "") {
      socket.emit("room-error", { message: "Room code is required." });
      return;
    }

    const uppercaseCode = roomCode.trim().toUpperCase();
    const room = rooms[uppercaseCode];

    if (!room) {
      socket.emit("room-error", { message: "Room code not found!" });
      return;
    }

    if (room.players.length >= 2) {
      socket.emit("room-error", { message: "Room is full!" });
      return;
    }

    // Add player as O
    const hostPlayer = room.players[0];
    room.players.push({ id: socket.id, name: playerName, symbol: "O" });
    
    socket.join(uppercaseCode);
    socket.roomCode = uppercaseCode;

    // Send confirmation to joining player
    socket.emit("room-joined", {
      roomCode: uppercaseCode,
      symbol: "O",
      opponentName: hostPlayer.name
    });

    // Notify the host player
    socket.to(uppercaseCode).emit("player-joined", {
      opponentName: playerName
    });

    console.log(`User ${playerName} joined room ${uppercaseCode}`);
  });

  // Make move
  socket.on("make-move", ({ roomCode, index }) => {
    const uppercaseCode = roomCode ? roomCode.toUpperCase() : null;
    if (uppercaseCode && rooms[uppercaseCode]) {
      // Relay move to other player in room
      socket.to(uppercaseCode).emit("move-made", { index });
    }
  });

  // Reset game
  socket.on("reset-game", ({ roomCode }) => {
    const uppercaseCode = roomCode ? roomCode.toUpperCase() : null;
    if (uppercaseCode && rooms[uppercaseCode]) {
      io.to(uppercaseCode).emit("game-reset");
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    const roomCode = socket.roomCode;
    
    if (roomCode && rooms[roomCode]) {
      // Notify remaining players in the room
      socket.to(roomCode).emit("player-disconnected");
      // Clean up the room
      delete rooms[roomCode];
      console.log(`Room ${roomCode} destroyed due to disconnection`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
