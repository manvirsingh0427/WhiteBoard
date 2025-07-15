const express = require("express");
const app = express();

const server = require("http").createServer(app);
const { Server } = require("socket.io");

const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const io = new Server(server);

// routes
app.get("/", (req, res) => {
  res.send("This is mern realtime board sharing app official server by Manvir Singh");
});

let roomIdGlobal, imgURLGlobal;

io.on("connection", (socket) => {
  socket.on("userJoined", (data) => {
    const { name, userId, roomId, host, presenter } = data;
    roomIdGlobal = roomId;
    socket.join(roomId);
    const users = addUser({
      name,
      userId,
      roomId,
      host,
      presenter,
      socketId: socket.id,
    });
    socket.emit("userIsJoined", { success: true, users });
    console.log({ name, userId });
    socket.broadcast.to(roomId).emit("allUsers", users);
    setTimeout(() => {
      socket.broadcast
        .to(roomId)
        .emit("userJoinedMessageBroadcasted", { name, userId, users });
      socket.broadcast.to(roomId).emit("whiteBoardDataResponse", {
        imgURL: imgURLGlobal,
      });
    }, 1000);
  });

  socket.on("whiteboardData", (data) => {
    imgURLGlobal = data;
    socket.broadcast.to(roomIdGlobal).emit("whiteBoardDataResponse", {
      imgURL: data,
    });
  });

  socket.on("toggleDarkMode", (mode) => {
    socket.broadcast.to(roomIdGlobal).emit("toggleDarkMode", mode);
  });

  socket.on("message", (data) => {
    const { message } = data;
    const user = getUser(socket.id);
    if (user) {
      socket.broadcast
        .to(roomIdGlobal)
        .emit("messageResponse", { message, name: user.name });
    }
  });

  socket.on("draw-text", (textData) => {
    socket.broadcast.to(roomIdGlobal).emit("draw-text", textData);
  });

  socket.on("disconnect", () => {
    const user = getUser(socket.id);
    if (user) {
      removeUser(socket.id);
      const updatedUsers = getUsersInRoom(user.roomId);
      socket.broadcast.to(user.roomId).emit("userLeftMessageBroadcasted", {
        name: user.name,
        userId: user.userId,
        users: updatedUsers,
      });
      io.to(user.roomId).emit("allUsers", updatedUsers);
    }
  });
});

const port = process.env.PORT || 5000;

server.listen(port, () =>
  console.log("server is running on http://localhost:5000")
);
