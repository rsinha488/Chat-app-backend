// sockets/index.js
const socketio = require('socket.io');

var socketEvent = {}

function socketIO(server) {
  const io = socketio(server,{
    cors: {
      origin: "*",
      // origin: "https://shiva2641998.github.io/shadow-chat-bundle", // Frontend URL
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
  });
  var t
   io.on('connection', (socket) => {
    socketEvent = socket
    console.log('A user connected',socket.id);

    // Handle socket events here
    // console.log("tttt",t)
    socket.on('disconnect', () => {
      console.log('A user disconnected',socket.id);
    });
    socket.on("getUser",(s) => console.log("come : ",s))
    socket.on("msgReceived", data=>{
      console.log({data})
    })
  });

  return io;
};

const getSocket = () => {
  return socketEvent
}

module.exports = { socketIO, getSocket}


