// sockets/index.js
const socketio = require('socket.io');

module.exports = function (server) {
  const io = socketio(server,{
    cors: {
      origin: "http://localhost:3000"
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected',socket.id);

    // Handle socket events here

    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
    socket.on("getUser",(s) => console.log("come : ",s))
  });


  return io;
};
