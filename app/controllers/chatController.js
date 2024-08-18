// userController.js
const User = require("../models/user");
const Room = require("../models/room");

exports.sendMessage = async (req, res) => {
  try {
    const { username, roomname, msg } = req.body;

    // Find the user and room
    const user = await User.find({ username: username });
    const room = await Room.find({ name: roomname });
    if (!user || !room) {
      return res.status(404).json({ error: "User or room not found" });
    }
    req.app.io.on("sendMessage", (user, room, msg) => {
      const data = { user: { ...user }, room: { ...room }, message: msg };
      console.log({ user, room, msg, data });
      req.app.io.to(roomname).emit("msgReceived", data);
    });

    
    res.status(200).json({ message: "Message sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
