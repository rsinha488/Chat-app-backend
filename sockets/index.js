// sockets/index.js
const { Server } = require("socket.io");
const { Chatlistener } = require("./socketListener/Chatlistener");

var socketEvent = {};
let io = false;
function socketIO(server) {
  if (io) return io;
  io = new Server(server, {
    debug: true,
    cors: {
      origin: " * ",
      // origin: "https://shiva2641998.github.io/",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });
  var t;
  io.on("connection", (socket) => {
    socketEvent = socket;
    console.log("A user connected", socket.id);

    // Handle socket events here
    // console.log("tttt",t)
    socket.on("disconnect", () => {
      console.log("A user disconnected", socket.id);
    });
    socket.on("getUser", (s) => console.log("come : ", s));
    socket.on("msgReceived", (data) => {
      console.log({ data });
    });

    Chatlistener(socket, io);
  });

  return io;
}

const getSocket = () => {
  return socketEvent;
};

module.exports = { socketIO, getSocket };
