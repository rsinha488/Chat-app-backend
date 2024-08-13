// userController.js
const User = require("../models/user");
const Room = require("../models/room");

exports.subscribeToRoom = async (req, res) => {
  try {
    const { userId, roomId } = req.body;

    // Find the user and room
    const user = await User.findById(userId);
    const room = await Room.findById(roomId);

    if (!user || !room) {
      return res.status(404).json({ error: "User or room not found" });
    }

    // Subscribe the user to the room
    user.rooms.push(roomId);
    await user.save();

    res.status(200).json({ message: "User subscribed to room successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createUser = async (req, res) => {
  const data = new User({
    name: req.body.name,
    username: req.body.username,
  });

  try {
    const dataToSave = data.save();
    req.app.io.emit("userCreated",data)
    res.status(200).json(dataToSave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};



exports.getUser = async (req, res) => {
  try {
    // const { userId } = req.body;
    // const data = User.findById({userId});
    const data = {
      name:"shivam",
      active: true
    };
    req.app.io.emit("getUser",data)
    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
