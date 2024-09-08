// roomController.js
const Room = require("../models/room");

exports.createRoom = async (req, res) => {
  try {
    const { name, image, description } = req.body;
    const newRoom = new Room({ name, image, description });
    const savedRoom = await newRoom.save();
    res.status(201).json({ success: true, data: savedRoom });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getRoomsList = async (req, res) => {
  try {
    const roomsList = await Room.find();
    // console.log("Rooms List =",roomsList)
    res.status(200).json({ success: true, data: roomsList });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
